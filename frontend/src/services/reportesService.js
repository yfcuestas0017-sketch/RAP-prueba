import { apiBaseURL, fetchJSON } from './api';

function query(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  return params.toString() ? `?${params}` : '';
}

export const obtenerReportesAdmin = (filters) => fetchJSON(`/api/admin/reportes${query(filters)}`);
export const obtenerFiltrosReportesAdmin = () => fetchJSON('/api/admin/reportes/filtros');
export const obtenerReportesDocente = (filters) => fetchJSON(`/api/docente/reportes${query(filters)}`);
export const obtenerFiltrosReportesDocente = () => fetchJSON('/api/docente/reportes/filtros');
export const obtenerReportesEstudiante = (filters) => fetchJSON(`/api/estudiante/reportes${query(filters)}`);

export async function descargarReporteAdmin(formato, filters) {
  const response = await fetch(`${apiBaseURL}/api/admin/reportes/exportar/${formato}${query(filters)}`, { credentials: 'include' });
  if (!response.ok) {
    let data = null;
    try { data = await response.json(); } catch { /* La respuesta no incluyó JSON. */ }
    throw new Error(data?.mensaje || 'No fue posible exportar el reporte.');
  }
  const archivo = await response.blob();
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = formato === 'excel' ? 'reporte-rap-consolidado.xlsx' : 'reporte-rap-consolidado.pdf';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(enlace.href);
}

export async function descargarReporteDocente(formato, filters) {
  const response = await fetch(`${apiBaseURL}/api/docente/reportes/exportar/${formato}${query(filters)}`, { credentials: 'include' });
  if (!response.ok) { const data = await response.json().catch(() => null); throw new Error(data?.mensaje || 'No fue posible exportar el reporte.'); }
  const enlace = document.createElement('a'); enlace.href = URL.createObjectURL(await response.blob()); enlace.download = formato === 'excel' ? 'reporte-docente-rap.xlsx' : 'reporte-docente-rap.pdf'; document.body.appendChild(enlace); enlace.click(); enlace.remove(); URL.revokeObjectURL(enlace.href);
}
