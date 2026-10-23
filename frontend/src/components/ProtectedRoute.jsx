import { Navigate, Outlet } from 'react-router-dom';
import { rutaInicioPorRol } from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';

// Guard de rutas: decide con la sesión ya cargada en el contexto.
// - Sin sesión -> redirige al login ("/").
// - Sesión con rol no permitido -> redirige al inicio del rol real
//   (se queda únicamente en el apartado al que pertenece).
// - Sesión autorizada -> renderiza la ruta anidada (Outlet) o children.
export default function ProtectedRoute({ rolesPermitidos = [], children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#112F5C]/20 border-t-[#112F5C] rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  const rol = Number(usuario.rol);
  if (rolesPermitidos.length > 0 && !rolesPermitidos.includes(rol)) {
    return <Navigate to={rutaInicioPorRol(rol)} replace />;
  }

  return children ?? <Outlet />;
}
