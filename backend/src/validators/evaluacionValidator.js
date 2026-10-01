const ESTADOS_EVALUACION = [

    "BORRADOR",
    "ACTIVA",
    "CERRADA",
    "ELIMINADA"

];
const validarCrearEvaluacion = (
    body = {}
) => {

    const {
        nombre,
        id_grupo,
        id_momento_evaluacion,
        id_docente
    } = body;


    if (
        !nombre ||
        !id_grupo ||
        !id_momento_evaluacion ||
        !id_docente
    ) {

        return "Nombre, grupo, momento y docente son obligatorios";

    }


    return null;
};

const validarAgregarRap = (
    idRap
) => {

    if (!idRap) {

        return "Debe enviar id_rap";

    }

    return null;
};

const validarAsignarDocente = (
    idDocente
) => {

    if (!idDocente) {

        return "Debe enviar id_docente";

    }

    return null;
};

const validarEstado = (
    estado
) => {

    if (
        !ESTADOS_EVALUACION.includes(
            estado
        )
    ) {

        return "Estado inválido. Use BORRADOR, ACTIVA, CERRADA o ELIMINADA";
    }
    return null;
};


module.exports = {

    ESTADOS_EVALUACION,

    validarCrearEvaluacion,
    validarAgregarRap,
    validarAsignarDocente,
    validarEstado

};