const express = require("express");
const router = express.Router();

const {
    obtenerPerfil,
} = require("../../controllers/estudiante/estudiantePerfilController");

const 
    verificarEstudiante = require("../../middleware/estudiante");


router.get(
    "/",
    verificarEstudiante,
    obtenerPerfil
);


module.exports = router;