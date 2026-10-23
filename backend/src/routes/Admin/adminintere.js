const express = require("express");
const router = express.Router();
const verificarAdmin = require("../../middleware/admin");

const {
  listarInterestructurantes,
  obtenerInterestructurante
} = require("../../controllers/admin/adminInterestructuranteController");

router.get("/", verificarAdmin, listarInterestructurantes);
router.get("/:idProyecto", verificarAdmin, obtenerInterestructurante);

module.exports = router;