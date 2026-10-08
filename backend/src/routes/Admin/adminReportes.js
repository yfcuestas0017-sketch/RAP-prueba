const express = require("express");

const router = express.Router();

const {
    obtenerReportes,
    obtenerFiltros,
    exportarReporte
} = require("../../controllers/admin/adminRepoController");

const 
    verificarAdmin = require("../../middleware/admin");


router.get(
    "/exportar/:formato",
    verificarAdmin,
    exportarReporte
);


router.get(
    "/filtros",
    verificarAdmin,
    obtenerFiltros
);


router.get(
    "/",
    verificarAdmin,
    obtenerReportes
);


module.exports = router;