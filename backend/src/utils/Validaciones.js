const { ErrorServicio } = require("./Errores");

const vacio = (v) => v === undefined || v === null || v === "";
const esEnteroPositivo = (v) => /^\d+$/.test(String(v)) && Number(v) > 0;

function validarEnteros(campos) {
  for (const [nombre, valor] of Object.entries(campos)) {
    if (!vacio(valor) && !esEnteroPositivo(valor)) {
      throw new ErrorServicio(400, `${nombre} inválido`);
    }
  }
}

module.exports = { vacio, esEnteroPositivo, validarEnteros };