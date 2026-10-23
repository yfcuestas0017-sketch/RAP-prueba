import { fetchJSON } from './api';

// Capa de datos de los proyectos del administrador.
//
// El backend publica dos módulos independientes, ambos de solo lectura:
//   /api/admin/proyecto      -> proyectos interestructurantes (semestre 7)
//   /api/admin/trabajo-grado -> tesis / trabajo de grado (semestre 9)
//
// Cada módulo expone:
//   GET /                 -> { mensaje, proyectos: [...], paginacion: {...} }
//   GET /:idProyecto      -> { mensaje, proyecto, estudiante, semestre, grupo, programa }
//
// Filtros aceptados por el listado: periodo, id_programa, id_grupo, estado,
// buscar, pagina y limite.

export const RUTAS_PROYECTOS_ADMIN = {
  interestructurante: '/api/admin/proyecto',
  modalidad: '/api/admin/trabajo-grado'
};

// El backend solo publica GET para el administrador: no hay POST/PUT/DELETE.
export const ESCRITURA_PROYECTOS_ADMIN = false;

export const rutaProyectosAdmin = (categoria = 'interestructurante') =>
  RUTAS_PROYECTOS_ADMIN[categoria] || RUTAS_PROYECTOS_ADMIN.interestructurante;

const construirQuery = (filtros = {}) => {
  const parametros = new URLSearchParams();

  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor === undefined || valor === null) return;
    const texto = String(valor).trim();
    if (!texto) return;
    parametros.set(clave, texto);
  });

  const query = parametros.toString();
  return query ? `?${query}` : '';
};

export const listarProyectosAdmin = (categoria = 'interestructurante', filtros = {}) =>
  fetchJSON(`${rutaProyectosAdmin(categoria)}${construirQuery(filtros)}`);

export const obtenerProyectoAdmin = (categoria, id) =>
  fetchJSON(`${rutaProyectosAdmin(categoria)}/${id}`);
