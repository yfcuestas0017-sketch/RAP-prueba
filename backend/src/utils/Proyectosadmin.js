const pool = require("../config/database");
const crearControladorProyectos = ({ numeroSemestre, etiqueta }) => {
  const listarProyectos = async (req, res) => {
    try {
      const { periodo, id_programa, id_grupo, estado, buscar } = req.query;

      const pagina = Math.max(parseInt(req.query.pagina, 10) || 1, 1);
      const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 20, 1), 100);
      const offset = (pagina - 1) * limite;

      const valores = [numeroSemestre];
      const condiciones = ["s.numero = $1"];

      if (periodo) {
        valores.push(periodo);
        condiciones.push(`g.periodo = $${valores.length}`);
      }

      if (id_programa) {
        valores.push(Number(id_programa));
        condiciones.push(`s.id_programa = $${valores.length}`);
      }

      if (id_grupo) {
        valores.push(Number(id_grupo));
        condiciones.push(`g.id_grupo = $${valores.length}`);
      }

      if (estado === "true" || estado === "false") {
        valores.push(estado === "true");
        condiciones.push(`pr.estado = $${valores.length}`);
      }

      if (buscar && buscar.trim()) {
        valores.push(`%${buscar.trim()}%`);
        const i = valores.length;
        condiciones.push(`(
          pr.nombre ILIKE $${i}
          OR u.nombre ILIKE $${i}
          OR u.apellido ILIKE $${i}
          OR u.correo ILIKE $${i}
          OR CAST(u.id_user_institucional AS TEXT) ILIKE $${i}
        )`);
      }

      valores.push(limite, offset);

      const resultado = await pool.query(
        `
        SELECT
          pr.id_proyecto,
          pr.nombre,
          pr.descripcion,
          pr.tipo_proyecto,
          pr.especializacion,
          pr.estado,
          pr.fecha_registro,

          u.id_user,
          u.nombre AS nombre_estudiante,
          u.apellido AS apellido_estudiante,
          u.correo,
          u.id_user_institucional,

          s.id_semestre,
          s.numero AS semestre,

          g.id_grupo,
          g.nombre AS grupo,
          g.periodo,
          g.jornada,

          prog.id_programa,
          prog.nombre AS programa,

          COUNT(*) OVER() AS total
        FROM proyecto pr
        INNER JOIN semestre s ON s.id_semestre = pr.id_semestre
        INNER JOIN usuarios u ON u.id_user = pr.id_user
        LEFT JOIN programa prog ON prog.id_programa = s.id_programa
        LEFT JOIN LATERAL (
          SELECT g2.*
          FROM usuario_grupo ug
          INNER JOIN grupo g2 ON g2.id_grupo = ug.id_grupo
          WHERE ug.id_user = pr.id_user
            AND g2.id_semestre = pr.id_semestre
          ORDER BY ug.estado DESC
          LIMIT 1
        ) g ON TRUE
        WHERE ${condiciones.join(" AND ")}
        ORDER BY pr.fecha_registro DESC NULLS LAST, pr.id_proyecto DESC
        LIMIT $${valores.length - 1} OFFSET $${valores.length}
        `,
        valores
      );

      const total = resultado.rows.length ? Number(resultado.rows[0].total) : 0;
      const proyectos = resultado.rows.map(({ total: _t, ...fila }) => fila);

      return res.status(200).json({
        mensaje: `Proyectos de ${etiqueta} consultados correctamente`,
        proyectos,
        paginacion: {
          pagina,
          limite,
          total,
          total_paginas: Math.ceil(total / limite)
        }
      });
    } catch (error) {
      console.error(`Error al listar proyectos de ${etiqueta}:`, error);
      return res.status(500).json({
        mensaje: `Error al consultar los proyectos de ${etiqueta}`
      });
    }
  };

  // GET /:idProyecto -> detalle completo de un proyecto
  const obtenerProyecto = async (req, res) => {
    try {
      const idProyecto = Number(req.params.idProyecto);

      if (!Number.isInteger(idProyecto) || idProyecto <= 0) {
        return res.status(400).json({ mensaje: "Identificador de proyecto inválido" });
      }

      const resultado = await pool.query(
        `
        SELECT
          to_jsonb(pr) AS proyecto,

          jsonb_build_object(
            'id_user', u.id_user,
            'id_user_institucional', u.id_user_institucional,
            'nombre', u.nombre,
            'apellido', u.apellido,
            'correo', u.correo,
            'estado', u.estado
          ) AS estudiante,

          jsonb_build_object(
            'id_semestre', s.id_semestre,
            'numero', s.numero,
            'nombre', s.nombre
          ) AS semestre,

          CASE WHEN g.id_grupo IS NULL THEN NULL ELSE jsonb_build_object(
            'id_grupo', g.id_grupo,
            'nombre', g.nombre,
            'periodo', g.periodo,
            'jornada', g.jornada,
            'codigo_jornada', g.codigo_jornada
          ) END AS grupo,

          CASE WHEN prog.id_programa IS NULL THEN NULL ELSE jsonb_build_object(
            'id_programa', prog.id_programa,
            'nombre', prog.nombre
          ) END AS programa
        FROM proyecto pr
        INNER JOIN semestre s ON s.id_semestre = pr.id_semestre
        INNER JOIN usuarios u ON u.id_user = pr.id_user
        LEFT JOIN programa prog ON prog.id_programa = s.id_programa
        LEFT JOIN LATERAL (
          SELECT g2.*
          FROM usuario_grupo ug
          INNER JOIN grupo g2 ON g2.id_grupo = ug.id_grupo
          WHERE ug.id_user = pr.id_user
            AND g2.id_semestre = pr.id_semestre
          ORDER BY ug.estado DESC
          LIMIT 1
        ) g ON TRUE
        WHERE pr.id_proyecto = $1
          AND s.numero = $2
        `,
        [idProyecto, numeroSemestre]
      );

      if (!resultado.rows.length) {
        return res.status(404).json({
          mensaje: `No se encontró el proyecto de ${etiqueta}`
        });
      }

      return res.status(200).json({
        mensaje: `Proyecto de ${etiqueta} consultado correctamente`,
        ...resultado.rows[0]
      });
    } catch (error) {
      console.error(`Error al consultar proyecto de ${etiqueta}:`, error);
      return res.status(500).json({
        mensaje: `Error al consultar el proyecto de ${etiqueta}`
      });
    }
  };

  return { listarProyectos, obtenerProyecto };
};

module.exports = { crearControladorProyectos };