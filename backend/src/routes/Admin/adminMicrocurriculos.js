const express = require("express");
const router = express.Router();

const verificarAdmin = require("../../middleware/admin");

const {
  listarDocentesPrograma,
} = require("../../controllers/admin/adminDocentesProController");

const {
  listarMicrocurriculosDocentes,
  listarEspaciosAcademicos,
  listarMisMicrocurriculos,
  obtenerMicrocurriculo,
  crearMicrocurriculo,
  actualizarMicrocurriculo,
  eliminarMicrocurriculo,
} = require("../../controllers/admin/adminMicrocurriculoController");

router.use(verificarAdmin);

router.get("/docentes", listarDocentesPrograma);
router.get("/programa", listarMicrocurriculosDocentes);
router.get("/espacios-academicos", listarEspaciosAcademicos);
router.get("/", listarMisMicrocurriculos);
router.get("/:id", obtenerMicrocurriculo);
router.post("/", crearMicrocurriculo);
router.put("/:id", actualizarMicrocurriculo);
router.delete("/:id", eliminarMicrocurriculo);

module.exports = router;