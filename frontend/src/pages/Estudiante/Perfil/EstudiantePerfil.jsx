import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaSyncAlt, 
  FaExclamationCircle, 
  FaCheckCircle,
  FaChartBar,
  FaGraduationCap,
  FaInfoCircle
} from 'react-icons/fa';
import "./EstudiantePerfil.css";
import { API_BASE_URL } from '../../../config';

export default function EstudiantePerfil() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Datos reales desde PostgreSQL
  const [perfil, setPerfil] = useState({
    nombre: '',
    documento: '',
    correo: '',
    telefono: '',
    programa: '',
    periodo: '',
    grupo: '',
    jornada: '',
    facultad: '',
    codigo: '',
    rol: '',
    estado: '',
    semestre: ''
  });

  const [progresoRap, setProgresoRap] = useState({
    rapsEvaluados: '0 de 0 RAPs',
    porcentajeAvance: '0% Avance',
    promedioGeneral: '0.0',
    estadoPromedio: 'Sin Registro',
    proyectoIntegrador: 'No Asignado',
    estadoProyecto: 'Pendiente'
  });

  const [seguridad, setSeguridad] = useState({
    ultimoAcceso: '',
    ip: '',
    dispositivo: ''
  });

  const cargarPerfilEstudiante = async () => {
    try {
      setLoading(true);
      setError('');

      const respuesta = await fetch(`${API_BASE_URL}/api/estudiante/Perfil`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || 'Error al obtener el perfil del estudiante');
      }

      if (resultado.perfil) {
        const p = resultado.perfil;
        setPerfil({
          nombre: `${p.nombre || ''} ${p.apellido || ''}`.trim(),
          documento: p.id_user_institucional || '—',
          correo: p.correo || '—',
          telefono: p.telefono || '—',
          programa: p.programa || '—',
          periodo: p.periodo || '—',
          grupo: p.grupo || '—',
          jornada: p.jornada || '—',
          facultad: p.facultad || '—',
          codigo: p.id_user_institucional || '—',
          rol: p.rol || '—',
          estado: p.estado === true ? 'Activo' : p.estado === false ? 'Inactivo' : '—',
          semestre: p.semestre ? `Semestre ${p.semestre}` : '—'
        });
      }
      if (resultado.progreso) setProgresoRap(resultado.progreso);
      if (resultado.seguridad) setSeguridad(resultado.seguridad);

    } catch (err) {
      console.error('Error cargando perfil estudiante:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfilEstudiante();
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
          <p className="text-gray-600 text-sm font-medium">Cargando perfil del estudiante...</p>
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
            onClick={cargarPerfilEstudiante}
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
      <div>
        <h1 className="text-2xl font-bold text-[#112F5C]">Perfil del Estudiante y Progreso Académico</h1>
        <p className="text-xs text-gray-500 mt-0.5">Consulte su información académica institucional, código, avance de RAPs y registro de sesión.</p>
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
            <h2 className="text-lg font-bold text-[#112F5C]">{perfil.nombre || 'Estudiante'}</h2>
            <p className="text-xs text-gray-500 mt-0.5">Código: {perfil.codigo || 'N/A'} — {perfil.programa || 'Universidad CESMAG'}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-3 py-0.5 rounded-full">
                {perfil.rol || 'Rol: Estudiante'}
              </span>
              <span className={`${perfil.estado === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'} text-[10px] font-bold px-3 py-0.5 rounded-full`}>
                {perfil.estado || 'Estado: Activo'}
              </span>
              <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-3 py-0.5 rounded-full">
                {perfil.semestre}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center">
          <p className="text-[11px] text-gray-400 font-medium">Fotografía institucional parametrizada</p>
        </div>
      </div>

      {/* Ficha Académica y Resumen RAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Información Personal y Ficha Académica (solo lectura: el backend no expone endpoint de actualización) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-bold text-[#112F5C]">Información Personal y Ficha Académica</h3>
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
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Teléfono Celular:</label>
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
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Programa Académico:</label>
              <input
                type="text"
                readOnly
                value={perfil.programa}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Periodo Académico Actual:</label>
              <input
                type="text"
                readOnly
                value={perfil.periodo}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Grupo:</label>
              <input
                type="text"
                readOnly
                value={perfil.grupo}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Jornada:</label>
              <input
                type="text"
                readOnly
                value={perfil.jornada}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Facultad:</label>
            <input
              type="text"
              readOnly
              value={perfil.facultad}
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Panel Resumen de Evaluación RAP */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#112F5C] border-b pb-3">Resumen de Evaluación RAP</h3>

          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-medium">RAPs Evaluados</p>
              <h4 className="font-bold text-sm text-[#112F5C]">{progresoRap.rapsEvaluados}</h4>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg">
              {progresoRap.porcentajeAvance}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Nivel Promedio General</p>
              <h4 className="font-bold text-sm text-emerald-700">{progresoRap.promedioGeneral}</h4>
            </div>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-lg">
              {progresoRap.estadoPromedio}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-medium">Proyecto Integrador / VII</p>
              <h4 className="font-bold text-xs text-[#112F5C]">{progresoRap.proyectoIntegrador}</h4>
            </div>
            <span className="bg-blue-100 text-[#112F5C] text-[10px] font-bold px-2.5 py-1 rounded-lg">
              {progresoRap.estadoProyecto}
            </span>
          </div>

          <button className="w-full py-2.5 bg-[#112F5C] hover:bg-blue-900 text-white font-bold rounded-xl text-xs transition-colors shadow">
            Ver Competencias y Nivel RAP
          </button>
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
            La gestión de la cuenta y contraseña de Estudiante es administrada por la Universidad a través del Portal Institucional.
          </div>
        </div>
      </div>

    </div>
  );
}