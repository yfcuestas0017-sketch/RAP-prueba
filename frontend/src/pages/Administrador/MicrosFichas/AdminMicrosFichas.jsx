import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaFilePdf,
  FaFileWord,
  FaTimes,
  FaInfoCircle,
  FaBookOpen,
  FaListAlt,
  FaEye,
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSave,
  FaArrowLeft,
  FaUserTie,
  FaUser,
  FaCheckCircle
} from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { elementToDocxBlob } from '../../../utils/docxExporter.js';
import { exportarElementoAPdf } from '../../../utils/pdfExporter.js';
import { fetchJSON } from '../../../services/api';
import {
  listarMicrocurriculosAdmin,
  obtenerMicrocurriculoAdmin,
  crearMicrocurriculoAdmin,
  actualizarMicrocurriculoAdmin,
  eliminarMicrocurriculoAdmin
} from '../../../services/adminMicrocurriculoService.js';
import {
  listarFichasAdmin,
  obtenerFichaAdmin,
  crearFichaAdmin,
  actualizarFichaAdmin,
  eliminarFichaAdmin
} from '../../../services/fichaService.js';
import MicrocurriculoPreview from './MicrocurriculoPreview.jsx';
import FichaPreview from './FichaPreview.jsx';
import MicrocurriculoForm from './MicrocurriculoForm.jsx';
import FichaForm from './FichaForm.jsx';
import { impedirEnvioPorEnter } from '../../../utils/impedirEnvioPorEnter.js';
import { SEMESTRES } from '../../../utils/microcurriculo.js';
import { API_BASE_URL } from '../../../config';

const LIMPIAR = (valor, defecto = '—') =>
  valor === undefined || valor === null || valor === '' ? defecto : valor;

const nombreDocente = (item) => {
  if (!item) return '—';
  if (item.docente_nombre) return item.docente_nombre;
  if (item.nombre_docente) return item.nombre_docente;
  if (item.docente && typeof item.docente === 'string') return item.docente;
  if (item.docente && item.docente.nombre)
    return `${item.docente.nombre} ${item.docente.apellido || ''}`.trim();
  if (item.nombre || item.apellido) return `${item.nombre || ''} ${item.apellido || ''}`.trim();
  if (item.id_user_docente) return `Docente #${item.id_user_docente}`;
  return '—';
};

const ESTADO_MICRO = {
  Borrador: 'bg-amber-100 text-amber-800',
  Enviada: 'bg-sky-100 text-sky-800',
  Aprobado: 'bg-emerald-100 text-emerald-800'
};

const ESTADO_FICHA = {
  Borrador: 'bg-amber-100 text-amber-800',
  Enviada: 'bg-sky-100 text-sky-800',
  Aprobada: 'bg-emerald-100 text-emerald-800'
};

const MICRO_VACIO = {
  codigo: 'DOC-CU-FR-002',
  version: '1',
  fecha_documento: new Date().toISOString().split('T')[0],
  id_espacio_academico: '',
  semestre: '',
  periodo: '',
  modalidad: 'Presencial',
  creditos: '',
  horas_acompanamiento_directo: '',
  horas_trabajo_independiente: '',
  sintesis: '',
  proposito: '',
  justificacion: '',
  competencia_central: '',
  competencia_central_codigo: '',
  estado: 'Borrador'
};

const FICHA_VACIA = {
  codigo: 'DOC-CU-FR-003',
  version: '3',
  fecha_documento: new Date().toISOString().split('T')[0],
  id_espacio_academico: '',
  codigo_ea: '',
  grupo: '',
  facultad: '',
  programa: '',
  componente: '',
  semestre: '',
  periodo: '',
  anio: String(new Date().getFullYear()),
  id_rap: '',
  competencia_central_codigo: '',
  competencia_central: '',
  objetivo_aprendizaje: '',
  observaciones: '',
  coordinador: '',
  fecha_firma: '',
  fecha_recibido: '',
  docente_correo: '',
  docente_celular: '',
  horario_atencion: '',
  lugar_atencion: '',
  nombre_docente: '',
  semanas: [],
  estado: 'Borrador'
};

export default function AdminMicrosFichas({ tipo } = {}) {
  const moduloSeparado = tipo === 'micros' || tipo === 'fichas';
  const tabInicial = tipo === 'fichas' ? 'fichas' : 'micros';
  const [tabActiva, setTabActiva] = useState(tabInicial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  const [microcurriculos, setMicrocurriculos] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [espaciosAcademicos, setEspaciosAcademicos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [raps, setRaps] = useState([]);
  const [adminUserId, setAdminUserId] = useState(null);

  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroEspacio, setFiltroEspacio] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const [exportando, setExportando] = useState('');
  const [exportData, setExportData] = useState(null);

  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Estados para formularios de crear/editar
  const [editando, setEditando] = useState(null); // { tipo: 'micro'|'ficha', data: {...} }
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');

  const exportRef = useRef(null);
  const pdfRef = useRef(null);

  // Cargar ID del administrador actual
  const cargarAdminUserId = useCallback(async () => {
    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/admin/Perfil`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const resultado = await respuesta.json();
      if (resultado.perfil?.id_user) {
        setAdminUserId(String(resultado.perfil.id_user));
      }
    } catch (err) {
      console.warn('No se pudo obtener ID de admin:', err);
    }
  }, []);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [respuestaFiltros, respuestaRaps] = await Promise.all([
        fetchJSON('/api/admin/reportes/filtros'),
        !moduloSeparado || tipo === 'fichas' ? fetchJSON('/api/adminRap/RAP') : Promise.resolve(null)
      ]);

      const data = respuestaFiltros?.data || {};
      setEspaciosAcademicos(Array.isArray(data.espacios) ? data.espacios : []);
      setDocentes(Array.isArray(data.docentes) ? data.docentes : []);
      setRaps(Array.isArray(respuestaRaps?.rap) ? respuestaRaps.rap : []);
    } catch (catalogoError) {
      console.error('Error cargando catálogos:', catalogoError);
    }
  }, [moduloSeparado, tipo]);

  const cargarMicrocurriculos = useCallback(async () => {
    try {
      const data = await listarMicrocurriculosAdmin();
      if (!data?.success) throw new Error(data?.mensaje || 'Error al consultar los microcurrículos');
      setMicrocurriculos(Array.isArray(data.microcurriculos) ? data.microcurriculos : []);
    } catch (cargaError) {
      console.error('Error cargando microcurrículos:', cargaError);
      setError(cargaError.message);
    }
  }, []);

  const cargarFichas = useCallback(async () => {
    try {
      const data = await listarFichasAdmin();
      if (!data?.success) throw new Error(data?.mensaje || 'Error al consultar las fichas');
      setFichas(Array.isArray(data.fichas) ? data.fichas : []);
    } catch (cargaError) {
      console.error('Error cargando fichas:', cargaError);
      setError(cargaError.message);
    }
  }, []);

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await cargarAdminUserId();
      if (!moduloSeparado) {
        await Promise.all([cargarMicrocurriculos(), cargarFichas()]);
      } else if (tipo === 'fichas') {
        await cargarFichas();
      } else {
        await cargarMicrocurriculos();
      }
    } finally {
      setLoading(false);
    }
  }, [moduloSeparado, tipo, cargarMicrocurriculos, cargarFichas, cargarAdminUserId]);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const nombreEspacioAcademico = useCallback(
    (id) =>
      espaciosAcademicos.find((ea) => String(ea.id_espacio_academico) === String(id))?.nombre || '',
    [espaciosAcademicos]
  );

  // ---------- Filtros ----------
  const filtrar = (lista) => {
    const texto = filtroBusqueda.trim().toLowerCase();
    return lista.filter((item) => {
      if (filtroDocente && String(item.id_user_docente) !== String(filtroDocente)) return false;
      if (filtroEspacio && String(item.id_espacio_academico) !== String(filtroEspacio)) return false;
      if (filtroPeriodo && String(item.periodo || '').trim() !== filtroPeriodo) return false;
      if (texto) {
        const haystack = [
          nombreDocente(item),
          item.espacio_academico,
          item.periodo,
          item.codigo,
          item.grupo,
          item.rap_codigo
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(texto)) return false;
      }
      return true;
    });
  };

  const periodosDisponibles = useMemo(() => {
    const set = new Set();
    microcurriculos.forEach((item) => {
      const p = String(item.periodo || '').trim();
      if (p) set.add(p);
    });
    fichas.forEach((item) => {
      const p = String(item.periodo || '').trim();
      if (p) set.add(p);
    });
    return Array.from(set).sort();
  }, [microcurriculos, fichas]);

  const microsFiltrados = useMemo(() => filtrar(microcurriculos), [
    microcurriculos,
    filtroDocente,
    filtroEspacio,
    filtroPeriodo,
    filtroBusqueda
  ]);

  const fichasFiltradas = useMemo(() => filtrar(fichas), [
    fichas,
    filtroDocente,
    filtroEspacio,
    filtroPeriodo,
    filtroBusqueda
  ]);

  const listaActual = tabActiva === 'micros' ? microsFiltrados : fichasFiltradas;

  // Determinar si el registro pertenece al admin actual
  const esPropio = useCallback((item) => {
    if (!adminUserId) return false;
    return String(item.id_user_docente) === String(adminUserId);
  }, [adminUserId]);

  // ---------- Detalle ----------
  const verDetalle = async (item) => {
    const esMicro = tabActiva === 'micros';
    try {
      setCargandoDetalle(true);
      setDetalle({ ...item, _cargando: true });
      const data = esMicro
        ? await obtenerMicrocurriculoAdmin(item.id_microcurriculo)
        : await obtenerFichaAdmin(item.id_ficha);
      if (!data?.success) throw new Error(data?.mensaje || 'No se pudo cargar el detalle');
      setDetalle({ ...(esMicro ? data.microcurriculo : data.ficha) });
    } catch (err) {
      setDetalle({ ...item, _error: err.message });
    } finally {
      setCargandoDetalle(false);
    }
  };

  // ---------- Exportación ----------
  const exportarItem = async (item, formato) => {
    if (exportando) return;
    const esMicro = tabActiva === 'micros';
    const idItem = esMicro ? item.id_microcurriculo : item.id_ficha;

    setExportando(`${formato}-${idItem}`);
    setError('');

    try {
      const data = esMicro
        ? await obtenerMicrocurriculoAdmin(idItem)
        : await obtenerFichaAdmin(idItem);
      if (!data?.success) throw new Error(data?.mensaje || 'No se pudo cargar el documento');

      const registro = esMicro
        ? data.microcurriculo
        : {
            ...FICHA_VACIA,
            ...data.ficha,
            semanas: Array.isArray(data.ficha?.semanas) ? data.ficha.semanas : []
          };

      const nombreBase = esMicro
        ? `Microcurriculo_${LIMPIAR(registro.codigo, 'Syllabus')}`
        : `Ficha_${LIMPIAR(registro.codigo, 'DOC-CU-FR-003')}`;

      setExportData({ tipo: esMicro ? 'micros' : 'fichas', data: registro });

      await new Promise((resolve) => {
        let frame = 0;
        const paso = () => {
          frame += 1;
          if (frame >= 2) resolve();
          else requestAnimationFrame(paso);
        };
        requestAnimationFrame(paso);
      });
      await new Promise((resolve) => setTimeout(resolve, 80));

      if (!exportRef.current) throw new Error('No hay contenido para exportar');

      if (formato === 'pdf') {
        await exportarElementoAPdf(exportRef.current, `${nombreBase}.pdf`, {
          formato: 'a4',
          unidad: 'mm',
          margen: 10
        });
      } else {
        const blob = elementToDocxBlob(
          exportRef.current,
          esMicro ? 'Microcurrículo (Syllabus)' : 'Ficha de Desarrollo Temático'
        );
        saveAs(blob, `${nombreBase}.docx`);
      }
    } catch (err) {
      console.error(`Error al exportar a ${formato === 'pdf' ? 'PDF' : 'Word'}:`, err);
      window.alert(
        formato === 'pdf'
          ? 'No fue posible generar el PDF. Intente nuevamente.'
          : 'No fue posible exportar a Word.'
      );
    } finally {
      setExportando('');
      setExportData(null);
    }
  };

  const exportandoPDFde = (id) => exportando === `pdf-${id}`;
  const exportandoWordde = (id) => exportando === `word-${id}`;

  // Vistas: 'lista' | 'formulario' | 'ver-docentes'
  const [vista, setVista] = useState('lista');
  const [vistaDocentes, setVistaDocentes] = useState(null); // tipo: 'micros' | 'fichas'

  // ---------- Formulario: Crear/Editar ----------
  const iniciarNuevo = () => {
    const esMicro = tabActiva === 'micros';
    setEditando({
      tipo: esMicro ? 'micro' : 'ficha',
      data: esMicro ? { ...MICRO_VACIO } : { ...FICHA_VACIA },
      modoEdicion: false
    });
    setErrorFormulario('');
    setMensajeExito('');
    setVista('formulario');
  };

  const iniciarEdicion = (item) => {
    const esMicro = tabActiva === 'micros';
    // Cargar detalle completo antes de editar
    const cargarParaEditar = async () => {
      try {
        setErrorFormulario('');
        const data = esMicro
          ? await obtenerMicrocurriculoAdmin(item.id_microcurriculo)
          : await obtenerFichaAdmin(item.id_ficha);
        if (!data?.success) throw new Error(data?.mensaje || 'No se pudo cargar para editar');
        const registroCompleto = esMicro ? data.microcurriculo : data.ficha;
        // Asegurar que semanas sea array para fichas
        if (!esMicro) {
          registroCompleto.semanas = Array.isArray(registroCompleto.semanas) ? registroCompleto.semanas : [];
        }
        setEditando({
          tipo: esMicro ? 'micro' : 'ficha',
          data: registroCompleto,
          modoEdicion: true
        });
        setVista('formulario');
      } catch (err) {
        setErrorFormulario(err.message);
      }
    };
    cargarParaEditar();
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setErrorFormulario('');
    setVista('lista');
  };

  const handleGuardar = async (e, formData) => {
    e.preventDefault();
    setErrorFormulario('');
    setGuardando(true);

    try {
      const esMicro = editando.tipo === 'micro';
      const { modoEdicion, data } = editando;
      // Preparar datos para enviar
      const datosEnvio = { ...formData };
      if (esMicro) {
        // Para micro, asegurar campos requeridos
        datosEnvio.estado = datosEnvio.estado || 'Borrador';
      } else {
        // Para ficha, asegurar semanas array
        datosEnvio.semanas = Array.isArray(datosEnvio.semanas) ? datosEnvio.semanas : [];
        datosEnvio.estado = datosEnvio.estado || 'Borrador';
      }

      let resultado;
      if (modoEdicion) {
        const id = esMicro ? data.id_microcurriculo : data.id_ficha;
        resultado = esMicro
          ? await actualizarMicrocurriculoAdmin(id, datosEnvio)
          : await actualizarFichaAdmin(id, datosEnvio);
      } else {
        resultado = esMicro
          ? await crearMicrocurriculoAdmin(datosEnvio)
          : await crearFichaAdmin(datosEnvio);
      }

      if (!resultado?.success && !resultado?.ok) {
        throw new Error(resultado?.mensaje || resultado?.message || 'Error al guardar');
      }

      setMensajeExito(modoEdicion ? 'Actualizado correctamente' : 'Creado correctamente');
      cancelarEdicion();
      await cargarTodo(); // Recargar lista
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      console.error('Error guardando:', err);
      setErrorFormulario(err.message || 'No fue posible guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (item) => {
    const esMicro = tabActiva === 'micros';
    const id = esMicro ? item.id_microcurriculo : item.id_ficha;
    const nombre = esMicro ? 'microcurrículo' : 'ficha';

    if (!window.confirm(`¿Eliminar este ${nombre}? Esta acción no se puede deshacer.`)) return;

    setError('');
    try {
      const resultado = esMicro
        ? await eliminarMicrocurriculoAdmin(id)
        : await eliminarFichaAdmin(id);

      if (!resultado?.success && !resultado?.ok) {
        throw new Error(resultado?.mensaje || resultado?.message || 'Error al eliminar');
      }

      setMensajeExito('Eliminado correctamente');
      await cargarTodo();
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      console.error('Error eliminando:', err);
      setError(err.message || 'No fue posible eliminar');
    }
  };

  if (loading && microcurriculos.length === 0 && fichas.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">
            {tabActiva === 'micros' ? 'Cargando microcurrículos...' : 'Cargando fichas de desarrollo temático...'}
          </p>
        </div>
      </div>
    );
  }

  const tituloModulo = tabActiva === 'micros' ? 'Microcurrículo' : 'Fichas de Desarrollo Temático';
  const iconoModulo = tabActiva === 'micros' ? FaBookOpen : FaListAlt;
  const btnNuevoTexto = tabActiva === 'micros' ? 'Nuevo Microcurrículo' : 'Nueva Ficha';
  const btnNuevoIcono = tabActiva === 'micros' ? FaBookOpen : FaListAlt;

  return (
    <div className="w-full animate-fade-in space-y-6">
      {/* VISTA 1: LISTADO */}
      {vista === 'lista' ? (
        <div className="space-y-6">
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#112F5C]">
                <iconoModulo className="inline mr-2" /> {tituloModulo}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {tabActiva === 'micros'
                  ? 'Gestione los microcurrículos (syllabus) de los espacios académicos.'
                  : 'Gestione las fichas de desarrollo temático de los grupos.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-800">
                <FaEdit /> Gestión completa
              </span>
              <button
                type="button"
                onClick={iniciarNuevo}
                className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition flex items-center gap-2"
              >
                <btnNuevoIcono /> {btnNuevoTexto}
              </button>
            </div>
          </div>

          {/* Mensajes */}
          {mensajeExito && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <FaCheckCircle className="text-emerald-600 text-base shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <FaExclamationCircle className="text-red-600 text-base shrink-0" />
              <span className="flex-1">{error}</span>
              <button type="button" onClick={() => setError('')} aria-label="Cerrar aviso">
                <FaTimes className="text-red-600" />
              </button>
            </div>
          )}

          {/* Pestañas */}
          {!moduloSeparado && (
            <div className="flex border-b border-gray-200 gap-6 text-xs font-bold" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={tabActiva === 'micros'}
                onClick={() => setTabActiva('micros')}
                className={`pb-3 flex items-center gap-2 transition-all ${
                  tabActiva === 'micros'
                    ? 'border-b-2 border-[#B3282D] text-[#B3282D]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FaBookOpen /> Microcurrículos (Syllabus)
                <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">
                  {microcurriculos.length}
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={tabActiva === 'fichas'}
                onClick={() => setTabActiva('fichas')}
                className={`pb-3 flex items-center gap-2 transition-all ${
                  tabActiva === 'fichas'
                    ? 'border-b-2 border-[#B3282D] text-[#B3282D]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FaListAlt /> Fichas de Desarrollo Temático
                <span className="bg-gray-100 px-2 py-0.5 rounded-full text-[10px]">{fichas.length}</span>
              </button>
            </div>
          )}

          {/* Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Buscar:</label>
              <input
                type="text"
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                placeholder="Docente, espacio, periodo, código..."
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Docente:</label>
              <select
                value={filtroDocente}
                onChange={(e) => setFiltroDocente(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="">Todos</option>
                {docentes.map((d) => (
                  <option key={d.id_user} value={d.id_user}>
                    {d.nombre} {d.apellido}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Espacio académico:
              </label>
              <select
                value={filtroEspacio}
                onChange={(e) => setFiltroEspacio(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="">Todos</option>
                {espaciosAcademicos.map((ea) => (
                  <option key={ea.id_espacio_academico} value={ea.id_espacio_academico}>
                    {ea.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Periodo académico:
              </label>
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
              >
                <option value="">Todos</option>
                {periodosDisponibles.map((periodo) => (
                  <option key={periodo} value={periodo}>
                    {periodo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {listaActual.length === 0 ? (
              <p className="text-xs text-gray-500 p-8 text-center">
                No se encontraron registros con los filtros seleccionados.
                {adminUserId ? ' Use "Nuevo" para crear el primero.' : ''}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#112F5C] text-white font-semibold">
                    <tr>
                      <th className="px-4 py-3">DOCENTE</th>
                      <th className="px-4 py-3">ESPACIO ACADÉMICO</th>
                      <th className="px-4 py-3">SEMESTRE</th>
                      <th className="px-4 py-3">PERIODO</th>
                      <th className="px-4 py-3">{tabActiva === 'micros' ? 'CÓDIGO / VERSIÓN' : 'GRUPO'}</th>
                      <th className="px-4 py-3 text-center">ESTADO</th>
                      <th className="px-4 py-3 text-center">PROPIETARIO</th>
                      <th className="px-4 py-3 text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {listaActual.map((item) => {
                      const idItem = tabActiva === 'micros' ? item.id_microcurriculo : item.id_ficha;
                      const estado = String(item.estado || 'Borrador');
                      const estilo =
                        (tabActiva === 'micros' ? ESTADO_MICRO : ESTADO_FICHA)[estado] ||
                        'bg-gray-100 text-gray-600';
                      const propio = esPropio(item);

                      return (
                        <tr key={idItem} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5 font-bold text-gray-800">{nombreDocente(item)}</td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {LIMPIAR(item.espacio_academico || nombreEspacioAcademico(item.id_espacio_academico))}
                          </td>
                          <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(item.semestre)}</td>
                          <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(item.periodo)}</td>
                          <td className="px-4 py-3.5 text-gray-600">
                            {tabActiva === 'micros'
                              ? `${LIMPIAR(item.codigo)} (v${LIMPIAR(item.version)})`
                              : LIMPIAR(item.grupo)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${estilo}`}>
                              {estado}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {propio ? (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <FaUserTie className="text-[9px]" /> Mío
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                <FaUser className="text-[9px]" /> Docente
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => verDetalle(item)}
                                className="border border-gray-200 hover:border-[#112F5C] text-[#112F5C] text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                              >
                                <FaInfoCircle /> Ver
                              </button>
                              {propio && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => iniciarEdicion(item)}
                                    className="border border-[#112F5C]/40 hover:bg-[#112F5C] hover:border-[#112F5C] hover:text-white text-[#112F5C] text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                                  >
                                    <FaEdit /> Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleEliminar(item)}
                                    className="border border-[#B3282D]/40 hover:bg-[#B3282D] hover:border-[#B3282D] hover:text-white text-[#B3282D] text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                                  >
                                    <FaTrashAlt /> Eliminar
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                onClick={() => exportarItem(item, 'pdf')}
                                disabled={Boolean(exportando)}
                                title="Exportar a PDF"
                                className="border border-[#B3282D]/40 hover:bg-[#B3282D] hover:border-[#B3282D] hover:text-white text-[#B3282D] text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
                              >
                                <FaFilePdf />
                                {exportandoPDFde(idItem) ? 'Generando...' : 'PDF'}
                              </button>
                              <button
                                type="button"
                                onClick={() => exportarItem(item, 'word')}
                                disabled={Boolean(exportando)}
                                title="Exportar a Word"
                                className="border border-[#0074B7]/40 hover:bg-[#0074B7] hover:border-[#0074B7] hover:text-white text-[#0074B7] text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-wait"
                              >
                                <FaFileWord />
                                {exportandoWordde(idItem) ? 'Generando...' : 'Word'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VISTA 2: FORMULARIO (Pantalla completa como en Docente) */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-left">
              <h2 className="text-lg font-bold text-[#112F5C]">
                {editando?.modoEdicion ? 'Editar' : 'Nuevo'} {tabActiva === 'micros' ? 'Microcurrículo' : 'Ficha'}
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Complete la información requerida para el documento institucional.
              </p>
            </div>
          </div>

          {errorFormulario && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <FaExclamationCircle className="text-red-600 text-base shrink-0" />
              <span>{errorFormulario}</span>
            </div>
          )}

          {editando?.tipo === 'micro' ? (
            <MicrocurriculoForm
              formData={editando.data}
              setFormData={(fn) => setEditando((prev) => ({ ...prev, data: typeof fn === 'function' ? fn(prev.data) : fn }))}
              espaciosAcademicos={espaciosAcademicos}
              nombreEspacioAcademico={nombreEspacioAcademico}
              guardando={guardando}
              modoEdicion={editando.modoEdicion}
              pdfRef={pdfRef}
              onSubmit={(e) => handleGuardar(e, editando.data)}
              onCancelar={cancelarEdicion}
            />
          ) : (
            <FichaForm
              formData={editando.data}
              setFormData={(fn) => setEditando((prev) => ({ ...prev, data: typeof fn === 'function' ? fn(prev.data) : fn }))}
              espaciosAcademicos={espaciosAcademicos}
              raps={raps}
              guardando={guardando}
              modoEdicion={editando.modoEdicion}
              pdfRef={pdfRef}
              onSubmit={(e) => handleGuardar(e, editando.data)}
              onCancelar={cancelarEdicion}
            />
          )}
        </div>
      )}

      {/*
        Documento fuera de pantalla que se monta solo durante la exportación
        desde la tabla. Se mantiene con tamaño real (no oculto con display:none)
        porque html2canvas necesita medir y capturar el contenido.
      */}
      {exportData && (
        <div
          aria-hidden="true"
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: '-20000px',
            top: 0,
            width: '718px'
          }}
        >
          {exportData.tipo === 'micros' ? (
            <MicrocurriculoPreview
              innerRef={exportRef}
              exportMode
              formData={exportData.data}
              nombreEspacioAcademico={nombreEspacioAcademico}
            />
          ) : (
            <FichaPreview
              innerRef={exportRef}
              exportMode
              formData={exportData.data}
              espaciosAcademicos={espaciosAcademicos}
              raps={raps}
            />
          )}
        </div>
      )}
    </div>
  );
}