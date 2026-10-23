import React, { useEffect, useMemo, useState } from 'react';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaFolderOpen,
  FaSearch,
  FaUsers,
  FaLock,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaBook,
  FaCalendarAlt,
  FaEnvelope
} from 'react-icons/fa';
import { fetchJSON } from '../../../services/api';
import { esProyectoGrado } from '../../../utils/proyectos.js';

const CATEGORIAS = {
  interestructurante: {
    titulo: 'Ver Proyectos Interestructurantes',
    descripcion: 'Proyectos interestructurantes registrados por los estudiantes de sus grupos asignados.',
    vacio: 'No hay proyectos interestructurantes registrados en sus grupos asignados.'
  },
  tesis: {
    titulo: 'Ver Proyecto de Grado',
    descripcion: 'Proyectos de grado, tesis y coterminalidad registrados por los estudiantes de sus grupos asignados.',
    vacio: 'No hay proyectos de grado registrados en sus grupos asignados.'
  }
};

const fechaCorta = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

function TarjetaProyecto({ proyecto }) {
  const [expandido, setExpandido] = useState(false);
  const informacion = (proyecto.informacion || '').trim();
  const descripcion = (proyecto.descripcion || '').trim();
  const textoLargo = informacion || descripcion;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#112F5C]">
            {proyecto.estudiante_nombre} {proyecto.estudiante_apellido}
          </p>
          <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
            <FaEnvelope className="text-gray-400" /> {proyecto.correo || 'Sin correo'}
          </p>
          <p className="text-[11px] text-gray-500">
            Código: <span className="font-semibold">{proyecto.id_user_institucional || 'N/A'}</span>
          </p>
        </div>
        <span className="shrink-0 px-3 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
          {proyecto.estado || 'REGISTRADO'}
        </span>
      </div>

      <div className="border-t border-gray-100 pt-3">
        <p className="text-sm font-semibold text-gray-800">
          {proyecto.nombre || 'Proyecto sin nombre'}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {proyecto.tipo_proyecto || 'Sin tipo especificado'}
          {proyecto.especializacion === true ? ' · Especialización' : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-600">
        <p className="flex items-center gap-1.5">
          <FaUsers className="text-gray-400" />
          {proyecto.grupo || 'N/A'} {proyecto.codigo_grupo ? `(${proyecto.codigo_grupo})` : ''}
        </p>
        <p className="flex items-center gap-1.5">
          <FaBook className="text-gray-400" /> Semestre {proyecto.semestre || 'N/A'}
        </p>
        <p className="flex items-center gap-1.5">
          <FaCalendarAlt className="text-gray-400" /> {fechaCorta(proyecto.fecha_registro)}
        </p>
        <p className="flex items-center gap-1.5">
          <FaInfoCircle className="text-gray-400" /> {proyecto.periodo || 'Periodo —'}
        </p>
      </div>

      {textoLargo && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p className={`text-[11px] text-gray-600 leading-relaxed whitespace-pre-line ${expandido ? '' : 'line-clamp-3'}`}>
            {textoLargo}
          </p>
          <button
            type="button"
            onClick={() => setExpandido((valor) => !valor)}
            className="mt-2 text-[11px] font-semibold text-[#112F5C] flex items-center gap-1 hover:underline"
          >
            {expandido ? <FaChevronUp /> : <FaChevronDown />}
            {expandido ? 'Ver menos' : 'Ver información completa'}
          </button>
        </div>
      )}

      <button
        type="button"
        disabled
        title="Registro de notas pendiente: el backend aún no expone el servicio de calificación de proyectos (proyecto de grado / interestructurante)."
        className="mt-auto w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-400 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-not-allowed"
      >
        <FaLock /> Calificar (no disponible)
      </button>
    </div>
  );
}

export default function DocenteProyectos({ categoria = 'interestructurante' }) {
  const config = CATEGORIAS[categoria] || CATEGORIAS.interestructurante;

  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('');

  const cargarDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const resultado = await fetchJSON('/api/docente/dashboard');
      setDatos(resultado);
    } catch (err) {
      console.error('Error cargando proyectos del docente:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  const grupos = useMemo(() => datos?.grupos || [], [datos]);

  // Los proyectos solo pueden venir de los grupos asignados al docente; además
  // del filtro del backend se vuelve a filtrar aquí para que jamás se muestre
  // un grupo que no le haya sido asignado.
  const idsGruposAsignados = useMemo(
    () => new Set(grupos.map((grupo) => Number(grupo.id_grupo))),
    [grupos]
  );

  const proyectos = useMemo(() => {
    const todos = datos?.proyectos || [];
    const deMisGrupos = todos.filter((proyecto) =>
      idsGruposAsignados.has(Number(proyecto.id_grupo))
    );
    const deEstaCategoria = deMisGrupos.filter((proyecto) =>
      categoria === 'tesis' ? esProyectoGrado(proyecto) : !esProyectoGrado(proyecto)
    );

    const texto = busqueda.trim().toLowerCase();
    return deEstaCategoria.filter((proyecto) => {
      const coincideGrupo =
        !grupoSeleccionado || String(proyecto.id_grupo) === String(grupoSeleccionado);
      if (!coincideGrupo) return false;
      if (!texto) return true;
      return (
        `${proyecto.estudiante_nombre || ''} ${proyecto.estudiante_apellido || ''}`
          .toLowerCase()
          .includes(texto) ||
        `${proyecto.nombre || ''}`.toLowerCase().includes(texto) ||
        `${proyecto.grupo || ''} ${proyecto.codigo_grupo || ''}`.toLowerCase().includes(texto)
      );
    });
  }, [datos, idsGruposAsignados, categoria, busqueda, grupoSeleccionado]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando proyectos de sus grupos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <FaExclamationCircle className="text-4xl text-[#B3282D] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#112F5C] mb-2">Error de respuesta del Servidor</h2>
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-6 font-mono text-left">{error}</p>
          <button
            onClick={cargarDashboard}
            className="bg-[#112F5C] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow"
          >
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#112F5C]">{config.titulo}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{config.descripcion}</p>
        </div>
        <button
          onClick={cargarDashboard}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <FaSyncAlt className="text-xs" />
          Actualizar Datos
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <FaInfoCircle className="text-blue-600 text-base mt-0.5 shrink-0" />
        <p className="text-xs text-blue-900 leading-relaxed">
          Esta vista muestra <strong>únicamente los proyectos de los grupos que tienen su usuario asignado</strong>.
          Los grupos que no le han sido asignados quedan ocultos: no es posible ver sus proyectos ni registrar
          notas sobre ellos.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#112F5C] flex items-center gap-2">
            <FaUsers /> Grupos asignados a usted ({grupos.length})
          </h2>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar estudiante, proyecto o grupo..."
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
            />
          </div>
        </div>

        {grupos.length === 0 ? (
          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-xl p-3">
            No tiene grupos asignados actualmente, por lo tanto no puede ver ni calificar proyectos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGrupoSeleccionado('')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
                grupoSeleccionado === ''
                  ? 'bg-[#112F5C] text-white border-[#112F5C]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              Todos mis grupos
            </button>
            {grupos.map((grupo) => {
              const activo = String(grupoSeleccionado) === String(grupo.id_grupo);
              return (
                <button
                  type="button"
                  key={grupo.id_grupo}
                  onClick={() => setGrupoSeleccionado(grupo.id_grupo)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
                    activo
                      ? 'bg-[#112F5C] text-white border-[#112F5C]'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {grupo.nombre} {grupo.codigo_grupo ? `· ${grupo.codigo_grupo}` : ''}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#112F5C]">Proyectos encontrados ({proyectos.length})</h2>

        {proyectos.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FaFolderOpen className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-xs font-semibold text-gray-500">
              {grupos.length === 0
                ? 'Sin grupos asignados: no hay proyectos que mostrar.'
                : config.vacio}
            </p>
            {(busqueda || grupoSeleccionado) && grupos.length > 0 && (
              <p className="text-[11px] text-gray-400 mt-1">
                Ajuste la búsqueda o seleccione «Todos mis grupos».
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {proyectos.map((proyecto) => (
              <TarjetaProyecto key={proyecto.id_proyecto} proyecto={proyecto} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
