const pool = require("../../config/database");
const obtenerGrupos = async (req, res) => {

  try {

    const idDocente = req.user.id_user;

    const resultado = await pool.query(`
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

      ORDER BY
        s."numero",
        g."nombre"
    `, [idDocente]);


    return res.status(200).json({

      success: true,

      grupos: resultado.rows

    });


  } catch (error) {

    console.error(
      "Error obteniendo grupos del docente:",
      error
    );


    return res.status(500).json({

      success: false,

      mensaje: "Error obteniendo los grupos"

    });

  }

};

const obtenerGrupo = async (req, res) => {

  try {

    const idDocente = req.user.id_user;

    const idGrupo = req.params.id;


    const resultado = await pool.query(`
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
        AND ug."id_grupo" = $2
        AND ug."estado" = TRUE

    `, [idDocente, idGrupo]);


    if (resultado.rows.length === 0) {

      return res.status(403).json({

        success: false,

        mensaje: "No tiene acceso a este grupo"

      });

    }


    return res.status(200).json({

      success: true,

      grupo: resultado.rows[0]

    });


  } catch (error) {

    console.error(
      "Error obteniendo grupo:",
      error
    );


    return res.status(500).json({

      success: false,

      mensaje: "Error obteniendo el grupo"

    });

  }

};


module.exports = {
  obtenerGrupos,
  obtenerGrupo
};
