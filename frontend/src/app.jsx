import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/auth/Dashboard.jsx"
import AdminInicio from "./pages/Administrador/Inicio/AdminInicio.jsx";
import AdminPerfil from "./pages/Administrador/Perfil/AdminPerfil.jsx";
import DocenteInicio from "./pages/Docente/Inicio/DocenteInicio.jsx";
import DocentePerfil from "./pages/Docente/Perfil/DocentePerfil.jsx";
import DocenteMisGrupos from "./pages/Docente/Mis grupos/DocenteMisGrupos.jsx";
import EstudianteInicio from "./pages/Estudiante/Inicio/EstudianteInicio.jsx";
import EstudiantePerfil from "./pages/Estudiante/Perfil/EstudiantePerfil.jsx";
import EstudiantePruebas from "./pages/Estudiante/Evaluaciones/EstudiantePruebas.jsx";
import EstudianteExamenActivo from "./pages/Estudiante/Evaluaciones/EstudianteExamenActivo.jsx";
import MisProyectos from "./pages/Estudiante/Proyectos/MisProyectos.jsx";
import ModalidadGrado from "./pages/Estudiante/ModalidadGrado/ModalidadGrado.jsx";

import DocenteLayout from "./layouts/DocenteLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import EstudianteLayout from "./layouts/EstudianteLayout.jsx";
import ReportesGlobal from "./pages/shared/reportes_global.jsx";
import ModuloPendiente from "./pages/shared/ModuloPendiente.jsx";
import AdminParametrizacion from "./pages/Administrador/Parametrizacion/AdminParametrizacion.jsx";
import AdminCrearPruebas from "./pages/Administrador/crear pruebas/AdminCrearPruebas.jsx";
import AdminEditorPrueba from "./pages/Administrador/crear pruebas/AdminEditorPrueba.jsx";
import DocenteCrearPruebas from "./pages/Docente/Crear pruebas/DocenteCrearPruebas.jsx";
import DocenteEditorPrueba from "./pages/Docente/Crear pruebas/DocenteEditorPruebas.jsx";

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
          <Route path="/docente/grupos" element={<DocenteMisGrupos />} />
          <Route path="/docente/evaluaciones/crear" element={<DocenteCrearPruebas />} />
          <Route path="/docente/evaluaciones/editor/:idEvaluacion" element={<DocenteEditorPrueba />} />
          <Route path="/docente/evaluaciones/interestructurante" element={<ModuloPendiente />} />
          <Route path="/docente/evaluaciones/tesis" element={<ModuloPendiente />} />
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
          <Route path="/admin/rap/momentos" element={<Navigate to="/admin/parametrizacion?tab=momentos" replace />} />
          <Route path="/admin/rap/resultados" element={<Navigate to="/admin/parametrizacion?tab=resultados" replace />} />
          <Route path="/admin/rap/criterios" element={<ModuloPendiente />} />
          <Route path="/admin/rap/*" element={<ModuloPendiente />} />
          <Route path="/admin/evaluaciones/crear" element={<AdminCrearPruebas />} />
          <Route path="/admin/evaluaciones/editor/:idPrueba" element={<AdminEditorPrueba />} />
          <Route path="/admin/evaluaciones/*" element={<ModuloPendiente />} />
          <Route path="/admin/saber-pro/modulos" element={<ModuloPendiente />} />
          <Route path="/admin/saber-pro/simulacros" element={<ModuloPendiente />} />
          <Route path="/admin/saber-pro/resultados" element={<ModuloPendiente />} />
          <Route path="/admin/pruebas" element={<ModuloPendiente />} />
          <Route path="/admin/parametrizacion" element={<AdminParametrizacion />} />
          <Route path="/admin/auditoria" element={<ModuloPendiente />} />

          <Route path="/admin/reportes" element={<ReportesGlobal />} />
        </Route>

{/* Estudiante con layout */}
        <Route element={<EstudianteLayout />}>
          <Route path="/estudiante" element={<EstudianteInicio />} />
          <Route path="/estudiante/perfil" element={<EstudiantePerfil />} />
          <Route path="/estudiante/evaluaciones" element={<EstudiantePruebas />} />
          <Route path="/estudiante/evaluaciones/realizar" element={<EstudiantePruebas />} />
          <Route path="/estudiante/evaluaciones/examen/:idEvaluacion" element={<EstudianteExamenActivo />} />
          <Route path="/estudiante/proyectos" element={<MisProyectos />} />
          <Route path="/estudiante/modalidad-grado" element={<ModalidadGrado />} />
          <Route path="/estudiante/saber-pro/modulos" element={<ModuloPendiente />} />
          <Route path="/estudiante/saber-pro/simulacros" element={<ModuloPendiente />} />
          <Route path="/estudiante/saber-pro/resultados" element={<ModuloPendiente />} />
          <Route path="/estudiante/resultados" element={<ReportesGlobal />} />
          <Route path="/estudiante/reportes" element={<ReportesGlobal />} />
        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;