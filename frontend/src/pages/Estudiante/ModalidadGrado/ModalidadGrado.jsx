import React, { useCallback, useEffect, useState } from 'react';
import {
  FaGraduationCap,
  FaBriefcase,
  FaLightbulb,
  FaFlask,
  FaBookOpen,
  FaSyncAlt,
  FaExclamationCircle,
  FaInfoCircle,
  FaCheckCircle,
  FaClipboardCheck,
  FaPaperPlane
} from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext.jsx';
import {
  obtenerModalidadGrado,
  registrarModalidadGrado
} from '../../../services/estudianteModalidadGrado.js';
import { impedirEnvioPorEnter } from '../../../utils/impedirEnvioPorEnter.js';

// Catálogo informativo de modalidades de grado. Es estático (frontend) porque el
// backend aún no expone el módulo; sirve para que la vista sea útil sin datos.
const MODALIDADES = [
  {
    id: 'tesis',
    nombre: 'Tesis / Proyecto de Grado',
    icono: FaGraduationCap,
    descripcion:
      'Trabajo de investigación original con director de tesis y sustentación ante jurado.',
    requisitos: ['Anteproyecto aprobado', 'Director de tesis asignado', 'Sustentación pública']
  },
  {
    id: 'practica',
    nombre: 'Práctica Empresarial',
    icono: FaBriefcase,
    descripcion:
      'Práctica profesional en una organización con informe final y evaluación del supervisor.',
    requisitos: ['Convenio o carta de aceptación', 'Supervisor empresarial', 'Informe de práctica']
  },
  {
    id: 'emprendimiento',
    nombre: 'Emprendimiento',
    icono: FaLightbulb,
    descripcion:
      'Creación de un proyecto de negocio propio con plan de negocio y validación de mercado.',
    requisitos: ['Plan de negocio', 'Mentor asignado', 'Presentación del venture']
  },
  {
    id: 'investigacion',
    nombre: 'Investigación / Semillero',
    icono: FaFlask,
    descripcion:
      'Vinculación a un grupo o semillero de investigación con producto académico derivado.',
    requisitos: ['Aval del grupo de investigación', 'Producto académico (artículo o ponencia)']
  },
  {
    id: 'monografia',
    nombre: 'Monografía / Trabajo Dirigido',
    icono: FaBookOpen,
    descripcion:
      'Trabajo monográfico o dirigido sobre una problemática del área con acompañamiento docente.',
    requisitos: ['Tema aprobado', 'Docente director', 'Documento final']
  }
];

export default function ModalidadGrado() {
  const { usuario } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendiente, setPendiente] = useState(false);
  const [aviso, setAviso] = useState('');
  const [guardada, setGuardada] = useState(null);

  const [seleccion, setSeleccion] = useState(null);
  const [form, setForm] = useState({ motivacion: '', linea_investigacion: '' });
  const [enviando, setEnviando] = useState(false);
  const [exitoEnvio, setExitoEnvio] = useState('');
  const [avisoEnvio, setAvisoEnvio] = useState('');
  const [errorEnvio, setErrorEnvio] = useState('');

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { modalidad, pendiente: pend, aviso: textoAviso } = await obtenerModalidadGrado();
      setGuardada(modalidad);
      setPendiente(pend);
      setAviso(textoAviso || '');
      if (modalidad?.modalidad) {
        setSeleccion(modalidad.modalidad);
      }
    } catch (err) {
      console.error('Error cargando modalidad de grado:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const modalidadElegida = MODALIDADES.find((m) => m.id === seleccion) || null;

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!seleccion) {
      setErrorEnvio('Seleccione primero una modalidad de grado.');
      return;
    }
    try {
      setEnviando(true);
      setErrorEnvio('');
      setExitoEnvio('');
      setAvisoEnvio('');
      await registrarModalidadGrado({
        modalidad: seleccion,
        motivacion: form.motivacion.trim(),
        linea_investigacion: form.linea_investigacion.trim()
      });
      setExitoEnvio('Solicitud de modalidad de grado enviada correctamente.');
    } catch (err) {
      // Sin endpoint en el backend: se conserva como borrador local y se avisa.
      if (!err?.status || [404, 405, 501].includes(err.status)) {
        setGuardada({ modalidad: seleccion, motivacion: form.motivacion.trim(), local: true });
        setAvisoEnvio(
          'Guardado como borrador local. El envío oficial estará disponible cuando el backend habilite el módulo de modalidad de grado.'
        );
      } else {
        setErrorEnvio(err.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando modalidad de grado...</p>
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
            type="button"
            onClick={cargar}
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
      <div>
        <h1 className="text-2xl font-bold text-[#112F5C]">Modalidad de Grado</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Consulte y seleccione la modalidad de grado con la que cerrará su plan de estudios
          {usuario?.nombre ? ` (${usuario.nombre} ${usuario.apellido || ''})`.trim() : ''}.
        </p>
      </div>

      {aviso && (
        <div className="bg-sky-50 border border-sky-200 text-sky-800 text-xs p-4 rounded-xl flex items-start gap-2">
          <FaInfoCircle className="mt-0.5 shrink-0" />
          <span>{aviso}</span>
        </div>
      )}

      {pendiente && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-xl flex items-start gap-2">
          <FaInfoCircle className="mt-0.5 shrink-0" />
          <span>
            El backend aún no expone el módulo de modalidad de grado. Puede explorar las opciones y
            preparar su solicitud como borrador local; el envío oficial se habilitará automáticamente
            cuando su compañero publique el endpoint.
          </span>
        </div>
      )}

      {guardada && !guardada.local && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
          <FaCheckCircle />
          Modalidad registrada:{' '}
          {MODALIDADES.find((m) => m.id === guardada.modalidad)?.nombre || guardada.modalidad}
        </div>
      )}

      {/* Catálogo de modalidades */}
      <div>
        <h2 className="text-sm font-bold text-[#112F5C] mb-3 flex items-center gap-2">
          <FaClipboardCheck /> Opciones disponibles
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODALIDADES.map((modalidad) => {
            const Icono = modalidad.icono;
            const activa = seleccion === modalidad.id;
            return (
              <button
                key={modalidad.id}
                type="button"
                onClick={() => {
                  setSeleccion(modalidad.id);
                  setErrorEnvio('');
                }}
                className={`text-left bg-white rounded-2xl border p-5 flex flex-col gap-3 transition shadow-sm hover:shadow-md ${
                  activa ? 'border-[#112F5C] ring-2 ring-[#112F5C]/30' : 'border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      activa ? 'bg-[#112F5C] text-white' : 'bg-blue-50 text-[#112F5C]'
                    }`}
                  >
                    <Icono />
                  </span>
                  <p className="text-sm font-bold text-[#112F5C] leading-snug">{modalidad.nombre}</p>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">{modalidad.descripcion}</p>
                <ul className="mt-auto space-y-1 border-t border-gray-100 pt-2">
                  {modalidad.requisitos.map((req) => (
                    <li key={req} className="text-[10px] text-gray-500 flex items-start gap-1.5">
                      <span className="text-[#B3282D] mt-0.5">•</span> {req}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario de solicitud */}
      {modalidadElegida && (
        <form
          onSubmit={enviar}
          onKeyDown={impedirEnvioPorEnter}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <h2 className="text-sm font-bold text-[#112F5C] flex items-center gap-2">
            <FaPaperPlane /> Solicitud: {modalidadElegida.nombre}
          </h2>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Motivación / justificación
            </label>
            <textarea
              value={form.motivacion}
              onChange={(e) => setForm((p) => ({ ...p, motivacion: e.target.value }))}
              rows={4}
              placeholder="Explique por qué elige esta modalidad y cómo se relaciona con su perfil profesional."
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#112F5C] resize-y"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Línea de investigación (opcional)
            </label>
            <input
              value={form.linea_investigacion}
              onChange={(e) => setForm((p) => ({ ...p, linea_investigacion: e.target.value }))}
              placeholder="Ej. Ingeniería de software, Gestión empresarial..."
              className="w-full h-10 border-2 border-gray-200 rounded-lg px-3 text-xs font-semibold text-[#112F5C] focus:outline-none focus:border-[#112F5C]"
            />
          </div>

          {exitoEnvio && (
            <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2">
              <FaCheckCircle /> {exitoEnvio}
            </p>
          )}
          {avisoEnvio && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2">
              <FaInfoCircle /> {avisoEnvio}
            </p>
          )}
          {errorEnvio && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl font-mono">
              {errorEnvio}
            </p>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={enviando}
              className="flex items-center gap-2 bg-[#B3282D] hover:bg-red-800 disabled:opacity-60 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow"
            >
              {enviando ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane />}
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
