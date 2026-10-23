import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { cerrarSesion as cerrarSesionApi, obtenerUsuarioActual } from '../services/authService.js';

const AuthContext = createContext(null);

// Mantiene la sesión activa una sola vez para toda la app. Al ser un contexto,
// cualquier guard o header decide con el dato ya cargado, sin repetir /auth/me
// ni depender del montaje del componente.
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    setCargando(true);
    try {
      setUsuario(await obtenerUsuarioActual());
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const cerrarSesion = useCallback(async () => {
    await cerrarSesionApi();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, refrescar, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return contexto;
}
