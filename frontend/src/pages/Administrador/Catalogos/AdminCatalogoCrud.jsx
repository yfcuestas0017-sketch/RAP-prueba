import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSyncAlt,
  FaExclamationCircle,
  FaInfoCircle,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import {
  eliminarCatalogoAdmin,
  guardarCatalogoAdmin,
  listarCatalogoAdmin,
  listarProgramasAdmin
} from '../../../services/adminCatalogosService';

const formatearLista = (valor) => {
  if (!Array.isArray(valor) || valor.length === 0) return '—';
  return valor.map((item) => item?.nombre).filter(Boolean).join(', ') || '—';
};

const formatearSiNo = (valor) => {
  if (valor === undefined || valor === null) return '—';
  return valor ? 'Sí' : 'No';
};

const FUENTES_OPCIONES = {
  semestres: {
    cargar: () => listarCatalogoAdmin('semestres'),
    valor: (item) => item.id_semestre,
    etiqueta: (item) =>
      `${item.numero} · ${item.nombre}${item.programa ? ` — ${item.programa}` : ''}`
  },
  programas: {
    cargar: listarProgramasAdmin,
    valor: (item) => item.id_programa,
    etiqueta: (item) => item.nombre
  }
};

const CATALOGOS = {
  componentes: {
    titulo: 'Componentes',
    singular: 'componente',
    id: ['id_componentes', 'id_componente', 'id'],
    descripcion: 'Catálogo independiente de componentes académicos.',
    aviso:
      'Los componentes se almacenan de forma independiente y se relacionan con los espacios académicos.',
    campos: [
      { nombre: 'clave', etiqueta: 'Clave', requerido: true },
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true }
    ],
    columnas: [
      { nombre: 'clave', etiqueta: 'Clave' },
      { nombre: 'nombre', etiqueta: 'Nombre' },
      { nombre: 'cantidad_espacios', etiqueta: 'Espacios asociados' }
    ]
  },
  'espacios-academicos': {
    titulo: 'Espacios Académicos',
    singular: 'espacio académico',
    id: ['id_espacio_academico', 'id'],
    descripcion: 'Catálogo de espacios académicos y sus componentes.',
    aviso:
      'Los espacios académicos se relacionan con los componentes desde la asignación de microcurrículo.',
    campos: [{ nombre: 'nombre', etiqueta: 'Nombre', requerido: true }],
    columnas: [
      { nombre: 'nombre', etiqueta: 'Nombre' },
      { nombre: 'componentes', etiqueta: 'Componentes', formatear: formatearLista }
    ]
  },
  semestres: {
    titulo: 'Semestres',
    singular: 'semestre',
    id: ['id_semestre', 'id'],
    descripcion: 'Semestres por programa; son la base para registrar los grupos.',
    aviso:
      'El semestre pertenece a un programa y es obligatorio al crear o editar un grupo.',
    campos: [
      { nombre: 'numero', etiqueta: 'Número', tipo: 'number', requerido: true, min: 1, max: 12 },
      { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
      {
        nombre: 'id_programa',
        etiqueta: 'Programa',
        tipo: 'select',
        opciones: 'programas',
        requerido: true,
        convertirNumero: true
      }
    ],
    columnas: [
      { nombre: 'numero', etiqueta: 'Número' },
      { nombre: 'nombre', etiqueta: 'Nombre' },
      { nombre: 'programa', etiqueta: 'Programa' },
      { nombre: 'cantidad_grupos', etiqueta: 'Grupos' }
    ]
  },
  grupos: {
    titulo: 'Grupos',
    singular: 'grupo',
    id: ['id_grupo'],
    descripcion: 'Registro base de la oferta académica del que se derivan jornadas y periodos.',
    aviso:
      'Las jornadas y los periodos de este módulo se generan a partir de los grupos. Al crear o editar un grupo se actualizan automáticamente.',
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre del grupo', requerido: true },
      {
        nombre: 'jornada',
        etiqueta: 'Jornada',
        requerido: true,
        placeholder: 'Ej. Diurna o Nocturna'
      },
      {
        nombre: 'periodo',
        etiqueta: 'Periodo',
        requerido: true,
        patron: '\\d{4}-[1-3]',
        placeholder: 'Ej. 2026-1',
        ayuda: 'Formato AAAA-N.'
      },
      {
        nombre: 'id_semestre',
        etiqueta: 'Semestre',
        tipo: 'select',
        opciones: 'semestres',
        requerido: true,
        convertirNumero: true
      },
      { nombre: 'codigo_jornada', etiqueta: 'Código de jornada', placeholder: 'Opcional' }
    ],
    columnas: [
      { nombre: 'nombre', etiqueta: 'Grupo' },
      { nombre: 'jornada', etiqueta: 'Jornada' },
      { nombre: 'periodo', etiqueta: 'Periodo' },
      { nombre: 'semestre', etiqueta: 'Semestre' },
      { nombre: 'programa', etiqueta: 'Programa' },
      { nombre: 'codigo_jornada', etiqueta: 'Código jornada' }
    ]
  },
  jornadas: {
    titulo: 'Jornadas',
    singular: 'jornada',
    id: ['jornada'],
    derivado: true,
    puedeCrear: false,
    puedeEliminar: false,
    descripcion: 'Jornadas derivadas de los grupos registrados.',
    aviso:
      'Esta lista se genera desde la tabla de grupos. Al editar una jornada se actualizan todos los grupos que la usan; no se pueden crear ni eliminar desde aquí.',
    campos: [{ nombre: 'jornada', etiqueta: 'Jornada', requerido: true }],
    columnas: [
      { nombre: 'jornada', etiqueta: 'Jornada' },
      { nombre: 'cantidad_grupos', etiqueta: 'Grupos' },
      { nombre: 'cantidad_semestres', etiqueta: 'Semestres' }
    ]
  },
  periodos: {
    titulo: 'Periodos Académicos',
    singular: 'periodo',
    id: ['periodo'],
    derivado: true,
    puedeCrear: false,
    puedeEliminar: false,
    descripcion: 'Periodos académicos derivados de los grupos registrados.',
    aviso:
      'Esta lista se genera desde la tabla de grupos. Al editar un periodo se actualizan todos los grupos que lo usan; no se pueden crear ni eliminar desde aquí.',
    campos: [
      {
        nombre: 'periodo',
        etiqueta: 'Periodo',
        requerido: true,
        patron: '\\d{4}-[1-3]',
        placeholder: 'Ej. 2026-1',
        ayuda: 'Formato AAAA-N.'
      }
    ],
    columnas: [
      { nombre: 'periodo', etiqueta: 'Periodo' },
      { nombre: 'formato_valido', etiqueta: 'Formato válido', formatear: formatearSiNo },
      { nombre: 'cantidad_grupos', etiqueta: 'Grupos' },
      { nombre: 'cantidad_semestres', etiqueta: 'Semestres' }
    ]
  }
};

const obtenerId = (fila, claves) =>
  claves.map((clave) => fila?.[clave]).find((valor) => valor !== undefined && valor !== null);

const convertirValor = (campo, valor) => {
  if (valor === '' || valor === null || valor === undefined) return null;
  if (campo.tipo === 'number' || campo.convertirNumero) {
    const numero = Number(valor);
    return Number.isNaN(numero) ? null : numero;
  }
  return valor;
};

export default function AdminCatalogoCrud() {
  const { recurso } = useParams();
  const config = CATALOGOS[recurso];
  const [registros, setRegistros] = useState([]);
  const [opciones, setOpciones] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [registroEditando, setRegistroEditando] = useState(null);
  const [formulario, setFormulario] = useState({});

  const camposFormulario = useMemo(() => config?.campos || [], [config]);
  const columnas = useMemo(() => config?.columnas || config?.campos || [], [config]);
  const fuentesOpciones = useMemo(
    () => [...new Set(camposFormulario.map((campo) => campo.opciones).filter(Boolean))],
    [camposFormulario]
  );

  const cargar = useCallback(async () => {
    if (!config) return;
    setCargando(true);
    setError('');
    try {
      const [lista, ...fuentesCargadas] = await Promise.all([
        listarCatalogoAdmin(recurso),
        ...fuentesOpciones.map(async (fuente) => {
          const definicion = FUENTES_OPCIONES[fuente];
          if (!definicion) return [fuente, []];
          return [fuente, await definicion.cargar()];
        })
      ]);
      setRegistros(lista);
      if (fuentesCargadas.length > 0) {
        setOpciones((actual) => ({ ...actual, ...Object.fromEntries(fuentesCargadas) }));
      }
    } catch (cargaError) {
      setError(cargaError.message || 'No fue posible cargar este catálogo.');
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  }, [config, fuentesOpciones, recurso]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setRegistroEditando(null);
    setFormulario({});
    setAviso('');
  }, [recurso]);

  if (!config) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
        El submódulo solicitado no existe.
      </div>
    );
  }

  const iniciarNuevo = () => {
    setRegistroEditando(null);
    setFormulario(Object.fromEntries(camposFormulario.map((campo) => [campo.nombre, ''])));
    setAviso('');
  };

  const iniciarEdicion = (registro) => {
    setRegistroEditando(registro);
    setFormulario(
      Object.fromEntries(
        camposFormulario.map((campo) => [campo.nombre, registro[campo.nombre] ?? ''])
      )
    );
    setAviso('');
  };

  const cancelar = () => {
    setRegistroEditando(null);
    setFormulario({});
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    setAviso('');
    try {
      const editando = Boolean(registroEditando);
      const id = editando ? obtenerId(registroEditando, config.id) : null;
      if (editando && (id === undefined || id === null || id === '')) {
        throw new Error('El registro no incluye la clave necesaria para actualizarlo.');
      }

      const datos = Object.fromEntries(
        camposFormulario.map((campo) => [
          campo.nombre,
          convertirValor(campo, formulario[campo.nombre] ?? '')
        ])
      );

      await guardarCatalogoAdmin(recurso, id, datos);
      cancelar();
      const sustantivo = config.singular;
      setAviso(
        `${sustantivo[0].toUpperCase()}${sustantivo.slice(1)} ${
          editando ? 'actualizado' : 'creado'
        } correctamente.`
      );
      await cargar();
    } catch (guardarError) {
      setError(guardarError.message || `No fue posible guardar el ${config.singular}.`);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (registro) => {
    if (config.puedeEliminar === false) return;
    const id = obtenerId(registro, config.id);
    if (id === undefined || id === null) {
      setError('El registro no incluye un identificador compatible con este CRUD.');
      return;
    }
    if (!window.confirm(`¿Eliminar este registro de ${config.titulo.toLowerCase()}?`)) return;
    setError('');
    setAviso('');
    try {
      await eliminarCatalogoAdmin(recurso, id);
      setAviso('Registro eliminado correctamente.');
      await cargar();
    } catch (eliminarError) {
      setError(eliminarError.message || 'No fue posible eliminar el registro.');
    }
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 p-1">
      <header className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8B1A1A]">
            Catálogos académicos
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#112F5C]">{config.titulo}</h1>
          <p className="mt-1 text-xs text-gray-500">
            {config.descripcion || 'Administra los registros de este catálogo.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={cargar}
            disabled={cargando}
            className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <FaSyncAlt className={`mr-2 inline ${cargando ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          {config.puedeCrear !== false && (
            <button
              type="button"
              onClick={iniciarNuevo}
              className="rounded-xl bg-[#112F5C] px-4 py-2 text-xs font-bold text-white hover:bg-blue-900"
            >
              <FaPlus className="mr-2 inline" />
              Nuevo registro
            </button>
          )}
        </div>
      </header>

      {config.aviso && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
            config.derivado
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-blue-200 bg-blue-50 text-blue-900'
          }`}
        >
          <FaInfoCircle className="mt-0.5 shrink-0" />
          <span>{config.aviso}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800"
        >
          <FaExclamationCircle className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {aviso && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800"
        >
          {aviso}
        </div>
      )}

      {Object.keys(formulario).length > 0 && (
        <form onSubmit={guardar} className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#112F5C]">
              {registroEditando ? `Editar ${config.singular}` : `Nuevo ${config.singular}`}
            </h2>
            <button
              type="button"
              onClick={cancelar}
              aria-label="Cerrar formulario"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <FaTimes />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {camposFormulario.map((campo) => {
              const fuente = campo.opciones ? FUENTES_OPCIONES[campo.opciones] : null;
              const opcionesCampo = fuente ? opciones[campo.opciones] || [] : [];
              return (
                <label
                  key={campo.nombre}
                  className="block text-[11px] font-semibold text-gray-700"
                >
                  {campo.etiqueta}
                  {campo.requerido && <span className="text-red-600"> *</span>}
                  {campo.tipo === 'select' ? (
                    <select
                      required={campo.requerido}
                      value={formulario[campo.nombre] ?? ''}
                      onChange={(evento) =>
                        setFormulario((actual) => ({
                          ...actual,
                          [campo.nombre]: evento.target.value
                        }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-normal outline-none focus:border-[#112F5C]"
                    >
                      <option value="">Selecciona {campo.etiqueta.toLowerCase()}</option>
                      {opcionesCampo.map((opcion) => (
                        <option key={fuente.valor(opcion)} value={fuente.valor(opcion)}>
                          {fuente.etiqueta(opcion)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={campo.tipo || 'text'}
                      required={campo.requerido}
                      min={campo.min}
                      max={campo.max}
                      pattern={campo.patron}
                      title={campo.ayuda}
                      placeholder={campo.placeholder}
                      value={formulario[campo.nombre] ?? ''}
                      onChange={(evento) =>
                        setFormulario((actual) => ({
                          ...actual,
                          [campo.nombre]: evento.target.value
                        }))
                      }
                      className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-xs font-normal outline-none focus:border-[#112F5C]"
                    />
                  )}
                  {campo.ayuda && (
                    <span className="mt-1 block text-[10px] font-normal text-gray-500">
                      {campo.ayuda}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={cancelar}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-[#008A52] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              <FaSave className="mr-2 inline" />
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {cargando ? (
          <div className="flex items-center justify-center gap-2 p-12 text-xs text-gray-500">
            <FaSyncAlt className="animate-spin" />
            Cargando registros…
          </div>
        ) : registros.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-500">
            {config.derivado
              ? 'No hay registros derivados. Crea grupos para que aparezcan aquí.'
              : 'No hay registros disponibles. Crea el primero con el botón “Nuevo registro”.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-[#112F5C] text-white">
                <tr>
                  {columnas.map((campo) => (
                    <th key={campo.nombre} className="px-4 py-3">
                      {campo.etiqueta}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {registros.map((registro, indice) => (
                  <tr key={obtenerId(registro, config.id) ?? indice} className="hover:bg-gray-50">
                    {columnas.map((campo) => {
                      const valor = campo.formatear
                        ? campo.formatear(registro[campo.nombre], registro)
                        : registro[campo.nombre];
                      return (
                        <td key={campo.nombre} className="px-4 py-3.5 text-gray-700">
                          {valor === null || valor === undefined || valor === '' ? '—' : valor}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(registro)}
                        aria-label="Editar"
                        className="mr-2 rounded-lg p-2 text-[#112F5C] hover:bg-blue-50"
                      >
                        <FaEdit />
                      </button>
                      {config.puedeEliminar !== false && (
                        <button
                          type="button"
                          onClick={() => eliminar(registro)}
                          aria-label="Eliminar"
                          className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                        >
                          <FaTrash />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
