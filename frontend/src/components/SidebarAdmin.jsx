import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { menuAdmin } from '../config/menusAdmin';
import logoUnicesmag from '../assets/Escudos_cesmag.png';

export const SidebarAdmin = ({ isOpen = true }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    const activeParentIndex = menuAdmin.findIndex(
      (item) => item.submenu && item.submenu.some((sub) => sub.path === currentPath)
    );
    if (activeParentIndex !== -1) {
      setOpenIndex(activeParentIndex);
    }
  }, [currentPath]);

  const toggleSubmenu = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
<aside className={`app-sidebar ${isOpen ? 'app-sidebar-open' : 'app-sidebar-closed'} w-64 bg-[#112F5C] text-white flex flex-col h-screen sticky top-0 shadow-xl z-20`}>
      {/* SECCIÓN LOGO */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-blue-900/30 mb-4">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow overflow-hidden border border-gray-200">
          <img
            src={logoUnicesmag}
            alt="Logo Universidad CESMAG"
            className="w-full h-full object-contain p-1"
          />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide leading-tight text-white">SI RAP</h1>
          <p className="text-[10px] text-blue-200 font-medium mt-0.5">Universidad CESMAG</p>
        </div>
      </div>

      {/* 2. NAVEGACIÓN PRINCIPAL (Mismo diseño redondeado y sin flechas) */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {menuAdmin.map((item, index) => {
          const hasSubmenu = Boolean(item.submenu);
          const isOpen = openIndex === index;
          const isParentActive = hasSubmenu
            ? item.submenu.some((sub) => sub.path === currentPath)
            : item.path === currentPath;

          return (
            <div key={index} className="rounded-2xl overflow-hidden shadow-sm">
              {hasSubmenu ? (
                <div className={`rounded-2xl overflow-hidden transition-all ${
                  isParentActive ? 'ring-2 ring-white/40' : ''
                }`}>
                  {/* Botón Principal con Submenú (Sin flechas laterales) */}
                  <button
                    onClick={() => toggleSubmenu(index)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-wide text-white bg-[#8B1A1A] hover:bg-[#721515] transition-colors text-left"
                  >
                    <span className="text-base text-white">{item.icon}</span>
                    <span className="text-white">{item.title}</span>
                  </button>

                  {/* 3. SUBMÓDULOS (Cuadro Rojo Interno) */}
                  {isOpen && (
                    <div className="bg-[#8B1A1A] px-4 pb-3 pt-2 space-y-2 border-t border-white/20">
                      {item.submenu.map((sub, subIdx) => (
                        <Link
                          key={subIdx}
                          to={sub.path}
                          className={`block text-xs font-semibold transition-all pl-6 ${
                            sub.path === currentPath
                              ? 'font-bold underline !text-white'
                              : '!text-white/90 hover:!text-white hover:translate-x-1'
                          }`}
                        >
                          - {sub.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Botones de enlace directo sin submenú (Sin flecha '>') */
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-bold tracking-wide rounded-2xl transition-all shadow-md ${
                    isParentActive
                      ? 'bg-[#8B1A1A] text-white ring-2 ring-white/40'
                      : 'bg-[#8B1A1A] text-white hover:bg-[#721515]'
                  }`}
                >
                  <span className="text-base text-white">{item.icon}</span>
                  <span className="text-white">{item.title}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* Pie de página del Menú */}
      <div className="p-3 text-[10px] text-blue-300/80 text-center border-t border-blue-900/30 font-medium">
        © Universidad CESMAG
      </div>
    </aside>
  );
};
