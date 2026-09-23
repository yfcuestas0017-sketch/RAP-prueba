const pool = require("../../config/database");
const listarEvaluaciones = async (req, res) => {

    try {

        const idDocente =
            req.user.id_user ||
            req.user.id;

        const resultado = await pool.query(`
            SELECT
                e.id_evaluacion,
                e.nombre,
                e.estado,
                e.fecha_inicio,
                e.fecha_fin,
                e.puntaje_total,

                g.id_grupo,
                g.nombre AS grupo,
                g.jornada,
                g.periodo,

                s.id_semestre,
                s.numero AS semestre,

                me.id_momento_evaluacion,
                me.nombre AS momento,

                COUNT(er.id_evaluacion_rap) AS cantidad_raps

            FROM evaluacion e

            INNER JOIN grupo g
                ON g.id_grupo = e.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre

            INNER JOIN momento_evaluacion me
                ON me.id_momento_evaluacion =
                   e.id_momento_evaluacion

            LEFT JOIN evaluacion_rap er
                ON er.id_evaluacion = e.id_evaluacion
                AND er.estado = TRUE

            WHERE e.id_user = $1
              AND e.estado <> 'ELIMINADA'

            GROUP BY
                e.id_evaluacion,
                g.id_grupo,
                s.id_semestre,
                me.id_momento_evaluacion

            ORDER BY e.id_evaluacion DESC
        `, [idDocente]);

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {

        console.error(
            "Error obteniendo evaluaciones del docente:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Error obteniendo evaluaciones"
        });
    }
};

const obtenerEvaluacion = async (req, res) => {

    try {

        const idDocente =
            req.user.id_user ||
            req.user.id;

        const { idEvaluacion } = req.params;

        const evaluacion = await pool.query(`
            SELECT
                e.id_evaluacion,
                e.nombre,
                e.estado,
                e.fecha_inicio,
                e.fecha_fin,
                e.puntaje_total,

                g.id_grupo,
                g.nombre AS grupo,
                g.jornada,
                g.periodo,

                s.id_semestre,
                s.numero AS semestre,

                me.id_momento_evaluacion,
                me.nombre AS momento

            FROM evaluacion e

            INNER JOIN grupo g
                ON g.id_grupo = e.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre

            INNER JOIN momento_evaluacion me
                ON me.id_momento_evaluacion =
                   e.id_momento_evaluacion

            WHERE e.id_evaluacion = $1
              AND e.id_user = $2
        `, [
            idEvaluacion,
            idDocente
        ]);

        if (evaluacion.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "La evaluación no existe o no está asignada a este docente"
            });
        }


        const raps = await pool.query(`
            SELECT
                er.id_evaluacion_rap,
                er.orden,

                r.id_rap,
                r.codigo_rap,
                r.nombre,
                r.descripcion

            FROM evaluacion_rap er

            INNER JOIN rap r
                ON r.id_rap = er.id_rap

            WHERE er.id_evaluacion = $1
              AND er.estado = TRUE

            ORDER BY er.orden
        `, [idEvaluacion]);


        res.json({
            success: true,
            data: {
                evaluacion: evaluacion.rows[0],
                raps: raps.rows
            }
        });

    } catch (error) {

        console.error(
            "Error obteniendo evaluación docente:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Error obteniendo evaluación"
        });
    }
};

const crearPregunta = async (req, res) => {

    const client = await pool.connect();

    try {

        const idDocente =
            req.user.id_user ||
            req.user.id;

        const { idEvaluacionRap } = req.params;

        const {
            tipo_pregunta,
            enunciado,
            puntaje,
            id_criterio,
            opciones
        } = req.body;

        if (
            !tipo_pregunta ||
            !enunciado ||
            !puntaje
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "tipo_pregunta, enunciado y puntaje son obligatorios"
            });
        }


        const tiposPermitidos = [
            "ABIERTA",
            "CERRADA"
        ];

        if (!tiposPermitidos.includes(tipo_pregunta)) {

            return res.status(400).json({
                success: false,
                message:
                    "tipo_pregunta debe ser ABIERTA o CERRADA"
            });
        }


        const evaluacionRap = await client.query(`
            SELECT
                er.id_evaluacion_rap,
                er.id_evaluacion,
                e.id_user,
                e.estado

            FROM evaluacion_rap er

            INNER JOIN evaluacion e
                ON e.id_evaluacion = er.id_evaluacion

            WHERE er.id_evaluacion_rap = $1
              AND e.id_user = $2
              AND er.estado = TRUE
        `, [
            idEvaluacionRap,
            idDocente
        ]);


        if (evaluacionRap.rows.length === 0) {

            return res.status(403).json({
                success: false,
                message:
                    "Este RAP no pertenece a una evaluación asignada al docente"
            });
        }

        if (
            evaluacionRap.rows[0].estado === "CERRADA"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "No puede modificar una evaluación cerrada"
            });
        }


        await client.query("BEGIN");

        const pregunta = await client.query(`
            INSERT INTO pregunta (
                tipo_pregunta,
                enunciado,
                puntaje,
                id_evaluacion_rap,
                id_criterio_evaluacion
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5
            )
            RETURNING *
        `, [
            tipo_pregunta,
            enunciado,
            puntaje,
            idEvaluacionRap,
            id_criterio || null
        ]);


        const idPregunta =
            pregunta.rows[0].id_pregunta;

        if (tipo_pregunta === "CERRADA") {

            if (
                !Array.isArray(opciones) ||
                opciones.length < 2
            ) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Una pregunta cerrada debe tener mínimo 2 opciones"
                });
            }


            const correctas =
                opciones.filter(
                    opcion => opcion.correcta === true
                );


            if (correctas.length !== 1) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        "Una pregunta cerrada debe tener exactamente una opción correcta"
                });
            }


            for (const opcion of opciones) {

                if (!opcion.texto) {

                    await client.query("ROLLBACK");

                    return res.status(400).json({
                        success: false,
                        message:
                            "Todas las opciones deben tener texto"
                    });
                }


                await client.query(`
                    INSERT INTO opcion_pregunta (
                        texto,
                        eleccion_boolean,
                        id_pregunta
                    )
                    VALUES (
                        $1,
                        $2,
                        $3
                    )
                `, [
                    opcion.texto,
                    opcion.correcta === true,
                    idPregunta
                ]);
            }
        }


        await client.query("COMMIT");
        await pool.query(`
            UPDATE evaluacion
            SET puntaje_total = (
                SELECT COALESCE(SUM(p.puntaje), 0)
                FROM pregunta p
                INNER JOIN evaluacion_rap er
                    ON er.id_evaluacion_rap =
                       p.id_evaluacion_rap
                WHERE er.id_evaluacion =
                      evaluacion.id_evaluacion
                  AND er.estado = TRUE
            )
            WHERE id_evaluacion = $1
        `, [
            evaluacionRap.rows[0].id_evaluacion
        ]);


        res.status(201).json({
            success: true,
            message: "Pregunta creada correctamente",
            data: pregunta.rows[0]
        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "Error creando pregunta:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Error creando pregunta",
            error: error.message
        });

    } finally {

        client.release();
    }
};

const listarPreguntas = async (req, res) => {

    try {

        const idDocente =
            req.user.id_user ||
            req.user.id;

        const { idEvaluacionRap } = req.params;


        /*
        Verificar propiedad
        */

        const pertenece = await pool.query(`
            SELECT er.id_evaluacion_rap
            FROM evaluacion_rap er
            INNER JOIN evaluacion e
                ON e.id_evaluacion = er.id_evaluacion
            WHERE er.id_evaluacion_rap = $1
              AND e.id_user = $2
        `, [
            idEvaluacionRap,
            idDocente
        ]);


        if (pertenece.rows.length === 0) {

            return res.status(403).json({
                success: false,
                message:
                    "No tiene acceso a este RAP"
            });
        }


        const preguntas = await pool.query(`
            SELECT
                p.id_pregunta,
                p.tipo_pregunta,
                p.enunciado,
                p.puntaje,
                p.id_criterio_evaluacion

            FROM pregunta p

            WHERE p.id_evaluacion_rap = $1

            ORDER BY p.id_pregunta
        `, [
            idEvaluacionRap
        ]);

        for (const pregunta of preguntas.rows) {

            if (
                pregunta.tipo_pregunta === "CERRADA"
            ) {

                const opciones = await pool.query(`
                    SELECT
                        id_opcion_pregunta,
                        texto,
                        eleccion_boolean
                    FROM opcion_pregunta
                    WHERE id_pregunta = $1
                    ORDER BY id_opcion_pregunta
                `, [
                    pregunta.id_pregunta
                ]);

                pregunta.opciones =
                    opciones.rows;
            } else {

                pregunta.opciones = [];
            }
        }


        res.json({
            success: true,
            data: preguntas.rows
        });

    } catch (error) {

        console.error(
            "Error listando preguntas:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Error listando preguntas"
        });
    }
};

const eliminarPregunta = async (req, res) => {

    const client = await pool.connect();

    try {

        const idDocente =
            req.user.id_user ||
            req.user.id;

        const { idPregunta } = req.params;


        const pregunta = await client.query(`
            SELECT
                p.id_pregunta,
                er.id_evaluacion,
                e.id_user,
                e.estado

            FROM pregunta p

            INNER JOIN evaluacion_rap er
                ON er.id_evaluacion_rap =
                   p.id_evaluacion_rap

            INNER JOIN evaluacion e
                ON e.id_evaluacion =
                   er.id_evaluacion

            WHERE p.id_pregunta = $1
              AND e.id_user = $2
        `, [
            idPregunta,
            idDocente
        ]);


        if (pregunta.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "Pregunta no encontrada"
            });
        }


        if (
            pregunta.rows[0].estado === "CERRADA"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "No puede eliminar preguntas de una evaluación cerrada"
            });
        }


        await client.query("BEGIN");


        await client.query(`
            DELETE FROM opcion_pregunta
            WHERE id_pregunta = $1
        `, [
            idPregunta
        ]);


        await client.query(`
            DELETE FROM pregunta
            WHERE id_pregunta = $1
        `, [
            idPregunta
        ]);


        await client.query("COMMIT");


        res.json({
            success: true,
            message:
                "Pregunta eliminada correctamente"
        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.error(
            "Error eliminando pregunta:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Error eliminando pregunta"
        });

    } finally {

        client.release();
    }
};


module.exports = {
    listarEvaluaciones,
    obtenerEvaluacion,
    crearPregunta,
    listarPreguntas,
    eliminarPregunta
};