import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaClipboardList,
  FaFolderOpen,
  FaCommentDots,
  FaSyncAlt,
  FaExclamationCircle,
  FaTimes,
  FaInfoCircle
} from "react-icons/fa";
import { API_BASE_URL } from '../../../config';

export default function EstudianteInicio() {
  const [estudiante, setEstudiante] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Estado para el selector de RAP
  const [rapSeleccionado, setRapSeleccionado] = useState("");
  const [criteriosEvaluacion, setCriteriosEvaluacion] = useState([]);

  // Estado para el modal de observaciones
  const [observacionActiva, setObservacionActiva] = useState(null);

  // 1. Cargar el perfil del estudiante desde la API REST
  const cargarDashboard = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(`${API_BASE_URL}/api/estudiante/perfil`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "No se pudo obtener la información del estudiante");
      }

      setEstudiante(resultado.estudiante);
    } catch (err) {
      console.error("Error cargando perfil estudiante:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  // 2. Cambiar criterios según el RAP seleccionado
  const handleCambioRap = (idRap) => {
    setRapSeleccionado(idRap);
    setCriteriosEvaluacion([]);
  };

  // Función auxiliar para formatear los colores según el nivel
  const obtenerEstiloNivel = (nivel) => {
    switch (nivel?.toLowerCase()) {
      case "excelente":
        return "bg-emerald-100 text-emerald-700";
      case "bueno":
        return "bg-blue-100 text-blue-700";
      case "aceptable":
        return "bg-sky-100 text-sky-700";
      case "insuficiente":
        return "bg-red-100 text-red-700";
      default:
        return "bg-amber-100 text-amber-700"; // Pendiente
    }
  };

  // Pantalla de Carga
  if (cargando) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">
            Cargando el perfil de estudiante...
          </p>
        </div>
      </div>
    );
  }

  // Pantalla de Error
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

  const nombreEstudiante = estudiante
    ? `${estudiante.nombre || ""} ${estudiante.apellido || ""}`.trim()
    : "Estudiante";

  const semestre = estudiante?.semestre?.nombre || `Semestre ${estudiante?.semestre?.numero || ""}`;
  const grupo = estudiante?.grupo?.nombre;

  // Las métricas y criterios aún requieren un endpoint de dashboard (pendiente en el backend).
  const estadisticas = {
    evaluacionesPendientes: 0,
    proyectosPorCargar: 0,
    progresoPorcentaje: 0,
    rapsEvaluados: 0,
    rapsTotales: 0
  };

  return (
    <div className="w-full space-y-8 animate-fade-in relative">

      {/* 1. ENCABEZADO Y BOTÓN ACTUALIZAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#112F5C]">
            ¡Bienvenido, {nombreEstudiante}!
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Momento de evaluación actual: {semestre}.
            {grupo ? ` Grupo: ${grupo}.` : ""}
          </p>
        </div>

        <button
          onClick={cargarDashboard}
          className="self-start md:self-auto flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <FaSyncAlt className="text-xs" />
          Actualizar
        </button>
      </div>

      {/* Aviso: métricas pendientes de backend */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs">
        <FaInfoCircle className="text-base mt-0.5 shrink-0" />
        <p>
          El detalle de evaluaciones, proyectos y RAPs estará disponible cuando
          el endpoint de dashboard del estudiante quede implementado en el servidor.
        </p>
      </div>

      {/* 2. TARJETAS DE INDICADORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card 1: Evaluaciones Activas */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#112F5C] flex items-center justify-center text-xl shrink-0">
              <FaClipboardList />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">Evaluaciones activas</p>
              <p className="text-xl font-bold text-[#112F5C] mt-0.5">
                {estadisticas.evaluacionesPendientes} Pendientes
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Tienes evaluaciones por resolver
              </p>
            </div>
          </div>
          <Link
            to="/estudiante/evaluaciones"
            className="text-xs font-bold text-[#112F5C] mt-4 inline-block hover:underline"
          >
            Ver evaluaciones &rarr;
          </Link>
        </div>

        {/* Card 2: Proyectos por Cargar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xl shrink-0">
              <FaFolderOpen />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">Proyectos por cargar</p>
              <p className="text-xl font-bold text-[#B3282D] mt-0.5">
                {estadisticas.proyectosPorCargar} Requeridos
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Tienes proyectos pendientes de subir
              </p>
            </div>
          </div>
          <Link
            to="/estudiante/proyectos"
            className="text-xs font-bold text-[#112F5C] mt-4 inline-block hover:underline"
          >
            Ver proyectos &rarr;
          </Link>
        </div>

        {/* Card 3: Progreso General */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="relative w-12 h-12 rounded-full border-4 border-[#B3282D] border-t-gray-200 flex items-center justify-center font-bold text-xs text-[#112F5C] shrink-0">
              {estadisticas.progresoPorcentaje}%
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">Mi progreso general</p>
              <p className="text-sm font-bold text-[#112F5C] mt-1">
                {estadisticas.rapsEvaluados} de {estadisticas.rapsTotales} RAP evaluados
              </p>
            </div>
          </div>
          <Link
            to="/estudiante/progreso"
            className="text-xs font-bold text-[#112F5C] mt-4 inline-block hover:underline"
          >
            Ver avance detallado &rarr;
          </Link>
        </div>

      </div>

      {/* 3. DETALLE DE RESULTADOS POR RAP */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#112F5C]">
          Detalle de Resultados por RAP y Criterios
        </h2>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Seleccionar RAP:
          </label>
          <select
            value={rapSeleccionado}
            onChange={(e) => handleCambioRap(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#112F5C] focus:outline-none focus:border-[#112F5C] shadow-sm"
          >
            <option value="">No hay RAPs disponibles por el momento</option>
          </select>
        </div>

        {/* Tabla / Lista de Criterios */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-100 text-xs font-bold text-gray-600">
            <div className="col-span-7">Criterio de Evaluación (CE)</div>
            <div className="col-span-3 text-center">Nivel Alcanzado</div>
            <div className="col-span-2 text-center">Observaciones</div>
          </div>

          <div className="divide-y divide-gray-50">
            {criteriosEvaluacion.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                No hay criterios de evaluación registrados para este RAP.
              </div>
            ) : (
              criteriosEvaluacion.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 py-4 items-center text-xs">

                  <div className="col-span-7">
                    <p className="font-bold text-[#112F5C]">{item.criterio}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {item.materia} {item.fechaEvaluacion ? `- Evaluado el ${item.fechaEvaluacion}` : "- Pendiente de evaluación"}
                    </p>
                  </div>

                  <div className="col-span-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold ${obtenerEstiloNivel(
                        item.nivel
                      )}`}
                    >
                      {item.nivel || "Pendiente"}
                    </span>
                  </div>

                  <div className="col-span-2 text-center">
                    <button
                      onClick={() =>
                        setObservacionActiva(
                          item.observacion || "No hay observaciones registradas para este criterio."
                        )
                      }
                      title="Ver observaciones"
                      className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                    >
                      <FaCommentDots className="text-sm" />
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* MODAL / POPUP DE OBSERVACIONES */}
      {observacionActiva !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-fade-in border border-gray-100">
            <button
              onClick={() => setObservacionActiva(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors p-1"
            >
              <FaTimes />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <FaCommentDots className="text-purple-600 text-lg" />
              <h3 className="text-sm font-bold text-[#112F5C]">
                Observaciones del Docente
              </h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
              {observacionActiva}
            </p>
            <div className="mt-5 text-right">
              <button
                onClick={() => setObservacionActiva(null)}
                className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}