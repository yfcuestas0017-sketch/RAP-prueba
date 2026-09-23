import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaThLarge, 
  FaChalkboardTeacher, 
  FaClipboardCheck, 
  FaChevronDown, 
  FaChevronRight, 
  FaFileAlt 
} from 'react-icons/fa';

const menuItems = [
  { title: 'Dashboard', icon: <FaThLarge />, path: '/docente' },
  {
    title: 'Carga Docente',
    icon: <FaChalkboardTeacher />,
    submenu: [
      { title: 'Asignación de Materias', path: '/carga/asignacion' },
      { title: 'Horarios Académicos', path: '/carga/horarios' }
    ]
  },
  {
    title: 'Evaluaciones',
    icon: <FaClipboardCheck />,
    submenu: [
      { title: 'Evaluación Docente', path: '/evaluaciones/docente' },
      { title: 'Autoevaluación', path: '/evaluaciones/autoevaluacion' },
      { title: 'Resultados RAP', path: '/evaluaciones/resultados' }
    ]
  },
  { title: 'Reportes', icon: <FaFileAlt />, path: '/DocenteReportes' }
];

export const Sidebar = ({ currentPath = '/docente' }) => {
  const [openSubmenus, setOpenSubmenus] = useState({});

  const toggleSubmenu = (index) => {
    setOpenSubmenus(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <aside className="w-64 bg-[#112F5C] text-white flex flex-col h-screen sticky top-0 shadow-xl z-20">
      <div className="p-6 flex items-center gap-3 border-b border-blue-900/50">
        <div className="w-10 h-10 bg-[#B3282D] rounded-lg flex items-center justify-center font-bold text-xl shadow">
          U
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Sistema RAP</h1>
          <p className="text-xs text-blue-200">UNICESMAG</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item, index) => {
          const hasSubmenu = Boolean(item.submenu);
          const isActive = item.path === currentPath;

          return (
            <div key={index} className="space-y-1">
              {hasSubmenu ? (
                <button
                  onClick={() => toggleSubmenu(index)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg text-blue-100 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base">{item.icon}</span>
                    <span>{item.title}</span>
                  </div>
                  {openSubmenus[index] ? <FaChevronDown className="text-xs" /> : <FaChevronRight className="text-xs" />}
                </button>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'bg-[#B3282D] text-white shadow-md' : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              )}

              {hasSubmenu && openSubmenus[index] && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  {item.submenu.map((sub, subIdx) => (
                    <Link
                      key={subIdx}
                      to={sub.path}
                      className={`block px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                        sub.path === currentPath ? 'bg-[#B3282D] text-white' : 'text-blue-200 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {sub.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};