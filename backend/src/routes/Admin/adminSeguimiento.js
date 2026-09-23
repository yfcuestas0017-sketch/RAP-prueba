const express = require("express");

const router = express.Router();

const {
    obtenerMomentosEvaluacion,
    obtenerResultadosAprendizaje,
    obtenerCriteriosRAP,
    obtenerProgramasSeguimiento,
    obtenerMomentosSeguimiento
} = require("../../controllers/admin/adminSeguimientoController");

const 
    verificarAdmin = require("../../middleware/admin");

router.get(
    "/momentos",
    verificarAdmin,
    obtenerMomentosEvaluacion
);

router.get(
    "/resultados",
    verificarAdmin,
    obtenerResultadosAprendizaje
);

router.get(
    "/rap/:idEvaluacionRap/criterios",
    verificarAdmin,
    obtenerCriteriosRAP
);

router.get(
    "/programas",
    verificarAdmin,
    obtenerProgramasSeguimiento
);

router.get(
    "/momentos-catalogo",
    verificarAdmin,
    obtenerMomentosSeguimiento
);


module.exports = router;