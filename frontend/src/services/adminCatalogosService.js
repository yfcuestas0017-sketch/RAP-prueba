import { fetchJSON } from './api';

// Contrato real del backend:
// - componentes, espacios-academicos, semestres y grupos: CRUD.
// - jornadas y periodos: listados derivados de la tabla grupo, solo GET y PUT.
export const RUTAS_CATALOGOS_ADMIN = {
  componentes: '/api/admin/catalogos/componentes',
  'espacios-academicos': '/api/admin/catalogos/espacios-academicos',
  semestres: '/api/admin/catalogos/semestres',
  grupos: '/api/admin/catalogos/grupos',
  jornadas: '/api/admin/catalogos/jornadas',
  periodos: '/api/admin/catalogos/periodos'
};

const CLAVES_RESPUESTA = {
  componentes: 'componentes',
  'espacios-academicos': 'espacios_academicos',
  semestres: 'semestres',
  grupos: 'grupos',
  jornadas: 'jornadas',
  periodos: 'periodos'
};

const RUTA_PROGRAMAS_ADMIN = '/api/admin/seguimiento/programas';

const rutaDe = (recurso) => {
  const ruta = RUTAS_CATALOGOS_ADMIN[recurso];
  if (!ruta) throw new Error('El catálogo solicitado no está configurado.');
  return ruta;
};

export async function listarCatalogoAdmin(recurso) {
  const respuesta = await fetchJSON(rutaDe(recurso));
  const clave = CLAVES_RESPUESTA[recurso] || recurso;
  const lista =
    respuesta?.data?.[clave] ||
    respuesta?.[clave] ||
    respuesta?.items ||
    (Array.isArray(respuesta?.data) ? respuesta.data : null);
  return Array.isArray(lista) ? lista : [];
}

export async function listarProgramasAdmin() {
  const respuesta = await fetchJSON(RUTA_PROGRAMAS_ADMIN);
  const lista = Array.isArray(respuesta?.data)
    ? respuesta.data
    : respuesta?.programas || respuesta?.items;
  return Array.isArray(lista) ? lista : [];
}

export async function guardarCatalogoAdmin(recurso, id, datos) {
  const ruta = rutaDe(recurso);
  return fetchJSON(id ? `${ruta}/${encodeURIComponent(id)}` : ruta, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(datos)
  });
}

export async function eliminarCatalogoAdmin(recurso, id) {
  return fetchJSON(`${rutaDe(recurso)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
