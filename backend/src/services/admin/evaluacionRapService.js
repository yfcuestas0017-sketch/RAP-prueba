const pool = require("../../config/database");
const evaluacionRapModel = require("../../models/evaluacionRapModel");

const crearError = (
    status,
    message
) => {

    const error = new Error(message);
    error.status = status;
    return error;
};

const agregarRap = async (
    idEvaluacion,
    idRap,
    orden
) => {

    const client =
        await pool.connect();


    try {

        await client.query("BEGIN");
        const evaluacion =
            await evaluacionRapModel
                .obtenerEvaluacionConSemestre(
                    client,
                    idEvaluacion
                );


        if (!evaluacion) {

            throw crearError(
                404,
                "Evaluación no encontrada"
            );
        }

        const rap =
            await evaluacionRapModel
                .obtenerRapValido(
                    client,
                    idRap,
                    evaluacion.id_semestre
                );


        if (!rap) {

            throw crearError(
                400,
                "El RAP no pertenece al semestre de la evaluación"
            );
        }

        const existe =
            await evaluacionRapModel
                .buscarRapEnEvaluacion(
                    client,
                    idEvaluacion,
                    idRap
                );


        if (existe) {

            throw crearError(
                409,
                "Este RAP ya está agregado a la evaluación"
            );
        }

        let nuevoOrden = orden;
        if (!nuevoOrden) {

            nuevoOrden =
                await evaluacionRapModel
                    .obtenerSiguienteOrden(
                        client,
                        idEvaluacion
                    );
        }

        const resultado =
            await evaluacionRapModel.agregarRap(
                client,
                idEvaluacion,
                idRap,
                nuevoOrden
            );

        await client.query("COMMIT");
        return resultado;


    } catch (error) {

        await client.query("ROLLBACK");
        throw error;


    } finally {

        client.release();

    }
};


module.exports = {

    agregarRap

};