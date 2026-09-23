const pool = require("../../config/database");

async function obtenerReporteEstudiante(idUser, filtros = {}) {
  const valores = [idUser];
  const condiciones = ["er.id_user = $1"];
  let parametro = 2;

  if (filtros.semestre) {
    condiciones.push(`s.numero = $${parametro}`);
    valores.push(Number(filtros.semestre));
    parametro += 1;
  }

  const resultado = await pool.query(`
    SELECT
      e.id_evaluacion,
      e.nombre AS evaluacion,
      g.nombre AS grupo,
      s.numero AS semestre,
      CONCAT(COALESCE(d.nombre, ''), ' ', COALESCE(d.apellido, '')) AS docente,
      COALESCE(er.porcentaje, 0) AS porcentaje,
      COALESCE(c.nombre, 'Sin calificar') AS nivel_desempeno
    FROM evaluacion_respuesta er
    INNER JOIN evaluacion e ON e.id_evaluacion = er.id_evaluacion
    INNER JOIN grupo g ON g.id_grupo = e.id_grupo
    INNER JOIN semestre s ON s.id_semestre = g.id_semestre
    LEFT JOIN usuarios d ON d.id_user = e.id_user
    LEFT JOIN calificacion c ON c.id_calificacion = er.id_calificacion
    WHERE ${condiciones.join(" AND ")}
    ORDER BY s.numero, e.nombre
  `, valores);

  return resultado.rows.map((fila) => ({
    ...fila,
    semestre: Number(fila.semestre),
    porcentaje: Number(fila.porcentaje || 0),
    docente: fila.docente.trim() || "Sin docente"
  }));
}

module.exports = { obtenerReporteEstudiante };
