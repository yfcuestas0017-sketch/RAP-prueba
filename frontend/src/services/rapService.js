import { fetchJSON } from './api';

export function listarRap() {
  return fetchJSON('/api/adminRap/RAP');
}

// El endpoint de resultados consolidados puede no existir todavía en el backend.
export function listarResultadosAprendizaje(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return fetchJSON(`/api/adminRap/resultados${queryString ? `?${queryString}` : ''}`);
}

// El endpoint consolidado de momentos puede no existir todavía en el backend.
export function listarMomentosEvaluacion(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  return fetchJSON(`/api/adminRap/momentos${queryString ? `?${queryString}` : ''}`);
}
