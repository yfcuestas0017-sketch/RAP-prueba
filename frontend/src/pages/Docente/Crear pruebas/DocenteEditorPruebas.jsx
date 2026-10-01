import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSyncAlt, FaExclamationCircle, FaCheckCircle, FaCheck } from 'react-icons/fa';

const OPCIONES_INICIALES = [
  { texto: '' },
  { texto: '' },
  { texto: '' },
  { texto: '' }
];

const TIPOS_PREGUNTA = [
  {
    valor: 'CERRADA',
    etiqueta: 'Selección múltiple (A / B / C / D)',
    descripcion: 'El estudiante marca una única opción correcta.'
  },
  {
    valor: 'ABIERTA',
    etiqueta: 'Respuesta abierta',
    descripcion: 'El estudiante redacta su respuesta libremente.'
  }
];

const nuevoFormularioPregunta = (tipo = 'CERRADA') => ({
  tipoPregunta: tipo,
  enunciado: '',
  puntaje: '1',
  opciones: OPCIONES_INICIALES.map((op) => ({ ...op })),
  correctaIndex: 0
});

export default function DocenteEditorPrueba() {
  const { idEvaluacion } = useParams();
  const navigate = useNavigate();

  const API = 'http://localhost:3000/api/docente/evaluaciones';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const [evaluacion, setEvaluacion] = useState(null);
  const [raps, setRaps] = useState([]);
  const [idRap, setIdRap] = useState('');
  const [preguntas, setPreguntas] = useState([]);

  const [preguntaForm, setPreguntaForm] = useState(() => nuevoFormularioPregunta());

  const rapSeleccionado = raps.find((r) => String(r.id_evaluacion_rap) === String(idRap)) || null;
  const puntajeTotal = preguntas.reduce((suma, p) => suma + (Number(p.puntaje) || 0), 0);

  const cargarPreguntas = async (idEvaluacionRap) => {
    if (!idEvaluacionRap) {
      setPreguntas([]);
      return;
    }
    const res = await fetch(`${API}/rap/${idEvaluacionRap}/preguntas`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.mensaje || data.message || 'Error al listar las preguntas del RAP');
    setPreguntas(data.data || []);
  };

  const cargarEditorDocente = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/${idEvaluacion}`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || data.message || 'Error al obtener la evaluación del docente');

      const detalle = data.data || {};
      setEvaluacion(detalle.evaluacion || null);
      setRaps(detalle.raps || []);

      if (detalle.raps && detalle.raps.length > 0) {
        setIdRap(detalle.raps[0].id_evaluacion_rap);
        await cargarPreguntas(detalle.raps[0].id_evaluacion_rap);
      } else {
        setIdRap('');
        setPreguntas([]);
      }
    } catch (err) {
      console.error('Error cargando editor docente:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEditorDocente();
  }, [idEvaluacion]);

  const handleCambiarRap = async (e) => {
    const nuevo = e.target.value;
    setIdRap(nuevo);
    setPreguntaForm(nuevoFormularioPregunta(preguntaForm.tipoPregunta));
    try {
      setError('');
      await cargarPreguntas(nuevo);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGuardarPregunta = async (e) => {
    e.preventDefault();
    if (!idRap) {
      alert('La evaluación no tiene RAPs vinculados. Agregue un RAP desde el módulo del administrador.');
      return;
    }
    if (!preguntaForm.enunciado.trim()) {
      alert('Ingrese el enunciado del reactivo.');
      return;
    }

    const esCerrada = preguntaForm.tipoPregunta === 'CERRADA';
    if (esCerrada) {
      const opcionesConTexto = preguntaForm.opciones.map((op) => op.texto.trim());
      if (opcionesConTexto.some((t) => !t)) {
        alert('Todas las opciones A, B, C y D deben tener texto.');
        return;
      }
    }

    try {
      setGuardando(true);
      setError('');
      const res = await fetch(`${API}/rap/${idRap}/preguntas`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo_pregunta: preguntaForm.tipoPregunta,
          enunciado: preguntaForm.enunciado.trim(),
          puntaje: Number(preguntaForm.puntaje) || 1,
          ...(esCerrada
            ? {
              opciones: preguntaForm.opciones.map((op, idx) => ({
                texto: op.texto.trim(),
                correcta: idx === preguntaForm.correctaIndex
              }))
            }
            : {})
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.mensaje || data.message || 'Error al guardar la pregunta');

      setMensajeExito('Pregunta guardada en el banco correctamente.');
      setTimeout(() => setMensajeExito(''), 3000);
      setPreguntaForm(nuevoFormularioPregunta(preguntaForm.tipoPregunta));
      await cargarPreguntas(idRap);
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando editor de preguntas...</p>
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
          <button onClick={cargarEditorDocente} className="bg-[#112F5C] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow">
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      <div>
        <button onClick={() => navigate('/docente/evaluaciones/crear')} className="flex items-center gap-2 text-[#112F5C] font-bold text-sm hover:underline mb-2">
          <FaArrowLeft /> Volver a Evaluaciones Asignadas | Paso 2: Redacción de Preguntas (Docente)
        </button>
        <p className="text-xs text-gray-500">Defina las preguntas de cada RAP vinculado a la evaluación. Elija el tipo de cada reactivo: selección múltiple (A, B, C, D) o respuesta abierta.</p>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <FaCheckCircle className="text-emerald-600 text-base shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {evaluacion && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase">EVALUACIÓN CREADA POR EL ADMINISTRADOR:</span>
            <h2 className="text-sm font-bold text-[#112F5C] mt-0.5">{evaluacion.nombre}</h2>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700">Semestre {evaluacion.semestre} — {evaluacion.momento}</p>
            <p className="text-xs text-gray-500">Grupo {evaluacion.grupo} — {evaluacion.jornada}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${colorEstado(evaluacion.estado)}`}>
              {evaluacion.estado}
            </span>
            <p className="text-[11px] text-gray-500">Puntaje total: {evaluacion.puntaje_total}</p>
          </div>
        </div>
      )}

      {raps.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-semibold text-gray-500">
            Esta evaluación aún no tiene RAPs vinculados. Un administrador debe vincular los RAPs antes de redactar preguntas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <form onSubmit={handleGuardarPregunta} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-[#112F5C]">Redacción del Reactivo</h3>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-3 py-0.5 rounded-full">{raps.length} RAP</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">RAP Evaluado:</label>
              <select
                value={idRap}
                onChange={handleCambiarRap}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
              >
                {raps.map((r) => (
                  <option key={r.id_evaluacion_rap} value={r.id_evaluacion_rap}>
                    {r.codigo_rap} — {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Tipo de Pregunta:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {TIPOS_PREGUNTA.map((tipo) => {
                  const activo = preguntaForm.tipoPregunta === tipo.valor;
                  return (
                    <label
                      key={tipo.valor}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        activo
                          ? 'bg-sky-50 border-sky-400'
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipoPregunta"
                        value={tipo.valor}
                        checked={activo}
                        onChange={() => setPreguntaForm({ ...preguntaForm, tipoPregunta: tipo.valor })}
                        className="accent-[#112F5C] mt-0.5 shrink-0"
                      />
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold text-[#112F5C] leading-snug">{tipo.etiqueta}</span>
                        <span className="block text-[10px] text-gray-500 leading-snug mt-0.5">{tipo.descripcion}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Enunciado del Reactivo:</label>
              <textarea
                rows={3}
                placeholder="Redacte aquí el enunciado de la pregunta..."
                value={preguntaForm.enunciado}
                onChange={(e) => setPreguntaForm({ ...preguntaForm, enunciado: e.target.value })}
                className="w-full px-3.5 py-2 bg-white border border-sky-400 rounded-xl text-xs text-[#112F5C] font-semibold focus:outline-none"
              />
            </div>

            {preguntaForm.tipoPregunta === 'CERRADA' ? (
              <div className="space-y-3 pt-2">
                <label className="block text-[11px] font-bold text-gray-700">Opciones de Respuesta y Selección de Clave:</label>
                {preguntaForm.opciones.map((op, idx) => (
                  <div key={idx} className={`p-2.5 rounded-xl flex items-center gap-2 ${
                    idx === preguntaForm.correctaIndex ? 'bg-emerald-50 border border-emerald-300' : 'bg-red-50 border border-red-200'
                  }`}>
                    <span className="font-bold text-xs text-gray-800">{String.fromCharCode(65 + idx)}</span>
                    <input
                      type="text"
                      placeholder={`Opción ${String.fromCharCode(65 + idx)}...`}
                      value={op.texto}
                      onChange={(e) => {
                        const opciones = [...preguntaForm.opciones];
                        opciones[idx] = { texto: e.target.value };
                        setPreguntaForm({ ...preguntaForm, opciones });
                      }}
                      className="w-full bg-transparent text-xs text-gray-800 focus:outline-none"
                    />
                    <label className="flex items-center gap-1 cursor-pointer text-[10px] font-bold text-gray-600 shrink-0">
                      <input
                        type="radio"
                        name="clave"
                        checked={idx === preguntaForm.correctaIndex}
                        onChange={() => setPreguntaForm({ ...preguntaForm, correctaIndex: idx })}
                        className="accent-[#008A52]"
                      />
                      Correcta
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Reactivo de <strong>respuesta abierta</strong>. No requiere opciones ni clave: el estudiante
                  escribirá su respuesta libremente y el docente la calificará manualmente.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Puntaje:</label>
              <input
                type="number"
                min="1"
                step="1"
                value={preguntaForm.puntaje}
                onChange={(e) => setPreguntaForm({ ...preguntaForm, puntaje: e.target.value })}
                className="w-28 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <button type="submit" disabled={guardando} className="bg-[#112F5C] hover:bg-blue-900 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow">
                {guardando ? 'Guardando...' : 'Guardar Pregunta'}
              </button>
              <button type="button" onClick={() => navigate('/docente/evaluaciones/crear')} className="bg-[#008A52] hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow">
                Finalizar y Volver al Listado
              </button>
            </div>
          </form>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-[#112F5C] border-b pb-3">Preguntas RAP</h3>

            {rapSeleccionado ? (
              <div className="p-3.5 rounded-xl border border-sky-100 bg-sky-50 space-y-1">
                <span className="block text-[9px] font-bold uppercase tracking-wider text-sky-700">
                  RAP en edición
                </span>
                <p className="text-sm font-bold text-[#112F5C] leading-tight">
                  {rapSeleccionado.codigo_rap}
                </p>
                <p className="text-[11px] text-gray-700 leading-snug">{rapSeleccionado.nombre}</p>
                {rapSeleccionado.descripcion && (
                  <p className="text-[10px] text-gray-500 leading-snug pt-1 border-t border-sky-100 mt-1">
                    {rapSeleccionado.descripcion}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50">
                <p className="text-[11px] font-semibold text-gray-500">Seleccione un RAP para ver sus preguntas.</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-gray-700">Preguntas creadas</span>
              <div className="flex items-center gap-1.5">
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {preguntas.length}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {puntajeTotal} pt
                </span>
              </div>
            </div>

            {preguntas.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-xs font-semibold text-gray-500">Sin preguntas agregadas a este RAP.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
                {preguntas.map((p, idx) => (
                  <div key={p.id_pregunta || idx} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-xs text-[#112F5C]">Pregunta {idx + 1}</h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          p.tipo_pregunta === 'ABIERTA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-sky-100 text-sky-800'
                        }`}>
                          {p.tipo_pregunta === 'ABIERTA' ? 'ABIERTA' : 'A / B / C / D'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">{p.puntaje} pt</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-700 leading-relaxed">{p.enunciado}</p>
                    {p.opciones && p.opciones.length > 0 && (
                      <ul className="space-y-1 pt-1">
                        {p.opciones.map((op, oi) => (
                          <li key={op.id_opcion_pregunta || oi} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                            {op.eleccion && <FaCheck className="text-emerald-600 mt-0.5 shrink-0" />}
                            {op.texto}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}