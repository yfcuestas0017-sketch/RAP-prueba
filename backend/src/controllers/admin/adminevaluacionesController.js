const evaluacionesService = require("../../services/admin/evaluacionesService");
const evaluacionRapService = require("../../services/admin/evaluacionRapService");

const {
    validarCrearEvaluacion,
    validarAgregarRap,
    validarAsignarDocente,
    validarEstado
} = require("../../validators/evaluacionValidator");

const obtenerGrupos = async (req, res) => {

    try {

        const data = await evaluacionesService.obtenerGrupos();

        res.json({
            success: true,
            data
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

        const data = await evaluacionesService.obtenerDocentes();

        res.json({
            success: true,
            data
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

        const data = await evaluacionesService.obtenerMomentos();

        res.json({
            success: true,
            data
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

        const data = await evaluacionesService.obtenerRaps(
            idSemestre
        );

        res.json({
            success: true,
            data
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

    const errorValidacion =
        validarCrearEvaluacion(req.body);

    if (errorValidacion) {

        return res.status(400).json({
            success: false,
            message: errorValidacion
        });
    }

    try {

        const data =
            await evaluacionesService.crearEvaluacion(
                req.body
            );

        res.status(201).json({
            success: true,
            message: "Evaluación creada correctamente",
            data
        });

    } catch (error) {

        console.error(
            "Error creando evaluación:",
            error
        );

        const response = {
            success: false,
            message:
                error.message ||
                "Error creando evaluación"
        };
        if (
            error.status === 409 &&
            error.id_evaluacion
        ) {
            response.id_evaluacion =
                error.id_evaluacion;
        }

        if (
            !error.status ||
            error.status >= 500
        ) {
            response.error =
                error.originalMessage ||
                error.message;
        }
        res.status(error.status || 500)
            .json(response);
    }
};
const listarEvaluaciones = async (req, res) => {

    try {

        const data =
            await evaluacionesService
                .listarEvaluaciones();

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error listando evaluaciones:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Error listando evaluaciones"
        });
    }
};
const asignarDocente = async (req, res) => {

    const { idEvaluacion } = req.params;

    const { id_docente } = req.body;

    const errorValidacion =
        validarAsignarDocente(id_docente);

    if (errorValidacion) {

        return res.status(400).json({
            success: false,
            message: errorValidacion
        });
    }

    try {

        const data =
            await evaluacionesService.asignarDocente(
                idEvaluacion,
                id_docente
            );

        res.json({
            success: true,
            message: "Docente asignado correctamente",
            data
        });

    } catch (error) {

        console.error(
            "Error asignando docente:",
            error
        );

        res.status(error.status || 500).json({
            success: false,
            message:
                error.message ||
                "Error asignando docente"
        });
    }
};
const agregarRap = async (req, res) => {

    const { idEvaluacion } = req.params;

    const {
        id_rap,
        orden
    } = req.body;

    const errorValidacion =
        validarAgregarRap(id_rap);

    if (errorValidacion) {

        return res.status(400).json({
            success: false,
            message: errorValidacion
        });
    }

    try {

        const data =
            await evaluacionRapService.agregarRap(
                idEvaluacion,
                id_rap,
                orden
            );

        res.status(201).json({
            success: true,
            message: "RAP agregado correctamente",
            data
        });

    } catch (error) {

        console.error(
            "Error agregando RAP:",
            error
        );

        const response = {
            success: false,
            message:
                error.message ||
                "Error agregando RAP"
        };

        if (
            !error.status ||
            error.status >= 500
        ) {
            response.error =
                error.originalMessage ||
                error.message;
        }

        res.status(error.status || 500)
            .json(response);
    }
};
const obtenerEvaluacion = async (req, res) => {

    const { idEvaluacion } = req.params;

    try {

        const data =
            await evaluacionesService.obtenerEvaluacion(
                idEvaluacion
            );

        res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "Error obteniendo evaluación:",
            error
        );

        res.status(error.status || 500).json({
            success: false,
            message:
                error.message ||
                "Error obteniendo evaluación"
        });
    }
};
const cambiarEstado = async (req, res) => {

    const { idEvaluacion } = req.params;

    const { estado } = req.body;

    const errorValidacion =
        validarEstado(estado);

    if (errorValidacion) {

        return res.status(400).json({
            success: false,
            message: errorValidacion
        });
    }

    try {

        const data =
            await evaluacionesService.cambiarEstado(
                idEvaluacion,
                estado
            );

        res.json({
            success: true,
            message: "Estado actualizado correctamente",
            data
        });

    } catch (error) {

        console.error(
            "Error cambiando estado:",
            error
        );

        res.status(error.status || 500).json({
            success: false,
            message:
                error.message ||
                "Error cambiando estado"
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
