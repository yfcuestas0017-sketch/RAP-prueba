import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSyncAlt, FaExclamationCircle, FaClipboardList, FaEdit, FaInfoCircle } from 'react-icons/fa';

export default function DocenteCrearPruebas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [evaluaciones, setEvaluaciones] = useState([]);

  const cargarEvaluaciones = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:3000/api/docente/evaluaciones', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al conectar con la base de datos');
      setEvaluaciones(data.data || []);
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

  const colorEstado = (estado) => {
    switch (estado) {
      case 'ACTIVA': return 'bg-emerald-100 text-emerald-800';
      case 'CERRADA': return 'bg-gray-100 text-gray-600';
      case 'ELIMINADA': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando evaluaciones asignadas...</p>
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
        <h1 className="text-2xl font-bold text-[#112F5C]">Evaluaciones Asignadas — Redacción de Preguntas</h1>
        <p className="text-xs text-gray-500 mt-0.5">Solo se muestran las evaluaciones creadas por el administrador y asignadas a sus grupos.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
        <FaInfoCircle className="text-blue-600 text-base mt-0.5 shrink-0" />
        <p className="text-xs text-blue-900 leading-relaxed">
          Las evaluaciones (Paso 1) las crea y parametriza el <strong>Administrador</strong>. Usted como docente redacta los
          reactivos de cada RAP vinculado a la evaluación (Paso 2). Seleccione una evaluación para comenzar.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-[#112F5C]">Evaluaciones a su cargo (2026-2)</h2>
        <div className="overflow-x-auto">
          {evaluaciones.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FaClipboardList className="text-4xl mx-auto mb-3 text-gray-300" />
              <p className="text-xs font-semibold text-gray-500">No tiene evaluaciones asignadas actualmente.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#112F5C] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">EVALUACIÓN</th>
                  <th className="px-4 py-3">MOMENTO / SEMESTRE</th>
                  <th className="px-4 py-3">GRUPO / JORNADA</th>
                  <th className="px-4 py-3 text-center">RAPS</th>
                  <th className="px-4 py-3 text-center">ESTADO</th>
                  <th className="px-4 py-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {evaluaciones.map((ev, idx) => (
                  <tr key={ev.id_evaluacion || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#112F5C]">{ev.nombre}</td>
                    <td className="px-4 py-3.5 text-gray-600">Semestre {ev.semestre} — {ev.momento}</td>
                    <td className="px-4 py-3.5 text-gray-600">{ev.grupo} — {ev.jornada}</td>
                    <td className="px-4 py-3.5 text-center text-gray-600">{ev.cantidad_raps}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${colorEstado(ev.estado)}`}>
                        {ev.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => navigate(`/docente/evaluaciones/editor/${ev.id_evaluacion}`)}
                        className="bg-[#112F5C] hover:bg-blue-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        <FaEdit className="inline mr-1" /> Redactar Preguntas
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
  );
}