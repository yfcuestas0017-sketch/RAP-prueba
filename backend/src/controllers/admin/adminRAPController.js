const pool = require("../../config/database");

const obtenerRAP = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        r.id_rap,
        r.codigo_rap,
        r.nombre,
        r.descripcion,
        r.orden,
        r.estado
      FROM "rap" r
      ORDER BY r.id_rap ASC;
    `);

    res.status(200).json({
      success: true,
      cantidad: resultado.rows.length,
      rap: resultado.rows
    });

  } catch (error) {
    console.error("Error consultando RAP:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error al obtener los RAP"
    });
  }
};

module.exports = {
  obtenerRAP
};