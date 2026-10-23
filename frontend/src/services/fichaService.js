import { fetchJSON } from './api';

// Capa de datos para el módulo de Fichas de Desarrollo Temático (DOC-CU-FR-003).
// Documento independiente del microcurrículo (DOC-CU-FR-002).

// ---- Docente ----
export const listarFichas = () =>
  fetchJSON('/api/docente/fichas-desarrollo');

export const obtenerFicha = (id) =>
  fetchJSON(`/api/docente/fichas-desarrollo/${id}`);

export const crearFicha = (data) =>
  fetchJSON('/api/docente/fichas-desarrollo', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const actualizarFicha = (id, data) =>
  fetchJSON(`/api/docente/fichas-desarrollo/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

export const eliminarFicha = (id) =>
  fetchJSON(`/api/docente/fichas-desarrollo/${id}`, {
    method: 'DELETE'
  });

// ---- Administrador ----
const normalizarRespuestaFichaAdmin = (respuesta) => ({
  ...respuesta,
  success: respuesta?.ok === true || respuesta?.success === true,
  mensaje: respuesta?.message || respuesta?.mensaje,
  ficha: respuesta?.data ?? respuesta?.ficha
});

export const listarFichasAdmin = async () => {
  // En administración, las fichas de todos los docentes se listan desde
  // /programa. La raíz del módulo no es el endpoint de listado.
  const respuesta = await fetchJSON('/api/admin/fichas-desarrollo/programa');
  return {
    ...respuesta,
    success: respuesta?.ok === true || respuesta?.success === true,
    mensaje: respuesta?.message || respuesta?.mensaje,
    fichas: Array.isArray(respuesta?.data)
      ? respuesta.data
      : Array.isArray(respuesta?.fichas)
        ? respuesta.fichas
        : []
  };
};

export const obtenerFichaAdmin = (id) =>
  fetchJSON(`/api/admin/fichas-desarrollo/${id}`).then(normalizarRespuestaFichaAdmin);

export const crearFichaAdmin = (data) =>
  fetchJSON('/api/admin/fichas-desarrollo', {
    method: 'POST',
    body: JSON.stringify(data)
  }).then(normalizarRespuestaFichaAdmin);

export const actualizarFichaAdmin = (id, data) =>
  fetchJSON(`/api/admin/fichas-desarrollo/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }).then(normalizarRespuestaFichaAdmin);

export const eliminarFichaAdmin = (id) =>
  fetchJSON(`/api/admin/fichas-desarrollo/${id}`, {
    method: 'DELETE'
  }).then(normalizarRespuestaFichaAdmin);
