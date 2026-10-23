import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaSyncAlt,
  FaExclamationCircle,
  FaUserTie,
  FaUserGraduate,
  FaChevronRight
} from 'react-icons/fa';
import { fetchJSON } from '../../../services/api';

const LIMPIAR = (valor, defecto = '—') =>
  valor === undefined || valor === null || valor === '' ? defecto : valor;

const Dato = ({ etiqueta, valor }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 mb-1">{etiqueta}</label>
    <p className="text-xs font-bold text-[#112F5C] bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 break-words">
      {valor}
    </p>
  </div>
);

export default function AdminDetalleDocente() {
  const { idUser } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [docente, setDocente] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);

  const cargarDetalle = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [respuestaDocentes, respuestaEstudiantes] = await Promise.all([
        fetchJSON('/api/adminUsuarios/Docentes'),
        fetchJSON('/api/adminUsuarios/Estudiantes')
      ]);

      const listaDocentes = Array.isArray(respuestaDocentes?.docentes) ? respuestaDocentes.docentes : [];
      const listaEstudiantes = Array.isArray(respuestaEstudiantes?.estudiantes) ? respuestaEstudiantes.estudiantes : [];

      const encontrado = listaDocentes.find((d) => String(d.id_user) === String(idUser)) || null;
      setDocente(encontrado);
      setEstudiantes(listaEstudiantes);
    } catch (cargaError) {
      console.error('Error cargando el detalle del docente:', cargaError);
      setError(cargaError.message || 'No fue posible consultar la información solicitada.');
    } finally {
      setLoading(false);
    }
  }, [idUser]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const estudiantesDelGrupo = useMemo(() => {
    if (!docente) return [];
    if (docente.id_grupo) {
      return estudiantes.filter((e) => String(e.id_grupo) === String(docente.id_grupo));
    }
    if (docente.grupo) {
      return estudiantes.filter(
        (e) => String(e.grupo || '').trim() === String(docente.grupo).trim()
      );
    }
    return [];
  }, [docente, estudiantes]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando detalle del docente...</p>
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
            onClick={cargarDetalle}
            className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow"
          >
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  if (!docente) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <FaUserTie className="text-4xl text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#112F5C] mb-2">Docente no encontrado</h2>
          <p className="text-xs text-gray-500 mb-6">No existe un docente asociado al identificador {idUser}.</p>
          <button
            onClick={() => navigate('/admin/espacios')}
            className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow"
          >
            <FaArrowLeft className="inline mr-2" /> Volver a espacios académicos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-fade-in space-y-6">

      {/* Botón regresar */}
      <button
        onClick={() => navigate('/admin/espacios')}
        className="bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] text-xs font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-2"
      >
        <FaArrowLeft /> Volver a espacios académicos
      </button>

      {/* Encabezado del docente */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#112F5C] text-white font-bold text-lg flex items-center justify-center shrink-0">
            <FaUserTie />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#112F5C]">{docente.nombre} {docente.apellido}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Planta docente · {LIMPIAR(docente.grupo, 'Sin grupo asignado')}</p>
            <span
              className={`inline-block mt-2 text-[10px] font-bold px-3 py-0.5 rounded-full border ${
                docente.estado
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {docente.estado ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Información del docente */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#112F5C] border-b pb-3">Información del Docente</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Dato etiqueta="Nombre completo" valor={`${docente.nombre || ''} ${docente.apellido || ''}`.trim() || '—'} />
          <Dato etiqueta="Código institucional" valor={LIMPIAR(docente.id_user_institucional)} />
          <Dato etiqueta="Correo" valor={LIMPIAR(docente.correo)} />
          <Dato etiqueta="Rol" valor={LIMPIAR(docente.rol, 'Docente')} />
          <Dato etiqueta="Grupo" valor={LIMPIAR(docente.grupo, 'Sin asignar')} />
          <Dato etiqueta="Jornada" valor={LIMPIAR(docente.jornada)} />
          <Dato etiqueta="Periodo" valor={LIMPIAR(docente.periodo)} />
        </div>
      </div>

      {/* Estudiantes del grupo */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#112F5C] text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaUserGraduate className="text-lg" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wide">Estudiantes del Grupo</h2>
              <p className="text-[10px] text-gray-300 mt-0.5">
                {estudiantesDelGrupo.length} Estudiante{estudiantesDelGrupo.length === 1 ? '' : 's'} · {LIMPIAR(docente.grupo, 'Sin grupo asignado')}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {estudiantesDelGrupo.length === 0 ? (
            <p className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
              No se encontraron estudiantes asociados a este docente.
            </p>
          ) : (
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
              {estudiantesDelGrupo.map((estudiante) => (
                <button
                  key={estudiante.id_user}
                  type="button"
                  onClick={() => navigate(`/admin/espacios/estudiante/${estudiante.id_user}`)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-white hover:bg-gray-50 transition group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate group-hover:text-[#0074B7]">
                      {estudiante.nombre} {estudiante.apellido}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">
                      Código: {LIMPIAR(estudiante.id_user_institucional)} · Semestre: {LIMPIAR(estudiante.nombre_semestre, estudiante.semestre ? `${estudiante.semestre}.º Semestre` : '—')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        estudiante.estado
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {estudiante.estado ? 'Activo' : 'Inactivo'}
                    </span>
                    <FaChevronRight className="text-gray-300 group-hover:text-[#0074B7] text-[10px] transition" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
