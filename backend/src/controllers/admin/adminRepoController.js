const pool = require("../../config/database");
const { enviarReporte } = require("../../utils/reporteExport");

const construirDatos = async (query) => {
    try {
        const {
            programa,
            semestre,
            jornada,
            periodo,
            docente,
            espacio,
            componente
        } = query;

        const condiciones = [];
        const valores = [];

        let parametro = 1;

        if (programa) {
            condiciones.push(
                `s.id_programa = $${parametro}`
            );

            valores.push(Number(programa));
            parametro++;
        }

        if (semestre) {
            condiciones.push(
                `s.numero = $${parametro}`
            );

            valores.push(Number(semestre));
            parametro++;
        }

        if (jornada) {
            condiciones.push(
                `g.jornada = $${parametro}`
            );

            valores.push(jornada);
            parametro++;
        }
        if (periodo) {
            condiciones.push(
                `g.periodo = $${parametro}`
            );

            valores.push(periodo);
            parametro++;
        }

        if (docente) {
            condiciones.push(
                `e.id_user = $${parametro}`
            );

            valores.push(Number(docente));
            parametro++;
        }

        if (espacio) {
            condiciones.push(`
                EXISTS (
                    SELECT 1
                    FROM programa_espacio pe_filtro
                    WHERE pe_filtro.id_programa = p.id_programa
                      AND pe_filtro.id_momento = e.id_momento_evaluacion
                      AND pe_filtro.id_espacio_academico = $${parametro}
                )
            `);

            valores.push(Number(espacio));
            parametro++;
        }

        if (componente) {
            condiciones.push(`
                EXISTS (
                    SELECT 1
                    FROM programa_espacio pe_filtro
                    WHERE pe_filtro.id_programa = p.id_programa
                      AND pe_filtro.id_momento = e.id_momento_evaluacion
                      AND pe_filtro.id_componente = $${parametro}
                )
            `);

            valores.push(Number(componente));
            parametro++;
        }

        const where =
            condiciones.length > 0
                ? `AND ${condiciones.join(" AND ")}`
                : "";

        const estadisticasQuery = `
            SELECT

                COUNT(DISTINCT ug.id_user)
                    AS total_estudiantes,

                COUNT(DISTINCT er.id_user)
                    AS total_evaluados,

                COALESCE(
                    AVG(er.porcentaje),
                    0
                ) AS promedio_global

            FROM usuario_grupo ug

            INNER JOIN grupo g
                ON g.id_grupo = ug.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre

            INNER JOIN programa p
                ON p.id_programa = s.id_programa

            LEFT JOIN evaluacion e
                ON e.id_grupo = g.id_grupo

            LEFT JOIN evaluacion_respuesta er
                ON er.id_evaluacion = e.id_evaluacion
                AND er.id_user = ug.id_user

            WHERE ug.estado = TRUE

            ${where}
        `;

        const estadisticasResult = await pool.query(
            estadisticasQuery,
            valores
        );

        const estadisticasRow =
            estadisticasResult.rows[0];

        const totalEstudiantes =
            Number(
                estadisticasRow.total_estudiantes || 0
            );

        const totalEvaluados =
            Number(
                estadisticasRow.total_evaluados || 0
            );

        const promedioGlobal =
            Number(
                estadisticasRow.promedio_global || 0
            );

        const cobertura =
            totalEstudiantes > 0
                ? (
                    totalEvaluados /
                    totalEstudiantes
                ) * 100
                : 0;

        const nivelesQuery = `
            SELECT

                LOWER(
                    TRIM(c.nombre)
                ) AS nivel,

                COUNT(*) AS cantidad

            FROM evaluacion_respuesta er

            INNER JOIN evaluacion e
                ON e.id_evaluacion =
                   er.id_evaluacion

            INNER JOIN grupo g
                ON g.id_grupo =
                   e.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre =
                   g.id_semestre

            INNER JOIN programa p
                ON p.id_programa =
                   s.id_programa

            INNER JOIN calificacion c
                ON c.id_calificacion =
                   er.id_calificacion

            WHERE 1 = 1

            ${where}

            GROUP BY
                LOWER(TRIM(c.nombre))
        `;

        const nivelesResult = await pool.query(
            nivelesQuery,
            valores
        );

        let totalNiveles = 0;

        nivelesResult.rows.forEach((row) => {
            totalNiveles +=
                Number(row.cantidad || 0);
        });

        const niveles = {
            excelente: 0,
            bueno: 0,
            regular: 0,
            ineficiente: 0
        };

        nivelesResult.rows.forEach((row) => {
            const nombre =
                String(row.nivel || "")
                    .toLowerCase();

            const cantidad =
                Number(row.cantidad || 0);

            const porcentaje =
                totalNiveles > 0
                    ? (
                        cantidad /
                        totalNiveles
                    ) * 100
                    : 0;

            if (nombre.includes("excelente")) {
                niveles.excelente += porcentaje;
            }

            else if (nombre.includes("bueno")) {
                niveles.bueno += porcentaje;
            }

            else if (nombre.includes("regular")) {
                niveles.regular += porcentaje;
            }

            else if (
                nombre.includes("ineficiente") ||
                nombre.includes("insuficiente")
            ) {
                niveles.ineficiente += porcentaje;
            }
        });

        /**
         * ========================================================
         * RESULTADOS POR SEMESTRE
         * ========================================================
         */

        const semestresQuery = `
            SELECT

                s.numero AS semestre,

                COUNT(
                    DISTINCT er.id_evaluacion_respuesta
                ) AS evaluaciones,

                COALESCE(
                    AVG(er.porcentaje),
                    0
                ) AS porcentaje

            FROM semestre s

            INNER JOIN grupo g
                ON g.id_semestre =
                   s.id_semestre

            INNER JOIN programa p
                ON p.id_programa =
                   s.id_programa

            LEFT JOIN evaluacion e
                ON e.id_grupo =
                   g.id_grupo

            LEFT JOIN evaluacion_respuesta er
                ON er.id_evaluacion =
                   e.id_evaluacion

            WHERE 1 = 1

            ${where}

            GROUP BY
                s.numero

            ORDER BY
                s.numero
        `;

        const semestresResult = await pool.query(
            semestresQuery,
            valores
        );

        const semestres =
            semestresResult.rows.map((row) => ({
                semestre:
                    Number(row.semestre),

                evaluaciones:
                    Number(
                        row.evaluaciones || 0
                    ),

                porcentaje:
                    Number(
                        Number(
                            row.porcentaje || 0
                        ).toFixed(2)
                    )
            }));


        const componentesQuery = `
            SELECT

                comp.id_componentes,

                comp.clave,

                comp.nombre
                    AS componente,

                g.id_grupo,

                g.nombre
                    AS grupo,

                g.jornada,

                g.periodo,

                s.numero
                    AS semestre,

                CONCAT(
                    COALESCE(u.nombre, ''),
                    ' ',
                    COALESCE(u.apellido, '')
                ) AS docente,

                COUNT(
                    DISTINCT er.id_user
                ) AS evaluados,

                (
                    SELECT COUNT(*)
                    FROM usuario_grupo ug2
                    WHERE ug2.id_grupo =
                          g.id_grupo
                      AND ug2.estado = TRUE
                ) AS estudiantes,

                COALESCE(
                    AVG(er.porcentaje),
                    0
                ) AS porcentaje,

                COUNT(
                    DISTINCT CASE
                        WHEN LOWER(
                            TRIM(c.nombre)
                        ) LIKE '%excelente%'
                        THEN er.id_user
                    END
                ) AS excelentes,

                COUNT(
                    DISTINCT CASE
                        WHEN LOWER(
                            TRIM(c.nombre)
                        ) LIKE '%bueno%'
                        THEN er.id_user
                    END
                ) AS buenos,

                COUNT(
                    DISTINCT CASE
                        WHEN LOWER(
                            TRIM(c.nombre)
                        ) LIKE '%regular%'
                        THEN er.id_user
                    END
                ) AS regulares,

                COUNT(
                    DISTINCT CASE
                        WHEN LOWER(
                            TRIM(c.nombre)
                        ) LIKE '%ineficiente%'
                        OR LOWER(
                            TRIM(c.nombre)
                        ) LIKE '%insuficiente%'
                        THEN er.id_user
                    END
                ) AS ineficientes

            FROM evaluacion e

            INNER JOIN grupo g
                ON g.id_grupo =
                   e.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre =
                   g.id_semestre

            INNER JOIN programa p
                ON p.id_programa =
                   s.id_programa

            /**
             * Obtenemos una sola relación
             * programa + momento + componente.
             *
             * Así no duplicamos una evaluación
             * porque un componente tenga varios
             * espacios académicos.
             */
            INNER JOIN (
                SELECT DISTINCT
                    id_programa,
                    id_momento,
                    id_componente
                FROM programa_espacio
                WHERE estado = TRUE
            ) pe
                ON pe.id_programa =
                   p.id_programa
                AND pe.id_momento =
                    e.id_momento_evaluacion

            INNER JOIN componentes comp
                ON comp.id_componentes =
                   pe.id_componente

            LEFT JOIN usuarios u
                ON u.id_user =
                   e.id_user

            LEFT JOIN evaluacion_respuesta er
                ON er.id_evaluacion =
                   e.id_evaluacion

            LEFT JOIN calificacion c
                ON c.id_calificacion =
                   er.id_calificacion

            WHERE 1 = 1

            ${where}

            GROUP BY

                comp.id_componentes,
                comp.clave,
                comp.nombre,
                g.id_grupo,
                g.nombre,
                g.jornada,
                g.periodo,
                s.numero,
                u.id_user,
                u.nombre,
                u.apellido

            ORDER BY

                s.numero,

                comp.nombre
        `;

        const componentesResult = await pool.query(
            componentesQuery,
            valores
        );

        const componentes =
            componentesResult.rows.map((row) => {
                const evaluados =
                    Number(
                        row.evaluados || 0
                    );

                const estudiantes =
                    Number(
                        row.estudiantes || 0
                    );

                const porcentaje =
                    Number(
                        Number(
                            row.porcentaje || 0
                        ).toFixed(2)
                    );

                const coberturaComponente =
                    estudiantes > 0
                        ? (
                            evaluados /
                            estudiantes
                        ) * 100
                        : 0;

                let nivel =
                    "Sin resultados";

                if (porcentaje >= 80) {
                    nivel = "Excelente";
                }

                else if (porcentaje >= 70) {
                    nivel = "Bueno";
                }

                else if (porcentaje >= 60) {
                    nivel = "Regular";
                }

                else if (evaluados > 0) {
                    nivel = "Ineficiente";
                }

                return {
                    idComponente:
                        Number(
                            row.id_componentes
                        ),

                    clave:
                        row.clave,

                    componente:
                        row.componente,

                    grupo:
                        row.grupo,

                    jornada:
                        row.jornada,

                    periodo:
                        row.periodo,

                    semestre:
                        Number(
                            row.semestre
                        ),

                    docente:
                        row.docente
                            ?.trim() ||
                        "Sin docente",

                    evaluados,

                    estudiantes,

                    cobertura:
                        Number(
                            coberturaComponente
                                .toFixed(2)
                        ),

                    porcentaje,

                    nivel,

                    niveles: {
                        excelentes:
                            Number(
                                row.excelentes || 0
                            ),

                        buenos:
                            Number(
                                row.buenos || 0
                            ),

                        regulares:
                            Number(
                                row.regulares || 0
                            ),

                        ineficientes:
                            Number(
                                row.ineficientes || 0
                            )
                    }
                };
            });

        return {
            estadisticas: {
                totalEstudiantes,

                totalEvaluados,

                cobertura:
                    Number(
                        cobertura.toFixed(2)
                    ),

                exitoGlobal:
                    Number(
                        promedioGlobal.toFixed(2)
                    )
            },

            niveles: {
                excelente:
                    Number(
                        niveles.excelente.toFixed(2)
                    ),

                bueno:
                    Number(
                        niveles.bueno.toFixed(2)
                    ),

                regular:
                    Number(
                        niveles.regular.toFixed(2)
                    ),

                ineficiente:
                    Number(
                        niveles.ineficiente.toFixed(2)
                    )
            },

            semestres,

            componentes,
            espacios: componentes
        };

    } catch (error) {

        console.error(
            "Error construyendo datos de reportes:",
            error
        );

        throw error;
    }
};

const obtenerReportes = async (req, res) => {
    try {

        const data =
            await construirDatos(
                req.query
            );

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error obteniendo reportes:",
            error
        );

        return res.status(500).json({
            success: false,

            mensaje:
                "Error al obtener los reportes",

            error:
                error.message
        });
    }
};


const exportarReporte = async (req, res) => {

    const formato =
        req.params.formato;

    if (
        !["excel", "pdf"]
            .includes(formato)
    ) {

        return res.status(400).json({
            success: false,

            mensaje:
                "Formato de exportación no válido."
        });
    }

    try {

        const data =
            await construirDatos(
                req.query
            );

        const columnas = [
            "Componente",
            "Clave",
            "Grupo",
            "Jornada",
            "Periodo",
            "Semestre",
            "Docente",
            "Evaluados",
            "Estudiantes",
            "Cobertura (%)",
            "Porcentaje (%)",
            "Nivel Global"
        ];

        /**
         * ========================================================
         * FILAS
         * ========================================================
         */

        const filas =
            data.componentes.map(
                (componente) => [
                    componente.componente,
                    componente.clave,
                    componente.grupo,
                    componente.jornada,
                    componente.periodo,
                    componente.semestre,
                    componente.docente,
                    componente.evaluados,
                    componente.estudiantes,
                    componente.cobertura,
                    componente.porcentaje,
                    componente.nivel
                ]
            );

        return enviarReporte(
            res,
            formato,
            "reporte-rap-consolidado",
            "Reporte Consolidado RAP",
            columnas,
            filas
        );

    } catch (error) {

        console.error(
            "Error exportando reporte:",
            error
        );

        return res.status(500).json({
            success: false,

            mensaje:
                "No fue posible exportar el reporte.",

            error:
                error.message
        });
    }
};

const obtenerFiltros = async (req, res) => {

    try {

        const programas =
            await pool.query(`
                SELECT
                    id_programa,
                    nombre
                FROM programa
                ORDER BY nombre
            `);

        const semestres =
            await pool.query(`
                SELECT
                    id_semestre,
                    numero,
                    nombre,
                    id_programa
                FROM semestre
                ORDER BY numero
            `);
        const grupos =
            await pool.query(`
                SELECT
                    id_grupo,
                    nombre,
                    jornada,
                    periodo,
                    id_semestre
                FROM grupo
                ORDER BY nombre
            `);

        const docentes =
            await pool.query(`
                SELECT
                    id_user,
                    nombre,
                    apellido
                FROM usuarios
                WHERE id_rol = 5
                  AND estado = TRUE
                ORDER BY
                    nombre,
                    apellido
            `);

        const espacios =
            await pool.query(`
                SELECT
                    id_espacio_academico,
                    nombre
                FROM espacio_academico
                ORDER BY nombre
            `);

        const componentes =
            await pool.query(`
                SELECT

                    c.id_componentes,
                    c.clave,
                    c.nombre,
                    me.nombre AS momento
                FROM componentes c

                LEFT JOIN momento_evaluacion me
                    ON me.id_momento_evaluacion =
                       c.id_momento_evaluacion

                ORDER BY
                    c.nombre
            `);

        return res.status(200).json({

            success: true,

            data: {

                programas:
                    programas.rows,

                semestres:
                    semestres.rows,
                grupos:
                    grupos.rows,
                docentes:
                    docentes.rows,
                espacios:
                    espacios.rows,
                componentes:
                    componentes.rows
            }
        });

    } catch (error) {

        console.error(
            "Error obteniendo filtros:",
            error
        );

        return res.status(500).json({

            success: false,

            mensaje:
                "Error al obtener los filtros",

            error:
                error.message
        });
    }
};

module.exports = {
    obtenerReportes,
    obtenerFiltros,
    exportarReporte
};