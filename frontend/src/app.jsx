import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/auth/Dashboard.jsx"
import DocenteInicio from "./pages/Docente/Inicio/DocenteInicio.jsx";
import DocentePerfil from "./pages/Docente/Perfil/DocentePerfil.jsx";
import DocenteMisGrupos from "./pages/Docente/Mis grupos/DocenteMisGrupos.jsx";
import DocenteMicrocurriculos from "./pages/Docente/Microcurriculo/DocenteMicrocurriculo.jsx";
import DocenteFichasDesarrollo from "./pages/Docente/Fichas_de_desarrollo_tematico/DocenteFichas.jsx";
import EstudianteInicio from "./pages/Estudiante/Inicio/EstudianteInicio.jsx";
import EstudiantePerfil from "./pages/Estudiante/Perfil/EstudiantePerfil.jsx";
import EstudiantePruebas from "./pages/Estudiante/Evaluaciones/EstudiantePruebas.jsx";
import EstudianteExamenActivo from "./pages/Estudiante/Evaluaciones/EstudianteExamenActivo.jsx";
import MisProyectos from "./pages/Estudiante/Proyectos/MisProyectos.jsx";
import ModalidadGrado from "./pages/Estudiante/ModalidadGrado/ModalidadGrado.jsx";
import MisResultados from "./pages/Estudiante/Resultados/MisResultados.jsx";

import DocenteLayout from "./layouts/DocenteLayout.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import EstudianteLayout from "./layouts/EstudianteLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ROL } from "./services/authService.js";
import ReportesGlobal from "./pages/shared/reportes_global.jsx";
import DocenteReportes from "./pages/Docente/Reportes/DocenteReportes.jsx";
import ModuloPendiente from "./pages/shared/ModuloPendiente.jsx";
const AdminInicio = lazy(() => import("./pages/Administrador/Inicio/AdminInicio.jsx"));
const AdminPerfil = lazy(() => import("./pages/Administrador/Perfil/AdminPerfil.jsx"));
const AdminParametrizacion = lazy(() => import("./pages/Administrador/Parametrizacion/AdminParametrizacion.jsx"));
const AdminEspaciosAcademicos = lazy(() => import("./pages/Administrador/EspaciosAcademicos/AdminEspaciosAcademicos.jsx"));
const AdminListaDocentes = lazy(() => import("./pages/Administrador/EspaciosAcademicos/AdminListaDocentes.jsx"));
const AdminListaEstudiantes = lazy(() => import("./pages/Administrador/EspaciosAcademicos/AdminListaEstudiantes.jsx"));
const AdminDetalleDocente = lazy(() => import("./pages/Administrador/EspaciosAcademicos/AdminDetalleDocente.jsx"));
const AdminDetalleEstudiante = lazy(() => import("./pages/Administrador/EspaciosAcademicos/AdminDetalleEstudiante.jsx"));
const AdminCrearPruebas = lazy(() => import("./pages/Administrador/crear pruebas/AdminCrearPruebas.jsx"));
const AdminEditorPrueba = lazy(() => import("./pages/Administrador/crear pruebas/AdminEditorPrueba.jsx"));
const AdminMicrosFichas = lazy(() => import("./pages/Administrador/MicrosFichas/AdminMicrosFichas.jsx"));
const AdminProyectos = lazy(() => import("./pages/Administrador/Proyectos/AdminProyectos.jsx"));
const AdminModalidadGrado = lazy(() => import("./pages/Administrador/ModalidadGrado/AdminModalidadGrado.jsx"));
const AdminCatalogoCrud = lazy(() => import("./pages/Administrador/Catalogos/AdminCatalogoCrud.jsx"));
import DocenteCrearPruebas from "./pages/Docente/Crear pruebas/DocenteCrearPruebas.jsx";
import DocenteEditorPrueba from "./pages/Docente/Crear pruebas/DocenteEditorPruebas.jsx";
import DocenteProyectos from "./pages/Docente/Proyectos/DocenteProyectos.jsx";

const AdminRouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
    <p className="text-sm font-medium text-[#112F5C]">Cargando módulo de administración…</p>
  </div>
);

const cargarModuloAdmin = (elemento) => (
  <Suspense fallback={<AdminRouteFallback />}>{elemento}</Suspense>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

      <Routes>

        {/* Login */}
        <Route
          path="/"
          element={<Dashboard />}
        />

        {/* Docente */}
        <Route element={<ProtectedRoute rolesPermitidos={[ROL.DOCENTE]} />}>
        <Route element={<DocenteLayout />}>

          <Route
            path="/docente"
            element={<DocenteInicio />}
          />
          <Route path="/docente/perfil" element={<DocentePerfil />} />
          <Route path="/docente/grupos" element={<DocenteMisGrupos />} />
          <Route path="/docente/microcurriculos" element={<DocenteMicrocurriculos />} />
          <Route path="/docente/fichas-desarrollo" element={<DocenteFichasDesarrollo />} />
          <Route path="/docente/evaluaciones/crear" element={<DocenteCrearPruebas />} />
          <Route path="/docente/evaluaciones/editor/:idEvaluacion" element={<DocenteEditorPrueba />} />
          <Route
            path="/docente/evaluaciones/interestructurante"
            element={<DocenteProyectos categoria="interestructurante" />}
          />
          <Route
            path="/docente/evaluaciones/tesis"
            element={<DocenteProyectos categoria="tesis" />}
          />
          <Route path="/docente/reportes" element={<DocenteReportes />} />
        </Route>
        </Route>


        {/* Administrador con layout */}
        <Route element={<ProtectedRoute rolesPermitidos={[ROL.ADMIN]} />}>
        <Route element={<AdminLayout />}>

          <Route
            path="/admin"
            element={cargarModuloAdmin(<AdminInicio />)}
          />
          <Route path="/admin/perfil" element={cargarModuloAdmin(<AdminPerfil />)} />
          <Route path="/admin/usuarios/*" element={<ModuloPendiente />} />
          <Route path="/admin/espacios" element={cargarModuloAdmin(<AdminEspaciosAcademicos />)} />
          <Route path="/admin/espacios/docentes" element={cargarModuloAdmin(<AdminListaDocentes />)} />
          <Route path="/admin/espacios/estudiantes" element={cargarModuloAdmin(<AdminListaEstudiantes />)} />
          <Route path="/admin/espacios/docente/:idUser" element={cargarModuloAdmin(<AdminDetalleDocente />)} />
          <Route path="/admin/espacios/estudiante/:idUser" element={cargarModuloAdmin(<AdminDetalleEstudiante />)} />
          <Route path="/admin/catalogos/:recurso" element={cargarModuloAdmin(<AdminCatalogoCrud />)} />
          <Route path="/admin/carga-docente" element={<ModuloPendiente />} />
          <Route path="/admin/carga-estudiante" element={<ModuloPendiente />} />
          <Route path="/admin/microcurriculos" element={cargarModuloAdmin(<AdminMicrosFichas tipo="micros" />)} />
          <Route path="/admin/fichas-desarrollo" element={cargarModuloAdmin(<AdminMicrosFichas tipo="fichas" />)} />
          <Route path="/admin/micros-fichas" element={<Navigate to="/admin/microcurriculos" replace />} />
          <Route path="/admin/rap/*" element={<ModuloPendiente />} />
          <Route path="/admin/evaluaciones/crear" element={cargarModuloAdmin(<AdminCrearPruebas />)} />
          <Route path="/admin/evaluaciones/editor/:idPrueba" element={cargarModuloAdmin(<AdminEditorPrueba />)} />
          <Route path="/admin/evaluaciones/interestructurante" element={cargarModuloAdmin(<AdminProyectos categoria="interestructurante" />)} />
          <Route path="/admin/evaluaciones/modalidad-grado" element={cargarModuloAdmin(<AdminModalidadGrado />)} />
          <Route path="/admin/evaluaciones/*" element={<ModuloPendiente />} />
          <Route path="/admin/parametrizacion" element={cargarModuloAdmin(<AdminParametrizacion />)} />
          <Route path="/admin/auditoria" element={<ModuloPendiente />} />

          <Route path="/admin/reportes" element={<ReportesGlobal />} />
        </Route>
        </Route>

{/* Estudiante con layout */}
        <Route element={<ProtectedRoute rolesPermitidos={[ROL.ESTUDIANTE]} />}>
        <Route element={<EstudianteLayout />}>
          <Route path="/estudiante" element={<EstudianteInicio />} />
          <Route path="/estudiante/perfil" element={<EstudiantePerfil />} />
          <Route path="/estudiante/evaluaciones" element={<EstudiantePruebas />} />
          <Route path="/estudiante/evaluaciones/examen/:idEvaluacion" element={<EstudianteExamenActivo />} />
          <Route path="/estudiante/proyectos" element={<MisProyectos />} />
          <Route path="/estudiante/modalidad-grado" element={<ModalidadGrado />} />
          <Route path="/estudiante/resultados" element={<MisResultados />} />
          <Route path="/estudiante/reportes" element={<ReportesGlobal />} />
        </Route>
        </Route>

      </Routes>

      </AuthProvider>

    </BrowserRouter>
  );
}

export default App;
