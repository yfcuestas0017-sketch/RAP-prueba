const pool = require("../config/database");
const obtenerGrupos = async () => {

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

    return resultado.rows;
};

const obtenerDocentes = async () => {

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

    return resultado.rows;
};
const obtenerMomentos = async () => {

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

    return resultado.rows;
};

const obtenerRaps = async (
    idSemestre
) => {

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

    return resultado.rows;
};
const obtenerGrupo = async (
    client,
    idGrupo
) => {

    const resultado =
        await client.query(`

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

    return resultado.rows[0] || null;
};
const obtenerDocente = async (
    client,
    idDocente
) => {

    const resultado =
        await client.query(`

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

    return resultado.rows[0] || null;
};

const obtenerMomento = async (
    client,
    idMomento
) => {

    const resultado =
        await client.query(`

        SELECT
            id_momento_evaluacion,
            nombre,
            id_semestre,
            estado

        FROM momento_evaluacion

        WHERE id_momento_evaluacion = $1
          AND estado = TRUE

    `, [idMomento]);

    return resultado.rows[0] || null;
};
const buscarEvaluacionExistente = async (
    client,
    idGrupo,
    idMomento
) => {

    const resultado =
        await client.query(`

        SELECT
            id_evaluacion

        FROM evaluacion

        WHERE id_grupo = $1
          AND id_momento_evaluacion = $2
          AND estado <> 'ELIMINADA'

    `, [
        idGrupo,
        idMomento
    ]);

    return resultado.rows[0] || null;
};

const crearEvaluacion = async (
    client,
    datos
) => {

    const {
        nombre,
        fecha_inicio,
        fecha_fin,
        idGrupo,
        idMomento,
        idDocente
    } = datos;


    const resultado =
        await client.query(`

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


    return resultado.rows[0];
};

const listarEvaluaciones = async () => {

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

            COUNT(
                er.id_evaluacion_rap
            ) AS cantidad_raps

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
            ON er.id_evaluacion =
               e.id_evaluacion

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

    return resultado.rows;
};

const obtenerDocenteActivo = async (
    idDocente
) => {

    const resultado =
        await pool.query(`

        SELECT
            id_user,
            nombre,
            apellido

        FROM usuarios

        WHERE id_user = $1
          AND id_rol = 5
          AND estado = TRUE

    `, [idDocente]);

    return resultado.rows[0] || null;
};

const asignarDocente = async (
    idEvaluacion,
    idDocente
) => {

    const resultado =
        await pool.query(`

        UPDATE evaluacion

        SET id_user = $1

        WHERE id_evaluacion = $2

        RETURNING *

    `, [
        idDocente,
        idEvaluacion
    ]);

    return resultado.rows[0] || null;
};

const obtenerEvaluacion = async (
    idEvaluacion
) => {

    const resultado =
        await pool.query(`

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

    return resultado.rows[0] || null;
};

const obtenerRapsEvaluacion = async (
    idEvaluacion
) => {

    const resultado =
        await pool.query(`

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

        ORDER BY
            er.orden

    `, [idEvaluacion]);

    return resultado.rows;
};
const cambiarEstado = async (
    idEvaluacion,
    estado
) => {

    const resultado =
        await pool.query(`

        UPDATE evaluacion

        SET estado = $1

        WHERE id_evaluacion = $2

        RETURNING *

    `, [
        estado,
        idEvaluacion
    ]);

    return resultado.rows[0] || null;
};


module.exports = {

    obtenerGrupos,
    obtenerDocentes,
    obtenerMomentos,
    obtenerRaps,

    obtenerGrupo,
    obtenerDocente,
    obtenerMomento,

    buscarEvaluacionExistente,
    crearEvaluacion,

    listarEvaluaciones,

    obtenerDocenteActivo,
    asignarDocente,

    obtenerEvaluacion,
    obtenerRapsEvaluacion,

    cambiarEstado

};