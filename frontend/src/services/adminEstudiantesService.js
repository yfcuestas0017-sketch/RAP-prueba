import { fetchJSON } from './api';

// Capa de datos de estudiantes para el administrador.
// Usa el endpoint existente GET /api/adminUsuarios/Estudiantes que devuelve:
//   { success, cantidad, estudiantes: [ { id_user, id_user_institucional,
//     nombre, apellido, correo, estado, grupo, jornada, periodo,
//     semestre, nombre_semestre, ... } ] }

// Semestres que se consideran coterminalidad en la regla de negocio.
export const SEMESTRES_COTERMINALIDAD = [9, 10];

export const listarEstudiantesAdmin = () =>
  fetchJSON('/api/adminUsuarios/Estudiantes').then(
    (respuesta) => (Array.isArray(respuesta?.estudiantes) ? respuesta.estudiantes : [])
  );

export function esCoterminalidad(semestre) {
  const numero = Number(semestre);
  return SEMESTRES_COTERMINALIDAD.includes(numero);
}

export function iniciales(nombre, apellido) {
  const primera = (nombre || '').trim().charAt(0);
  const segunda = (apellido || '').trim().charAt(0);
  const texto = `${primera}${segunda}`.toUpperCase();
  return texto || '—';
}

export function etiquetaSemestre(estudiante) {
  const numero = Number(estudiante?.semestre);
  if (Number.isNaN(numero)) return '—';
  if (esCoterminalidad(numero)) return `${numero}° · coterminalidad`;
  const nombre = (estudiante?.nombre_semestre || '').trim();
  return nombre ? `${numero}° · ${nombre}` : `${numero}°`;
}
