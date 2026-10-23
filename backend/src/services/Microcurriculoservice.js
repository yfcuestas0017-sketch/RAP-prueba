const pool = require("../config/database");
const { ErrorServicio } = require("../utils/Errores");
const { vacio, esEnteroPositivo, validarEnteros } = require("../utils/Validaciones");
const { condicionAlcance } = require("./Alcance");

const CAMPOS_PERMITIDOS = [
  "id_espacio_academico", "codigo", "version", "fecha_documento", "periodo",
  "modalidad", "nivel", "area", "creditos", "horas_acompanamiento_directo",
  "horas_trabajo_independiente", "prerrequisito", "sintesis", "proposito",
  "justificacion", "competencia_central",
];

const tiene = (obj, campo) => Object.prototype.hasOwnProperty.call(obj, campo);

const SELECT_BASE = `
  SELECT m.*,
         ea.nombre AS espacio_academico,
         trim(u.nombre || ' ' || COALESCE(u.apellido, '')) AS docente,
         u.correo AS docente_correo,
         (SELECT COALESCE(json_agg(json_build_object(
                            'id_programa', p.id_programa,
                            'nombre', p.nombre) ORDER BY p.nombre), '[]')
            FROM programa_espacio pe
            JOIN programa p ON p.id_programa = pe.id_programa
           WHERE pe.id_espacio_academico = m.id_espacio_academico) AS programas
    FROM microcurriculo m
    JOIN espacio_academico ea ON ea.id_espacio_academico = m.id_espacio_academico
    JOIN usuarios u           ON u.id_user = m.id_user_docente`;


async function listar(alcance, filtros = {}) {
  const { id_programa, id_docente, id_espacio_academico, periodo, estado } = filtros;
  validarEnteros({ id_programa, id_docente, id_espacio_academico });

  const vals = [];
  const where = [condicionAlcance(alcance, vals, "m", "u")];
  const agregar = (condicion, valor) => {
    vals.push(valor);
    where.push(condicion.replace("?", `$${vals.length}`));
  };

  if (!vacio(id_programa)) {
    agregar(
      `EXISTS (SELECT 1 FROM programa_espacio pe
                WHERE pe.id_espacio_academico = m.id_espacio_academico
                  AND pe.id_programa = ?)`,
      id_programa
    );
  }
  if (!vacio(id_docente)) agregar("m.id_user_docente = ?", id_docente);
  if (!vacio(id_espacio_academico)) agregar("m.id_espacio_academico = ?", id_espacio_academico);
  if (!vacio(periodo)) agregar("m.periodo = ?", periodo);
  if (!vacio(estado)) agregar("LOWER(m.estado) = LOWER(?)", estado);

  const { rows } = await pool.query(
    `${SELECT_BASE} WHERE ${where.join(" AND ")} ORDER BY m.id_microcurriculo DESC`,
    vals
  );
  return rows;
}

async function obtener(alcance, id) {
  if (!esEnteroPositivo(id)) throw new ErrorServicio(400, "Identificador de microcurrículo inválido");

  const vals = [id];
  const cond = condicionAlcance(alcance, vals, "m", "u");

  const { rows } = await pool.query(
    `${SELECT_BASE} WHERE m.id_microcurriculo = $1 AND ${cond}`,
    vals
  );
  if (rows.length === 0) throw new ErrorServicio(404, "Microcurrículo no encontrado");
  return rows[0];
}

async function listarEspacios() {
  const { rows } = await pool.query(
    `SELECT id_espacio_academico, nombre FROM espacio_academico ORDER BY nombre ASC`
  );
  return rows;
}


async function crear(idUsuario, datos = {}) {
  const idEspacio = Number(datos.id_espacio_academico);
  if (!Number.isInteger(idEspacio) || idEspacio <= 0) {
    throw new ErrorServicio(400, "Debes seleccionar un espacio académico válido");
  }

  const campos = CAMPOS_PERMITIDOS.filter((c) => tiene(datos, c));
  if (!campos.includes("id_espacio_academico") || !datos.periodo || !String(datos.periodo).trim()) {
    throw new ErrorServicio(400, "El espacio académico y el periodo son obligatorios");
  }

  const columnas = [...campos, "id_user_docente"];
  const valores = [...campos.map((c) => datos[c]), idUsuario];

  const { rows } = await pool.query(
    `INSERT INTO microcurriculo (${columnas.join(", ")})
     VALUES (${valores.map((_, i) => `$${i + 1}`).join(", ")})
     RETURNING *`,
    valores
  );
  return rows[0];
}

async function actualizar(idUsuario, idParam, datos = {}) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorServicio(400, "Identificador de microcurrículo inválido");
  }

  const campos = CAMPOS_PERMITIDOS.filter((c) => tiene(datos, c));
  if (campos.length === 0) throw new ErrorServicio(400, "No se enviaron campos para actualizar");

  if (tiene(datos, "id_espacio_academico") && !esEnteroPositivo(datos.id_espacio_academico)) {
    throw new ErrorServicio(400, "El espacio académico no es válido");
  }

  const valores = campos.map((c) => datos[c]);
  const asignaciones = campos.map((c, i) => `${c} = $${i + 1}`);
  asignaciones.push("fecha_actualizacion = CURRENT_TIMESTAMP");
  valores.push(id, idUsuario);

  const { rows } = await pool.query(
    `UPDATE microcurriculo
        SET ${asignaciones.join(", ")}
      WHERE id_microcurriculo = $${valores.length - 1}
        AND id_user_docente = $${valores.length}
      RETURNING *`,
    valores
  );
  if (rows.length === 0) throw new ErrorServicio(404, "Microcurrículo no encontrado o sin permisos");
  return rows[0];
}

async function eliminar(idUsuario, idParam) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorServicio(400, "Identificador de microcurrículo inválido");
  }

  const { rows } = await pool.query(
    `DELETE FROM microcurriculo
      WHERE id_microcurriculo = $1
        AND id_user_docente = $2
        AND LOWER(estado) = 'borrador'
      RETURNING id_microcurriculo`,
    [id, idUsuario]
  );
  if (rows.length === 0) {
    throw new ErrorServicio(404, "No se encontró el borrador o no tienes permiso para eliminarlo");
  }
}

module.exports = { listar, obtener, listarEspacios, crear, actualizar, eliminar };