
const pool = require("../../config/database");
const obtenerSemestreActual = async (idUser) => {
  const resultado = await pool.query(
    `
    SELECT
      s.numero AS semestre,
      s.id_semestre
    FROM usuario_grupo ug
    INNER JOIN grupo g ON g.id_grupo = ug.id_grupo
    INNER JOIN semestre s ON s.id_semestre = g.id_semestre
    WHERE ug.id_user = $1
      AND ug.estado = TRUE
    ORDER BY s.numero DESC
    LIMIT 1
    `,
    [idUser]
  );

  return resultado.rows[0] || null;
};

// GET /api/estudiante/proyecto
const obtenerProyecto = async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const semestre = await obtenerSemestreActual(idUser);

    if (!semestre) {
      return res.status(404).json({
        mensaje: "No tienes un grupo académico activo"
      });
    }

    if (Number(semestre.semestre) !== 7) {
      return res.status(403).json({
        mensaje: "El proyecto está habilitado para estudiantes de séptimo semestre"
      });
    }

    const resultado = await pool.query(
      `
      SELECT
        id_proyecto,
        nombre,
        descripcion,
        informacion,
        tipo_proyecto,
        especializacion,
        estado,
        fecha_registro,
        id_semestre
      FROM proyecto
      WHERE id_user = $1
        AND id_semestre = $2
      ORDER BY fecha_registro DESC NULLS LAST
      LIMIT 1
      `,
      [idUser, semestre.id_semestre]
    );

    return res.status(200).json({
      mensaje: "Proyecto consultado correctamente",
      proyecto: resultado.rows[0] || null
    });
  } catch (error) {
    console.error("Error al consultar proyecto:", error);

    return res.status(500).json({
      mensaje: "Error al consultar el proyecto"
    });
  }
};

const guardarProyecto = async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const semestre = await obtenerSemestreActual(idUser);

    if (!semestre || Number(semestre.semestre) !== 7) {
      return res.status(403).json({
        mensaje: "Solo los estudiantes de séptimo semestre pueden diligenciar este proyecto"
      });
    }

    const {
      nombre,
      descripcion,
      informacion,
      tipo_proyecto,
      especializacion
    } = req.body;

    if (
      typeof nombre !== "string" ||
      !nombre.trim() ||
      typeof informacion !== "string" ||
      !informacion.trim()
    ) {
      return res.status(400).json({
        mensaje: "El nombre y la información del proyecto son obligatorios"
      });
    }

    if (
      especializacion !== undefined &&
      typeof especializacion !== "boolean"
    ) {
      return res.status(400).json({
        mensaje: "El campo especializacion debe ser booleano"
      });
    }

    const existente = await pool.query(
      `
      SELECT id_proyecto
      FROM proyecto
      WHERE id_user = $1
        AND id_semestre = $2
      ORDER BY fecha_registro DESC NULLS LAST
      LIMIT 1
      `,
      [idUser, semestre.id_semestre]
    );

    let resultado;

    if (existente.rows.length) {
      resultado = await pool.query(
        `
        UPDATE proyecto
        SET nombre = $1,
            descripcion = $2,
            informacion = $3,
            tipo_proyecto = $4,
            especializacion = $5
        WHERE id_proyecto = $6
          AND id_user = $7
          AND id_semestre = $8
        RETURNING *
        `,
        [
          nombre.trim(),
          descripcion || null,
          informacion,
          tipo_proyecto || null,
          especializacion ?? false,
          existente.rows[0].id_proyecto,
          idUser,
          semestre.id_semestre
        ]
      );
    } else {
      resultado = await pool.query(
        `
        INSERT INTO proyecto (
          nombre,
          descripcion,
          informacion,
          tipo_proyecto,
          especializacion,
          estado,
          fecha_registro,
          id_semestre,
          id_user
        )
        VALUES (
          $1, $2, $3, $4, $5,
          TRUE, CURRENT_TIMESTAMP, $6, $7
        )
        RETURNING *
        `,
        [
          nombre.trim(),
          descripcion || null,
          informacion,
          tipo_proyecto || null,
          especializacion ?? false,
          semestre.id_semestre,
          idUser
        ]
      );
    }

    return res.status(200).json({
      mensaje: "Proyecto guardado correctamente",
      proyecto: resultado.rows[0]
    });
  } catch (error) {
    console.error("Error al guardar proyecto:", error);

    return res.status(500).json({
      mensaje: "Error al guardar el proyecto"
    });
  }
};

module.exports = {
  obtenerProyecto,
  guardarProyecto
};
