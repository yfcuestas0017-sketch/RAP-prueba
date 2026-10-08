const express = require("express");
const router = express.Router();

const verificarEstudiante = require("../../middleware/estudiante");
const {
  obtenerReporteEstudiante,
  obtenerFiltrosReporteEstudiante,
  exportarReporteEstudiante
} = require("../../controllers/estudiante/estudianteReportesController");

router.get("/reportes/filtros", verificarEstudiante, async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: await obtenerFiltrosReporteEstudiante(req.user.id_user) });
  } catch (error) {
    console.error("Error obteniendo filtros del estudiante:", error);
    return res.status(500).json({ success: false, mensaje: "Error al obtener los filtros de reportes." });
  }
});

router.get("/reportes/exportar/:formato", verificarEstudiante, async (req, res) => {
  try {
    return await exportarReporteEstudiante(req, res, req.params.formato);
  } catch (error) {
    console.error("Error exportando reporte del estudiante:", error);
    return res.status(500).json({ success: false, mensaje: "No fue posible exportar el reporte." });
  }
});

router.get("/reportes", verificarEstudiante, async (req, res) => {
  try {
    const reportes = await obtenerReporteEstudiante(req.user.id_user, req.query);
    return res.status(200).json({ success: true, data: reportes });
  } catch (error) {
    console.error("Error obteniendo reportes del estudiante:", error);
    return res.status(500).json({ success: false, mensaje: "Error al obtener los reportes del estudiante" });
  }
});

module.exports = router;
