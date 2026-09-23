import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarDocente } from '../components/SidebarDocente';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const DocenteLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#333333]">
      <SidebarDocente isOpen={sidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default DocenteLayout;