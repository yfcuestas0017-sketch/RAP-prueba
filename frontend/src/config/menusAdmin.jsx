import React from 'react';
import { 
  FaHome, 
  FaGraduationCap, 
  FaClipboardList, 
  FaSlidersH, 
  FaFileExport, 
  FaHistory,
  FaUser
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
      { title: 'Asignación de Usuarios', path: '/admin/espacios' },
      { title: 'Microcurrículo', path: '/admin/microcurriculos' },
      { title: 'Fichas de Desarrollo Temático', path: '/admin/fichas-desarrollo' },
      { title: 'Carga Docente', path: '/admin/carga-docente' },
      { title: 'Carga Estudiante', path: '/admin/carga-estudiante' }
    ]
  },
  {
    title: 'Catálogos Académicos',
    icon: <FaGraduationCap />,
    submenu: [
      { title: 'Componentes', path: '/admin/catalogos/componentes' },
      { title: 'Espacios Académicos', path: '/admin/catalogos/espacios-academicos' },
      { title: 'Semestres', path: '/admin/catalogos/semestres' },
      { title: 'Grupos', path: '/admin/catalogos/grupos' },
      { title: 'Jornadas', path: '/admin/catalogos/jornadas' },
      { title: 'Periodos Académicos', path: '/admin/catalogos/periodos' }
    ]
  },
  {
    title: 'Evaluaciones y Proyectos',
    icon: <FaClipboardList />,
    submenu: [
      { title: 'Crear Pruebas', path: '/admin/evaluaciones/crear' },
      { title: 'Proyectos Interestructurantes', path: '/admin/evaluaciones/interestructurante' },
      { title: 'Tesis y Modalidad de Grado', path: '/admin/evaluaciones/modalidad-grado' }
    ]
  },
  { 
    title: 'Parametrización', 
    icon: <FaSlidersH />, 
    path: '/admin/parametrizacion' 
  },
  { 
    title: 'Reportes', 
    icon: <FaFileExport />, 
    path: '/admin/reportes' 
  },
  { 
    title: 'Informes auditoría', 
    icon: <FaHistory />, 
    path: '/admin/auditoria' 
  }
];
