import { fetchJSON } from './api';

// Capa de datos para el módulo de Fichas de Desarrollo Temático (DOC-CU-FR-003).
// El backend debe montar estas rutas en /api/docente/fichas-desarrollo.

// Lista las fichas del docente autenticado.
export const listarFichas = () =>
  fetchJSON('/api/docente/fichas-desarrollo');

// Obtiene el detalle de una ficha.
export const obtenerFicha = (id) =>
  fetchJSON(`/api/docente/fichas-desarrollo/${id}`);

// Crea una ficha nueva.
export const crearFicha = (data) =>
  fetchJSON('/api/docente/fichas-desarrollo', {
    method: 'POST',
    body: JSON.stringify(data)
  });

// Actualiza una ficha existente.
export const actualizarFicha = (id, data) =>
  fetchJSON(`/api/docente/fichas-desarrollo/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const eliminarFicha = (id) =>
  fetchJSON(`/api/docente/fichas-desarrollo/${id}`, {
    method: 'DELETE'
  });

// Grupos del docente (origen actual del selector de espacio académico).
export const listarGruposDocente = () =>
  fetchJSON('/api/docente/grupos');

// Catálogo de espacios académicos disponible para la ficha.
export const listarEspaciosAcademicos = () =>
  fetchJSON('/api/docente/microcurriculo/espacios-academicos');

// Envía la ficha: guarda el documento completo y la marca como "Enviada" para
// que deje de ser borrador. El backend acepta `estado` dentro de sus campos
// permitidos, por lo que el cambio de estado sí persiste.
export const enviarFicha = (id, data = {}) =>
  actualizarFicha(id, { ...data, estado: 'Enviada' });
