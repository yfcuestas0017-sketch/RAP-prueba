import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaArrowLeft,
  FaClock,
  FaCheckCircle,
  FaBook,
  FaClipboardCheck
} from 'react-icons/fa';

const API = 'http://localhost:3000/api/estudiante/evaluaciones';

export default function EstudianteExamenActivo() {
  const { idEvaluacion } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [evaluacion, setEvaluacion] = useState(null);
  const [estudiante, setEstudiante] = useState(null);
  const [raps, setRaps] = useState([]);

  const [respuestas, setRespuestas] = useState({});
  const [segundosRestantes, setSegundosRestantes] = useState(null);
  const [finalizado, setFinalizado] = useState(false);
  const [motivoFinalizado, setMotivoFinalizado] = useState('');

  const claveLocal = `rap_examen_${idEvaluacion}`;

  const cargarExamen = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/${idEvaluacion}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || 'Error al obtener el examen');

      setEstudiante(data.estudiante || null);
      setEvaluacion(data.evaluacion || null);
      setRaps(data.raps || []);
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

  const totalPreguntas = raps.reduce(
    (acc, rap) => acc + (rap.preguntas ? rap.preguntas.length : 0),
    0
  );
  const respondidas = Object.keys(respuestas).length;

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
  }, [evaluacion, finalizado]);

  const formatearTiempo = (segundos) => {
    if (segundos === null) return 'Tiempo no definido';
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
    const s = segundos % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  const manejarSeleccion = (idPregunta, idOpcion) => {
    setRespuestas((prev) => ({ ...prev, [idPregunta]: idOpcion }));
  };

  const guardarLocal = (motivo) => {
    try {
      const guardado = {
        finalizado: true,
        motivo,
        guardadoEn: new Date().toISOString(),
        respuestas,
        resumen: {
          total: totalPreguntas,
          respondidas: Object.keys(respuestas).length
        }
      };
      localStorage.setItem(claveLocal, JSON.stringify(guardado));
    } catch (err) {
      console.error('No se pudo guardar la respuesta localmente:', err);
    }
  };

  const confirmarFinalizar = async () => {
    const faltantes = totalPreguntas - respondidas;
    if (faltantes > 0 && !window.confirm(`Aún le faltan ${faltantes} pregunta(s) por responder. ¿Desea finalizar de todos modos?`)) {
      return;
    }
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
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center border border-gray-100 space-y-4">
          <FaCheckCircle className={`text-5xl mx-auto ${motivoFinalizado === 'tiempo' ? 'text-amber-500' : 'text-emerald-500'}`} />
          <h2 className="text-lg font-bold text-[#112F5C]">
            {motivoFinalizado === 'tiempo' ? 'Tiempo agotado' : 'Examen finalizado'}
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            {motivoFinalizado === 'tiempo'
              ? `El tiempo de la evaluación "${evaluacion && evaluacion.nombre}" finalizó. Su avance fue guardado localmente en su navegador.`
              : `Respondió ${respondidas} de ${totalPreguntas} pregunta(s). Su avance fue guardado localmente en su navegador.`}
          </p>
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
    <div className="w-full animate-fade-in space-y-6">
      <div>
        <button
          onClick={() => navigate('/estudiante/evaluaciones')}
          className="flex items-center gap-2 text-[#112F5C] font-bold text-sm hover:underline mb-2"
        >
          <FaArrowLeft /> Volver a mis evaluaciones
        </button>
        <h1 className="text-2xl font-bold text-[#112F5C]">Examen en curso</h1>
        <p className="text-xs text-gray-500 mt-0.5">Responda cada pregunta y finalice antes de que expire el tiempo.</p>
      </div>

      {evaluacion && (
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase">EVALUACIÓN</span>
              <h2 className="text-sm font-bold text-[#112F5C]">{evaluacion.nombre}</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {evaluacion.momento} — Semestre {evaluacion.semestre} · Grupo {evaluacion.grupo} ({evaluacion.jornada})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-[#112F5C] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2">
                <FaClock /> {formatearTiempo(segundosRestantes)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="bg-sky-100 text-sky-800 text-[11px] font-bold px-3 py-1 rounded-xl">
              Puntaje total: {evaluacion.puntaje_total}
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-xl">
              <FaClipboardCheck className="inline mr-1" /> Respondidas {respondidas} de {totalPreguntas}
            </span>
            <span className="bg-gray-100 text-gray-600 text-[11px] font-bold px-3 py-1 rounded-xl">
              {estudiante ? `${estudiante.grupo} — Semestre ${estudiante.semestre}` : ''}
            </span>
          </div>
        </div>
      )}

      {raps.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm text-center">
          <FaBook className="text-4xl mx-auto mb-3 text-gray-300" />
          <p className="text-xs font-semibold text-gray-500">
            Esta evaluación aún no tiene RAPs con preguntas publicadas.
          </p>
        </div>
      ) : (
        raps.map((rap) => (
          <div key={rap.id_evaluacion_rap} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="border-b pb-3">
              <p className="text-[10px] font-bold text-[#B3282D] uppercase">{rap.codigo_rap}</p>
              <h3 className="text-sm font-bold text-[#112F5C]">{rap.nombre}</h3>
              {rap.descripcion && <p className="text-[11px] text-gray-500 mt-0.5">{rap.descripcion}</p>}
            </div>

            {rap.preguntas && rap.preguntas.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Sin preguntas en este RAP.</p>
            ) : (
              rap.preguntas.map((pregunta, idx) => (
                <div key={pregunta.id_pregunta} className="bg-gray-50 border border-gray-100 rounded-2xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-bold text-[#112F5C] leading-relaxed">
                      {idx + 1}. {pregunta.enunciado}
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 shrink-0">{pregunta.puntaje} pt</span>
                  </div>

                  {pregunta.tipo_pregunta === 'CERRADA' && pregunta.opciones && pregunta.opciones.length > 0 ? (
                    <div className="space-y-2">
                      {pregunta.opciones.map((opcion, oi) => {
                        const seleccionada = respuestas[pregunta.id_pregunta] === opcion.id_opcion_pregunta;
                        return (
                          <label
                            key={opcion.id_opcion_pregunta}
                            className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                              seleccionada
                                ? 'bg-emerald-50 border-emerald-300'
                                : 'bg-white border-gray-200 hover:border-[#112F5C]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`pregunta_${pregunta.id_pregunta}`}
                              checked={seleccionada}
                              onChange={() => manejarSeleccion(pregunta.id_pregunta, opcion.id_opcion_pregunta)}
                              className="accent-[#112F5C]"
                            />
                            <span className="font-bold text-xs text-[#112F5C] shrink-0">{String.fromCharCode(65 + oi)}.</span>
                            <span className="text-xs text-gray-700">{opcion.texto}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 italic">Pregunta de respuesta abierta (pendiente de medios para responder).</p>
                  )}
                </div>
              ))
            )}
          </div>
        ))
      )}

      <div className="flex justify-end pt-2 pb-6">
        <button
          onClick={confirmarFinalizar}
          disabled={totalPreguntas === 0}
          className="bg-[#B3282D] hover:bg-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-8 py-2.5 rounded-xl transition shadow-md"
        >
          Finalizar Examen
        </button>
      </div>
    </div>
  );
}