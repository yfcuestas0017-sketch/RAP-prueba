import { fetchJSON } from './api';

// Capa de datos para el módulo de Microcurrículos (Syllabus) del docente.
// El backend monta estas rutas en /api/docente/microcurriculo (singular).

// Lista los microcurrículos del docente autenticado.
export const listarMicrocurriculos = () =>
  fetchJSON('/api/docente/microcurriculo');

// Lista los espacios académicos que expone el endpoint del módulo docente.
export const listarEspaciosAcademicos = () =>
  fetchJSON('/api/docente/microcurriculo/espacios-academicos');

// Obtiene el detalle de un microcurrículo del docente.
export const obtenerMicrocurriculo = (id) =>
  fetchJSON(`/api/docente/microcurriculo/${id}`);

// Crea un microcurrículo nuevo.
export const crearMicrocurriculo = (data) =>
  fetchJSON('/api/docente/microcurriculo', {
    method: 'POST',
    body: JSON.stringify(data)
  });

// Actualiza un microcurrículo existente.
export const actualizarMicrocurriculo = (id, data) =>
  fetchJSON(`/api/docente/microcurriculo/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// Elimina un microcurrículo (solo si está en estado "borrador").
export const eliminarMicrocurriculo = (id) =>
  fetchJSON(`/api/docente/microcurriculo/${id}`, {
    method: 'DELETE'
  });

// Envía el microcurrículo: guarda el documento completo y lo marca como
// "Enviada" para que deje de ser borrador.
//
// NOTA BACKEND: `estado` y `semestre` aún no están en los campos permitidos por
// el servicio del backend, por lo que hoy se guardan los demás campos y el
// registro permanece en "Borrador". Cuando el backend acepte esos campos, este
// mismo envío funcionará sin cambios en el frontend.
export const enviarMicrocurriculo = (id, data = {}) =>
  actualizarMicrocurriculo(id, { ...data, estado: 'Enviada' });
