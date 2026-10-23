import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaChartBar,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
  FaChartLine
} from 'react-icons/fa';
import { obtenerResultados } from '../../../services/estudianteEvaluaciones.js';

const nivelDe = (puntaje) => {
  if (puntaje == null) return { texto: 'Sin calificar', color: '#9CA3AF' };
  if (puntaje >= 90) return { texto: 'Excelente', color: '#16A34A' };
  if (puntaje >= 75) return { texto: 'Bueno', color: '#2563EB' };
  if (puntaje >= 60) return { texto: 'Regular', color: '#D97706' };
  return { texto: 'Insuficiente', color: '#DC2626' };
};

export default function MisResultados() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [datos, setDatos] = useState({ fuente: 'demo', historial: [] });

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await obtenerResultados();
      setDatos(data);
    } catch (err) {
      console.error('Error cargando mis resultados:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const historial = datos.historial || [];

  const resumen = useMemo(() => {
    const conNota = historial.filter((h) => h.puntaje != null);
    const promedio = conNota.length
      ? Math.round(conNota.reduce((acc, h) => acc + h.puntaje, 0) / conNota.length)
      : null;
    const aprobadas = conNota.filter((h) => h.puntaje >= 60).length;
    return {
      promedio,
      total: historial.length,
      evaluadas: conNota.length,
      aprobadas,
      reprobadas: conNota.length - aprobadas
    };
  }, [historial]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando sus resultados...</p>
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
            onClick={cargar}
            className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow"
          >
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#112F5C]">Mis Resultados RAP</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Historial personal de niveles de desempeño, porcentaje y progreso de sus evaluaciones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
              datos.fuente === 'api'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-amber-100 text-amber-800 border-amber-300'
            }`}
          >
            {datos.fuente === 'api' ? 'Datos del backend' : 'Datos de demostración'}
          </span>
          <Link
            to="/estudiante/reportes"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-[#112F5C] border border-gray-200 bg-white hover:border-[#112F5C] px-3 py-1.5 rounded-xl"
          >
            <FaFileAlt /> Ver reportes
          </Link>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <TarjetaResumen
          icono={<FaChartLine />}
          etiqueta="Promedio general"
          valor={resumen.promedio != null ? `${resumen.promedio}/100` : '—'}
          color="#112F5C"
        />
        <TarjetaResumen icono={<FaChartBar />} etiqueta="Evaluaciones" valor={resumen.total} color="#2563EB" />
        <TarjetaResumen
          icono={<FaCheckCircle />}
          etiqueta="Aprobadas"
          valor={resumen.aprobadas}
          color="#16A34A"
        />
        <TarjetaResumen
          icono={<FaTimesCircle />}
          etiqueta="Por debajo del mínimo"
          valor={resumen.reprobadas}
          color="#DC2626"
        />
      </div>

      {historial.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <FaChartBar className="text-4xl mx-auto text-gray-300 mb-3" />
          <p className="text-xs font-semibold text-gray-500">Todavía no tiene resultados registrados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfica de barras: puntaje por evaluación */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold text-[#112F5C]">Desempeño por evaluación</h2>
            <div className="space-y-3">
              {historial.map((h) => {
                const nivel = nivelDe(h.puntaje);
                const ancho = h.puntaje != null ? Math.min(100, (h.puntaje / (h.sobre || 100)) * 100) : 0;
                return (
                  <div key={h.id}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[11px] font-semibold text-gray-700 truncate">{h.nombre}</p>
                      <p className="text-[11px] font-bold" style={{ color: nivel.color }}>
                        {h.puntaje != null ? `${h.puntaje}/${h.sobre || 100}` : '—'}
                      </p>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${ancho}%`, backgroundColor: nivel.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400">
              Verde ≥ 90 · Azul ≥ 75 · Ámbar ≥ 60 · Rojo &lt; 60. La línea de mínimo es 60/100.
            </p>
          </div>

          {/* Tabla de historial */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-bold text-[#112F5C] mb-4">Historial de evaluaciones</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-[10px] font-bold text-gray-500 uppercase pb-2 pr-3">Evaluación</th>
                    <th className="text-[10px] font-bold text-gray-500 uppercase pb-2 pr-3">Fecha</th>
                    <th className="text-[10px] font-bold text-gray-500 uppercase pb-2 pr-3">Puntaje</th>
                    <th className="text-[10px] font-bold text-gray-500 uppercase pb-2">Nivel</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h) => {
                    const nivel = nivelDe(h.puntaje);
                    return (
                      <tr key={h.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-2.5 pr-3">
                          <p className="text-[11px] font-semibold text-[#112F5C]">{h.nombre}</p>
                          <p className="text-[10px] text-gray-500">{h.detalle}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-[11px] text-gray-600">{h.fecha || '—'}</td>
                        <td className="py-2.5 pr-3 text-[11px] font-bold text-gray-800">
                          {h.puntaje != null ? `${h.puntaje}/${h.sobre || 100}` : '—'}
                        </td>
                        <td className="py-2.5">
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white"
                            style={{ backgroundColor: nivel.color }}
                          >
                            {nivel.texto}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TarjetaResumen({ icono, etiqueta, valor, color }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base shrink-0"
        style={{ backgroundColor: color }}
      >
        {icono}
      </span>
      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase">{etiqueta}</p>
        <p className="text-lg font-extrabold text-[#112F5C] leading-tight">{valor}</p>
      </div>
    </div>
  );
}
