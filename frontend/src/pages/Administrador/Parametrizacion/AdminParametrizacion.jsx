import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaFileExcel,
  FaFilePdf,
  FaQuestionCircle,
  FaArrowRight,
  FaChartLine,
  FaClipboardList,
  FaTimes,
  FaCheckCircle,
  FaInfoCircle
} from 'react-icons/fa';
import { fetchJSON } from '../../../services/api';
import './AdminParametrizacion.css';

const ESTADOS_EVALUACION = ['BORRADOR', 'ACTIVA', 'CERRADA', 'ELIMINADA'];

const ETIQUETA_ESTADO = {
  BORRADOR: 'Borrador',
  ACTIVA: 'En curso',
  CERRADA: 'Cerrada',
  ELIMINADA: 'Eliminada'
};

const ESTILO_ESTADO = {
  BORRADOR: 'bg-gray-100 text-gray-600 border-gray-200',
  ACTIVA: 'bg-blue-100 text-blue-800 border-blue-200',
  CERRADA: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ELIMINADA: 'bg-red-100 text-red-800 border-red-200'
};

const LIMPIAR = (valor, defecto = '—') =>
  valor === undefined || valor === null || valor === '' ? defecto : valor;

const A_NUMERO = (valor) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

const A_PORCENTAJE = (valor) => {
  const numero = A_NUMERO(valor);
  return numero === null ? null : Math.max(0, Math.min(100, Math.round(numero)));
};

export default function AdminParametrizacion() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabActiva = searchParams.get('tab') === 'resultados' ? 'resultados' : 'momentos';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nota, setNota] = useState('');

  const [programas, setProgramas] = useState([]);
  const [catalogoMomentos, setCatalogoMomentos] = useState([]);
  const [catalogoEvaluaciones, setCatalogoEvaluaciones] = useState([]);

  const [momentos, setMomentos] = useState([]);
  const [resultados, setResultados] = useState([]);

  const [filtrosMomentos, setFiltrosMomentos] = useState(() => ({
    periodo: searchParams.get('periodo') || '',
    estado: searchParams.get('estado') || '',
    id_programa: searchParams.get('programa') || ''
  }));

  const [filtrosResultados, setFiltrosResultados] = useState(() => ({
    periodo: searchParams.get('periodo') || '',
    id_momento_evaluacion: searchParams.get('momentoId') || '',
    id_evaluacion: searchParams.get('evaluacionId') || ''
  }));

  const [tipoConsulta, setTipoConsulta] = useState('grupo');
  const [mostrarPanel, setMostrarPanel] = useState(true);
  const [exportando, setExportando] = useState('');

  const [criterios, setCriterios] = useState(null);
  const [cargandoCriterios, setCargandoCriterios] = useState(false);

  const filtrosMomentosRef = useRef(filtrosMomentos);
  const filtrosResultadosRef = useRef(filtrosResultados);
  filtrosMomentosRef.current = filtrosMomentos;
  filtrosResultadosRef.current = filtrosResultados;

  const construirQuery = useCallback((filtros) => {
    const query = new URLSearchParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== '') {
        query.set(clave, valor);
      }
    });
    const cadena = query.toString();
    return cadena ? `?${cadena}` : '';
  }, []);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [respuestaProgramas, respuestaMomentos, respuestaEvaluaciones] = await Promise.all([
        fetchJSON('/api/admin/seguimiento/programas'),
        fetchJSON('/api/admin/seguimiento/momentos-catalogo'),
        fetchJSON('/api/admin/seguimiento/momentos')
      ]);
      setProgramas(Array.isArray(respuestaProgramas?.data) ? respuestaProgramas.data : []);
      setCatalogoMomentos(Array.isArray(respuestaMomentos?.data) ? respuestaMomentos.data : []);
      setCatalogoEvaluaciones(Array.isArray(respuestaEvaluaciones?.data) ? respuestaEvaluaciones.data : []);
    } catch (catalogoError) {
      console.error('Error cargando catálogos de parametrización:', catalogoError);
      setNota('No fue posible cargar los catálogos de programas, momentos y evaluaciones.');
    }
  }, []);

  const cargarMomentos = useCallback(async () => {
    const datos = await fetchJSON(`/api/admin/seguimiento/momentos${construirQuery(filtrosMomentosRef.current)}`);
    return Array.isArray(datos?.data) ? datos.data : [];
  }, [construirQuery]);

  const cargarResultados = useCallback(async () => {
    const datos = await fetchJSON(`/api/admin/seguimiento/resultados${construirQuery(filtrosResultadosRef.current)}`);
    return Array.isArray(datos?.data) ? datos.data : [];
  }, [construirQuery]);

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tabActiva === 'momentos') {
        setMomentos(await cargarMomentos());
        setResultados([]);
      } else {
        setResultados(await cargarResultados());
        setCriterios(null);
      }
    } catch (cargaError) {
      console.error('Error cargando parametrización:', cargaError);
      setError(cargaError.message || 'No fue posible consultar la información solicitada.');
      setMomentos([]);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }, [tabActiva, cargarMomentos, cargarResultados]);

  useEffect(() => {
    cargarCatalogos();
  }, [cargarCatalogos]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const periodosDisponibles = useMemo(() => {
    const periodos = new Set();
    [...momentos, ...resultados, ...catalogoEvaluaciones].forEach((fila) => {
      if (fila.periodo) periodos.add(String(fila.periodo));
    });
    return Array.from(periodos).sort();
  }, [momentos, resultados, catalogoEvaluaciones]);

  const evaluacionesDisponibles = useMemo(() => {
    const mapa = new Map();
    catalogoEvaluaciones.forEach((fila) => {
      if (fila.id_evaluacion) {
        mapa.set(String(fila.id_evaluacion), LIMPIAR(fila.nombre_evaluacion, `Evaluación ${fila.id_evaluacion}`));
      }
    });
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [catalogoEvaluaciones]);

  const cambiarTab = (tab) => {
    setNota('');
    const siguiente = new URLSearchParams(searchParams);
    siguiente.set('tab', tab);
    setSearchParams(siguiente);
  };

  const actualizarMomentos = (campo, valor) => {
    setFiltrosMomentos((actual) => ({ ...actual, [campo]: valor }));
  };

  const actualizarResultados = (campo, valor) => {
    setFiltrosResultados((actual) => ({ ...actual, [campo]: valor }));
  };

  const limpiarMomentos = () => {
    setFiltrosMomentos({ periodo: '', estado: '', id_programa: '' });
  };

  const limpiarResultados = () => {
    setFiltrosResultados({ periodo: '', id_momento_evaluacion: '', id_evaluacion: '' });
    setTipoConsulta('grupo');
    setMostrarPanel(true);
  };

  const verResultadosDe = (momento) => {
    const siguiente = new URLSearchParams();
    siguiente.set('tab', 'resultados');
    if (momento.id_momento_evaluacion) {
      siguiente.set('momentoId', String(momento.id_momento_evaluacion));
    }
    if (momento.periodo) {
      siguiente.set('periodo', String(momento.periodo));
    }
    if (momento.id_evaluacion) {
      siguiente.set('evaluacionId', String(momento.id_evaluacion));
    }
    setFiltrosResultados({
      periodo: momento.periodo ? String(momento.periodo) : '',
      id_momento_evaluacion: momento.id_momento_evaluacion ? String(momento.id_momento_evaluacion) : '',
      id_evaluacion: momento.id_evaluacion ? String(momento.id_evaluacion) : ''
    });
    setSearchParams(siguiente);
  };

  const verCriterios = async (fila) => {
    setCargandoCriterios(true);
    setCriterios({ titulo: LIMPIAR(fila.nombre_rap, fila.codigo_rap), filas: [] });
    try {
      const datos = await fetchJSON(`/api/admin/seguimiento/rap/${fila.id_evaluacion_rap}/criterios`);
      setCriterios({
        titulo: LIMPIAR(fila.nombre_rap, fila.codigo_rap),
        filas: Array.isArray(datos?.data) ? datos.data : []
      });
    } catch (criterioError) {
      setCriterios({
        titulo: LIMPIAR(fila.nombre_rap, fila.codigo_rap),
        filas: [],
        error: criterioError.message || 'No fue posible consultar los criterios.'
      });
    } finally {
      setCargandoCriterios(false);
    }
  };

  const exportarExcel = () => {
    if (resultados.length === 0) {
      setNota('No hay resultados para exportar con los filtros seleccionados.');
      return;
    }
    setExportando('excel');
    try {
      const columnas = [
        ['RAP', (fila) => LIMPIAR(fila.codigo_rap, '')],
        ['Nombre del RAP', (fila) => LIMPIAR(fila.nombre_rap, '')],
        ['Evaluacion origen', (fila) => LIMPIAR(fila.evaluacion, '')],
        ['Momento de evaluacion', (fila) => LIMPIAR(fila.momento_evaluacion, '')],
        ['Grupo', (fila) => LIMPIAR(fila.grupo, '')],
        ['Jornada', (fila) => LIMPIAR(fila.codigo_jornada, '')],
        ['Periodo', (fila) => LIMPIAR(fila.periodo, '')],
        ['Semestre', (fila) => LIMPIAR(fila.semestre, '')],
        ['Programa', (fila) => LIMPIAR(fila.programa, '')],
        ['Estudiantes evaluados', (fila) => A_NUMERO(fila.estudiantes_evaluados) ?? 0],
        ['Total estudiantes', (fila) => A_NUMERO(fila.total_estudiantes) ?? 0],
        ['Cobertura (%)', (fila) => A_PORCENTAJE(fila.cobertura) ?? 0],
        ['Puntaje obtenido', (fila) => A_NUMERO(fila.puntaje_obtenido) ?? 0]
      ];

      const escapar = (valor) => {
        const texto = String(valor);
        return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
      };

      const lineas = [
        columnas.map(([titulo]) => escapar(titulo)).join(';'),
        ...resultados.map((fila) => columnas.map(([, extraer]) => escapar(extraer(fila))).join(';'))
      ];

      const contenido = `\uFEFF${lineas.join('\r\n')}`;
      const url = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8;' }));
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `resultados_rap_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (exportError) {
      console.error('Error exportando resultados:', exportError);
      setNota('No fue posible generar el archivo de resultados.');
    } finally {
      setExportando('');
    }
  };

  const exportarPdf = () => {
    if (resultados.length === 0) {
      setNota('No hay resultados para exportar con los filtros seleccionados.');
      return;
    }
    setExportando('pdf');
    setTimeout(() => {
      window.print();
      setExportando('');
    }, 100);
  };

  const coberturaPromedio = useMemo(() => {
    if (resultados.length === 0) return null;
    const suma = resultados.reduce((acumulado, fila) => acumulado + (A_PORCENTAJE(fila.cobertura) ?? 0), 0);
    return Math.round(suma / resultados.length);
  }, [resultados]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando información desde la base de datos...</p>
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
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-6 font-mono text-left break-words">{error}</p>
          <button
            type="button"
            onClick={cargarDatos}
            className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow"
          >
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#112F5C]">
            {tabActiva === 'momentos' ? 'Parametrización de pruebas' : 'Resultados de Aprendizaje'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {tabActiva === 'momentos'
              ? 'Consulte los momentos de evaluación parametrizados y su avance general.'
              : 'Consulte el cumplimiento obtenido a partir de las evaluaciones aplicadas.'}
          </p>
        </div>

        {tabActiva === 'momentos' ? (
          <button
            type="button"
            onClick={() => setNota('Consulte los momentos de evaluación, aplique los filtros y pulse Actualizar. Cada momento agrupa una evaluación con los RAP asociados y su cobertura.')}
            className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm hover:bg-gray-50 shrink-0"
          >
            <FaQuestionCircle className="text-gray-400" /> Ayuda
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={exportarExcel}
              disabled={exportando === 'excel'}
              className="flex items-center gap-2 bg-[#008A52] hover:bg-emerald-700 disabled:opacity-60 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <FaFileExcel /> {exportando === 'excel' ? 'Generando...' : 'Exportar Excel'}
            </button>
            <button
              type="button"
              onClick={exportarPdf}
              disabled={exportando === 'pdf'}
              className="flex items-center gap-2 bg-[#B3282D] hover:bg-red-800 disabled:opacity-60 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <FaFilePdf /> {exportando === 'pdf' ? 'Generando...' : 'Exportar PDF'}
            </button>
          </div>
        )}
      </div>

      {nota && (
        <div className="flex items-start gap-2 bg-sky-50 border border-sky-200 text-sky-900 text-[11px] p-3 rounded-xl" role="status">
          <FaInfoCircle className="mt-0.5 shrink-0" />
          <span className="flex-1">{nota}</span>
          <button type="button" onClick={() => setNota('')} aria-label="Cerrar aviso" className="shrink-0">
            <FaTimes />
          </button>
        </div>
      )}

      <div className="flex border-b border-gray-200 gap-6 text-xs font-bold" role="tablist" aria-label="Secciones de parametrización">
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === 'momentos'}
          onClick={() => cambiarTab('momentos')}
          className={`pb-3 flex items-center gap-2 transition-all ${
            tabActiva === 'momentos'
              ? 'border-b-2 border-[#B3282D] text-[#B3282D]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <FaClipboardList /> Momentos de evaluación
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === 'resultados'}
          onClick={() => cambiarTab('resultados')}
          className={`pb-3 flex items-center gap-2 transition-all ${
            tabActiva === 'resultados'
              ? 'border-b-2 border-[#B3282D] text-[#B3282D]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <FaChartLine /> Resultados de aprendizaje
        </button>
      </div>

      {tabActiva === 'momentos' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-end justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
              <div>
                <label htmlFor="param-periodo-momentos" className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Periodo académico
                </label>
                <input
                  id="param-periodo-momentos"
                  list="param-periodos-disponibles"
                  value={filtrosMomentos.periodo}
                  onChange={(evento) => actualizarMomentos('periodo', evento.target.value)}
                  placeholder="Todos"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
                <datalist id="param-periodos-disponibles">
                  {periodosDisponibles.map((periodo) => (
                    <option key={periodo} value={periodo} />
                  ))}
                </datalist>
              </div>

              <div>
                <label htmlFor="param-estado" className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  id="param-estado"
                  value={filtrosMomentos.estado}
                  onChange={(evento) => actualizarMomentos('estado', evento.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">Todos</option>
                  {ESTADOS_EVALUACION.map((estado) => (
                    <option key={estado} value={estado}>{ETIQUETA_ESTADO[estado]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="param-programa" className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Programa
                </label>
                <select
                  id="param-programa"
                  value={filtrosMomentos.id_programa}
                  onChange={(evento) => actualizarMomentos('id_programa', evento.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">Todos</option>
                  {programas.map((programa) => (
                    <option key={programa.id_programa} value={programa.id_programa}>
                      {programa.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={limpiarMomentos}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={cargarDatos}
                className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-bold px-6 py-2 rounded-xl transition shadow"
              >
                Actualizar
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {momentos.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 text-gray-400">
                <p className="text-xs font-semibold text-gray-500">Sin momentos de evaluación registrados para los filtros seleccionados.</p>
              </div>
            ) : (
              momentos.map((momento, indice) => {
                const estado = String(momento.estado || '').toUpperCase();
                const estiloEstado = ESTILO_ESTADO[estado] || 'bg-gray-100 text-gray-600 border-gray-200';
                const promedio = A_NUMERO(momento.promedio_general);
                const cobertura = A_PORCENTAJE(momento.cobertura);
                const evaluados = A_NUMERO(momento.estudiantes_evaluados) ?? 0;

                return (
                  <div
                    key={momento.id_evaluacion || indice}
                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6"
                  >
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className={`w-12 h-12 rounded-full font-bold text-base flex items-center justify-center shrink-0 border ${estiloEstado}`}>
                        {LIMPIAR(momento.id_momento_evaluacion, '•')}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-bold text-sm text-[#112F5C]">
                            {LIMPIAR(momento.momento_evaluacion, LIMPIAR(momento.nombre_evaluacion, 'Momento de evaluación'))}
                          </h3>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${estiloEstado}`}>
                            {ETIQUETA_ESTADO[estado] || LIMPIAR(momento.estado)}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {[
                            momento.nombre_evaluacion,
                            momento.semestre,
                            momento.grupo && momento.codigo_jornada ? `${momento.grupo} (${momento.codigo_jornada})` : momento.grupo,
                            momento.programa,
                            momento.periodo
                          ].filter(Boolean).join(' · ')}
                        </p>

                        <div className="flex gap-2 pt-1 flex-wrap">
                          {Array.isArray(momento.raps) && momento.raps.length > 0
                            ? momento.raps.map((rap, indiceRap) => (
                                <span key={rap.id_rap || indiceRap} className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                                  {rap.codigo || rap.nombre || 'RAP'}
                                </span>
                              ))
                            : <span className="text-[10px] text-gray-400">Sin RAP asociados</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0">
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium">Cobertura</p>
                        <p className="text-sm font-bold text-[#112F5C]">{cobertura === null ? '—' : `${cobertura}%`}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-gray-400 font-medium">Promedio general</p>
                        <p className="text-sm font-bold text-[#112F5C]">{promedio === null ? '—' : promedio.toFixed(1)}</p>
                      </div>

                      <button
                        type="button"
                        disabled={!evaluados}
                        onClick={() => verResultadosDe(momento)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                          evaluados
                            ? 'border border-gray-300 hover:bg-gray-50 text-[#112F5C]'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {evaluados ? 'Ver resultados →' : 'Aún sin resultados'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-4 rounded-2xl leading-relaxed">
            ⓘ Los RAP asociados a cada momento se parametrizan al crear la evaluación y dependen del semestre y la estructura curricular vigente.
          </div>
        </div>
      )}

      {tabActiva === 'resultados' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label htmlFor="param-periodo-resultados" className="block text-[10px] font-semibold text-gray-500 mb-1">
                  Periodo académico
                </label>
                <input
                  id="param-periodo-resultados"
                  list="param-periodos-disponibles"
                  value={filtrosResultados.periodo}
                  onChange={(evento) => actualizarResultados('periodo', evento.target.value)}
                  placeholder="Todos"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="param-momento" className="block text-[10px] font-semibold text-gray-500 mb-1">
                  Momento de evaluación
                </label>
                <select
                  id="param-momento"
                  value={filtrosResultados.id_momento_evaluacion}
                  onChange={(evento) => actualizarResultados('id_momento_evaluacion', evento.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">Todos</option>
                  {catalogoMomentos.map((catalogo) => (
                    <option key={catalogo.id_momento_evaluacion} value={catalogo.id_momento_evaluacion}>
                      {catalogo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="param-evaluacion" className="block text-[10px] font-semibold text-gray-500 mb-1">
                  Evaluación origen
                </label>
                <select
                  id="param-evaluacion"
                  value={filtrosResultados.id_evaluacion}
                  onChange={(evento) => actualizarResultados('id_evaluacion', evento.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="">Todas</option>
                  {evaluacionesDisponibles.map((evaluacion) => (
                    <option key={evaluacion.id} value={evaluacion.id}>
                      {evaluacion.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={limpiarResultados}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                >
                  Borrar
                </button>
                <button
                  type="button"
                  onClick={cargarDatos}
                  className="flex-1 bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-bold px-4 py-1.5 rounded-xl transition shadow"
                >
                  Consultar
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-semibold text-gray-600">Tipo de consulta:</span>
                <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                  <button
                    type="button"
                    onClick={() => setTipoConsulta('grupo')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      tipoConsulta === 'grupo' ? 'bg-[#112F5C] text-white shadow' : 'text-gray-600'
                    }`}
                  >
                    Por grupo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoConsulta('individual')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      tipoConsulta === 'individual' ? 'bg-[#112F5C] text-white shadow' : 'text-gray-600'
                    }`}
                  >
                    Individual
                  </button>
                </div>
                <label className="flex items-center gap-2 text-[11px] text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mostrarPanel}
                    onChange={(evento) => setMostrarPanel(evento.target.checked)}
                    className="accent-[#112F5C]"
                  />
                  Mostrar panel de resultados
                </label>
              </div>

              <span className="text-[11px] text-gray-400">
                {tipoConsulta === 'grupo'
                  ? 'Cobertura agregada por grupo y RAP.'
                  : 'El detalle por estudiante se consulta en Reportes y Exportación.'}
              </span>
            </div>
          </div>

          {mostrarPanel && (
            <>
              <div className="flex items-center justify-between gap-4 text-xs font-bold text-[#112F5C] flex-wrap">
                <p>
                  ↳ Fuente:{' '}
                  {resultados.length > 0
                    ? [
                        resultados[0].momento_evaluacion,
                        resultados[0].grupo && resultados[0].codigo_jornada
                          ? `${resultados[0].grupo} (${resultados[0].codigo_jornada})`
                          : resultados[0].grupo,
                        resultados[0].periodo
                      ].filter(Boolean).join(' - ')
                    : 'Sin datos de resultados'}
                </p>
                <p className="bg-blue-50 px-3 py-1 rounded-xl text-blue-900">
                  {coberturaPromedio === null ? 'Cobertura promedio: —' : `Cobertura promedio: ${coberturaPromedio}%`}
                </p>
              </div>

              <div className="param-tabla-resultados bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  {resultados.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p className="text-xs font-semibold text-gray-500">Sin datos de resultados para los filtros seleccionados.</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#112F5C] text-white font-semibold">
                        <tr>
                          <th className="px-6 py-3.5">RAP</th>
                          <th className="px-6 py-3.5">RESULTADO</th>
                          <th className="px-6 py-3.5">EVALUACIÓN ORIGEN</th>
                          <th className="px-6 py-3.5">ESTUDIANTES</th>
                          <th className="px-6 py-3.5 text-center">DETALLE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {resultados.map((fila, indice) => {
                          const cobertura = A_PORCENTAJE(fila.cobertura) ?? 0;
                          const evaluados = A_NUMERO(fila.estudiantes_evaluados) ?? 0;
                          const total = A_NUMERO(fila.total_estudiantes) ?? 0;

                          return (
                            <tr key={fila.id_evaluacion_rap || `${fila.id_rap}-${indice}`} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="font-bold text-[#112F5C]">{LIMPIAR(fila.codigo_rap)}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{LIMPIAR(fila.nombre_rap)}</p>
                              </td>

                              <td className="px-6 py-4 w-56">
                                <div className="flex items-center gap-3">
                                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        cobertura >= 80 ? 'bg-[#112F5C]' : cobertura >= 70 ? 'bg-sky-600' : 'bg-amber-500'
                                      }`}
                                      style={{ width: `${cobertura}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-bold text-xs text-gray-700">{cobertura}%</span>
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <p className="font-bold text-gray-700">{LIMPIAR(fila.evaluacion)}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{LIMPIAR(fila.momento_evaluacion)}</p>
                              </td>

                              <td className="px-6 py-4 text-gray-600 font-medium">
                                {evaluados} / {total} evaluados
                              </td>

                              <td className="px-6 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => verCriterios(fila)}
                                  className="text-[#112F5C] font-bold hover:underline"
                                >
                                  Ver criterios →
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </>
          )}

          {criterios && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-[#112F5C] flex items-center gap-2">
                  <FaCheckCircle className="text-[#008A52]" /> Criterios de evaluación — {criterios.titulo}
                </h3>
                <button type="button" onClick={() => setCriterios(null)} aria-label="Cerrar criterios" className="text-gray-400 hover:text-gray-700">
                  <FaTimes />
                </button>
              </div>

              {cargandoCriterios ? (
                <p className="px-6 py-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                  <FaSyncAlt className="animate-spin" /> Consultando criterios...
                </p>
              ) : criterios.error ? (
                <p className="px-6 py-8 text-center text-xs text-red-600">{criterios.error}</p>
              ) : criterios.filas.length === 0 ? (
                <p className="px-6 py-8 text-center text-xs text-gray-500">Este RAP no tiene preguntas ni criterios de evaluación registrados.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-600 font-semibold">
                      <tr>
                        <th className="px-6 py-3">PREGUNTA</th>
                        <th className="px-6 py-3">TIPO</th>
                        <th className="px-6 py-3">CRITERIO</th>
                        <th className="px-6 py-3 text-right">PUNTAJE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {criterios.filas.map((fila, indice) => (
                        <tr key={fila.id_pregunta || indice}>
                          <td className="px-6 py-3.5 text-gray-700">{LIMPIAR(fila.enunciado)}</td>
                          <td className="px-6 py-3.5 text-gray-500">{LIMPIAR(fila.tipo_pregunta)}</td>
                          <td className="px-6 py-3.5 font-semibold text-[#112F5C]">{LIMPIAR(fila.criterio, 'Sin criterio')}</td>
                          <td className="px-6 py-3.5 text-right font-bold text-gray-700">{LIMPIAR(fila.puntaje)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-4 rounded-2xl leading-relaxed">
            ⓘ Los resultados provienen de las evaluaciones asignadas por el administrador al docente y al semestre. El porcentaje mostrado corresponde a la cobertura de evaluación alcanzada por cada RAP.
          </div>
        </div>
      )}

      <p className="hidden print:block text-center text-xs text-gray-600">
        Universidad CESMAG — Parametrización de pruebas — {new Date().toLocaleDateString('es-CO')}
      </p>
    </div>
  );
}
