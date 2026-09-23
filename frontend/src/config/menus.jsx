import React from 'react';
import { FaHome, FaUsers, FaClipboardList, FaFileAlt, FaUser, FaBook } from 'react-icons/fa';

export const menuDocente = [
  { 
    title: 'Inicio', 
    icon: <FaHome />, 
    path: '/docente' 
  },
  { 
    title: 'Mi Perfil', 
    icon: <FaUser />, 
    path: '/docente/perfil' 
  },
  { 
    title: 'Mis grupos', 
    icon: <FaUsers />, 
    path: '/docente/grupos' 
  },
  {
    title: 'Evaluaciones',
    icon: <FaClipboardList />,
    submenu: [
      { title: 'Crear Pruebas', path: '/docente/evaluaciones/crear' },
      { title: 'Ver Proyectos Interestructurante', path: '/docente/evaluaciones/interestructurante' },
      { title: 'Ver Tesis / Coterminalidad', path: '/docente/evaluaciones/tesis' }
    ]
  },
  {
    title: 'Pruebas Saber Pro',
    icon: <FaBook />,
    submenu: [
      { title: 'Módulos y Competencias', path: '/docente/saber-pro/modulos' },
      { title: 'Simulacros', path: '/docente/saber-pro/simulacros' },
      { title: 'Resultados Saber Pro', path: '/docente/saber-pro/resultados' }
    ]
  },
  { 
    title: 'Reportes', 
    icon: <FaFileAlt />, 
    path: '/docente/reportes' 
  }
];