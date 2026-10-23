
const express = require("express");
const router = express.Router();
const verificarEstudiante = require("../../middleware/estudiante");

const {
  obtenerProyecto,
  guardarProyecto
} = require("../../controllers/estudiante/estudianteProyectosController");

router.get(
  "/proyecto",
  verificarEstudiante,
  obtenerProyecto
);

router.post(
  "/proyecto",
  verificarEstudiante,
  guardarProyecto
);

module.exports = router;
