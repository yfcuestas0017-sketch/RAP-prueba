import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarEstudiante } from '../components/SidebarEstudiante';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { FaBars, FaTimes } from 'react-icons/fa';

export default function EstudianteLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333333]">

      {/* 1. Fondo oscuro traslúcido para cerrar el menú en celulares */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 md:hidden transition-opacity"
        />
      )}

      {/* 2. Sidebar: Oculto a la izquierda en celular, fijo en computador (md:sticky) */}
      <div className={`fixed md:sticky top-0 z-40 h-screen transition-transform duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <SidebarEstudiante />
      </div>

      {/* 3. Área principal de contenido */}
      <div className="flex-1 flex flex-col min-w-0 w-full">

        {/* Enlace de Header + Botón Hamburguesa (solo visible en celular con md:hidden) */}
        <div className="sticky top-0 z-20 bg-white border-b flex items-center justify-between px-2 md:px-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-[#112F5C] hover:bg-gray-100 rounded-lg text-lg focus:outline-none ml-2"
            aria-label="Abrir menú"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className="flex-1">
            <Header />
          </div>
        </div>

        {/* Padding adaptable: p-4 en celular, p-8 en computador */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}