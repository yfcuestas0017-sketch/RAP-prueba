const obtenerEvaluacionConSemestre = async (
    client,
    idEvaluacion
) => {

    const resultado =
        await client.query(`

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


    return resultado.rows[0] || null;
};

const obtenerRapValido = async (
    client,
    idRap,
    idSemestre
) => {

    const resultado =
        await client.query(`

        SELECT DISTINCT
            r.id_rap,
            r.codigo_rap,
            r.nombre

        FROM rap r

        INNER JOIN programa_espacio pe
            ON pe.id_rap = r.id_rap

        INNER JOIN momento_evaluacion me
            ON me.id_momento_evaluacion =
               pe.id_momento

        WHERE r.id_rap = $1
          AND me.id_semestre = $2
          AND r.estado = TRUE

    `, [
        idRap,
        idSemestre
    ]);


    return resultado.rows[0] || null;
};

const buscarRapEnEvaluacion = async (
    client,
    idEvaluacion,
    idRap
) => {

    const resultado =
        await client.query(`

        SELECT
            id_evaluacion_rap

        FROM evaluacion_rap

        WHERE id_evaluacion = $1
          AND id_rap = $2

    `, [
        idEvaluacion,
        idRap
    ]);


    return resultado.rows[0] || null;
};

const obtenerSiguienteOrden = async (
    client,
    idEvaluacion
) => {

    const resultado =
        await client.query(`

        SELECT
            COALESCE(
                MAX(
                    NULLIF(
                        orden,
                        ''
                    )::integer
                ),
                0
            ) + 1 AS siguiente

        FROM evaluacion_rap

        WHERE id_evaluacion = $1

    `, [idEvaluacion]);


    return resultado.rows[0].siguiente;
};

const agregarRap = async (
    client,
    idEvaluacion,
    idRap,
    orden
) => {

    const resultado =
        await client.query(`

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
        idRap,
        orden
    ]);


    return resultado.rows[0];
};


module.exports = {

    obtenerEvaluacionConSemestre,
    obtenerRapValido,
    buscarRapEnEvaluacion,
    obtenerSiguienteOrden,
    agregarRap

};