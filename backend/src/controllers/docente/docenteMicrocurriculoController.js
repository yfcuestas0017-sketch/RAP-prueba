const microcurriculos = require("../../services/Microcurriculoservice");
const { traducirError } = require("../../utils/Errores");

const alcanceDocente = (req) => ({ idUsuario: req.user.id_user, propios: true });

const responderError = (res, err, interno) => {
  const { status, mensaje } = traducirError(err, {
    contexto: "microcurriculo docente",
    referencia: "El espacio académico seleccionado no existe",
    interno,
  });
  return res.status(status).json({ success: false, mensaje });
};

const listarEspaciosAcademicos = async (req, res) => {
  try {
    const espaciosAcademicos = await microcurriculos.listarEspacios();
    return res.status(200).json({ success: true, espaciosAcademicos });
  } catch (err) {
    return responderError(res, err, "Error al consultar los espacios académicos");
  }
};

const listarMicrocurriculos = async (req, res) => {
  try {
    const { id_espacio_academico, periodo, estado } = req.query;
    const lista = await microcurriculos.listar(alcanceDocente(req), { id_espacio_academico, periodo, estado });
    return res.status(200).json({ success: true, microcurriculos: lista });
  } catch (err) {
    return responderError(res, err, "Error al listar los microcurrículos");
  }
};

const obtenerMicrocurriculo = async (req, res) => {
  try {
    const microcurriculo = await microcurriculos.obtener(alcanceDocente(req), req.params.id);
    return res.status(200).json({ success: true, microcurriculo });
  } catch (err) {
    return responderError(res, err, "Error al consultar el microcurrículo");
  }
};

const crearMicrocurriculo = async (req, res) => {
  try {
    const microcurriculo = await microcurriculos.crear(req.user.id_user, req.body);
    return res.status(201).json({ success: true, mensaje: "Microcurrículo creado correctamente", microcurriculo });
  } catch (err) {
    return responderError(res, err, "Error al crear el microcurrículo");
  }
};

const actualizarMicrocurriculo = async (req, res) => {
  try {
    const microcurriculo = await microcurriculos.actualizar(req.user.id_user, req.params.id, req.body);
    return res.status(200).json({ success: true, mensaje: "Microcurrículo actualizado correctamente", microcurriculo });
  } catch (err) {
    return responderError(res, err, "Error al actualizar el microcurrículo");
  }
};

const eliminarMicrocurriculo = async (req, res) => {
  try {
    await microcurriculos.eliminar(req.user.id_user, req.params.id);
    return res.status(200).json({ success: true, mensaje: "Borrador eliminado correctamente" });
  } catch (err) {
    return responderError(res, err, "Error al eliminar el microcurrículo");
  }
};

module.exports = {
  listarEspaciosAcademicos,
  listarMicrocurriculos,
  obtenerMicrocurriculo,
  crearMicrocurriculo,
  actualizarMicrocurriculo,
  eliminarMicrocurriculo,
};