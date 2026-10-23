const express = require("express");
const router = express.Router();

const verificarAdmin = require("../../middleware/admin");
const { listarDocentesPrograma } = require("../../controllers/admin/adminDocentesProController");
const {
  listarFichasDocentes,
  listarMisFichas,
  obtenerFicha,
  crearFicha,
  actualizarFicha,
  eliminarFicha,
} = require("../../controllers/admin/adminFichasController");

router.param("id", (req, res, next, id) => {
  if (!/^\d+$/.test(id)) return res.status(400).json({ ok: false, message: "id inválido" });
  next();
});

router.use(verificarAdmin);

router.get("/docentes", listarDocentesPrograma);
router.get("/programa", listarFichasDocentes);

router.get("/mias", listarMisFichas);
router.get("/:id", obtenerFicha);
router.post("/", crearFicha);
router.put("/:id", actualizarFicha);
router.delete("/:id", eliminarFicha);

module.exports = router;