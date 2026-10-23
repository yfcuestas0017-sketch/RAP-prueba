const express = require("express");
const router = express.Router();
const verificarAdmin = require("../../middleware/admin");

const c = require("../../controllers/admin/AdminCatalogosController");

router.use(verificarAdmin);
router.get("/componentes", c.listarComponentes);
router.get("/componentes/:id", c.obtenerComponente);
router.post("/componentes", c.crearComponente);
router.put("/componentes/:id", c.actualizarComponente);
router.delete("/componentes/:id", c.eliminarComponente);
router.get("/espacios-academicos", c.listarEspaciosAcademicos);
router.get("/espacios-academicos/:id", c.obtenerEspacioAcademico);
router.post("/espacios-academicos", c.crearEspacioAcademico);
router.put("/espacios-academicos/:id", c.actualizarEspacioAcademico);
router.delete("/espacios-academicos/:id", c.eliminarEspacioAcademico);
router.get("/semestres", c.listarSemestres);
router.get("/semestres/:id", c.obtenerSemestre);
router.post("/semestres", c.crearSemestre);
router.put("/semestres/:id", c.actualizarSemestre);
router.delete("/semestres/:id", c.eliminarSemestre);
router.get("/grupos", c.listarGrupos);
router.get("/grupos/:id", c.obtenerGrupo);
router.post("/grupos", c.crearGrupo);
router.put("/grupos/:id", c.actualizarGrupo);
router.delete("/grupos/:id", c.eliminarGrupo);
router.get("/jornadas", c.listarJornadas);
router.put("/jornadas/:jornada", c.actualizarJornada);
router.get("/periodos", c.listarPeriodos);
router.put("/periodos/:periodo", c.actualizarPeriodo);

module.exports = router;