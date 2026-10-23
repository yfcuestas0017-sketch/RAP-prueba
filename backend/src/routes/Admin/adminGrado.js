const express = require("express");
const router = express.Router();
const verificarAdmin = require("../../middleware/admin");

const {
  listarTrabajosGrado,
  obtenerTrabajoGrado
} = require("../../controllers/admin/adminTrabajoGrado");

router.get("/", verificarAdmin, listarTrabajosGrado);
router.get("/:idProyecto", verificarAdmin, obtenerTrabajoGrado);

module.exports = router;