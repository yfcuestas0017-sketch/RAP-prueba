import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaClock,
  FaBook,
  FaPlayCircle,
  FaFolderOpen,
  FaGraduationCap,
  FaFlask,
  FaEye,
  FaCheckCircle,
  FaFileAlt,
  FaChartLine
} from 'react-icons/fa';
import {
  obtenerContexto,
  pistasPorSemestre,
  resolverItems,
  esSoloVisualizacion,
  esDelCursoActual
} from '../../../services/estudianteEvaluaciones.js';
import './EstudianteEvaluaciones.css';

const TONO_CHIP = {
  ok: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  aviso: 'bg-amber-100 text-amber-800 border-amber-300',
  pendiente: 'bg-slate-100 text-slate-600 border-slate-300'
};

const ICONO_PISTA = {
  rap: FaFlask,
  interestructurante: FaFolderOpen,
  tesisCoterminal: FaGraduationCap,
  saberPro: FaBook
};

export default function EstudiantePruebas() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contexto, setContexto] = useState(null);

  const [pistaActiva, setPistaActiva] = useState('rap');
  const [itemId, setItemId] = useState(null);
  const [notaEntregable, setNotaEntregable] = useState('');

  const cargar = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await obtenerContexto();
      setContexto(data);
    } catch (err) {
      console.error('Error cargando contexto del estudiante:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const estudiante = contexto?.estudiante || null;
  const semestre = estudiante?.semestre ?? 4;

  const pistasVisibles = useMemo(() => pistasPorSemestre(semestre), [semestre]);

  useEffect(() => {
    if (!pistasVisibles.some((p) => p.clave === pistaActiva)) {
      setPistaActiva(pistasVisibles[0]?.clave || 'rap');
    }
  }, [pistasVisibles, pistaActiva]);

  // Ítems de la pista activa: prefiere el backend real (contexto.evaluaciones);
  // si el backend no devuelve datos, cae al catálogo demo sin cambiar la UI.
  const items = useMemo(
    () => resolverItems(contexto, semestre, pistaActiva),
    [contexto, semestre, pistaActiva]
  );

  const itemSel = items.find((i) => i.id === itemId) || items[0] || null;

  useEffect(() => {
    setItemId(null);
    setNotaEntregable('');
  }, [pistaActiva, semestre]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando su plan de evaluaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <FaExclamationCircle className="text-4xl text-[#B3282D] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#112F5C] mb-2">Error de respuesta del Servidor</h2>
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-6 font-mono text-left">{error}</p>
          <button onClick={cargar} className="bg-[#112F5C] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow">
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#112F5C]">Pruebas RAP y Saber Pro</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Contenido habilitado automáticamente para su semestre en curso ({semestre}.°). Los filtros de
          semestre, programa y facultad son datos de su perfil, no seleccionables.
        </p>
      </div>

      {/* Pestañas restringidas por semestre */}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${pistasVisibles.length}, minmax(0,1fr))` }}>
        {pistasVisibles.map((pista) => {
          const Icono = ICONO_PISTA[pista.clave];
          const activa = pistaActiva === pista.clave;
          return (
            <button
              key={pista.clave}
              onClick={() => setPistaActiva(pista.clave)}
              className={`rap-tab rounded-xl border-2 px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-sm ${
                activa ? 'text-white shadow-md' : 'bg-white text-[#112F5C] border-gray-200 hover:border-[#112F5C]'
              }`}
              style={activa ? { backgroundColor: pista.color, borderColor: pista.color } : undefined}
            >
              <Icono /> {pista.titulo}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
        {/* Filtros: semestre/programa/facultad bloqueados al dato del estudiante */}
        <div>
          <h2 className="text-sm font-bold text-[#112F5C] mb-3">
            {pistaActiva === 'saberPro' ? 'Filtros de la Prueba Saber Pro:' : 'Filtros de Pruebas RAP:'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CampoBloqueado etiqueta="Semestre:" valor={`${semestre}.° Semestre - En Curso`} />
            <CampoBloqueado etiqueta="Programa:" valor={estudiante?.programa || 'Ingeniería de Sistemas'} />
            <CampoBloqueado etiqueta="Facultad:" valor={estudiante?.facultad || 'Fac. Ingeniería'} />
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Examen:</label>
              <select
                value={itemSel?.id || ''}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full h-10 border-2 border-[#112F5C] rounded-lg px-3 text-xs font-semibold text-[#112F5C] bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/40"
              >
                {items.length === 0 && <option value="">Sin ítems habilitados</option>}
                {items.map((it) => (
                  <option key={it.id} value={it.id}>{it.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Panel de detalles del ítem seleccionado */}
        {itemSel ? (
          <PanelDetalle
            itemSel={itemSel}
            pistaActiva={pistaActiva}
            semestre={semestre}
            notaEntregable={notaEntregable}
            onIniciar={() => navigate(`/estudiante/evaluaciones/examen/${itemSel.id}`)}
            onAbrirEntregable={() =>
              setNotaEntregable('El envío de entregables se habilitará al conectar el backend de proyectos.')
            }
          />
        ) : (
          <div className="text-center py-12 text-gray-400">
            <FaBook className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-xs font-semibold text-gray-500">
              No tiene ítems habilitados para este semestre en esta pista.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PanelDetalle({ itemSel, pistaActiva, semestre, notaEntregable, onIniciar, onAbrirEntregable }) {
  const soloLectura = esSoloVisualizacion(itemSel, semestre);
  const delCurso = esDelCursoActual(itemSel, semestre);
  const resultado = itemSel.resultado;

  // RAP (4.°) y Saber Pro (9.°) son exámenes; el resto son entregables.
  const esExamen = pistaActiva === 'rap' || pistaActiva === 'saberPro';

  return (
    <div className="bg-slate-50 border border-gray-200 rounded-2xl p-6 space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#112F5C]">
          Detalles y Requisitos {pistaActiva === 'rap'
            ? 'del Examen Unificado RAP'
            : pistaActiva === 'saberPro'
              ? 'del Simulacro Saber Pro'
              : 'del Entregable'}
        </h3>
        {soloLectura ? (
          <span className="inline-flex items-center gap-1.5 bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
            <FaEye /> Solo visualización
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
            <FaPlayCircle /> Del curso actual
          </span>
        )}
      </div>

      {!delCurso && (
        <p className="text-[11px] text-slate-700 bg-slate-100 border border-slate-200 rounded-xl p-3 font-medium leading-relaxed">
          Este ítem pertenece al <strong>{itemSel.semestreOrigen}.° semestre</strong> y ya no está en curso.
          Se muestra únicamente en modo consulta con el resultado obtenido; no puede volver a realizarse.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <span className={`border px-4 py-1.5 rounded-lg text-[11px] font-bold ${TONO_CHIP[itemSel.tono] || TONO_CHIP.ok}`}>
          {itemSel.estado}
        </span>
        {itemSel.duracionMin && (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 px-4 py-1.5 rounded-lg text-[11px] font-bold">
            Duración: {itemSel.duracionMin} min
          </span>
        )}
        {itemSel.respuestas && (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 px-4 py-1.5 rounded-lg text-[11px] font-bold">
            Respuestas {itemSel.respuestas}
          </span>
        )}
      </div>

      {/* Resultado obtenido: recuadro destacado solo en modo consulta (ítem histórico) */}
      {soloLectura && resultado && (
        <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FaChartLine className="text-emerald-600" />
            <h4 className="text-xs font-bold text-[#112F5C] uppercase tracking-wide">Resultado obtenido</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Metrica etiqueta="Puntaje" valor={`${resultado.puntaje}/${resultado.sobre ?? 100}`} destacado />
            <Metrica etiqueta="Estado" valor={resultado.estado} />
            <Metrica etiqueta="Fecha" valor={resultado.fecha} />
            {resultado.intentos != null && <Metrica etiqueta="Intentos" valor={resultado.intentos} />}
          </div>
        </div>
      )}

      {itemSel.asignaturas && (
        <div>
          <p className="text-xs font-bold text-[#112F5C] mb-2">Asignaturas e Indicadores RAP integrados en esta Evaluación:</p>
          <ul className="space-y-1">
            {itemSel.asignaturas.map((a) => (
              <li key={a} className="text-[11px] text-blue-700 font-medium">• {a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Entregables: los ya subidos se muestran como recuadros de completado */}
      {itemSel.entregables && (
        <div className="space-y-3">
          <p className="text-xs font-bold text-[#112F5C]">Entregables del proceso:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {itemSel.entregables.map((e) => {
              const entregado = e.estado === 'Entregado';
              return (
                <div
                  key={e.nombre}
                  className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-all shadow-sm ${
                    entregado
                      ? 'bg-white border-emerald-200 hover:shadow-md'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      {entregado ? (
                        <FaCheckCircle className="text-emerald-500 text-base" />
                      ) : (
                        <FaClock className="text-gray-400 text-base" />
                      )}
                      <span className={`border px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${TONO_CHIP[e.tono] || TONO_CHIP.pendiente}`}>
                        {e.estado}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-[#112F5C] leading-snug">{e.nombre}</h5>
                    {entregado && e.archivo && (
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                        <FaFileAlt className="text-emerald-600" />
                        <span className="truncate">{e.archivo}</span>
                      </div>
                    )}
                  </div>
                  {entregado && (
                    <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-[10px]">
                      <span className="text-gray-400 font-semibold">{e.fecha}</span>
                      {e.calificacion != null && (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                          Nota {e.calificacion}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {soloLectura ? (
        <p className="text-[11px] text-slate-700 bg-slate-100 border border-slate-200 rounded-xl p-3 font-semibold leading-relaxed">
          <FaEye className="inline mr-1.5 text-slate-500" />
          Modo solo lectura: puede consultar el resultado y los entregables, pero no realizar ni reenviar este ítem.
        </p>
      ) : (
        <>
          <p className="text-[11px] text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium leading-relaxed">
            {esExamen ? (
              <>
                <strong>Importante:</strong> Al hacer clic en "Iniciar Prueba", el temporizador comenzará inmediatamente.
                Asegúrese de contar con una conexión estable a Internet. El examen se autocalificará al finalizar.
              </>
            ) : (
              <>
                <strong>Importante:</strong> Al subir un entregable, este quedará registrado con su archivo, fecha y
                calificación. Los entregables ya enviados aparecen arriba como recuadros completados.
              </>
            )}
          </p>

          <div className="flex justify-end">
            {esExamen ? (
              <button
                onClick={onIniciar}
                className="bg-[#B3282D] hover:bg-red-800 active:scale-95 text-white font-bold text-xs px-8 py-3 rounded-xl transition shadow-md flex items-center gap-2"
              >
                <FaPlayCircle /> Iniciar Prueba &gt;
              </button>
            ) : (
              <button
                onClick={onAbrirEntregable}
                className="bg-[#112F5C] hover:bg-blue-900 active:scale-95 text-white font-bold text-xs px-8 py-3 rounded-xl transition shadow-md flex items-center gap-2"
              >
                <FaFolderOpen /> Abrir entregable &gt;
              </button>
            )}
          </div>
          {notaEntregable && (
            <p className="text-[11px] text-blue-800 bg-blue-50 border border-blue-200 rounded-xl p-3 font-semibold text-right">
              {notaEntregable}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Metrica({ etiqueta, valor, destacado }) {
  return (
    <div className={`rounded-xl p-3 border ${destacado ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase">{etiqueta}</p>
      <p className={`text-sm font-bold mt-0.5 ${destacado ? 'text-emerald-700' : 'text-[#112F5C]'}`}>{valor}</p>
    </div>
  );
}

function CampoBloqueado({ etiqueta, valor }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-gray-600 mb-1">{etiqueta}</label>
      <div
        aria-readonly="true"
        className="w-full min-h-10 border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-100 flex items-center select-none cursor-not-allowed"
      >
        {valor}
      </div>
    </div>
  );
}
