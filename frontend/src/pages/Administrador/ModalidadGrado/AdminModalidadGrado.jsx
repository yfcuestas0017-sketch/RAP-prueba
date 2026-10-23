import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaSyncAlt,
  FaExclamationCircle,
  FaUserGraduate,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaGraduationCap
} from 'react-icons/fa';
import AdminProyectos from '../Proyectos/AdminProyectos.jsx';
import {
  listarEstudiantesAdmin,
  esCoterminalidad,
  iniciales,
  etiquetaSemestre
} from '../../../services/adminEstudiantesService';

const OPCIONES_ORDEN = [
  { valor: 'semestre', etiqueta: 'Semestre' },
  { valor: 'nombre', etiqueta: 'Nombre' },
  { valor: 'grupo', etiqueta: 'Grupo' },
  { valor: 'codigo', etiqueta: 'Código' }
];

const comparar = (a, b, campo) => {
  switch (campo) {
    case 'grupo': {
      const izq = `${a.grupo || ''}`.toLowerCase();
      const der = `${b.grupo || ''}`.toLowerCase();
      return izq.localeCompare(der, 'es');
    }
    case 'codigo': {
      const izq = `${a.id_user_institucional || ''}`;
      const der = `${b.id_user_institucional || ''}`;
      return izq.localeCompare(der, 'es', { numeric: true });
    }
    case 'nombre': {
      const izq = `${a.nombre || ''} ${a.apellido || ''}`.trim().toLowerCase();
      const der = `${b.nombre || ''} ${b.apellido || ''}`.trim().toLowerCase();
      return izq.localeCompare(der, 'es');
    }
    case 'semestre':
    default: {
      const izq = Number(a.semestre) || 0;
      const der = Number(b.semestre) || 0;
      if (izq !== der) return izq - der;
      const nIzq = `${a.nombre || ''} ${a.apellido || ''}`.trim().toLowerCase();
      const nDer = `${b.nombre || ''} ${b.apellido || ''}`.trim().toLowerCase();
      return nIzq.localeCompare(nDer, 'es');
    }
  }
};

function PanelCoterminalidad() {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [semestreSeleccionado, setSemestreSeleccionado] = useState('');
  const [campoOrden, setCampoOrden] = useState('semestre');
  const [direccion, setDireccion] = useState('asc');
  const [soloCoterminalidad, setSoloCoterminalidad] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const lista = await listarEstudiantesAdmin();
      setEstudiantes(lista);
    } catch (cargaError) {
      console.error('Error cargando estudiantes:', cargaError);
      setErrorCarga(cargaError.message || 'No fue posible consultar los estudiantes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const opcionesSemestre = useMemo(() => {
    const mapa = new Map();
    estudiantes.forEach((estudiante) => {
      const numero = Number(estudiante.semestre);
      if (Number.isNaN(numero) || mapa.has(numero)) return;
      mapa.set(numero, etiquetaSemestre(estudiante));
    });
    return Array.from(mapa.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([valor, etiqueta]) => ({ valor, etiqueta }));
  }, [estudiantes]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return estudiantes.filter((estudiante) => {
      if (soloCoterminalidad && !esCoterminalidad(estudiante.semestre)) return false;
      if (
        semestreSeleccionado !== '' &&
        Number(estudiante.semestre) !== Number(semestreSeleccionado)
      ) {
        return false;
      }
      if (!texto) return true;
      return `${estudiante.nombre || ''} ${estudiante.apellido || ''} ${
        estudiante.id_user_institucional || ''
      } ${estudiante.correo || ''} ${estudiante.grupo || ''}`
        .toLowerCase()
        .includes(texto);
    });
  }, [estudiantes, busqueda, semestreSeleccionado, soloCoterminalidad]);

  const ordenados = useMemo(() => {
    const copia = [...filtrados];
    copia.sort((a, b) => {
      const base = comparar(a, b, campoOrden);
      return direccion === 'desc' ? -base : base;
    });
    return copia;
  }, [filtrados, campoOrden, direccion]);

  const bloques = useMemo(() => {
    const grupos = new Map();
    ordenados.forEach((estudiante) => {
      const llave = Number(estudiante.semestre);
      const id = Number.isNaN(llave) ? 'sin-semestre' : llave;
      if (!grupos.has(id)) grupos.set(id, []);
      grupos.get(id).push(estudiante);
    });
    return Array.from(grupos.entries());
  }, [ordenados]);

  const totalCoterminalidad = useMemo(
    () => estudiantes.filter((estudiante) => esCoterminalidad(estudiante.semestre)).length,
    [estudiantes]
  );

  const etiquetaDeBloque = (llave) => {
    if (llave === 'sin-semestre') return 'Sin semestre asignado';
    const ejemplo =
      estudiantes.find((estudiante) => Number(estudiante.semestre) === llave) || null;
    if (!ejemplo) return `${llave}°`;
    return etiquetaSemestre(ejemplo);
  };

  if (cargando) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <FaSyncAlt className="text-3xl text-[#112F5C] animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">Cargando estudiantes...</p>
        </div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <FaExclamationCircle className="text-4xl text-[#B3282D] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#112F5C] mb-2">Error de conexión</h2>
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl mb-6 font-mono text-left break-words">
            {errorCarga}
          </p>
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
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-[#112F5C] flex items-center gap-2">
            <FaUserGraduate /> Estudiantes en coterminalidad
          </h2>
          <button
            type="button"
            onClick={cargar}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <FaSyncAlt className="text-xs" />
            Actualizar datos
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[11px]" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, código, correo o grupo..."
              className="pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
            />
          </div>

          <select
            value={semestreSeleccionado}
            onChange={(e) => setSemestreSeleccionado(e.target.value)}
            aria-label="Filtrar por semestre"
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
          >
            <option value="">Todos los semestres</option>
            {opcionesSemestre.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>

          <select
            value={campoOrden}
            onChange={(e) => setCampoOrden(e.target.value)}
            aria-label="Ordenar por"
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#112F5C]/20"
          >
            {OPCIONES_ORDEN.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                Ordenar por: {opcion.etiqueta}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setDireccion((valor) => (valor === 'asc' ? 'desc' : 'asc'))}
            className="flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] px-3 py-2 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            {direccion === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
            {direccion === 'asc' ? 'Ascendente' : 'Descendente'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSoloCoterminalidad((valor) => !valor)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${
            soloCoterminalidad
              ? 'bg-[#112F5C] text-white border-[#112F5C]'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FaGraduationCap />
          {soloCoterminalidad ? 'Ver todos los estudiantes' : 'Ver solo coterminalidad'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {ordenados.length === 0 ? (
          <p className="text-xs text-gray-500 p-8 text-center">
            No se encontraron estudiantes con los filtros seleccionados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0074B7] text-white font-semibold">
                <tr>
                  <th className="px-4 py-3">ESTUDIANTE</th>
                  <th className="px-4 py-3">CÓDIGO</th>
                  <th className="px-4 py-3">CORREO</th>
                  <th className="px-4 py-3">GRUPO</th>
                  <th className="px-4 py-3">JORNADA</th>
                  <th className="px-4 py-3">PERIODO</th>
                  <th className="px-4 py-3">SEMESTRE</th>
                  <th className="px-4 py-3 text-center">COTERM.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bloques.map(([llave, integrantes]) => (
                  <React.Fragment key={llave}>
                    <tr className="bg-gray-50">
                      <td colSpan={8} className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-[#112F5C]">
                            {etiquetaDeBloque(llave)}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                            {integrantes.length} estudiante
                            {integrantes.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {integrantes.map((estudiante) => (
                      <tr
                        key={estudiante.id_user}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#112F5C] text-white text-[10px] font-bold shrink-0">
                              {iniciales(estudiante.nombre, estudiante.apellido)}
                            </span>
                            <span className="font-bold text-gray-800">
                              {estudiante.nombre} {estudiante.apellido}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {estudiante.id_user_institucional || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {estudiante.correo || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {estudiante.grupo || 'Sin asignar'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {estudiante.jornada || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {estudiante.periodo || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {estudiante.nombre_semestre ||
                            (estudiante.semestre
                              ? `${estudiante.semestre}.º Semestre`
                              : '—')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              esCoterminalidad(estudiante.semestre)
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-gray-50 text-gray-500 border-gray-200'
                            }`}
                          >
                            {esCoterminalidad(estudiante.semestre) ? 'Sí' : 'No'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[11px] text-gray-500 border-t border-gray-100 px-4 py-3 bg-gray-50">
          Mostrando {ordenados.length} de {estudiantes.length} · En coterminalidad:{' '}
          {totalCoterminalidad}
        </p>
      </div>
    </div>
  );
}

export default function AdminModalidadGrado() {
  const [pestana, setPestana] = useState('proyectos');

  const pestanas = [
    { id: 'proyectos', etiqueta: 'Tesis / Trabajo de Grado' },
    { id: 'coterminalidad', etiqueta: 'Estudiantes en Coterminalidad' }
  ];

  return (
    <div className="w-full animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#112F5C]">Tesis y Modalidad de Grado</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Consulta de tesis, trabajos de grado y proyectos de coterminalidad, y control de
          estudiantes en coterminalidad.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {pestanas.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPestana(item.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
              pestana === item.id
                ? 'bg-[#112F5C] text-white border-[#112F5C] shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {item.etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'proyectos' ? (
        <AdminProyectos categoria="modalidad" sinEncabezado />
      ) : (
        <PanelCoterminalidad />
      )}
    </div>
  );
}
