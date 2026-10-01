import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSyncAlt, 
  FaExclamationCircle, 
  FaClipboardList, 
  FaEdit,
  FaArrowRight,
  FaSearch,
  FaFilter,
  FaUsers,
  FaCheck,
  FaListUl
} from 'react-icons/fa';

const ESTADOS = ['BORRADOR', 'ACTIVA', 'CERRADA', 'ELIMINADA'];

const agruparGruposPorDocente = (filas) => {
  const mapa = new Map();
  (filas || []).forEach((f) => {
    if (f.id_grupo === null || f.id_grupo === undefined) return;
    const lista = mapa.get(f.id_user) || [];
    if (!lista.some((g) => Number(g.id_grupo) === Number(f.id_grupo))) {
      lista.push({
        id_grupo: f.id_grupo,
        nombre: f.grupo,
        jornada: f.jornada,
        periodo: f.periodo
      });
    }
    mapa.set(f.id_user, lista);
  });
  return mapa;
};

export default function AdminCrearPruebas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API = 'http://localhost:3000/api/admin/evaluaciones';
  const API_USUARIOS = 'http://localhost:3000/api/adminUsuarios';

  const [momentos, setMomentos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [gruposPorDocente, setGruposPorDocente] = useState(() => new Map());
  const [evaluaciones, setEvaluaciones] = useState([]);

  // Filtros de la tabla
  const [busqueda, setBusqueda] = useState('');
  const [filtroMomento, setFiltroMomento] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Formulario Paso 1: el título lo define el docente, no el administrador.
  const [nuevaPrueba, setNuevaPrueba] = useState({
    id_momento_evaluacion: '',
    id_docente: ''
  });

  const [gruposSeleccionados, setGruposSeleccionados] = useState([]);
  const [verTodosLosGrupos, setVerTodosLosGrupos] = useState(false);
  const [rapsPorSemestre, setRapsPorSemestre] = useState({});
  const [cargandoRaps, setCargandoRaps] = useState(false);
  const [creando, setCreando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [resMomentos, resGrupos, resDocentes, resEvaluaciones, resDocentesGrupos] = await Promise.all([
        fetch(`${API}/momentos`, { credentials: 'include' }),
        fetch(`${API}/grupos`, { credentials: 'include' }),
        fetch(`${API}/docentes`, { credentials: 'include' }),
        fetch(API, { credentials: 'include' }),
        fetch(`${API_USUARIOS}/Docentes`, { credentials: 'include' })
      ]);

      const [m, g, d, e, dg] = await Promise.all([
        resMomentos.json(), resGrupos.json(), resDocentes.json(), resEvaluaciones.json(), resDocentesGrupos.json()
      ]);

      if (!resMomentos.ok) throw new Error(m.message || m.mensaje || 'Error cargando momentos');
      if (!resGrupos.ok) throw new Error(g.message || g.mensaje || 'Error cargando grupos');
      if (!resDocentes.ok) throw new Error(d.message || d.mensaje || 'Error cargando docentes');
      if (!resEvaluaciones.ok) throw new Error(e.message || e.mensaje || 'Error cargando evaluaciones');

      setMomentos(m.data || []);
      setGrupos(g.data || []);
      setDocentes(d.data || []);
      setEvaluaciones(e.data || []);

      // La lista docente-grupo es opcional: si falla, el flujo sigue con todos los grupos.
      if (resDocentesGrupos.ok) {
        setGruposPorDocente(agruparGruposPorDocente(dg.docentes || dg.data || []));
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Un docente puede venir de /evaluaciones/docentes y sus grupos de /adminUsuarios/Docentes.
  // Se fusionan para que el select muestre siempre todos los docentes activos.
  const docentesFormulario = useMemo(() => {
    const mapa = new Map();
    docentes.forEach((d) => {
      mapa.set(d.id_user, {
        id_user: d.id_user,
        nombre: d.nombre,
        apellido: d.apellido,
        correo: d.correo,
        grupos: mapa.get(d.id_user)?.grupos || []
      });
    });
    gruposPorDocente.forEach((lista, idDocente) => {
      const actual = mapa.get(idDocente) || {
        id_user: idDocente,
        nombre: '',
        apellido: '',
        correo: '',
        grupos: []
      };
      actual.grupos = lista;
      mapa.set(idDocente, actual);
    });
    return [...mapa.values()].sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`)
    );
  }, [docentes, gruposPorDocente]);

  const docenteSeleccionado = useMemo(
    () => docentesFormulario.find((d) => String(d.id_user) === String(nuevaPrueba.id_docente)) || null,
    [docentesFormulario, nuevaPrueba.id_docente]
  );

  const momentoSeleccionado = useMemo(
    () => momentos.find((m) => String(m.id_momento_evaluacion) === String(nuevaPrueba.id_momento_evaluacion)) || null,
    [momentos, nuevaPrueba.id_momento_evaluacion]
  );

  const gruposDisponibles = useMemo(() => {
    const semestre = momentoSeleccionado ? Number(momentoSeleccionado.id_semestre) : null;
    // El administrador puede crear la prueba para cualquier grupo de la base de datos.
    if (verTodosLosGrupos) {
      return grupos.filter((g) => semestre === null || Number(g.id_semestre) === semestre);
    }
    if (!docenteSeleccionado) return [];
    return grupos
      .filter((g) => docenteSeleccionado.grupos.some((ug) => Number(ug.id_grupo) === Number(g.id_grupo)))
      .filter((g) => semestre === null || Number(g.id_semestre) === semestre);
  }, [docenteSeleccionado, grupos, momentoSeleccionado, verTodosLosGrupos]);

  const gruposElegidos = useMemo(
    () => gruposDisponibles.filter((g) => gruposSeleccionados.includes(String(g.id_grupo))),
    [gruposDisponibles, gruposSeleccionados]
  );

  const semestresDeLosGruposElegidos = useMemo(() => {
    return [...new Set(
      gruposElegidos.map((g) => Number(g.id_semestre)).filter((s) => Number.isFinite(s))
    )];
  }, [gruposElegidos]);

  // Los RAPs son por semestre, no por grupo: se cargan una vez por semestre.
  useEffect(() => {
    let cancelado = false;
    const pendientes = semestresDeLosGruposElegidos.filter((s) => !(s in rapsPorSemestre));
    if (pendientes.length === 0) return;

    const cargar = async () => {
      setCargandoRaps(true);
      const respuestas = await Promise.all(
        pendientes.map((s) => fetch(`${API}/raps/${s}`, { credentials: 'include' }))
      );
      const cuerpos = await Promise.all(respuestas.map((r) => r.json().catch(() => null)));
      if (cancelado) return;
      const nuevos = {};
      pendientes.forEach((s, i) => {
        nuevos[s] = respuestas[i].ok && cuerpos[i] ? cuerpos[i].data || [] : [];
      });
      setRapsPorSemestre((prev) => ({ ...prev, ...nuevos }));
      setCargandoRaps(false);
    };

    cargar();
    return () => { cancelado = true; };
  }, [semestresDeLosGruposElegidos, rapsPorSemestre]);

  const cambiarMomento = (valor) => {
    setNuevaPrueba((prev) => ({ ...prev, id_momento_evaluacion: valor }));
    setGruposSeleccionados([]);
  };

  const cambiarDocente = (valor) => {
    setNuevaPrueba((prev) => ({ ...prev, id_docente: valor }));
    setGruposSeleccionados([]);
  };

  const alternarGrupo = (idGrupo) => {
    const clave = String(idGrupo);
    setGruposSeleccionados((prev) =>
      prev.includes(clave) ? prev.filter((x) => x !== clave) : [...prev, clave]
    );
  };

  const alternarTodosLosGrupos = () => {
    const todas = gruposDisponibles.map((g) => String(g.id_grupo));
    const completo = gruposDisponibles.every((g) => gruposSeleccionados.includes(String(g.id_grupo)));
    setGruposSeleccionados(completo ? [] : todas);
  };

  const rapsDeGrupo = (grupo) => rapsPorSemestre[Number(grupo.id_semestre)] || [];

  const evaluacionesFiltradas = useMemo(() => {
    const t = busqueda.trim().toLowerCase();

    return evaluaciones.filter((p) => {
      if (t) {
        const texto = `${p.nombre} ${p.grupo} ${p.jornada} ${p.momento} ${p.docente_nombre} ${p.docente_apellido}`.toLowerCase();
        if (!texto.includes(t)) return false;
      }
      if (filtroMomento && Number(p.id_momento_evaluacion) !== Number(filtroMomento)) return false;
      if (filtroGrupo && Number(p.id_grupo) !== Number(filtroGrupo)) return false;
      if (filtroDocente && Number(p.id_docente) !== Number(filtroDocente)) return false;
      if (filtroEstado && p.estado !== filtroEstado) return false;
      return true;
    });
  }, [evaluaciones, busqueda, filtroMomento, filtroGrupo, filtroDocente, filtroEstado]);

  const hayFiltros = busqueda.trim() || filtroMomento || filtroGrupo || filtroDocente || filtroEstado;

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroMomento('');
    setFiltroGrupo('');
    setFiltroDocente('');
    setFiltroEstado('');
  };

  const tituloAutomatico = (grupo) =>
    `${momentoSeleccionado.nombre} — ${grupo ? grupo.nombre : ''}`.trim();

  const handleCrearPruebas = async (e) => {
    e.preventDefault();
    if (!nuevaPrueba.id_momento_evaluacion) {
      alert('Seleccione el momento de evaluación.');
      return;
    }
    if (!nuevaPrueba.id_docente) {
      alert('Seleccione el docente encargado.');
      return;
    }
    if (gruposSeleccionados.length === 0) {
      alert('Seleccione al menos un grupo.');
      return;
    }

    setCreando(true);
    setResultado(null);

    const creadas = [];
    const existentes = [];
    const fallidas = [];

    for (const idGrupo of gruposSeleccionados) {
      const grupo = grupos.find((g) => Number(g.id_grupo) === Number(idGrupo));
      try {
        const respuesta = await fetch(API, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: tituloAutomatico(grupo),
            id_grupo: Number(idGrupo),
            id_momento_evaluacion: Number(nuevaPrueba.id_momento_evaluacion),
            id_docente: Number(nuevaPrueba.id_docente),
            fecha_inicio: null,
            fecha_fin: null
          })
        });

        const res = await respuesta.json().catch(() => null);
        const nombreGrupo = grupo ? grupo.nombre : `grupo ${idGrupo}`;

        if (respuesta.ok && res && res.data && res.data.id_evaluacion) {
          creadas.push({ id: res.data.id_evaluacion, grupo: nombreGrupo });
        } else if (respuesta.status === 409 && res && res.id_evaluacion) {
          existentes.push({ id: res.id_evaluacion, grupo: nombreGrupo });
        } else {
          fallidas.push({
            grupo: nombreGrupo,
            motivo: (res && (res.message || res.mensaje)) || `Error ${respuesta.status}`
          });
        }
      } catch (err) {
        fallidas.push({ grupo: grupo ? grupo.nombre : `grupo ${idGrupo}`, motivo: err.message });
      }
    }

    setCreando(false);

    if (creadas.length === 0 && existentes.length === 0) {
      setResultado({ creadas, existentes, fallidas });
      return;
    }

    if (gruposSeleccionados.length === 1) {
      const destino = creadas[0] || existentes[0];
      navigate(`/admin/evaluaciones/editor/${destino.id}`);
      return;
    }

    setResultado({ creadas, existentes, fallidas });
    setGruposSeleccionados([]);
    setNuevaPrueba({ id_momento_evaluacion: '', id_docente: '' });
    await cargarDatos();
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
          <p className="text-gray-600 text-sm font-medium">Cargando datos desde la base de datos...</p>
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
          <button
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
      
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-[#112F5C]">Gestión y Creación de Pruebas RAP por Semestre</h1>
        <p className="text-xs text-gray-500 mt-0.5">Cree evaluaciones a partir del docente, el momento de evaluación y los grupos que tiene asignados. El título y las preguntas los redacta el docente.</p>
      </div>

      {/* FORMULARIO PASO 1 */}
      <form onSubmit={handleCrearPruebas} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-b pb-3">
          <h2 className="text-sm font-bold text-[#112F5C]">Paso 1: Configurar Nueva Evaluación Diagnóstica</h2>
          <span className="text-[10px] font-semibold text-gray-500">
            El título de la prueba lo define el docente
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Momento de Evaluación:</label>
            <select
              value={nuevaPrueba.id_momento_evaluacion}
              onChange={(e) => cambiarMomento(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
            >
              <option value="">Seleccione el momento...</option>
              {momentos.map((m) => (
                <option key={m.id_momento_evaluacion} value={m.id_momento_evaluacion}>
                  Semestre {m.semestre} — {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Docente Encargado:</label>
            <select
              value={nuevaPrueba.id_docente}
              onChange={(e) => cambiarDocente(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
            >
              <option value="">Seleccione el docente...</option>
              {docentesFormulario.map((d) => (
                <option key={d.id_user} value={d.id_user}>
                  {d.apellido} {d.nombre} — {d.grupos.length} grupo{d.grupos.length === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!nuevaPrueba.id_docente ? (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
            <FaUsers className="text-blue-600 text-base mt-0.5 shrink-0" />
            <p className="text-xs text-blue-900 leading-relaxed">
              Seleccione un docente para ver los grupos que tiene asignados y los RAPs de cada grupo.
              El administrador crea la evaluación; el docente redacta el título y las preguntas.
            </p>
          </div>
        ) : (
          <>
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FaListUl className="text-[#112F5C] text-xs" />
                  <span className="text-[11px] font-bold text-[#112F5C]">
                    Grupos asignados al docente
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {gruposElegidos.length} de {gruposDisponibles.length}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-[#112F5C] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={verTodosLosGrupos}
                      onChange={(e) => {
                        setVerTodosLosGrupos(e.target.checked);
                        setGruposSeleccionados([]);
                      }}
                      className="accent-[#112F5C]"
                    />
                    Ver todos los grupos
                  </label>
                  {gruposDisponibles.length > 0 && (
                    <button
                      type="button"
                      onClick={alternarTodosLosGrupos}
                      className="text-[10px] font-bold text-[#112F5C] hover:underline"
                    >
                      {gruposElegidos.length === gruposDisponibles.length
                        ? 'Deseleccionar todos'
                        : 'Seleccionar todos'}
                    </button>
                  )}
                </div>
              </div>

              {gruposDisponibles.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-xs font-semibold text-gray-500">
                    {momentoSeleccionado
                      ? 'Este docente no tiene grupos del semestre del momento seleccionado.'
                      : 'Este docente no tiene grupos asignados.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-4">
                  {gruposDisponibles.map((g) => {
                    const elegido = gruposSeleccionados.includes(String(g.id_grupo));
                    return (
                      <label
                        key={g.id_grupo}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                          elegido
                            ? 'bg-emerald-50 border-emerald-300'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={elegido}
                          onChange={() => alternarGrupo(g.id_grupo)}
                          className="accent-[#112F5C] mt-0.5 shrink-0"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11px] font-bold text-[#112F5C] leading-snug">
                            {g.nombre}
                          </span>
                          <span className="block text-[10px] text-gray-500 leading-snug mt-0.5">
                            {g.jornada} ({g.periodo}) — Semestre {g.semestre}
                          </span>
                          <span className="block text-[10px] text-gray-400 leading-snug mt-0.5">
                            {cargandoRaps
                              ? 'Cargando RAPs...'
                              : `${rapsDeGrupo(g).length} RAP${rapsDeGrupo(g).length === 1 ? '' : 's'} implementados`}
                          </span>
                        </span>
                        {elegido && <FaCheck className="text-emerald-600 text-xs mt-0.5 shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {gruposElegidos.length > 0 && (
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <FaClipboardList className="text-[#112F5C] text-xs" />
                  <span className="text-[11px] font-bold text-[#112F5C]">
                    RAPs disponibles en los grupos seleccionados
                  </span>
                </div>
                <div className="divide-y divide-gray-100">
                  {gruposElegidos.map((g) => {
                    const lista = rapsDeGrupo(g);
                    return (
                      <div key={g.id_grupo} className="px-4 py-3">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-bold text-[#112F5C]">{g.nombre}</span>
                          <span className="text-[10px] text-gray-500">
                            {g.jornada} ({g.periodo})
                          </span>
                        </div>
                        {cargandoRaps ? (
                          <p className="text-[10px] text-gray-400">Cargando RAPs...</p>
                        ) : lista.length === 0 ? (
                          <p className="text-[10px] text-gray-400">
                            Este grupo no tiene RAPs implementados para el semestre.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {lista.map((r) => (
                              <span
                                key={r.id_rap}
                                title={r.nombre}
                                className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-lg"
                              >
                                {r.codigo_rap}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Se creará <strong>{gruposElegidos.length}</strong> evaluación
                    {gruposElegidos.length === 1 ? '' : 'es'}, una por grupo. Los RAPs se vinculan en el
                    editor de cada prueba.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {resultado && (
          <div className="border border-gray-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-[#112F5C]">Resultado de la creación</h3>
              <button
                type="button"
                onClick={() => setResultado(null)}
                className="text-[10px] font-semibold text-[#B3282D] hover:underline"
              >
                Cerrar
              </button>
            </div>
            {[
              { lista: resultado.creadas, etiqueta: 'Creadas', color: 'text-emerald-700' },
              { lista: resultado.existentes, etiqueta: 'Ya existentes', color: 'text-amber-700' },
              { lista: resultado.fallidas, etiqueta: 'Fallidas', color: 'text-red-700' }
            ].map((bloque) =>
              bloque.lista.length === 0 ? null : (
                <div key={bloque.etiqueta} className="text-[10px] leading-relaxed">
                  <span className={`font-bold ${bloque.color}`}>
                    {bloque.lista.length} {bloque.etiqueta.toLowerCase()}:
                  </span>{' '}
                  <span className="text-gray-600">
                    {bloque.lista.map((x) => x.grupo).join(', ')}
                  </span>
                </div>
              )
            )}
            {resultado.creadas.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {resultado.creadas.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => navigate(`/admin/evaluaciones/editor/${x.id}`)}
                    className="bg-[#112F5C] hover:bg-blue-900 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg transition"
                  >
                    Abrir {x.grupo}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={creando}
            className="bg-[#008A52] hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow flex items-center gap-2"
          >
            {creando
              ? 'Creando...'
              : gruposElegidos.length > 1
                ? `Crear ${gruposElegidos.length} Pruebas y Abrir Editor`
                : 'Crear Prueba y Abrir Editor'}
            <FaArrowRight />
          </button>
        </div>
      </form>

      {/* TABLA DE EVALUACIONES REGISTRADAS */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-sm font-bold text-[#112F5C]">Pruebas Registradas</h2>
          <p className="text-[11px] text-gray-500">
            Mostrando <span className="font-bold text-[#112F5C]">{evaluacionesFiltradas.length}</span> de{' '}
            <span className="font-bold">{evaluaciones.length}</span> evaluaciones
          </p>
        </div>

        {/* BARRA DE FILTROS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-3">
          <div className="lg:col-span-2">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Buscar por nombre, grupo, momento o docente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
              />
            </div>
          </div>

          <div>
            <select
              value={filtroMomento}
              onChange={(e) => setFiltroMomento(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
            >
              <option value="">Todo momento/semestre</option>
              {momentos.map((m) => (
                <option key={m.id_momento_evaluacion} value={m.id_momento_evaluacion}>
                  Semestre {m.semestre} — {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
            >
              <option value="">Todo grupo</option>
              {grupos.map((g) => (
                <option key={g.id_grupo} value={g.id_grupo}>
                  {g.nombre} — {g.jornada}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filtroDocente}
              onChange={(e) => setFiltroDocente(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
            >
              <option value="">Todo docente</option>
              {docentes.map((d) => (
                <option key={d.id_user} value={d.id_user}>
                  {d.apellido} {d.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
            >
              <option value="">Todo estado</option>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {hayFiltros && (
          <div className="flex justify-end">
            <button
              onClick={limpiarFiltros}
              className="text-[11px] font-semibold text-[#B3282D] hover:underline flex items-center gap-1"
            >
              <FaFilter className="text-[10px]" /> Limpiar filtros
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          {evaluacionesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FaClipboardList className="text-4xl mx-auto mb-3 text-gray-300" />
              <p className="text-xs font-semibold text-gray-500">
                {evaluaciones.length === 0
                  ? 'Sin pruebas registradas en este momento.'
                  : 'No se encontraron evaluaciones con los filtros aplicados.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#112F5C] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">PRUEBA / EVALUACIÓN</th>
                  <th className="px-4 py-3">MOMENTO / SEMESTRE</th>
                  <th className="px-4 py-3">GRUPO / JORNADA</th>
                  <th className="px-4 py-3">DOCENTE</th>
                  <th className="px-4 py-3 text-center">RAPS</th>
                  <th className="px-4 py-3 text-center">ESTADO</th>
                  <th className="px-4 py-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {evaluacionesFiltradas.map((p, idx) => (
                  <tr key={p.id_evaluacion || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#112F5C]">{p.nombre}</td>
                    <td className="px-4 py-3.5 text-gray-600">Semestre {p.semestre} — {p.momento}</td>
                    <td className="px-4 py-3.5 text-gray-600">{p.grupo} — {p.jornada}</td>
                    <td className="px-4 py-3.5 text-gray-600">{p.docente_nombre} {p.docente_apellido}</td>
                    <td className="px-4 py-3.5 text-center text-gray-600">{p.cantidad_raps}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${colorEstado(p.estado)}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => navigate(`/admin/evaluaciones/editor/${p.id_evaluacion}`)}
                        className="bg-[#112F5C] hover:bg-blue-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                      >
                        <FaEdit className="inline mr-1" /> Editar Reactivos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}