import React from 'react';
import {
  FaHome,
  FaClipboardList,
  FaFileAlt,
  FaUser,
  FaBook,
  FaGraduationCap
} from 'react-icons/fa';

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
    title: 'Gestión Académica',
    icon: <FaGraduationCap />,
    submenu: [
      { title: 'Mis grupos', path: '/docente/grupos' },
      { title: 'Microcurrículo', path: '/docente/microcurriculos' },
      { title: 'Fichas de Desarrollo Temático', path: '/docente/fichas-desarrollo' }
    ]
  },
  {
    title: 'Evaluaciones',
    icon: <FaClipboardList />,
    submenu: [
      { title: 'Crear Pruebas', path: '/docente/evaluaciones/crear' },
      { title: 'Ver Proyectos Interestructurante', path: '/docente/evaluaciones/interestructurante' },
      { title: 'Ver Proyecto de Grado', path: '/docente/evaluaciones/tesis' }
    ]
  },
  {
    title: 'Pruebas Saber Pro',
    icon: <FaBook />,
    submenu: [
      { title: 'Módulos y Competencias', path: '/docente/saber-pro/modulos' },
      { title: 'Simulacros', path: '/docente/saber-pro/simulacros' }
    ]
  },
  { 
    title: 'Reportes', 
    icon: <FaFileAlt />, 
    path: '/docente/reportes' 
  }
];
