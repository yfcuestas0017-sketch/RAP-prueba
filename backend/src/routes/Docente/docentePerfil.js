const express = require("express");
const router = express.Router();

const {
    obtenerPerfil,
    actualizarCredenciales
} = require("../../controllers/docente/docentePerfilController");

const 
    verificarDocente = require("../../middleware/docente");


router.get(
    "/",
    verificarDocente,
    obtenerPerfil
);


module.exports = router;