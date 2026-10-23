const docentesPrograma = require("../../services/Docenteprogramaservice");
const { traducirError } = require("../../utils/Errores");

const listarDocentesPrograma = async (req, res) => {
  try {
    const docentes = await docentesPrograma.listar({ id_programa: req.query.id_programa });
    return res.status(200).json({ success: true, docentes });
  } catch (err) {
    const { status, mensaje } = traducirError(err, {
      contexto: "admin docentes programa",
      interno: "Error al listar los docentes",
    });
    return res.status(status).json({ success: false, mensaje });
  }
};

module.exports = { listarDocentesPrograma };