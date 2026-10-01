const pool = require("../../config/database");
const { enviarReporte } = require("../../utils/reporteExport");

const obtenerReporteDocente = async (idUser, filtros = {}) => {

  const valores = [idUser];

  const condiciones = [
    `e.id_user = $1`
  ];

  let parametro = 2;

  if (filtros.semestre) {
    condiciones.push(
      `s.numero = $${parametro}`
    );

    valores.push(filtros.semestre);
    parametro++;
  }

  if (filtros.periodo) {
    condiciones.push(
      `g.periodo = $${parametro}`
    );

    valores.push(filtros.periodo);
    parametro++;
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
    parametro++;
  }

  const query = `
    SELECT 
      e.id_evaluacion, 
      e.nombre AS evaluacion, 

      g.id_grupo, 
      g.nombre AS grupo, 
      g.jornada, 
      g.periodo, 

      s.numero AS semestre, 

      COUNT(DISTINCT ug.id_user) 
        AS estudiantes_grupo, 

      COUNT(DISTINCT er.id_user) 
        AS estudiantes_evaluados, 

      ROUND( 
        AVG(er.porcentaje)::numeric, 
        2 
      ) AS porcentaje_promedio 

    FROM evaluacion e 

    INNER JOIN grupo g 
      ON e.id_grupo = g.id_grupo 

    INNER JOIN semestre s 
      ON g.id_semestre = s.id_semestre 

    LEFT JOIN usuario_grupo ug 
      ON ug.id_grupo = g.id_grupo 
      AND ug.estado = TRUE 

    LEFT JOIN evaluacion_respuesta er 
      ON er.id_evaluacion = 
         e.id_evaluacion 
      AND er.id_user = ug.id_user 

    WHERE ${condiciones.join(" AND ")} 

    GROUP BY 
      e.id_evaluacion, 
      e.nombre, 
      g.id_grupo, 
      g.nombre, 
      g.jornada, 
      g.periodo, 
      s.numero 

    ORDER BY 
      s.numero, 
      g.nombre; 
  `;

  const resultado = await pool.query(query, valores);

  return resultado.rows;
};

const obtenerFiltrosReporteDocente = async (idUser) => {
  const semestres = await pool.query(
    `
    SELECT DISTINCT s.numero AS semestre
    FROM evaluacion e
    INNER JOIN grupo g ON e.id_grupo = g.id_grupo
    INNER JOIN semestre s ON g.id_semestre = s.id_semestre
    WHERE e.id_user = $1
    ORDER BY s.numero
    `,
    [idUser]
  );

  const periodos = await pool.query(
    `
    SELECT DISTINCT g.periodo
    FROM evaluacion e
    INNER JOIN grupo g ON e.id_grupo = g.id_grupo
    WHERE e.id_user = $1
      AND g.periodo IS NOT NULL
    ORDER BY g.periodo
    `,
    [idUser]
  );

  const componentes = await pool.query(
    `
    SELECT DISTINCT c.id_componentes, c.clave, c.nombre, me.nombre AS momento
    FROM evaluacion e
    INNER JOIN programa_espacio pe
      ON pe.id_espacio_academico = e.id_espacio_academico
      AND pe.id_momento = e.id_momento_evaluacion
    INNER JOIN componentes c
      ON c.id_componentes = pe.id_componente
    LEFT JOIN momento_evaluacion me
      ON me.id_momento_evaluacion = c.id_momento_evaluacion
    WHERE e.id_user = $1
    ORDER BY c.nombre
    `,
    [idUser]
  );

  return {
    semestres: semestres.rows.map((r) => Number(r.semestre)),
    periodos: periodos.rows.map((r) => r.periodo),
    componentes: componentes.rows
  };
};

const columnasReporteDocente = [
  "Evaluación",
  "Grupo",
  "Jornada",
  "Periodo",
  "Semestre",
  "Estudiantes",
  "Evaluados",
  "Promedio (%)"
];

const filasReporteDocente = (reportes) =>
  reportes.map((r) => [
    r.evaluacion,
    r.grupo,
    r.jornada,
    r.periodo,
    r.semestre,
    Number(r.estudiantes_grupo || 0),
    Number(r.estudiantes_evaluados || 0),
    Number(r.porcentaje_promedio || 0)
  ]);

const exportarReporteDocente = async (req, res, formato) => {
  if (!["excel", "pdf"].includes(formato)) {
    return res.status(400).json({
      success: false,
      mensaje: "Formato de exportación no válido."
    });
  }

  const reportes = await obtenerReporteDocente(
    req.user.id_user,
    req.query
  );

  return enviarReporte(
    res,
    formato,
    "reporte-docente-rap",
    "Reporte de Evaluaciones por Grupo",
    columnasReporteDocente,
    filasReporteDocente(reportes)
  );
};


module.exports = {
  obtenerReporteDocente,
  obtenerFiltrosReporteDocente,
  exportarReporteDocente
};