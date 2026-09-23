const express = require("express");

const router = express.Router();

const {
    listarEvaluaciones,
    obtenerEvaluacion,
} = require("../../controllers/estudiante/estudianteEvaluacionController");

const 
    verificarEstudiante = require("../../middleware/estudiante");


router.get(
    "/",
    verificarEstudiante,
    listarEvaluaciones
);


router.get(
    "/:idEvaluacion",
    verificarEstudiante,
    obtenerEvaluacion
);


module.exports = router;