import React, { useEffect, useState } from 'react';
import {
  FaChartBar,
  FaExclamationCircle,
  FaHistory,
  FaLock,
  FaSearch,
  FaSyncAlt,
  FaTimes
} from 'react-icons/fa';
import {
  esModuloPendiente,
  listarHistorialSaberPro,
  obtenerResultadosSaberPro
} from '../../../../services/saberProService';

const nombrePrueba = (fila) => fila?.prueba || fila?.nombre || fila?.evaluacion || 'Prueba Saber Pro';
const esAplicada = (fila) =>
  Boolean(fila?.aplicada ?? fila?.realizada ?? fila?.aplicada_por_docente);

const colorPromedio = (fila) => {
  const evaluados = Number(fila?.estudiantes_evaluados ?? 0);
  if (!evaluados) return { clase: 'bg-gray-100 text-gray-500', texto: 'Sin resultados' };
  const porcentaje = Number(fila?.porcentaje_promedio ?? fila?.promedio ?? 0);
  if (porcentaje >= 80) return { clase: 'bg-emerald-100 text-emerald-800', texto: `${porcentaje.toFixed(1)}%` };
  if (porcentaje >= 60) return { clase: 'bg-amber-100 text-amber-800', texto: `${porcentaje.toFixed(1)}%` };
  return { clase: 'bg-red-100 text-red-800', texto: `${porcentaje.toFixed(1)}%` };
};

export default function SaberProHistorial() {
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pendienteBackend, setPendienteBackend] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [detalle, setDetalle] = useState(null);
  const [resultados, setResultados] = useState([]);
  const [cargandoResultados, setCargandoResultados] = useState(false);
  const [errorResultados, setErrorResultados] = useState('');

  const cargarHistorial = async () => {
    try {
      setCargando(true);
      setError('');
      setPendienteBackend(false);
      const lista = await listarHistorialSaberPro();
      setHistorial(lista);
    } catch (err) {
      if (esModuloPendiente(err)) {
        setHistorial([]);
        setPendienteBackend(true);
      } else {
        setError(err.message || 'No fue posible cargar el historial de Saber Pro.');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const abrirResultados = async (fila) => {
    setDetalle(fila);
    setResultados([]);
    setErrorResultados('');
    try {
      setCargandoResultados(true);
      const respuesta = await obtenerResultadosSaberPro(fila.id_prueba);
      const lista = respuesta?.data ?? respuesta?.resultados ?? respuesta ?? [];
      setResultados(Array.isArray(lista) ? lista : []);
    } catch (err) {
      setErrorResultados(err.message || 'No fue posible cargar los resultados.');
    } finally {
      setCargandoResultados(false);
    }
  };

  const cerrarDetalle = () => {
    setDetalle(null);
    setResultados([]);
    setErrorResultados('');
  };

  const filtrado = historial.filter((fila) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return `${nombrePrueba(fila)} ${fila.grupo || ''} ${fila.periodo || ''}`
      .toLowerCase()
      .includes(texto);
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#112F5C]">
              <FaHistory className="inline mr-2" />
              Historial de evaluaciones Saber Pro
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 max-w-2xl">
              Resultados de sus estudiantes en las pruebas Saber Pro y simulacros. Solo podrá ver los resultados de las
              pruebas que usted haya aplicado a sus grupos.
            </p>
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por prueba, grupo o periodo..."
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
            />
          </div>
        </div>

        {pendienteBackend && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <FaExclamationCircle className="text-amber-600 text-base mt-0.5 shrink-0" />
            <p className="text-xs text-amber-900 leading-relaxed">
              El servicio de historial aún no está disponible en el servidor. La vista está lista para{' '}
              <code className="font-mono">GET /api/docente/saber-pro/historial</code>.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
            <FaExclamationCircle className="text-[#B3282D] text-base mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs text-red-700 leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={cargarHistorial}
                className="text-[11px] font-semibold text-[#112F5C] bg-white border border-[#112F5C] px-3 py-1.5 rounded-lg hover:bg-[#112F5C] hover:text-white transition"
              >
                <FaSyncAlt className="inline mr-1" /> Reintentar
              </button>
            </div>
          </div>
        )}

        {cargando ? (
          <div className="text-center py-10 text-gray-500">
            <FaSyncAlt className="text-2xl text-[#112F5C] animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Cargando historial de Saber Pro...</p>
          </div>
        ) : filtrado.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FaHistory className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-xs font-semibold text-gray-500">
              {historial.length === 0
                ? 'Aún no hay evaluaciones Saber Pro con resultados.'
                : 'No se encontraron evaluaciones con ese criterio de búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#112F5C] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">PRUEBA</th>
                  <th className="px-4 py-3">PERIODO</th>
                  <th className="px-4 py-3 text-center">APLICADA</th>
                  <th className="px-4 py-3 text-center">EVALUADOS</th>
                  <th className="px-4 py-3 text-center">PROMEDIO</th>
                  <th className="px-4 py-3 text-center">RESULTADOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtrado.map((fila, indice) => {
                  const aplicada = esAplicada(fila);
                  const promedio = colorPromedio(fila);
                  return (
                    <tr key={fila.id_prueba ?? indice} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-[#112F5C]">{nombrePrueba(fila)}</p>
                        <p className="text-gray-500">
                          {fila.grupo || '—'}
                          {fila.jornada ? ` · ${fila.jornada}` : ''}
                          {fila.modalidad ? ` · ${fila.modalidad === 'SABER_PRO' ? 'Saber Pro' : 'Simulacro'}` : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{fila.periodo || '—'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                            aplicada ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {aplicada ? 'Sí' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center text-gray-600">
                        {aplicada
                          ? `${Number(fila.estudiantes_evaluados || 0)} / ${Number(fila.estudiantes_grupo || 0)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {aplicada ? (
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${promedio.clase}`}>
                            {promedio.texto}
                          </span>
                        ) : (
                          <span className="text-gray-400">Bloqueado</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {aplicada ? (
                          <button
                            type="button"
                            onClick={() => abrirResultados(fila)}
                            className="bg-[#112F5C] hover:bg-blue-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                          >
                            <FaChartBar className="inline mr-1" /> Ver resultados
                          </button>
                        ) : (
                          <span
                            title="Solo puede ver los resultados de las pruebas que usted ya aplicó."
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg cursor-not-allowed"
                          >
                            <FaLock /> Sin acceso
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detalle && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#112F5C]">{nombrePrueba(detalle)}</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Resultados por estudiante · {detalle.grupo || '—'}
                  {detalle.periodo ? ` · ${detalle.periodo}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarDetalle}
                className="text-gray-400 hover:text-gray-600 transition"
                aria-label="Cerrar"
              >
                <FaTimes />
              </button>
            </div>

            {cargandoResultados ? (
              <div className="text-center py-10 text-gray-500">
                <FaSyncAlt className="text-2xl text-[#112F5C] animate-spin mx-auto mb-3" />
                <p className="text-xs font-medium">Cargando resultados...</p>
              </div>
            ) : errorResultados ? (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
                {errorResultados}
              </p>
            ) : resultados.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">
                No hay resultados registrados para esta prueba.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#112F5C] text-white font-semibold">
                    <tr>
                      <th className="px-4 py-3">ESTUDIANTE</th>
                      <th className="px-4 py-3 text-center">CORRECTAS</th>
                      <th className="px-4 py-3 text-center">PUNTAJE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {resultados.map((fila, indice) => (
                      <tr key={fila.id_estudiante ?? indice} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-800">
                          <p className="font-semibold text-[#112F5C]">
                            {fila.estudiante || fila.nombre || 'Estudiante'}
                          </p>
                          {fila.documento ? <p className="text-gray-500">{fila.documento}</p> : null}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {fila.respuestas_correctas ?? '—'} / {fila.total_preguntas ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-[#112F5C]">
                          {fila.puntaje ?? fila.porcentaje ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
