import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaFolderOpen,
  FaFilePdf,
  FaPlus,
  FaTimes,
  FaCheckCircle,
  FaCalendarAlt,
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
  FaPaperPlane
} from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext.jsx';
import { obtenerMisProyectos, registrarProyecto } from '../../../services/estudianteProyectos.js';
import { exportarElementoAPdf } from '../../../utils/pdfExporter.js';
import { impedirEnvioPorEnter } from '../../../utils/impedirEnvioPorEnter.js';
import logoUnicesmag from '../../../assets/Escudos_cesmag.png';

const TIPOS_PROYECTO = [
  'Proyecto integrador',
  'Investigación',
  'Emprendimiento',
  'Práctica empresarial',
  'Otro'
];

// Clasificación local de "proyecto de grado". Se usa \b para que "integrador"
// (que contiene la subcadena "grado") NO se clasifique como grado. El util
// compartido utils/proyectos.js usa /grado|tesis/ sin frontera de palabra y da
// ese falso positivo; se evita aquí sin tocar el util del módulo del docente.
const esProyectoDeGrado = (proyecto) =>
  proyecto?.especializacion === true ||
  /(\btesis\b|\bgrado\b|proyecto\s+de\s+grado)/i.test(proyecto?.tipo_proyecto || '');

const fechaCorta = (valor) => {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const fechaLarga = (valor) => {
  const fecha = valor ? new Date(valor) : new Date();
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

function TarjetaProyecto({ proyecto, onDescargarPdf }) {
  const [expandido, setExpandido] = useState(false);
  const esGrado = esProyectoDeGrado(proyecto);
  const textoLargo = (proyecto.informacion || proyecto.descripcion || '').trim();

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#112F5C] leading-snug">
            {proyecto.nombre || 'Proyecto sin nombre'}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {proyecto.tipo_proyecto || 'Sin tipo especificado'}
            {proyecto.especializacion === true ? ' · Especialización' : ''}
          </p>
        </div>
        <span
          className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold ${
            esGrado ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}
        >
          {esGrado ? 'Grado' : 'Integrador'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {proyecto.estado || 'REGISTRADO'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-gray-600 border-t border-gray-100 pt-3">
        <FaCalendarAlt className="text-gray-400" />
        Registrado el {fechaCorta(proyecto.fecha_registro)}
      </div>

      {textoLargo && (
        <div className="bg-gray-50 rounded-xl p-3">
          <p
            className={`text-[11px] text-gray-600 leading-relaxed whitespace-pre-line ${
              expandido ? '' : 'line-clamp-3'
            }`}
          >
            {textoLargo}
          </p>
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="mt-2 text-[11px] font-semibold text-[#112F5C] flex items-center gap-1 hover:underline"
          >
            {expandido ? <FaChevronUp /> : <FaChevronDown />}
            {expandido ? 'Ver menos' : 'Ver información completa'}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => onDescargarPdf(proyecto)}
        className="mt-auto w-full flex items-center justify-center gap-2 bg-[#B3282D] hover:bg-red-800 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow"
      >
        <FaFilePdf /> Descargar constancia (PDF)
      </button>
    </div>
  );
}

// Constancia institucional que se exporta a PDF. Se renderiza fuera de pantalla.
function ConstanciaProyecto({ proyecto, estudiante, refConstancia }) {
  const nombreCompleto = [estudiante?.nombre, estudiante?.apellido]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={refConstancia}
      style={{
        position: 'fixed',
        top: 0,
        left: '-20000px',
        width: '720px',
        background: '#ffffff',
        color: '#1f2937',
        fontFamily: 'Montserrat, sans-serif',
        padding: '40px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '3px solid #112F5C', paddingBottom: '16px' }}>
        <img src={logoUnicesmag} alt="Logo Universidad CESMAG" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
        <div>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#112F5C' }}>Universidad CESMAG</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>G-RAP · Gestión de Resultados de Aprendizaje</p>
        </div>
      </div>

      <h1 style={{ fontSize: '20px', color: '#112F5C', margin: '28px 0 4px' }}>Constancia de Proyecto</h1>
      <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 24px' }}>
        Emitida el {fechaLarga()}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <tbody>
          {[
            ['Estudiante', nombreCompleto || '—'],
            ['Código', estudiante?.codigo_estudiante || estudiante?.id_user_institucional || '—'],
            ['Programa', estudiante?.programa || proyecto?.programa || '—'],
            ['Proyecto', proyecto?.nombre || '—'],
            ['Tipo', proyecto?.tipo_proyecto || '—'],
            ['Clasificación', esProyectoDeGrado(proyecto) ? 'Proyecto de grado / tesis' : 'Proyecto interestructurante'],
            ['Estado', proyecto?.estado || 'REGISTRADO'],
            ['Fecha de registro', fechaCorta(proyecto?.fecha_registro)]
          ].map(([etiqueta, valor]) => (
            <tr key={etiqueta}>
              <td style={{ padding: '8px 10px', fontWeight: 700, color: '#112F5C', borderBottom: '1px solid #e5e7eb', width: '38%' }}>
                {etiqueta}
              </td>
              <td style={{ padding: '8px 10px', borderBottom: '1px solid #e5e7eb' }}>{valor}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {(proyecto?.informacion || proyecto?.descripcion) && (
        <div style={{ marginTop: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#112F5C', margin: '0 0 6px' }}>Descripción</p>
          <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#374151', whiteSpace: 'pre-line', margin: 0 }}>
            {proyecto.informacion || proyecto.descripcion}
          </p>
        </div>
      )}

      <p style={{ marginTop: '32px', fontSize: '10px', color: '#9ca3af' }}>
        Documento generado automáticamente por la plataforma G-RAP de la Universidad CESMAG.
      </p>
    </div>
  );
}

export default function MisProyectos() {
  const { usuario } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [proyectos, setProyectos] = useState([]);
  const [pendiente, setPendiente] = useState(false);
  const [aviso, setAviso] = useState('');

  const [formAbierto, setFormAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState('');
  const [exitoEnvio, setExitoEnvio] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    tipo_proyecto: TIPOS_PROYECTO[0],
    informacion: '',
    especializacion: false
  });

  const [pdfProyecto, setPdfProyecto] = useState(null);
  const refConstancia = useRef(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { proyectos: lista, pendiente: pend, aviso: textoAviso } = await obtenerMisProyectos();
      setProyectos(lista);
      setPendiente(pend);
      setAviso(textoAviso || '');
    } catch (err) {
      console.error('Error cargando mis proyectos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Exporta la constancia cuando se selecciona un proyecto.
  useEffect(() => {
    if (!pdfProyecto) return;
    let activo = true;
    (async () => {
      try {
        const nombreArchivo = `Constancia_${(pdfProyecto.nombre || 'proyecto')
          .replace(/[^a-z0-9]+/gi, '_')
          .replace(/^_+|_+$/g, '')}.pdf`;
        await exportarElementoAPdf(refConstancia.current, nombreArchivo, {
          formato: 'a4',
          margen: 10
        });
      } catch (err) {
        console.error('Error generando el PDF del proyecto:', err);
      } finally {
        if (activo) setPdfProyecto(null);
      }
    })();
    return () => {
      activo = false;
    };
  }, [pdfProyecto]);

  const actualizarCampo = (campo, valor) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!form.nombre.trim()) {
      setErrorEnvio('Debe indicar el nombre del proyecto.');
      return;
    }
    if (!form.informacion.trim()) {
      setErrorEnvio('Debe describir la información del proyecto (campo obligatorio).');
      return;
    }
    try {
      setEnviando(true);
      setErrorEnvio('');
      setExitoEnvio('');
      await registrarProyecto({
        nombre: form.nombre.trim(),
        tipo_proyecto: form.tipo_proyecto,
        informacion: form.informacion.trim(),
        descripcion: form.informacion.trim(),
        especializacion: form.especializacion
      });
      setExitoEnvio('Proyecto enviado correctamente.');
      setForm({ nombre: '', tipo_proyecto: TIPOS_PROYECTO[0], informacion: '', especializacion: false });
      setFormAbierto(false);
      await cargar();
    } catch (err) {
      console.error('Error enviando el proyecto:', err);
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando sus proyectos...</p>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#112F5C]">Mis Proyectos</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Consulte sus proyectos interestructurantes y de grado, y descargue la constancia en PDF.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormAbierto((v) => !v);
            setExitoEnvio('');
            setErrorEnvio('');
          }}
          className="self-start md:self-auto flex items-center gap-2 bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow"
        >
          {formAbierto ? <FaTimes /> : <FaPlus />}
          {formAbierto ? 'Cerrar' : 'Registrar proyecto'}
        </button>
      </div>

      {exitoEnvio && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
          <FaCheckCircle /> {exitoEnvio}
        </div>
      )}

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
            El módulo de proyectos del estudiante aún no está disponible en el backend
            (endpoint <code className="font-mono">GET /api/estudiante/proyecto/proyecto</code>).
            Cuando su compañero lo habilite, esta vista mostrará automáticamente sus proyectos.
          </span>
        </div>
      )}

      {/* Formulario de registro / envío */}
      {formAbierto && (
        <form
          onSubmit={enviar}
          onKeyDown={impedirEnvioPorEnter}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4"
        >
          <h2 className="text-sm font-bold text-[#112F5C] flex items-center gap-2">
            <FaPaperPlane /> Registrar / enviar proyecto
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                Nombre del proyecto *
              </label>
              <input
                value={form.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
                placeholder="Ej. Sistema de gestión de inventario"
                className="w-full h-10 border-2 border-gray-200 rounded-lg px-3 text-xs font-semibold text-[#112F5C] focus:outline-none focus:border-[#112F5C]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Tipo de proyecto</label>
              <select
                value={form.tipo_proyecto}
                onChange={(e) => actualizarCampo('tipo_proyecto', e.target.value)}
                className="w-full h-10 border-2 border-gray-200 rounded-lg px-3 text-xs font-semibold text-[#112F5C] bg-white focus:outline-none focus:border-[#112F5C]"
              >
                {TIPOS_PROYECTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 mb-1">
              Información del proyecto *
            </label>
            <textarea
              value={form.informacion}
              onChange={(e) => actualizarCampo('informacion', e.target.value)}
              rows={4}
              placeholder="Describa el alcance, los objetivos y la información relevante del proyecto."
              className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-xs font-medium text-gray-700 focus:outline-none focus:border-[#112F5C] resize-y"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              checked={form.especializacion}
              onChange={(e) => actualizarCampo('especializacion', e.target.checked)}
              className="w-4 h-4 accent-[#B3282D]"
            />
            Es un proyecto de grado / especialización
          </label>

          {errorEnvio && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl font-mono">
              {errorEnvio}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setFormAbierto(false);
                setErrorEnvio('');
              }}
              className="text-xs font-semibold text-gray-600 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex items-center gap-2 bg-[#B3282D] hover:bg-red-800 disabled:opacity-60 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition shadow"
            >
              {enviando ? <FaSyncAlt className="animate-spin" /> : <FaPaperPlane />}
              {enviando ? 'Enviando...' : 'Enviar proyecto'}
            </button>
          </div>
        </form>
      )}

      {/* Listado de proyectos */}
      {proyectos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm space-y-3">
          <FaFolderOpen className="text-4xl mx-auto text-gray-300" />
          <p className="text-xs font-semibold text-gray-500">
            {pendiente
              ? 'Aún no hay proyectos disponibles.'
              : 'Todavía no tiene proyectos registrados.'}
          </p>
          {!pendiente && (
            <p className="text-[11px] text-gray-400">
              Use el botón «Registrar proyecto» para enviar su proyecto integrador o de grado.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proyectos.map((proyecto, idx) => (
            <TarjetaProyecto
              key={proyecto.id_proyecto ?? idx}
              proyecto={proyecto}
              onDescargarPdf={setPdfProyecto}
            />
          ))}
        </div>
      )}

      {/* Constancia fuera de pantalla para la exportación a PDF */}
      {pdfProyecto && (
        <ConstanciaProyecto
          proyecto={pdfProyecto}
          estudiante={usuario}
          refConstancia={refConstancia}
        />
      )}
    </div>
  );
}
