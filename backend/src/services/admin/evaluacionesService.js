const pool = require("../../config/database");
const evaluacionModel = require("../../models/evaluacionModel");

const crearError = (
    status,
    message,
    options = {}
) => {

    const error = new Error(message);
    error.status = status;
    Object.assign(error, options);
    return error;
};

const obtenerGrupos = async () => {

    return await evaluacionModel.obtenerGrupos();

};

const obtenerDocentes = async () => {

    return await evaluacionModel.obtenerDocentes();

};
const obtenerMomentos = async () => {

    return await evaluacionModel.obtenerMomentos();

};
const obtenerRaps = async (idSemestre) => {

    return await evaluacionModel.obtenerRaps(
        idSemestre
    );

};
const crearEvaluacion = async (datos) => {

    const client = await pool.connect();

    try {

        const {
            nombre,
            fecha_inicio,
            fecha_fin,
            id_grupo,
            id_momento_evaluacion,
            id_docente
        } = datos;


        const idGrupo =
            Number(id_grupo);

        const idMomento =
            Number(id_momento_evaluacion);

        const idDocente =
            Number(id_docente);

        await client.query("BEGIN");
        const grupo =
            await evaluacionModel.obtenerGrupo(
                client,
                idGrupo
            );


        if (!grupo) {

            throw crearError(
                404,
                "El grupo no existe"
            );
        }
        const docente =
            await evaluacionModel.obtenerDocente(
                client,
                idDocente
            );


        if (!docente) {

            throw crearError(
                400,
                "El docente no existe o no está activo"
            );
        }

        const momento =
            await evaluacionModel.obtenerMomento(
                client,
                idMomento
            );


        if (!momento) {

            throw crearError(
                400,
                "El momento de evaluación no existe"
            );
        }

        if (
            Number(momento.id_semestre) !==
            Number(grupo.id_semestre)
        ) {

            throw crearError(
                400,
                "El momento de evaluación no corresponde al semestre del grupo"
            );
        }
        const existente =
            await evaluacionModel
                .buscarEvaluacionExistente(
                    client,
                    idGrupo,
                    idMomento
                );


        if (existente) {

            throw crearError(
                409,
                "Ya existe una evaluación para este grupo y momento",
                {
                    id_evaluacion:
                        existente.id_evaluacion
                }
            );
        }
        const evaluacion =
            await evaluacionModel.crearEvaluacion(
                client,
                {
                    nombre,
                    fecha_inicio,
                    fecha_fin,
                    idGrupo,
                    idMomento,
                    idDocente
                }
            );
        await client.query("COMMIT");
        return evaluacion;

    } catch (error) {

        await client.query("ROLLBACK");
        throw error;

    } finally {

        client.release();

    }
};

const listarEvaluaciones = async () => {

    return await evaluacionModel
        .listarEvaluaciones();

};

const asignarDocente = async (
    idEvaluacion,
    idDocente
) => {

    const docente =
        await evaluacionModel
            .obtenerDocenteActivo(
                idDocente
            );


    if (!docente) {

        throw crearError(
            404,
            "Docente no encontrado"
        );
    }
    const evaluacion =
        await evaluacionModel.asignarDocente(
            idEvaluacion,
            idDocente
        );


    if (!evaluacion) {

        throw crearError(
            404,
            "Evaluación no encontrada"
        );
    }
    return evaluacion;
};

const obtenerEvaluacion = async (
    idEvaluacion
) => {


    const evaluacion =
        await evaluacionModel
            .obtenerEvaluacion(
                idEvaluacion
            );


    if (!evaluacion) {

        throw crearError(
            404,
            "Evaluación no encontrada"
        );
    }


    const raps =
        await evaluacionModel
            .obtenerRapsEvaluacion(
                idEvaluacion
            );
    return {
        evaluacion,
        raps

    };
};
const cambiarEstado = async (
    idEvaluacion,
    estado
) => {


    const evaluacion =
        await evaluacionModel.cambiarEstado(
            idEvaluacion,
            estado
        );


    if (!evaluacion) {

        throw crearError(
            404,
            "Evaluación no encontrada"
        );
    }


    return evaluacion;
};


module.exports = {

    obtenerGrupos,
    obtenerDocentes,
    obtenerMomentos,
    obtenerRaps,
    crearEvaluacion,
    listarEvaluaciones,
    asignarDocente,
    obtenerEvaluacion,
    cambiarEstado

};