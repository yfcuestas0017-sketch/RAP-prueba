// Capa de datos del módulo de Pruebas Saber Pro (docente).
//
// IMPORTANTE: el backend todavía no expone endpoints para Saber Pro. Esta capa
// deja la interfaz lista y falla de forma segura:
//   - El permiso se consulta en GET /api/docente/saber-pro/permiso y se asume
//     DENEGADO si el servicio no responde (404 u otro error).
//   - Los listados devuelven una lista vacía cuando el endpoint no existe, para
//     que la vista muestre un estado de "módulo pendiente" en lugar de romperse.
//   - Las acciones de escritura solo se habilitan cuando el permiso es true.
//
// Endpoints que debe implementar el backend (mismo contrato que el resto de la
// API: { success, mensaje, data }):
//   GET    /api/docente/saber-pro/permiso            -> { permitido, puede_publicar }
//   GET    /api/docente/saber-pro/pruebas            -> pruebas del docente
//   POST   /api/docente/saber-pro/pruebas            -> crear prueba
//   PUT    /api/docente/saber-pro/pruebas/:id        -> actualizar prueba
//   DELETE /api/docente/saber-pro/pruebas/:id        -> eliminar prueba
//   POST   /api/docente/saber-pro/pruebas/:id/publicar -> publicar / despublicar
//   GET    /api/docente/saber-pro/pruebas/:id/preguntas
//   POST   /api/docente/saber-pro/pruebas/:id/preguntas
//   PUT    /api/docente/saber-pro/pruebas/:id/preguntas/:idPregunta
//   DELETE /api/docente/saber-pro/pruebas/:id/preguntas/:idPregunta
//   GET    /api/docente/saber-pro/historial          -> evaluaciones aplicadas / por aplicar
//   GET    /api/docente/saber-pro/pruebas/:id/resultados -> resultados por estudiante
//   POST   /api/docente/saber-pro/asistente          -> sugerencias de IA (opcional)
import { fetchJSON } from './api';

const RUTA = '/api/docente/saber-pro';

// El backend aún no existe: estos son los endpoints que se esperan.
export const ENDPOINTS_SABER_PRO = [
  'GET /api/docente/saber-pro/permiso',
  'GET /api/docente/saber-pro/pruebas',
  'POST /api/docente/saber-pro/pruebas',
  'PUT /api/docente/saber-pro/pruebas/:id',
  'DELETE /api/docente/saber-pro/pruebas/:id',
  'POST /api/docente/saber-pro/pruebas/:id/publicar',
  'GET /api/docente/saber-pro/pruebas/:id/preguntas',
  'POST /api/docente/saber-pro/pruebas/:id/preguntas',
  'PUT /api/docente/saber-pro/pruebas/:id/preguntas/:idPregunta',
  'DELETE /api/docente/saber-pro/pruebas/:id/preguntas/:idPregunta',
  'GET /api/docente/saber-pro/historial',
  'GET /api/docente/saber-pro/pruebas/:id/resultados',
  'POST /api/docente/saber-pro/asistente'
];

// Un error se considera "módulo pendiente" cuando el endpoint no existe o no
// está montado (404/501/error de red). Sirve para mostrar avisos amables.
export const esModuloPendiente = (error) =>
  !error?.status || [404, 405, 501].includes(error.status);

// Permiso que otorga el administrador. Sin endpoint -> DENEGADO (seguro).
export async function obtenerPermisoSaberPro() {
  try {
    const datos = await fetchJSON(`${RUTA}/permiso`);
    return {
      permitido: Boolean(datos?.permitido),
      puedePublicar: Boolean(datos?.puede_publicar ?? datos?.permitido)
    };
  } catch (error) {
    console.warn('Permiso de Saber Pro no disponible:', error.message);
    return { permitido: false, puedePublicar: false };
  }
}

// Listados que devuelven [] si el endpoint aún no existe.
async function listarSeguro(path) {
  try {
    const datos = await fetchJSON(path);
    const lista = datos?.data ?? datos?.pruebas ?? datos?.historial ?? datos ?? [];
    return Array.isArray(lista) ? lista : [];
  } catch (error) {
    if (esModuloPendiente(error)) return [];
    throw error;
  }
}

export const listarPruebasSaberPro = () => listarSeguro(`${RUTA}/pruebas`);
export const listarHistorialSaberPro = () => listarSeguro(`${RUTA}/historial`);
export const listarPreguntasSaberPro = (idPrueba) =>
  listarSeguro(`${RUTA}/pruebas/${idPrueba}/preguntas`);

export function crearPruebaSaberPro(datos) {
  return fetchJSON(`${RUTA}/pruebas`, { method: 'POST', body: JSON.stringify(datos) });
}

export function actualizarPruebaSaberPro(idPrueba, datos) {
  return fetchJSON(`${RUTA}/pruebas/${idPrueba}`, { method: 'PUT', body: JSON.stringify(datos) });
}

export function eliminarPruebaSaberPro(idPrueba) {
  return fetchJSON(`${RUTA}/pruebas/${idPrueba}`, { method: 'DELETE' });
}

export function publicarPruebaSaberPro(idPrueba, datos = { estado: 'PUBLICADA' }) {
  return fetchJSON(`${RUTA}/pruebas/${idPrueba}/publicar`, {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

export function crearPreguntaSaberPro(idPrueba, datos) {
  return fetchJSON(`${RUTA}/pruebas/${idPrueba}/preguntas`, {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

export function actualizarPreguntaSaberPro(idPrueba, idPregunta, datos) {
  return fetchJSON(`${RUTA}/pruebas/${idPrueba}/preguntas/${idPregunta}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });
}

export function eliminarPreguntaSaberPro(idPrueba, idPregunta) {
  return fetchJSON(`${RUTA}/pruebas/${idPrueba}/preguntas/${idPregunta}`, { method: 'DELETE' });
}

// Resultados por estudiante de una prueba ya aplicada.
export const obtenerResultadosSaberPro = (idPrueba) =>
  fetchJSON(`${RUTA}/pruebas/${idPrueba}/resultados`);

// Sugerencias de IA (opcional). Si el backend no lo implementa, el asistente
// local (utils/asistenteSaberPro.js) genera los borradores en el navegador.
export function sugerirPreguntasSaberPro(datos) {
  return fetchJSON(`${RUTA}/asistente`, { method: 'POST', body: JSON.stringify(datos) });
}
