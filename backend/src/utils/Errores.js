class ErrorServicio extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const ERRORES_DE_DATOS = ["23514", "23502", "22P02", "22007", "22008"];

function traducirError(err, opciones = {}) {
  const { contexto = "", duplicados = {}, referencia, interno = "Error interno del servidor" } = opciones;

  if (err instanceof ErrorServicio) return { status: err.status, mensaje: err.message };

  console.error(`[${contexto}]`, err.code, err.message, err.detail || "", err.column || "", err.constraint || "");

  const debug =
    process.env.NODE_ENV !== "production"
      ? { code: err.code, column: err.column, constraint: err.constraint, detail: err.detail }
      : undefined;

  if (err.code === "23505") {
    return { status: 409, mensaje: duplicados[err.constraint] || "Registro duplicado", debug };
  }
  if (err.code === "23503") {
    return { status: 400, mensaje: referencia || `Referencia inválida (${err.constraint || err.detail || ""})`, debug };
  }
  if (ERRORES_DE_DATOS.includes(err.code)) {
    return { status: 400, mensaje: err.message, debug };
  }
  return { status: 500, mensaje: interno };
}

module.exports = { ErrorServicio, traducirError };