const pool = require("../../config/database");

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


module.exports = {
  obtenerReporteDocente
};