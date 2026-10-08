import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const MEDIA_MOVIL = '(max-width: 767px)';

const esPantallaMovil = () =>
  typeof window !== 'undefined' && window.matchMedia(MEDIA_MOVIL).matches;

export const useSidebar = () => {
  const [esMovil, setEsMovil] = useState(esPantallaMovil);
  const [sidebarOpen, setSidebarOpen] = useState(() => !esPantallaMovil());
  const location = useLocation();

  useEffect(() => {
    const consulta = window.matchMedia(MEDIA_MOVIL);

    const alCambiar = (evento) => {
      setEsMovil(evento.matches);
      setSidebarOpen(!evento.matches);
    };

    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, []);

  useEffect(() => {
    if (esMovil) {
      setSidebarOpen(false);
    }
  }, [location.pathname, esMovil]);

  useEffect(() => {
    if (!esMovil || !sidebarOpen) return undefined;

    const alPresionarEscape = (evento) => {
      if (evento.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', alPresionarEscape);

    return () => {
      document.body.style.overflow = overflowPrevio;
      window.removeEventListener('keydown', alPresionarEscape);
    };
  }, [esMovil, sidebarOpen]);

  const toggleSidebar = useCallback(() => setSidebarOpen((abierto) => !abierto), []);
  const abrirSidebar = useCallback(() => setSidebarOpen(true), []);
  const cerrarSidebar = useCallback(() => setSidebarOpen(false), []);

  return {
    esMovil,
    sidebarOpen,
    mostrarOverlay: esMovil && sidebarOpen,
    toggleSidebar,
    abrirSidebar,
    cerrarSidebar
  };
};

export default useSidebar;
