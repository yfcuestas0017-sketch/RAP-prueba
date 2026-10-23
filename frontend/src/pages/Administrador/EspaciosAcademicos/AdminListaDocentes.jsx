import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaSyncAlt,
  FaExclamationCircle,
  FaUserTie,
  FaChevronRight
} from 'react-icons/fa';
import { fetchJSON } from '../../../services/api';

const LIMPIAR = (valor, defecto = '—') =>
  valor === undefined || valor === null || valor === '' ? defecto : valor;

export default function AdminListaDocentes() {
  const navigate = useNavigate();
  const location = useLocation();
  const estadoNav = location.state || {};

  const [registros, setRegistros] = useState(
    Array.isArray(estadoNav.registros) ? estadoNav.registros : null
  );
  const [etiqueta] = useState(estadoNav.etiqueta || 'todos los registros');
  const [loading, setLoading] = useState(!Array.isArray(estadoNav.registros));
  const [error, setError] = useState('');

  const cargarDocentes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const respuesta = await fetchJSON('/api/adminUsuarios/Docentes');
      setRegistros(Array.isArray(respuesta?.docentes) ? respuesta.docentes : []);
    } catch (cargaError) {
      console.error('Error cargando docentes:', cargaError);
      setError(cargaError.message || 'No fue posible consultar la información solicitada.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (registros === null) cargarDocentes();
  }, [registros, cargarDocentes]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando docentes...</p>
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
            onClick={cargarDocentes}
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
            <FaUserTie /> Docentes
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {lista.length} Docente{lista.length === 1 ? '' : 's'} · {etiqueta}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {lista.length === 0 ? (
          <p className="text-xs text-gray-500 p-8 text-center">
            No se encontraron docentes con los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#112F5C] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">NOMBRE</th>
                  <th className="px-4 py-3">CÓDIGO</th>
                  <th className="px-4 py-3">CORREO</th>
                  <th className="px-4 py-3">GRUPO</th>
                  <th className="px-4 py-3">JORNADA</th>
                  <th className="px-4 py-3">PERIODO</th>
                  <th className="px-4 py-3 text-center">ESTADO</th>
                  <th className="px-4 py-3 text-center">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lista.map((docente) => (
                  <tr key={docente.id_user} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-gray-800">
                      {docente.nombre} {docente.apellido}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(docente.id_user_institucional)}</td>
                    <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(docente.correo)}</td>
                    <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(docente.grupo, 'Sin asignar')}</td>
                    <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(docente.jornada)}</td>
                    <td className="px-4 py-3.5 text-gray-600">{LIMPIAR(docente.periodo)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          docente.estado
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {docente.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => navigate(`/admin/espacios/docente/${docente.id_user}`)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#112F5C] hover:text-blue-900 border border-gray-200 hover:border-[#112F5C] rounded-lg px-2.5 py-1.5 transition"
                      >
                        Ver grupo <FaChevronRight className="text-[8px]" />
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
