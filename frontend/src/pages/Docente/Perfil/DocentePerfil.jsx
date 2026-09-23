import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaBook, 
  FaSyncAlt, 
  FaExclamationCircle, 
  FaCheckCircle,
  FaShieldAlt,
  FaClock,
  FaBuilding,
  FaInfoCircle
} from 'react-icons/fa';
import "./DocentePerfil.css";
import { API_BASE_URL } from '../../../config';

export default function DocentePerfil() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Datos reales desde PostgreSQL
  const [perfil, setPerfil] = useState({
    nombre: '',
    documento: '',
    correo: '',
    telefono: '',
    codigoDocente: '',
    facultadPrograma: '',
    horarioAtencion: '',
    oficina: '',
    rol: '',
    estado: '',
    cargo: ''
  });

  const [asignaturas, setAsignaturas] = useState([]);
  const [seguridad, setSeguridad] = useState({
    ultimoAcceso: '',
    ip: '',
    dispositivo: ''
  });

  const cargarPerfilDocente = async () => {
    try {
      setLoading(true);
      setError('');

      const respuesta = await fetch(`${API_BASE_URL}/api/docente/Perfil`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || 'Error al obtener el perfil del docente');
      }

      if (resultado.perfil) {
        const p = resultado.perfil;
        setPerfil({
          nombre: `${p.nombre || ''} ${p.apellido || ''}`.trim(),
          documento: p.id_user_institucional || '—',
          correo: p.correo || '—',
          telefono: p.telefono || '—',
          codigoDocente: p.codigo_docente || '—',
          facultadPrograma: p.facultad_programa || '—',
          horarioAtencion: p.horario_atencion || '—',
          oficina: p.oficina || '—',
          rol: p.rol || '—',
          estado: p.estado === true ? 'Activo' : p.estado === false ? 'Inactivo' : '—',
          cargo: p.tipo_contrato || '—'
        });
      }
      if (resultado.asignaturas) setAsignaturas(resultado.asignaturas);
      if (resultado.seguridad) setSeguridad(resultado.seguridad);

    } catch (err) {
      console.error('Error cargando perfil docente:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfilDocente();
  }, []);

  const obtenerIniciales = (nombreCompleto) => {
    if (!nombreCompleto) return '—';
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    return nombreCompleto.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando perfil docente desde la base de datos...</p>
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
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-6 font-mono text-left">{error}</p>
          <button
            onClick={cargarPerfilDocente}
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
      
      {/* Encabezado Principal */}
      <div>
        <h1 className="text-2xl font-bold text-[#112F5C]">Perfil del Docente y Carga Académica</h1>
        <p className="text-xs text-gray-500 mt-0.5">Consulte su información personal institucional, asignaturas a cargo y registro de sesión.</p>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <FaCheckCircle className="text-emerald-600 text-base shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Tarjeta de Resumen Superior */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-[#112F5C] text-white font-bold text-xl flex items-center justify-center shrink-0 border-2 border-gray-100 shadow-sm">
            {obtenerIniciales(perfil.nombre)}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#112F5C]">{perfil.nombre || 'Docente'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{perfil.facultadPrograma || 'Universidad CESMAG'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-3 py-0.5 rounded-full">
                {perfil.rol || 'Rol: Docente'}
              </span>
              <span className={`${perfil.estado === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'} text-[10px] font-bold px-3 py-0.5 rounded-full`}>
                {perfil.estado || 'Estado: Activo'}
              </span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-0.5 rounded-full">
                {perfil.cargo}
              </span>
              {perfil.codigoDocente && perfil.codigoDocente !== '—' && (
                <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-3 py-0.5 rounded-full">
                  Código: {perfil.codigoDocente}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
          <p className="text-[11px] text-gray-400 font-medium">Fotografía institucional parametrizada</p>
        </div>
      </div>

      {/* Bloque de Información Personal y Asignaturas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Datos Docente (solo lectura: el backend no expone endpoint de actualización) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-[#112F5C]">Información Docente e Institucional</h3>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
              <FaInfoCircle /> Solo lectura
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Nombre Completo:</label>
              <input
                type="text"
                readOnly
                value={perfil.nombre}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Documento de Identidad:</label>
              <input
                type="text"
                readOnly
                value={perfil.documento}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Correo Institucional (Protegido):</label>
              <input
                type="email"
                readOnly
                value={perfil.correo}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Teléfono de Contacto:</label>
              <input
                type="text"
                readOnly
                value={perfil.telefono}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Facultad / Programa:</label>
              <input
                type="text"
                readOnly
                value={perfil.facultadPrograma}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Horario de Atención / Asesoría:</label>
              <input
                type="text"
                readOnly
                value={perfil.horarioAtencion}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Oficina / Cubículo Institucional:</label>
            <input
              type="text"
              readOnly
              value={perfil.oficina}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Panel Lateral: Asignaturas Asignadas */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#112F5C] border-b pb-3">Asignaturas Asignadas (2026-2)</h3>

          {asignaturas.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <FaBook className="text-3xl mx-auto mb-2 text-gray-300" />
              <p className="text-xs font-semibold text-gray-500">Sin asignaturas registradas actualmente.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {asignaturas.map((asig, idx) => (
                <div key={asig.id || idx} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#112F5C]">{asig.nombre}</h4>
                    <p className="text-[10px] text-gray-500 mt-0.5">{asig.grupo}</p>
                  </div>
                  <span className="bg-blue-100 text-[#112F5C] text-[10px] font-bold px-2.5 py-1 rounded-lg">
                    {asig.estudiantesCount || 0} Estudiantes
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Trazabilidad y Seguridad del Acceso */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-[#112F5C]">Trazabilidad y Seguridad del Acceso</h3>
        <p className="text-[11px] text-gray-400">Último Acceso Registrado:</p>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="bg-gray-50 border border-gray-200 px-4 py-2.5 rounded-xl text-xs font-mono text-gray-700">
            {seguridad.ultimoAcceso || 'No registrado'} — IP: {seguridad.ip || '127.0.0.1'} ({seguridad.dispositivo || 'Navegador'})
          </div>

          <div className="bg-blue-50 border border-blue-100 text-blue-800 text-[11px] px-4 py-2 rounded-xl">
            La gestión de contraseña para docentes es administrada por la Dirección de Tecnologías de la Información.
          </div>
        </div>
      </div>

    </div>
  );
}