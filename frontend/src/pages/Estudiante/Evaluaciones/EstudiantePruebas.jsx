import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSyncAlt, FaExclamationCircle, FaClock, FaBook, FaClipboardList } from 'react-icons/fa';

export default function EstudiantePruebas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [estudiante, setEstudiante] = useState(null);
  const [evaluaciones, setEvaluaciones] = useState([]);

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:3000/api/estudiante/evaluaciones', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al verificar exámenes habilitados');
      setEstudiante(data.estudiante || null);
      setEvaluaciones(data.evaluaciones || []);
    } catch (err) {
      console.error('Error cargando pruebas del estudiante:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEvaluaciones();
  }, []);

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Por definir';
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return 'Por definir';
    return d.toLocaleDateString('es-CO');
  };

  const handleIniciarPrueba = (idEvaluacion) => {
    navigate(`/estudiante/evaluaciones/examen/${idEvaluacion}`);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Verificando evaluaciones asignadas...</p>
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
        <h1 className="text-2xl font-bold text-[#112F5C]">Pruebas RAP</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {estudiante
            ? `Semestre ${estudiante.semestre} — Grupo ${estudiante.grupo}: ${evaluaciones.length} evaluación(es) habilitada(s) para su grupo.`
            : 'Verificando las evaluaciones habilitadas para su grupo.'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <FaClipboardList className="text-2xl text-[#B3282D]" />
          <div>
            <h2 className="text-sm font-bold text-[#112F5C]">Evaluaciones Habilitadas</h2>
            <p className="text-[11px] text-gray-500">Las evaluaciones activas asignadas a su grupo y semestre.</p>
          </div>
        </div>

        {evaluaciones.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FaBook className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-xs font-semibold text-gray-500">No tiene evaluaciones habilitadas en este momento.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {evaluaciones.map((ev, idx) => (
              <div key={ev.id_evaluacion || idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-[#112F5C]">{ev.nombre}</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {ev.momento} — Semestre {ev.semestre} · Grupo {ev.grupo} ({ev.jornada})
                    </p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-4 py-1.5 rounded-xl self-start">
                    {ev.estado}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-3 py-1 rounded-xl">
                    Puntaje total: {ev.puntaje_total}
                  </span>
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-xl">
                    Respuestas A-B-C-D
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-3 py-1 rounded-xl flex items-center gap-1.5">
                    <FaClock className="text-[10px]" /> Apertura: {formatearFecha(ev.fecha_inicio)} · Cierre: {formatearFecha(ev.fecha_fin)}
                  </span>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleIniciarPrueba(ev.id_evaluacion)}
                    className="bg-[#B3282D] hover:bg-red-800 text-white font-bold text-xs px-8 py-2.5 rounded-xl transition shadow-md"
                  >
                    Iniciar Prueba &gt;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium leading-relaxed">
          <strong>Importante:</strong> Al hacer clic en "Iniciar Prueba", el temporizador comenzará inmediatamente. Asegúrese de contar con una conexión estable a Internet. El examen se autocalificará al finalizar.
        </p>
      </div>
    </div>
  );
}