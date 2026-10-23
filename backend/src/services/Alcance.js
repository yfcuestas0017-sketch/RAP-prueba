const ROL_DOCENTE = 5;

function condicionAlcance(alcance, vals, tabla, tablaUsuario) {
  const partes = [];

  if (alcance && alcance.propios) {
    if (!alcance.idUsuario) throw new Error("alcance.propios requiere idUsuario");
    vals.push(alcance.idUsuario);
    partes.push(`${tabla}.id_user_docente = $${vals.length}`);
  }
  if (alcance && alcance.docentes) {
    partes.push(`${tablaUsuario}.id_rol = ${ROL_DOCENTE}`);
  }
  if (partes.length === 0) throw new Error("Alcance vacío: indica propios y/o docentes");

  return `(${partes.join(" OR ")})`;
}

module.exports = { condicionAlcance };