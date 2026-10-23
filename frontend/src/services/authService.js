import { fetchJSON } from './api.js';

export const ROL = {
  ADMIN: 4,
  DOCENTE: 5,
  ESTUDIANTE: 6
};

// Consulta la sesión activa en el backend. Devuelve el usuario o null si no
// hay sesión (401) o si la petición falla.
export async function obtenerUsuarioActual() {
  try {
    const data = await fetchJSON('/api/auth/me');
    if (data?.success && data.usuario) {
      return data.usuario;
    }
    return null;
  } catch (error) {
    if (error.status !== 401) {
      console.error('Error verificando la sesión:', error);
    }
    return null;
  }
}

// Ruta de inicio que corresponde a cada rol.
export function rutaInicioPorRol(rol) {
  switch (Number(rol)) {
    case ROL.ADMIN:
      return '/admin';
    case ROL.DOCENTE:
      return '/docente';
    case ROL.ESTUDIANTE:
      return '/estudiante';
    default:
      return '/';
  }
}

// Cierra la sesión en el backend. La app limpia su estado local aunque falle.
export async function cerrarSesion() {
  try {
    await fetchJSON('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    if (error.status !== 401 && error.status !== 404) {
      console.error('Error cerrando la sesión:', error);
    }
  }
}
