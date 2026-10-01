import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarDocente } from '../components/SidebarDocente';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useSidebar } from '../hooks/useSidebar';

export const DocenteLayout = () => {
  const { sidebarOpen, mostrarOverlay, toggleSidebar, cerrarSidebar } = useSidebar();

  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333333]">
      {mostrarOverlay && (
        <div className="app-sidebar-overlay" onClick={cerrarSidebar} aria-hidden="true" />
      )}

      <SidebarDocente isOpen={sidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Header onToggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default DocenteLayout;
