
const pool = require("../../config/database");
const verificarAccesoEvaluacion = async (idUser, idEvaluacion) => {
  const resultado = await pool.query(
    `
    SELECT
      e.id_evaluacion,
      e.nombre,
      e.estado,
      e.fecha_inicio,
      e.fecha_fin,
      e.puntaje_total,
      g.id_grupo,
      g.nombre AS nombre_grupo,
      s.id_semestre,
      s.nombre AS nombre_semestre
    FROM evaluacion e
    INNER JOIN grupo g
      ON g.id_grupo = e.id_grupo
    INNER JOIN semestre s
      ON s.id_semestre = g.id_semestre
    INNER JOIN usuario_grupo ug
      ON ug.id_grupo = g.id_grupo
    WHERE e.id_evaluacion = $1
      AND ug.id_user = $2
    LIMIT 1
    `,
    [idEvaluacion, idUser]
  );

  return resultado.rows[0] || null;
};

const obtenerIntento = async (idUser, idEvaluacion) => {
  const resultado = await pool.query(
    `
    SELECT
      id_evaluacion_respuesta,
      id_user,
      id_evaluacion,
      estado,
      fecha_inicio,
      fecha_fin,
      puntaje_total,
      porcentaje
    FROM evaluacion_respuesta
    WHERE id_user = $1
      AND id_evaluacion = $2
    ORDER BY fecha_inicio DESC NULLS LAST
    LIMIT 1
    `,
    [idUser, idEvaluacion]
  );

  return resultado.rows[0] || null;
};


const verificarPeriodo = (evaluacion) => {
  if (String(evaluacion.estado).toUpperCase() !== "ACTIVA") {
    return "La evaluación no está activa";
  }

  const ahora = Date.now();

  if (
    evaluacion.fecha_inicio &&
    ahora < new Date(evaluacion.fecha_inicio).getTime()
  ) {
    return "La evaluación todavía no ha comenzado";
  }

  if (
    evaluacion.fecha_fin &&
    ahora > new Date(evaluacion.fecha_fin).getTime()
  ) {
    return "El plazo para presentar la evaluación ha terminado";
  }

  return null;
};

const obtenerPruebas = async (req, res) => {
  try {
    const idUser = req.user.id_user;

    const resultado = await pool.query(
      `
      SELECT
        e.id_evaluacion,
        e.nombre,
        e.estado AS estado_evaluacion,
        e.fecha_inicio,
        e.fecha_fin,
        e.puntaje_total,
        g.id_grupo,
        g.nombre AS nombre_grupo,
        s.id_semestre,
        s.nombre AS nombre_semestre,
        er.id_evaluacion_respuesta,
        er.estado AS intento_en_curso,
        er.fecha_inicio AS fecha_inicio_intento,
        er.fecha_fin AS fecha_fin_intento,
        er.puntaje_total AS puntaje_obtenido,
        er.porcentaje
      FROM evaluacion e
      INNER JOIN grupo g
        ON g.id_grupo = e.id_grupo
      INNER JOIN semestre s
        ON s.id_semestre = g.id_semestre
      INNER JOIN usuario_grupo ug
        ON ug.id_grupo = g.id_grupo
      LEFT JOIN LATERAL (
        SELECT
          er1.id_evaluacion_respuesta,
          er1.estado,
          er1.fecha_inicio,
          er1.fecha_fin,
          er1.puntaje_total,
          er1.porcentaje
        FROM evaluacion_respuesta er1
        WHERE er1.id_evaluacion = e.id_evaluacion
          AND er1.id_user = ug.id_user
        ORDER BY er1.fecha_inicio DESC NULLS LAST
        LIMIT 1
      ) er ON TRUE
      WHERE ug.id_user = $1
        AND UPPER(e.estado::text) = 'ACTIVA'
      ORDER BY
        s.id_semestre,
        e.fecha_inicio NULLS FIRST,
        e.id_evaluacion
      `,
      [idUser]
    );

    return res.status(200).json({
      mensaje: "Pruebas disponibles del estudiante",
      pruebas: resultado.rows
    });
  } catch (error) {
    console.error("Error al obtener pruebas:", error);

    return res.status(500).json({
      mensaje: "Error al consultar las pruebas",
      detalle: error.message
    });
  }
};

const obtenerPrueba = async (req, res) => {
  try {
    const idUser = req.user.id_user;
    const idEvaluacion = Number(req.params.id);

    if (!Number.isInteger(idEvaluacion) || idEvaluacion <= 0) {
      return res.status(400).json({
        mensaje: "El ID de la evaluación no es válido"
      });
    }

    const evaluacion = await verificarAccesoEvaluacion(
      idUser,
      idEvaluacion
    );

    if (!evaluacion) {
      return res.status(404).json({
        mensaje: "La evaluación no existe o no tienes acceso"
      });
    }

    const errorPeriodo = verificarPeriodo(evaluacion);

    if (errorPeriodo) {
      return res.status(409).json({
        mensaje: errorPeriodo
      });
    }

    const intento = await obtenerIntento(idUser, idEvaluacion);

    if (intento && intento.estado === false) {
      return res.status(409).json({
        mensaje: "Ya finalizaste esta evaluación"
      });
    }

    const resultado = await pool.query(
      `
      SELECT
        p.id_pregunta,
        p.tipo_pregunta,
        p.enunciado,
        p.puntaje,
        erap.id_rap,
        erap.orden,
        r.nombre AS nombre_rap,
        COALESCE(
          json_agg(
            json_build_object(
              'id_opcion_pregunta', op.id_opcion_pregunta,
              'texto', op.texto
            )
          ) FILTER (
            WHERE op.id_opcion_pregunta IS NOT NULL
          ),
          '[]'::json
        ) AS opciones
      FROM evaluacion_rap erap
      INNER JOIN pregunta p
        ON p.id_evaluacion_rap = erap.id_evaluacion_rap
      LEFT JOIN opcion_pregunta op
        ON op.id_pregunta = p.id_pregunta
      LEFT JOIN rap r
        ON r.id_rap = erap.id_rap
      WHERE erap.id_evaluacion = $1
        AND erap.estado = TRUE
        AND p.estado = TRUE
      GROUP BY
        p.id_pregunta,
        p.tipo_pregunta,
        p.enunciado,
        p.puntaje,
        erap.id_rap,
        erap.orden,
        r.nombre
      ORDER BY
        erap.orden,
        p.id_pregunta
      `,
      [idEvaluacion]
    );

    return res.status(200).json({
      evaluacion,
      intento,
      preguntas: resultado.rows
    });
  } catch (error) {
    console.error("Error al consultar la prueba:", error);

    return res.status(500).json({
      mensaje: "Error al consultar la evaluación",
      detalle: error.message
    });
  }
};

const iniciarPrueba = async (req, res) => {
  const client = await pool.connect();

  try {
    const idUser = req.user.id_user;
    const idEvaluacion = Number(req.params.id);

    if (!Number.isInteger(idEvaluacion) || idEvaluacion <= 0) {
      return res.status(400).json({
        mensaje: "El ID de la evaluación no es válido"
      });
    }

    await client.query("BEGIN");

    const acceso = await client.query(
      `
      SELECT
        e.id_evaluacion,
        e.estado,
        e.fecha_inicio,
        e.fecha_fin
      FROM evaluacion e
      INNER JOIN grupo g
        ON g.id_grupo = e.id_grupo
      INNER JOIN usuario_grupo ug
        ON ug.id_grupo = g.id_grupo
      WHERE e.id_evaluacion = $1
        AND ug.id_user = $2
      FOR UPDATE OF e
      `,
      [idEvaluacion, idUser]
    );

    if (!acceso.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        mensaje: "La evaluación no existe o no tienes acceso"
      });
    }

    const evaluacion = acceso.rows[0];
    const errorPeriodo = verificarPeriodo(evaluacion);

    if (errorPeriodo) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        mensaje: errorPeriodo
      });
    }

    const intentoExistente = await client.query(
      `
      SELECT *
      FROM evaluacion_respuesta
      WHERE id_user = $1
        AND id_evaluacion = $2
      ORDER BY fecha_inicio DESC NULLS LAST
      LIMIT 1
      FOR UPDATE
      `,
      [idUser, idEvaluacion]
    );

    if (intentoExistente.rows.length > 0) {
      const intento = intentoExistente.rows[0];

      if (intento.estado === false) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          mensaje: "Esta evaluación ya fue finalizada"
        });
      }

      await client.query("COMMIT");

      return res.status(200).json({
        mensaje: "Puedes continuar con tu evaluación",
        intento
      });
    }

    const nuevoIntento = await client.query(
      `
      INSERT INTO evaluacion_respuesta (
        id_user,
        id_evaluacion,
        fecha_inicio,
        estado
      )
      VALUES ($1, $2, CURRENT_TIMESTAMP, TRUE)
      RETURNING *
      `,
      [idUser, idEvaluacion]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      mensaje: "Evaluación iniciada correctamente",
      intento: nuevoIntento.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al iniciar prueba:", error);

    return res.status(500).json({
      mensaje: "Error al iniciar la evaluación",
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

const guardarRespuestas = async (req, res) => {
  const client = await pool.connect();

  try {
    const idUser = req.user.id_user;
    const idEvaluacion = Number(req.params.id);
    const respuestas = req.body.respuestas;

    if (!Number.isInteger(idEvaluacion) || idEvaluacion <= 0) {
      return res.status(400).json({
        mensaje: "El ID de la evaluación no es válido"
      });
    }

    if (!Array.isArray(respuestas) || respuestas.length === 0) {
      return res.status(400).json({
        mensaje: "Debes enviar una lista de respuestas"
      });
    }

    const idsPreguntas = respuestas.map((r) => Number(r.id_pregunta));

    if (
      respuestas.some(
        (r) =>
          !Number.isInteger(Number(r.id_pregunta)) ||
          Number(r.id_pregunta) <= 0 ||
          (
            r.id_opcion != null &&
            (
              !Number.isInteger(Number(r.id_opcion)) ||
              Number(r.id_opcion) <= 0
            )
          ) ||
          (r.r_texto != null && typeof r.r_texto !== "string")
      )
    ) {
      return res.status(400).json({
        mensaje: "Hay respuestas con datos inválidos"
      });
    }

    if (new Set(idsPreguntas).size !== idsPreguntas.length) {
      return res.status(400).json({
        mensaje: "No puedes enviar la misma pregunta más de una vez"
      });
    }

    await client.query("BEGIN");

    const acceso = await client.query(
      `
      SELECT e.id_evaluacion, e.estado, e.fecha_fin
      FROM evaluacion e
      INNER JOIN grupo g
        ON g.id_grupo = e.id_grupo
      INNER JOIN usuario_grupo ug
        ON ug.id_grupo = g.id_grupo
      WHERE e.id_evaluacion = $1
        AND ug.id_user = $2
      FOR UPDATE OF e
      `,
      [idEvaluacion, idUser]
    );

    if (
      !acceso.rows.length ||
      String(acceso.rows[0].estado).toUpperCase() !== "ACTIVA"
    ) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        mensaje: "No tienes acceso a esta evaluación activa"
      });
    }

    if (
      acceso.rows[0].fecha_fin &&
      Date.now() > new Date(acceso.rows[0].fecha_fin).getTime()
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        mensaje: "El plazo para responder ha terminado"
      });
    }

    const intentoResultado = await client.query(
      `
      SELECT id_evaluacion_respuesta, estado
      FROM evaluacion_respuesta
      WHERE id_user = $1
        AND id_evaluacion = $2
      ORDER BY fecha_inicio DESC NULLS LAST
      LIMIT 1
      FOR UPDATE
      `,
      [idUser, idEvaluacion]
    );

    if (
      !intentoResultado.rows.length ||
      intentoResultado.rows[0].estado !== true
    ) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        mensaje: "Debes iniciar la prueba o el intento ya fue finalizado"
      });
    }

    const idIntento =
      intentoResultado.rows[0].id_evaluacion_respuesta;

    for (const respuesta of respuestas) {
      const idPregunta = Number(respuesta.id_pregunta);
      const idOpcion =
        respuesta.id_opcion == null
          ? null
          : Number(respuesta.id_opcion);
      const texto = respuesta.r_texto ?? null;

      if (idOpcion === null && texto === null) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          mensaje: `La pregunta ${idPregunta} no tiene una respuesta`
        });
      }

      const preguntaValida = await client.query(
        `
        SELECT p.id_pregunta
        FROM pregunta p
        INNER JOIN evaluacion_rap erap
          ON erap.id_evaluacion_rap = p.id_evaluacion_rap
        WHERE p.id_pregunta = $1
          AND erap.id_evaluacion = $2
          AND erap.estado = TRUE
          AND p.estado = TRUE
        `,
        [idPregunta, idEvaluacion]
      );

      if (!preguntaValida.rows.length) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          mensaje: `La pregunta ${idPregunta} no pertenece a esta evaluación`
        });
      }

      if (idOpcion !== null) {
        const opcionValida = await client.query(
          `
          SELECT op.id_opcion_pregunta
          FROM opcion_pregunta op
          INNER JOIN pregunta p
            ON p.id_pregunta = op.id_pregunta
          INNER JOIN evaluacion_rap erap
            ON erap.id_evaluacion_rap = p.id_evaluacion_rap
          WHERE op.id_opcion_pregunta = $1
            AND p.id_pregunta = $2
            AND erap.id_evaluacion = $3
          `,
          [idOpcion, idPregunta, idEvaluacion]
        );

        if (!opcionValida.rows.length) {
          await client.query("ROLLBACK");

          return res.status(400).json({
            mensaje: `La opción enviada no pertenece a la pregunta ${idPregunta}`
          });
        }
      }

      const existente = await client.query(
        `
        SELECT id_respuesta
        FROM respuesta_
        WHERE id_evaluacion_respuesta = $1
          AND id_pregunta = $2
        LIMIT 1
        `,
        [idIntento, idPregunta]
      );

      if (existente.rows.length) {
        await client.query(
          `
          UPDATE respuesta_
          SET id_evaluacion = $1,
              id_opcion = $2,
              r_texto = $3,
              fecha_respuesta = CURRENT_TIMESTAMP
          WHERE id_respuesta = $4
          `,
          [
            idEvaluacion,
            idOpcion,
            texto,
            existente.rows[0].id_respuesta
          ]
        );
      } else {
        await client.query(
          `
          INSERT INTO respuesta_ (
            id_evaluacion,
            id_evaluacion_respuesta,
            id_pregunta,
            id_opcion,
            r_texto,
            fecha_respuesta
          )
          VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
          `,
          [
            idEvaluacion,
            idIntento,
            idPregunta,
            idOpcion,
            texto
          ]
        );
      }
    }

    await client.query("COMMIT");

    return res.status(200).json({
      mensaje: "Respuestas guardadas correctamente",
      cantidad: respuestas.length
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al guardar respuestas:", error);

    return res.status(500).json({
      mensaje: "Error al guardar las respuestas",
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

const finalizarPrueba = async (req, res) => {
  const client = await pool.connect();

  try {
    const idUser = req.user.id_user;
    const idEvaluacion = Number(req.params.id);

    if (!Number.isInteger(idEvaluacion) || idEvaluacion <= 0) {
      return res.status(400).json({
        mensaje: "El ID de la evaluación no es válido"
      });
    }

    await client.query("BEGIN");

    const intento = await client.query(
      `
      SELECT er.id_evaluacion_respuesta, er.estado
      FROM evaluacion_respuesta er
      INNER JOIN evaluacion e
        ON e.id_evaluacion = er.id_evaluacion
      INNER JOIN grupo g
        ON g.id_grupo = e.id_grupo
      INNER JOIN usuario_grupo ug
        ON ug.id_grupo = g.id_grupo
      WHERE er.id_user = $1
        AND er.id_evaluacion = $2
        AND ug.id_user = $1
      ORDER BY er.fecha_inicio DESC NULLS LAST
      LIMIT 1
      FOR UPDATE OF er
      `,
      [idUser, idEvaluacion]
    );

    if (!intento.rows.length) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        mensaje: "No se encontró un intento de esta evaluación"
      });
    }

    if (intento.rows[0].estado === false) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        mensaje: "La evaluación ya fue finalizada"
      });
    }

    const idIntento =
      intento.rows[0].id_evaluacion_respuesta;

    await client.query(
      `
      UPDATE evaluacion_respuesta
      SET estado = FALSE,
          fecha_fin = CURRENT_TIMESTAMP
      WHERE id_evaluacion_respuesta = $1
      `,
      [idIntento]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      mensaje: "Evaluación finalizada correctamente"
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Error al finalizar prueba:", error);

    return res.status(500).json({
      mensaje: "Error al finalizar la evaluación",
      detalle: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  obtenerPruebas,
  obtenerPrueba,
  iniciarPrueba,
  guardarRespuestas,
  finalizarPrueba
};
