const express = require("express");
const router = express.Router();

const pool = require("../../config/database");
const verificarDocente = require("../../middleware/docente");

router.get("/dashboard", verificarDocente, async (req, res) => {

  try {

    const idDocente = req.user.id_user;

    const grupos = await pool.query(`
      SELECT
        g."id_grupo",
        g."nombre",
        g."codigo_jornada",
        g."jornada",
        g."periodo",

        s."id_semestre",
        s."numero" AS semestre,
        s."nombre" AS nombre_semestre,

        p."id_programa",
        p."nombre" AS programa

      FROM "usuario_grupo" ug

      INNER JOIN "grupo" g
        ON ug."id_grupo" = g."id_grupo"

      INNER JOIN "semestre" s
        ON g."id_semestre" = s."id_semestre"

      INNER JOIN "programa" p
        ON s."id_programa" = p."id_programa"

      WHERE ug."id_user" = $1
        AND ug."estado" = TRUE

      ORDER BY s."numero", g."nombre"
    `, [idDocente]);



    const evaluaciones = await pool.query(`
      SELECT
        e."id_evaluacion",
        e."nombre",
        e."estado",
        e."fecha_inicio",
        e."fecha_fin",
        e."puntaje_total",

        g."id_grupo",
        g."nombre" AS grupo,
        g."codigo_jornada" AS codigo_grupo,

        s."id_semestre",
        s."numero" AS semestre,

        COUNT(DISTINCT er."id_evaluacion_respuesta") AS total_respuestas

      FROM "evaluacion" e

      INNER JOIN "grupo" g
        ON e."id_grupo" = g."id_grupo"

      INNER JOIN "semestre" s
        ON g."id_semestre" = s."id_semestre"

      LEFT JOIN "evaluacion_respuesta" er
        ON e."id_evaluacion" = er."id_evaluacion"

      WHERE e."id_user" = $1

      GROUP BY
        e."id_evaluacion",
        e."nombre",
        e."estado",
        e."fecha_inicio",
        e."fecha_fin",
        e."puntaje_total",
        g."id_grupo",
        g."nombre",
        g."codigo_jornada",
        s."id_semestre",
        s."numero"

      ORDER BY e."fecha_inicio" DESC
    `, [idDocente]);


    const proyectos = await pool.query(`
      SELECT
        pr."id_proyecto",
        pr."nombre",
        pr."descripcion",
        pr."especializacion",
        pr."estado",
        pr."informacion",
        pr."fecha_registro",
        pr."tipo_proyecto",

        u."id_user",
        u."id_user_institucional",
        u."nombre" AS estudiante_nombre,
        u."apellido" AS estudiante_apellido,
        u."correo",

        s."id_semestre",
        s."numero" AS semestre,
        s."nombre" AS nombre_semestre,

        g."id_grupo",
        g."nombre" AS grupo,
        g."codigo_jornada" AS codigo_grupo,
        g."jornada",
        g."periodo"

      FROM "proyecto" pr

      INNER JOIN "usuarios" u
        ON pr."id_user" = u."id_user"

      INNER JOIN "semestre" s
        ON pr."id_semestre" = s."id_semestre"

      INNER JOIN "usuario_grupo" ug
        ON u."id_user" = ug."id_user"
        AND ug."estado" = TRUE

      INNER JOIN "grupo" g
        ON ug."id_grupo" = g."id_grupo"

      WHERE g."id_grupo" IN (
        SELECT "id_grupo"
        FROM "usuario_grupo"
        WHERE "id_user" = $1
          AND "estado" = TRUE
      )

      ORDER BY pr."fecha_registro" DESC
    `, [idDocente]);


    const pendientes = await pool.query(`
      SELECT
        COUNT(*) AS total

      FROM "evaluacion_respuesta" er

      INNER JOIN "evaluacion" e
        ON er."id_evaluacion" = e."id_evaluacion"

      WHERE e."id_user" = $1
        AND er."estado" = TRUE
    `, [idDocente]);

    return res.status(200).json({

      success: true,

      estadisticas: {
        totalGrupos: grupos.rows.length,

        pendientesCalificar:
          Number(pendientes.rows[0].total),

        archivosRecibidos:
          proyectos.rows.length
      },

      grupos: grupos.rows,

      evaluaciones: evaluaciones.rows,

      proyectos: proyectos.rows
    });


  } catch (error) {

    console.error(
      "Error obteniendo dashboard del docente:",
      error
    );

    return res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor"
    });

  }

});

module.exports = router;