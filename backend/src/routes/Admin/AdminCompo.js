const express = require("express");
const router = express.Router();

const verificarAdmin = require("../../middleware/admin");

const {
  obtenerEspaciosAcademicosPorComponente,
} = require("../../controllers/admin/adminCompoController");


router.get(
  "/Componentes/:id_componentes/EspaciosAcademicos",
  verificarAdmin,
  obtenerEspaciosAcademicosPorComponente
);


module.exports = router;