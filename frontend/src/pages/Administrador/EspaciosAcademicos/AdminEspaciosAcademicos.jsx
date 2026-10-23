import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaCheck,
  FaTimes,
  FaUserTie,
  FaUserGraduate
} from 'react-icons/fa';
import { fetchJSON } from '../../../services/api';
import GestionUsuariosModal from './GestionUsuariosModal';
import './AdminEspaciosAcademicos.css';

const FILTROS_VACIOS = {
  id_programa: '',
  id_semestre: '',
  periodo: ''
};

const LIMPIAR = (valor, defecto = '—') =>
  valor === undefined || valor === null || valor === '' ? defecto : valor;

export default function AdminEspaciosAcademicos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Catálogos (para los filtros)
  const [programas, setProgramas] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [espacios, setEspacios] = useState([]);

  // Datos reales
  const [docentes, setDocentes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);

  // Modal de gestión (importar / asignar)
  const [modalTipo, setModalTipo] = useState(null);

  // Filtros (pendientes y aplicados)
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_VACIOS);

  const cargarEspaciosAcademicos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [catalogos, respuestaDocentes, respuestaEstudiantes] = await Promise.all([
        fetchJSON('/api/admin/reportes/filtros'),
        fetchJSON('/api/adminUsuarios/Docentes'),
        fetchJSON('/api/adminUsuarios/Estudiantes')
      ]);

      const data = catalogos?.data || {};
      setProgramas(Array.isArray(data.programas) ? data.programas : []);
      setSemestres(Array.isArray(data.semestres) ? data.semestres : []);
      setGrupos(Array.isArray(data.grupos) ? data.grupos : []);
      setEspacios(Array.isArray(data.espacios) ? data.espacios : []);

      setDocentes(Array.isArray(respuestaDocentes?.docentes) ? respuestaDocentes.docentes : []);
      setEstudiantes(Array.isArray(respuestaEstudiantes?.estudiantes) ? respuestaEstudiantes.estudiantes : []);
    } catch (cargaError) {
      console.error('Error cargando espacios académicos:', cargaError);
      setError(cargaError.message || 'No fue posible consultar la información solicitada.');
      setDocentes([]);
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEspaciosAcademicos();
  }, [cargarEspaciosAcademicos]);

  const semestrePorGrupo = useMemo(() => {
    const mapa = new Map();
    grupos.forEach((grupo) => {
      if (grupo.nombre) mapa.set(String(grupo.nombre).trim(), grupo);
    });
    return mapa;
  }, [grupos]);

  const semestrePorId = useMemo(() => {
    const mapa = new Map();
    semestres.forEach((semestre) => mapa.set(String(semestre.id_semestre), semestre));
    return mapa;
  }, [semestres]);

  const periodosDisponibles = useMemo(() => {
    const valores = new Set();
    [...grupos.map((g) => g.periodo), ...docentes.map((d) => d.periodo), ...estudiantes.map((e) => e.periodo)]
      .forEach((periodo) => {
        if (periodo) valores.add(String(periodo));
      });
    return Array.from(valores).sort().reverse();
  }, [grupos, docentes, estudiantes]);

  const semestresDelPrograma = useMemo(() => {
    if (!filtros.id_programa) return semestres;
    return semestres.filter((s) => String(s.id_programa) === String(filtros.id_programa));
  }, [semestres, filtros.id_programa]);

  const aplicarFiltros = () => setFiltrosAplicados({ ...filtros });

  const limpiarFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    setFiltrosAplicados(FILTROS_VACIOS);
  };

  const docentesFiltrados = useMemo(() => {
    const { id_programa, id_semestre, periodo } = filtrosAplicados;
    return docentes.filter((docente) => {
      if (periodo && String(docente.periodo || '') !== periodo) return false;

      if (id_semestre || id_programa) {
        const grupo = docente.grupo ? semestrePorGrupo.get(String(docente.grupo).trim()) : null;
        if (!grupo) return false;
        if (id_semestre && String(grupo.id_semestre) !== String(id_semestre)) return false;
        if (id_programa) {
          const semestre = semestrePorId.get(String(grupo.id_semestre));
          if (!semestre || String(semestre.id_programa) !== String(id_programa)) return false;
        }
      }
      return true;
    });
  }, [docentes, filtrosAplicados, semestrePorGrupo, semestrePorId]);

  const estudiantesFiltrados = useMemo(() => {
    const { id_programa, id_semestre, periodo } = filtrosAplicados;
    return estudiantes.filter((estudiante) => {
      if (periodo && String(estudiante.periodo || '') !== periodo) return false;

      if (id_semestre && String(estudiante.id_semestre || '') !== String(id_semestre)) return false;

      if (id_programa) {
        const semestre = semestrePorId.get(String(estudiante.id_semestre));
        if (!semestre || String(semestre.id_programa) !== String(id_programa)) return false;
      }
      return true;
    });
  }, [estudiantes, filtrosAplicados, semestrePorId]);

  const etiquetaSemestre = useMemo(() => {
    if (filtrosAplicados.id_semestre) {
      const semestre = semestrePorId.get(String(filtrosAplicados.id_semestre));
      if (semestre) return semestre.nombre || `${semestre.numero}.º Semestre`;
    }
    if (filtrosAplicados.id_programa) {
      const programa = programas.find((p) => String(p.id_programa) === String(filtrosAplicados.id_programa));
      if (programa) return programa.nombre;
    }
    return filtrosAplicados.periodo ? `Periodo ${filtrosAplicados.periodo}` : 'todos los registros';
  }, [filtrosAplicados, semestrePorId, programas]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando espacios académicos...</p>
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
            onClick={cargarEspaciosAcademicos}
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

      {/* Título Principal */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#112F5C]">Carga y Asignaciones</h1>
          <p className="text-xs text-gray-500 mt-0.5">Consulta y desglose simultáneo de la planta docente y los grupos de estudiantes por semestre.</p>
        </div>
        <button
          onClick={cargarEspaciosAcademicos}
          className="bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] text-xs font-bold px-4 py-2 rounded-xl transition shadow flex items-center justify-center gap-2 shrink-0 w-full md:w-auto"
        >
          <FaSyncAlt /> Actualizar
        </button>
      </div>

      {/* FILTROS SUPERIORES */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Programa Académico:</label>
            <select
              value={filtros.id_programa}
              onChange={(e) => {
                const id_programa = e.target.value;
                setFiltros((actual) => ({
                  ...actual,
                  id_programa,
                  id_semestre: id_programa && actual.id_semestre
                    && !semestres.some((s) => String(s.id_semestre) === actual.id_semestre && String(s.id_programa) === id_programa)
                    ? ''
                    : actual.id_semestre
                }));
              }}
              className="w-full px-3.5 py-2 bg-white border border-sky-400 font-semibold text-[#112F5C] rounded-xl text-xs focus:outline-none"
            >
              <option value="">Todos los programas</option>
              {programas.map((programa) => (
                <option key={programa.id_programa} value={programa.id_programa}>
                  {programa.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Filtro Semestre Académico:</label>
            <select
              value={filtros.id_semestre}
              onChange={(e) => setFiltros((actual) => ({ ...actual, id_semestre: e.target.value }))}
              className="w-full px-3.5 py-2 bg-white border border-sky-400 font-semibold text-[#112F5C] rounded-xl text-xs focus:outline-none"
            >
              <option value="">Todos los semestres</option>
              {semestresDelPrograma.map((semestre) => (
                <option key={semestre.id_semestre} value={semestre.id_semestre}>
                  {semestre.nombre || `${semestre.numero}.º Semestre`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Periodo Lectivo:</label>
            <select
              value={filtros.periodo}
              onChange={(e) => setFiltros((actual) => ({ ...actual, periodo: e.target.value }))}
              className="w-full px-3.5 py-2 bg-white border border-sky-400 font-semibold text-[#112F5C] rounded-xl text-xs focus:outline-none"
            >
              <option value="">Todos los periodos</option>
              {periodosDisponibles.map((periodo) => (
                <option key={periodo} value={periodo}>{periodo}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto">
          <button
            onClick={limpiarFiltros}
            className="flex-1 lg:flex-none bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold px-5 py-2.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            <FaTimes /> Borrar
          </button>
          <button
            onClick={aplicarFiltros}
            className="flex-1 lg:flex-none bg-[#008A52] hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            <FaCheck /> Aplicar Filtro
          </button>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL (GRID 2 COLUMNAS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

        {/* PANEL 1: PLANTA DOCENTE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#112F5C] text-white p-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0">
              <FaUserTie />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">Planta Docente</h2>
              <p className="text-[10px] text-gray-300 mt-0.5">
                {docentesFiltrados.length} Docente{docentesFiltrados.length === 1 ? '' : 's'} · {etiquetaSemestre}
              </p>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-3 flex-1">
            <p className="text-xs text-gray-500">
              Abra la interfaz de docentes para consultar la información de cada docente y los estudiantes de su grupo.
            </p>
            <button
              onClick={() => navigate('/admin/espacios/docentes', {
                state: { registros: docentesFiltrados, etiqueta: etiquetaSemestre }
              })}
              className="w-full bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs py-3 rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              <FaUserTie /> Ver Docentes
            </button>
            <button
              onClick={() => setModalTipo('docente')}
              className="w-full bg-white border border-[#112F5C] text-[#112F5C] hover:bg-blue-50 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              + Asignar / Gestionar Nuevo Docente
            </button>
          </div>
        </div>

        {/* PANEL 2: GRUPO ESTUDIANTES */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#0074B7] text-white p-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-lg shrink-0">
              <FaUserGraduate />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">Grupo Estudiantes</h2>
              <p className="text-[10px] text-sky-100 mt-0.5">
                {estudiantesFiltrados.length} Estudiante{estudiantesFiltrados.length === 1 ? '' : 's'} · {etiquetaSemestre}
              </p>
            </div>
          </div>

          <div className="p-5 flex flex-col gap-3 flex-1">
            <p className="text-xs text-gray-500">
              Abra la interfaz de estudiantes para consultar el expediente académico de cada estudiante.
            </p>
            <button
              onClick={() => navigate('/admin/espacios/estudiantes', {
                state: { registros: estudiantesFiltrados, etiqueta: etiquetaSemestre }
              })}
              className="w-full bg-[#0074B7] hover:bg-sky-700 text-white font-bold text-xs py-3 rounded-xl transition shadow flex items-center justify-center gap-2"
            >
              <FaUserGraduate /> Ver Estudiantes
            </button>
            <button
              onClick={() => setModalTipo('estudiante')}
              className="w-full bg-white border border-[#0074B7] text-[#0074B7] hover:bg-sky-50 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              + Matricular Nuevo Estudiante en Semestre
            </button>
          </div>
        </div>

      </div>

      {modalTipo && (
        <GestionUsuariosModal
          tipo={modalTipo}
          programas={programas}
          semestres={semestres}
          grupos={grupos}
          espacios={espacios}
          onImportado={cargarEspaciosAcademicos}
          onClose={() => setModalTipo(null)}
        />
      )}

    </div>
  );
}
