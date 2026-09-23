const pool = require("../../config/database");

const obtenerEspaciosAcademicosPorComponente = async (req, res) => {
  try {
    const { id_componentes } = req.params;

    const resultado = await pool.query(
      `
      SELECT DISTINCT 
        c.id_componentes, 
        c.clave, 
        c.nombre AS componente,
        ea.id_espacio_academico,
        ea.nombre AS espacio_academico
      FROM "programa_espacio" pe

      INNER JOIN "componentes" c
        ON pe.id_componente = c.id_componentes

      INNER JOIN "espacio_academico" ea
        ON pe.id_espacio_academico = ea.id_espacio_academico

      WHERE pe.id_componente = $1

      ORDER BY ea.id_espacio_academico ASC;
      `,
      [id_componentes]
    );

    res.status(200).json({
      success: true,

      cantidad: resultado.rows.length,

      componente:
        resultado.rows.length > 0
          ? {
              id_componentes: resultado.rows[0].id_componentes,
              clave: resultado.rows[0].clave,
              nombre: resultado.rows[0].componente,
            }
          : null,

      espacios_academicos: resultado.rows.map((row) => ({
        id_espacio_academico: row.id_espacio_academico,
        nombre: row.espacio_academico,
      })),
    });
  } catch (error) {
    console.error(
      "Error consultando espacios académicos:",
      error
    );

    res.status(500).json({
      success: false,
      mensaje: "Error al obtener los espacios académicos",
    });
  }
};

module.exports = {
  obtenerEspaciosAcademicosPorComponente,
};