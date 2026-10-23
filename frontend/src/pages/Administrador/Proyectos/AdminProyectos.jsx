import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaFolderOpen,
  FaSearch,
  FaEye,
  FaList,
  FaFileAlt,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaLock
} from 'react-icons/fa';
import {
  listarProyectosAdmin,
  obtenerProyectoAdmin,
  ESCRITURA_PROYECTOS_ADMIN,
  rutaProyectosAdmin
} from '../../../services/adminProyectosService';
import { CATEGORIAS_PROYECTO, fechaCorta } from '../../../utils/proyectos';

const LIMITE = 20;

const VISTA = {
  LISTADO: 'listado',
  DETALLE: 'detalle'
};

const FILTROS_VACIOS = {
  buscar: '',
  estado: '',
  periodo: ''
};

const PAGINACION_VACIA = {
  pagina: 1,
  limite: LIMITE,
  total: 0,
  total_paginas: 0
};

const textoEstado = (estado) => {
  if (estado === true) return 'Activo';
  if (estado === false) return 'Inactivo';
  return estado || '—';
};

const textoSemestre = (numero, nombre) => {
  if (nombre) return nombre;
  return numero ? `${numero}.º Semestre` : '—';
};

const fechaHora = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

function EtiquetaEstado({ estado }) {
  const activo = estado === true;
  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold border ${
        activo
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-gray-50 text-gray-600 border-gray-200'
      }`}
    >
      {textoEstado(estado)}
    </span>
  );
}

function DatoDetalle({ etiqueta, valor }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
      <dt className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">{etiqueta}</dt>
      <dd className="text-xs font-semibold text-gray-800 mt-1 break-words">{valor || '—'}</dd>
    </div>
  );
}

function BloqueTexto({ titulo, texto }) {
  return (
    <section className="space-y-1.5">
      <h3 className="text-[11px] font-bold text-[#112F5C] uppercase tracking-wide">{titulo}</h3>
      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 border border-gray-100 rounded-xl p-4 min-h-[3rem]">
        {texto || 'Sin información registrada.'}
      </p>
    </section>
  );
}

export default function AdminProyectos({ categoria = 'interestructurante', sinEncabezado = false }) {
  const config = useMemo(() => {
    const base = CATEGORIAS_PROYECTO[categoria] || CATEGORIAS_PROYECTO.interestructurante;
    if (categoria !== 'modalidad') return base;

    return {
      ...base,
      titulo: 'Tesis y Trabajo de Grado',
      descripcion:
        'Consulta de tesis, trabajos de grado y proyectos de coterminalidad registrados por los estudiantes de noveno semestre.',
      vacio: 'No hay tesis o trabajos de grado registrados.'
    };
  }, [categoria]);
  const rutaBackend = rutaProyectosAdmin(categoria);

  const [vista, setVista] = useState(VISTA.LISTADO);
  const [proyectos, setProyectos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [sinBackend, setSinBackend] = useState(false);

  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_VACIOS);
  const [pagina, setPagina] = useState(1);
  const [paginacion, setPaginacion] = useState(PAGINACION_VACIA);

  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');

    try {
      const respuesta = await listarProyectosAdmin(categoria, {
        ...filtrosAplicados,
        pagina,
        limite: LIMITE
      });

      setProyectos(Array.isArray(respuesta?.proyectos) ? respuesta.proyectos : []);

      const info = respuesta?.paginacion || {};
      setPaginacion({
        pagina: Number(info.pagina) || pagina,
        limite: Number(info.limite) || LIMITE,
        total: Number(info.total) || 0,
        total_paginas: Number(info.total_paginas) || 0
      });
      setSinBackend(false);
    } catch (cargaError) {
      if (cargaError?.status === 404) {
        setProyectos([]);
        setPaginacion(PAGINACION_VACIA);
        setSinBackend(true);
      } else {
        setErrorCarga(
          cargaError?.message || 'No fue posible consultar los proyectos del administrador.'
        );
      }
    } finally {
      setCargando(false);
    }
  }, [categoria, filtrosAplicados, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const totalPaginas = useMemo(
    () => Math.max(Number(paginacion.total_paginas) || 0, 1),
    [paginacion.total_paginas]
  );

  const aplicarFiltros = (evento) => {
    evento.preventDefault();
    setPagina(1);
    setFiltrosAplicados({ ...filtros });
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    setFiltrosAplicados(FILTROS_VACIOS);
    setPagina(1);
  };

  const cambiarEstadoFiltro = (valor) => {
    const nuevos = { ...filtros, estado: valor };
    setFiltros(nuevos);
    setFiltrosAplicados(nuevos);
    setPagina(1);
  };

  const volverAlListado = () => {
    setVista(VISTA.LISTADO);
  };

  const verDetalle = async (proyecto) => {
    setVista(VISTA.DETALLE);
    setDetalleSeleccionado(proyecto);
    setDetalle(null);
    setErrorDetalle('');
    setCargandoDetalle(true);

    try {
      const respuesta = await obtenerProyectoAdmin(categoria, proyecto.id_proyecto);
      setDetalle(respuesta);
    } catch (detalleError) {
      if (detalleError?.status === 404) {
        setErrorDetalle(
          'El backend no encontró el detalle del proyecto. Verifique que el registro siga existiendo en el módulo consultado.'
        );
      } else {
        setErrorDetalle(detalleError?.message || 'No fue posible consultar el detalle del proyecto.');
      }
    } finally {
      setCargandoDetalle(false);
    }
  };

  const datosDetalle = useMemo(() => {
    const proyecto = detalle?.proyecto || detalleSeleccionado || {};
    const estudiante = detalle?.estudiante || {};
    const semestre = detalle?.semestre || {};
    const grupo = detalle?.grupo || {};
    const programa = detalle?.programa || {};

    const nombreEstudiante =
      `${estudiante.nombre || detalleSeleccionado?.estudiante_nombre || ''} ${
        estudiante.apellido || detalleSeleccionado?.estudiante_apellido || ''
      }`.trim() || '—';

    return {
      nombre: proyecto.nombre || detalleSeleccionado?.nombre || 'Proyecto sin nombre',
      descripcion: proyecto.descripcion || detalleSeleccionado?.descripcion || '',
      informacion: proyecto.informacion || '',
      tipo: proyecto.tipo_proyecto || detalleSeleccionado?.tipo_proyecto || 'Sin tipo',
      especializacion:
        typeof proyecto.especializacion === 'boolean'
          ? proyecto.especializacion
          : detalleSeleccionado?.especializacion,
      estado:
        typeof proyecto.estado === 'boolean' ? proyecto.estado : detalleSeleccionado?.estado,
      fecha: proyecto.fecha_registro || detalleSeleccionado?.fecha_registro,
      estudiante: nombreEstudiante,
      codigo:
        estudiante.id_user_institucional || detalleSeleccionado?.id_user_institucional || '—',
      correo: estudiante.correo || detalleSeleccionado?.correo || '—',
      programa: programa.nombre || detalleSeleccionado?.programa || '—',
      semestre: textoSemestre(
        semestre.numero ?? detalleSeleccionado?.semestre,
        semestre.nombre || detalleSeleccionado?.nombre_semestre
      ),
      grupo: grupo.nombre || detalleSeleccionado?.grupo || 'Sin asignar',
      codigoGrupo: grupo.codigo_jornada || detalleSeleccionado?.codigo_grupo || '',
      jornada: grupo.jornada || detalleSeleccionado?.jornada || '—',
      periodo: grupo.periodo || detalleSeleccionado?.periodo || '—'
    };
  }, [detalle, detalleSeleccionado]);

  const botoneraPrincipal = !sinEncabezado ? (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-[#112F5C]">{config.titulo}</h1>
        <p className="text-xs text-gray-500 mt-0.5">{config.descripcion}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={cargar}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <FaSyncAlt className="text-xs" />
          Actualizar datos
        </button>
      </div>
    </div>
  ) : (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={cargar}
        className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
      >
        <FaSyncAlt className="text-xs" />
        Actualizar datos
      </button>
    </div>
  );

  return (
    <div className="w-full animate-fade-in space-y-6">
      {botoneraPrincipal}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={volverAlListado}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${
            vista === VISTA.LISTADO
              ? 'bg-[#112F5C] text-white border-[#112F5C] shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FaList /> Listado
        </button>
        <button
          type="button"
          onClick={() => {
            if (detalleSeleccionado) setVista(VISTA.DETALLE);
          }}
          disabled={!detalleSeleccionado}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${
            vista === VISTA.DETALLE
              ? 'bg-[#112F5C] text-white border-[#112F5C] shadow-sm'
              : detalleSeleccionado
                ? 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
          }`}
        >
          <FaFileAlt /> Detalle
        </button>
      </div>

      {!ESCRITURA_PROYECTOS_ADMIN && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <FaLock className="text-amber-600 text-base mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-amber-900">Módulo en modo consulta</p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              El backend publica únicamente rutas de lectura ({rutaBackend}). Este módulo permite
              consultar y filtrar los proyectos; la creación, edición y eliminación no están
              disponibles desde el administrador.
            </p>
          </div>
        </div>
      )}

      {vista === VISTA.LISTADO && (
        <>
          {errorCarga ? (
            <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full mx-auto text-center border border-gray-100">
              <FaExclamationCircle className="text-4xl text-[#B3282D] mx-auto mb-3" />
              <h2 className="text-lg font-bold text-[#112F5C] mb-2">Error de conexión</h2>
              <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-6 font-mono text-left break-words">
                {errorCarga}
              </p>
              <button
                type="button"
                onClick={cargar}
                className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow"
              >
                <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-[#112F5C]">
                  {config.titulo} ({paginacion.total})
                </h2>
              </div>

              <form
                onSubmit={aplicarFiltros}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3"
              >
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
                  <input
                    type="text"
                    value={filtros.buscar}
                    onChange={(e) => setFiltros({ ...filtros, buscar: e.target.value })}
                    placeholder="Buscar por proyecto, estudiante, correo o código..."
                    className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                  />
                </div>

                <select
                  value={filtros.estado}
                  onChange={(e) => cambiarEstadoFiltro(e.target.value)}
                  aria-label="Filtrar por estado"
                  className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                >
                  <option value="">Todos los estados</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>

                <input
                  type="text"
                  value={filtros.periodo}
                  onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                  placeholder="Periodo (ej. 2026-1)"
                  className="px-3 py-2 text-xs border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#112F5C] hover:bg-blue-900 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    <FaSearch className="text-xs" /> Buscar
                  </button>
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
                  >
                    Limpiar
                  </button>
                </div>
              </form>

              {sinBackend && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                  <FaExclamationTriangle className="text-amber-500 text-xs mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-900 leading-relaxed">
                    El backend no respondió en {rutaBackend}. Verifique que el servidor esté
                    actualizado y que la ruta esté publicada.
                  </p>
                </div>
              )}

              {cargando ? (
                <div className="min-h-[30vh] flex items-center justify-center">
                  <div className="text-center">
                    <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
                    <p className="text-gray-600 text-sm font-medium">Cargando proyectos...</p>
                  </div>
                </div>
              ) : proyectos.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FaFolderOpen className="text-4xl mx-auto mb-3 text-gray-300" />
                  <p className="text-xs font-semibold text-gray-500">{config.vacio}</p>
                  {(filtrosAplicados.buscar || filtrosAplicados.estado || filtrosAplicados.periodo) && (
                    <p className="text-[11px] text-gray-400 mt-1">
                      Ajuste los filtros para ver otros proyectos.
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#0074B7] text-white font-semibold">
                        <tr>
                          <th className="px-4 py-3">PROYECTO</th>
                          <th className="px-4 py-3">ESTUDIANTE</th>
                          <th className="px-4 py-3">PROGRAMA</th>
                          <th className="px-4 py-3">GRUPO / PERIODO</th>
                          <th className="px-4 py-3">SEMESTRE</th>
                          <th className="px-4 py-3">ESTADO</th>
                          <th className="px-4 py-3">FECHA</th>
                          <th className="px-4 py-3 text-center">ACCIÓN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {proyectos.map((proyecto) => (
                          <tr
                            key={proyecto.id_proyecto}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3.5 max-w-[18rem]">
                              <p className="font-bold text-gray-800">
                                {proyecto.nombre || 'Proyecto sin nombre'}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {proyecto.tipo_proyecto || 'Sin tipo'}
                                {proyecto.especializacion === true ? ' · Especialización' : ''}
                              </p>
                              {proyecto.descripcion && (
                                <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5">
                                  {proyecto.descripcion}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              <p className="font-semibold text-gray-800">
                                {proyecto.estudiante_nombre || ''}{' '}
                                {proyecto.estudiante_apellido || ''}
                              </p>
                              <p className="text-[11px] text-gray-500">{proyecto.correo || '—'}</p>
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              {proyecto.programa || '—'}
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              <p>{proyecto.grupo || 'Sin asignar'}</p>
                              <p className="text-[11px] text-gray-500">
                                {proyecto.codigo_grupo ? `${proyecto.codigo_grupo} · ` : ''}
                                {proyecto.periodo || '—'}
                              </p>
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              {textoSemestre(proyecto.semestre, proyecto.nombre_semestre)}
                            </td>
                            <td className="px-4 py-3.5">
                              <EtiquetaEstado estado={proyecto.estado} />
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              {fechaCorta(proyecto.fecha_registro)}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() => verDetalle(proyecto)}
                                  title="Ver detalle del proyecto"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 text-[#0074B7] hover:border-[#0074B7] hover:bg-sky-50 transition"
                                >
                                  <FaEye className="text-xs" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <p className="text-[11px] text-gray-500">
                      Mostrando {proyectos.length} de {paginacion.total} · Página{' '}
                      {paginacion.pagina || 1} de {totalPaginas}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPagina((valor) => Math.max(valor - 1, 1))}
                        disabled={pagina <= 1}
                        className="inline-flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition"
                      >
                        <FaChevronLeft className="text-[9px]" /> Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setPagina((valor) => Math.min(valor + 1, totalPaginas))}
                        disabled={pagina >= totalPaginas || paginacion.total_paginas === 0}
                        className="inline-flex items-center gap-1 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition"
                      >
                        Siguiente <FaChevronRight className="text-[9px]" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {vista === VISTA.DETALLE && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#112F5C]">{datosDetalle.nombre}</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {datosDetalle.tipo}
                {datosDetalle.especializacion === true ? ' · Especialización' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <EtiquetaEstado estado={datosDetalle.estado} />
              <button
                type="button"
                onClick={volverAlListado}
                className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3.5 py-2 rounded-xl text-xs font-semibold transition"
              >
                <FaArrowLeft className="text-xs" /> Volver al listado
              </button>
            </div>
          </div>

          {cargandoDetalle ? (
            <div className="min-h-[30vh] flex items-center justify-center">
              <div className="text-center">
                <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
                <p className="text-gray-600 text-sm font-medium">Cargando detalle...</p>
              </div>
            </div>
          ) : errorDetalle ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <FaExclamationCircle className="text-[#B3282D] text-base mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-800">No se pudo cargar el detalle</p>
                <p className="text-[11px] text-red-700 leading-relaxed">{errorDetalle}</p>
              </div>
            </div>
          ) : (
            <>
              <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <DatoDetalle etiqueta="Estudiante" valor={datosDetalle.estudiante} />
                <DatoDetalle etiqueta="Código" valor={datosDetalle.codigo} />
                <DatoDetalle etiqueta="Correo" valor={datosDetalle.correo} />
                <DatoDetalle etiqueta="Programa" valor={datosDetalle.programa} />
                <DatoDetalle etiqueta="Semestre" valor={datosDetalle.semestre} />
                <DatoDetalle
                  etiqueta="Grupo"
                  valor={`${datosDetalle.grupo}${
                    datosDetalle.codigoGrupo ? ` · ${datosDetalle.codigoGrupo}` : ''
                  }`}
                />
                <DatoDetalle etiqueta="Jornada" valor={datosDetalle.jornada} />
                <DatoDetalle etiqueta="Periodo" valor={datosDetalle.periodo} />
                <DatoDetalle etiqueta="Fecha de registro" valor={fechaHora(datosDetalle.fecha)} />
              </dl>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <BloqueTexto titulo="Descripción" texto={datosDetalle.descripcion} />
                <BloqueTexto titulo="Información del proyecto" texto={datosDetalle.informacion} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
