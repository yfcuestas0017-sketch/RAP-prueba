import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaSyncAlt,
  FaExclamationCircle,
  FaUserGraduate,
  FaChevronRight
} from 'react-icons/fa';
import { fetchJSON } from '../../../services/api';

const LIMPIAR = (valor, defecto = '—') =>
  valor === undefined || valor === null || valor === '' ? defecto : valor;

export default function AdminListaEstudiantes() {
  const navigate = useNavigate();
  const location = useLocation();
  const estadoNav = location.state || {};

  const [registros, setRegistros] = useState(
    Array.isArray(estadoNav.registros) ? estadoNav.registros : null
  );
  const [etiqueta] = useState(estadoNav.etiqueta || 'todos los registros');
  const [loading, setLoading] = useState(!Array.isArray(estadoNav.registros));
  const [error, setError] = useState('');

  const cargarEstudiantes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const respuesta = await fetchJSON('/api/adminUsuarios/Estudiantes');
      setRegistros(Array.isArray(respuesta?.estudiantes) ? respuesta.estudiantes : []);
    } catch (cargaError) {
      console.error('Error cargando estudiantes:', cargaError);
      setError(cargaError.message || 'No fue posible consultar la información solicitada.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (registros === null) cargarEstudiantes();
  }, [registros, cargarEstudiantes]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#0074B7] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando estudiantes...</p>
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
            onClick={cargarEstudiantes}
            className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow"
          >
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  const lista = registros || [];

  return (
    <div className="w-full animate-fade-in space-y-6">

      <button
        onClick={() => navigate('/admin/espacios')}
        className="bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] text-xs font-bold px-4 py-2 rounded-xl transition shadow flex items-center gap-2"
      >
        <FaArrowLeft /> Volver a espacios académicos
      </button>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#112F5C] flex items-center gap-2">
            <FaUserGraduate /> Estudiantes
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {lista.length} Estudiante{lista.length === 1 ? '' : 's'} · {etiqueta}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {lista.length === 0 ? (
          <p className="text-xs text-gray-500 p-8 text-center">
            No se encontraron estudiantes con los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0074B7] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">NOMBRE</th>
                  <th className="px-4 py-3">CÓDIGO</th>
                  <th className="px-4 py-3">CORREO</th>
                  <th className="px-4 py-3">SEMESTRE</th>
                  <th className="px-4 py-3">GRUPO</th>
                  <th className="px-4 py-3">JORNADA</th>
                  <th className="px-4 py-3">PERIODO</th>
                  <th className="px-4 py-3 text-center">ESTADO</th>
                  <th className="px-4 py-3 text-center">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((estudiante) => (
                  <tr key={estudiante.id_user} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-gray-800">
                      {estudiante.nombre} {estudiante.apellido}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(estudiante.id_user_institucional)}</td>
                    <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(estudiante.correo)}</td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {LIMPIAR(estudiante.nombre_semestre, estudiante.semestre ? `${estudiante.semestre}.º Semestre` : '—')}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(estudiante.grupo, 'Sin asignar')}</td>
                    <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(estudiante.jornada)}</td>
                    <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(estudiante.periodo)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          estudiante.estado
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {estudiante.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => navigate(`/admin/espacios/estudiante/${estudiante.id_user}`)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0074B7] hover:text-sky-700 border border-gray-200 hover:border-[#0074B7] rounded-lg px-2.5 py-1.5 transition"
                      >
                        Ver perfil <FaChevronRight className="text-[8px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
