import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaUserCircle,
  FaChevronDown,
  FaChevronUp,
  FaSignOutAlt,
  FaUser,
  FaBars
} from 'react-icons/fa';
import { API_BASE_URL } from '../config';

export const Header = ({ onToggleSidebar }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const obtenerPerfil = async () => {
      try {
        const respuesta = await fetch(
          `${API_BASE_URL}/api/auth/me`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        const datos = await respuesta.json();

        if (respuesta.ok && datos.success) {
          setUsuario(datos.usuario);
        } else {
          const sesionLocal = localStorage.getItem('usuario');
          if (sesionLocal) {
            setUsuario(JSON.parse(sesionLocal));
          }
        }
      } catch (error) {
        console.error('Error obteniendo perfil:', error);
        const sesionLocal = localStorage.getItem('usuario');
        if (sesionLocal) {
          setUsuario(JSON.parse(sesionLocal));
        }
      }
    };

    obtenerPerfil();
  }, []);

const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      navigate('/', { replace: true });
    }
  };

  const handleIrPerfil = () => {
    setIsMenuOpen(false);
    const rol = usuario?.rol ?? usuario?.id_rol;
    const idRol = Number(rol);
    const ruta = location.pathname || '';

    if (idRol === 4 || rol === 'admin' || rol === 'ADMIN' || ruta.startsWith('/admin')) {
      navigate('/admin/perfil');
    } else if (idRol === 5 || rol === 'docente' || rol === 'DOCENTE' || ruta.startsWith('/docente')) {
      navigate('/docente/perfil');
    } else {
      navigate('/estudiante/perfil');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-3 md:px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm gap-2">

{/* Lado Izquierdo: Botón menú + Título Completo Permanente */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Mostrar u ocultar menú"
          className="text-xl text-[#112F5C] p-2 hover:bg-gray-100 rounded-md"
        >
          <FaBars />
        </button>

        <span className="text-xs sm:text-sm md:text-base font-bold text-[#112F5C] tracking-wide whitespace-normal leading-tight">
          Sistema de Aplicación de Resultado de Aprendizaje
        </span>
      </div>

      {/* Menú de Perfil (Lado Derecho) */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <div className="relative">

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 md:gap-3 p-1 md:p-1.5 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <FaUserCircle className="text-2xl md:text-3xl text-[#112F5C] shrink-0" />

            <div className="text-left max-w-[120px] sm:max-w-[200px] md:max-w-none truncate">
              <p className="text-[10px] md:text-xs font-bold text-[#333333] leading-tight uppercase tracking-wide truncate">
                {usuario
                  ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim().toUpperCase()
                  : 'Cargando...'}
              </p>

              <p className="text-[9px] md:text-[10px] text-gray-400 font-medium mt-0.5 truncate">
                {usuario?.correo || usuario?.email || 'Cargando...'}
              </p>
            </div>

            {isMenuOpen ? (
              <FaChevronUp className="text-[10px] md:text-xs text-gray-400 shrink-0" />
            ) : (
              <FaChevronDown className="text-[10px] md:text-xs text-gray-400 shrink-0" />
            )}
          </button>

          {/* Menú Desplegable */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 text-xs text-[#333333] z-50 animate-fade-in">

              <button
                onClick={handleIrPerfil}
                className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 font-semibold text-gray-700 text-left transition-colors"
              >
                <FaUser className="text-gray-400 text-sm" />
                Perfil
              </button>

              <div className="my-1 border-t border-gray-100" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-red-50 text-red-600 font-semibold text-left transition-colors"
              >
                <FaSignOutAlt className="text-sm" />
                Cerrar Sesión
              </button>

            </div>
          )}

        </div>
      </div>

    </header>
  );
};