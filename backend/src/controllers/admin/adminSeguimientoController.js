const pool = require("../../config/database");
const obtenerMomentosEvaluacion = async (req, res) => {
    try {
        const {
            periodo,
            estado,
            id_programa
        } = req.query;

        const valores = [];
        const condiciones = [];

        let contador = 1;

        if (periodo) {
            condiciones.push(`g.periodo = $${contador}`);
            valores.push(periodo);
            contador++;
        }

        if (estado) {
            condiciones.push(`e.estado = $${contador}`);
            valores.push(estado);
            contador++;
        }

        if (id_programa) {
            condiciones.push(`p.id_programa = $${contador}`);
            valores.push(id_programa);
            contador++;
        }

        const where =
            condiciones.length > 0
                ? `WHERE ${condiciones.join(" AND ")}`
                : "";

        const query = `
            SELECT
                e.id_evaluacion,
                e.nombre AS nombre_evaluacion,
                e.estado,
                e.fecha_inicio,
                e.fecha_fin,
                e.puntaje_total,

                me.id_momento_evaluacion,
                me.nombre AS momento_evaluacion,

                s.id_semestre,
                s.nombre AS semestre,

                g.id_grupo,
                g.nombre AS grupo,
                g.codigo_jornada,
                g.jornada,
                g.periodo,

                p.id_programa,
                p.nombre AS programa,

                COUNT(DISTINCT er.id_rap) AS cantidad_rap,

                COALESCE(
                    JSON_AGG(
                        DISTINCT JSONB_BUILD_OBJECT(
                            'id_rap', r.id_rap,
                            'codigo', r.codigo_rap,
                            'nombre', r.nombre,
                            'orden', er.orden
                        )
                    ) FILTER (WHERE r.id_rap IS NOT NULL),
                    '[]'
                ) AS raps

            FROM evaluacion e

            INNER JOIN grupo g
                ON g.id_grupo = e.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre

            INNER JOIN momento_evaluacion me
                ON me.id_momento_evaluacion =
                   e.id_momento_evaluacion

            INNER JOIN programa p
                ON p.id_programa = s.id_programa

            LEFT JOIN evaluacion_rap er
                ON er.id_evaluacion = e.id_evaluacion

            LEFT JOIN rap r
                ON r.id_rap = er.id_rap

            ${where}

            GROUP BY
                e.id_evaluacion,
                e.nombre,
                e.estado,
                e.fecha_inicio,
                e.fecha_fin,
                e.puntaje_total,
                me.id_momento_evaluacion,
                me.nombre,
                s.id_semestre,
                s.nombre,
                g.id_grupo,
                g.nombre,
                g.codigo_jornada,
                g.jornada,
                g.periodo,
                p.id_programa,
                p.nombre

            ORDER BY
                s.id_semestre ASC,
                e.id_evaluacion ASC;
        `;

        const resultado = await pool.query(query, valores);
        const evaluaciones = [];

        for (const evaluacion of resultado.rows) {

            const estadisticasQuery = `
                SELECT
                    COUNT(DISTINCT ug.id_user) AS total_estudiantes,

                    COUNT(
                        DISTINCT CASE
                            WHEN resp.id_respuesta IS NOT NULL
                            THEN ug.id_user
                        END
                    ) AS estudiantes_evaluados,

                    COALESCE(
                        AVG(
                            CASE
                                WHEN resp.id_respuesta IS NOT NULL
                                THEN resp.puntaje
                            END
                        ),
                        0
                    ) AS promedio_respuestas

                FROM usuario_grupo ug

                LEFT JOIN respuesta_ resp
                    ON resp.id_evaluacion = $1

                WHERE
                    ug.id_grupo = $2
                    AND ug.estado = TRUE
            `;

            const estadisticas = await pool.query(
                estadisticasQuery,
                [
                    evaluacion.id_evaluacion,
                    evaluacion.id_grupo
                ]
            );

            const estadistica = estadisticas.rows[0];

            evaluaciones.push({
                ...evaluacion,

                total_estudiantes:
                    Number(estadistica.total_estudiantes || 0),

                estudiantes_evaluados:
                    Number(estadistica.estudiantes_evaluados || 0),

                cobertura:
                    Number(estadistica.total_estudiantes || 0) > 0
                        ? Math.round(
                            (
                                Number(
                                    estadistica.estudiantes_evaluados || 0
                                ) /
                                Number(
                                    estadistica.total_estudiantes || 0
                                )
                            ) * 100
                        )
                        : 0,

                promedio_general:
                    Number(
                        estadistica.promedio_respuestas || 0
                    )
            });
        }

        return res.json({
            success: true,
            data: evaluaciones
        });

    } catch (error) {

        console.error(
            "Error obteniendo momentos de evaluación:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error obteniendo momentos de evaluación"
        });
    }
};

const obtenerResultadosAprendizaje = async (req, res) => {

    try {

        const {
            periodo,
            id_momento_evaluacion,
            id_evaluacion,
            id_rap,
            id_grupo
        } = req.query;

        const valores = [];
        const condiciones = [];

        let contador = 1;

        if (periodo) {
            condiciones.push(`g.periodo = $${contador}`);
            valores.push(periodo);
            contador++;
        }

        if (id_momento_evaluacion) {
            condiciones.push(
                `e.id_momento_evaluacion = $${contador}`
            );
            valores.push(id_momento_evaluacion);
            contador++;
        }

        if (id_evaluacion) {
            condiciones.push(
                `e.id_evaluacion = $${contador}`
            );
            valores.push(id_evaluacion);
            contador++;
        }

        if (id_rap) {
            condiciones.push(
                `er.id_rap = $${contador}`
            );
            valores.push(id_rap);
            contador++;
        }

        if (id_grupo) {
            condiciones.push(
                `g.id_grupo = $${contador}`
            );
            valores.push(id_grupo);
            contador++;
        }

        const where =
            condiciones.length > 0
                ? `WHERE ${condiciones.join(" AND ")}`
                : "";

        const query = `
            SELECT

                r.id_rap,
                r.codigo_rap AS codigo_rap,
                r.nombre AS nombre_rap,

                er.id_evaluacion_rap,

                e.id_evaluacion,
                e.nombre AS evaluacion,

                me.id_momento_evaluacion,
                me.nombre AS momento_evaluacion,

                g.id_grupo,
                g.nombre AS grupo,
                g.codigo_jornada,
                g.jornada,
                g.periodo,

                s.id_semestre,
                s.nombre AS semestre,

                p.id_programa,
                p.nombre AS programa,

                COUNT(DISTINCT ug.id_user)
                    AS total_estudiantes,

                COUNT(
                    DISTINCT CASE
                        WHEN resp.id_respuesta IS NOT NULL
                        THEN ug.id_user
                    END
                ) AS estudiantes_evaluados,

                COALESCE(
                    SUM(resp.puntaje),
                    0
                ) AS puntaje_obtenido

            FROM evaluacion e

            INNER JOIN evaluacion_rap er
                ON er.id_evaluacion = e.id_evaluacion

            INNER JOIN rap r
                ON r.id_rap = er.id_rap

            INNER JOIN grupo g
                ON g.id_grupo = e.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre

            INNER JOIN programa p
                ON p.id_programa = s.id_programa

            INNER JOIN momento_evaluacion me
                ON me.id_momento_evaluacion =
                   e.id_momento_evaluacion

            LEFT JOIN usuario_grupo ug
                ON ug.id_grupo = g.id_grupo
                AND ug.estado = TRUE

            LEFT JOIN pregunta pre
                ON pre.id_evaluacion_rap =
                   er.id_evaluacion_rap

            LEFT JOIN respuesta_ resp
                ON resp.id_pregunta = pre.id_pregunta
                AND resp.id_evaluacion = e.id_evaluacion

            ${where}

            GROUP BY

                r.id_rap,
                r.codigo_rap,
                r.nombre,

                er.id_evaluacion_rap,

                e.id_evaluacion,
                e.nombre,

                me.id_momento_evaluacion,
                me.nombre,

                g.id_grupo,
                g.nombre,
                g.codigo_jornada,
                g.jornada,
                g.periodo,

                s.id_semestre,
                s.nombre,

                p.id_programa,
                p.nombre

            ORDER BY
                s.id_semestre,
                r.codigo_rap;
        `;

        const resultado = await pool.query(
            query,
            valores
        );

        const resultados = resultado.rows.map(row => {

            const totalEstudiantes =
                Number(row.total_estudiantes || 0);

            const estudiantesEvaluados =
                Number(row.estudiantes_evaluados || 0);

            const cobertura =
                totalEstudiantes > 0
                    ? Math.round(
                        (
                            estudiantesEvaluados /
                            totalEstudiantes
                        ) * 100
                    )
                    : 0;

            return {

                ...row,

                total_estudiantes:
                    totalEstudiantes,

                estudiantes_evaluados:
                    estudiantesEvaluados,

                cobertura,
                puntaje_obtenido:
                    Number(row.puntaje_obtenido || 0)
            };
        });

        return res.json({
            success: true,
            data: resultados
        });

    } catch (error) {

        console.error(
            "Error obteniendo resultados de aprendizaje:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error obteniendo resultados de aprendizaje"
        });
    }
};

const obtenerCriteriosRAP = async (req, res) => {

    try {

        const {
            idEvaluacionRap
        } = req.params;

        const query = `
            SELECT

                p.id_pregunta,
                p.tipo_pregunta,
                p.enunciado,
                p.puntaje,

                p.id_criterio_evaluacion,

                ce.id_criterio_evaluacion,
                ce.nombre AS criterio

            FROM pregunta p

            LEFT JOIN criterios_evaluacion ce
                ON ce.id_criterio_evaluacion =
                   p.id_criterio_evaluacion

            WHERE
                p.id_evaluacion_rap = $1

            ORDER BY
                p.id_pregunta ASC;
        `;

        const resultado = await pool.query(
            query,
            [idEvaluacionRap]
        );

        return res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {

        console.error(
            "Error obteniendo criterios del RAP:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error obteniendo criterios del RAP"
        });
    }
};

const obtenerProgramasSeguimiento = async (req, res) => {

    try {

        const query = `
            SELECT
                id_programa,
                nombre
            FROM programa
            ORDER BY nombre ASC;
        `;

        const resultado = await pool.query(query);

        return res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {

        console.error(
            "Error obteniendo programas:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error obteniendo programas"
        });
    }
};
const obtenerMomentosSeguimiento = async (req, res) => {

    try {

        const query = `
            SELECT
                id_momento_evaluacion,
                nombre,
                estado
            FROM momento_evaluacion
            ORDER BY id_momento_evaluacion ASC;
        `;

        const resultado = await pool.query(query);

        return res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {

        console.error(
            "Error obteniendo momentos:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Error obteniendo momentos"
        });
    }
};

module.exports = {
    obtenerMomentosEvaluacion,
    obtenerResultadosAprendizaje,
    obtenerCriteriosRAP,
    obtenerProgramasSeguimiento,
    obtenerMomentosSeguimiento
};