import React from 'react';
import { 
  FaHome, 
  FaGraduationCap, 
  FaTasks, 
  FaClipboardList, 
  FaSlidersH, 
  FaFileExport, 
  FaHistory,
  FaUser,
  FaBook
} from 'react-icons/fa';

export const menuAdmin = [
  { 
    title: 'Inicio', 
    icon: <FaHome />, 
    path: '/admin' 
  },
  { 
    title: 'Mi Perfil', 
    icon: <FaUser />, 
    path: '/admin/perfil' 
  },
  {
    title: 'Gestión Académica',
    icon: <FaGraduationCap />,
    submenu: [
      { title: 'Usuarios y Roles', path: '/admin/usuarios' },
      { title: 'Espacios Académicos', path: '/admin/espacios' },
      { title: 'Carga Docente', path: '/admin/carga-docente' },
      { title: 'Carga Estudiante', path: '/admin/carga-estudiante' }
    ]
  },
  {
    title: 'RAP y Criterios',
    icon: <FaTasks />,
    submenu: [
      { title: 'Momentos de Evaluación', path: '/admin/rap/momentos' },
      { title: 'Resultados de Aprendizaje', path: '/admin/rap/resultados' },
      { title: 'Criterios de Evaluación', path: '/admin/rap/criterios' }
    ]
  },
  {
    title: 'Evaluaciones y Proyectos',
    icon: <FaClipboardList />,
    submenu: [
      { title: 'Crear Pruebas', path: '/admin/evaluaciones/crear' },
      { title: 'Ver Proyectos Interestructurante', path: '/admin/evaluaciones/interestructurante' },
      { title: 'Ver Tesis / Coterminalidad', path: '/admin/evaluaciones/tesis' }
    ]
  },
  {
    title: 'Pruebas Saber Pro',
    icon: <FaBook />,
    submenu: [
      { title: 'Módulos y Competencias', path: '/admin/saber-pro/modulos' },
      { title: 'Simulacros', path: '/admin/saber-pro/simulacros' },
      { title: 'Resultados Saber Pro', path: '/admin/saber-pro/resultados' }
    ]
  },
  { 
    title: 'Parametrización de Pruebas', 
    icon: <FaSlidersH />, 
    path: '/admin/parametrizacion' 
  },
  { 
    title: 'Reportes y Exportación', 
    icon: <FaFileExport />, 
    path: '/admin/reportes' 
  },
  { 
    title: 'Trazabilidad y Auditoría', 
    icon: <FaHistory />, 
    path: '/admin/auditoria' 
  }
];