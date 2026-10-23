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
  FaCheckCircle,
  FaCalendarAlt
} from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { elementToDocxBlob } from '../../../utils/docxExporter';
import { exportarElementoAPdf } from '../../../utils/pdfExporter.js';
import { impedirEnvioPorEnter } from '../../../utils/impedirEnvioPorEnter.js';
import {
  listarFichas,
  obtenerFicha,
  crearFicha,
  actualizarFicha,
  enviarFicha,
  eliminarFicha,
  listarGruposDocente,
  listarEspaciosAcademicos
} from '../../../services/fichasService';
import FichaDocumento from './FichaDocumento';

// Fecha de hoy en formato ISO (yyyy-mm-dd) para que el campo «Fecha del
// formato» arranque con la fecha real y no con un valor fijo desactualizado.
function fechaHoyISO() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function TablaFichas({ filas, onEditar, onExportar, onEnviar, onEliminar }) {
  if (!filas.length) return <p className="py-6 text-center text-xs text-gray-500">No hay fichas en este apartado.</p>;
  return (
    <div className="overflow-x-auto"><table className="w-full text-left border-collapse text-xs">
      <thead className="bg-[#112F5C] text-white font-semibold"><tr>
        <th className="px-4 py-3">ESPACIO ACADEMICO</th><th className="px-4 py-3">GRUPO / PERIODO</th><th className="px-4 py-3">CODIGO / VERSION</th>
        <th className="px-4 py-3 text-center">SEMANAS PLANIFICADAS</th><th className="px-4 py-3 text-center">ESTADO</th>
      </tr></thead><tbody className="divide-y divide-gray-100">{filas.map((ficha) => {
        const esBorrador = String(ficha.estado || 'Borrador').toLowerCase() === 'borrador';
        const id = ficha.id_ficha || ficha.id;
        return <React.Fragment key={id}>
          <tr className="hover:bg-gray-50 transition-colors">
            <td className="px-4 py-3.5 font-bold text-[#112F5C]">{ficha.espacio_academico || '?'}</td>
            <td className="px-4 py-3.5 text-gray-600">Grupo {ficha.grupo} ({ficha.periodo}-{ficha.anio})</td>
            <td className="px-4 py-3.5 text-gray-600">{ficha.codigo_documento || 'DOC-CU-FR-003'} (v{ficha.version_documento || ficha.version || '3'})</td>
            <td className="px-4 py-3.5 text-center font-bold text-sky-700">{ficha.total_semanas ?? ficha.semanas?.length ?? 0} Semanas</td>
            <td className="px-4 py-3.5 text-center"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${ficha.estado === 'Aprobada' ? 'bg-emerald-100 text-emerald-800' : ficha.estado === 'Enviada' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'}`}>{ficha.estado || 'Borrador'}</span></td>
          </tr>
          <tr className="bg-gray-50/70 border-b border-gray-100"><td colSpan={5} className="px-4 py-2.5"><div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={() => onEditar(id)} className="bg-[#112F5C] hover:bg-blue-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1"><FaEdit /> {esBorrador ? 'Editar' : 'Ver'}</button>
            <button type="button" onClick={() => onExportar(id, 'pdf')} className="bg-[#B3282D] hover:bg-red-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"><FaFilePdf /> PDF</button>
            <button type="button" onClick={() => onExportar(id, 'word')} className="bg-[#0074B7] hover:bg-sky-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"><FaFileWord /> Word</button>
            {esBorrador && <><button type="button" onClick={() => onEnviar(ficha)} className="bg-[#0074B7] hover:bg-sky-800 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1"><FaCheckCircle /> Enviar</button>
            <button type="button" onClick={() => onEliminar(ficha)} className="bg-[#B3282D] hover:bg-red-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"><FaTrashAlt /> Eliminar</button></>}
          </div></td></tr>
        </React.Fragment>;
      })}</tbody></table></div>
  );
}

export default function DocenteFichasDesarrollo() {
  const [fichas, setFichas] = useState([]);
  const [espaciosAcademicos, setEspaciosAcademicos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [exportacionPendiente, setExportacionPendiente] = useState('');
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroJornada, setFiltroJornada] = useState('');

  // Estados de Navegación ('lista' | 'formulario')
  const [vista, setVista] = useState('lista');
  const [pasoActual, setPasoActual] = useState(0);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [soloLectura, setSoloLectura] = useState(false);
  const [idSeleccionado, setIdSeleccionado] = useState(null);

  // Formulario alineado con el formato DOC-CU-FR-003
  const [formData, setFormData] = useState({
    id_espacio_academico: '',
    id_grupo: '',
    id_programa: '',
    grupo: '2H',
    periodo: '',
    anio: String(new Date().getFullYear()),
    codigo_documento: 'DOC-CU-FR-003',
    version: '3',
    fecha_documento: fechaHoyISO(),
    rap_tributa: '',
    competencia_central: '',
    objetivo_aprendizaje: '',
    docente_nombre: '',
    docente_correo: '',
    docente_celular: '',
    docente_atencion: '',
    docente_lugar: '',
    semanas: []
  });

  const pdfRef = useRef(null);
  const pasosFormulario = [
    { titulo: 'Espacios y grupo', descripcion: 'Selecciona el espacio académico y grupo' },
    { titulo: 'Periodo y formato', descripcion: 'Completa periodo y datos del formato' },
    { titulo: 'Resultados', descripcion: 'RAP, competencia y objetivo' },
    { titulo: 'Planeación semanal', descripcion: 'Contenidos, estrategias y evaluación' },
    { titulo: 'Datos del docente', descripcion: 'Contacto y observaciones' }
  ];

  // 1. Cargar Fichas creadas desde PostgreSQL
  const cargarFichas = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listarFichas();
      setFichas(data.data || data.fichas || []);
    } catch (err) {
      console.error('Error cargando fichas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar lista de Espacios Académicos
  const cargarEspaciosAcademicos = async () => {
    try {
      const [espaciosData, gruposData] = await Promise.all([listarEspaciosAcademicos(), listarGruposDocente()]);
      setEspaciosAcademicos(espaciosData.espaciosAcademicos || []);
      setGrupos(gruposData.grupos || []);
    } catch (err) {
      console.error('Error cargando espacios académicos:', err);
    }
  };

  useEffect(() => {
    cargarFichas();
    cargarEspaciosAcademicos();
  }, []);

  // 2. Acciones del Formulario
  const handleNuevo = () => {
    setPasoActual(0);
    setModoEdicion(false);
    setSoloLectura(false);
    setIdSeleccionado(null);
    const grupoInicial = grupos[0];
    setFormData({
      id_espacio_academico: espaciosAcademicos[0]?.id_espacio_academico || '',
      id_grupo: grupoInicial?.id_grupo || '',
      id_programa: grupoInicial?.id_programa || '',
      grupo: grupoInicial?.codigo_jornada || grupoInicial?.nombre || '',
      periodo: '',
      anio: String(new Date().getFullYear()),
      codigo_documento: 'DOC-CU-FR-003',
      version: '3',
      fecha_documento: fechaHoyISO(),
      rap_tributa: '',
      competencia_central: '',
      objetivo_aprendizaje: '',
      docente_nombre: '',
      docente_correo: '',
      docente_celular: '',
      docente_atencion: '',
      docente_lugar: '',
      semanas: []
    });
    setVista('formulario');
  };

  const handleEditar = async (id) => {
    try {
      setLoading(true);
      const response = await obtenerFicha(id);
      const ficha = response.data || response.ficha;
      const grupoAsignado = grupos.find((item) => String(item.id_grupo) === String(ficha.id_grupo));
      // La fecha se normaliza a ISO (yyyy-mm-dd) y se descarta el `fecha_formato`
      // que venga en la ficha: así el encabezado y el PDF muestran siempre la
      // fecha que el docente establezca en el formulario.
      const fechaFicha = String(ficha.fecha_formato || ficha.fecha_documento || '');
      setFormData({
        ...ficha,
        fecha_formato: undefined,
        id_grupo: ficha.id_grupo || '',
        id_programa: ficha.id_programa || grupoAsignado?.id_programa || '',
        grupo: ficha.codigo_jornada || ficha.grupo || grupoAsignado?.codigo_jornada || grupoAsignado?.nombre || '',
        codigo_documento: ficha.codigo_documento || 'DOC-CU-FR-003',
        version: ficha.version_documento || ficha.version || '3',
        fecha_documento: /^\d{4}-\d{2}-\d{2}/.test(fechaFicha) ? fechaFicha.slice(0, 10) : fechaFicha,
        rap_tributa: ficha.resultado_aprendizaje || ficha.rap_tributa || '',
        docente_nombre: ficha.docente_nombre || ficha.docente || '',
        docente_correo: ficha.correo_docente || ficha.docente_correo || '',
        docente_celular: ficha.celular_docente || ficha.docente_celular || '',
        docente_atencion: ficha.horario_atencion || ficha.docente_atencion || '',
        docente_lugar: ficha.lugar_atencion || ficha.docente_lugar || '',
        semanas: (ficha.semanas || []).map((week) => ({
          ...week,
          semana: week.semana || `Semana ${week.numero_semana}`,
          contenido: week.contenido || (week.contenido_analitico || []).map((item) => item.descripcion || item.tema).filter(Boolean).join('\n'),
          estrategias: week.estrategias_didacticas || (week.estrategias || []).map((item) => `${item.nombre || ''}${item.descripcion ? `: ${item.descripcion}` : ''}`).join('\n'),
          evaluacion: week.evaluacion || (week.evaluaciones || []).map((item) => `${item.tipo || ''}: ${item.descripcion || ''}`).join('\n')
        }))
      });
      setModoEdicion(true);
      setSoloLectura(String(ficha.estado || 'Borrador').toLowerCase() !== 'borrador');
      setPasoActual(0);
      setIdSeleccionado(id);
      setVista('formulario');
    } catch (err) {
      setExportacionPendiente('');
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarSemana = () => {
    setFormData({
      ...formData,
      semanas: [
        ...formData.semanas,
        {
          semana: `Semana ${formData.semanas.length + 1}: `,
          contenido: '',
          estrategias: '',
          evaluacion: ''
        }
      ]
    });
  };

  const handleEliminarSemana = (index) => {
    const nuevasSemanas = formData.semanas.filter((_, idx) => idx !== index);
    setFormData({ ...formData, semanas: nuevasSemanas });
  };

  const camposRequeridosPorPaso = {
      0: [
        [formData.id_espacio_academico, 'Selecciona un espacio académico.'],
        [formData.id_grupo, 'Selecciona un grupo asignado.'],
        [formData.id_programa, 'El grupo seleccionado no tiene programa asociado.']
      ],
      1: [
        [formData.periodo, 'Completa el periodo.'],
        [formData.anio, 'Completa el año.'],
        [formData.codigo_documento, 'Completa el código del formato.'],
        [formData.version, 'Completa la versión del formato.'],
        [formData.fecha_documento, 'Completa la fecha del formato.']
      ],
      2: [
        [formData.rap_tributa, 'Completa el resultado de aprendizaje.'],
        [formData.competencia_central, 'Completa la competencia central.'],
        [formData.objetivo_aprendizaje, 'Completa el objetivo de aprendizaje.']
      ],
      3: formData.semanas.length
        ? formData.semanas.flatMap((semana, index) => [
          [semana.semana, `Completa el nombre de la semana ${index + 1}.`],
          [semana.contenido, `Completa el contenido de la semana ${index + 1}.`],
          [semana.estrategias, `Completa las estrategias de la semana ${index + 1}.`],
          [semana.evaluacion, `Completa la evaluación de la semana ${index + 1}.`]
        ])
        : [[false, 'Agrega al menos una semana a la planeación.']],
      4: [
        [formData.docente_nombre, 'Completa el nombre del docente.'],
        [formData.docente_correo, 'Completa el correo del docente.'],
        [formData.docente_celular, 'Completa el celular del docente.'],
        [formData.docente_atencion, 'Completa el horario de atención.'],
        [formData.docente_lugar, 'Completa el lugar de atención.']
      ]
  };

  const validarPaso = (indice) => {
    const faltante = (camposRequeridosPorPaso[indice] || []).find(([valor]) => !String(valor || '').trim());
    return faltante?.[1] || '';
  };

  const avanzarPaso = () => {
    const mensaje = validarPaso(pasoActual);
    if (mensaje) {
      alert(mensaje);
      return;
    }
    setPasoActual((paso) => Math.min(pasosFormulario.length - 1, paso + 1));
  };

  const validarFormularioCompleto = () => {
    for (let indice = 0; indice < pasosFormulario.length; indice += 1) {
      const mensaje = validarPaso(indice);
      if (mensaje) {
        setPasoActual(indice);
        alert(mensaje);
        return false;
      }
    }
    return true;
  };

  const handleGuardar = async (e, estado = 'Borrador') => {
    e.preventDefault();
    if (soloLectura) return;
    const enviar = estado === 'Enviada';
    if (enviar && !validarFormularioCompleto()) return;
    try {
      setGuardando(true);
      const payload = {
        ...formData,
        estado,
        id_espacio_academico: Number(formData.id_espacio_academico),
        id_grupo: Number(formData.id_grupo),
        id_programa: Number(formData.id_programa),
        version_documento: formData.version,
        fecha_formato: formData.fecha_documento,
        resultado_aprendizaje: formData.rap_tributa,
        correo_docente: formData.docente_correo,
        celular_docente: formData.docente_celular,
        horario_atencion: formData.docente_atencion,
        lugar_atencion: formData.docente_lugar
      };
      if (!payload.id_espacio_academico || !payload.id_grupo || !payload.id_programa) {
        throw new Error('Selecciona un espacio académico y un grupo asignado antes de guardar.');
      }
      if (modoEdicion) {
        await (enviar ? enviarFicha(idSeleccionado, payload) : actualizarFicha(idSeleccionado, payload));
      } else {
        await crearFicha(payload);
      }

      setMensajeExito(
        enviar
          ? 'Ficha de Desarrollo Temático enviada'
          : modoEdicion
          ? 'Ficha de Desarrollo Temático actualizada'
          : 'Borrador de Ficha de Desarrollo Temático guardado'
      );
      setTimeout(() => setMensajeExito(''), 3000);
      cargarFichas();
      setVista('lista');
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Envía una ficha que ya existe (deja de ser borrador).
  const handleEnviarFicha = async (item) => {
    if (!window.confirm('¿Enviar esta ficha? Dejará de figurar como borrador.')) return;
    try {
      setError('');
      await enviarFicha(item.id_ficha || item.id, { estado: 'Enviada' });
      setMensajeExito('Ficha de Desarrollo Temático enviada');
      setTimeout(() => setMensajeExito(''), 3000);
      cargarFichas();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEliminarFicha = async (item) => {
    const idFicha = item.id_ficha || item.id;
    if (!window.confirm('¿Eliminar esta ficha de desarrollo temático?')) return;
    try {
      setError('');
      await eliminarFicha(idFicha);
      setMensajeExito('Ficha de Desarrollo Temático eliminada');
      setTimeout(() => setMensajeExito(''), 3000);
      await cargarFichas();
    } catch (err) {
      setError(err.message || 'No fue posible eliminar la ficha.');
    }
  };

  // 3. Exportaciones PDF & Word
  const exportarPDF = async () => {
    if (!pdfRef.current || exportandoPDF) return;
    try {
      setExportandoPDF(true);
      // `exportarElementoAPdf` espera fuentes, imágenes y el repintado del
      // documento antes de capturarlo, por eso no se necesita un RAF aquí.
      await exportarElementoAPdf(
        pdfRef.current,
        `Ficha_Desarrollo_Tematico_${formData.grupo || 'EA'}.pdf`,
        {
          escala: 1.5,
          orientacion: 'landscape',
          formato: 'letter',
          unidad: 'in',
          margen: 0
          // `exportarElementoAPdf` detecta las hojas marcadas con
          // `data-docx-page-break` y comienza una página nueva en cada una,
          // respetando encabezado y pie institucional.
        }
      );
    } catch (err) {
      console.error('Error al exportar a PDF:', err);
      alert('No fue posible generar el PDF. Intente nuevamente.');
    } finally {
      setExportandoPDF(false);
    }
  };

  const exportarWord = () => {
    const blob = elementToDocxBlob(pdfRef.current, 'Ficha de Desarrollo Tematico', { orientation: 'landscape' });
    saveAs(blob, `Ficha_Desarrollo_Tematico_${formData.grupo || 'EA'}.docx`);
  };

  const exportarDesdeListado = (id, formato) => {
    setExportacionPendiente(formato);
    handleEditar(id);
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

  // Nombre del espacio académico/grupo seleccionado para la previsualización.
  const espacioSeleccionado = espaciosAcademicos.find((ea) => String(ea.id_espacio_academico) === String(formData.id_espacio_academico));
  const grupoSeleccionado = grupos.find((g) => String(g.id_grupo) === String(formData.id_grupo));
  const nombreEspacio = espacioSeleccionado?.nombre || formData.espacio_academico || '—';
  const jornadas = [...new Set(grupos.map((grupo) => grupo.jornada).filter(Boolean))];
  const fichasFiltradas = fichas.filter((ficha) => {
    if (filtroGrupo && String(ficha.id_grupo) !== filtroGrupo) return false;
    if (filtroJornada) {
      const jornadaFicha = ficha.jornada || grupos.find((grupo) => String(grupo.id_grupo) === String(ficha.id_grupo))?.jornada;
      if (String(jornadaFicha || '') !== filtroJornada) return false;
    }
    return true;
  });
  const fichasBorrador = fichasFiltradas.filter((ficha) => String(ficha.estado || 'Borrador').toLowerCase() === 'borrador');
  const fichasEnviadas = fichasFiltradas.filter((ficha) => String(ficha.estado || 'Borrador').toLowerCase() !== 'borrador');

  if (loading && vista === 'lista') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando Fichas de Desarrollo Temático...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      
      {/* Alerta de éxito */}
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <FaCheckCircle className="text-emerald-600 text-base shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Alerta de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <FaExclamationCircle className="text-red-600 text-base shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={cargarFichas}
            className="bg-[#112F5C] hover:bg-blue-900 text-white font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* VISTA 1: LISTADO DE FICHAS */}
      {vista === 'lista' ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#112F5C]">Fichas de Desarrollo Temático (DOC-CU-FR-003)</h1>
              <p className="text-xs text-gray-500 mt-0.5">Planificación semanal de contenidos analíticos, estrategias didácticas y evaluaciones por grupo.</p>
            </div>
            <button
              onClick={handleNuevo}
              className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2"
            >
              <FaPlus /> Crear Nueva Ficha Temática
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              <label className="text-[11px] font-semibold text-gray-700">
                Grupo
                <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs">
                  <option value="">Todos los grupos</option>
                  {grupos.map((grupo) => <option key={grupo.id_grupo} value={grupo.id_grupo}>{grupo.nombre} · {grupo.codigo_jornada}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-semibold text-gray-700">
                Jornada
                <select value={filtroJornada} onChange={(e) => setFiltroJornada(e.target.value)} className="mt-1 w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs">
                  <option value="">Todas las jornadas</option>
                  {jornadas.map((jornada) => <option key={jornada} value={jornada}>{jornada}</option>)}
                </select>
              </label>
            </div>
            {fichasFiltradas.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-3">
                <FaCalendarAlt className="text-4xl mx-auto text-gray-300" />
                <p className="text-xs font-semibold text-gray-500">{fichas.length ? 'No hay fichas para los filtros seleccionados.' : 'No tiene Fichas de Desarrollo Temático registradas.'}</p>
              </div>
            ) : (
              <div className="space-y-5">
                <section className="rounded-2xl border border-amber-200 overflow-hidden">
                  <h2 className="bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">Borradores ({fichasBorrador.length})</h2>
                  <TablaFichas filas={fichasBorrador} onEditar={handleEditar} onExportar={exportarDesdeListado} onEnviar={handleEnviarFicha} onEliminar={handleEliminarFicha} />
                </section>
                <section className="rounded-2xl border border-sky-200 overflow-hidden">
                  <h2 className="bg-sky-50 px-4 py-3 text-xs font-bold text-sky-900">Enviadas y aprobadas ({fichasEnviadas.length})</h2>
                  <TablaFichas filas={fichasEnviadas} onEditar={handleEditar} onExportar={exportarDesdeListado} onEnviar={handleEnviarFicha} onEliminar={handleEliminarFicha} />
                </section>
              </div>
            )}
          </div>
        </div>
      ) : (

        /* VISTA 2: FORMULARIO PLANIFICADOR SEMANAL Y PREVISUALIZACIÓN */
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
                    <button type="button" onClick={() => indice <= pasoActual && setPasoActual(indice)} disabled={indice > pasoActual} className="min-w-[82px] flex flex-col items-center text-center disabled:cursor-not-allowed" aria-current={indice === pasoActual ? 'step' : undefined}>
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
            
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#112F5C] border-b pb-3">{pasosFormulario[pasoActual].titulo} <span className="font-medium text-gray-400">— {pasosFormulario[pasoActual].descripcion}</span></h2>

              <fieldset disabled={soloLectura} className="contents">
              {pasoActual === 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Espacio Académico:</label>
                  <select
                    value={formData.id_espacio_academico}
                    onChange={(e) => setFormData({ ...formData, id_espacio_academico: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-sky-400 rounded-xl text-xs font-semibold text-[#112F5C] focus:outline-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    {espaciosAcademicos.map((ea) => (
                      <option key={ea.id_espacio_academico} value={ea.id_espacio_academico}>
                        {ea.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Grupo:</label>
                  <select
                    value={formData.id_grupo}
                    onChange={(e) => {
                      const grupo = grupos.find((item) => String(item.id_grupo) === e.target.value);
                      setFormData({ ...formData, id_grupo: e.target.value, id_programa: grupo?.id_programa || '', grupo: grupo?.codigo_jornada || grupo?.nombre || '' });
                    }}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                    required
                  >
                    <option value="">-- Seleccionar grupo asignado --</option>
                    {grupos.map((grupo) => <option key={grupo.id_grupo} value={grupo.id_grupo}>{grupo.nombre} · {grupo.codigo_jornada}</option>)}
                  </select>
                </div>

                </div>}

              {pasoActual === 1 && <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Periodo / Año:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.periodo}
                      onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                      className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                      placeholder="II"
                    />
                    <input
                      type="text"
                      value={formData.anio}
                      onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                      className="w-full px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                      placeholder="2026"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Código Formato:</label>
                  <input
                    type="text"
                    value={formData.codigo_documento}
                    onChange={(e) => setFormData({ ...formData, codigo_documento: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Versión:</label>
                  <input value={formData.version || ''} onChange={(e) => setFormData({ ...formData, version: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Fecha del formato:</label>
                  <input type="date" value={formData.fecha_documento ? formData.fecha_documento.split('T')[0] : ''} onChange={(e) => setFormData({ ...formData, fecha_documento: e.target.value })} className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs" />
                </div>              </div>}

              {pasoActual === 2 && <div className="space-y-4">
                <label className="block text-[11px] font-semibold text-gray-700">Resultado de aprendizaje al que tributa:
                  <textarea required rows={3} value={formData.rap_tributa || ''} onChange={(e) => setFormData({ ...formData, rap_tributa: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs" />
                </label>
                <label className="block text-[11px] font-semibold text-gray-700">Competencia central del espacio académico:
                  <textarea required rows={3} value={formData.competencia_central || ''} onChange={(e) => setFormData({ ...formData, competencia_central: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs" />
                </label>
                <label className="block text-[11px] font-semibold text-gray-700">Objetivo de aprendizaje:
                  <textarea required rows={3} value={formData.objetivo_aprendizaje || ''} onChange={(e) => setFormData({ ...formData, objetivo_aprendizaje: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs" />
                </label>
              </div>}
              {/* PROGRAMACIÓN SEMANAL DERECHA */}
              {pasoActual === 3 && <div className="pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#112F5C]">
                    Planificación Semanal de Contenidos ({formData.semanas.length}{' '}
                    {formData.semanas.length === 1 ? 'semana' : 'semanas'})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAgregarSemana}
                    className="bg-[#112F5C] hover:bg-blue-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <FaPlus /> + Agregar Semana
                  </button>
                </div>

                <div className="space-y-4">
                  {formData.semanas.map((sem, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={sem.semana}
                          onChange={(e) => {
                            const clone = [...formData.semanas];
                            clone[idx].semana = e.target.value;
                            setFormData({ ...formData, semanas: clone });
                          }}
                          className="font-bold text-xs text-[#112F5C] bg-white border px-3 py-1 rounded-lg w-2/3"
                          placeholder="Ej: Semana 1: 3 de agosto al 7 de agosto"
                        />
                        {formData.semanas.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleEliminarSemana(idx)}
                            className="text-red-600 hover:text-red-800 text-xs font-bold"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Contenido Analítico:</label>
                          <textarea
                            rows={3}
                            value={sem.contenido}
                            onChange={(e) => {
                              const clone = [...formData.semanas];
                              clone[idx].contenido = e.target.value;
                              setFormData({ ...formData, semanas: clone });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Estrategias Didácticas:</label>
                          <textarea
                            rows={3}
                            value={sem.estrategias}
                            onChange={(e) => {
                              const clone = [...formData.semanas];
                              clone[idx].estrategias = e.target.value;
                              setFormData({ ...formData, semanas: clone });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-gray-600 mb-1">Evaluación:</label>
                          <textarea
                            rows={3}
                            value={sem.evaluacion}
                            onChange={(e) => {
                              const clone = [...formData.semanas];
                              clone[idx].evaluacion = e.target.value;
                              setFormData({ ...formData, semanas: clone });
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>}

              {pasoActual === 4 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-[11px] font-semibold text-gray-700">Nombre del docente<input value={formData.docente_nombre || ''} onChange={(e) => setFormData({ ...formData, docente_nombre: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs" /></label>
                <label className="block text-[11px] font-semibold text-gray-700">Correo<input type="email" value={formData.docente_correo || ''} onChange={(e) => setFormData({ ...formData, docente_correo: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs" /></label>
                <label className="block text-[11px] font-semibold text-gray-700">Celular<input value={formData.docente_celular || ''} onChange={(e) => setFormData({ ...formData, docente_celular: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs" /></label>
                <label className="block text-[11px] font-semibold text-gray-700">Horario de atención<input value={formData.docente_atencion || ''} onChange={(e) => setFormData({ ...formData, docente_atencion: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs" /></label>
                <label className="block text-[11px] font-semibold text-gray-700 sm:col-span-2">Lugar de atención<input value={formData.docente_lugar || ''} onChange={(e) => setFormData({ ...formData, docente_lugar: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs" /></label>
                <label className="block text-[11px] font-semibold text-gray-700 sm:col-span-2">Observaciones<textarea rows={3} value={formData.observaciones || ''} onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })} className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs" /></label>
              </div>}
              </fieldset>

              <div className="flex justify-between pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setPasoActual((paso) => Math.max(0, paso - 1))} disabled={pasoActual === 0} className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">Anterior</button>
                {pasoActual < pasosFormulario.length - 1 ? (
                  <button key="paso-siguiente" type="button" onClick={(e) => { e.preventDefault(); avanzarPaso(); }} className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow transition">Siguiente</button>
                ) : soloLectura ? (
                  <span className="self-center text-xs font-semibold text-gray-500">Registro enviado: solo lectura</span>
                ) : (
                  <div className="flex flex-wrap items-center justify-end gap-2">
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
                  </div>
                )}
              </div>            </div>
          </form>

          {/* PREVISUALIZACIÓN PLANTILLA DOC-CU-FR-003 */}
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md space-y-4">
            <h3 className="text-xs font-bold text-[#112F5C] border-b pb-2">Previsualización de Ficha de Desarrollo Temático (DOC-CU-FR-003)</h3>

            <div ref={pdfRef}><FichaDocumento formData={formData} espacio={nombreEspacio} grupo={grupoSeleccionado} /></div>
          </div>

        </div>
      )}

    </div>
  );
}
