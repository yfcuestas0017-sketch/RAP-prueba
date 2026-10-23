const express = require("express");
const router = express.Router();
const verificarDocente = require("../../middleware/docente");

const {
  listarMicrocurriculos,
  obtenerMicrocurriculo,
  crearMicrocurriculo,
  actualizarMicrocurriculo,
  eliminarMicrocurriculo,
  listarEspaciosAcademicos
} = require("../../controllers/docente/docenteMicrocurriculoController");

router.get(
  "/",
  verificarDocente,
  listarMicrocurriculos
);

router.get(
  "/espacios-academicos",
  verificarDocente,
  listarEspaciosAcademicos
);

router.get(
  "/:id",
  verificarDocente,
  obtenerMicrocurriculo
);

router.post(
  "/",
  verificarDocente,
  crearMicrocurriculo
);

router.put(
  "/:id",
  verificarDocente,
  actualizarMicrocurriculo
);

router.delete(
  "/:id",
  verificarDocente,
  eliminarMicrocurriculo
);

module.exports = router;