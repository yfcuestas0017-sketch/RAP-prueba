const pool = require("../../config/database");
const idValido = (valor) => {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
};

const textoValido = (valor) => typeof valor === "string" && valor.trim().length > 0;

const manejarError = (res, error, mensaje) => {
  if (error.code === "23505") {
    return res.status(409).json({ success: false, mensaje: "Ya existe un registro con esos datos" });
  }
  if (error.code === "23503") {
    return res.status(409).json({
      success: false,
      mensaje: "No se puede completar la acción: el registro está relacionado con otros datos"
    });
  }
  console.error(`${mensaje}:`, error);
  return res.status(500).json({ success: false, mensaje });
};

const noEncontrado = (res, entidad) =>
  res.status(404).json({ success: false, mensaje: `${entidad} no encontrado` });

const listarComponentes = async (req, res) => {
  try {
    const { buscar } = req.query;
    const valores = [];
    let where = "";

    if (textoValido(buscar)) {
      valores.push(`%${buscar.trim()}%`);
      where = "WHERE c.nombre ILIKE $1 OR c.clave ILIKE $1";
    }

    const resultado = await pool.query(
      `
      SELECT
        c.id_componentes,
        c.clave,
        c.nombre,
        COUNT(DISTINCT pe.id_espacio_academico) AS cantidad_espacios
      FROM componentes c
      LEFT JOIN programa_espacio pe ON pe.id_componente = c.id_componentes
      ${where}
      GROUP BY c.id_componentes, c.clave, c.nombre
      ORDER BY c.nombre ASC
      `,
      valores
    );

    return res.status(200).json({
      success: true,
      cantidad: resultado.rows.length,
      componentes: resultado.rows.map((f) => ({
        ...f,
        cantidad_espacios: Number(f.cantidad_espacios)
      }))
    });
  } catch (error) {
    return manejarError(res, error, "Error al listar los componentes");
  }
};

const obtenerComponente = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const resultado = await pool.query(
      `SELECT id_componentes, clave, nombre FROM componentes WHERE id_componentes = $1`,
      [id]
    );
    if (!resultado.rows.length) return noEncontrado(res, "Componente");

    return res.status(200).json({ success: true, componente: resultado.rows[0] });
  } catch (error) {
    return manejarError(res, error, "Error al consultar el componente");
  }
};

const crearComponente = async (req, res) => {
  try {
    const { clave, nombre } = req.body;

    if (!textoValido(clave) || !textoValido(nombre)) {
      return res.status(400).json({ success: false, mensaje: "La clave y el nombre son obligatorios" });
    }

    const resultado = await pool.query(
      `INSERT INTO componentes (clave, nombre) VALUES ($1, $2) RETURNING id_componentes, clave, nombre`,
      [clave.trim(), nombre.trim()]
    );

    return res.status(201).json({
      success: true,
      mensaje: "Componente creado correctamente",
      componente: resultado.rows[0]
    });
  } catch (error) {
    return manejarError(res, error, "Error al crear el componente");
  }
};

const actualizarComponente = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const { clave, nombre } = req.body;

    if ((clave !== undefined && !textoValido(clave)) || (nombre !== undefined && !textoValido(nombre))) {
      return res.status(400).json({ success: false, mensaje: "La clave y el nombre no pueden estar vacíos" });
    }
    if (clave === undefined && nombre === undefined) {
      return res.status(400).json({ success: false, mensaje: "No se enviaron campos para actualizar" });
    }

    const resultado = await pool.query(
      `
      UPDATE componentes
      SET clave = COALESCE($1, clave),
          nombre = COALESCE($2, nombre)
      WHERE id_componentes = $3
      RETURNING id_componentes, clave, nombre
      `,
      [clave ? clave.trim() : null, nombre ? nombre.trim() : null, id]
    );
    if (!resultado.rows.length) return noEncontrado(res, "Componente");

    return res.status(200).json({
      success: true,
      mensaje: "Componente actualizado correctamente",
      componente: resultado.rows[0]
    });
  } catch (error) {
    return manejarError(res, error, "Error al actualizar el componente");
  }
};

const eliminarComponente = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const resultado = await pool.query(
      `DELETE FROM componentes WHERE id_componentes = $1 RETURNING id_componentes`,
      [id]
    );
    if (!resultado.rows.length) return noEncontrado(res, "Componente");

    return res.status(200).json({ success: true, mensaje: "Componente eliminado correctamente" });
  } catch (error) {
    return manejarError(res, error, "Error al eliminar el componente");
  }
};

const listarEspaciosAcademicos = async (req, res) => {
  try {
    const { buscar, id_componente } = req.query;
    const valores = [];
    const condiciones = [];

    if (textoValido(buscar)) {
      valores.push(`%${buscar.trim()}%`);
      condiciones.push(`ea.nombre ILIKE $${valores.length}`);
    }
    if (id_componente) {
      const idComp = idValido(id_componente);
      if (!idComp) return res.status(400).json({ success: false, mensaje: "id_componente inválido" });
      valores.push(idComp);
      condiciones.push(`pe.id_componente = $${valores.length}`);
    }

    const resultado = await pool.query(
      `
      SELECT
        ea.id_espacio_academico,
        ea.nombre,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id_componentes', c.id_componentes,
            'clave', c.clave,
            'nombre', c.nombre
          )) FILTER (WHERE c.id_componentes IS NOT NULL),
          '[]'::jsonb
        ) AS componentes
      FROM espacio_academico ea
      LEFT JOIN programa_espacio pe ON pe.id_espacio_academico = ea.id_espacio_academico
      LEFT JOIN componentes c ON c.id_componentes = pe.id_componente
      ${condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : ""}
      GROUP BY ea.id_espacio_academico, ea.nombre
      ORDER BY ea.nombre ASC
      `,
      valores
    );

    return res.status(200).json({
      success: true,
      cantidad: resultado.rows.length,
      espacios_academicos: resultado.rows
    });
  } catch (error) {
    return manejarError(res, error, "Error al listar los espacios académicos");
  }
};

const obtenerEspacioAcademico = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const resultado = await pool.query(
      `
      SELECT
        ea.id_espacio_academico,
        ea.nombre,
        COALESCE(
          jsonb_agg(DISTINCT jsonb_build_object(
            'id_componentes', c.id_componentes,
            'clave', c.clave,
            'nombre', c.nombre
          )) FILTER (WHERE c.id_componentes IS NOT NULL),
          '[]'::jsonb
        ) AS componentes
      FROM espacio_academico ea
      LEFT JOIN programa_espacio pe ON pe.id_espacio_academico = ea.id_espacio_academico
      LEFT JOIN componentes c ON c.id_componentes = pe.id_componente
      WHERE ea.id_espacio_academico = $1
      GROUP BY ea.id_espacio_academico, ea.nombre
      `,
      [id]
    );
    if (!resultado.rows.length) return noEncontrado(res, "Espacio académico");

    return res.status(200).json({ success: true, espacio_academico: resultado.rows[0] });
  } catch (error) {
    return manejarError(res, error, "Error al consultar el espacio académico");
  }
};

const crearEspacioAcademico = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!textoValido(nombre)) {
      return res.status(400).json({ success: false, mensaje: "El nombre es obligatorio" });
    }

    const resultado = await pool.query(
      `INSERT INTO espacio_academico (nombre) VALUES ($1) RETURNING id_espacio_academico, nombre`,
      [nombre.trim()]
    );

    return res.status(201).json({
      success: true,
      mensaje: "Espacio académico creado correctamente",
      espacio_academico: resultado.rows[0]
    });
  } catch (error) {
    return manejarError(res, error, "Error al crear el espacio académico");
  }
};

const actualizarEspacioAcademico = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const { nombre } = req.body;
    if (!textoValido(nombre)) {
      return res.status(400).json({ success: false, mensaje: "El nombre es obligatorio" });
    }

    const resultado = await pool.query(
      `UPDATE espacio_academico SET nombre = $1 WHERE id_espacio_academico = $2
       RETURNING id_espacio_academico, nombre`,
      [nombre.trim(), id]
    );
    if (!resultado.rows.length) return noEncontrado(res, "Espacio académico");

    return res.status(200).json({
      success: true,
      mensaje: "Espacio académico actualizado correctamente",
      espacio_academico: resultado.rows[0]
    });
  } catch (error) {
    return manejarError(res, error, "Error al actualizar el espacio académico");
  }
};

const eliminarEspacioAcademico = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const resultado = await pool.query(
      `DELETE FROM espacio_academico WHERE id_espacio_academico = $1 RETURNING id_espacio_academico`,
      [id]
    );
    if (!resultado.rows.length) return noEncontrado(res, "Espacio académico");

    return res.status(200).json({ success: true, mensaje: "Espacio académico eliminado correctamente" });
  } catch (error) {
    return manejarError(res, error, "Error al eliminar el espacio académico");
  }
};

const listarSemestres = async (req, res) => {
  try {
    const { id_programa } = req.query;
    const valores = [];
    let where = "";

    if (id_programa) {
      const idProg = idValido(id_programa);
      if (!idProg) return res.status(400).json({ success: false, mensaje: "id_programa inválido" });
      valores.push(idProg);
      where = "WHERE s.id_programa = $1";
    }

    const resultado = await pool.query(
      `
      SELECT
        s.id_semestre,
        s.numero,
        s.nombre,
        s.id_programa,
        p.nombre AS programa,
        COUNT(g.id_grupo) AS cantidad_grupos
      FROM semestre s
      LEFT JOIN programa p ON p.id_programa = s.id_programa
      LEFT JOIN grupo g ON g.id_semestre = s.id_semestre
      ${where}
      GROUP BY s.id_semestre, s.numero, s.nombre, s.id_programa, p.nombre
      ORDER BY p.nombre ASC NULLS LAST, s.numero ASC
      `,
      valores
    );

    return res.status(200).json({
      success: true,
      cantidad: resultado.rows.length,
      semestres: resultado.rows.map((f) => ({ ...f, cantidad_grupos: Number(f.cantidad_grupos) }))
    });
  } catch (error) {
    return manejarError(res, error, "Error al listar los semestres");
  }
};

const obtenerSemestre = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const resultado = await pool.query(
      `
      SELECT s.id_semestre, s.numero, s.nombre, s.id_programa, p.nombre AS programa
      FROM semestre s
      LEFT JOIN programa p ON p.id_programa = s.id_programa
      WHERE s.id_semestre = $1
      `,
      [id]
    );
    if (!resultado.rows.length) return noEncontrado(res, "Semestre");

    return res.status(200).json({ success: true, semestre: resultado.rows[0] });
  } catch (error) {
    return manejarError(res, error, "Error al consultar el semestre");
  }
};

const validarSemestre = ({ numero, nombre, id_programa }, parcial = false) => {
  if (!parcial || numero !== undefined) {
    const n = Number(numero);
    if (!Number.isInteger(n) || n < 1 || n > 12) return "El número de semestre debe ser un entero entre 1 y 12";
  }
  if (!parcial || nombre !== undefined) {
    if (!textoValido(nombre)) return "El nombre es obligatorio";
  }
  if (!parcial || id_programa !== undefined) {
    if (!idValido(id_programa)) return "El programa es obligatorio";
  }
  return null;
};

const crearSemestre = async (req, res) => {
  try {
    const error = validarSemestre(req.body);
    if (error) return res.status(400).json({ success: false, mensaje: error });

    const { numero, nombre, id_programa } = req.body;

    const duplicado = await pool.query(
      `SELECT 1 FROM semestre WHERE id_programa = $1 AND numero = $2`,
      [id_programa, numero]
    );
    if (duplicado.rows.length) {
      return res.status(409).json({
        success: false,
        mensaje: "Ya existe ese número de semestre en el programa"
      });
    }

    const resultado = await pool.query(
      `INSERT INTO semestre (numero, nombre, id_programa) VALUES ($1, $2, $3) RETURNING *`,
      [Number(numero), nombre.trim(), id_programa]
    );

    return res.status(201).json({
      success: true,
      mensaje: "Semestre creado correctamente",
      semestre: resultado.rows[0]
    });
  } catch (error) {
    return manejarError(res, error, "Error al crear el semestre");
  }
};

const actualizarSemestre = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const { numero, nombre, id_programa } = req.body;
    if (numero === undefined && nombre === undefined && id_programa === undefined) {
      return res.status(400).json({ success: false, mensaje: "No se enviaron campos para actualizar" });
    }

    const error = validarSemestre(req.body, true);
    if (error) return res.status(400).json({ success: false, mensaje: error });

    const actual = await pool.query(`SELECT numero, id_programa FROM semestre WHERE id_semestre = $1`, [id]);
    if (!actual.rows.length) return noEncontrado(res, "Semestre");

    const numeroFinal = numero !== undefined ? Number(numero) : actual.rows[0].numero;
    const programaFinal = id_programa !== undefined ? id_programa : actual.rows[0].id_programa;

    const duplicado = await pool.query(
      `SELECT 1 FROM semestre WHERE id_programa = $1 AND numero = $2 AND id_semestre <> $3`,
      [programaFinal, numeroFinal, id]
    );
    if (duplicado.rows.length) {
      return res.status(409).json({
        success: false,
        mensaje: "Ya existe ese número de semestre en el programa"
      });
    }

    const resultado = await pool.query(
      `
      UPDATE semestre
      SET numero = $1,
          nombre = COALESCE($2, nombre),
          id_programa = $3
      WHERE id_semestre = $4
      RETURNING *
      `,
      [numeroFinal, nombre ? nombre.trim() : null, programaFinal, id]
    );

    return res.status(200).json({
      success: true,
      mensaje: "Semestre actualizado correctamente",
      semestre: resultado.rows[0]
    });
  } catch (error) {
    return manejarError(res, error, "Error al actualizar el semestre");
  }
};

const eliminarSemestre = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const resultado = await pool.query(
      `DELETE FROM semestre WHERE id_semestre = $1 RETURNING id_semestre`,
      [id]
    );
    if (!resultado.rows.length) return noEncontrado(res, "Semestre");

    return res.status(200).json({ success: true, mensaje: "Semestre eliminado correctamente" });
  } catch (error) {
    return manejarError(res, error, "Error al eliminar el semestre");
  }
};

const FORMATO_PERIODO = /^\d{4}-[1-3]$/;
const normalizarJornada = (valor) => {
  const t = valor.trim().toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const SELECT_GRUPO = `
  SELECT
    g.id_grupo,
    g.nombre,
    g.jornada,
    g.codigo_jornada,
    g.periodo,
    g.id_semestre,
    s.numero AS semestre,
    s.id_programa,
    p.nombre AS programa
  FROM grupo g
  LEFT JOIN semestre s ON s.id_semestre = g.id_semestre
  LEFT JOIN programa p ON p.id_programa = s.id_programa
`;

const validarGrupo = async (datos, parcial = false) => {
  const { nombre, jornada, periodo, id_semestre } = datos;

  if (!parcial || nombre !== undefined) {
    if (!textoValido(nombre)) return "El nombre del grupo es obligatorio";
  }
  if (!parcial || jornada !== undefined) {
    if (!textoValido(jornada)) return "La jornada es obligatoria (por ejemplo Diurna o Nocturna)";
  }
  if (!parcial || periodo !== undefined) {
    if (!textoValido(periodo) || !FORMATO_PERIODO.test(periodo.trim())) {
      return "El periodo debe tener el formato AAAA-N (por ejemplo 2026-1)";
    }
  }
  if (!parcial || id_semestre !== undefined) {
    if (!idValido(id_semestre)) return "El semestre es obligatorio";
    const existe = await pool.query(`SELECT 1 FROM semestre WHERE id_semestre = $1`, [id_semestre]);
    if (!existe.rows.length) return "El semestre indicado no existe";
  }
  return null;
};

const listarGrupos = async (req, res) => {
  try {
    const { jornada, periodo, id_semestre, id_programa, buscar } = req.query;
    const valores = [];
    const condiciones = [];

    if (textoValido(jornada)) {
      valores.push(jornada.trim().toLowerCase());
      condiciones.push(`lower(trim(g.jornada)) = $${valores.length}`);
    }
    if (textoValido(periodo)) {
      valores.push(periodo.trim());
      condiciones.push(`g.periodo = $${valores.length}`);
    }
    if (id_semestre) {
      const id = idValido(id_semestre);
      if (!id) return res.status(400).json({ success: false, mensaje: "id_semestre inválido" });
      valores.push(id);
      condiciones.push(`g.id_semestre = $${valores.length}`);
    }
    if (id_programa) {
      const id = idValido(id_programa);
      if (!id) return res.status(400).json({ success: false, mensaje: "id_programa inválido" });
      valores.push(id);
      condiciones.push(`s.id_programa = $${valores.length}`);
    }
    if (textoValido(buscar)) {
      valores.push(`%${buscar.trim()}%`);
      condiciones.push(`g.nombre ILIKE $${valores.length}`);
    }

    const resultado = await pool.query(
      `${SELECT_GRUPO}
       ${condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : ""}
       ORDER BY g.periodo DESC NULLS LAST, s.numero ASC NULLS LAST, g.nombre ASC`,
      valores
    );

    return res.status(200).json({
      success: true,
      cantidad: resultado.rows.length,
      grupos: resultado.rows
    });
  } catch (error) {
    return manejarError(res, error, "Error al listar los grupos");
  }
};

const obtenerGrupo = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const resultado = await pool.query(`${SELECT_GRUPO} WHERE g.id_grupo = $1`, [id]);
    if (!resultado.rows.length) return noEncontrado(res, "Grupo");

    return res.status(200).json({ success: true, grupo: resultado.rows[0] });
  } catch (error) {
    return manejarError(res, error, "Error al consultar el grupo");
  }
};

const crearGrupo = async (req, res) => {
  try {
    const error = await validarGrupo(req.body);
    if (error) return res.status(400).json({ success: false, mensaje: error });

    const { nombre, jornada, periodo, id_semestre, codigo_jornada } = req.body;

    const duplicado = await pool.query(
      `SELECT 1 FROM grupo WHERE lower(trim(nombre)) = lower($1) AND periodo = $2 AND id_semestre = $3`,
      [nombre.trim(), periodo.trim(), id_semestre]
    );
    if (duplicado.rows.length) {
      return res.status(409).json({
        success: false,
        mensaje: "Ya existe un grupo con ese nombre en ese semestre y periodo"
      });
    }

    const resultado = await pool.query(
      `
      INSERT INTO grupo (nombre, jornada, periodo, id_semestre, codigo_jornada)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_grupo
      `,
      [
        nombre.trim(),
        normalizarJornada(jornada),
        periodo.trim(),
        id_semestre,
        textoValido(codigo_jornada) ? codigo_jornada.trim().toUpperCase() : null
      ]
    );

    const grupo = await pool.query(`${SELECT_GRUPO} WHERE g.id_grupo = $1`, [resultado.rows[0].id_grupo]);

    return res.status(201).json({
      success: true,
      mensaje: "Grupo creado correctamente",
      grupo: grupo.rows[0]
    });
  } catch (error) {
    return manejarError(res, error, "Error al crear el grupo");
  }
};

const actualizarGrupo = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const campos = ["nombre", "jornada", "periodo", "id_semestre", "codigo_jornada"];
    if (!campos.some((c) => req.body[c] !== undefined)) {
      return res.status(400).json({ success: false, mensaje: "No se enviaron campos para actualizar" });
    }

    const error = await validarGrupo(req.body, true);
    if (error) return res.status(400).json({ success: false, mensaje: error });

    const actual = await pool.query(
      `SELECT nombre, jornada, periodo, id_semestre, codigo_jornada FROM grupo WHERE id_grupo = $1`,
      [id]
    );
    if (!actual.rows.length) return noEncontrado(res, "Grupo");

    const final = {
      nombre: req.body.nombre !== undefined ? req.body.nombre.trim() : actual.rows[0].nombre,
      jornada:
        req.body.jornada !== undefined ? normalizarJornada(req.body.jornada) : actual.rows[0].jornada,
      periodo: req.body.periodo !== undefined ? req.body.periodo.trim() : actual.rows[0].periodo,
      id_semestre:
        req.body.id_semestre !== undefined ? req.body.id_semestre : actual.rows[0].id_semestre,
      codigo_jornada:
        req.body.codigo_jornada !== undefined
          ? textoValido(req.body.codigo_jornada)
            ? req.body.codigo_jornada.trim().toUpperCase()
            : null
          : actual.rows[0].codigo_jornada
    };

    const duplicado = await pool.query(
      `SELECT 1 FROM grupo
       WHERE lower(trim(nombre)) = lower($1) AND periodo = $2 AND id_semestre = $3 AND id_grupo <> $4`,
      [final.nombre, final.periodo, final.id_semestre, id]
    );
    if (duplicado.rows.length) {
      return res.status(409).json({
        success: false,
        mensaje: "Ya existe un grupo con ese nombre en ese semestre y periodo"
      });
    }

    await pool.query(
      `
      UPDATE grupo
      SET nombre = $1, jornada = $2, periodo = $3, id_semestre = $4, codigo_jornada = $5
      WHERE id_grupo = $6
      `,
      [final.nombre, final.jornada, final.periodo, final.id_semestre, final.codigo_jornada, id]
    );

    const grupo = await pool.query(`${SELECT_GRUPO} WHERE g.id_grupo = $1`, [id]);

    return res.status(200).json({
      success: true,
      mensaje: "Grupo actualizado correctamente",
      grupo: grupo.rows[0]
    });
  } catch (error) {
    return manejarError(res, error, "Error al actualizar el grupo");
  }
};

const eliminarGrupo = async (req, res) => {
  try {
    const id = idValido(req.params.id);
    if (!id) return res.status(400).json({ success: false, mensaje: "Identificador inválido" });

    const resultado = await pool.query(`DELETE FROM grupo WHERE id_grupo = $1 RETURNING id_grupo`, [id]);
    if (!resultado.rows.length) return noEncontrado(res, "Grupo");

    return res.status(200).json({ success: true, mensaje: "Grupo eliminado correctamente" });
  } catch (error) {
    return manejarError(res, error, "Error al eliminar el grupo");
  }
};

const listarJornadas = async (req, res) => {
  try {
    const resultado = await pool.query(
      `
      SELECT
        initcap(lower(trim(jornada))) AS jornada,
        COUNT(*) AS cantidad_grupos,
        COUNT(DISTINCT id_semestre) AS cantidad_semestres
      FROM grupo
      WHERE jornada IS NOT NULL AND trim(jornada) <> ''
      GROUP BY initcap(lower(trim(jornada)))
      ORDER BY 1 ASC
      `
    );

    const sinJornada = await pool.query(
      `SELECT COUNT(*) AS total FROM grupo WHERE jornada IS NULL OR trim(jornada) = ''`
    );

    return res.status(200).json({
      success: true,
      cantidad: resultado.rows.length,
      jornadas: resultado.rows.map((f) => ({
        jornada: f.jornada,
        cantidad_grupos: Number(f.cantidad_grupos),
        cantidad_semestres: Number(f.cantidad_semestres)
      })),
      grupos_sin_jornada: Number(sinJornada.rows[0]?.total ?? 0)
    });
  } catch (error) {
    return manejarError(res, error, "Error al listar las jornadas");
  }
};

const actualizarJornada = async (req, res) => {
  try {
    const actual = req.params.jornada;
    const { jornada } = req.body;

    if (!textoValido(jornada)) {
      return res.status(400).json({ success: false, mensaje: "El nombre de la jornada es obligatorio" });
    }

    const resultado = await pool.query(
      `UPDATE grupo SET jornada = $1 WHERE lower(trim(jornada)) = lower(trim($2)) RETURNING id_grupo`,
      [normalizarJornada(jornada), actual]
    );
    if (!resultado.rows.length) return noEncontrado(res, "Jornada");

    return res.status(200).json({
      success: true,
      mensaje: "Jornada actualizada correctamente",
      grupos_actualizados: resultado.rows.length
    });
  } catch (error) {
    return manejarError(res, error, "Error al actualizar la jornada");
  }
};

const listarPeriodos = async (req, res) => {
  try {
    const resultado = await pool.query(
      `
      SELECT
        trim(periodo) AS periodo,
        COUNT(*) AS cantidad_grupos,
        COUNT(DISTINCT id_semestre) AS cantidad_semestres
      FROM grupo
      WHERE periodo IS NOT NULL AND trim(periodo) <> ''
      GROUP BY trim(periodo)
      ORDER BY 1 DESC
      `
    );

    return res.status(200).json({
      success: true,
      cantidad: resultado.rows.length,
      periodos: resultado.rows.map((f) => ({
        periodo: f.periodo,
        formato_valido: FORMATO_PERIODO.test(f.periodo),
        cantidad_grupos: Number(f.cantidad_grupos),
        cantidad_semestres: Number(f.cantidad_semestres)
      }))
    });
  } catch (error) {
    return manejarError(res, error, "Error al listar los periodos");
  }
};

const actualizarPeriodo = async (req, res) => {
  try {
    const actual = req.params.periodo;
    const nuevo = typeof req.body.periodo === "string" ? req.body.periodo.trim() : "";

    if (!FORMATO_PERIODO.test(nuevo)) {
      return res.status(400).json({
        success: false,
        mensaje: "El periodo debe tener el formato AAAA-N (por ejemplo 2026-1)"
      });
    }

    const resultado = await pool.query(
      `UPDATE grupo SET periodo = $1 WHERE trim(periodo) = trim($2) RETURNING id_grupo`,
      [nuevo, actual]
    );
    if (!resultado.rows.length) return noEncontrado(res, "Periodo");

    return res.status(200).json({
      success: true,
      mensaje: "Periodo actualizado correctamente",
      grupos_actualizados: resultado.rows.length
    });
  } catch (error) {
    return manejarError(res, error, "Error al actualizar el periodo");
  }
};

module.exports = {
  listarComponentes,
  obtenerComponente,
  crearComponente,
  actualizarComponente,
  eliminarComponente,
  listarEspaciosAcademicos,
  obtenerEspacioAcademico,
  crearEspacioAcademico,
  actualizarEspacioAcademico,
  eliminarEspacioAcademico,
  listarSemestres,
  obtenerSemestre,
  crearSemestre,
  actualizarSemestre,
  eliminarSemestre,
  listarGrupos,
  obtenerGrupo,
  crearGrupo,
  actualizarGrupo,
  eliminarGrupo,
  listarJornadas,
  actualizarJornada,
  listarPeriodos,
  actualizarPeriodo
};