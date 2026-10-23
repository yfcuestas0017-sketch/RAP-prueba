import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaSyncAlt,
  FaExclamationCircle,
  FaUserGraduate
} from 'react-icons/fa';
import { fetchJSON } from '../../../services/api';

const LIMPIAR = (valor, defecto = '—') =>
  valor === undefined || valor === null || valor === '' ? defecto : valor;

const Dato = ({ etiqueta, valor }) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-500 mb-1">{etiqueta}</label>
    <p className="text-xs font-bold text-[#0074B7] bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 break-words">
      {valor}
    </p>
  </div>
);

export default function AdminDetalleEstudiante() {
  const { idUser } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estudiante, setEstudiante] = useState(null);

  const cargarDetalle = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const respuestaEstudiantes = await fetchJSON('/api/adminUsuarios/Estudiantes');
      const listaEstudiantes = Array.isArray(respuestaEstudiantes?.estudiantes)
        ? respuestaEstudiantes.estudiantes
        : [];
      const encontrado = listaEstudiantes.find((e) => String(e.id_user) === String(idUser)) || null;
      setEstudiante(encontrado);
    } catch (cargaError) {
      console.error('Error cargando el detalle del estudiante:', cargaError);
      setError(cargaError.message || 'No fue posible consultar la información solicitada.');
    } finally {
      setLoading(false);
    }
  }, [idUser]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#0074B7] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando detalle del estudiante...</p>
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

  if (!estudiante) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <FaUserGraduate className="text-4xl text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#112F5C] mb-2">Estudiante no encontrado</h2>
          <p className="text-xs text-gray-500 mb-6">No existe un estudiante asociado al identificador {idUser}.</p>
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

  const etiquetaSemestre = LIMPIAR(
    estudiante.nombre_semestre,
    estudiante.semestre ? `${estudiante.semestre}.º Semestre` : '—'
  );

  return (
    <div className="w-full animate-fade-in space-y-6">

      {/* Botón regresar */}
      <button
        onClick={() => navigate('/admin/espacios')}
        className="bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] text-xs font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-2"
      >
        <FaArrowLeft /> Volver a espacios académicos
      </button>

      {/* Encabezado del estudiante */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#0074B7] text-white font-bold text-lg flex items-center justify-center shrink-0">
            <FaUserGraduate />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#112F5C]">{estudiante.nombre} {estudiante.apellido}</h1>
            <p className="text-xs text-gray-500 mt-0.5">Expediente académico · {LIMPIAR(estudiante.grupo, 'Sin grupo asignado')}</p>
            <span
              className={`inline-block mt-2 text-[10px] font-bold px-3 py-0.5 rounded-full border ${
                estudiante.estado
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {estudiante.estado ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Información del estudiante */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#112F5C] border-b pb-3">Información del Estudiante</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Dato etiqueta="Nombre completo" valor={`${estudiante.nombre || ''} ${estudiante.apellido || ''}`.trim() || '—'} />
          <Dato etiqueta="Código institucional" valor={LIMPIAR(estudiante.id_user_institucional)} />
          <Dato etiqueta="Correo" valor={LIMPIAR(estudiante.correo)} />
          <Dato etiqueta="Rol" valor={LIMPIAR(estudiante.rol, 'Estudiante')} />
          <Dato etiqueta="Semestre" valor={etiquetaSemestre} />
          <Dato etiqueta="Grupo" valor={LIMPIAR(estudiante.grupo, 'Sin asignar')} />
          <Dato etiqueta="Jornada" valor={LIMPIAR(estudiante.jornada)} />
          <Dato etiqueta="Periodo" valor={LIMPIAR(estudiante.periodo)} />
        </div>
      </div>

    </div>
  );
}
