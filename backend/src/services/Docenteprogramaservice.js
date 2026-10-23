const pool = require("../config/database");
const { validarEnteros, vacio } = require("../utils/Validaciones");

async function listar({ id_programa } = {}) {
  validarEnteros({ id_programa });

  const vals = [];
  let filtroPrograma = "";
  if (!vacio(id_programa)) {
    vals.push(id_programa);
    filtroPrograma = `AND s.id_programa = $1`;
  }

  const { rows } = await pool.query(
    `SELECT u.id_user,
            trim(u.nombre || ' ' || COALESCE(u.apellido, '')) AS nombre,
            u.correo
       FROM usuarios u
       JOIN usuario_grupo ug ON ug.id_user = u.id_user AND ug.estado = TRUE
       JOIN grupo g          ON g.id_grupo = ug.id_grupo
       JOIN semestre s       ON s.id_semestre = g.id_semestre
      WHERE u.id_rol = 5
        AND u.estado = TRUE
        ${filtroPrograma}
      GROUP BY u.id_user, u.nombre, u.apellido, u.correo
      ORDER BY u.nombre, u.apellido`,
    vals
  );
  return rows;
}

module.exports = { listar };