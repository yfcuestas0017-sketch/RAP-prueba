import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaClipboardList,
  FaEdit,
  FaInfoCircle,
  FaHistory,
  FaSearch,
  FaPlus,
  FaTrash,
  FaLock,
  FaCheck,
  FaTimes,
  FaSave,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { obtenerReportesDocente } from '../../../services/reportesService';
import { obtenerGruposDocente } from '../../../services/docenteGruposService';
import {
  obtenerPermisoCrudEvaluaciones,
  crearEvaluacion,
  actualizarEvaluacion,
  eliminarEvaluacion,
  obtenerResultadosEvaluacionDocente,
  listarEvaluacionesDocente
} from '../../../services/docenteEvaluacionesService';
import { impedirEnvioPorEnter } from '../../../utils/impedirEnvioPorEnter.js';
import DocenteSaberPro from './SaberPro/DocenteSaberPro.jsx';
import { API_BASE_URL } from '../../../config';

const FORMULARIO_VACIO = {
  nombre: '',
  id_grupo: '',
  fecha_inicio: '',
  fecha_fin: ''
};

export default function DocenteCrearPruebas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tipoPrueba, setTipoPrueba] = useState('rap');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(true);
  const [errorHistorial, setErrorHistorial] = useState('');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [filtrosHistorial, setFiltrosHistorial] = useState({ semestre: '', grupo: '', promedio: '', evaluacion: '' });

  // Sub-apartado activo dentro de las pruebas RAP (evaluaciones / historial).
  const [subApartadoRap, setSubApartadoRap] = useState('evaluaciones');
  
  // Filtro para mostrar borradores o activas
  const [filtroEstado, setFiltroEstado] = useState('todas');

  // Permiso del administrador para el modo CRUD (crear / editar / eliminar).
  // null = consultando; false = denegado (comportamiento por defecto).
  const [permisoCrud, setPermisoCrud] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [errorAccion, setErrorAccion] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [evaluacionEditando, setEvaluacionEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const tipo = searchParams.get('tipo');
    const apartado = searchParams.get('apartado');
    setTipoPrueba(tipo === 'saber-pro' ? 'saber-pro' : 'rap');
    setSubApartadoRap(apartado === 'historial' ? 'historial' : 'evaluaciones');
  }, [searchParams]);

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listarEvaluacionesDocente();
      let evaluacionesData = data.data || [];
      
      // Verificar y cerrar evaluaciones vencidas automáticamente
      const ahora = new Date();
      const evaluacionesActualizadas = await Promise.all(
        evaluacionesData.map(async (ev) => {
          if (ev.estado === 'ACTIVA' && ev.fecha_fin) {
            const fechaFin = new Date(ev.fecha_fin);
            if (ahora > fechaFin) {
              try {
                await fetch(`${API_BASE_URL}/api/docente/evaluaciones/${ev.id_evaluacion}/estado`, {
                  method: 'PUT',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ estado: 'CERRADA' })
                });
                return { ...ev, estado: 'CERRADA' };
              } catch (err) {
                console.error('Error cerrando evaluación vencida:', err);
                return ev;
              }
            }
          }
          return ev;
        })
      );
      
      setEvaluaciones(evaluacionesActualizadas);
    } catch (err) {
      console.error('Error cargando evaluaciones del docente:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEvaluaciones();
  }, []);

  useEffect(() => {
    let activo = true;

    const consultarPermiso = async () => {
      const permitido = await obtenerPermisoCrudEvaluaciones();
      if (!activo) return;
      setPermisoCrud(permitido);

      if (!permitido) return;

      try {
        const misGrupos = await obtenerGruposDocente();
        if (activo) setGrupos(misGrupos);
      } catch (err) {
        console.error('Error cargando grupos del docente:', err);
        if (activo) setGrupos([]);
      }
    };

    consultarPermiso();

    return () => {
      activo = false;
    };
  }, []);

  const cargarHistorial = async () => {
    try {
      setCargandoHistorial(true);
      setErrorHistorial('');
      const res = await obtenerReportesDocente();
      setHistorial(res?.data || []);
    } catch (err) {
      console.error('Error cargando historial de evaluaciones del docente:', err);
      setHistorial([]);
      setErrorHistorial(err.message || 'No fue posible cargar el historial de evaluaciones.');
    } finally {
      setCargandoHistorial(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const colorEstado = (estado) => {
    switch (estado) {
      case 'ACTIVA': return 'bg-emerald-100 text-emerald-800';
      case 'CERRADA': return 'bg-gray-100 text-gray-600';
      case 'ELIMINADA': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  const evaluacionesFiltradas = filtroEstado === 'todas' 
    ? evaluaciones 
    : filtroEstado === 'borradores'
      ? evaluaciones.filter(ev => ev.estado !== 'ACTIVA' && ev.estado !== 'CERRADA')
      : evaluaciones.filter(ev => ev.estado === 'ACTIVA');

  const colorPromedio = (fila) => {
    if (Number(fila.estudiantes_evaluados || 0) === 0) {
      return { clase: 'bg-gray-100 text-gray-500', texto: 'Sin respuestas' };
    }
    const pct = Number(fila.porcentaje_promedio || 0);
    if (pct >= 80) return { clase: 'bg-emerald-100 text-emerald-800', texto: `${pct.toFixed(1)}%` };
    if (pct >= 60) return { clase: 'bg-amber-100 text-amber-800', texto: `${pct.toFixed(1)}%` };
    return { clase: 'bg-red-100 text-red-800', texto: `${pct.toFixed(1)}%` };
  };

  const historialFiltrado = historial.filter((fila) => {
    const texto = busquedaHistorial.trim().toLowerCase();
    const coincideBusqueda = !texto || `${fila.evaluacion || ''} ${fila.grupo || ''} ${fila.jornada || ''}`.toLowerCase().includes(texto);
    const coincideSemestre = !filtrosHistorial.semestre || String(fila.semestre) === filtrosHistorial.semestre;
    const coincideGrupo = !filtrosHistorial.grupo || String(fila.id_grupo) === filtrosHistorial.grupo;
    const promedio = Number(fila.porcentaje_promedio);
    const sinPromedio = Number(fila.estudiantes_evaluados || 0) === 0 || fila.porcentaje_promedio === null;
    const coincidePromedio = !filtrosHistorial.promedio
      || (filtrosHistorial.promedio === 'sin-respuestas' && sinPromedio)
      || (filtrosHistorial.promedio === 'menor-60' && !sinPromedio && promedio < 60)
      || (filtrosHistorial.promedio === '60-79' && promedio >= 60 && promedio < 80)
      || (filtrosHistorial.promedio === '80-mas' && promedio >= 80);
    const coincideEvaluacion = !filtrosHistorial.evaluacion || String(fila.id_evaluacion) === filtrosHistorial.evaluacion;
    return coincideBusqueda && coincideSemestre && coincideGrupo && coincidePromedio && coincideEvaluacion;
  });

  const semestresHistorial = [...new Set(historial.map((fila) => String(fila.semestre ?? '')).filter(Boolean))]
    .sort((a, b) => Number(a) - Number(b));
  const gruposHistorial = [...new Map(historial.map((fila) => [String(fila.id_grupo), fila])).values()];

  const abrirDetalleHistorial = (fila) => {
    navigate(`/docente/evaluaciones/historial/${fila.id_evaluacion}`);
  };

  const abrirCreacion = () => {
    setEvaluacionEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario('');
    setErrorAccion('');
    setModalAbierto(true);
  };

  const abrirEdicion = (evaluacion) => {
    setEvaluacionEditando(evaluacion);
    setFormulario({
      nombre: evaluacion.nombre || '',
      id_grupo: evaluacion.id_grupo ?? '',
      fecha_inicio: (evaluacion.fecha_inicio || '').slice(0, 10),
      fecha_fin: (evaluacion.fecha_fin || '').slice(0, 10)
    });
    setErrorFormulario('');
    setErrorAccion('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    setEvaluacionEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario('');
  };

  const guardarEvaluacion = async (evento) => {
    evento.preventDefault();

    const nombre = formulario.nombre.trim();
    if (!nombre) {
      setErrorFormulario('El nombre de la evaluación es obligatorio.');
      return;
    }
    if (!formulario.id_grupo) {
      setErrorFormulario('Seleccione el grupo al que pertenece la evaluación.');
      return;
    }
    if (
      formulario.fecha_inicio &&
      formulario.fecha_fin &&
      formulario.fecha_fin < formulario.fecha_inicio
    ) {
      setErrorFormulario('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario('');
      const datos = {
        nombre,
        id_grupo: Number(formulario.id_grupo),
        fecha_inicio: formulario.fecha_inicio || null,
        fecha_fin: formulario.fecha_fin || null
      };

      if (evaluacionEditando) {
        await actualizarEvaluacion(evaluacionEditando.id_evaluacion, datos);
      } else {
        await crearEvaluacion(datos);
      }

      cerrarModal();
      await cargarEvaluaciones();
    } catch (err) {
      setErrorFormulario(err.message || 'No fue posible guardar la evaluación.');
    } finally {
      setGuardando(false);
    }
  };

  const borrarEvaluacion = async (evaluacion) => {
    const confirmado = window.confirm(
      `¿Está seguro de eliminar la evaluación "${evaluacion.nombre}"? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      setErrorAccion('');
      await eliminarEvaluacion(evaluacion.id_evaluacion);
      await cargarEvaluaciones();
    } catch (err) {
      setErrorAccion(err.message || 'No fue posible eliminar la evaluación.');
    }
  };

  const mostrarListaEvaluaciones = tipoPrueba === 'rap' && subApartadoRap === 'evaluaciones';

  if (loading && mostrarListaEvaluaciones) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando evaluaciones asignadas...</p>
        </div>
      </div>
    );
  }

  if (error && mostrarListaEvaluaciones) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <FaExclamationCircle className="text-4xl text-[#B3282D] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#112F5C] mb-2">Error de respuesta del Servidor</h2>
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-6 font-mono text-left">{error}</p>
          <button onClick={cargarEvaluaciones} className="bg-[#112F5C] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow">
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#112F5C]">Evaluaciones Asignadas — Redacción de Preguntas</h1>
        <p className="text-xs text-gray-500 mt-0.5">Solo se muestran las evaluaciones creadas por el administrador y asignadas a sus grupos.</p>
      </div>

      {tipoPrueba === 'rap' ? (
      <div className="space-y-6">

      {subApartadoRap === 'evaluaciones' && (
        <>
          {errorAccion && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
              <FaExclamationTriangle className="text-[#B3282D] text-base mt-0.5 shrink-0" />
              <p className="text-xs text-red-700 leading-relaxed">{errorAccion}</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-[#112F5C]">Evaluaciones a su cargo (2026-2)</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFiltroEstado('borradores')}
                  className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl shadow transition ${filtroEstado === 'borradores' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <FaSave className="inline mr-1" /> Borradores
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEstado('activas')}
                  className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl shadow transition ${filtroEstado === 'activas' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <FaCheckCircle className="inline mr-1" /> Activas
                </button>
                {permisoCrud && (
                  <button
                    type="button"
                    onClick={abrirCreacion}
                    className="inline-flex items-center gap-2 bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow transition"
                  >
                    <FaPlus /> Nueva evaluación
                  </button>
                )}
              </div>
            </div>
            {/* ... tabla de evaluaciones ... */}
        <div className="overflow-x-auto">
          {evaluacionesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FaClipboardList className="text-4xl mx-auto mb-3 text-gray-300" />
              <p className="text-xs font-semibold text-gray-500">No hay evaluaciones para el filtro seleccionado.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#112F5C] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">EVALUACIÓN</th>
                  <th className="px-4 py-3">MOMENTO / SEMESTRE</th>
                  <th className="px-4 py-3">GRUPO / JORNADA</th>
                  <th className="px-4 py-3 text-center">RAPS</th>
                  <th className="px-4 py-3 text-center">FECHAS</th>
                  <th className="px-4 py-3 text-center">ESTADO</th>
                  <th className="px-4 py-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {evaluacionesFiltradas.map((ev, idx) => (
                  <tr key={ev.id_evaluacion || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#112F5C]">{ev.nombre}</td>
                    <td className="px-4 py-3.5 text-gray-600">Semestre {ev.semestre} — {ev.momento}</td>
                    <td className="px-4 py-3.5 text-gray-600">{ev.grupo} — {ev.jornada}</td>
                    <td className="px-4 py-3.5 text-center text-gray-600">{ev.cantidad_raps}</td>
                    <td className="px-4 py-3.5 text-center text-gray-600">
                      {ev.fecha_inicio && ev.fecha_fin ? (
                        <div className="text-[10px]">
                          <div>Inicio: {new Date(ev.fecha_inicio).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                          <div>Fin: {new Date(ev.fecha_fin).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${colorEstado(ev.estado)}`}>
                        {ev.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        {ev.estado !== 'ACTIVA' && (
                          <button
                            onClick={() => navigate(`/docente/evaluaciones/editor/${ev.id_evaluacion}`)}
                            className="bg-[#112F5C] hover:bg-blue-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            <FaEdit className="inline mr-1" /> Redactar Preguntas
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/docente/evaluaciones/calificar/${ev.id_evaluacion}`)}
                          className="bg-[#008A52] hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          <FaCheck className="inline mr-1" /> Calificar Abiertas
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </>
      )}

      {subApartadoRap === 'historial' && (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#112F5C]">
              <FaHistory className="inline mr-2" />Historial de Evaluaciones
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Resultados de las evaluaciones ya respondidas por sus grupos.
            </p>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
            <input
              type="text"
              value={busquedaHistorial}
              onChange={(e) => setBusquedaHistorial(e.target.value)}
              placeholder="Buscar por evaluación o grupo..."
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <select
            aria-label="Filtrar por semestre"
            value={filtrosHistorial.semestre}
            onChange={(e) => setFiltrosHistorial((actual) => ({ ...actual, semestre: e.target.value }))}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
          >
            <option value="">Todos los semestres</option>
            {semestresHistorial.map((semestre) => <option key={semestre} value={semestre}>{semestre}.º Semestre</option>)}
          </select>
          <select
            aria-label="Filtrar por grupo"
            value={filtrosHistorial.grupo}
            onChange={(e) => setFiltrosHistorial((actual) => ({ ...actual, grupo: e.target.value }))}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
          >
            <option value="">Todos los grupos</option>
            {gruposHistorial.map((fila) => <option key={fila.id_grupo} value={fila.id_grupo}>{fila.grupo} · {fila.jornada}</option>)}
          </select>
          <select
            aria-label="Filtrar por promedio"
            value={filtrosHistorial.promedio}
            onChange={(e) => setFiltrosHistorial((actual) => ({ ...actual, promedio: e.target.value }))}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
          >
            <option value="">Todos los promedios</option>
            <option value="sin-respuestas">Sin respuestas</option>
            <option value="menor-60">Menor a 60%</option>
            <option value="60-79">De 60% a 79.9%</option>
            <option value="80-mas">80% o más</option>
          </select>
          <select
            aria-label="Filtrar por evaluación"
            value={filtrosHistorial.evaluacion}
            onChange={(e) => setFiltrosHistorial((actual) => ({ ...actual, evaluacion: e.target.value }))}
            className="px-3 py-2 text-xs border border-gray-200 rounded-xl bg-white"
          >
            <option value="">Todas las evaluaciones</option>
            {historial.map((fila) => <option key={fila.id_evaluacion} value={fila.id_evaluacion}>{fila.evaluacion}</option>)}
          </select>
        </div>

        {cargandoHistorial ? (
          <div className="text-center py-10 text-gray-500">
            <FaSyncAlt className="text-2xl text-[#112F5C] animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Cargando historial de evaluaciones...</p>
          </div>
        ) : errorHistorial ? (
          <div className="text-center py-10">
            <FaExclamationCircle className="text-3xl text-[#B3282D] mx-auto mb-3" />
            <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-4 font-mono inline-block text-left">{errorHistorial}</p>
            <br />
            <button onClick={cargarHistorial} className="bg-[#112F5C] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow mt-3">
              <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
            </button>
          </div>
        ) : historialFiltrado.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FaClipboardList className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-xs font-semibold text-gray-500">
              {historial.length === 0
                ? 'Aún no hay evaluaciones con resultados.'
                : 'No se encontraron evaluaciones con ese criterio de búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#112F5C] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">EVALUACIÓN</th>
                  <th className="px-4 py-3">PERIODO</th>
                  <th className="px-4 py-3">SEMESTRE</th>
                  <th className="px-4 py-3 text-center">EVALUADOS</th>
                  <th className="px-4 py-3 text-center">PROMEDIO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {historialFiltrado.map((fila) => (
                  <tr
                    key={fila.id_evaluacion}
                    role="button"
                    tabIndex={0}
                    onClick={() => abrirDetalleHistorial(fila)}
                    onKeyDown={(evento) => {
                      if (evento.key === 'Enter' || evento.key === ' ') {
                        evento.preventDefault();
                        abrirDetalleHistorial(fila);
                      }
                    }}
                    className="hover:bg-blue-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#112F5C]"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-[#112F5C]">{fila.evaluacion}</p>
                      <p className="text-gray-500">{fila.grupo} · {fila.jornada}</p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{fila.periodo || '—'}</td>
                    <td className="px-4 py-3.5 text-gray-600">{fila.semestre}.º Semestre</td>
                    <td className="px-4 py-3.5 text-center text-gray-600">
                      {Number(fila.estudiantes_evaluados || 0)} / {Number(fila.estudiantes_grupo || 0)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${colorPromedio(fila).clase}`}>
                        {colorPromedio(fila).texto}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      )}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={guardarEvaluacion}
            onKeyDown={impedirEnvioPorEnter}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#112F5C]">
                  {evaluacionEditando ? 'Editar evaluación' : 'Nueva evaluación'}
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Los cambios se guardan en las evaluaciones de sus grupos asignados.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                aria-label="Cerrar"
              >
                <FaTimes />
              </button>
            </div>

            {errorFormulario && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
                {errorFormulario}
              </p>
            )}

            <div className="space-y-1">
              <label htmlFor="evaluacion-nombre" className="block text-[11px] font-semibold text-gray-700">
                Nombre de la evaluación *
              </label>
              <input
                id="evaluacion-nombre"
                type="text"
                required
                maxLength={150}
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                placeholder="Ej. Evaluación de pensamiento sistémico"
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="evaluacion-grupo" className="block text-[11px] font-semibold text-gray-700">
                Grupo *
              </label>
              <select
                id="evaluacion-grupo"
                required
                value={formulario.id_grupo}
                onChange={(e) => setFormulario({ ...formulario, id_grupo: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
              >
                <option value="">Seleccione uno de sus grupos</option>
                {grupos.map((grupo) => (
                  <option key={grupo.id_grupo} value={grupo.id_grupo}>
                    {grupo.nombre} {grupo.codigo_jornada ? `· ${grupo.codigo_jornada}` : ''} — {grupo.jornada || 'Sin jornada'}
                  </option>
                ))}
              </select>
              {grupos.length === 0 && (
                <p className="text-[11px] text-amber-700">
                  No se encontraron grupos asignados a su usuario.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="evaluacion-inicio" className="block text-[11px] font-semibold text-gray-700">
                  Fecha de inicio
                </label>
                <input
                  id="evaluacion-inicio"
                  type="date"
                  value={formulario.fecha_inicio}
                  onChange={(e) => setFormulario({ ...formulario, fecha_inicio: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="evaluacion-fin" className="block text-[11px] font-semibold text-gray-700">
                  Fecha de fin
                </label>
                <input
                  id="evaluacion-fin"
                  type="date"
                  value={formulario.fecha_fin}
                  onChange={(e) => setFormulario({ ...formulario, fecha_fin: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#112F5C] hover:bg-blue-900 px-4 py-2.5 rounded-xl shadow transition disabled:opacity-60"
              >
                <FaSave /> {guardando ? 'Guardando...' : evaluacionEditando ? 'Guardar cambios' : 'Crear evaluación'}
              </button>
            </div>
          </form>
        </div>
      )}
      </div>
      ) : <DocenteSaberPro />}
    </div>
  );
}
