const express = require("express");
const router = express.Router();
const ficha = require("../../controllers/docente/docenteFichasController");
const verificarToken = require("../../middleware/docente"); 

router.param("id", (req, res, next, id) => {
  if (!/^\d+$/.test(id)) return res.status(400).json({ ok: false, message: "id inválido" });
  next();
});

router.use(verificarToken);

router.get("/", ficha.listarFichas);
router.get("/mias", ficha.listarMisFichas);   
router.get("/:id", ficha.obtenerFicha);

router.post("/", ficha.crearFicha);
router.put("/:id", ficha.actualizarFicha);
router.delete("/:id", ficha.eliminarFicha);

module.exports = router;