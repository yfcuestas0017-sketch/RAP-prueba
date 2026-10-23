const express = require("express");
const router = express.Router();

const verificarEstudiante = require("../../middleware/estudiante");

const {
  obtenerPruebas,
  obtenerPrueba,
  iniciarPrueba,
  guardarRespuestas,
  finalizarPrueba
} = require("../../controllers/estudiante/estudiantePruebaController");

router.get(
  "/pruebas",
  verificarEstudiante,
  obtenerPruebas
);

router.get(
  "/pruebas/:id",
  verificarEstudiante,
  obtenerPrueba
);

router.post(
  "/pruebas/:id/iniciar",
  verificarEstudiante,
  iniciarPrueba
);

router.put(
  "/pruebas/:id/respuestas",
  verificarEstudiante,
  guardarRespuestas
);

router.post(
  "/pruebas/:id/finalizar",
  verificarEstudiante,
  finalizarPrueba
);

module.exports = router;
