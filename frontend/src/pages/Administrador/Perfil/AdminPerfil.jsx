import React, { useState, useEffect } from 'react';
import { 
  FaUser, 
  FaLock, 
  FaSlidersH, 
  FaHistory, 
  FaSyncAlt, 
  FaExclamationCircle, 
  FaCheckCircle,
  FaDesktop,
  FaInfoCircle
} from 'react-icons/fa';
import "./AdminPerfil.css";
import { API_BASE_URL } from '../../../config';

const PREFERENCIAS_DEFECTO = {
  idioma: 'Español (Colombia)',
  zonaHoraria: 'UTC-05:00 Bogotá, Lima, Quito',
  formatoFecha: 'DD/MM/YYYY',
  notifPruebas: true,
  alertasProyectos: true,
  avisosAuditoria: true,
  reportesConsolidados: false
};

const clavePreferencias = (usuario) => `rap_admin_preferencias_${usuario || 'default'}`;

const Toggle = ({ activo, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={activo}
    onClick={(e) => { e.stopPropagation(); onChange(!activo); }}
    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${activo ? 'bg-[#112F5C]' : 'bg-gray-300'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow ring-1 ring-black/5 transition-transform ${activo ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

export default function AdminPerfil() {
  const [tabActiva, setTabActiva] = useState('perfil'); // 'perfil', 'preferencias', 'auditoria'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');

  // Estados para datos recibidos de la BD
  const [perfil, setPerfil] = useState({
    nombre: '',
    cedula: '',
    correo: '',
    telefono: '',
    facultad: '',
    programa: '',
    departamento: '',
    rol: '',
    estado: '',
    usuario: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    actual: '',
    nueva: '',
    confirmar: ''
  });

  const [preferencias, setPreferencias] = useState(PREFERENCIAS_DEFECTO);

  const [auditoria, setAuditoria] = useState([]);

  const obtenerPreferenciasGuardadas = (usuario) => {
    try {
      const guardadas = localStorage.getItem(clavePreferencias(usuario));
      return guardadas ? { ...PREFERENCIAS_DEFECTO, ...JSON.parse(guardadas) } : { ...PREFERENCIAS_DEFECTO };
    } catch (err) {
      console.warn('No se pudieron leer las preferencias guardadas:', err);
      return { ...PREFERENCIAS_DEFECTO };
    }
  };

  const handleGuardarPreferencias = () => {
    localStorage.setItem(clavePreferencias(perfil.usuario), JSON.stringify(preferencias));
    setMensajeExito('Preferencias guardadas correctamente en este navegador.');
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const handleRestablecerPreferencias = () => {
    setPreferencias({ ...PREFERENCIAS_DEFECTO });
    localStorage.removeItem(clavePreferencias(perfil.usuario));
    setMensajeExito('Preferencias restablecidas a los valores por defecto.');
    setTimeout(() => setMensajeExito(''), 4000);
  };

  // Cargar Perfil de Administrador desde la API
  const cargarPerfil = async () => {
    try {
      setLoading(true);
      setError('');

      const respuesta = await fetch(`${API_BASE_URL}/api/admin/Perfil`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(resultado.mensaje || 'Error al conectar con la base de datos');
      }

      if (resultado.perfil) {
        const p = resultado.perfil;
        setPerfil({
          nombre: `${p.nombre || ''} ${p.apellido || ''}`.trim(),
          cedula: p.id_user_institucional || '—',
          correo: p.correo || '—',
          telefono: p.telefono || '—',
          facultad: p.facultad || '—',
          programa: p.programa || '—',
          departamento: p.departamento || '—',
          rol: p.rol || '—',
          estado: p.estado === true ? 'Activo' : p.estado === false ? 'Inactivo' : '—',
          usuario: p.usuario || '—'
        });
        setPreferencias(obtenerPreferenciasGuardadas(p.usuario));
      }
      if (resultado.auditoria) setAuditoria(resultado.auditoria);

    } catch (err) {
      console.error('Error cargando perfil admin:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, []);

  const handleActualizarPassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.actual || !passwordForm.nueva || !passwordForm.confirmar) {
      alert('Debe proporcionar la contraseña actual y la nueva contraseña.');
      return;
    }
    if (passwordForm.nueva !== passwordForm.confirmar) {
      alert('Las contraseñas nuevas no coinciden');
      return;
    }
    if (passwordForm.nueva.length < 8) {
      alert('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    try {
      setMensajeExito('');
      setError('');
      const respuesta = await fetch(`${API_BASE_URL}/api/admin/Perfil/credenciales`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passwordActual: passwordForm.actual,
          passwordNueva: passwordForm.nueva
        })
      });

      const res = await respuesta.json();
      if (!respuesta.ok) throw new Error(res.mensaje || 'Error al actualizar contraseña');

      setMensajeExito(res.mensaje || 'Contraseña actualizada con éxito.');
      setPasswordForm({ actual: '', nueva: '', confirmar: '' });
      setTimeout(() => setMensajeExito(''), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando perfil desde la base de datos...</p>
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
            onClick={cargarPerfil}
            className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow"
          >
            <FaSyncAlt className="inline mr-2" /> Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  // Obtener iniciales para el avatar
  const obtenerIniciales = (nombreCompleto) => {
    if (!nombreCompleto) return '—';
    const partes = nombreCompleto.trim().split(' ');
    if (partes.length >= 2) return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
    return nombreCompleto.substring(0, 2).toUpperCase();
  };

  return (
    <div className="w-full animate-fade-in space-y-6">
      
      {/* Título Principal */}
      <div>
        <h1 className="text-2xl font-bold text-[#112F5C]">Mi Perfil de Usuario y Seguridad (Administrador)</h1>
        <p className="text-xs text-gray-500 mt-0.5">Gestione su información personal, credenciales de acceso, preferencias y auditoría de sesión.</p>
      </div>

      {/* Alerta de Éxito */}
      {mensajeExito && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
          <FaCheckCircle className="text-emerald-600 text-base shrink-0" />
          <span>{mensajeExito}</span>
        </div>
      )}

      {/* Navegación por Pestañas (Tabs de Figma) */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setTabActiva('perfil')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            tabActiva === 'perfil'
              ? 'bg-[#112F5C] text-white shadow'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Perfil y Seguridad
        </button>
        <button
          onClick={() => setTabActiva('preferencias')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            tabActiva === 'preferencias'
              ? 'bg-[#112F5C] text-white shadow'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Preferencias
        </button>
        <button
          onClick={() => setTabActiva('auditoria')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${
            tabActiva === 'auditoria'
              ? 'bg-[#112F5C] text-white shadow'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Historial Auditoría
        </button>
      </div>

      {/* CONTENIDO PESTAÑA 1: PERFIL Y SEGURIDAD */}
      {tabActiva === 'perfil' && (
        <div className="space-y-6">
          {/* Tarjeta de Encabezado de Usuario */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#112F5C] text-white font-bold text-xl flex items-center justify-center shrink-0 border-2 border-gray-100 shadow-sm">
                {obtenerIniciales(perfil.nombre)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#112F5C]">{perfil.nombre || 'Administrador Sin Nombre'}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{perfil.departamento || 'Universidad CESMAG'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-3 py-0.5 rounded-full">
                    {perfil.rol || 'Rol: Administrador'}
                  </span>
                  <span className={`${perfil.estado === 'Activo' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'} text-[10px] font-bold px-3 py-0.5 rounded-full`}>
                    {perfil.estado || 'Estado: Activo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-sm">
                Cambiar Foto
              </button>
              <button className="bg-red-50 text-[#B3282D] border border-red-100 hover:bg-red-100 text-xs font-semibold px-4 py-2 rounded-xl transition">
                Eliminar Foto
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Información Personal y Académica (solo lectura: el backend no expone endpoint de actualización) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold text-[#112F5C]">Información Personal y Académica</h3>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full">
                  <FaInfoCircle /> Solo lectura
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Nombre Completo:</label>
                  <input
                    type="text"
                    value={perfil.nombre}
                    readOnly
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Documento / Cédula:</label>
                  <input
                    type="text"
                    value={perfil.cedula}
                    readOnly
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Correo Institucional:</label>
                  <input
                    type="email"
                    value={perfil.correo}
                    readOnly
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Teléfono de Contacto:</label>
                  <input
                    type="text"
                    value={perfil.telefono}
                    readOnly
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Facultad / Unidad:</label>
                  <input
                    type="text"
                    value={perfil.facultad}
                    readOnly
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">Programa Académico:</label>
                  <input
                    type="text"
                    value={perfil.programa}
                    readOnly
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Departamento / Dependencia:</label>
                <input
                  type="text"
                  value={perfil.departamento}
                  readOnly
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Formulario Seguridad y Credenciales */}
            <form onSubmit={handleActualizarPassword} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#112F5C] border-b pb-3">Seguridad y Credenciales</h3>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Usuario de acceso:</label>
                <input
                  type="text"
                  value={perfil.usuario}
                  readOnly
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Contraseña Actual:</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwordForm.actual}
                  onChange={(e) => setPasswordForm({ ...passwordForm, actual: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Nueva Contraseña:</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwordForm.nueva}
                  onChange={(e) => setPasswordForm({ ...passwordForm, nueva: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Confirmar Nueva Contraseña:</label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={passwordForm.confirmar}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmar: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#B3282D] hover:bg-red-800 text-white font-bold rounded-xl text-xs transition-colors shadow-md mt-2"
              >
                Actualizar Contraseña
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 2: PREFERENCIAS */}
      {tabActiva === 'preferencias' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-[#112F5C] mb-1">1. Configuración Regional e Idioma</h3>
            <p className="text-xs text-gray-400 mb-4">Personalice la localización horaria y el formato de visualización de datos en el sistema.</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Idioma de la Interfaz:</label>
                <select
                  value={preferencias.idioma}
                  onChange={(e) => setPreferencias({ ...preferencias, idioma: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
                >
                  <option>Español (Colombia)</option>
                  <option>English (US)</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Formato de Fecha:</label>
                <select
                  value={preferencias.formatoFecha}
                  onChange={(e) => setPreferencias({ ...preferencias, formatoFecha: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
                >
                  <option>DD/MM/YYYY</option>
                  <option>MM/DD/YYYY</option>
                  <option>YYYY-MM-DD</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Zona Horaria Institucional:</label>
                <input
                  type="text"
                  value={preferencias.zonaHoraria}
                  onChange={(e) => setPreferencias({ ...preferencias, zonaHoraria: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div>
            <h3 className="text-sm font-bold text-[#112F5C] mb-1">2. Notificaciones y Alertas por Correo Electrónico</h3>
            <p className="text-xs text-gray-400 mb-4">Seleccione los eventos académicos y de gestión sobre los cuales desea recibir boletines.</p>

            <div className="space-y-3">
              {[
                {
                  clave: 'notifPruebas',
                  titulo: 'Notificaciones de Creación de Pruebas RAP',
                  desc: 'Recibir un correo cuando se publique una nueva prueba o evaluación diagnóstica en su facultad.'
                },
                {
                  clave: 'alertasProyectos',
                  titulo: 'Alertas de Entrega de Proyectos e Historias',
                  desc: 'Avisos sobre entrega de proyectos integradores e historias de usuario.'
                },
                {
                  clave: 'avisosAuditoria',
                  titulo: 'Aviso de Auditoría y Eventos de Seguridad',
                  desc: 'Notificar cuando se detecten inicios de sesión desde nuevas direcciones IP o dispositivos no reconocidos.'
                },
                {
                  clave: 'reportesConsolidados',
                  titulo: 'Reportes Académicos Consolidados',
                  desc: 'Recibir el reporte consolidado de resultados RAP por periodo académico.'
                }
              ].map((opc) => (
                <div key={opc.clave} className="flex items-center gap-3 cursor-pointer" onClick={() => setPreferencias({ ...preferencias, [opc.clave]: !preferencias[opc.clave] })}>
                  <Toggle activo={preferencias[opc.clave]} onChange={(v) => setPreferencias({ ...preferencias, [opc.clave]: v })} />
                  <div>
                    <p className="text-xs font-bold text-gray-700">{opc.titulo}</p>
                    <p className="text-[10px] text-gray-400">{opc.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleRestablecerPreferencias}
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
            >
              Restablecer Valores
            </button>
            <button
              type="button"
              onClick={handleGuardarPreferencias}
              className="px-5 py-2 bg-[#112F5C] hover:bg-blue-900 text-white rounded-xl text-xs font-semibold shadow"
            >
              Guardar Preferencias
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO PESTAÑA 3: HISTORIAL AUDITORÍA */}
      {tabActiva === 'auditoria' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="text-sm font-bold text-[#112F5C]">Registro de Inicios de Sesión y Eventos de Seguridad</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monitoree las conexiones con sus credenciales para prevenir accesos no autorizados.</p>
            </div>
            <button className="bg-[#B3282D] hover:bg-red-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow shrink-0">
              Cerrar Sesiones en Otros Dispositivos
            </button>
          </div>

          <div className="overflow-x-auto">
            {auditoria.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FaHistory className="text-3xl mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-semibold text-gray-500">No existen registros de auditoría almacenados actualmente.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-[#112F5C] text-white font-semibold">
                  <tr>
                    <th className="px-4 py-3">FECHA Y HORA</th>
                    <th className="px-4 py-3">EVENTO / ACCIÓN</th>
                    <th className="px-4 py-3">DIRECCIÓN IP</th>
                    <th className="px-4 py-3">DISPOSITIVO / NAVEGADOR</th>
                    <th className="px-4 py-3 text-center">ESTADO SESIÓN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditoria.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-[#112F5C]">{item.fechaHora}</td>
                      <td className="px-4 py-3.5 text-gray-700">{item.evento}</td>
                      <td className="px-4 py-3.5 font-mono text-gray-600">{item.ip}</td>
                      <td className="px-4 py-3.5 text-gray-600">{item.dispositivo}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                          item.estado === 'Sesión Activa Actual'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

    </div>
  );
}