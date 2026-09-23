const express = require("express");
const router = express.Router();

const pool = require("../../config/database");
const verificarEstudiante = require("../../middleware/estudiante");


router.get("/perfil", verificarEstudiante, async (req, res) => {
  try {
    const idUser = req.user.id_user;

    const resultado = await pool.query(`
      SELECT
        u."id_user",
        u."id_user_institucional",
        u."nombre",
        u."apellido",
        u."correo",
        u."estado",

        r."id_rol",
        r."nombre" AS "rol",

        g."id_grupo",
        g."nombre" AS "grupo",
        g."codigo_jornada" AS "codigo_grupo",
        g."jornada",
        g."periodo",

        s."id_semestre",
        s."numero" AS "semestre",
        s."nombre" AS "nombre_semestre",

        p."id_programa",
        p."nombre" AS "programa",

        f."id_facultad",
        f."nombre" AS "facultad"

      FROM "usuarios" u

      INNER JOIN "rol" r
        ON u."id_rol" = r."id_rol"

      LEFT JOIN "usuario_grupo" ug
        ON u."id_user" = ug."id_user"
        AND ug."estado" = TRUE

      LEFT JOIN "grupo" g
        ON ug."id_grupo" = g."id_grupo"

      LEFT JOIN "semestre" s
        ON g."id_semestre" = s."id_semestre"

      LEFT JOIN "programa" p
        ON s."id_programa" = p."id_programa"

      LEFT JOIN "facultad" f
        ON p."id_facultad" = f."id_facultad"

      WHERE u."id_user" = $1
        AND u."estado" = TRUE
        AND u."id_rol" = 6

      LIMIT 1;
    `, [idUser]);


    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "No se encontró información académica del estudiante"
      });
    }


    const estudiante = resultado.rows[0];


    res.status(200).json({
      success: true,
      estudiante: {
        id_user: estudiante.id_user,
        id_user_institucional: estudiante.id_user_institucional,
        nombre: estudiante.nombre,
        apellido: estudiante.apellido,
        correo: estudiante.correo,
        estado: estudiante.estado,
        rol: estudiante.rol,

        grupo: {
          id_grupo: estudiante.id_grupo,
          nombre: estudiante.grupo,
          codigo: estudiante.codigo_grupo,
          jornada: estudiante.jornada,
          periodo: estudiante.periodo
        },

        semestre: {
          id_semestre: estudiante.id_semestre,
          numero: estudiante.semestre,
          nombre: estudiante.nombre_semestre
        },

        programa: {
          id_programa: estudiante.id_programa,
          nombre: estudiante.programa
        },

        facultad: {
          id_facultad: estudiante.id_facultad,
          nombre: estudiante.facultad
        }
      }
    });

  } catch (error) {

    console.error("Error obteniendo perfil del estudiante:", error);

    res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor"
    });
  }
});


module.exports = router;