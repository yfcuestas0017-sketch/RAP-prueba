const express = require("express");
const router = express.Router();

const verificarDocente = require("../../middleware/docente");
const { obtenerReporteDocente, obtenerFiltrosReporteDocente, exportarReporteDocente } = require("../../controllers/docente/docenteReportesController");

router.get("/reportes/filtros", verificarDocente, async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: await obtenerFiltrosReporteDocente(req.user.id_user) });
  } catch (error) {
    console.error("Error obteniendo filtros del docente:", error);
    return res.status(500).json({ success: false, mensaje: "Error al obtener los filtros de reportes." });
  }
});

router.get("/reportes/exportar/:formato", verificarDocente, async (req, res) => {
  if (!["excel", "pdf"].includes(req.params.formato)) return res.status(400).json({ success: false, mensaje: "Formato de exportación no válido." });
  try {
    return await exportarReporteDocente(req, res, req.params.formato);
  } catch (error) {
    console.error("Error exportando reporte del docente:", error);
    return res.status(500).json({ success: false, mensaje: "No fue posible exportar el reporte." });
  }
});

router.get("/reportes", verificarDocente, async (req, res) => {
  try {
    const reportes = await obtenerReporteDocente(req.user.id_user, req.query);

    return res.status(200).json({
      success: true,
      data: reportes
    });
  } catch (error) {
    console.error("Error obteniendo reportes del docente:", error);
    return res.status(500).json({
      success: false,
      mensaje: "Error al obtener los reportes del docente"
    });
  }
});

module.exports = router;
