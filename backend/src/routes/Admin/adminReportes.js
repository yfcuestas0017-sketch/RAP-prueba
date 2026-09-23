const express = require("express");

const router = express.Router();

const {
    obtenerReportes,
    obtenerFiltros
} = require("../../controllers/admin/adminRepoController");

const 
    verificarAdmin = require("../../middleware/admin");


router.get(
    "/",
    verificarAdmin,
    obtenerReportes
);


router.get(
    "/filtros",
    verificarAdmin,
    obtenerFiltros
);


module.exports = router;