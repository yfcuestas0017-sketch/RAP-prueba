import React from 'react';
import { FaHome, FaClipboardList, FaChartBar, FaUser, FaBook } from 'react-icons/fa';

export const menuEstudiante = [
  { 
    title: 'Inicio', 
    icon: <FaHome />, 
    path: '/estudiante' 
  },
  { 
    title: 'Mi Perfil', 
    icon: <FaUser />, 
    path: '/estudiante/perfil' 
  },
  {
    title: 'Evaluaciones y Proyectos',
    icon: <FaClipboardList />,
    submenu: [
      { title: 'Realizar Pruebas', path: '/estudiante/evaluaciones/realizar' },
      { title: 'Mis Proyectos', path: '/estudiante/proyectos' },
      { title: 'Modalidad de Grado', path: '/estudiante/modalidad-grado' }
    ]
  },
  {
    title: 'Pruebas Saber Pro',
    icon: <FaBook />,
    submenu: [
      { title: 'Módulos y Competencias', path: '/estudiante/saber-pro/modulos' },
      { title: 'Simulacros', path: '/estudiante/saber-pro/simulacros' },
      { title: 'Resultados Saber Pro', path: '/estudiante/saber-pro/resultados' }
    ]
  },
  { 
    title: 'Mis Resultados RAP', 
    icon: <FaChartBar />, 
    path: '/estudiante/resultados' 
  }
];