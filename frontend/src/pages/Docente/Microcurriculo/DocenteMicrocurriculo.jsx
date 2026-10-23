import React, { useState, useEffect, useRef } from 'react';
import { 
  FaPlus, 
  FaEdit, 
  FaTrashAlt, 
  FaFilePdf, 
  FaFileWord, 
  FaSyncAlt, 
  FaExclamationCircle, 
  FaArrowLeft,
  FaSave,
  FaCheckCircle
} from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { elementToDocxBlob } from '../../../utils/docxExporter.js';
import { exportarElementoAPdf } from '../../../utils/pdfExporter.js';
import { impedirEnvioPorEnter } from '../../../utils/impedirEnvioPorEnter.js';
import MicrocurriculoDocumento from './MicrocurriculoDocumento.jsx';
import {
  crearFormDataMicrocurriculo,
  normalizarMicrocurriculo,
  SEMESTRES
} from '../../../utils/microcurriculo.js';
import {
  listarMicrocurriculos,
  listarEspaciosAcademicos,
  obtenerMicrocurriculo,
  crearMicrocurriculo,
  actualizarMicrocurriculo,
  enviarMicrocurriculo,
  eliminarMicrocurriculo
} from '../../../services/microcurriculoService.js';

function TablaMicrocurriculos({ filas, onEditar, onExportar, onEnviar, onEliminar }) {
  if (!filas.length) return <p className="py-6 text-center text-xs text-gray-500">No hay microcurriculos en este apartado.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead className="bg-[#112F5C] text-white font-semibold"><tr>
          <th className="px-4 py-3">ESPACIO ACADEMICO</th><th className="px-4 py-3">CODIGO / VERSION</th>
          <th className="px-4 py-3">SEMESTRE</th><th className="px-4 py-3">PERIODO</th>
          <th className="px-4 py-3 text-center">MODALIDAD</th><th className="px-4 py-3 text-center">ESTADO</th>
        </tr></thead>
        <tbody className="divide-y divide-gray-100">{filas.map((micro) => {
          const esBorrador = String(micro.estado || 'Borrador').toLowerCase() === 'borrador';
          return <React.Fragment key={micro.id_microcurriculo}>
            <tr className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3.5 font-bold text-[#112F5C]">{micro.espacio_academico || 'Espacio Asignado'}</td>
              <td className="px-4 py-3.5 text-gray-600">{micro.codigo} (v{micro.version})</td>
              <td className="px-4 py-3.5 text-gray-600">{micro.semestre || '?'}</td>
              <td className="px-4 py-3.5 text-gray-600">{micro.periodo}</td><td className="px-4 py-3.5 text-gray-600">{micro.modalidad}</td>
              <td className="px-4 py-3.5 text-center"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${micro.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-800' : micro.estado === 'Enviada' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}`}>{micro.estado || 'Borrador'}</span></td>
            </tr>
            <tr className="bg-gray-50/70 border-b border-gray-100"><td colSpan={6} className="px-4 py-2.5"><div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => onEditar(micro.id_microcurriculo)} className="bg-[#112F5C] hover:bg-blue-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1"><FaEdit /> {esBorrador ? 'Editar' : 'Ver'}</button>
              <button type="button" onClick={() => onExportar(micro.id_microcurriculo, 'pdf')} className="bg-[#B3282D] hover:bg-red-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"><FaFilePdf /> PDF</button>
              <button type="button" onClick={() => onExportar(micro.id_microcurriculo, 'word')} className="bg-[#0074B7] hover:bg-sky-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"><FaFileWord /> Word</button>
              {esBorrador && <><button type="button" onClick={() => onEnviar(micro)} className="bg-[#0074B7] hover:bg-sky-800 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1"><FaCheckCircle /> Enviar</button>
              <button type="button" onClick={() => onEliminar(micro.id_microcurriculo)} className="bg-[#B3282D] hover:bg-red-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"><FaTrashAlt /> Eliminar</button></>}
            </div></td></tr>
          </React.Fragment>;
        })}</tbody>
      </table>
    </div>
  );
}

export default function DocenteMicrocurriculos() {
  const [microcurriculos, setMicrocurriculos] = useState([]);
  const [espaciosAcademicos, setEspaciosAcademicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [exportacionPendiente, setExportacionPendiente] = useState('');
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Vistas: 'lista' | 'formulario'
  const [vista, setVista] = useState('lista');
  const [pasoActual, setPasoActual] = useState(0);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [soloLectura, setSoloLectura] = useState(false);
  const [idSeleccionado, setIdSeleccionado] = useState(null);

  // Formulario completo alineado a BD y PDF Institucional. Los nombres de los
  // campos y sus valores por defecto viven en utils/microcurriculo.js para que
  // coincidan con los que espera MicrocurriculoDocumento.
  const [formData, setFormData] = useState(() => crearFormDataMicrocurriculo());

  const pdfRef = useRef(null);
  const microsBorrador = microcurriculos.filter((micro) => String(micro.estado || 'Borrador').toLowerCase() === 'borrador');
  const microsEnviados = microcurriculos.filter((micro) => String(micro.estado || 'Borrador').toLowerCase() !== 'borrador');
  const camposRequeridosPorPaso = [
    [
      ['id_espacio_academico', 'Selecciona un espacio académico.'],
      ['codigo', 'Completa el código del documento.'],
      ['version', 'Completa la versión del documento.'],
      ['fecha_documento', 'Completa la fecha del documento.']
    ],
    [
      ['semestre', 'Selecciona el semestre.'],
      ['periodo', 'Completa el periodo lectivo.'],
      ['modalidad', 'Selecciona la modalidad.'],
      ['creditos', 'Completa los créditos.'],
      ['horas_acompanamiento_directo', 'Completa las horas de acompañamiento directo.'],
      ['horas_trabajo_independiente', 'Completa las horas de trabajo independiente.']
    ],
    [['sintesis', 'Completa la síntesis del espacio académico.']],
    [['proposito', 'Completa el propósito del espacio académico.']],
    [['justificacion', 'Completa la justificación.']],
    [['competencia_central', 'Completa la competencia central.']]
  ];

  const validarPaso = (indice) => {
    const faltante = camposRequeridosPorPaso[indice]?.find(([campo]) => !String(formData[campo] || '').trim());
    return faltante?.[1] || '';
  };

  const irAPaso = (destino) => {
    for (let indice = 0; indice < destino; indice += 1) {
      const errorPaso = validarPaso(indice);
      if (errorPaso) {
        setPasoActual(indice);
        alert(errorPaso);
        return;
      }
    }
    setPasoActual(destino);
  };
  const pasosFormulario = [
    { titulo: 'Identificación', descripcion: 'Espacio y documento' },
    { titulo: 'Datos académicos', descripcion: 'Periodo, modalidad y carga' },
    { titulo: 'Síntesis', descripcion: 'Descripción del espacio' },
    { titulo: 'Propósito', descripcion: 'Alcance formativo' },
    { titulo: 'Justificación', descripcion: 'Relevancia del espacio' },
    { titulo: 'Competencia', descripcion: 'Competencia central' }
  ];

  // 1. Cargar lista de microcurrículos del docente
  const cargarMicrocurriculos = async () => {
    try {
      setLoading(true);
      setError('');
      const [data, espaciosData] = await Promise.all([
        listarMicrocurriculos(),
        listarEspaciosAcademicos()
      ]);
      if (!data?.success) throw new Error(data?.mensaje || 'Error al obtener los microcurrículos');
      if (!espaciosData?.success) {
        throw new Error(espaciosData?.mensaje || 'Error al obtener los espacios académicos');
      }

      const lista = data.microcurriculos || [];
      setMicrocurriculos(lista);

      // Usa el catálogo devuelto por la ruta docente y conserva opciones
      // existentes de microcurrículos por si algún espacio ya no está en él.
      const mapa = new Map(
        (espaciosData.espaciosAcademicos || []).map((ea) => [
          String(ea.id_espacio_academico),
          ea
        ])
      );
      lista.forEach((m) => {
        if (m.id_espacio_academico != null && !mapa.has(String(m.id_espacio_academico))) {
          mapa.set(String(m.id_espacio_academico), {
            id_espacio_academico: m.id_espacio_academico,
            nombre: m.espacio_academico
          });
        }
      });
      setEspaciosAcademicos(Array.from(mapa.values()));
    } catch (err) {
      console.error('Error cargando microcurrículos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMicrocurriculos();
  }, []);

  // Nombre del espacio académico a partir de su id (microcurrículos o catálogo local).
  const nombreEspacioAcademico = (id) => {
    if (id == null || id === '') return '';
    const encontrado = espaciosAcademicos.find(
      (ea) => String(ea.id_espacio_academico) === String(id)
    );
    if (encontrado?.nombre) return encontrado.nombre;
    const micro = microcurriculos.find(
      (m) => String(m.id_espacio_academico) === String(id)
    );
    return micro?.espacio_academico || '';
  };

  // 2. Manejadores de Formulario (Crear / Editar)
  const handleNuevo = () => {
    setPasoActual(0);
    setModoEdicion(false);
    setSoloLectura(false);
    setIdSeleccionado(null);
    setFormData(
      crearFormDataMicrocurriculo({
        id_espacio_academico: espaciosAcademicos[0]?.id_espacio_academico || '',
        codigo: ''
      })
    );
    setVista('formulario');
  };

  const handleEditar = async (id) => {
    try {
      setLoading(true);
      const data = await obtenerMicrocurriculo(id);
      if (!data?.success) throw new Error(data?.mensaje || 'Error al obtener el detalle');
      // Normaliza la fila de la BD: null -> '', fechas -> "yyyy-mm-dd" y selects
      // con una opción válida, para no dejar campos undefined al exportar.
      const microcurriculo = data.microcurriculo;
      setFormData(normalizarMicrocurriculo(microcurriculo));
      setPasoActual(0);
      setModoEdicion(true);
      setSoloLectura(String(microcurriculo.estado || 'Borrador').toLowerCase() !== 'borrador');
      setIdSeleccionado(id);
      setVista('formulario');
    } catch (err) {
      setExportacionPendiente('');
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportarDesdeListado = (id, formato) => {
    setExportacionPendiente(formato);
    handleEditar(id);
  };

  const handleGuardar = async (e, estado = 'Borrador') => {
    e.preventDefault();
    if (soloLectura) return;
    if (estado === 'Enviada') {
      for (let indice = 0; indice < pasosFormulario.length; indice += 1) {
        const errorPaso = validarPaso(indice);
        if (errorPaso) {
          setPasoActual(indice);
          alert(errorPaso);
          return;
        }
      }
    }
    if (!formData.id_espacio_academico || !formData.periodo) {
      alert('El espacio académico y el periodo académico son obligatorios.');
      return;
    }

    const enviar = estado === 'Enviada';
    // Se envía el formulario completo para guardar todo el proceso y, además,
    // el estado deseado: "Borrador" si solo se está diligenciando o "Enviada"
    // cuando el docente finaliza y remite el documento.
    const payload = { ...formData, estado };

    try {
      setGuardando(true);
      const data = modoEdicion
        ? enviar
          ? await enviarMicrocurriculo(idSeleccionado, payload)
          : await actualizarMicrocurriculo(idSeleccionado, payload)
        : await crearMicrocurriculo(payload);

      if (!data?.success) throw new Error(data?.mensaje || 'Error al guardar');
      if (enviar && String(data.microcurriculo?.estado || '').toLowerCase() !== 'enviada') {
        throw new Error('El microcurrículo no se puede marcar como enviado hasta que el backend persista el estado. El registro no se bloqueó.');
      }

      setMensajeExito(
        enviar
          ? 'Microcurrículo enviado correctamente'
          : modoEdicion
          ? 'Microcurrículo actualizado correctamente'
          : 'Borrador de microcurrículo guardado correctamente'
      );
      setTimeout(() => setMensajeExito(''), 3000);
      cargarMicrocurriculos();
      setVista('lista');
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Envía un microcurrículo que ya existe (deja de ser borrador).
  const handleEnviar = async (item) => {
    if (!window.confirm('¿Enviar este microcurrículo? Dejará de figurar como borrador.')) return;
    try {
      setError('');
      // Se envían solo campos permitidos por el backend junto con el estado:
      // así no se reescribe el documento con fechas recalculadas.
      const data = await enviarMicrocurriculo(item.id_microcurriculo, {
        id_espacio_academico: item.id_espacio_academico,
        periodo: item.periodo,
        semestre: item.semestre,
        estado: 'Enviada'
      });
      if (!data?.success) throw new Error(data?.mensaje || 'No se pudo enviar el microcurrículo');
      if (String(data.microcurriculo?.estado || '').toLowerCase() !== 'enviada') {
        throw new Error('El backend no guardó el estado Enviada. El microcurrículo continúa como borrador.');
      }
      setMensajeExito('Microcurrículo enviado correctamente');
      setTimeout(() => setMensajeExito(''), 3000);
      cargarMicrocurriculos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar este borrador de microcurrículo?')) return;
    try {
      const data = await eliminarMicrocurriculo(id);
      if (!data?.success) throw new Error(data?.mensaje || 'No se pudo eliminar');
      cargarMicrocurriculos();
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. EXPORTACIONES (PDF & WORD)
  const exportarPDF = async () => {
    if (!pdfRef.current || exportandoPDF) return;
    try {
      setExportandoPDF(true);
      // `exportarElementoAPdf` espera el renderizado y aplica los saltos de
      // página institucionales (data-docx-page / data-docx-page-break) por lo
      // que no se necesita un RAF previo.
      await exportarElementoAPdf(
        pdfRef.current,
        `Microcurriculo_${formData.codigo || 'Syllabus'}.pdf`,
        {
          escala: 1,
          orientacion: 'landscape',
          formato: 'letter',
          unidad: 'in',
          margen: 0
        }
      );
    } catch (err) {
      console.error('Error al exportar microcurrículo a PDF:', err);
      alert('No fue posible generar el PDF. Intente nuevamente.');
    } finally {
      setExportandoPDF(false);
    }
  };

  const exportarWord = () => {
    try {
      const blob = elementToDocxBlob(pdfRef.current, 'Microcurrículo (Syllabus)', { orientation: 'landscape' });
      saveAs(blob, `Microcurriculo_${formData.codigo || 'Syllabus'}.docx`);
    } catch (err) {
      console.error('Error al exportar a Word:', err);
      alert('No fue posible exportar a Word. Intente nuevamente.');
    }
  };

  useEffect(() => {
    if (vista !== 'formulario' || !exportacionPendiente || !pdfRef.current) return undefined;
    const frame = requestAnimationFrame(() => {
      try {
        if (exportacionPendiente === 'pdf') exportarPDF();
        else exportarWord();
      } finally {
        setExportacionPendiente('');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [vista, exportacionPendiente, formData]);

  if (loading && vista === 'lista') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando módulo de microcurrículos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      
      {/* Mensaje Alerta Éxito */}
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <FaCheckCircle className="text-emerald-600 text-base shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Mensaje Alerta Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <FaExclamationCircle className="text-red-600 text-base shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* VISTA 1: LISTADO DE MICROCURRÍCULOS */}
      {vista === 'lista' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#112F5C]">Gestión de Microcurrículos (Syllabus)</h1>
              <p className="text-xs text-gray-500 mt-0.5">Diligenciamiento de propuestas microcurriculares institucional Universidad CESMAG.</p>
            </div>
            <button
              onClick={handleNuevo}
              className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <FaPlus /> Crear Nuevo Microcurrículo
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
            {microcurriculos.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-3">
                <p className="text-xs font-semibold text-gray-500">No tiene registros de microcurrículos creados actualmente.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <section className="rounded-2xl border border-amber-200 overflow-hidden">
                  <h2 className="bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">Borradores ({microsBorrador.length})</h2>
                  <TablaMicrocurriculos filas={microsBorrador} onEditar={handleEditar} onExportar={exportarDesdeListado} onEnviar={handleEnviar} onEliminar={handleEliminar} />
                </section>
                <section className="rounded-2xl border border-sky-200 overflow-hidden">
                  <h2 className="bg-sky-50 px-4 py-3 text-xs font-bold text-sky-900">Enviados y aprobados ({microsEnviados.length})</h2>
                  <TablaMicrocurriculos filas={microsEnviados} onEditar={handleEditar} onExportar={exportarDesdeListado} onEnviar={handleEnviar} onEliminar={handleEliminar} />
                </section>
              </div>
            )}
          </div>
        </div>
      ) : (

        /* VISTA 2: FORMULARIO Y PREVISUALIZACIÓN TIPO PLANTILLA DOC-CU-FR-002 */
        <div className="space-y-6">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <button
              onClick={() => setVista('lista')}
              className="flex items-center gap-2 text-[#112F5C] font-bold text-xs hover:underline bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
            >
              <FaArrowLeft /> Volver a la Lista
            </button>

</div>

          <form onSubmit={(e) => handleGuardar(e, 'Enviada')} onKeyDown={impedirEnvioPorEnter} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                {pasosFormulario.map((paso, indice) => (
                  <React.Fragment key={paso.titulo}>
                    <button type="button" onClick={() => irAPaso(indice)} className="min-w-[82px] flex flex-col items-center text-center" aria-current={indice === pasoActual ? 'step' : undefined}>
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${indice === pasoActual ? 'bg-[#112F5C] text-white ring-4 ring-blue-100' : indice < pasoActual ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{indice + 1}</span>
                      <span className={`mt-2 text-[11px] font-bold ${indice === pasoActual ? 'text-[#112F5C]' : 'text-gray-500'}`}>{paso.titulo}</span>
                      <span className="hidden sm:block text-[10px] text-gray-400 mt-0.5">{paso.descripcion}</span>
                    </button>
                    {indice < pasosFormulario.length - 1 && <span className={`h-0.5 min-w-3 flex-1 rounded ${indice < pasoActual ? 'bg-emerald-500' : 'bg-gray-200'}`} aria-hidden="true" />}
                  </React.Fragment>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-3 sm:hidden">Paso {pasoActual + 1} de {pasosFormulario.length}: {pasosFormulario[pasoActual].descripcion}</p>
            </div>
            
            {/* CAMPOS EDICIÓN RÁPIDA */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#112F5C] border-b pb-3">{pasosFormulario[pasoActual].titulo} <span className="text-gray-400 font-medium">— {pasosFormulario[pasoActual].descripcion}</span></h2>

              <fieldset disabled={soloLectura} className="contents">
              {pasoActual === 0 && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Espacio Académico:</label>
                  <select
                    value={formData.id_espacio_academico}
                    onChange={(e) => setFormData({ ...formData, id_espacio_academico: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-sky-400 rounded-xl text-xs font-semibold text-[#112F5C] focus:outline-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    {espaciosAcademicos.length === 0 && (
                      <option value="" disabled>
                        No hay espacios académicos disponibles
                      </option>
                    )}
                    {espaciosAcademicos.map((ea) => (
                      <option key={ea.id_espacio_academico} value={ea.id_espacio_academico}>
                        {ea.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Código del Documento:</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Versión / Fecha:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                      placeholder="v3"
                    />
                    <input
                      type="date"
                      value={formData.fecha_documento ? formData.fecha_documento.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, fecha_documento: e.target.value })}
                      className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-[11px] focus:outline-none"
                    />
                  </div>
                </div>
              </div>}

              {pasoActual === 1 && <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Semestre:</label>
                  <select
                    value={formData.semestre || ''}
                    onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    {SEMESTRES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Periodo Lectivo:</label>
                  <input
                    type="text"
                    value={formData.periodo}
                    onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                    placeholder="IIP-2026"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Modalidad:</label>
                  <select
                    value={formData.modalidad}
                    onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                    <option value="A Distancia">A Distancia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Créditos:</label>
                  <input
                    type="number"
                    value={formData.creditos}
                    onChange={(e) => setFormData({ ...formData, creditos: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Horas Directo / Independiente:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={formData.horas_acompanamiento_directo}
                      onChange={(e) => setFormData({ ...formData, horas_acompanamiento_directo: e.target.value })}
                      className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                      placeholder="Directo"
                    />
                    <input
                      type="number"
                      value={formData.horas_trabajo_independiente}
                      onChange={(e) => setFormData({ ...formData, horas_trabajo_independiente: e.target.value })}
                      className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                      placeholder="Indep."
                    />
                  </div>
                </div>
              </div>}

              {pasoActual === 2 && <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">2. Síntesis del Espacio Académico:</label>
                  <textarea
                    rows={3}
                    value={formData.sintesis}
                    onChange={(e) => setFormData({ ...formData, sintesis: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

              </div>}

              {pasoActual === 3 && <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">3. Propósito del Espacio Académico:</label>
                  <textarea
                    rows={3}
                    value={formData.proposito}
                    onChange={(e) => setFormData({ ...formData, proposito: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

              </div>}

              {pasoActual === 4 && <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">4. Justificación:</label>
                  <textarea
                    rows={3}
                    value={formData.justificacion}
                    onChange={(e) => setFormData({ ...formData, justificacion: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

              </div>}

              {pasoActual === 5 && <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">7. Competencia Central:</label>
                  <textarea
                    rows={2}
                    value={formData.competencia_central}
                    onChange={(e) => setFormData({ ...formData, competencia_central: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>}
              </fieldset>

              <div className="flex justify-between pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setPasoActual((paso) => Math.max(0, paso - 1))} disabled={pasoActual === 0} className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Anterior</button>
                {pasoActual < pasosFormulario.length - 1 ? (
                  <button key="paso-siguiente" type="button" onClick={(e) => { e.preventDefault(); const errorPaso = validarPaso(pasoActual); if (errorPaso) { alert(errorPaso); return; } setPasoActual((paso) => Math.min(pasosFormulario.length - 1, paso + 1)); }} className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow transition">Siguiente</button>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {soloLectura ? <span className="self-center text-xs font-semibold text-gray-500">Registro enviado: solo lectura</span> : <>
                    <button
                      key="paso-borrador"
                      type="button"
                      disabled={guardando}
                      onClick={(e) => handleGuardar(e, 'Borrador')}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Guardar borrador
                    </button>
                    <button key="paso-guardar" type="submit" disabled={guardando} className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow transition flex items-center gap-2 disabled:opacity-60"><FaSave /> {guardando ? 'Guardando...' : 'Guardar y enviar'}</button>
                    </>}
                  </div>
                )}
              </div>
            </div>
          </form>

          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-200 shadow-md space-y-4 overflow-x-auto">
            <div>
              <h3 className="text-xs font-bold text-[#112F5C]">Previsualizacion de Microcurriculo (DOC-CU-FR-002)</h3>
              <p className="text-[11px] text-gray-500 mt-1">Documento institucional de cinco paginas en orientacion horizontal.</p>
            </div>
            <MicrocurriculoDocumento formData={{ ...formData, espacio_academico: nombreEspacioAcademico(formData.id_espacio_academico) }} ref={pdfRef} />
          </div>
        </div>
      )}

    </div>
  );
}
