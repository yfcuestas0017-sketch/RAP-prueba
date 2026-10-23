import { fetchJSON } from './api';

// Grupos donde el docente está asignado (usuario_grupo.estado = TRUE).
// El backend ya excluye los grupos que no le pertenecen.
export async function obtenerGruposDocente() {
  const datos = await fetchJSON('/api/docente/grupos');
  return Array.isArray(datos?.grupos) ? datos.grupos : [];
}
