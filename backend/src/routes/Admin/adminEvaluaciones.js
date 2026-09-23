const express = require("express");

const router = express.Router();

const {
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
} = require("../../controllers/admin/adminevaluacionesController");

const verificarAdmin = require("../../middleware/admin");

router.get(
    "/grupos",
    verificarAdmin,
    obtenerGrupos
);


router.get(
    "/docentes",
    verificarAdmin,
    obtenerDocentes
);

router.get(
    "/momentos",
    verificarAdmin,
    obtenerMomentos
);

router.get(
    "/raps/:idSemestre",
    verificarAdmin,
    obtenerRaps
);


router.post(
    "/",
    verificarAdmin,
    crearEvaluacion
);

router.get(
    "/",
    verificarAdmin,
    listarEvaluaciones
);

router.get(
    "/:idEvaluacion",
    verificarAdmin,
    obtenerEvaluacion
);

router.put(
    "/:idEvaluacion/docente",
    verificarAdmin,
    asignarDocente
);

router.post(
    "/:idEvaluacion/raps",
    verificarAdmin,
    agregarRap
);

router.put(
    "/:idEvaluacion/estado",
    verificarAdmin,
    cambiarEstado
);


module.exports = router;