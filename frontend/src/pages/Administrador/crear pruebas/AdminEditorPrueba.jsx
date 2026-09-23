import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaSyncAlt, 
  FaExclamationCircle, 
  FaCheckCircle, 
  FaPlus,
  FaCheck,
  FaUserCheck,
  FaLock,
  FaLockOpen
} from 'react-icons/fa';
import { API_BASE_URL } from '../../../config';

export default function AdminEditorPrueba() {
  const { idPrueba } = useParams();
  const navigate = useNavigate();

  const API = `${API_BASE_URL}/api/admin/evaluaciones`;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [evaluacion, setEvaluacion] = useState(null);
  const [raps, setRaps] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [idRapSeleccionado, setIdRapSeleccionado] = useState('');

  const [docentes, setDocentes] = useState([]);
  const [nuevoDocente, setNuevoDocente] = useState('');

  const cargarDetalle = async () => {
    try {
      setLoading(true);
      setError('');

      const [respuesta, resDocentes] = await Promise.all([
        fetch(`${API}/${idPrueba}`, { credentials: 'include' }),
        fetch(`${API}/docentes`, { credentials: 'include' })
      ]);

      const resultado = await respuesta.json();
      const doc = await resDocentes.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || 'Error al obtener la prueba de la base de datos');
      }
      if (resDocentes.ok) {
        setDocentes(doc.data || []);
      }

      const ev = resultado.data;
      setEvaluacion(ev.evaluacion);
      setRaps(ev.raps || []);
      setNuevoDocente(String(ev.evaluacion.id_docente || ''));

      // RAPs disponibles del semestre de la evaluación (los no vinculados aún)
      const resDisponibles = await fetch(`${API}/raps/${ev.evaluacion.id_semestre}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const disp = await resDisponibles.json();
      if (resDisponibles.ok) {
        const agregados = new Set((ev.raps || []).map((r) => r.id_rap));
        setDisponibles((disp.data || []).filter((r) => !agregados.has(r.id_rap)));
      }
    } catch (err) {
      console.error('Error cargando editor de prueba:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDetalle();
  }, [idPrueba]);

  const mostrarExito = (mensaje) => {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(''), 3000);
  };

  const handleAgregarRap = async () => {
    if (!idRapSeleccionado) {
      alert('Seleccione un RAP para agregar a la evaluación.');
      return;
    }
    try {
      setMensajeExito('');
      const respuesta = await fetch(`${API}/${idPrueba}/raps`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_rap: Number(idRapSeleccionado) })
      });

      const res = await respuesta.json();
      if (!respuesta.ok) throw new Error(res.mensaje || 'Error al agregar el RAP');

      mostrarExito(res.mensaje || 'RAP agregado correctamente.');
      setIdRapSeleccionado('');
      cargarDetalle();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCambiarDocente = async () => {
    if (!nuevoDocente || String(nuevoDocente) === String(evaluacion.id_docente)) {
      alert('Seleccione un docente distinto al actual para reasignar.');
      return;
    }
    try {
      setGuardando(true);
      setMensajeExito('');
      const respuesta = await fetch(`${API}/${idPrueba}/docente`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_docente: Number(nuevoDocente) })
      });

      const res = await respuesta.json();
      if (!respuesta.ok) throw new Error(res.mensaje || 'Error al reasignar el docente');

      mostrarExito(res.mensaje || 'Docente reasignado correctamente.');
      cargarDetalle();
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (estado) => {
    if (estado === 'ACTIVA' && raps.length === 0) {
      alert('Debe agregar al menos un RAP antes de publicar la evaluación.');
      return;
    }
    try {
      setGuardando(true);
      setMensajeExito('');
      const respuesta = await fetch(`${API}/${idPrueba}/estado`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      });

      const res = await respuesta.json();
      if (!respuesta.ok) throw new Error(res.mensaje || 'Error al cambiar el estado');

      const texto = {
        ACTIVA: '¡Evaluación publicada con éxito!',
        CERRADA: 'Evaluación cerrada correctamente.',
        BORRADOR: 'Evaluación reabierta en modo borrador.'
      };
      alert(texto[estado] || res.mensaje);
      if (estado === 'ACTIVA') {
        navigate('/admin/evaluaciones/crear');
      } else {
        cargarDetalle();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const colorEstado = (estado) => {
    switch (estado) {
      case 'ACTIVA': return 'bg-emerald-100 text-emerald-800';
      case 'CERRADA': return 'bg-gray-100 text-gray-600';
      case 'ELIMINADA': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Sin definir';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return 'Sin definir';
    return d.toLocaleDateString('es-CO');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando editor de prueba RAP...</p>
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
            onClick={cargarDetalle}
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
      
      {/* Botón Volver y Encabezado */}
      <div>
        <button
          onClick={() => navigate('/admin/evaluaciones/crear')}
          className="flex items-center gap-2 text-[#112F5C] font-bold text-sm hover:underline mb-2"
        >
          <FaArrowLeft /> Volver a Gestión de pruebas | Paso 2: Editor de Pruebas RAP
        </button>
        <p className="text-xs text-gray-500">
          Vincule los RAPs, asigne al docente encargado y controle el estado de la evaluación. Las preguntas de cada RAP las redacta el docente asignado desde su módulo.
        </p>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <FaCheckCircle className="text-emerald-600 text-base shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Banner de Parámetros */}
      {evaluacion && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">PARÁMETROS FIJADOS EN PASO 1:</span>
            <h2 className="text-sm font-bold text-[#112F5C] mt-0.5">{evaluacion.nombre}</h2>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">
              Semestre {evaluacion.semestre} — {evaluacion.momento}
            </p>
            <p className="text-xs text-gray-500">Grupo {evaluacion.grupo} — {evaluacion.jornada}</p>
            <p className="text-[11px] text-gray-500 mt-1">
              Inicio: {formatearFecha(evaluacion.fecha_inicio)} · Fin: {formatearFecha(evaluacion.fecha_fin)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${colorEstado(evaluacion.estado)}`}>
              {evaluacion.estado}
            </span>
            <p className="text-[11px] text-gray-500">
              Docente: {evaluacion.docente_nombre} {evaluacion.docente_apellido} — Puntaje total: {evaluacion.puntaje_total}
            </p>
          </div>
        </div>
      )}

      {/* BLOQUE PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* RAPs Vinculados a la Evaluación */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#112F5C] border-b pb-3">RAPs Vinculados a la Evaluación</h3>

          {raps.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-xs font-semibold text-gray-500">Aún no hay RAPs vinculados a esta evaluación.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {raps.map((r) => (
                <div key={r.id_evaluacion_rap} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-xs text-[#112F5C]">
                      <FaCheck className="inline mr-1 text-emerald-600" />
                      {r.codigo_rap} — {r.nombre}
                    </h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-lg">
                      VINCULADO
                    </span>
                  </div>
                  {r.descripcion && <p className="text-[10px] text-gray-500 mt-1">{r.descripcion}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de control */}
        <div className="space-y-4">
          {/* Agregar RAP */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#112F5C] border-b pb-3">Agregar RAP a la Evaluación</h3>

            {disponibles.length === 0 ? (
              <div className="text-center py-6 text-gray-400">
                <p className="text-xs font-semibold text-gray-500">No hay RAPs disponibles del semestre.</p>
              </div>
            ) : (
              <>
                <select
                  value={idRapSeleccionado}
                  onChange={(e) => setIdRapSeleccionado(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
                >
                  <option value="">Seleccione un RAP...</option>
                  {disponibles.map((r) => (
                    <option key={r.id_rap} value={r.id_rap}>
                      {r.codigo_rap} — {r.nombre}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAgregarRap}
                  className="w-full py-2 bg-gray-50 border border-dashed border-gray-300 hover:bg-gray-100 text-[#112F5C] text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
                >
                  <FaPlus /> Vincular RAP
                </button>
              </>
            )}
          </div>

          {/* Reasignar docente */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#112F5C] border-b pb-3">
              <FaUserCheck className="inline mr-1.5 text-[#112F5C]" /> Docente Encargado
            </h3>
            <p className="text-[11px] text-gray-500">
              Actual: <span className="font-bold text-[#112F5C]">{evaluacion && (evaluacion.docente_nombre + ' ' + evaluacion.docente_apellido)}</span>
            </p>
            <select
              value={nuevoDocente}
              onChange={(e) => setNuevoDocente(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
            >
              <option value="">Seleccione docente...</option>
              {docentes.map((d) => (
                <option key={d.id_user} value={d.id_user}>
                  {d.apellido} {d.nombre}
                </option>
              ))}
            </select>
            <button
              onClick={handleCambiarDocente}
              disabled={guardando || !nuevoDocente || String(nuevoDocente) === String(evaluacion && evaluacion.id_docente)}
              className="w-full py-2 bg-[#112F5C] hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
              <FaUserCheck /> Reasignar Docente
            </button>
          </div>

          {/* Control de estado */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#112F5C] border-b pb-3">Control de Estado</h3>

            <div className="bg-blue-50 border border-blue-100 text-blue-800 text-[11px] px-4 py-2.5 rounded-xl">
              Las preguntas de cada RAP se redactan desde el módulo del docente asignado a la evaluación.
            </div>

            <div className="space-y-2">
              {evaluacion && evaluacion.estado !== 'ACTIVA' && evaluacion.estado !== 'ELIMINADA' && (
                <button
                  onClick={() => handleCambiarEstado('ACTIVA')}
                  disabled={guardando}
                  className="w-full py-2.5 bg-[#008A52] hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
                >
                  <FaCheck /> Finalizar y Publicar Evaluación
                </button>
              )}

              {evaluacion && evaluacion.estado === 'ACTIVA' && (
                <button
                  onClick={() => handleCambiarEstado('CERRADA')}
                  disabled={guardando}
                  className="w-full py-2.5 bg-gray-700 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
                >
                  <FaLock /> Cerrar Evaluación
                </button>
              )}

              {evaluacion && evaluacion.estado === 'CERRADA' && (
                <button
                  onClick={() => handleCambiarEstado('BORRADOR')}
                  disabled={guardando}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
                >
                  <FaLockOpen /> Reabrir en Borrador
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}