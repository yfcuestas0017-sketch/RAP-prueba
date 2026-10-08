const pool = require("../../config/database");
const { enviarReporte } = require("../../utils/reporteExport");

async function obtenerReporteEstudiante(idUser, filtros = {}) {
  const valores = [idUser];
  const condiciones = [
    "ug.id_user = $1",
    "ug.estado = TRUE"
  ];
  let parametro = 2;

  if (filtros.semestre) {
    condiciones.push(`s.numero = $${parametro}`);
    valores.push(Number(filtros.semestre));
    parametro += 1;
  }

  if (filtros.componente) {
    condiciones.push(
      `EXISTS (
        SELECT 1 FROM programa_espacio pe
        WHERE pe.id_espacio_academico = e.id_espacio_academico
          AND pe.id_componente = $${parametro}
      )`
    );
    valores.push(Number(filtros.componente));
    parametro += 1;
  }

  // Se parte de las evaluaciones del grupo del estudiante y se agregan sus
  // respuestas con LEFT JOIN: las que aún no han sido presentadas/calificadas
  // aparecen con porcentaje 0 y nivel "Pendiente" (faltan por registrar).
  const resultado = await pool.query(`
    SELECT
      e.id_evaluacion,
      e.nombre AS evaluacion,
      g.nombre AS grupo,
      s.numero AS semestre,
      CONCAT(COALESCE(d.nombre, ''), ' ', COALESCE(d.apellido, '')) AS docente,
      COALESCE(er.porcentaje, 0) AS porcentaje,
      CASE
        WHEN er.id_evaluacion_respuesta IS NULL THEN 'Pendiente'
        ELSE COALESCE(c.nombre, 'Sin calificar')
      END AS nivel_desempeno,
      (er.id_evaluacion_respuesta IS NOT NULL) AS registrada
    FROM usuario_grupo ug
    INNER JOIN grupo g ON g.id_grupo = ug.id_grupo
    INNER JOIN evaluacion e ON e.id_grupo = g.id_grupo
    INNER JOIN semestre s ON s.id_semestre = g.id_semestre
    LEFT JOIN usuarios d ON d.id_user = e.id_user
    LEFT JOIN evaluacion_respuesta er
      ON er.id_evaluacion = e.id_evaluacion
      AND er.id_user = ug.id_user
    LEFT JOIN calificacion c ON c.id_calificacion = er.id_calificacion
    WHERE ${condiciones.join(" AND ")}
    ORDER BY s.numero, e.nombre
  `, valores);

  return resultado.rows.map((fila) => ({
    ...fila,
    semestre: Number(fila.semestre),
    porcentaje: Number(fila.porcentaje || 0),
    docente: fila.docente.trim() || "Sin docente",
    registrada: Boolean(fila.registrada)
  }));
}

async function obtenerFiltrosReporteEstudiante(idUser) {
  const semestres = await pool.query(
    `
    SELECT DISTINCT s.numero
    FROM usuario_grupo ug
    INNER JOIN grupo g ON g.id_grupo = ug.id_grupo
    INNER JOIN evaluacion e ON e.id_grupo = g.id_grupo
    INNER JOIN semestre s ON s.id_semestre = g.id_semestre
    WHERE ug.id_user = $1 AND ug.estado = TRUE
    ORDER BY s.numero
    `,
    [idUser]
  );

  const componentes = await pool.query(
    `
    SELECT DISTINCT c.id_componentes, c.clave, c.nombre, me.nombre AS momento
    FROM usuario_grupo ug
    INNER JOIN grupo g ON g.id_grupo = ug.id_grupo
    INNER JOIN evaluacion e ON e.id_grupo = g.id_grupo
    INNER JOIN programa_espacio pe
      ON pe.id_espacio_academico = e.id_espacio_academico
      AND pe.id_momento = e.id_momento_evaluacion
    INNER JOIN componentes c
      ON c.id_componentes = pe.id_componente
    LEFT JOIN momento_evaluacion me
      ON me.id_momento_evaluacion = c.id_momento_evaluacion
    WHERE ug.id_user = $1 AND ug.estado = TRUE
    ORDER BY c.nombre
    `,
    [idUser]
  );

  return {
    semestres: semestres.rows.map((r) => Number(r.numero)),
    componentes: componentes.rows
  };
}

async function exportarReporteEstudiante(req, res, formato) {
  if (!["excel", "pdf"].includes(formato)) {
    return res.status(400).json({
      success: false,
      mensaje: "Formato de exportación no válido."
    });
  }

  const reportes = await obtenerReporteEstudiante(
    req.user.id_user,
    req.query
  );

  const columnas = [
    "Evaluación",
    "Grupo",
    "Semestre",
    "Docente",
    "Porcentaje (%)",
    "Nivel de Desempeño"
  ];

  const filas = reportes.map((r) => [
    r.evaluacion,
    r.grupo,
    r.semestre,
    r.docente,
    r.porcentaje,
    r.nivel_desempeno
  ]);

  return enviarReporte(
    res,
    formato,
    "reporte-estudiante-rap",
    "Mis Resultados y Evidencias RAP",
    columnas,
    filas
  );
}

module.exports = { obtenerReporteEstudiante, obtenerFiltrosReporteEstudiante, exportarReporteEstudiante };
