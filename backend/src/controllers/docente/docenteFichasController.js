const fichas = require("../../services/Fichaservice");
const { traducirError } = require("../../utils/Errores");

const alcanceDocente = (req) => ({ idUsuario: req.user.id_user, propios: true });

const responderError = (res, err, contexto) => {
  const { status, mensaje, debug } = traducirError(err, {
    contexto: `ficha docente ${contexto}`,
    duplicados: fichas.MENSAJES_DUPLICADO,
  });
  return res.status(status).json({ ok: false, message: mensaje, debug });
};

const listarFichas = async (req, res) => {
  try {
    const { id_grupo, id_espacio_academico, id_programa, periodo, anio, estado } = req.query;
    const data = await fichas.listar(alcanceDocente(req), {
      id_grupo, id_espacio_academico, id_programa, periodo, anio, estado,
    });
    return res.json({ ok: true, data });
  } catch (err) {
    return responderError(res, err, "listar");
  }
};

const obtenerFicha = async (req, res) => {
  try {
    const data = await fichas.obtener(alcanceDocente(req), req.params.id);
    return res.json({ ok: true, data });
  } catch (err) {
    return responderError(res, err, "obtener");
  }
};

const crearFicha = async (req, res) => {
  try {
    const data = await fichas.crear(req.user.id_user, req.body);
    return res.status(201).json({ ok: true, data });
  } catch (err) {
    return responderError(res, err, "crear");
  }
};

const actualizarFicha = async (req, res) => {
  try {
    const data = await fichas.actualizar(req.user.id_user, req.params.id, req.body);
    return res.json({ ok: true, data });
  } catch (err) {
    return responderError(res, err, "actualizar");
  }
};

const eliminarFicha = async (req, res) => {
  try {
    await fichas.eliminar(req.user.id_user, req.params.id);
    return res.json({ ok: true, message: "Ficha eliminada" });
  } catch (err) {
    return responderError(res, err, "eliminar");
  }
};

module.exports = {
  listarFichas,
  listarMisFichas: listarFichas,
  obtenerFicha,
  crearFicha,
  actualizarFicha,
  eliminarFicha,
};