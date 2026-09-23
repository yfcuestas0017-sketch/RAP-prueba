const express = require("express");
const router = express.Router();

const multer = require("multer");

const verificarAdmin = require("../../middleware/admin");

const {
  importarUsuarios,
  obtenerUsuarios
} = require("../../controllers/admin/adminExportUsersController");

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.post(
  "/usuarios/importar",
  verificarAdmin,
  upload.single("archivo"),
  importarUsuarios
);

router.get(
  "/usuarios",
  verificarAdmin,
  obtenerUsuarios
);


module.exports = router;