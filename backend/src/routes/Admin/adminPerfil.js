const express = require("express");
const router = express.Router();

const {
    obtenerPerfil,
    actualizarCredenciales
} = require("../../controllers/admin/adminPerfil.controller");

const 
    verificarAdmin = require("../../middleware/admin");


router.get(
    "/",
    verificarAdmin,
    obtenerPerfil
);


router.put(
    "/credenciales",
    verificarAdmin,
    actualizarCredenciales
);


module.exports = router;