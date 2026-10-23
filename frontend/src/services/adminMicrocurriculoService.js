import { fetchJSON } from './api';

// Capa de datos para el módulo admin de Microcurrículos (Syllabus DOC-CU-FR-002).
// El backend debe exponer estas rutas en /api/admin/microcurriculo (singular),
// con permiso de administrador y acceso a los microcurrículos de todos los docentes.

// Lista todos los microcurrículos (incluyendo el nombre del docente autor).
export const listarMicrocurriculosAdmin = () =>
  fetchJSON('/api/admin/microcurriculo');

// Obtiene el detalle de un microcurrículo.
export const obtenerMicrocurriculoAdmin = (id) =>
  fetchJSON(`/api/admin/microcurriculo/${id}`);

// Crea un microcurrículo (autor = administrador).
export const crearMicrocurriculoAdmin = (data) =>
  fetchJSON('/api/admin/microcurriculo', {
    method: 'POST',
    body: JSON.stringify(data)
  });

// Actualiza un microcurrículo de cualquier docente.
export const actualizarMicrocurriculoAdmin = (id, data) =>
  fetchJSON(`/api/admin/microcurriculo/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

// Elimina un microcurrículo de cualquier docente.
export const eliminarMicrocurriculoAdmin = (id) =>
  fetchJSON(`/api/admin/microcurriculo/${id}`, {
    method: 'DELETE'
  });
