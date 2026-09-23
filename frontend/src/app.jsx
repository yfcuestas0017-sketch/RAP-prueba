import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/auth/Dashboard.jsx"
import AdminInicio from "./pages/Administrador/Inicio/AdminInicio.jsx";
import AdminPerfil from "./pages/Administrador/Perfil/AdminPerfil.jsx";
import DocenteInicio from "./pages/Docente/Inicio/DocenteInicio.jsx";
import DocentePerfil from "./pages/Docente/Perfil/DocentePerfil.jsx";
import EstudianteInicio from "./pages/Estudiante/Inicio/EstudianteInicio.jsx";
import EstudiantePerfil from "./pages/Estudiante/Perfil/EstudiantePerfil.jsx";
import RealizarPruebas from "./pages/Estudiante/Evaluaciones/RealizarPruebas.jsx";
import MisProyectos from "./pages/Estudiante/Proyectos/MisProyectos.jsx";
import ModalidadGrado from "./pages/Estudiante/ModalidadGrado/ModalidadGrado.jsx";
import MisResultados from "./pages/Estudiante/Resultados/MisResultados.jsx";

import DocenteLayout from "./layouts/DocenteLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import EstudianteLayout from "./layouts/EstudianteLayout.jsx";
import ReportesGlobal from "./pages/shared/reportes_global.jsx";
import ModuloPendiente from "./pages/shared/ModuloPendiente.jsx";
import ResultadosAprendizaje from "./pages/Administrador/RAP/ResultadosAprendizaje.jsx";
import MomentosEvaluacion from "./pages/Administrador/RAP/MomentosEvaluacion.jsx";
import AdminCrearPruebas from "./pages/Administrador/crear pruebas/AdminCrearPruebas.jsx";
import AdminEditorPrueba from "./pages/Administrador/crear pruebas/AdminEditorPrueba.jsx";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Login */}
        <Route
          path="/"
          element={<Dashboard />}
        />

        {/* Docente */}
        <Route element={<DocenteLayout />}>

          <Route
            path="/docente"
            element={<DocenteInicio />}
          />
          <Route path="/docente/perfil" element={<DocentePerfil />} />
          <Route path="/docente/grupos" element={<ModuloPendiente />} />
          <Route path="/docente/evaluaciones/*" element={<ModuloPendiente />} />
          <Route path="/docente/saber-pro/modulos" element={<ModuloPendiente />} />
          <Route path="/docente/saber-pro/simulacros" element={<ModuloPendiente />} />
          <Route path="/docente/saber-pro/resultados" element={<ModuloPendiente />} />
          <Route path="/docente/reportes" element={<ReportesGlobal />} />
        </Route>


        {/* Administrador con layout */}
        <Route element={<AdminLayout />}>

          <Route
            path="/admin"
            element={<AdminInicio />}
          />
          <Route path="/admin/perfil" element={<AdminPerfil />} />
          <Route path="/admin/usuarios/*" element={<ModuloPendiente />} />
          <Route path="/admin/espacios" element={<ModuloPendiente />} />
          <Route path="/admin/carga-docente" element={<ModuloPendiente />} />
          <Route path="/admin/carga-estudiante" element={<ModuloPendiente />} />
          <Route path="/admin/rap/momentos" element={<MomentosEvaluacion />} />
          <Route path="/admin/rap/resultados" element={<ResultadosAprendizaje />} />
          <Route path="/admin/rap/criterios" element={<ModuloPendiente />} />
          <Route path="/admin/rap/*" element={<ModuloPendiente />} />
          <Route path="/admin/evaluaciones/crear" element={<AdminCrearPruebas />} />
          <Route path="/admin/evaluaciones/editor/:idPrueba" element={<AdminEditorPrueba />} />
          <Route path="/admin/evaluaciones/*" element={<ModuloPendiente />} />
          <Route path="/admin/saber-pro/modulos" element={<ModuloPendiente />} />
          <Route path="/admin/saber-pro/simulacros" element={<ModuloPendiente />} />
          <Route path="/admin/saber-pro/resultados" element={<ModuloPendiente />} />
          <Route path="/admin/pruebas" element={<ModuloPendiente />} />
          <Route path="/admin/parametrizacion" element={<ModuloPendiente />} />
          <Route path="/admin/auditoria" element={<ModuloPendiente />} />

          <Route path="/admin/reportes" element={<ReportesGlobal />} />
        </Route>

{/* Estudiante con layout */}
        <Route element={<EstudianteLayout />}>
          <Route path="/estudiante" element={<EstudianteInicio />} />
          <Route path="/estudiante/perfil" element={<EstudiantePerfil />} />
          <Route path="/estudiante/evaluaciones" element={<RealizarPruebas />} />
          <Route path="/estudiante/evaluaciones/realizar" element={<RealizarPruebas />} />
          <Route path="/estudiante/proyectos" element={<MisProyectos />} />
          <Route path="/estudiante/modalidad-grado" element={<ModalidadGrado />} />
          <Route path="/estudiante/saber-pro/modulos" element={<ModuloPendiente />} />
          <Route path="/estudiante/saber-pro/simulacros" element={<ModuloPendiente />} />
          <Route path="/estudiante/saber-pro/resultados" element={<ModuloPendiente />} />
          <Route path="/estudiante/resultados" element={<MisResultados />} />
          <Route path="/estudiante/reportes" element={<ReportesGlobal />} />
        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;