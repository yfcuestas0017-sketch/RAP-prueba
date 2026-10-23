import { fetchJSON } from './api.js';

// Capa de datos de "Mis Proyectos" del estudiante (Proyecto Integrador / grado).
//
// Contrato real del backend (montado en /api/estudiante/proyecto):
//   GET  /api/estudiante/proyecto/proyecto
//        -> 200 { mensaje, proyecto: <objeto|null> }  (UN solo proyecto, semestre 7)
//        -> 404 { mensaje } si el estudiante no tiene grupo académico activo
//        -> 403 { mensaje } si el estudiante no está en séptimo semestre
//   POST /api/estudiante/proyecto/proyecto
//        -> body JSON { nombre, descripcion, informacion, tipo_proyecto, especializacion }
//        -> `informacion` es obligatorio (string no vacío); `especializacion` booleano.
//        -> El backend hace upsert (un proyecto por estudiante/semestre). NO acepta archivos.
//
// Degradación elegante:
//   - Sin endpoint montado (405/501) o sin respuesta de red -> `pendiente: true`.
//   - Reglas de negocio del backend (403/404 con mensaje) -> `aviso` (texto amable),
//     no un error de conexión genérico.

const RUTA = '/api/estudiante/proyecto';

// "Módulo pendiente" solo cuando el endpoint no está montado o no hay red.
// El 404 de negocio ("sin grupo activo") se trata aparte como `aviso`.
export const esModuloPendiente = (error) =>
  !error?.status || [405, 501].includes(error.status);

// El backend devuelve UN proyecto en `proyecto` (singular). Se normaliza a lista
// para que la vista no dependa de si el contrato es singular o plural.
function normalizarLista(datos) {
  if (!datos) return [];
  if (Array.isArray(datos.proyectos)) return datos.proyectos;
  if (Array.isArray(datos.data)) return datos.data;
  if (Array.isArray(datos)) return datos;
  if (datos.proyecto) return [datos.proyecto];
  if (datos.data && typeof datos.data === 'object') return [datos.data];
  return [];
}

// Lista los proyectos del estudiante autenticado.
export async function obtenerMisProyectos() {
  try {
    const datos = await fetchJSON(`${RUTA}/proyecto`);
    return { proyectos: normalizarLista(datos), pendiente: false, aviso: '' };
  } catch (error) {
    if (esModuloPendiente(error)) {
      return { proyectos: [], pendiente: true, aviso: '' };
    }
    // 403 (semestre distinto de 7) y 404 (sin grupo activo): aviso amable.
    if ([403, 404].includes(error.status)) {
      return { proyectos: [], pendiente: false, aviso: error.message };
    }
    throw error;
  }
}

// Registra / actualiza el proyecto del estudiante (upsert en el backend).
// `informacion` es obligatorio; si no se pasa, se usa la descripción.
export function registrarProyecto({
  nombre,
  tipo_proyecto,
  descripcion,
  informacion,
  especializacion
}) {
  const textoInformacion = (informacion ?? descripcion ?? '').trim();
  return fetchJSON(`${RUTA}/proyecto`, {
    method: 'POST',
    body: JSON.stringify({
      nombre,
      tipo_proyecto,
      descripcion: descripcion ?? '',
      informacion: textoInformacion,
      especializacion: Boolean(especializacion)
    })
  });
}
