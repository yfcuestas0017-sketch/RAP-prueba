import { fetchJSON } from './api.js';

// Capa de datos de "Modalidad de Grado" del estudiante (9.° semestre en adelante).
//
// El backend aún NO expone este módulo. Se intenta el contrato esperado y, si no
// existe (404/405/501 o sin respuesta), el módulo degrada elegante con
// `pendiente: true` para que la vista muestre su UI local sin romperse.
//
// Contrato esperado cuando el backend lo habilite (montado en /api/estudiante/modalidad-grado):
//   GET  -> { modalidad: <objeto|null> }
//   POST -> registra la modalidad seleccionada

const RUTA = '/api/estudiante/modalidad-grado';

export const esModuloPendiente = (error) =>
  !error?.status || [404, 405, 501].includes(error.status);

export async function obtenerModalidadGrado() {
  try {
    const datos = await fetchJSON(RUTA);
    const modalidad = datos?.modalidad ?? datos?.data ?? null;
    return { modalidad, pendiente: false, aviso: '' };
  } catch (error) {
    if (esModuloPendiente(error)) {
      return { modalidad: null, pendiente: true, aviso: '' };
    }
    if (error.status === 403) {
      return { modalidad: null, pendiente: false, aviso: error.message };
    }
    throw error;
  }
}

export function registrarModalidadGrado({ modalidad, motivacion, linea_investigacion }) {
  return fetchJSON(RUTA, {
    method: 'POST',
    body: JSON.stringify({ modalidad, motivacion, linea_investigacion })
  });
}
