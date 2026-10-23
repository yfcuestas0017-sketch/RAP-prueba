// Capa de datos del módulo de evaluaciones del docente.
//
// IMPORTANTE: el CRUD de evaluaciones (crear / actualizar / eliminar) y el
// permiso que el administrador otorga al docente dependen de endpoints que el
// backend todavía no expone. Mientras tanto:
//   - El permiso se consulta en GET /api/docente/evaluaciones/permiso y se
//     asume DENEGADO si el servicio no responde (estado 404 u otro error).
//   - Las acciones de escritura quedan disponibles en la interfaz solo
//     cuando ese permiso sea true; hasta entonces el modo CRUD permanece
//     bloqueado para el docente.
import { fetchJSON } from './api';

const RUTA = '/api/docente/evaluaciones';

export async function obtenerPermisoCrudEvaluaciones() {
  try {
    const datos = await fetchJSON(`${RUTA}/permiso`);
    return Boolean(datos?.permitido);
  } catch (error) {
    // Sin endpoint de permisos (o sin acceso) el modo CRUD queda deshabilitado.
    console.warn('Permiso CRUD de evaluaciones no disponible:', error.message);
    return false;
  }
}

export function crearEvaluacion(datos) {
  return fetchJSON(RUTA, {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

export function actualizarEvaluacion(idEvaluacion, datos) {
  return fetchJSON(`${RUTA}/${idEvaluacion}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });
}

export function eliminarEvaluacion(idEvaluacion) {
  return fetchJSON(`${RUTA}/${idEvaluacion}`, {
    method: 'DELETE'
  });
}
