const express = require("express");
const router = express.Router();
const verificarDocente = require("../../middleware/docente");

const {
  obtenerGrupos,
  obtenerGrupo,
  obtenerEstudiantesGrupo
} = require("../../controllers/docente/docenteGruposController");

router.get(
  "/grupos",
  verificarDocente,
  obtenerGrupos
);
router.get(
  "/grupos/:id",
  verificarDocente,
  obtenerGrupo
);

router.get(
  "/grupos/:id/estudiantes",
  verificarDocente,
  obtenerEstudiantesGrupo
);

module.exports = router;