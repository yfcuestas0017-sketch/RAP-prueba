import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSyncAlt, 
  FaExclamationCircle, 
  FaClipboardList, 
  FaEdit,
  FaArrowRight,
  FaSearch,
  FaFilter
} from 'react-icons/fa';
import { API_BASE_URL } from '../../../config';

const ESTADOS = ['BORRADOR', 'ACTIVA', 'CERRADA', 'ELIMINADA'];

export default function AdminCrearPruebas() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API = `${API_BASE_URL}/api/admin/evaluaciones`;

  const [momentos, setMomentos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);

  // Filtros de la tabla
  const [busqueda, setBusqueda] = useState('');
  const [filtroMomento, setFiltroMomento] = useState('');
  const [filtroGrupo, setFiltroGrupo] = useState('');
  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // Formulario Paso 1: Configuración de la evaluación
  const [nuevaPrueba, setNuevaPrueba] = useState({
    nombre: '',
    id_grupo: '',
    id_momento_evaluacion: '',
    id_docente: ''
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');

      const [resMomentos, resGrupos, resDocentes, resEvaluaciones] = await Promise.all([
        fetch(`${API}/momentos`, { credentials: 'include' }),
        fetch(`${API}/grupos`, { credentials: 'include' }),
        fetch(`${API}/docentes`, { credentials: 'include' }),
        fetch(API, { credentials: 'include' })
      ]);

      const [m, g, d, e] = await Promise.all([
        resMomentos.json(), resGrupos.json(), resDocentes.json(), resEvaluaciones.json()
      ]);

      if (!resMomentos.ok) throw new Error(m.mensaje || 'Error cargando momentos');
      if (!resGrupos.ok) throw new Error(g.mensaje || 'Error cargando grupos');
      if (!resDocentes.ok) throw new Error(d.mensaje || 'Error cargando docentes');
      if (!resEvaluaciones.ok) throw new Error(e.mensaje || 'Error cargando evaluaciones');

      setMomentos(m.data || []);
      setGrupos(g.data || []);
      setDocentes(d.data || []);
      setEvaluaciones(e.data || []);
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

  const handleCrearEIngresarPreguntas = async (e) => {
    e.preventDefault();
    if (!nuevaPrueba.nombre.trim()) {
      alert('Ingrese el nombre o título de la prueba.');
      return;
    }
    if (!nuevaPrueba.id_grupo) {
      alert('Seleccione el grupo.');
      return;
    }
    if (!nuevaPrueba.id_momento_evaluacion) {
      alert('Seleccione el momento de evaluación.');
      return;
    }
    if (!nuevaPrueba.id_docente) {
      alert('Seleccione el docente encargado.');
      return;
    }

    try {
      const respuesta = await fetch(API, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nuevaPrueba.nombre,
          id_grupo: Number(nuevaPrueba.id_grupo),
          id_momento_evaluacion: Number(nuevaPrueba.id_momento_evaluacion),
          id_docente: Number(nuevaPrueba.id_docente),
          fecha_inicio: null,
          fecha_fin: null
        })
      });

      const res = await respuesta.json();
      if (!respuesta.ok) {
        if (respuesta.status === 409 && res.id_evaluacion) {
          alert(`${res.mensaje} — Abriendo la evaluación existente.`);
          navigate(`/admin/evaluaciones/editor/${res.id_evaluacion}`);
          return;
        }
        throw new Error(res.mensaje || 'Error al crear la prueba');
      }

      // Redirigir al Paso 2 con el ID generado en la BD
      navigate(`/admin/evaluaciones/editor/${res.data.id_evaluacion}`);
    } catch (err) {
      alert(err.message);
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
        <p className="text-xs text-gray-500 mt-0.5">Cree evaluaciones asociando grupo, momento de evaluación y docente encargado.</p>
      </div>

      {/* FORMULARIO PASO 1 */}
      <form onSubmit={handleCrearEIngresarPreguntas} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#112F5C] border-b pb-3">Paso 1: Configurar Nueva Evaluación Diagnóstica</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Momento de Evaluación:</label>
            <select
              value={nuevaPrueba.id_momento_evaluacion}
              onChange={(e) => setNuevaPrueba({ ...nuevaPrueba, id_momento_evaluacion: e.target.value })}
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
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Grupo / Jornada:</label>
            <select
              value={nuevaPrueba.id_grupo}
              onChange={(e) => setNuevaPrueba({ ...nuevaPrueba, id_grupo: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
            >
              <option value="">Seleccione el grupo...</option>
              {grupos.map((g) => (
                <option key={g.id_grupo} value={g.id_grupo}>
                  {g.nombre} — {g.jornada} ({g.periodo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Docente Encargado:</label>
            <select
              value={nuevaPrueba.id_docente}
              onChange={(e) => setNuevaPrueba({ ...nuevaPrueba, id_docente: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
            >
              <option value="">Seleccione el docente...</option>
              {docentes.map((d) => (
                <option key={d.id_user} value={d.id_user}>
                  {d.apellido} {d.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Nombre / Título de la Prueba:</label>
            <input
              type="text"
              placeholder="Ej. Evaluación Parcial II — Arquitectura UML"
              value={nuevaPrueba.nombre}
              onChange={(e) => setNuevaPrueba({ ...nuevaPrueba, nombre: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-sky-400 rounded-xl text-xs text-[#112F5C] font-semibold focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="bg-[#008A52] hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition shadow flex items-center gap-2"
          >
            Crear Prueba e Ingresar Reactivos <FaArrowRight />
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