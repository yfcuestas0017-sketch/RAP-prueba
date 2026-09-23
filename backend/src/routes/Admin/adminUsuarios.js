const express = require("express");
const router = express.Router();

const verificarAdmin = require("../../middleware/admin");

const {
  obtenerDocentes,
  obtenerEstudiantes
} = require("../../controllers/admin/adminUserscontroller");

router.get(
  "/Docentes",
  verificarAdmin,
  obtenerDocentes
);

router.get(
  "/Estudiantes",
  verificarAdmin,
  obtenerEstudiantes
);

module.exports = router;