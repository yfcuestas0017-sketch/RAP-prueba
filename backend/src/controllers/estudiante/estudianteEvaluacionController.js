const pool = require("../../config/database");
const listarEvaluaciones = async (req, res) => {

    try {

        const idEstudiante =
            req.user.id_user ||
            req.user.id;

        const estudiante = await pool.query(`
            SELECT
                ug.id_user,
                ug.id_grupo,
                g.nombre AS grupo,
                g.id_semestre,
                s.numero AS semestre
            FROM usuario_grupo ug

            INNER JOIN grupo g
                ON g.id_grupo = ug.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre

            WHERE ug.id_user = $1
              AND ug.estado = TRUE
        `, [
            idEstudiante
        ]);


        if (estudiante.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "El estudiante no tiene un grupo académico activo"
            });
        }

        const evaluaciones = await pool.query(`
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

            WHERE e.id_grupo = $1
              AND e.estado = 'ACTIVA'

            ORDER BY
                e.id_evaluacion DESC
        `, [
            estudiante.rows[0].id_grupo
        ]);


        res.json({
            success: true,

            estudiante: {
                id_user: idEstudiante,
                id_grupo: estudiante.rows[0].id_grupo,
                grupo: estudiante.rows[0].grupo,
                id_semestre: estudiante.rows[0].id_semestre,
                semestre: estudiante.rows[0].semestre
            },

            evaluaciones: evaluaciones.rows
        });


    } catch (error) {

        console.error(
            "Error listando evaluaciones del estudiante:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Error obteniendo evaluaciones"
        });
    }
};

const obtenerEvaluacion = async (req, res) => {

    try {

        const idEstudiante =
            req.user.id_user ||
            req.user.id;

        const { idEvaluacion } = req.params;
        const estudiante = await pool.query(`
            SELECT
                ug.id_user,
                ug.id_grupo,
                g.nombre AS grupo,
                g.id_semestre,
                s.numero AS semestre

            FROM usuario_grupo ug

            INNER JOIN grupo g
                ON g.id_grupo = ug.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre

            WHERE ug.id_user = $1
              AND ug.estado = TRUE
        `, [
            idEstudiante
        ]);


        if (estudiante.rows.length === 0) {

            return res.status(403).json({
                success: false,
                message:
                    "El estudiante no pertenece a ningún grupo activo"
            });
        }


        const grupoEstudiante =
            estudiante.rows[0];
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
        `, [
            idEvaluacion
        ]);


        if (evaluacion.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message:
                    "La evaluación no existe"
            });
        }


        const evaluacionData =
            evaluacion.rows[0];
        if (
            Number(grupoEstudiante.id_grupo) !==
            Number(evaluacionData.id_grupo)
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "No puede realizar esta evaluación porque no pertenece al grupo asignado"
            });
        }

        if (
            Number(grupoEstudiante.id_semestre) !==
            Number(evaluacionData.id_semestre)
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "No puede realizar esta evaluación porque no pertenece al semestre correspondiente"
            });
        }

        if (evaluacionData.estado !== "ACTIVA") {

            return res.status(403).json({
                success: false,
                message:
                    "Esta evaluación no está disponible actualmente"
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
        `, [
            idEvaluacion
        ]);

        for (const rap of raps.rows) {

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
                rap.id_evaluacion_rap
            ]);


            rap.preguntas = preguntas.rows;
            for (const pregunta of rap.preguntas) {

                if (
                    pregunta.tipo_pregunta === "CERRADA"
                ) {

                    const opciones = await pool.query(`
                        SELECT
                            id_opcion_pregunta,
                            texto

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
        }

        res.json({
            success: true,

            estudiante: {
                id_user: idEstudiante,
                id_grupo:
                    grupoEstudiante.id_grupo,
                grupo:
                    grupoEstudiante.grupo,
                id_semestre:
                    grupoEstudiante.id_semestre,
                semestre:
                    grupoEstudiante.semestre
            },

            evaluacion: evaluacionData,

            raps: raps.rows
        });


    } catch (error) {

        console.error(
            "Error obteniendo evaluación del estudiante:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Error obteniendo evaluación",
            error: error.message
        });
    }
};


module.exports = {
    listarEvaluaciones,
    obtenerEvaluacion
};