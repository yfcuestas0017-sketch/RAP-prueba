import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaClipboardCheck,
  FaFolderOpen,
  FaEye,
  FaSearch,
  FaSyncAlt,
  FaChalkboardTeacher,
  FaGraduationCap,
  FaBook,
  FaCalendarAlt,
  FaExclamationCircle
} from "react-icons/fa";
import { API_BASE_URL } from '../../config';

const DocenteInicio = () => {
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-4xl text-blue-600 animate-spin mx-auto mb-4" />

          <p className="text-gray-600 text-lg">
            Cargando información del docente...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white shadow-lg rounded-xl p-8 max-w-lg w-full text-center">
          <FaExclamationCircle className="text-5xl text-red-500 mx-auto mb-4" />

          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No se pudo cargar el dashboard
          </h2>

          <p className="text-gray-600 mb-6">
            {error}
          </p>

          <button
            onClick={cargarDashboard}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
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
    pendientesCalificar: 0,
    archivosRecibidos: 0
  };

  const grupos = datos?.grupos || [];
  const evaluaciones = datos?.evaluaciones || [];
  const proyectos = datos?.proyectos || [];

  const proyectosFiltrados = proyectos.filter((proyecto) => {
    const texto = busqueda.toLowerCase();

    return (
      `${proyecto.estudiante_nombre || ""} ${
        proyecto.estudiante_apellido || ""
      }`
        .toLowerCase()
        .includes(texto) ||
      `${proyecto.nombre || ""}`.toLowerCase().includes(texto) ||
      `${proyecto.programa || ""}`.toLowerCase().includes(texto) ||
      `${proyecto.grupo || ""}`.toLowerCase().includes(texto) ||
      `${proyecto.codigo_grupo || ""}`.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="min-h-screen bg-gray-100">

      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <div className="flex items-center gap-3">
                <FaChalkboardTeacher className="text-3xl text-blue-600" />

                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Panel del Docente
                  </h1>

                  <p className="text-gray-500 text-sm">
                    Gestión académica y seguimiento de estudiantes
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={cargarDashboard}
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition"
            >
              <FaSyncAlt />
              Actualizar
            </button>

          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <Link
            to="/docente/grupos"
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">

              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Gestión carga docente
                </p>

                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {estadisticas.totalGrupos}
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Grupos asignados
                </p>
              </div>

              <div className="bg-blue-100 p-4 rounded-full">
                <FaUsers className="text-2xl text-blue-600" />
              </div>

            </div>
          </Link>

          <Link
            to="/docente/pendientes"
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">

              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Pendientes por calificar
                </p>

                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {estadisticas.pendientesCalificar}
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Evaluaciones pendientes
                </p>
              </div>

              <div className="bg-yellow-100 p-4 rounded-full">
                <FaClipboardCheck className="text-2xl text-yellow-600" />
              </div>

            </div>
          </Link>

          <Link
            to="/docente/archivos"
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">

              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Archivos recibidos
                </p>

                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {estadisticas.archivosRecibidos}
                </p>

                <p className="text-gray-500 text-sm mt-1">
                  Proyectos registrados
                </p>
              </div>

              <div className="bg-green-100 p-4 rounded-full">
                <FaFolderOpen className="text-2xl text-green-600" />
              </div>

            </div>
          </Link>

        </div>

        <section className="bg-white rounded-xl shadow-sm mb-8">

          <div className="p-6 border-b">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Mis grupos asignados
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Grupos académicos asociados a su usuario
                </p>
              </div>

              <FaUsers className="text-2xl text-blue-600" />

            </div>

          </div>

          <div className="p-6">

            {grupos.length === 0 ? (

              <div className="text-center py-8 text-gray-500">
                <FaUsers className="text-4xl mx-auto mb-3 text-gray-300" />

                <p>
                  No tiene grupos asignados actualmente.
                </p>
              </div>

            ) : (

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {grupos.map((grupo) => (

                  <div
                    key={grupo.id_grupo}
                    className="border rounded-lg p-5 hover:border-blue-400 transition"
                  >

                    <div className="flex items-start justify-between">

                      <div>
                        <h3 className="font-bold text-gray-800">
                          {grupo.nombre}
                        </h3>

                        <p className="text-sm text-gray-500 mt-1">
                          Código: {grupo.codigo_jornada || "Sin código"}
                        </p>
                      </div>

                      <FaGraduationCap className="text-blue-500 text-xl" />

                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">

                      <p>
                        <strong>Semestre:</strong>{" "}
                        {grupo.semestre || "N/A"}
                      </p>

                      <p>
                        <strong>Programa:</strong>{" "}
                        {grupo.programa || "N/A"}
                      </p>

                      <p>
                        <strong>Jornada:</strong>{" "}
                        {grupo.jornada || "N/A"}
                      </p>

                      <p>
                        <strong>Periodo:</strong>{" "}
                        {grupo.periodo || "N/A"}
                      </p>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </section>

        <section className="bg-white rounded-xl shadow-sm mb-8">

          <div className="p-6 border-b">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Mis evaluaciones
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Evaluaciones creadas por el docente
                </p>
              </div>

              <FaClipboardCheck className="text-2xl text-blue-600" />

            </div>

          </div>

          <div className="overflow-x-auto">

            {evaluaciones.length === 0 ? (

              <div className="text-center py-8 text-gray-500">
                No existen evaluaciones registradas.
              </div>

            ) : (

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Evaluación
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Grupo
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Semestre
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Estado
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Respuestas
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y">

                  {evaluaciones.map((evaluacion) => (

                    <tr
                      key={evaluacion.id_evaluacion}
                      className="hover:bg-gray-50"
                    >

                      <td className="px-6 py-4">

                        <div className="font-medium text-gray-800">
                          {evaluacion.nombre}
                        </div>

                        <div className="text-xs text-gray-500">
                          ID: {evaluacion.id_evaluacion}
                        </div>

                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {evaluacion.grupo || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {evaluacion.semestre || "N/A"}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            evaluacion.estado
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {evaluacion.estado
                            ? "Activa"
                            : "Inactiva"}
                        </span>

                      </td>

                      <td className="px-6 py-4 text-gray-700">
                        {evaluacion.total_respuestas || 0}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </section>

        <section className="bg-white rounded-xl shadow-sm">

          <div className="p-6 border-b">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>

                <h2 className="text-xl font-bold text-gray-800">
                  Gestión de proyectos recibidos
                </h2>

                <p className="text-gray-500 text-sm mt-1">
                  Proyectos registrados por los estudiantes de sus grupos
                </p>

              </div>

              <div className="relative">

                <FaSearch className="absolute left-3 top-3 text-gray-400" />

                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar estudiante o proyecto..."
                  className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

            </div>

          </div>

          <div className="overflow-x-auto">

            {proyectosFiltrados.length === 0 ? (

              <div className="text-center py-10 text-gray-500">

                <FaFolderOpen className="text-5xl mx-auto mb-4 text-gray-300" />

                <p className="font-medium">
                  No hay proyectos registrados.
                </p>

                {busqueda && (
                  <p className="text-sm mt-1">
                    No se encontraron resultados para "{busqueda}".
                  </p>
                )}

              </div>

            ) : (

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Estudiante
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Código
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Proyecto
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Grupo
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Semestre
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Estado
                    </th>

                    <th className="text-center px-6 py-4 text-sm font-semibold text-gray-600">
                      Acción
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y">

                  {proyectosFiltrados.map((proyecto) => (

                    <tr
                      key={proyecto.id_proyecto}
                      className="hover:bg-gray-50"
                    >

                      {/* ESTUDIANTE */}

                      <td className="px-6 py-4">

                        <div className="font-medium text-gray-800">

                          {proyecto.estudiante_nombre}{" "}
                          {proyecto.estudiante_apellido}

                        </div>

                        <div className="text-xs text-gray-500">
                          {proyecto.correo || ""}
                        </div>

                      </td>

                      <td className="px-6 py-4 text-gray-600">

                        {proyecto.id_user_institucional ||
                          "N/A"}

                      </td>

                      <td className="px-6 py-4">

                        <div className="font-medium text-gray-800">

                          {proyecto.nombre ||
                            "Proyecto sin nombre"}

                        </div>

                        <div className="text-xs text-gray-500">

                          {proyecto.tipo_proyecto ||
                            "Sin tipo"}

                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <div className="text-gray-700">
                          {proyecto.grupo || "N/A"}
                        </div>

                        <div className="text-xs text-gray-500">
                          {proyecto.codigo_grupo || ""}
                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-2 text-gray-600">

                          <FaBook className="text-gray-400" />

                          {proyecto.semestre || "N/A"}

                        </div>

                      </td>

                      <td className="px-6 py-4">

                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">

                          {proyecto.estado || "Registrado"}

                        </span>

                      </td>

                      <td className="px-6 py-4 text-center">

                        <Link
                          to={`/docente/proyecto/${proyecto.id_proyecto}`}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          <FaEye />
                          Ver
                        </Link>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </section>

        <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-5">

          <div className="flex gap-3">

            <FaCalendarAlt className="text-blue-600 text-xl mt-1" />

            <div>

              <h3 className="font-semibold text-blue-800">
                Información del panel
              </h3>

              <p className="text-sm text-blue-700 mt-1">
                La información mostrada corresponde a los grupos,
                evaluaciones y proyectos asociados al docente que
                inició sesión.
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
};

export default DocenteInicio;

