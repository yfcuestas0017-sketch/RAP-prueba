import React, { useState, useEffect } from 'react';
import { 
  FaUsers, 
  FaSyncAlt, 
  FaExclamationCircle, 
  FaGraduationCap, 
  FaClock, 
  FaArrowLeft,
  FaBookOpen
} from 'react-icons/fa';

export default function DocenteMisGrupos() {
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState('');

  // 1. Cargar la lista general de grupos
  const cargarGrupos = async () => {
    try {
      setLoading(true);
      setError('');

      const respuesta = await fetch('http://localhost:3000/api/docente/grupos', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(datos.mensaje || 'Error al obtener los grupos asignados');
      }

      setGrupos(datos.grupos || []);
    } catch (err) {
      console.error('Error obteniendo grupos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarGrupos();
  }, []);

  // 2. Cargar detalle de un grupo específico
  const handleVerGrupo = async (idGrupo) => {
    try {
      setLoadingDetalle(true);
      const respuesta = await fetch(`http://localhost:3000/api/docente/grupos/${idGrupo}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const datos = await respuesta.json();

      if (!respuesta.ok || !datos.success) {
        throw new Error(datos.mensaje || 'No tiene acceso a este grupo');
      }

      setGrupoSeleccionado(datos.grupo);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingDetalle(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando grupos asignados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <FaExclamationCircle className="text-4xl text-[#B3282D] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#112F5C] mb-2">Error de conexión</h2>
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-6 font-mono text-left">{error}</p>
          <button
            onClick={cargarGrupos}
            className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow"
          >
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      
      {/* VISTA DETALLE DEL GRUPO SELECCIONADO */}
      {grupoSeleccionado ? (
        <div className="space-y-6">
          <button
            onClick={() => setGrupoSeleccionado(null)}
            className="flex items-center gap-2 text-[#112F5C] font-bold text-xs hover:underline bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm w-fit"
          >
            <FaArrowLeft /> Volver a Mis Grupos
          </button>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <span className="bg-blue-100 text-[#112F5C] text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                  {grupoSeleccionado.programa}
                </span>
                <h1 className="text-xl font-bold text-[#112F5C] mt-2">
                  Grupo {grupoSeleccionado.nombre} — {grupoSeleccionado.nombre_semestre || `Semestre ${grupoSeleccionado.semestre}`}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Periodo Académico: {grupoSeleccionado.periodo} | Jornada: {grupoSeleccionado.jornada}
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-xl font-bold text-center">
                ● Estado del Grupo: Activo
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Semestre Académico</p>
                <p className="text-sm font-bold text-[#112F5C] mt-1">{grupoSeleccionado.semestre}.º Semestre</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Jornada / Código</p>
                <p className="text-sm font-bold text-[#112F5C] mt-1">{grupoSeleccionado.jornada} ({grupoSeleccionado.codigo_jornada || 'N/A'})</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Periodo Vigente</p>
                <p className="text-sm font-bold text-[#112F5C] mt-1">{grupoSeleccionado.periodo}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-xs text-[#112F5C]">
              <strong>Nota del Docente:</strong> Desde esta vista puede gestionar la carga académica, aplicar evaluaciones de Resultado de Aprendizaje (RAP) y consultar el progreso del grupo.
            </div>
          </div>
        </div>
      ) : (
        /* VISTA PRINCIPAL: GRID DE GRUPOS */
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#112F5C]">Mis Grupos Asignados</h1>
            <p className="text-xs text-gray-500 mt-0.5">Consulte los grupos académicos asignados a su carga docente en el periodo lectivo.</p>
          </div>

          {grupos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm text-gray-400 space-y-3">
              <FaUsers className="text-4xl mx-auto text-gray-300" />
              <p className="text-xs font-semibold text-gray-500">No tiene grupos académicos asignados activamente en este periodo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {grupos.map((g) => (
                <div 
                  key={g.id_grupo}
                  className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {g.semestre}.º Semestre
                      </span>
                      <span className="text-[10px] font-bold text-gray-400">
                        {g.periodo}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-[#112F5C] leading-snug">
                        Grupo {g.nombre}
                      </h3>
                      <p className="text-xs font-medium text-gray-500 mt-0.5">
                        {g.programa}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <FaGraduationCap className="text-gray-400" />
                        <span>{g.nombre_semestre || `Semestre ${g.semestre}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaClock className="text-gray-400" />
                        <span>Jornada: {g.jornada} ({g.codigo_jornada || 'J1'})</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleVerGrupo(g.id_grupo)}
                    disabled={loadingDetalle}
                    className="w-full bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2"
                  >
                    <FaBookOpen /> Ver Carga y Evaluaciones
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}