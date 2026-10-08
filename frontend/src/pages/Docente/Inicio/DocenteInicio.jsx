import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaClipboardList,
  FaFolderOpen,
  FaSyncAlt,
  FaPlus,
  FaCommentDots,
  FaExclamationCircle,
  FaSearch,
  FaExclamationTriangle,
  FaLightbulb,
  FaGraduationCap
} from "react-icons/fa";

import { API_BASE_URL } from '../../../config';
export default function DocenteInicio() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const respuesta = await fetch(
        `${API_BASE_URL}/api/docente/dashboard`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.mensaje || "No se pudo cargar el dashboard"
        );
      }

      setDatos(resultado);
    } catch (err) {
      console.error("Error cargando dashboard docente:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">
            Cargando información desde la base de datos...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <FaExclamationCircle className="text-4xl text-[#B3282D] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#112F5C] mb-2">
            Error de conexión
          </h2>
          <p className="text-xs text-gray-500 mb-6">{error}</p>
          <button
            onClick={cargarDashboard}
            className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow"
          >
            <FaSyncAlt className="inline mr-2" />
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  const estadisticas = datos?.estadisticas || {
    totalGrupos: 0,
    totalGruposInactivos: 0,
    pendientesCalificar: 0,
    archivosRecibidos: 0
  };

  const proyectos = datos?.proyectos || [];
  const grupos = datos?.grupos || [];

  const proyectosFiltrados = proyectos.filter((proyecto) => {
    const texto = busqueda.toLowerCase();
    return (
      `${proyecto.estudiante_nombre || ""} ${proyecto.estudiante_apellido || ""}`
        .toLowerCase()
        .includes(texto) ||
      `${proyecto.nombre || ""}`.toLowerCase().includes(texto) ||
      `${proyecto.programa || ""}`.toLowerCase().includes(texto) ||
      `${proyecto.grupo || ""}`.toLowerCase().includes(texto) ||
      `${proyecto.codigo_grupo || ""}`.toLowerCase().includes(texto)
    );
  });

  const esProyectoGrado = (p) =>
    p.especializacion === true || /grado|tesis/i.test(p.tipo_proyecto || "");

  const proyectosGrado = proyectosFiltrados.filter(esProyectoGrado);
  const proyectosIntegradores = proyectosFiltrados.filter(
    (p) => !esProyectoGrado(p)
  );

  return (
    <div className="w-full animate-fade-in space-y-8">
      
      {/* 1. ENCABEZADO PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#112F5C]">Panel de Inicio - Docente</h1>
          <p className="text-xs text-gray-500 mt-1">
            Gestión de carga docente, calificación de proyectos y evaluación de RAP.
          </p>
        </div>
        <button
          onClick={cargarDashboard}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <FaSyncAlt className="text-xs" />
          Actualizar Datos
        </button>
      </div>

      {/* 2. TARJETAS DE INDICADORES (Métricas reales desde PostgreSQL) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Grupos Asignados */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#112F5C] flex items-center justify-center text-xl shrink-0">
              <FaUsers />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase mb-1">Grupos asignados</h3>
              <p className="text-2xl font-bold text-[#112F5C]">
                {estadisticas.totalGrupos}{" "}
                {estadisticas.totalGruposInactivos > 0 && (
                  <span className="text-sm text-amber-600 font-bold">
                    · {estadisticas.totalGruposInactivos} inactivos
                  </span>
                )}{" "}
                Grupos
              </p>
              <p className="text-[11px] text-gray-400 mt-1 leading-tight">Grupos asignados activos</p>
            </div>
          </div>

          {estadisticas.totalGruposInactivos > 0 && (
            <div className="flex items-center gap-2 mt-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 text-[11px] font-semibold">
              <FaExclamationTriangle className="text-amber-600 shrink-0" />
              Hay {estadisticas.totalGruposInactivos} grupo(s) inactivo(s), revisar asignación.
            </div>
          )}

          {grupos.length > 0 && (
            <div className="mt-3 space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {grupos.map((g) => {
                const activo = g.estado_grupo !== false;
                return (
                  <div
                    key={g.id_grupo}
                    className="flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="font-semibold text-[#112F5C] truncate">
                      {g.nombre}
                      {g.jornada ? (
                        <span className="text-gray-400 font-normal"> — {g.jornada}</span>
                      ) : null}
                    </span>
                    {activo ? (
                      <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                        Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                        <FaExclamationTriangle className="text-[10px]" /> Inactivo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Link to="/docente/grupos" className="text-xs font-bold text-[#112F5C] mt-4 flex items-center gap-1 hover:underline">
            Ver grupos <span className="text-[10px]">&rarr;</span>
          </Link>
        </div>

        {/* Card 2: Proyectos */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#B3282D] flex items-center justify-center text-xl shrink-0">
              <FaClipboardList />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase mb-1">Proyectos</h3>
              <p className="text-2xl font-bold text-[#B3282D]">{estadisticas.archivosRecibidos} Proyectos</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-tight">Proyectos recibidos en el periodo</p>
            </div>
          </div>
          <p className="text-[11px] text-red-600 font-semibold mt-3">
            {estadisticas.pendientesCalificar} enviados por calificar
          </p>
          <Link to="/docente/reportes" className="text-xs font-bold text-[#112F5C] mt-3 flex items-center gap-1 hover:underline">
            Ver proyectos <span className="text-[10px]">&rarr;</span>
          </Link>
        </div>

        {/* Card 3: Archivos Recibidos */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xl shrink-0">
              <FaFolderOpen />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-800 uppercase mb-1">Archivos recibidos</h3>
              <p className="text-2xl font-bold text-[#112F5C]">{estadisticas.archivosRecibidos} Archivos</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-tight">Proyectos registrados</p>
            </div>
          </div>
          <Link to="/docente/archivos" className="text-xs font-bold text-[#112F5C] mt-4 flex items-center gap-1 hover:underline">
            Ver archivos <span className="text-[10px]">&rarr;</span>
          </Link>
        </div>

      </div>

      {/* 3. SECCIÓN DE TABLA DE PROYECTOS RECIBIDOS */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#112F5C]">Gestión y Revisión de Proyectos Recibidos</h2>
            <p className="text-xs text-gray-500 mt-1">
              Filtre, consulte archivos adjuntos y verifique el estado por criterio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Buscador */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-xs" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar estudiante..."
                className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C] shadow-sm w-48 md:w-60"
              />
            </div>

            <button className="flex items-center gap-2 bg-[#B3282D] hover:bg-red-800 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm shrink-0">
              <FaPlus /> Crear Evaluación
            </button>
          </div>
        </div>

        {/* Tabla con Estilos de la Maqueta Figma */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {proyectosFiltrados.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <FaFolderOpen className="text-4xl mx-auto mb-3 text-gray-300" />
                <p className="text-xs font-semibold">No se encontraron proyectos registrados.</p>
                {busqueda && <p className="text-[11px] text-gray-400 mt-1">No hay resultados para "{busqueda}"</p>}
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#112F5C] text-white font-semibold">
                  <tr>
                    <th className="px-6 py-3.5">Estudiante</th>
                    <th className="px-6 py-3.5">Espacio Académico (Materia)</th>
                    <th className="px-6 py-3.5">RAP / Criterio (CE)</th>
                    <th className="px-6 py-3.5 text-center">Acción</th>
                    <th className="px-6 py-3.5 text-center">Observaciones</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-100">
                  {proyectosFiltrados.map((row, idx) => (
                    <tr key={row.id_proyecto || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#112F5C]">
                          {row.estudiante_nombre} {row.estudiante_apellido}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Cod: {row.id_user_institucional || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-700 font-medium">{row.nombre || "Materia no asignada"}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {row.grupo || "Grupo 01 - Diurna"}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-[#112F5C]">{row.rap || "RAP 1"}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {row.criterio || "CE1. Analiza problemas de ingeniería..."}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/docente/proyecto/${row.id_proyecto}`}
                          className="inline-block bg-[#112F5C] hover:bg-blue-900 text-white px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          Ver
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors">
                          <FaCommentDots className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 4. PROYECTOS POR TIPO: INTERESTRUCTURANTE vs TESIS / PROYECTO DE GRADO */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#112F5C]">Proyectos por Tipo</h2>
          <p className="text-xs text-gray-500 mt-1">
            Clasificación de los proyectos recibidos entre interestructurantes y tesis / proyecto de grado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interestructurante */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#112F5C] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaLightbulb className="text-lg" />
                <h3 className="text-sm font-bold">Proyectos Interestructurantes</h3>
              </div>
              <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                {proyectosIntegradores.length}
              </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {proyectosIntegradores.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <FaLightbulb className="text-3xl mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-semibold">No hay proyectos interestructurantes registrados.</p>
                </div>
              ) : (
                proyectosIntegradores.map((p) => (
                  <div key={p.id_proyecto} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#112F5C] truncate">{p.nombre}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {p.estudiante_nombre} {p.estudiante_apellido} — {p.grupo || "Sin grupo"}
                      </p>
                    </div>
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0">
                      {p.estado === true ? "Recibido" : "Pendiente"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tesis / Proyecto de Grado */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 bg-[#B3282D] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaGraduationCap className="text-lg" />
                <h3 className="text-sm font-bold">Tesis / Proyecto de Grado</h3>
              </div>
              <span className="bg-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg">
                {proyectosGrado.length}
              </span>
            </div>

            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {proyectosGrado.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <FaGraduationCap className="text-3xl mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-semibold">No hay tesis o proyectos de grado registrados.</p>
                </div>
              ) : (
                proyectosGrado.map((p) => (
                  <div key={p.id_proyecto} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#112F5C] truncate">{p.nombre}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {p.estudiante_nombre} {p.estudiante_apellido} — {p.grupo || "Sin grupo"}
                      </p>
                    </div>
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0">
                      {p.estado === true ? "Recibido" : "Pendiente"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}