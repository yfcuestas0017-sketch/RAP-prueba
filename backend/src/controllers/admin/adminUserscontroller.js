const pool = require("../../config/database");
const obtenerDocentes = async (req, res) => {
  try {

    const resultado = await pool.query(`
      SELECT
        u."id_user",
        u."id_user_institucional",
        u."nombre",
        u."apellido",
        u."correo",
        u."estado",
        u."id_rol",

        r."nombre" AS "rol",

        g."id_grupo",
        g."nombre" AS "grupo",
        g."jornada",
        g."periodo"

      FROM "usuarios" u

      INNER JOIN "rol" r
        ON u."id_rol" = r."id_rol"

      LEFT JOIN "usuario_grupo" ug
        ON u."id_user" = ug."id_user"

      LEFT JOIN "grupo" g
        ON ug."id_grupo" = g."id_grupo"

      WHERE u."id_rol" = 5

      ORDER BY
        u."apellido" ASC,
        u."nombre" ASC;
    `);

    res.status(200).json({
      success: true,
      cantidad: resultado.rows.length,
      docentes: resultado.rows
    });

  } catch (error) {

    console.error("Error consultando docentes:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error al obtener los docentes"
    });
  }
};

const obtenerEstudiantes = async (req, res) => {
  try {

    const resultado = await pool.query(`
      SELECT 
        u."id_user",
        u."id_user_institucional",
        u."nombre",
        u."apellido",
        u."correo",
        u."estado",
        u."id_rol",

        r."nombre" AS "rol",

        g."id_grupo",
        g."nombre" AS "grupo",
        g."jornada",
        g."periodo",

        s."id_semestre",
        s."numero" AS "semestre",
        s."nombre" AS "nombre_semestre"

      FROM "usuarios" u

      INNER JOIN "rol" r
        ON u."id_rol" = r."id_rol"

      LEFT JOIN "usuario_grupo" ug
        ON u."id_user" = ug."id_user"

      LEFT JOIN "grupo" g
        ON ug."id_grupo" = g."id_grupo"

      LEFT JOIN "semestre" s
        ON g."id_semestre" = s."id_semestre"

      WHERE u."id_rol" = 6

      ORDER BY
        s."numero" ASC,
        g."nombre" ASC,
        u."apellido" ASC,
        u."nombre" ASC;
    `);

    res.status(200).json({
      success: true,
      cantidad: resultado.rows.length,
      estudiantes: resultado.rows
    });

  } catch (error) {

    console.error("Error consultando estudiantes:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error al obtener los estudiantes"
    });
  }
};

module.exports = {
  obtenerDocentes,
  obtenerEstudiantes
};