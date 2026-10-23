const pool = require("../config/database");
const { ErrorServicio } = require("../utils/Errores");
const { vacio, validarEnteros } = require("../utils/Validaciones");
const { condicionAlcance } = require("./Alcance");

const CAMPOS_FICHA = [
  "id_espacio_academico", "id_programa", "id_grupo",
  "id_componente", "id_rap", "id_competencia_programa",
  "codigo_documento", "version_documento", "fecha_formato",
  "codigo_espacio", "componente", "periodo", "anio",
  "resultado_aprendizaje", "competencia_central", "objetivo_aprendizaje",
  "observaciones", "correo_docente", "celular_docente",
  "horario_atencion", "lugar_atencion", "estado",
];

const REQUERIDOS = ["id_espacio_academico", "id_programa", "id_grupo", "periodo", "anio"];

const ENTEROS = [
  "id_espacio_academico", "id_programa", "id_grupo",
  "id_componente", "id_rap", "id_competencia_programa", "anio",
];

const errorHttp = (status, message) => new ErrorServicio(status, message);
const sinAcentos = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const aMayus = (v) => sinAcentos(v).trim().toUpperCase().replace(/\s+/g, "_");

const MENSAJES_DUPLICADO = {
  uq_ficha_espacio_grupo_periodo: "Ya existe una ficha tuya para ese espacio académico, grupo, periodo y año",
  uq_ficha_semana: "Hay dos semanas con el mismo número en la ficha",
  uq_ficha_firma_rol: "Hay dos firmas con el mismo rol en la ficha",
};

const MESES = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
};

function parseRangoSemana(texto, anio) {
  const m = /(\d{1,2})\s+de\s+([a-záéíóú]+)\s+al\s+(\d{1,2})\s+de\s+([a-záéíóú]+)/i.exec(texto || "");
  if (!m || !anio) return {};
  const mi = MESES[sinAcentos(m[2]).toLowerCase()];
  const mf = MESES[sinAcentos(m[4]).toLowerCase()];
  if (!mi || !mf) return {};
  const iso = (mo, d) => `${anio}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { fecha_inicio: iso(mi, m[1]), fecha_fin: iso(mf, m[3]) };
}

function inferirTipoSemana(titulo = "") {
  const t = sinAcentos(titulo).toLowerCase();
  if (t.includes("induccion")) return "INDUCCION";
  if (t.includes("salida academica")) return "SALIDA_ACADEMICA";
  if (t.includes("examen final")) return "EXAMEN_FINAL";
  if (t.includes("evaluacion") && t.includes("corte")) return "EVALUACION_CORTE";
  return null;
}

const aLineas = (v) =>
  Array.isArray(v)
    ? v
    : String(v ?? "")
        .split(/\r?\n/)
        .map((l) => l.replace(/^[\s•\-–*]+/, "").trim())
        .filter(Boolean);

const parseContenido = (v) =>
  aLineas(v).map((x) => (typeof x === "string" ? { tema: null, descripcion: x } : x));

const parseEstrategias = (v) =>
  aLineas(v).map((x) => {
    if (typeof x !== "string") return x;
    const i = x.indexOf(":");
    return i > 0
      ? { nombre: x.slice(0, i).trim(), descripcion: x.slice(i + 1).trim() || null }
      : { nombre: x, descripcion: null };
  });

function parseEvaluaciones(v, nSemana) {
  const out = [];
  for (const x of aLineas(v)) {
    if (typeof x !== "string") { out.push(x); continue; }
    if (/^estrategia\s+evaluativa:?$/i.test(x)) continue;

    const m = /^(formativa|sumativa)\s*(?:\(\s*corte\s*(\d)\s*\))?\s*:?\s*(.*)$/i.exec(x);
    if (m) {
      out.push({ tipo: m[1], corte: m[2] ? Number(m[2]) : null, descripcion: m[3] || null });
    } else if (/^no aplica/i.test(x)) {
      out.push({ tipo: "NO_APLICA", descripcion: x });
    } else if (out.length) {
      const ult = out[out.length - 1];
      ult.descripcion = [ult.descripcion, x].filter(Boolean).join(" ");
    } else {
      throw errorHttp(400, `Semana ${nSemana}: la evaluación debe empezar con "Formativa:" o "Sumativa:" -> "${x}"`);
    }
  }
  return out;
}

async function adaptarPayloadFrontend(body = {}) {
  const b = { ...body };

  b.resultado_aprendizaje ??= b.rap_tributa;
  b.version_documento ??= b.version;
  b.fecha_formato ??= b.fecha_documento;
  b.correo_docente ??= b.docente_correo;
  b.celular_docente ??= b.docente_celular;
  b.horario_atencion ??= b.docente_atencion;
  b.lugar_atencion ??= b.docente_lugar;

  if (b.id_grupo && !b.id_programa) {
    const { rows } = await pool.query(
      `SELECT sm.id_programa
         FROM grupo g JOIN semestre sm ON sm.id_semestre = g.id_semestre
        WHERE g.id_grupo = $1`,
      [b.id_grupo]
    );
    if (rows.length === 0) throw errorHttp(400, `No existe el grupo con id ${b.id_grupo}`);
    b.id_programa = rows[0].id_programa;
  } else if (b.grupo && !b.id_grupo) {
    const { rows } = await pool.query(
      `SELECT g.id_grupo, sm.id_programa,
              EXISTS (SELECT 1 FROM programa_espacio pe
                       WHERE pe.id_programa = sm.id_programa
                         AND pe.id_espacio_academico = $2::int) AS espacio_en_programa
         FROM grupo g
         JOIN semestre sm ON sm.id_semestre = g.id_semestre
        WHERE upper(trim(g.codigo_jornada)) = upper(trim($1))
           OR upper(trim(g.nombre))         = upper(trim($1))
        ORDER BY espacio_en_programa DESC,
                 (g.periodo = $3) DESC,
                 g.id_grupo DESC
        LIMIT 1`,
      [b.grupo, b.id_espacio_academico ?? null, b.periodo ?? ""]
    );
    if (rows.length === 0)
      throw errorHttp(400, `No existe ningún grupo con nombre o código de jornada "${b.grupo}"`);
    b.id_grupo = rows[0].id_grupo;
    b.id_programa = rows[0].id_programa;
  }

  if (Array.isArray(b.semanas)) {
    b.semanas = b.semanas.map((s, i) => {
      const texto = s.semana ?? "";
      const num = /semana\s+(\d+)/i.exec(texto);
      const numero = s.numero_semana ?? (num ? Number(num[1]) : i + 1);
      const titulo = s.titulo ?? s.tema ?? null;

      return {
        ...s,
        numero_semana: numero,
        ...parseRangoSemana(texto, b.anio),
        titulo,
        tipo_semana: s.tipo_semana ?? inferirTipoSemana(titulo ?? ""),
        contenido_analitico: s.contenido_analitico ?? parseContenido(s.contenido),
        estrategias: s.estrategias_didacticas
          ? parseEstrategias(s.estrategias_didacticas)
          : Array.isArray(s.estrategias) && typeof s.estrategias[0] === "object"
            ? s.estrategias
            : parseEstrategias(s.estrategias),
        evaluaciones: s.evaluaciones ?? parseEvaluaciones(s.evaluacion, numero),
      };
    });
  }

  if (!Array.isArray(b.firmas) && b.docente_nombre) {
    b.firmas = [{ rol: "DOCENTE", nombre: b.docente_nombre, fecha: b.fecha_firma ?? null }];
  }
  return b;
}

function normalizarBody(b = {}) {
  const out = { ...b };

  for (const k of CAMPOS_FICHA) if (out[k] === "") out[k] = null;
  for (const k of ENTEROS) if (out[k] != null) out[k] = Number(out[k]);

  if (Array.isArray(out.semanas)) {
    out.semanas = out.semanas.map((s, i) => ({
      ...s,
      numero_semana: s.numero_semana ? Number(s.numero_semana) : i + 1,
      fecha_inicio: s.fecha_inicio || null,
      fecha_fin: s.fecha_fin || null,
      tipo_semana: s.tipo_semana ? aMayus(s.tipo_semana) : null,
      titulo: s.titulo || null,
      contenido_analitico: (s.contenido_analitico || []).filter(
        (c) => c.descripcion && String(c.descripcion).trim()
      ),
      estrategias: (s.estrategias || []).filter(
        (e) => e.nombre && String(e.nombre).trim()
      ),
      evaluaciones: (s.evaluaciones || [])
        .filter((v) => v.tipo)
        .map((v) => ({ ...v, tipo: aMayus(v.tipo), corte: v.corte ? Number(v.corte) : null })),
    }));
  }

  if (Array.isArray(out.firmas)) {
    out.firmas = out.firmas
      .filter((f) => f.rol && f.nombre)
      .map((f) => ({ ...f, rol: aMayus(f.rol), fecha: f.fecha || null }));
  }
  return out;
}

async function insertarSemanas(client, idFicha, semanas = []) {
  for (const [i, s] of semanas.entries()) {
    const { rows } = await client.query(
      `INSERT INTO ficha_semana
         (id_ficha, numero_semana, fecha_inicio, fecha_fin, tipo_semana, titulo)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'CONTENIDO'), $6)
       RETURNING id_semana`,
      [idFicha, s.numero_semana ?? i + 1, s.fecha_inicio ?? null, s.fecha_fin ?? null,
       s.tipo_semana ?? null, s.titulo ?? null]
    );
    const idSemana = rows[0].id_semana;

    for (const [j, c] of (s.contenido_analitico || []).entries()) {
      await client.query(
        `INSERT INTO ficha_contenido_analitico (id_semana, orden, tema, descripcion)
         VALUES ($1, $2, $3, $4)`,
        [idSemana, j + 1, c.tema ?? null, c.descripcion]
      );
    }
    for (const [j, e] of (s.estrategias || []).entries()) {
      await client.query(
        `INSERT INTO ficha_estrategia_didactica (id_semana, orden, nombre, descripcion)
         VALUES ($1, $2, $3, $4)`,
        [idSemana, j + 1, e.nombre, e.descripcion ?? null]
      );
    }
    for (const [j, v] of (s.evaluaciones || []).entries()) {
      await client.query(
        `INSERT INTO ficha_semana_evaluacion (id_semana, orden, tipo, corte, descripcion)
         VALUES ($1, $2, $3, $4, $5)`,
        [idSemana, j + 1, v.tipo, v.corte ?? null, v.descripcion ?? null]
      );
    }
  }
}

async function insertarFirmas(client, idFicha, idUsuario, firmas = []) {
  for (const f of firmas) {
    await client.query(
      `INSERT INTO ficha_firma (id_ficha, rol, id_usuario, nombre, firma, fecha)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [idFicha, f.rol, f.rol === "DOCENTE" ? idUsuario : f.id_usuario ?? null,
       f.nombre, f.firma ?? null, f.fecha ?? null]
    );
  }
}

async function cargarFichaCompleta(db, idFicha) {
  const cab = await db.query(
    `SELECT f.*,
            e.nombre  AS espacio_academico,
            p.nombre  AS programa,
            g.nombre  AS grupo,
            g.codigo_jornada,
            sm.numero AS semestre,
            trim(u.nombre || ' ' || COALESCE(u.apellido, '')) AS docente
       FROM ficha_desarrollo_tematico f
       JOIN espacio_academico e ON e.id_espacio_academico = f.id_espacio_academico
       JOIN programa p          ON p.id_programa = f.id_programa
       JOIN grupo g             ON g.id_grupo = f.id_grupo
       JOIN semestre sm         ON sm.id_semestre = g.id_semestre
       JOIN usuarios u          ON u.id_user = f.id_user_docente
      WHERE f.id_ficha = $1`,
    [idFicha]
  );
  if (cab.rowCount === 0) return null;

  const semanas = await db.query(
    `SELECT s.*,
        COALESCE((SELECT json_agg(c ORDER BY c.orden)
                    FROM ficha_contenido_analitico c WHERE c.id_semana = s.id_semana), '[]') AS contenido_analitico,
        COALESCE((SELECT json_agg(d ORDER BY d.orden)
                    FROM ficha_estrategia_didactica d WHERE d.id_semana = s.id_semana), '[]') AS estrategias,
        COALESCE((SELECT json_agg(v ORDER BY v.orden)
                    FROM ficha_semana_evaluacion v WHERE v.id_semana = s.id_semana), '[]') AS evaluaciones
       FROM ficha_semana s
      WHERE s.id_ficha = $1
      ORDER BY s.numero_semana`,
    [idFicha]
  );

  const firmas = await db.query(
    `SELECT * FROM ficha_firma WHERE id_ficha = $1 ORDER BY rol`,
    [idFicha]
  );

  return { ...cab.rows[0], semanas: semanas.rows, firmas: firmas.rows };
}

async function listar(alcance, filtros = {}) {
  validarEnteros({
    id_docente: filtros.id_docente,
    id_grupo: filtros.id_grupo,
    id_espacio_academico: filtros.id_espacio_academico,
    id_programa: filtros.id_programa,
    anio: filtros.anio,
  });

  const vals = [];
  const where = [condicionAlcance(alcance, vals, "f", "u")];
  const agregar = (condicion, valor) => {
    vals.push(valor);
    where.push(condicion.replace("?", `$${vals.length}`));
  };

  if (!vacio(filtros.id_docente)) agregar("f.id_user_docente = ?", filtros.id_docente);
  if (!vacio(filtros.id_grupo)) agregar("f.id_grupo = ?", filtros.id_grupo);
  if (!vacio(filtros.id_espacio_academico)) agregar("f.id_espacio_academico = ?", filtros.id_espacio_academico);
  if (!vacio(filtros.id_programa)) agregar("f.id_programa = ?", filtros.id_programa);
  if (!vacio(filtros.periodo)) agregar("f.periodo = ?", filtros.periodo);
  if (!vacio(filtros.anio)) agregar("f.anio = ?", filtros.anio);
  if (!vacio(filtros.estado)) agregar("LOWER(f.estado) = LOWER(?)", filtros.estado);

  const { rows } = await pool.query(
    `SELECT f.id_ficha, f.id_user_docente, f.id_programa, f.periodo, f.anio, f.estado,
            f.fecha_actualizacion,
            p.nombre AS programa,
            e.nombre AS espacio_academico,
            g.nombre AS grupo, g.codigo_jornada,
            trim(u.nombre || ' ' || COALESCE(u.apellido, '')) AS docente,
            u.correo AS docente_correo,
            (SELECT count(*) FROM ficha_semana s WHERE s.id_ficha = f.id_ficha)::int AS total_semanas
       FROM ficha_desarrollo_tematico f
       JOIN espacio_academico e ON e.id_espacio_academico = f.id_espacio_academico
       JOIN programa p          ON p.id_programa = f.id_programa
       JOIN grupo g             ON g.id_grupo = f.id_grupo
       JOIN usuarios u          ON u.id_user = f.id_user_docente
      WHERE ${where.join(" AND ")}
      ORDER BY f.anio DESC, f.periodo DESC, e.nombre`,
    vals
  );
  return rows;
}

async function obtener(alcance, idFicha) {
  const vals = [idFicha];
  const cond = condicionAlcance(alcance, vals, "f", "u");

  const visible = await pool.query(
    `SELECT 1
       FROM ficha_desarrollo_tematico f
       JOIN usuarios u ON u.id_user = f.id_user_docente
      WHERE f.id_ficha = $1 AND ${cond}`,
    vals
  );
  if (visible.rowCount === 0) throw new ErrorServicio(404, "Ficha no encontrada");

  return cargarFichaCompleta(pool, idFicha);
}

/* --------------- Escritura: siempre sobre las fichas del propio usuario --------------- */

async function crear(idUsuario, body = {}) {
  const b = normalizarBody(await adaptarPayloadFrontend(body));

  const faltan = REQUERIDOS.filter((k) => b[k] === undefined || b[k] === null || b[k] === "");
  if (faltan.length) throw new ErrorServicio(400, `Faltan campos: ${faltan.join(", ")}`);

  const client = await pool.connect();
  let idFicha;
  try {
    await client.query("BEGIN");

    const cols = ["id_user_docente", ...CAMPOS_FICHA.filter((c) => b[c] !== undefined && b[c] !== null)];
    const vals = [idUsuario, ...cols.slice(1).map((c) => b[c])];

    const { rows } = await client.query(
      `INSERT INTO ficha_desarrollo_tematico (${cols.join(", ")})
       VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})
       RETURNING id_ficha`,
      vals
    );
    idFicha = rows[0].id_ficha;

    await insertarSemanas(client, idFicha, b.semanas);
    await insertarFirmas(client, idFicha, idUsuario, b.firmas);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return cargarFichaCompleta(pool, idFicha);
}

async function actualizar(idUsuario, idFicha, body = {}) {
  const b = normalizarBody(await adaptarPayloadFrontend(body));

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const propia = await client.query(
      `SELECT 1 FROM ficha_desarrollo_tematico
        WHERE id_ficha = $1 AND id_user_docente = $2 FOR UPDATE`,
      [idFicha, idUsuario]
    );
    if (propia.rowCount === 0) {
      throw new ErrorServicio(404, "Ficha no encontrada o no te pertenece");
    }

    const cols = CAMPOS_FICHA.filter((c) => b[c] !== undefined);
    const sets = cols.map((c, i) => `${c} = $${i + 1}`);
    sets.push("fecha_actualizacion = CURRENT_TIMESTAMP");

    await client.query(
      `UPDATE ficha_desarrollo_tematico
          SET ${sets.join(", ")}
        WHERE id_ficha = $${cols.length + 1} AND id_user_docente = $${cols.length + 2}`,
      [...cols.map((c) => b[c]), idFicha, idUsuario]
    );

    if (Array.isArray(b.semanas)) {
      await client.query("DELETE FROM ficha_semana WHERE id_ficha = $1", [idFicha]);
      await insertarSemanas(client, idFicha, b.semanas);
    }
    if (Array.isArray(b.firmas)) {
      await client.query("DELETE FROM ficha_firma WHERE id_ficha = $1", [idFicha]);
      await insertarFirmas(client, idFicha, idUsuario, b.firmas);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  return cargarFichaCompleta(pool, idFicha);
}

async function eliminar(idUsuario, idFicha) {
  const { rowCount } = await pool.query(
    `DELETE FROM ficha_desarrollo_tematico WHERE id_ficha = $1 AND id_user_docente = $2`,
    [idFicha, idUsuario]
  );
  if (rowCount === 0) throw new ErrorServicio(404, "Ficha no encontrada o no te pertenece");
}

module.exports = { listar, obtener, crear, actualizar, eliminar, MENSAJES_DUPLICADO };