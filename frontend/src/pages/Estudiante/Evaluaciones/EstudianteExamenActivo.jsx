import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaClock,
  FaCheckCircle,
  FaBook,
  FaUserCircle,
  FaSave
} from 'react-icons/fa';
import {
  obtenerExamen,
  obtenerHistorialDemo,
  obtenerHistorial,
  iniciarIntento,
  finalizarIntento
} from '../../../services/estudianteEvaluaciones.js';
import './EstudianteEvaluaciones.css';

export default function EstudianteExamenActivo() {
  const { idEvaluacion } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [evaluacion, setEvaluacion] = useState(null);
  const [estudiante, setEstudiante] = useState(null);
  const [raps, setRaps] = useState([]);
  const [historial, setHistorial] = useState([]);

  const [respuestas, setRespuestas] = useState({});
  const [idx, setIdx] = useState(0);
  const [segundosRestantes, setSegundosRestantes] = useState(null);
  const [finalizado, setFinalizado] = useState(false);
  const [motivoFinalizado, setMotivoFinalizado] = useState('');
  const [resultadoOficial, setResultadoOficial] = useState(null);

  const claveLocal = `rap_examen_${idEvaluacion}`;

  const cargarExamen = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await obtenerExamen(idEvaluacion);
      setEstudiante(data.estudiante || null);
      setEvaluacion(data.evaluacion || null);
      setRaps(data.raps || []);
      const histReal = await obtenerHistorial();
      setHistorial(histReal || data.historial || obtenerHistorialDemo());
      // Registra el intento en el backend solo si el endpoint está montado.
      iniciarIntento(idEvaluacion);
    } catch (err) {
      console.error('Error cargando el examen:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarExamen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idEvaluacion]);

  const preguntas = useMemo(
    () =>
      raps.flatMap((rap) =>
        (rap.preguntas || []).map((p) => ({
          ...p,
          componente: p.componente || rap.nombre,
          codigo: p.codigo || rap.codigo_rap
        }))
      ),
    [raps]
  );

  const totalPreguntas = preguntas.length;
  const respondidas = Object.keys(respuestas).length;
  const actual = preguntas[idx] || null;

  useEffect(() => {
    if (!evaluacion || !evaluacion.fecha_fin) {
      setSegundosRestantes(null);
      return undefined;
    }
    const calcular = () => {
      const restantes = Math.max(
        0,
        Math.floor((new Date(evaluacion.fecha_fin).getTime() - Date.now()) / 1000)
      );
      setSegundosRestantes(restantes);
      return restantes;
    };
    calcular();
    const intervalo = setInterval(() => {
      const restantes = calcular();
      if (restantes <= 0 && !finalizado) {
        clearInterval(intervalo);
        setMotivoFinalizado('tiempo');
        setFinalizado(true);
        guardarLocal('tiempo');
      }
    }, 1000);
    return () => clearInterval(intervalo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluacion, finalizado]);

  const formatearTiempo = (segundos) => {
    if (segundos === null) return 'Tiempo no definido';
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(m)}:${pad(s)} min`;
  };

  const manejarSeleccion = (idPregunta, idOpcion) => {
    setRespuestas((prev) => ({ ...prev, [idPregunta]: idOpcion }));
  };

  const manejarTexto = (idPregunta, texto) => {
    setRespuestas((prev) => {
      const siguiente = { ...prev };
      if (texto.trim() === '') {
        delete siguiente[idPregunta];
      } else {
        siguiente[idPregunta] = texto;
      }
      return siguiente;
    });
  };

  const guardarLocal = (motivo) => {
    try {
      localStorage.setItem(
        claveLocal,
        JSON.stringify({
          finalizado: true,
          motivo,
          guardadoEn: new Date().toISOString(),
          respuestas,
          resumen: { total: totalPreguntas, respondidas: Object.keys(respuestas).length }
        })
      );
    } catch (err) {
      console.error('No se pudo guardar la respuesta localmente:', err);
    }
  };

  // Convierte el estado local de respuestas al contrato que espera el backend.
  const payloadRespuestas = () =>
    preguntas.map((p) => {
      const valor = respuestas[p.id_pregunta];
      const abierta = p.tipo_pregunta !== 'CERRADA';
      return {
        id_pregunta: p.id_pregunta,
        id_opcion_pregunta: abierta ? null : valor ?? null,
        texto_abierto: abierta ? (typeof valor === 'string' ? valor : null) : null
      };
    });

  const confirmarFinalizar = async () => {
    const faltantes = totalPreguntas - respondidas;
    if (faltantes > 0 && !window.confirm(`Aún le faltan ${faltantes} pregunta(s) por responder. ¿Desea finalizar de todos modos?`)) {
      return;
    }
    // Autocalificación oficial cuando el backend monte /finalizar; si no, null.
    const oficial = await finalizarIntento(idEvaluacion, payloadRespuestas());
    if (oficial && oficial.puntaje != null) setResultadoOficial(oficial);
    setMotivoFinalizado('manual');
    setFinalizado(true);
    guardarLocal('manual');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando el examen...</p>
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
          <button onClick={cargarExamen} className="bg-[#112F5C] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow">
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  if (finalizado) {
    // Puntaje provisional en demo: proporción de respuestas contestadas sobre 100.
    // Con el backend real, la autocalificación devolverá el puntaje definitivo.
    const proporcion = totalPreguntas > 0 ? respondidas / totalPreguntas : 0;
    const puntaje =
      resultadoOficial && resultadoOficial.puntaje != null
        ? Number(resultadoOficial.puntaje)
        : Math.round(proporcion * 100);
    const aprobado =
      resultadoOficial && resultadoOficial.aprobada != null
        ? Boolean(resultadoOficial.aprobada)
        : puntaje >= 60;
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center border border-gray-100 space-y-4 animate-fade-in">
          <FaCheckCircle className={`text-5xl mx-auto ${motivoFinalizado === 'tiempo' ? 'text-amber-500' : 'text-emerald-500'}`} />
          <h2 className="text-lg font-bold text-[#112F5C]">
            {motivoFinalizado === 'tiempo' ? 'Tiempo agotado' : 'Examen finalizado'}
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            {motivoFinalizado === 'tiempo'
              ? `El tiempo de la evaluación "${evaluacion && evaluacion.nombre}" finalizó. Su avance fue guardado localmente.`
              : `Respondió ${respondidas} de ${totalPreguntas} pregunta(s).`}
          </p>

          {/* Puntaje obtenido por el estudiante */}
          <div className={`rounded-2xl border-2 p-5 ${aprobado ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Puntaje obtenido</p>
            <p className={`text-4xl font-extrabold mt-1 ${aprobado ? 'text-emerald-700' : 'text-red-700'}`}>
              {puntaje}<span className="text-lg text-gray-400 font-bold">/100</span>
            </p>
            <p className={`text-xs font-bold mt-1 ${aprobado ? 'text-emerald-800' : 'text-red-800'}`}>
              {aprobado ? 'Aprobada' : 'Por debajo del mínimo'}
            </p>
            <p className="text-[10px] text-gray-400 mt-2">
              {resultadoOficial
                ? 'Calificación oficial devuelta por el backend.'
                : 'Resultado provisional (demo). Al conectar el backend se mostrará la calificación oficial.'}
            </p>
          </div>

          <button
            onClick={() => navigate('/estudiante/evaluaciones')}
            className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow"
          >
            Volver a mis evaluaciones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-5 -m-4 md:-m-8">
      {/* Banner superior del examen */}
      <div className="bg-[#112F5C] text-white px-5 md:px-8 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <FaBook className="text-2xl text-blue-200" />
          <div>
            <h1 className="text-sm md:text-base font-bold">Sistema RAP — Examen Unificado Semestral (Saber Pro)</h1>
            <p className="text-[11px] text-blue-200">
              {evaluacion ? `${evaluacion.momento} · ${evaluacion.grupo} (${evaluacion.jornada})` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="rap-timer-vivo bg-[#B3282D] text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2">
            <FaClock /> Tiempo Restante: {formatearTiempo(segundosRestantes)}
          </span>
          <span className="hidden md:flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs font-bold">
            <FaUserCircle className="text-lg text-blue-200" /> {estudiante?.nombre || 'Estudiante'}
          </span>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pregunta actual */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          {actual ? (
            <>
              <p className="text-xs font-bold text-blue-600">
                Pregunta {idx + 1} de {totalPreguntas} — Componente: {actual.componente}
              </p>
              <h2 className="text-lg md:text-xl font-bold text-[#112F5C] leading-snug">{actual.titulo || actual.enunciado}</h2>

              {actual.contexto && (
                <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-gray-600 leading-relaxed">{actual.contexto}</p>
                  <p className="text-xs font-bold text-[#112F5C]">{actual.enunciado}</p>
                </div>
              )}

              {actual.tipo_pregunta === 'CERRADA' && actual.opciones ? (
                <div className="space-y-2.5">
                  {actual.opciones.map((opcion, oi) => {
                    const seleccionada = respuestas[actual.id_pregunta] === opcion.id_opcion_pregunta;
                    return (
                      <label
                        key={opcion.id_opcion_pregunta}
                        className={`rap-opcion flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer ${
                          seleccionada
                            ? 'bg-blue-50 border-blue-500 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-[#112F5C]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`pregunta_${actual.id_pregunta}`}
                          checked={seleccionada}
                          onChange={() => manejarSeleccion(actual.id_pregunta, opcion.id_opcion_pregunta)}
                          className="mt-0.5 accent-[#112F5C]"
                        />
                        <span className="text-xs text-gray-800 font-semibold leading-relaxed">
                          ({String.fromCharCode(65 + oi)}) {opcion.texto}
                          {seleccionada && (
                            <span className="block text-[10px] text-blue-600 font-bold mt-1">
                              Respuesta seleccionada por el estudiante
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">
                    Respuesta abierta
                  </label>
                  <textarea
                    value={respuestas[actual.id_pregunta] || ''}
                    onChange={(e) => manejarTexto(actual.id_pregunta, e.target.value)}
                    rows={5}
                    placeholder="Escriba aquí su respuesta..."
                    className="w-full text-xs text-gray-700 bg-white border border-gray-200 rounded-xl p-3 resize-y transition focus:outline-none focus:border-[#112F5C] focus:ring-2 focus:ring-[#112F5C]/20"
                  />
                  <p className="text-[10px] text-gray-400 italic">
                    Su respuesta será calificada manualmente por el docente.
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-3">
                <button
                  onClick={() => setIdx((i) => Math.max(0, i - 1))}
                  disabled={idx === 0}
                  className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed text-[#112F5C] font-bold text-xs px-6 py-2.5 rounded-xl transition"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setIdx((i) => Math.min(totalPreguntas - 1, i + 1))}
                  disabled={idx === totalPreguntas - 1}
                  className="bg-[#112F5C] hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow"
                >
                  Siguiente
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <FaBook className="text-4xl mx-auto mb-3 text-gray-300" />
              <p className="text-xs font-semibold text-gray-500">Esta evaluación aún no tiene preguntas publicadas.</p>
            </div>
          )}
        </div>

        {/* Columna lateral */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-[#112F5C]">Mapa de Reactivos del Examen</h3>
            <div className="flex flex-wrap gap-2">
              {preguntas.map((p, i) => {
                const contestada = respuestas[p.id_pregunta] !== undefined;
                const esActual = i === idx;
                return (
                  <button
                    key={p.id_pregunta}
                    onClick={() => setIdx(i)}
                    className={`rap-reactivo w-9 h-9 rounded-lg text-xs font-bold border-2 ${
                      esActual
                        ? 'bg-blue-500 border-blue-600 text-white'
                        : contestada
                        ? 'bg-emerald-600 border-emerald-700 text-white'
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-500">
              Verde respondida · Azul actual · Gris pendiente. Respondidas {respondidas} de {totalPreguntas}.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-[#112F5C]">Estado y Desempeño RAP</h3>
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-emerald-700 uppercase">Estado de la Prueba Actual:</p>
              <p className="text-xs font-bold text-emerald-800 mt-1">Evaluación Diagnóstica en Curso</p>
              <p className="text-[10px] text-emerald-700 mt-1">{totalPreguntas} Preguntas | Autocalificable al enviar</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold text-[#112F5C]">Historial de Pruebas Recientes</h3>
            <div className="space-y-2">
              {historial.map((h) => (
                <div key={h.nombre} className="border border-gray-200 rounded-xl p-3" style={{ borderLeft: `4px solid ${h.tono}` }}>
                  <p className="text-[11px] font-bold text-[#112F5C]">{h.nombre}</p>
                  <p className="text-[10px] text-gray-500">{h.detalle}</p>
                  <p className="text-[10px] text-gray-400">Fecha: {h.fecha}</p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
              Nota: Al finalizar la prueba actual, se registrará su resultado en su historial.
            </p>
          </div>

          <button
            onClick={confirmarFinalizar}
            disabled={totalPreguntas === 0}
            className="w-full bg-[#B3282D] hover:bg-red-800 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-6 py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
          >
            <FaSave /> Finalizar y Guardar Prueba
          </button>
        </div>
      </div>
    </div>
  );
}
