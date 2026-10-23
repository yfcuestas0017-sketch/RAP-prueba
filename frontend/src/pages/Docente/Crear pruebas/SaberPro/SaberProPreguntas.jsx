import React, { useEffect, useState } from 'react';
import {
  FaArrowLeft,
  FaBrain,
  FaCheckCircle,
  FaEdit,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaListAlt,
  FaPlus,
  FaSave,
  FaSyncAlt,
  FaTimes,
  FaTrash,
  FaWrench
} from 'react-icons/fa';
import {
  actualizarPreguntaSaberPro,
  crearPreguntaSaberPro,
  eliminarPreguntaSaberPro,
  esModuloPendiente,
  listarPreguntasSaberPro,
  sugerirPreguntasSaberPro
} from '../../../../services/saberProService';
import {
  COMPETENCIAS_SABER_PRO,
  DIFICULTADES,
  corregirReactivo,
  generarBorradores,
  revisarReactivo
} from '../../../../utils/asistenteSaberPro';
import { impedirEnvioPorEnter } from '../../../../utils/impedirEnvioPorEnter.js';

const OPCIONES_INICIALES = [{ texto: '' }, { texto: '' }, { texto: '' }, { texto: '' }];

const nuevoReactivo = (tipo = 'CERRADA') => ({
  tipo,
  enunciado: '',
  puntaje: '1',
  opciones: OPCIONES_INICIALES.map((opcion) => ({ ...opcion })),
  correctaIndex: 0
});

const normalizarOpciones = (opciones) => {
  const lista = Array.isArray(opciones) ? opciones : [];
  const normalizadas = lista.map((opcion) => ({
    texto: typeof opcion === 'string' ? opcion : opcion?.texto ?? ''
  }));
  while (normalizadas.length < 4) normalizadas.push({ texto: '' });
  return normalizadas;
};

const normalizarPregunta = (pregunta) => ({
  id_pregunta: pregunta?.id_pregunta ?? pregunta?.id ?? null,
  tipo: pregunta?.tipo_pregunta || pregunta?.tipo || 'CERRADA',
  enunciado: pregunta?.enunciado || '',
  puntaje: String(pregunta?.puntaje ?? '1'),
  opciones: normalizarOpciones(pregunta?.opciones),
  correctaIndex: Number(pregunta?.respuesta_correcta ?? pregunta?.correctaIndex ?? 0) || 0
});

const ASISTENTE_INICIAL = {
  tema: '',
  competencia: COMPETENCIAS_SABER_PRO[0].valor,
  tipo: 'CERRADA',
  cantidad: 3,
  dificultad: 'media'
};

export default function SaberProPreguntas({ prueba, permiso, onVolver }) {
  const [preguntas, setPreguntas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pendienteBackend, setPendienteBackend] = useState(false);
  const [error, setError] = useState('');
  const [errorAccion, setErrorAccion] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // { origen: 'pregunta' | 'borrador', id }
  const [formulario, setFormulario] = useState(nuevoReactivo());
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [asistente, setAsistente] = useState(ASISTENTE_INICIAL);
  const [borradores, setBorradores] = useState([]);
  const [observaciones, setObservaciones] = useState({});
  const [generando, setGenerando] = useState(false);
  const [avisoAsistente, setAvisoAsistente] = useState('');

  const cargarPreguntas = async () => {
    try {
      setCargando(true);
      setError('');
      setPendienteBackend(false);
      const lista = await listarPreguntasSaberPro(prueba.id_prueba);
      setPreguntas(lista.map(normalizarPregunta));
    } catch (err) {
      if (esModuloPendiente(err)) {
        setPreguntas([]);
        setPendienteBackend(true);
      } else {
        setError(err.message || 'No fue posible cargar los reactivos de la prueba.');
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (prueba?.id_prueba != null) cargarPreguntas();
    else setCargando(false);
  }, [prueba?.id_prueba]);

  const abrirNuevo = () => {
    setEditando(null);
    setFormulario(nuevoReactivo());
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const abrirEditarPregunta = (indice) => {
    setEditando({ origen: 'pregunta', id: indice });
    setFormulario({ ...normalizarPregunta(preguntas[indice]) });
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const abrirEditarBorrador = (borrador) => {
    setEditando({ origen: 'borrador', id: borrador.id });
    setFormulario({
      tipo: borrador.tipo,
      enunciado: borrador.enunciado,
      puntaje: String(borrador.puntaje ?? '1'),
      opciones: normalizarOpciones(borrador.opciones),
      correctaIndex: borrador.correctaIndex ?? 0
    });
    setErrorFormulario('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    setEditando(null);
    setFormulario(nuevoReactivo());
    setErrorFormulario('');
  };

  const validarFormulario = () => {
    if (!formulario.enunciado.trim()) return 'El enunciado del reactivo es obligatorio.';
    const puntaje = Number(formulario.puntaje);
    if (!Number.isFinite(puntaje) || puntaje <= 0) return 'El puntaje debe ser mayor que cero.';
    if (formulario.tipo === 'CERRADA') {
      const llenas = formulario.opciones.filter((opcion) => opcion.texto.trim());
      if (llenas.length < 2) return 'Registre al menos dos opciones de respuesta.';
      if (!formulario.opciones[formulario.correctaIndex]?.texto.trim()) {
        return 'Marque como correcta una opción que tenga texto.';
      }
    }
    return '';
  };

  const datosReactivo = () => {
    if (formulario.tipo === 'ABIERTA') {
      return {
        tipo_pregunta: formulario.tipo,
        enunciado: formulario.enunciado.trim(),
        puntaje: Number(formulario.puntaje) || 1,
        opciones: [],
        respuesta_correcta: null
      };
    }

    // Se conserva el orden y se recalcula la posición de la opción correcta
    // después de descartar las opciones vacías.
    const opcionesArmadas = formulario.opciones
      .map((opcion, indice) => ({ texto: opcion.texto.trim(), original: indice }))
      .filter((opcion) => opcion.texto);
    const posicionCorrecta = opcionesArmadas.findIndex(
      (opcion) => opcion.original === formulario.correctaIndex
    );

    return {
      tipo_pregunta: formulario.tipo,
      enunciado: formulario.enunciado.trim(),
      puntaje: Number(formulario.puntaje) || 1,
      opciones: opcionesArmadas.map((opcion) => opcion.texto),
      respuesta_correcta: posicionCorrecta >= 0 ? posicionCorrecta : 0
    };
  };

  const guardarReactivo = async (evento) => {
    evento.preventDefault();
    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      setErrorFormulario(errorValidacion);
      return;
    }

    // Edición de un borrador del asistente: solo se actualiza en memoria.
    if (editando?.origen === 'borrador') {
      setBorradores((actuales) =>
        actuales.map((borrador) =>
          borrador.id === editando.id
            ? {
                ...borrador,
                tipo: formulario.tipo,
                enunciado: formulario.enunciado,
                puntaje: formulario.puntaje,
                opciones: formulario.opciones.map((opcion) => ({ ...opcion })),
                correctaIndex: formulario.correctaIndex
              }
            : borrador
        )
      );
      cerrarModal();
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario('');
      const datos = datosReactivo();

      if (editando?.origen === 'pregunta') {
        const original = preguntas[editando.id];
        await actualizarPreguntaSaberPro(prueba.id_prueba, original.id_pregunta, datos);
      } else {
        await crearPreguntaSaberPro(prueba.id_prueba, datos);
      }

      cerrarModal();
      await cargarPreguntas();
    } catch (err) {
      setErrorFormulario(err.message || 'No fue posible guardar el reactivo.');
    } finally {
      setGuardando(false);
    }
  };

  const borrarPregunta = async (indice) => {
    const pregunta = preguntas[indice];
    if (!window.confirm('¿Eliminar este reactivo de la prueba?')) return;

    try {
      setErrorAccion('');
      await eliminarPreguntaSaberPro(prueba.id_prueba, pregunta.id_pregunta);
      await cargarPreguntas();
    } catch (err) {
      setErrorAccion(err.message || 'No fue posible eliminar el reactivo.');
    }
  };

  const generar = async () => {
    const tema = asistente.tema.trim();
    if (!tema) {
      setAvisoAsistente('Escriba el tema o la competencia que desea evaluar.');
      return;
    }

    setGenerando(true);
    setAvisoAsistente('');
    setObservaciones({});
    let nuevos = null;
    let aviso = '';

    // 1) Se intenta el asistente del servidor (IA real), si existe.
    try {
      const respuesta = await sugerirPreguntasSaberPro({
        tema,
        competencia: asistente.competencia,
        cantidad: Number(asistente.cantidad),
        tipo: asistente.tipo,
        dificultad: asistente.dificultad
      });
      const lista = respuesta?.data ?? respuesta?.preguntas ?? respuesta;
      if (Array.isArray(lista) && lista.length) {
        nuevos = lista.map((pregunta, indice) => ({
          id: `ia-${Date.now()}-${indice}`,
          tipo: pregunta.tipo || asistente.tipo,
          enunciado: pregunta.enunciado || '',
          puntaje: String(pregunta.puntaje ?? '1'),
          dificultad: pregunta.dificultad || asistente.dificultad,
          competencia: pregunta.competencia || '',
          opciones: normalizarOpciones(pregunta.opciones),
          correctaIndex: Number(pregunta.respuesta_correcta ?? pregunta.correctaIndex ?? 0) || 0
        }));
        aviso = 'Sugerencias generadas por el asistente del servidor. Revise y corrija antes de guardar.';
      }
    } catch (err) {
      if (!esModuloPendiente(err)) {
        aviso = `El asistente del servidor respondió con un error (${err.message}). Se usó el asistente local.`;
      }
    }

    // 2) Respaldo local cuando el endpoint de IA no está disponible.
    if (!nuevos) {
      nuevos = generarBorradores({
        tema,
        competencia: asistente.competencia,
        cantidad: asistente.cantidad,
        tipo: asistente.tipo,
        dificultad: asistente.dificultad
      });
      if (!aviso) {
        aviso =
          'Borradores generados con el asistente local. Revise, corrija, edite y decida cuáles guardar antes de publicar.';
      }
    }

    setAvisoAsistente(aviso);
    setBorradores(nuevos);
    setGenerando(false);
  };

  const revisarBorrador = (id) => {
    const borrador = borradores.find((item) => item.id === id);
    if (!borrador) return;
    setObservaciones((actuales) => ({ ...actuales, [id]: revisarReactivo(borrador) }));
  };

  const corregirBorrador = (id) => {
    setBorradores((actuales) =>
      actuales.map((borrador) => (borrador.id === id ? { ...corregirReactivo(borrador) } : borrador))
    );
    setObservaciones((actuales) => ({ ...actuales, [id]: [] }));
  };

  const descartarBorrador = (id) => {
    setBorradores((actuales) => actuales.filter((borrador) => borrador.id !== id));
    setObservaciones((actuales) => {
      const copia = { ...actuales };
      delete copia[id];
      return copia;
    });
  };

  const guardarBorrador = async (borrador) => {
    const hallazgos = revisarReactivo(borrador);
    if (hallazgos.length) {
      setObservaciones((actuales) => ({ ...actuales, [borrador.id]: hallazgos }));
      return;
    }

    try {
      setErrorAccion('');
      await crearPreguntaSaberPro(prueba.id_prueba, {
        tipo_pregunta: borrador.tipo,
        enunciado: borrador.enunciado.trim(),
        puntaje: Number(borrador.puntaje) || 1,
        opciones:
          borrador.tipo === 'ABIERTA'
            ? []
            : borrador.opciones.map((opcion) => opcion.texto.trim()).filter(Boolean),
        respuesta_correcta: borrador.tipo === 'ABIERTA' ? null : borrador.correctaIndex
      });
      descartarBorrador(borrador.id);
      await cargarPreguntas();
    } catch (err) {
      setErrorAccion(err.message || 'No fue posible guardar el reactivo.');
    }
  };

  const cambiarTipo = (tipo) => {
    setFormulario((actual) => ({
      ...actual,
      tipo,
      opciones: tipo === 'CERRADA' && actual.opciones.length < 2
        ? OPCIONES_INICIALES.map((opcion) => ({ ...opcion }))
        : actual.opciones
    }));
  };

  const actualizarOpcion = (indice, texto) => {
    setFormulario((actual) => ({
      ...actual,
      opciones: actual.opciones.map((opcion, posicion) =>
        posicion === indice ? { ...opcion, texto } : opcion
      )
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#112F5C] hover:text-blue-900 transition"
        >
          <FaArrowLeft /> Volver a mis pruebas
        </button>
        <span className="text-[11px] text-gray-500">
          {prueba.modalidad === 'SABER_PRO' ? 'Prueba Saber Pro' : 'Simulacro'}
          {prueba.grupo ? ` · ${prueba.grupo}` : ''}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#112F5C]">{prueba.nombre}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Reactivos de la prueba ({preguntas.length}). Puede redactarlos manualmente o con el asistente.
            </p>
          </div>
          <button
            type="button"
            onClick={abrirNuevo}
            className="inline-flex items-center gap-2 bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow transition"
          >
            <FaPlus /> Nuevo reactivo
          </button>
        </div>

        {pendienteBackend && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <FaExclamationTriangle className="text-amber-600 text-base mt-0.5 shrink-0" />
            <p className="text-xs text-amber-900 leading-relaxed">
              El servicio de reactivos aún no está disponible en el servidor. La interfaz está lista para{' '}
              <code className="font-mono">GET/POST /api/docente/saber-pro/pruebas/:id/preguntas</code>.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
            <FaExclamationCircle className="text-[#B3282D] text-base mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
          </div>
        )}

        {errorAccion && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
            <FaExclamationTriangle className="text-[#B3282D] text-base mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 leading-relaxed">{errorAccion}</p>
          </div>
        )}

        {cargando ? (
          <div className="text-center py-10 text-gray-500">
            <FaSyncAlt className="text-2xl text-[#112F5C] animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Cargando reactivos...</p>
          </div>
        ) : preguntas.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <FaListAlt className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-xs font-semibold text-gray-500">Esta prueba todavía no tiene reactivos.</p>
          </div>
        ) : (
          <ol className="space-y-3">
            {preguntas.map((pregunta, indice) => (
              <li key={pregunta.id_pregunta ?? indice} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#B3282D] uppercase">
                      Reactivo {indice + 1} · {pregunta.tipo === 'ABIERTA' ? 'Abierta' : 'Selección múltiple'} ·{' '}
                      {pregunta.puntaje} pt
                    </p>
                    <p className="text-xs text-gray-800 mt-1 whitespace-pre-wrap">{pregunta.enunciado}</p>
                    {pregunta.tipo !== 'ABIERTA' && (
                      <ul className="mt-2 space-y-1">
                        {pregunta.opciones
                          .filter((opcion) => opcion.texto.trim())
                          .map((opcion, posicion) => (
                            <li
                              key={posicion}
                              className={`text-[11px] ${
                                posicion === pregunta.correctaIndex
                                  ? 'text-emerald-700 font-semibold'
                                  : 'text-gray-600'
                              }`}
                            >
                              {String.fromCharCode(65 + posicion)}. {opcion.texto}
                              {posicion === pregunta.correctaIndex ? ' ✓' : ''}
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => abrirEditarPregunta(indice)}
                      className="border border-[#112F5C] text-[#112F5C] hover:bg-[#112F5C] hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <FaEdit className="inline mr-1" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => borrarPregunta(indice)}
                      className="border border-[#B3282D] text-[#B3282D] hover:bg-[#B3282D] hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <FaTrash className="inline mr-1" /> Eliminar
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="bg-[#F8FAFC] rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <FaBrain className="text-xl text-[#B3282D] mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-[#112F5C]">Asistente de redacción</h3>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed max-w-3xl">
              Genere borradores de reactivos a partir de un tema. Revíselos, corríjalos, edítelos y guarde solo los que
              considere adecuados. Los borradores no se publican hasta que usted los guarde.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label htmlFor="asistente-tema" className="block text-[11px] font-semibold text-gray-700">
              Tema o competencia a evaluar
            </label>
            <input
              id="asistente-tema"
              type="text"
              value={asistente.tema}
              onChange={(e) => setAsistente({ ...asistente, tema: e.target.value })}
              placeholder="Ej. interpretación de gráficas de movimiento"
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="asistente-competencia" className="block text-[11px] font-semibold text-gray-700">
              Competencia
            </label>
            <select
              id="asistente-competencia"
              value={asistente.competencia}
              onChange={(e) => setAsistente({ ...asistente, competencia: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
            >
              {COMPETENCIAS_SABER_PRO.map((competencia) => (
                <option key={competencia.valor} value={competencia.valor}>
                  {competencia.etiqueta}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="asistente-tipo" className="block text-[11px] font-semibold text-gray-700">
              Tipo de reactivo
            </label>
            <select
              id="asistente-tipo"
              value={asistente.tipo}
              onChange={(e) => setAsistente({ ...asistente, tipo: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
            >
              <option value="CERRADA">Selección múltiple</option>
              <option value="ABIERTA">Respuesta abierta</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="asistente-cantidad" className="block text-[11px] font-semibold text-gray-700">
              Cantidad (1 a 10)
            </label>
            <input
              id="asistente-cantidad"
              type="number"
              min={1}
              max={10}
              value={asistente.cantidad}
              onChange={(e) => setAsistente({ ...asistente, cantidad: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="asistente-dificultad" className="block text-[11px] font-semibold text-gray-700">
              Dificultad
            </label>
            <select
              id="asistente-dificultad"
              value={asistente.dificultad}
              onChange={(e) => setAsistente({ ...asistente, dificultad: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
            >
              {DIFICULTADES.map((dificultad) => (
                <option key={dificultad} value={dificultad}>
                  {dificultad.charAt(0).toUpperCase() + dificultad.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={generar}
            disabled={generando}
            className="inline-flex items-center gap-2 bg-[#B3282D] hover:bg-red-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow transition disabled:opacity-60"
          >
            {generando ? <FaSyncAlt className="animate-spin" /> : <FaBrain />}
            {generando ? 'Generando...' : 'Generar borradores'}
          </button>
          {borradores.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setBorradores([]);
                setObservaciones({});
                setAvisoAsistente('');
              }}
              className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition"
            >
              Limpiar borradores
            </button>
          )}
        </div>

        {avisoAsistente && (
          <p className="text-[11px] text-gray-600 bg-white border border-gray-100 rounded-xl p-3 leading-relaxed">
            {avisoAsistente}
          </p>
        )}

        {borradores.length > 0 && (
          <ul className="space-y-3">
            {borradores.map((borrador) => {
              const hallazgos = observaciones[borrador.id] || [];
              return (
                <li key={borrador.id} className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-bold text-[#112F5C] uppercase">
                      {borrador.tipo === 'ABIERTA' ? 'Respuesta abierta' : 'Selección múltiple'}
                      {borrador.competencia ? ` · ${borrador.competencia}` : ''}
                      {borrador.dificultad ? ` · ${borrador.dificultad}` : ''}
                    </p>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Borrador
                    </span>
                  </div>

                  <p className="text-xs text-gray-800 whitespace-pre-wrap">{borrador.enunciado}</p>

                  {borrador.tipo !== 'ABIERTA' && (
                    <ul className="space-y-1">
                      {borrador.opciones.map((opcion, posicion) => (
                        <li
                          key={posicion}
                          className={`text-[11px] ${
                            posicion === borrador.correctaIndex
                              ? 'text-emerald-700 font-semibold'
                              : 'text-gray-600'
                          }`}
                        >
                          {String.fromCharCode(65 + posicion)}. {opcion.texto}
                          {posicion === borrador.correctaIndex ? ' ✓' : ''}
                        </li>
                      ))}
                    </ul>
                  )}

                  {hallazgos.length > 0 && (
                    <ul className="bg-amber-50 border border-amber-100 rounded-lg p-3 space-y-1">
                      {hallazgos.map((hallazgo, indice) => (
                        <li key={indice} className="text-[11px] text-amber-800">
                          • {hallazgo}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => revisarBorrador(borrador.id)}
                      className="border border-[#112F5C] text-[#112F5C] hover:bg-[#112F5C] hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <FaCheckCircle className="inline mr-1" /> Revisar
                    </button>
                    <button
                      type="button"
                      onClick={() => corregirBorrador(borrador.id)}
                      className="border border-[#112F5C] text-[#112F5C] hover:bg-[#112F5C] hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <FaWrench className="inline mr-1" /> Corregir
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirEditarBorrador(borrador)}
                      className="border border-gray-300 text-gray-700 hover:bg-gray-100 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <FaEdit className="inline mr-1" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => guardarBorrador(borrador)}
                      className="bg-[#112F5C] hover:bg-blue-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <FaSave className="inline mr-1" /> Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => descartarBorrador(borrador.id)}
                      className="border border-[#B3282D] text-[#B3282D] hover:bg-[#B3282D] hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      <FaTrash className="inline mr-1" /> Descartar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={guardarReactivo}
            onKeyDown={impedirEnvioPorEnter}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#112F5C]">
                  {editando?.origen === 'pregunta'
                    ? 'Editar reactivo'
                    : editando?.origen === 'borrador'
                    ? 'Editar borrador'
                    : 'Nuevo reactivo'}
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {editando?.origen === 'borrador'
                    ? 'Los cambios del borrador se conservan hasta que lo guarde o lo descarte.'
                    : 'El reactivo se guarda en la prueba seleccionada.'}
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="reactivo-tipo" className="block text-[11px] font-semibold text-gray-700">
                  Tipo de reactivo
                </label>
                <select
                  id="reactivo-tipo"
                  value={formulario.tipo}
                  onChange={(e) => cambiarTipo(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                >
                  <option value="CERRADA">Selección múltiple (A / B / C / D)</option>
                  <option value="ABIERTA">Respuesta abierta</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="reactivo-puntaje" className="block text-[11px] font-semibold text-gray-700">
                  Puntaje
                </label>
                <input
                  id="reactivo-puntaje"
                  type="number"
                  min={0.1}
                  step="0.1"
                  value={formulario.puntaje}
                  onChange={(e) => setFormulario({ ...formulario, puntaje: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="reactivo-enunciado" className="block text-[11px] font-semibold text-gray-700">
                Enunciado *
              </label>
              <textarea
                id="reactivo-enunciado"
                rows={4}
                required
                value={formulario.enunciado}
                onChange={(e) => setFormulario({ ...formulario, enunciado: e.target.value })}
                placeholder="Redacte la situación y la pregunta del reactivo."
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20 resize-y"
              />
            </div>

            {formulario.tipo === 'CERRADA' && (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold text-gray-700">
                  Opciones (marque la respuesta correcta)
                </p>
                {formulario.opciones.map((opcion, indice) => (
                  <div key={indice} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="reactivo-correcta"
                      checked={formulario.correctaIndex === indice}
                      onChange={() => setFormulario({ ...formulario, correctaIndex: indice })}
                      className="accent-[#B3282D]"
                      aria-label={`Marcar la opción ${String.fromCharCode(65 + indice)} como correcta`}
                    />
                    <span className="text-[11px] font-bold text-gray-500 w-4">
                      {String.fromCharCode(65 + indice)}
                    </span>
                    <input
                      type="text"
                      value={opcion.texto}
                      onChange={(e) => actualizarOpcion(indice, e.target.value)}
                      placeholder={`Opción ${String.fromCharCode(65 + indice)}`}
                      className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                    />
                  </div>
                ))}
              </div>
            )}

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
                <FaSave />{' '}
                {guardando
                  ? 'Guardando...'
                  : editando?.origen === 'borrador'
                  ? 'Aplicar cambios'
                  : editando?.origen === 'pregunta'
                  ? 'Guardar cambios'
                  : 'Agregar reactivo'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
