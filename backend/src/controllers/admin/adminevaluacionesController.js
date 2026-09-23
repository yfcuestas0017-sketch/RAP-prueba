const pool = require("../../config/database");
const obtenerGrupos = async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                g.id_grupo,
                g.nombre,
                g.jornada,
                g.periodo,
                g.codigo_jornada,
                s.id_semestre,
                s.numero AS semestre
            FROM grupo g
            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre
            ORDER BY
                s.numero,
                g.nombre
        `);

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {

        console.error("Error obteniendo grupos:", error);

        res.status(500).json({
            success: false,
            message: "Error obteniendo grupos"
        });
    }
};

const obtenerDocentes = async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                u.id_user,
                u.id_user_institucional,
                u.nombre,
                u.apellido,
                u.correo,
                u.estado
            FROM usuarios u
            WHERE u.id_rol = 5
              AND u.estado = TRUE
            ORDER BY
                u.apellido,
                u.nombre
        `);

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {

        console.error("Error obteniendo docentes:", error);

        res.status(500).json({
            success: false,
            message: "Error obteniendo docentes"
        });
    }
};

const obtenerMomentos = async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT
                me.id_momento_evaluacion,
                me.nombre,
                me.estado,
                s.id_semestre,
                s.numero AS semestre
            FROM momento_evaluacion me
            INNER JOIN semestre s
                ON s.id_semestre = me.id_semestre
            WHERE me.estado = TRUE
            ORDER BY
                s.numero,
                me.id_momento_evaluacion
        `);

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {

        console.error("Error obteniendo momentos:", error);

        res.status(500).json({
            success: false,
            message: "Error obteniendo momentos de evaluación"
        });
    }
};

const obtenerRaps = async (req, res) => {

    const { idSemestre } = req.params;

    try {

        const resultado = await pool.query(`
            SELECT DISTINCT
                r.id_rap,
                r.codigo_rap,
                r.nombre,
                r.descripcion,
                r.orden,
                r.estado
            FROM rap r

            INNER JOIN programa_espacio pe
                ON pe.id_rap = r.id_rap

            INNER JOIN momento_evaluacion me
                ON me.id_momento_evaluacion = pe.id_momento

            WHERE me.id_semestre = $1
              AND r.estado = TRUE

            ORDER BY
                r.orden,
                r.id_rap
        `, [idSemestre]);

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {

        console.error("Error obteniendo RAPs:", error);

        res.status(500).json({
            success: false,
            message: "Error obteniendo RAPs"
        });
    }
};

const crearEvaluacion = async (req, res) => {

    const client = await pool.connect();

    try {

        const {
            nombre,
            fecha_inicio,
            fecha_fin,
            id_grupo,
            id_momento_evaluacion,
            id_docente
        } = req.body;

        if (
            !nombre ||
            !id_grupo ||
            !id_momento_evaluacion ||
            !id_docente
        ) {
            return res.status(400).json({
                success: false,
                message: "Nombre, grupo, momento y docente son obligatorios"
            });
        }

        const idGrupo = Number(id_grupo);
        const idMomento = Number(id_momento_evaluacion);
        const idDocente = Number(id_docente);

        await client.query("BEGIN");

        const grupo = await client.query(`
            SELECT
                g.id_grupo,
                g.nombre,
                g.id_semestre,
                s.numero AS semestre
            FROM grupo g
            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre
            WHERE g.id_grupo = $1
        `, [idGrupo]);

        if (grupo.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "El grupo no existe"
            });
        }

        const docente = await client.query(`
            SELECT
                id_user,
                nombre,
                apellido,
                id_rol,
                estado
            FROM usuarios
            WHERE id_user = $1
              AND id_rol = 5
              AND estado = TRUE
        `, [idDocente]);

        if (docente.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "El docente no existe o no está activo"
            });
        }

        const momento = await client.query(`
            SELECT
                id_momento_evaluacion,
                nombre,
                id_semestre,
                estado
            FROM momento_evaluacion
            WHERE id_momento_evaluacion = $1
              AND estado = TRUE
        `, [idMomento]);

        if (momento.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "El momento de evaluación no existe"
            });
        }

        if (
            Number(momento.rows[0].id_semestre) !==
            Number(grupo.rows[0].id_semestre)
        ) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    "El momento de evaluación no corresponde al semestre del grupo"
            });
        }

        const existente = await client.query(`
            SELECT id_evaluacion
            FROM evaluacion
            WHERE id_grupo = $1
              AND id_momento_evaluacion = $2
              AND estado <> 'ELIMINADA'
        `, [
            idGrupo,
            idMomento
        ]);

        if (existente.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message:
                    "Ya existe una evaluación para este grupo y momento",
                id_evaluacion:
                    existente.rows[0].id_evaluacion
            });
        }

        const nueva = await client.query(`
            INSERT INTO evaluacion (
                nombre,
                estado,
                fecha_inicio,
                fecha_fin,
                puntaje_total,
                id_grupo,
                id_momento_evaluacion,
                id_user
            )
            VALUES (
                $1,
                'BORRADOR',
                $2,
                $3,
                0,
                $4,
                $5,
                $6
            )
            RETURNING *
        `, [
            nombre,
            fecha_inicio || null,
            fecha_fin || null,
            idGrupo,
            idMomento,
            idDocente
        ]);

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Evaluación creada correctamente",
            data: nueva.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Error creando evaluación:", error);

        res.status(500).json({
            success: false,
            message: "Error creando evaluación",
            error: error.message
        });

    } finally {

        client.release();
    }
};

const listarEvaluaciones = async (req, res) => {

    try {

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

                u.id_user AS id_docente,
                u.nombre AS docente_nombre,
                u.apellido AS docente_apellido,

                COUNT(er.id_evaluacion_rap) AS cantidad_raps

            FROM evaluacion e

            INNER JOIN grupo g
                ON g.id_grupo = e.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre

            INNER JOIN momento_evaluacion me
                ON me.id_momento_evaluacion =
                   e.id_momento_evaluacion

            LEFT JOIN usuarios u
                ON u.id_user = e.id_user

            LEFT JOIN evaluacion_rap er
                ON er.id_evaluacion = e.id_evaluacion

            WHERE e.estado <> 'ELIMINADA'

            GROUP BY
                e.id_evaluacion,
                g.id_grupo,
                s.id_semestre,
                me.id_momento_evaluacion,
                u.id_user

            ORDER BY
                e.id_evaluacion DESC
        `);

        res.json({
            success: true,
            data: resultado.rows
        });

    } catch (error) {

        console.error("Error listando evaluaciones:", error);

        res.status(500).json({
            success: false,
            message: "Error listando evaluaciones"
        });
    }
};

const asignarDocente = async (req, res) => {

    const { idEvaluacion } = req.params;
    const { id_docente } = req.body;

    try {

        if (!id_docente) {

            return res.status(400).json({
                success: false,
                message: "Debe enviar id_docente"
            });
        }

        /*
        Verificar docente
        */

        const docente = await pool.query(`
            SELECT
                id_user,
                nombre,
                apellido
            FROM usuarios
            WHERE id_user = $1
              AND id_rol = 5
              AND estado = TRUE
        `, [id_docente]);

        if (docente.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Docente no encontrado"
            });
        }

        const resultado = await pool.query(`
            UPDATE evaluacion
            SET id_user = $1
            WHERE id_evaluacion = $2
            RETURNING *
        `, [
            id_docente,
            idEvaluacion
        ]);

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Evaluación no encontrada"
            });
        }

        res.json({
            success: true,
            message: "Docente asignado correctamente",
            data: resultado.rows[0]
        });

    } catch (error) {

        console.error("Error asignando docente:", error);

        res.status(500).json({
            success: false,
            message: "Error asignando docente"
        });
    }
};

const agregarRap = async (req, res) => {

    const client = await pool.connect();

    try {

        const { idEvaluacion } = req.params;
        const { id_rap, orden } = req.body;

        if (!id_rap) {

            return res.status(400).json({
                success: false,
                message: "Debe enviar id_rap"
            });
        }

        await client.query("BEGIN");

        const evaluacion = await client.query(`
            SELECT
                e.id_evaluacion,
                e.id_grupo,
                g.id_semestre
            FROM evaluacion e
            INNER JOIN grupo g
                ON g.id_grupo = e.id_grupo
            WHERE e.id_evaluacion = $1
              AND e.estado <> 'ELIMINADA'
        `, [idEvaluacion]);

        if (evaluacion.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Evaluación no encontrada"
            });
        }

        const idSemestre = evaluacion.rows[0].id_semestre;

        const rap = await client.query(`
            SELECT DISTINCT
                r.id_rap,
                r.codigo_rap,
                r.nombre
            FROM rap r
            INNER JOIN programa_espacio pe
                ON pe.id_rap = r.id_rap
            INNER JOIN momento_evaluacion me
                ON me.id_momento_evaluacion = pe.id_momento
            WHERE r.id_rap = $1
              AND me.id_semestre = $2
              AND r.estado = TRUE
        `, [
            id_rap,
            idSemestre
        ]);

        if (rap.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    "El RAP no pertenece al semestre de la evaluación"
            });
        }

        const existe = await client.query(`
            SELECT id_evaluacion_rap
            FROM evaluacion_rap
            WHERE id_evaluacion = $1
              AND id_rap = $2
        `, [
            idEvaluacion,
            id_rap
        ]);

        if (existe.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Este RAP ya está agregado a la evaluación"
            });
        }

        let nuevoOrden = orden;

        if (!nuevoOrden) {

            const maxOrden = await client.query(`
                SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente
                FROM evaluacion_rap
                WHERE id_evaluacion = $1
            `, [idEvaluacion]);

            nuevoOrden = maxOrden.rows[0].siguiente;
        }

        const resultado = await client.query(`
            INSERT INTO evaluacion_rap (
                id_evaluacion,
                id_rap,
                orden,
                estado
            )
            VALUES (
                $1,
                $2,
                $3,
                TRUE
            )
            RETURNING *
        `, [
            idEvaluacion,
            id_rap,
            nuevoOrden
        ]);

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "RAP agregado correctamente",
            data: resultado.rows[0]
        });

    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Error agregando RAP:", error);

        res.status(500).json({
            success: false,
            message: "Error agregando RAP",
            error: error.message
        });

    } finally {

        client.release();
    }
};

const obtenerEvaluacion = async (req, res) => {

    const { idEvaluacion } = req.params;

    try {

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
                me.nombre AS momento,

                u.id_user AS id_docente,
                u.nombre AS docente_nombre,
                u.apellido AS docente_apellido,
                u.correo AS docente_correo

            FROM evaluacion e

            INNER JOIN grupo g
                ON g.id_grupo = e.id_grupo

            INNER JOIN semestre s
                ON s.id_semestre = g.id_semestre

            INNER JOIN momento_evaluacion me
                ON me.id_momento_evaluacion =
                   e.id_momento_evaluacion

            LEFT JOIN usuarios u
                ON u.id_user = e.id_user

            WHERE e.id_evaluacion = $1
        `, [idEvaluacion]);

        if (evaluacion.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Evaluación no encontrada"
            });
        }

        const raps = await pool.query(`
            SELECT
                er.id_evaluacion_rap,
                er.orden,
                er.estado,
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

        console.error("Error obteniendo evaluación:", error);

        res.status(500).json({
            success: false,
            message: "Error obteniendo evaluación"
        });
    }
};

const cambiarEstado = async (req, res) => {

    const { idEvaluacion } = req.params;
    const { estado } = req.body;

    const estadosPermitidos = [
        "BORRADOR",
        "ACTIVA",
        "CERRADA",
        "ELIMINADA"
    ];

    if (!estadosPermitidos.includes(estado)) {

        return res.status(400).json({
            success: false,
            message:
                "Estado inválido. Use BORRADOR, ACTIVA, CERRADA o ELIMINADA"
        });
    }

    try {

        const resultado = await pool.query(`
            UPDATE evaluacion
            SET estado = $1
            WHERE id_evaluacion = $2
            RETURNING *
        `, [
            estado,
            idEvaluacion
        ]);

        if (resultado.rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Evaluación no encontrada"
            });
        }

        res.json({
            success: true,
            message: "Estado actualizado correctamente",
            data: resultado.rows[0]
        });

    } catch (error) {

        console.error("Error cambiando estado:", error);

        res.status(500).json({
            success: false,
            message: "Error cambiando estado"
        });
    }
};


module.exports = {
    obtenerGrupos,
    obtenerDocentes,
    obtenerMomentos,
    obtenerRaps,
    crearEvaluacion,
    listarEvaluaciones,
    asignarDocente,
    agregarRap,
    obtenerEvaluacion,
    cambiarEstado
};