import React from 'react';
import { FaHome, FaClipboardList, FaChartBar, FaUser } from 'react-icons/fa';

// El semestre puede llegar como número (4) o como objeto de perfil
// ({ numero: 4, nombre: 'Cuarto' }). Se normaliza siempre a número.
export function normalizarSemestre(semestre) {
  if (semestre == null) return 0;
  if (typeof semestre === 'object') {
    return Number(semestre.numero ?? semestre.semestre ?? 0) || 0;
  }
  return Number(semestre) || 0;
}

// El módulo "Evaluaciones y Proyectos" habilita ítems según el semestre:
//  - Siempre:   Realizar Pruebas.
//  - 7.°:       Proyecto Integrador (alineado al backend, que solo habilita 7.°).
//  - 9.°–10.°:  Modalidad de Grado.
export function submenuEvaluaciones(semestre) {
  const s = normalizarSemestre(semestre);
  const submenu = [
    { title: 'Realizar Pruebas', path: '/estudiante/evaluaciones' }
  ];

  if (s === 7) {
    submenu.push({ title: 'Mis Proyectos', path: '/estudiante/proyectos' });
  }
  if (s >= 9) {
    submenu.push({ title: 'Modalidad de Grado', path: '/estudiante/modalidad-grado' });
  }

  return submenu;
}

export function menuEstudiantePorSemestre(semestre) {
  return [
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
      submenu: submenuEvaluaciones(semestre)
    },
    {
      title: 'Mis Resultados RAP',
      icon: <FaChartBar />,
      path: '/estudiante/resultados'
    }
  ];
}

// Menú base (sin semester cargado). Se comporta como el de 4.° semestre.
export const menuEstudiante = menuEstudiantePorSemestre(4);
