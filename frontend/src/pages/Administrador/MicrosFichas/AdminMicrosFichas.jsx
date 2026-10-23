import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FaPlus,
  FaEdit,
  FaTrashAlt,
  FaSyncAlt,
  FaExclamationCircle,
  FaCheckCircle,
  FaFilePdf,
  FaFileWord,
  FaTimes,
  FaInfoCircle,
  FaBookOpen,
  FaListAlt
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
import MicrocurriculoForm from './MicrocurriculoForm.jsx';
import FichaForm from './FichaForm.jsx';
import MicrocurriculoPreview from './MicrocurriculoPreview.jsx';
import FichaPreview from './FichaPreview.jsx';

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
  id_espacio_academico: '',
  codigo: 'DOC-CU-FR-002',
  version: '1',
  fecha_documento: new Date().toISOString().split('T')[0],
  periodo: '',
  semestre: '',
  modalidad: 'Presencial',
  nivel: 'Profesional',
  area: 'Disciplinar',
  creditos: '',
  horas_acompanamiento_directo: '',
  horas_trabajo_independiente: '',
  prerrequisito: 'Ninguno',
  sintesis: '',
  proposito: '',
  justificacion: '',
  competencia_central: ''
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
  semanas: []
};

export default function AdminMicrosFichas({ tipo } = {}) {
  const moduloSeparado = tipo === 'micros' || tipo === 'fichas';
  const tabInicial = tipo === 'fichas' ? 'fichas' : 'micros';
  const [tabActiva, setTabActiva] = useState(tabInicial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [microcurriculos, setMicrocurriculos] = useState([]);
  const [fichas, setFichas] = useState([]);
  const [espaciosAcademicos, setEspaciosAcademicos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [raps, setRaps] = useState([]);

  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroEspacio, setFiltroEspacio] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');

  const [vista, setVista] = useState('lista');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idSeleccionado, setIdSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  // Clave del registro que se está exportando: `pdf-<id>` o `word-<id>`.
  const [exportando, setExportando] = useState('');
  // Registro completo que se monta fuera de pantalla para exportarlo desde la
  // tabla, sin necesidad de abrir el formulario de edición.
  const [exportData, setExportData] = useState(null);

  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const [microData, setMicroData] = useState(MICRO_VACIO);
  const [fichaData, setFichaData] = useState(FICHA_VACIA);

  const pdfRef = useRef(null);
  const exportRef = useRef(null);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [respuestaFiltros, respuestaRaps] = await Promise.all([
        fetchJSON('/api/admin/reportes/filtros'),
        !moduloSeparado || tipo === 'fichas' ? fetchJSON('/api/admin/RAP') : Promise.resolve(null)
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
  }, [moduloSeparado, tipo, cargarMicrocurriculos, cargarFichas]);

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

  const microsFiltrados = useMemo(() => filtrar(microcurriculos), [
    microcurriculos,
    filtroDocente,
    filtroEspacio,
    filtroBusqueda
  ]);

  const fichasFiltradas = useMemo(() => filtrar(fichas), [
    fichas,
    filtroDocente,
    filtroEspacio,
    filtroBusqueda
  ]);

  const listaActual = tabActiva === 'micros' ? microsFiltrados : fichasFiltradas;

  // ---------- Navegación de vistas ----------
  const irALista = () => {
    setVista('lista');
    setIdSeleccionado(null);
    setModoEdicion(false);
  };

  const nuevoMicro = () => {
    setMicroData({ ...MICRO_VACIO });
    setModoEdicion(false);
    setIdSeleccionado(null);
    setVista('formulario');
  };

  const nuevaFicha = () => {
    setFichaData({
      ...FICHA_VACIA,
      semanas: Array.from({ length: 17 }, (_, i) => ({
        semana: `Semana ${i + 1}`,
        contenido_analitico: '',
        estrategias_didacticas: '',
        evaluacion: ''
      }))
    });
    setModoEdicion(false);
    setIdSeleccionado(null);
    setVista('formulario');
  };

  const editarMicro = async (id) => {
    try {
      setLoading(true);
      const data = await obtenerMicrocurriculoAdmin(id);
      if (!data?.success) throw new Error(data?.mensaje || 'Error al obtener el detalle');
      setMicroData(data.microcurriculo);
      setModoEdicion(true);
      setIdSeleccionado(id);
      setVista('formulario');
    } catch (err) {
      setExito('');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const editarFicha = async (id) => {
    try {
      setLoading(true);
      const data = await obtenerFichaAdmin(id);
      if (!data?.success) throw new Error(data?.mensaje || 'Error al obtener el detalle');
      const ficha = { ...FICHA_VACIA, ...data.ficha };
      ficha.semanas = Array.isArray(data.ficha.semanas) ? data.ficha.semanas : [];
      setFichaData(ficha);
      setModoEdicion(true);
      setIdSeleccionado(id);
      setVista('formulario');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Guardar ----------
  const guardarMicro = async (e) => {
    e.preventDefault();
    if (!microData.id_espacio_academico || !microData.periodo) {
      window.alert('El espacio académico y el periodo son obligatorios.');
      return;
    }
    try {
      setGuardando(true);
      setError('');
      const data = modoEdicion
        ? await actualizarMicrocurriculoAdmin(idSeleccionado, microData)
        : await crearMicrocurriculoAdmin(microData);
      if (!data?.success) throw new Error(data?.mensaje || 'Error al guardar');
      setExito(
        modoEdicion ? 'Microcurrículo actualizado correctamente' : 'Microcurrículo registrado con éxito'
      );
      setTimeout(() => setExito(''), 3000);
      await cargarMicrocurriculos();
      irALista();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const guardarFicha = async (e) => {
    e.preventDefault();
    if (!fichaData.id_espacio_academico) {
      window.alert('Debes seleccionar un espacio académico.');
      return;
    }
    try {
      setGuardando(true);
      setError('');
      const data = modoEdicion
        ? await actualizarFichaAdmin(idSeleccionado, fichaData)
        : await crearFichaAdmin(fichaData);
      if (!data?.success) throw new Error(data?.mensaje || 'Error al guardar');
      setExito(modoEdicion ? 'Ficha actualizada correctamente' : 'Ficha registrada con éxito');
      setTimeout(() => setExito(''), 3000);
      await cargarFichas();
      irALista();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // ---------- Eliminar ----------
  const eliminarItem = async (item) => {
    const esMicro = tabActiva === 'micros';
    const etiqueta = esMicro ? 'este microcurrículo' : 'esta ficha';
    if (!window.confirm(`¿Está seguro de eliminar ${etiqueta}?`)) return;
    try {
      setError('');
      const data = esMicro
        ? await eliminarMicrocurriculoAdmin(item.id_microcurriculo)
        : await eliminarFichaAdmin(item.id_ficha);
      if (!data?.success) throw new Error(data?.mensaje || 'No se pudo eliminar');
      setExito(esMicro ? 'Microcurrículo eliminado' : 'Ficha eliminada');
      setTimeout(() => setExito(''), 3000);
      if (esMicro) await cargarMicrocurriculos();
      else await cargarFichas();
    } catch (err) {
      setError(err.message);
    }
  };

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
  // El documento se arma fuera de pantalla a partir del registro completo
  // consultado a la API, de modo que el PDF y el Word se generan desde la
  // tabla sin entrar a editar.
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

      // Espera a que React monte el documento oculto y el navegador lo maquete
      // antes de capturarlo.
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

  if (loading && vista === 'lista' && microcurriculos.length === 0 && fichas.length === 0) {
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

  if (vista === 'formulario') {
    return (
      <div className="w-full animate-fade-in space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
            <FaExclamationCircle className="text-red-600 text-base shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {tabActiva === 'micros' ? (
          <MicrocurriculoForm
            formData={microData}
            setFormData={setMicroData}
            espaciosAcademicos={espaciosAcademicos}
            nombreEspacioAcademico={nombreEspacioAcademico}
            guardando={guardando}
            modoEdicion={modoEdicion}
            pdfRef={pdfRef}
            onSubmit={guardarMicro}
            onCancelar={irALista}
          />
        ) : (
          <FichaForm
            formData={fichaData}
            setFormData={setFichaData}
            espaciosAcademicos={espaciosAcademicos}
            raps={raps}
            guardando={guardando}
            modoEdicion={modoEdicion}
            pdfRef={pdfRef}
            onSubmit={guardarFicha}
            onCancelar={irALista}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#112F5C]">
            {tabActiva === 'micros' ? 'Microcurrículo' : 'Fichas de Desarrollo Temático'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Consulte y gestione los documentos curriculares diligenciados por los docentes.
          </p>
        </div>
        <button
          type="button"
          onClick={tabActiva === 'micros' ? nuevoMicro : nuevaFicha}
          className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition flex items-center justify-center gap-2"
        >
          <FaPlus />
          {tabActiva === 'micros' ? 'Crear Microcurrículo' : 'Crear Ficha'}
        </button>
      </div>

      {/* Avisos */}
      {exito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <FaCheckCircle className="text-emerald-600 text-base shrink-0" />
          <span>{exito}</span>
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
      {!moduloSeparado && <div className="flex border-b border-gray-200 gap-6 text-xs font-bold" role="tablist">
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
      </div>}

      {/* Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {listaActual.length === 0 ? (
          <p className="text-xs text-gray-500 p-8 text-center">
            No se encontraron registros con los filtros seleccionados.
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
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => verDetalle(item)}
                            className="border border-gray-200 hover:border-[#112F5C] text-[#112F5C] text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                          >
                            <FaInfoCircle /> Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => (tabActiva === 'micros' ? editarMicro(idItem) : editarFicha(idItem))}
                            className="bg-[#112F5C] hover:bg-blue-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                          >
                            <FaEdit /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarItem(item)}
                            className="bg-[#B3282D] hover:bg-red-800 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>

                        {/* Segunda fila de acciones: exportación directa */}
                        <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap items-center justify-center gap-1.5">
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

      {/* Modal de detalle */}
      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <h3 className="text-sm font-bold text-[#112F5C]">
                {tabActiva === 'micros'
                  ? 'Detalle del Microcurrículo'
                  : 'Detalle de la Ficha de Desarrollo Temático'}
              </h3>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                aria-label="Cerrar detalle"
                className="text-gray-400 hover:text-gray-700"
              >
                <FaTimes />
              </button>
            </div>

            {detalle._error ? (
              <p className="px-6 py-8 text-center text-xs text-red-600">{detalle._error}</p>
            ) : (
              <div className="px-6 py-4 text-xs text-gray-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <p>
                    <span className="font-semibold text-gray-500">Docente:</span>{' '}
                    {nombreDocente(detalle)}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-500">Espacio académico:</span>{' '}
                    {LIMPIAR(detalle.espacio_academico)}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-500">Semestre:</span>{' '}
                    {LIMPIAR(detalle.semestre)}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-500">Periodo:</span>{' '}
                    {LIMPIAR(detalle.periodo)}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-500">Estado:</span>{' '}
                    {LIMPIAR(detalle.estado)}
                  </p>

                  {tabActiva === 'micros' ? (
                    <>
                      <p>
                        <span className="font-semibold text-gray-500">Código / versión:</span>{' '}
                        {LIMPIAR(detalle.codigo)} (v{LIMPIAR(detalle.version)})
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Modalidad:</span>{' '}
                        {LIMPIAR(detalle.modalidad)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Créditos:</span>{' '}
                        {LIMPIAR(detalle.creditos)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Horas directas / indep.:</span>{' '}
                        {LIMPIAR(detalle.horas_acompanamiento_directo)} /{' '}
                        {LIMPIAR(detalle.horas_trabajo_independiente)}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <span className="font-semibold text-gray-500">Grupo:</span>{' '}
                        {LIMPIAR(detalle.grupo)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Programa:</span>{' '}
                        {LIMPIAR(detalle.programa)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Semestre:</span>{' '}
                        {LIMPIAR(detalle.semestre)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Coordinador:</span>{' '}
                        {LIMPIAR(detalle.coordinador)}
                      </p>
                    </>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <span className="font-semibold text-gray-500">Contenido:</span>
                  {tabActiva === 'micros' ? (
                    <div className="space-y-2 mt-2">
                      <p>
                        <span className="font-semibold text-gray-500">Síntesis:</span>{' '}
                        {LIMPIAR(detalle.sintesis)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Propósito:</span>{' '}
                        {LIMPIAR(detalle.proposito)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Justificación:</span>{' '}
                        {LIMPIAR(detalle.justificacion)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Competencia central:</span>{' '}
                        {LIMPIAR(detalle.competencia_central)}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 mt-2">
                      <p>
                        <span className="font-semibold text-gray-500">Objetivo de aprendizaje:</span>{' '}
                        {LIMPIAR(detalle.objetivo_aprendizaje)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Competencia:</span>{' '}
                        {LIMPIAR(detalle.competencia_central)}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-500">Observaciones:</span>{' '}
                        {LIMPIAR(detalle.observaciones)}
                      </p>

                      <div className="overflow-x-auto border border-gray-100 rounded-xl">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-gray-50 text-gray-600 font-semibold">
                            <tr>
                              <th className="px-3 py-2">SEMANA</th>
                              <th className="px-3 py-2">CONTENIDO</th>
                              <th className="px-3 py-2">ESTRATEGIAS</th>
                              <th className="px-3 py-2">EVALUACIÓN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {(detalle.semanas || []).map((s, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 font-semibold">{LIMPIAR(s.semana)}</td>
                                <td className="px-3 py-2">{LIMPIAR(s.contenido_analitico)}</td>
                                <td className="px-3 py-2">{LIMPIAR(s.estrategias_didacticas)}</td>
                                <td className="px-3 py-2">{LIMPIAR(s.evaluacion)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {cargandoDetalle && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-2 text-[11px] text-gray-600 flex items-center gap-2 z-40">
          <FaSyncAlt className="animate-spin" /> Cargando detalle...
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
