import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUser,
  FaSlidersH,
  FaClipboardCheck,
  FaTimes,
  FaSyncAlt,
  FaExclamationCircle,
  FaSearch,
  FaPlus
} from "react-icons/fa";
import { API_BASE_URL } from '../../../config';

export default function AdminInicio() {
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Estado del formulario lateral
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoAdmin, setNuevoAdmin] = useState({ usuario: "", password: "" });
  const [guardando, setGuardando] = useState(false);

  // 1. Cargar métricas del dashboard desde el Backend (PostgreSQL)
  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const respuesta = await fetch(`${API_BASE_URL}/api/users/usuarios`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });

      const resultado = await respuesta.json();

      if (respuesta.ok && resultado.success) {
        const usuarios = Array.isArray(resultado.usuarios) ? resultado.usuarios : [];
        setDatos({
          estadisticas: {
            usuariosActivos: usuarios.filter((u) => u.estado).length,
            rapsParametrizados: 0,
            pruebasActivas: 0
          },
          cargaDocente: []
        });
      } else {
        throw new Error(resultado.mensaje || "No se pudo cargar la información de administración");
      }
    } catch (err) {
      console.error("Error cargando dashboard administrador:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  // 2. Crear nuevo administrador vía API REST
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!nuevoAdmin.usuario || !nuevoAdmin.password) {
      alert("Por favor complete todos los campos.");
      return;
    }

    try {
      setGuardando(true);
      const respuesta = await fetch(`${API_BASE_URL}/api/admin/crear`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(nuevoAdmin)
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || "Error al crear el administrador");
      }

      alert(`Administrador ${nuevoAdmin.usuario} guardado correctamente.`);
      setNuevoAdmin({ usuario: "", password: "" });
      setMostrarFormulario(false);
      cargarDashboard(); // Recargar métricas tras guardar
    } catch (err) {
      if (err.message && err.message.includes("404")) {
        alert("El servidor aún no tiene el endpoint para crear administradores (POST /api/admin/crear).");
      } else {
        alert(`Error: ${err.message}`);
      }
    } finally {
      setGuardando(false);
    }
  };

  // Pantalla de Carga
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">
            Cargando información administrativa...
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

  // Desestructuración de métricas con valores por defecto
  const estadisticas = datos?.estadisticas || {
    usuariosActivos: 0,
    rapsParametrizados: 0,
    pruebasActivas: 0
  };

  const cargaDocente = datos?.cargaDocente || [];

  // Filtro dinámico en cliente
  const cargaFiltrada = cargaDocente.filter((row) => {
    const texto = busqueda.toLowerCase();
    return (
      `${row.docente || ""}`.toLowerCase().includes(texto) ||
      `${row.materia || ""}`.toLowerCase().includes(texto) ||
      `${row.grupo || ""}`.toLowerCase().includes(texto) ||
      `${row.semestre || ""}`.toLowerCase().includes(texto)
    );
  });

  return (
    <div className="w-full relative animate-fade-in space-y-6">
      
      {/* 1. ENCABEZADO PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#112F5C]">
            Panel de Control - Administrador
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Visión global del programa, indicadores institucionales y accesos de configuración.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={cargarDashboard}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] px-3.5 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <FaSyncAlt className="text-xs" />
            Actualizar
          </button>

          <button
            onClick={() => setMostrarFormulario(true)}
            className="flex items-center gap-2 bg-[#B3282D] hover:bg-red-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow transition-all"
          >
            <FaPlus /> Agregar Administrador
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* SECCIÓN PRINCIPAL */}
        <div className={mostrarFormulario ? "lg:col-span-2 space-y-6" : "lg:col-span-3 space-y-6"}>
          
          {/* 2. TARJETAS DE INDICADORES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Card 1 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-700 uppercase">Usuarios Activos</p>
                <p className="text-2xl font-bold text-[#112F5C] mt-0.5">
                  {estadisticas.usuariosActivos} Cuentas
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Usuarios activos en sistema</p>
                <Link to="/admin/usuarios" className="text-xs font-bold text-[#112F5C] mt-2 inline-block hover:underline">
                  Ver usuarios &rarr;
                </Link>
              </div>
              <div className="p-3 bg-blue-50 text-[#112F5C] rounded-full text-lg shrink-0">
                <FaUser />
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-700 uppercase">RAPs Parametrizados</p>
                <p className="text-2xl font-bold text-[#B3282D] mt-0.5">
                  {estadisticas.rapsParametrizados} Definidos
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Nodos RAP configurados</p>
                <Link to="/admin/raps" className="text-xs font-bold text-[#112F5C] mt-2 inline-block hover:underline">
                  Ver RAPs &rarr;
                </Link>
              </div>
              <div className="p-3 bg-red-50 text-[#B3282D] rounded-full text-lg shrink-0">
                <FaSlidersH />
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-gray-700 uppercase">Pruebas Activas</p>
                <p className="text-2xl font-bold text-[#112F5C] mt-0.5">
                  {estadisticas.pruebasActivas} Evaluaciones
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">Evaluaciones por revisar</p>
                <Link to="/admin/evaluaciones" className="text-xs font-bold text-[#112F5C] mt-2 inline-block hover:underline">
                  Ver evaluaciones &rarr;
                </Link>
              </div>
              <div className="p-3 bg-teal-50 text-teal-600 rounded-full text-lg shrink-0">
                <FaClipboardCheck />
              </div>
            </div>

          </div>

          {/* 3. ACCIONES RÁPIDAS DE CONFIGURACIÓN */}
          <div>
            <h2 className="text-sm font-bold text-[#112F5C] mb-3 uppercase">
              Acciones Rápidas de Configuración
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                to="/admin/parametrizar-pruebas"
                className="bg-[#112F5C] text-white py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-blue-900 transition-all shadow-sm text-center"
              >
                Parametrizar Pruebas
              </Link>
              <Link
                to="/admin/asignar-carga"
                className="bg-white border border-gray-300 text-gray-700 py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-all shadow-sm text-center"
              >
                Asignar Carga Docente
              </Link>
              <Link
                to="/admin/reportes"
                className="bg-[#B3282D] text-white py-2.5 px-4 rounded-xl text-xs font-semibold hover:bg-red-800 transition-all shadow-sm text-center"
              >
                Exportar Reportes
              </Link>
            </div>
          </div>

          {/* 4. TABLA DE CARGA DOCENTE */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#112F5C]">
                  Carga Docente y Asignaciones
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Consulte y administre la relación entre docentes, espacios académicos, semestres y grupos.
                </p>
              </div>

              {/* Buscador de la Tabla */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-2.5 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar docente o materia..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C] shadow-sm w-full md:w-56"
                />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                {cargaFiltrada.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <p className="text-xs font-semibold">No se encontraron asignaciones docentes.</p>
                    {busqueda && <p className="text-[11px] text-gray-400 mt-1">Sin resultados para "{busqueda}"</p>}
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#112F5C] text-white font-semibold">
                      <tr>
                        <th className="px-4 py-3.5">Docente Asignado</th>
                        <th className="px-4 py-3.5">Espacio Académico (Materia)</th>
                        <th className="px-4 py-3.5">Semestre / Momento</th>
                        <th className="px-4 py-3.5">Grupo y Jornada</th>
                        <th className="px-4 py-3.5 text-center">Acción</th>
                        <th className="px-4 py-3.5 text-center">Gestión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cargaFiltrada.map((row, idx) => (
                        <tr key={row.id || idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-[#112F5C]">
                            {row.docente}
                            <p className="text-[10px] text-gray-400 font-normal">{row.tipo || "Tiempo Completo"}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-gray-800 font-medium">{row.materia}</p>
                            <p className="text-[10px] text-gray-400">{row.periodo}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-gray-800">{row.semestre}</p>
                            <p className="text-[10px] text-gray-400">{row.evaluacion}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                              String(row.grupo).includes("Noct") 
                                ? "bg-amber-100 text-amber-800" 
                                : "bg-sky-100 text-sky-800"
                            }`}>
                              {row.grupo}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <Link
                              to={`/admin/carga/editar/${row.id}`}
                              className="inline-block bg-[#112F5C] text-white px-3.5 py-1 rounded-lg text-[11px] font-semibold hover:bg-blue-900 transition-colors"
                            >
                              Editar
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <button className="bg-[#B3282D] text-white px-3.5 py-1 rounded-lg text-[11px] font-semibold hover:bg-red-800 transition-colors">
                              Cambiar
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

        </div>

        {/* 5. PANEL LATERAL DESPLEGABLE */}
        {mostrarFormulario && (
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-4 animate-fade-in relative">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-[#112F5C]">
                Crear Nuevo Administrador
              </h3>
              <button 
                onClick={() => setMostrarFormulario(false)}
                className="text-gray-400 hover:text-red-600 transition-colors p-1"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Usuario / Correo
                </label>
                <input
                  type="text"
                  placeholder="Ej. admin.sistemas@universidad.edu.co"
                  value={nuevoAdmin.usuario}
                  onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, usuario: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={nuevoAdmin.password}
                  onChange={(e) => setNuevoAdmin({ ...nuevoAdmin, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full bg-[#B3282D] hover:bg-red-800 text-white font-bold py-3 rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {guardando ? "Guardando..." : "Guardar Administrador"}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}