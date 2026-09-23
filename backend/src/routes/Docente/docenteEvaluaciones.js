const express = require("express");

const router = express.Router();

const {
    listarEvaluaciones,
    obtenerEvaluacion,
    crearPregunta,
    listarPreguntas,
    eliminarPregunta
} = require("../../controllers/docente/docenteEvaluciones");

const verificarDocente = require("../../middleware/docente");


router.get(
    "/",
    verificarDocente,
    listarEvaluaciones
);


router.get(
    "/:idEvaluacion",
    verificarDocente,
    obtenerEvaluacion
);


router.post(
    "/rap/:idEvaluacionRap/preguntas",
    verificarDocente,
    crearPregunta
);


router.get(
    "/rap/:idEvaluacionRap/preguntas",
    verificarDocente,
    listarPreguntas
);


router.delete(
    "/preguntas/:idPregunta",
    verificarDocente,
    eliminarPregunta
);


module.exports = router;