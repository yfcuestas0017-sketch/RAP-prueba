import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarAdmin } from '../components/SidebarAdmin';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useSidebar } from '../hooks/useSidebar';

export default function AdminLayout() {
  const { sidebarOpen, mostrarOverlay, toggleSidebar, cerrarSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333333]">

      {/* Capa oscura traslúcida para cerrar el menú en celulares */}
      {mostrarOverlay && (
        <div className="app-sidebar-overlay" onClick={cerrarSidebar} aria-hidden="true" />
      )}

      {/* Sidebar: collapsible en escritorio, cajón lateral en celular */}
      <SidebarAdmin isOpen={sidebarOpen} />

      {/* Área principal de contenido */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header
          onToggleSidebar={toggleSidebar}
          sidebarOpen={sidebarOpen}
          nombreUsuario="ADMINISTRADOR"
          esAdmin={true}
        />

        {/* Contenido principal con padding adaptable */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}
