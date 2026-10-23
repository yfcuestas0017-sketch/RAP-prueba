import React, { useEffect, useState } from 'react';
import {
  FaEdit,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaListAlt,
  FaLock,
  FaPlus,
  FaSave,
  FaSyncAlt,
  FaTimes,
  FaTrash,
  FaUpload
} from 'react-icons/fa';
import {
  actualizarPruebaSaberPro,
  crearPruebaSaberPro,
  eliminarPruebaSaberPro,
  esModuloPendiente,
  listarPruebasSaberPro,
  publicarPruebaSaberPro
} from '../../../../services/saberProService';
import { impedirEnvioPorEnter } from '../../../../utils/impedirEnvioPorEnter.js';
import SaberProPreguntas from './SaberProPreguntas.jsx';

const FORMULARIO_VACIO = {
  nombre: '',
  id_grupo: '',
  modalidad: 'SIMULACRO',
  periodo: '2026-2',
  descripcion: '',
  fecha_inicio: '',
  fecha_fin: ''
};

const MODALIDADES = [
  { valor: 'SIMULACRO', etiqueta: 'Simulacro' },
  { valor: 'SABER_PRO', etiqueta: 'Prueba Saber Pro' }
];

const colorEstado = (estado) => {
  switch (estado) {
    case 'PUBLICADA':
      return 'bg-emerald-100 text-emerald-800';
    case 'ARCHIVADA':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-amber-100 text-amber-800';
  }
};

export default function SaberProCrear({ permiso, grupos, errorPermiso }) {
  const [pruebas, setPruebas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoPruebas, setCargandoPruebas] = useState(false);
  const [pendienteBackend, setPendienteBackend] = useState(false);
  const [error, setError] = useState('');
  const [errorAccion, setErrorAccion] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [pruebaEditando, setPruebaEditando] = useState(null);
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [errorFormulario, setErrorFormulario] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [pruebaSeleccionada, setPruebaSeleccionada] = useState(null);

  const cargarPruebas = async () => {
    try {
      setCargandoPruebas(true);
      setError('');
      setPendienteBackend(false);
      const lista = await listarPruebasSaberPro();
      setPruebas(lista);
    } catch (err) {
      if (esModuloPendiente(err)) {
        setPruebas([]);
        setPendienteBackend(true);
      } else {
        setError(err.message || 'No fue posible cargar las pruebas Saber Pro.');
      }
    } finally {
      setCargandoPruebas(false);
      setCargando(false);
    }
  };

  useEffect(() => {
    if (permiso?.permitido) cargarPruebas();
    else setCargando(false);
  }, [permiso?.permitido]);

  const abrirCreacion = () => {
    setPruebaEditando(null);
    setFormulario({ ...FORMULARIO_VACIO, id_grupo: grupos[0]?.id_grupo ?? '' });
    setErrorFormulario('');
    setErrorAccion('');
    setModalAbierto(true);
  };

  const abrirEdicion = (prueba) => {
    setPruebaEditando(prueba);
    setFormulario({
      nombre: prueba.nombre || '',
      id_grupo: prueba.id_grupo ?? '',
      modalidad: prueba.modalidad || 'SIMULACRO',
      periodo: prueba.periodo || '',
      descripcion: prueba.descripcion || '',
      fecha_inicio: (prueba.fecha_inicio || '').slice(0, 10),
      fecha_fin: (prueba.fecha_fin || '').slice(0, 10)
    });
    setErrorFormulario('');
    setErrorAccion('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;
    setModalAbierto(false);
    setPruebaEditando(null);
    setFormulario(FORMULARIO_VACIO);
    setErrorFormulario('');
  };

  const guardarPrueba = async (evento) => {
    evento.preventDefault();

    const nombre = formulario.nombre.trim();
    if (!nombre) {
      setErrorFormulario('El nombre de la prueba es obligatorio.');
      return;
    }
    if (!formulario.id_grupo) {
      setErrorFormulario('Seleccione el grupo al que pertenece la prueba.');
      return;
    }
    if (
      formulario.fecha_inicio &&
      formulario.fecha_fin &&
      formulario.fecha_fin < formulario.fecha_inicio
    ) {
      setErrorFormulario('La fecha de fin no puede ser anterior a la fecha de inicio.');
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario('');
      const datos = {
        nombre,
        id_grupo: Number(formulario.id_grupo),
        modalidad: formulario.modalidad,
        periodo: formulario.periodo.trim(),
        descripcion: formulario.descripcion.trim(),
        fecha_inicio: formulario.fecha_inicio || null,
        fecha_fin: formulario.fecha_fin || null
      };

      if (pruebaEditando) {
        await actualizarPruebaSaberPro(pruebaEditando.id_prueba, datos);
      } else {
        await crearPruebaSaberPro(datos);
      }

      cerrarModal();
      await cargarPruebas();
    } catch (err) {
      setErrorFormulario(err.message || 'No fue posible guardar la prueba.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarPrueba = async (prueba) => {
    const confirmado = window.confirm(
      `¿Está seguro de eliminar la prueba "${prueba.nombre}"? Se perderán sus reactivos.`
    );
    if (!confirmado) return;

    try {
      setErrorAccion('');
      await eliminarPruebaSaberPro(prueba.id_prueba);
      await cargarPruebas();
    } catch (err) {
      setErrorAccion(err.message || 'No fue posible eliminar la prueba.');
    }
  };

  const publicarPrueba = async (prueba) => {
    const publicar = prueba.estado !== 'PUBLICADA';
    const confirmado = window.confirm(
      publicar
        ? `¿Publicar "${prueba.nombre}"? Quedará disponible para aplicarla a sus estudiantes.`
        : `¿Retirar la publicación de "${prueba.nombre}"? Volverá a estado borrador.`
    );
    if (!confirmado) return;

    try {
      setErrorAccion('');
      await publicarPruebaSaberPro(prueba.id_prueba, { estado: publicar ? 'PUBLICADA' : 'BORRADOR' });
      await cargarPruebas();
    } catch (err) {
      setErrorAccion(err.message || 'No fue posible cambiar el estado de la prueba.');
    }
  };

  // Sin permiso del administrador: se niega el acceso a crear/editar/publicar.
  if (!permiso?.permitido) {
    return (
      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <FaLock className="text-blue-600 text-base mt-0.5 shrink-0" />
          <p className="text-xs text-blue-900 leading-relaxed">
            <strong>Acceso denegado.</strong> El Administrador aún no le ha otorgado permiso para crear pruebas Saber
            Pro ni simulacros en sus grupos asignados. Cuando lo habilite podrá redactar reactivos con el asistente,
            revisarlos, guardarlos, eliminarlos y publicar la prueba.
          </p>
        </div>
        {errorPermiso && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
            <FaExclamationTriangle className="text-[#B3282D] text-base mt-0.5 shrink-0" />
            <p className="text-xs text-red-700 leading-relaxed">
              No fue posible verificar el permiso con el servidor. Se mantiene el acceso denegado por seguridad.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (pruebaSeleccionada) {
    return (
      <SaberProPreguntas
        prueba={pruebaSeleccionada}
        permiso={permiso}
        onVolver={() => {
          setPruebaSeleccionada(null);
          cargarPruebas();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3">
        <FaUpload className="text-emerald-600 text-base mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-900 leading-relaxed">
          El Administrador habilitó el permiso de Saber Pro. Puede crear, editar, publicar y eliminar pruebas y
          simulacros en sus grupos asignados.
        </p>
      </div>

      {pendienteBackend && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
          <FaExclamationTriangle className="text-amber-600 text-base mt-0.5 shrink-0" />
          <p className="text-xs text-amber-900 leading-relaxed">
            El servicio de Saber Pro aún no está disponible en el servidor, por eso la lista aparece vacía. El
            permiso quedó habilitado y la interfaz está lista para el endpoint{' '}
            <code className="font-mono">GET /api/docente/saber-pro/pruebas</code>.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <FaExclamationCircle className="text-[#B3282D] text-base mt-0.5 shrink-0" />
          <div className="space-y-2">
            <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={cargarPruebas}
              className="text-[11px] font-semibold text-[#112F5C] bg-white border border-[#112F5C] px-3 py-1.5 rounded-lg hover:bg-[#112F5C] hover:text-white transition"
            >
              <FaSyncAlt className="inline mr-1" /> Reintentar
            </button>
          </div>
        </div>
      )}

      {errorAccion && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
          <FaExclamationTriangle className="text-[#B3282D] text-base mt-0.5 shrink-0" />
          <p className="text-xs text-red-700 leading-relaxed">{errorAccion}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#112F5C]">Mis pruebas Saber Pro y simulacros</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Cada prueba pertenece a uno de sus grupos asignados.
            </p>
          </div>
          <button
            type="button"
            onClick={abrirCreacion}
            className="inline-flex items-center gap-2 bg-[#112F5C] hover:bg-blue-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow transition"
          >
            <FaPlus /> Nueva prueba
          </button>
        </div>

        {cargando || cargandoPruebas ? (
          <div className="text-center py-10 text-gray-500">
            <FaSyncAlt className="text-2xl text-[#112F5C] animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Cargando pruebas Saber Pro...</p>
          </div>
        ) : pruebas.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FaListAlt className="text-4xl mx-auto mb-3 text-gray-300" />
            <p className="text-xs font-semibold text-gray-500">
              Aún no ha creado pruebas Saber Pro ni simulacros.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#112F5C] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">PRUEBA</th>
                  <th className="px-4 py-3">MODALIDAD</th>
                  <th className="px-4 py-3">GRUPO / PERIODO</th>
                  <th className="px-4 py-3 text-center">REACTIVOS</th>
                  <th className="px-4 py-3 text-center">ESTADO</th>
                  <th className="px-4 py-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pruebas.map((prueba, indice) => (
                  <tr key={prueba.id_prueba ?? indice} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-[#112F5C]">{prueba.nombre}</td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {prueba.modalidad === 'SABER_PRO' ? 'Prueba Saber Pro' : 'Simulacro'}
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">
                      {prueba.grupo || '—'}
                      {prueba.periodo ? ` · ${prueba.periodo}` : ''}
                    </td>
                    <td className="px-4 py-3.5 text-center text-gray-600">{prueba.cantidad_preguntas ?? 0}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${colorEstado(prueba.estado)}`}>
                        {prueba.estado || 'BORRADOR'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPruebaSeleccionada(prueba)}
                          className="bg-[#112F5C] hover:bg-blue-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          <FaListAlt className="inline mr-1" /> Reactivos
                        </button>
                        <button
                          type="button"
                          onClick={() => publicarPrueba(prueba)}
                          disabled={!permiso.puedePublicar}
                          title={
                            permiso.puedePublicar
                              ? 'Publicar o retirar la prueba'
                              : 'El administrador no habilitó la publicación.'
                          }
                          className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition ${
                            permiso.puedePublicar
                              ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                              : 'border-gray-200 text-gray-300 bg-gray-50 cursor-not-allowed'
                          }`}
                        >
                          {permiso.puedePublicar ? <FaUpload className="inline mr-1" /> : <FaLock className="inline mr-1" />}
                          {prueba.estado === 'PUBLICADA' ? 'Retirar' : 'Publicar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirEdicion(prueba)}
                          className="border border-[#112F5C] text-[#112F5C] hover:bg-[#112F5C] hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          <FaEdit className="inline mr-1" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarPrueba(prueba)}
                          className="border border-[#B3282D] text-[#B3282D] hover:bg-[#B3282D] hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition"
                        >
                          <FaTrash className="inline mr-1" /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={guardarPrueba}
            onKeyDown={impedirEnvioPorEnter}
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#112F5C]">
                  {pruebaEditando ? 'Editar prueba Saber Pro' : 'Nueva prueba Saber Pro'}
                </h2>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Defina los datos generales. Los reactivos se agregan en el paso siguiente.
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                aria-label="Cerrar"
              >
                <FaTimes />
              </button>
            </div>

            {errorFormulario && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
                {errorFormulario}
              </p>
            )}

            <div className="space-y-1">
              <label htmlFor="saberpro-nombre" className="block text-[11px] font-semibold text-gray-700">
                Nombre de la prueba *
              </label>
              <input
                id="saberpro-nombre"
                type="text"
                required
                maxLength={150}
                value={formulario.nombre}
                onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                placeholder="Ej. Simulacro de lectura crítica"
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="saberpro-grupo" className="block text-[11px] font-semibold text-gray-700">
                  Grupo *
                </label>
                <select
                  id="saberpro-grupo"
                  required
                  value={formulario.id_grupo}
                  onChange={(e) => setFormulario({ ...formulario, id_grupo: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                >
                  <option value="">Seleccione uno de sus grupos</option>
                  {grupos.map((grupo) => (
                    <option key={grupo.id_grupo} value={grupo.id_grupo}>
                      {grupo.nombre} {grupo.codigo_jornada ? `· ${grupo.codigo_jornada}` : ''} —{' '}
                      {grupo.jornada || 'Sin jornada'}
                    </option>
                  ))}
                </select>
                {grupos.length === 0 && (
                  <p className="text-[11px] text-amber-700">No se encontraron grupos asignados a su usuario.</p>
                )}
              </div>
              <div className="space-y-1">
                <label htmlFor="saberpro-modalidad" className="block text-[11px] font-semibold text-gray-700">
                  Modalidad
                </label>
                <select
                  id="saberpro-modalidad"
                  value={formulario.modalidad}
                  onChange={(e) => setFormulario({ ...formulario, modalidad: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                >
                  {MODALIDADES.map((modalidad) => (
                    <option key={modalidad.valor} value={modalidad.valor}>
                      {modalidad.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="saberpro-periodo" className="block text-[11px] font-semibold text-gray-700">
                  Periodo
                </label>
                <input
                  id="saberpro-periodo"
                  type="text"
                  maxLength={20}
                  value={formulario.periodo}
                  onChange={(e) => setFormulario({ ...formulario, periodo: e.target.value })}
                  placeholder="Ej. 2026-2"
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="saberpro-inicio" className="block text-[11px] font-semibold text-gray-700">
                  Fecha de inicio
                </label>
                <input
                  id="saberpro-inicio"
                  type="date"
                  value={formulario.fecha_inicio}
                  onChange={(e) => setFormulario({ ...formulario, fecha_inicio: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="saberpro-fin" className="block text-[11px] font-semibold text-gray-700">
                Fecha de fin
              </label>
              <input
                id="saberpro-fin"
                type="date"
                value={formulario.fecha_fin}
                onChange={(e) => setFormulario({ ...formulario, fecha_fin: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="saberpro-descripcion" className="block text-[11px] font-semibold text-gray-700">
                Descripción / instrucciones
              </label>
              <textarea
                id="saberpro-descripcion"
                rows={3}
                maxLength={500}
                value={formulario.descripcion}
                onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                placeholder="Indique el propósito de la prueba y las condiciones de aplicación."
                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20 resize-y"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#112F5C] hover:bg-blue-900 px-4 py-2.5 rounded-xl shadow transition disabled:opacity-60"
              >
                <FaSave /> {guardando ? 'Guardando...' : pruebaEditando ? 'Guardar cambios' : 'Crear prueba'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
