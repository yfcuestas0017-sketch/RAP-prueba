import { apiBaseURL, fetchJSON } from './api.js';

// Capa de datos FRONTEND-ONLY para "Evaluaciones y Proyectos" del estudiante.
// Hoy sirve datos demo para aprobar la interfaz sin backend; cuando se conecte
// el backend basta con que obtenerContexto()/obtenerExamen() resuelvan desde la API.

export const PISTAS = {
  rap: {
    clave: 'rap',
    titulo: 'Pruebas RAP (4.°)',
    corto: 'Pruebas RAP',
    descripcion: 'Evaluación unificada de Resultados de Aprendizaje del cuarto semestre.',
    color: '#B3282D'
  },
  interestructurante: {
    clave: 'interestructurante',
    titulo: 'Proyecto Interestructurante (7.°)',
    corto: 'Interestructurante',
    descripcion: 'Proyecto integrador de semestre con entregables por componente.',
    color: '#112F5C'
  },
  tesisCoterminal: {
    clave: 'tesisCoterminal',
    titulo: 'Tesis / Coterminal (8.°–10.°)',
    corto: 'Tesis / Coterminal',
    descripcion: 'Modalidades de grado: tesis y coterminalidad.',
    color: '#0F766E'
  },
  saberPro: {
    clave: 'saberPro',
    titulo: 'Saber Pro (9.°)',
    corto: 'Saber Pro',
    descripcion: 'Simulacro de competencias profesionales previo al grado.',
    color: '#7C3AED'
  }
};

// Qué pistas ve el estudiante según el semestre que cursa.
// Los momentos RAP son 4.°, 7.° y 9.°; Saber Pro es una prueba aparte de 9.°.
export function pistasPorSemestre(semestre) {
  const s = Number(semestre) || 0;
  const visibles = [PISTAS.rap];
  if (s >= 7) visibles.push(PISTAS.interestructurante);
  if (s >= 8) visibles.push(PISTAS.tesisCoterminal);
  if (s >= 9) visibles.push(PISTAS.saberPro);
  return visibles;
}

const CATALOGO = [
  {
    id: 'rap-4',
    pista: 'rap',
    nombre: 'Prueba Unificada Diagnóstica RAP 4.° 2026-2',
    subtitulo: 'Evaluación de Resultados de Aprendizaje · Cuarto Semestre (4.°)',
    semestres: [4, 7, 9],
    // Semestre al que pertenece realmente la prueba. Si difiere del semestre
    // en curso, el ítem es histórico: solo se visualiza el resultado obtenido.
    semestreOrigen: 4,
    estado: 'Habilitada',
    tono: 'ok',
    duracionMin: 60,
    respuestas: 'A-B-C-D',
    componente: 'Diagnóstica Unificada',
    asignaturas: [
      'Ingeniería de Software I — RAP 1: Modelado y Patrones UML',
      'Programación de Computadores — RAP 1: Algoritmos y Estructuras',
      'Sistemas Operativos — RAP 2: Paginación y Gestión de Memoria'
    ],
    descripcion: 'Examen unificado semestral que integra los RAP de las asignaturas del ciclo.',
    // Resultado ya obtenido (demo) cuando la prueba quedó atrás en el plan.
    resultado: { puntaje: 78, sobre: 100, estado: 'Aprobada', fecha: '18/09/2026', intentos: 1 }
  },
  {
    id: 'sp-9',
    pista: 'saberPro',
    nombre: 'Simulacro Saber Pro Profesiones 2026-2',
    subtitulo: 'Simulacro de grado · Noveno Semestre (9.°)',
    semestres: [9],
    semestreOrigen: 9,
    estado: 'Habilitada',
    tono: 'ok',
    duracionMin: 90,
    respuestas: 'A-B-C-D',
    componente: 'Profesiones',
    asignaturas: [
      'Gerencia y Gestión de Proyectos — RAP 3: Planificación',
      'Investigación II — RAP 2: Metodología'
    ],
    descripcion: 'Simulacro orientado a competencias profesionales previo al grado.'
  },
  {
    id: 'pi-7',
    pista: 'interestructurante',
    nombre: 'Proyecto Interestructurante 7.°',
    subtitulo: 'Proyecto integrador · Séptimo Semestre (7.°)',
    semestres: [7, 9],
    semestreOrigen: 7,
    estado: 'Entregable abierto',
    tono: 'ok',
    componente: 'Integrador',
    entregables: [
      { nombre: 'Entregable 1: Planteamiento del problema', estado: 'Entregado', tono: 'ok', archivo: 'planteamiento_problema.pdf', fecha: '02/09/2026', calificacion: 92 },
      { nombre: 'Entregable 2: Diseño de solución', estado: 'En curso', tono: 'aviso' },
      { nombre: 'Entregable 3: Prototipo funcional', estado: 'Pendiente', tono: 'pendiente' }
    ],
    descripcion: 'Articula los RAP del semestre en un proyecto aplicado por equipos.',
    resultado: { puntaje: 92, sobre: 100, estado: 'Entregable 1 aprobado', fecha: '02/09/2026' }
  },
  {
    id: 'tc-tesis',
    pista: 'tesisCoterminal',
    nombre: 'Tesis de Grado',
    subtitulo: 'Modalidad de grado · Octavo a Décimo (8.°–10.°)',
    semestres: [9],
    semestreOrigen: 9,
    estado: 'Habilitada',
    tono: 'ok',
    componente: 'Grado',
    entregables: [
      { nombre: 'Anteproyecto y aval de director', estado: 'En curso', tono: 'aviso' },
      { nombre: 'Avance de capítulos I–II', estado: 'Pendiente', tono: 'pendiente' }
    ],
    descripcion: 'Modalidad de grado por investigación con director asignado.'
  },
  {
    id: 'tc-coterminal',
    pista: 'tesisCoterminal',
    nombre: 'Coterminalidad',
    subtitulo: 'Modalidad de grado · Octavo a Décimo (8.°–10.°)',
    semestres: [9],
    semestreOrigen: 9,
    estado: 'Habilitada',
    tono: 'ok',
    componente: 'Grado',
    entregables: [
      { nombre: 'Solicitud de cupo coterminal', estado: 'Entregado', tono: 'ok', archivo: 'solicitud_cupo.pdf', fecha: '25/08/2026', calificacion: 100 },
      { nombre: 'Matricula de asignatura de posgrado', estado: 'Pendiente', tono: 'pendiente' }
    ],
    descripcion: 'Cursa asignaturas de posgrado como modalidad de grado.'
  }
];

export function itemsPorSemestre(semestre, pistaClave) {
  const s = Number(semestre) || 0;
  return CATALOGO.filter(
    (item) => item.pista === pistaClave && item.semestres.includes(s)
  );
}

// Un ítem es "del curso actual" cuando pertenece al semestre que el estudiante
// cursa. Los demás (p. ej. la prueba Saber Pro de 4.° vista en 7.°/9.°) son
// históricos: NO se pueden volver a realizar, solo consultar su resultado.
export function esDelCursoActual(item, semestre) {
  if (!item) return false;
  const origen = item.semestreOrigen ?? Math.min(...item.semestres);
  return origen === (Number(semestre) || 0);
}

// True cuando el ítem debe mostrarse en modo solo-visualización: pertenece a un
// semestre anterior al que el estudiante cursa (p. ej. la prueba Saber Pro de 4.°
// vista en 7.°/9.°). Estos ítems ya no se realizan: solo se consulta su resultado.
export function esSoloVisualizacion(item, semestre) {
  if (!item) return false;
  return !esDelCursoActual(item, semestre);
}

const ESTUDIANTE_DEMO = {
  nombre: 'JUAN CORDOBA',
  semestre: 4,
  grupo: 'Grupo 401 DEMO',
  jornada: 'Diurna',
  programa: 'Ingeniería de Sistemas',
  facultad: 'Fac. Ingeniería'
};

const HISTORIAL_DEMO = [
  { nombre: 'Ingeniería de Software I', detalle: 'CE 1.1 — Modelado UML y Arquitectura', fecha: '10/03/2026', tono: '#16A34A', puntaje: 85, sobre: 100, estado: 'Aprobada' },
  { nombre: 'Prog. de Computadores', detalle: 'CE 1.2 — Lógica y Algoritmos de Complejidad', fecha: '05/03/2026', tono: '#2563EB', puntaje: 72, sobre: 100, estado: 'Aprobada' },
  { nombre: 'Bases de Datos I', detalle: 'CE 2.1 — Modelo Relacional y SQL', fecha: '01/03/2026', tono: '#D97706', puntaje: 58, sobre: 100, estado: 'Por debajo del mínimo' }
];

// Intenta el backend real; si no responde (aprobación de frontend) usa demo.
async function cargarContexto() {
  try {
    const data = await fetchJSON('/api/estudiante/evaluaciones');
    if (data && data.estudiante) {
      return {
        fuente: 'api',
        estudiante: {
          ...ESTUDIANTE_DEMO,
          ...data.estudiante,
          programa: data.estudiante.programa || ESTUDIANTE_DEMO.programa,
          facultad: data.estudiante.facultad || ESTUDIANTE_DEMO.facultad
        },
        evaluaciones: data.evaluaciones || []
      };
    }
  } catch (error) {
    console.warn('Backend no disponible, usando contexto demo:', error.message);
  }
  return { fuente: 'demo', estudiante: { ...ESTUDIANTE_DEMO }, evaluaciones: [] };
}

// Memoización: el Sidebar y el panel llaman obtenerContexto(); con esta caché
// comparten UNA sola petición en lugar de duplicarla en cada montaje.
let promesaContexto = null;

export function invalidarContexto() {
  promesaContexto = null;
}

export function obtenerContexto() {
  if (!promesaContexto) promesaContexto = cargarContexto();
  return promesaContexto;
}

const BANCO_PREGUNTAS_DEMO = [
  {
    id_pregunta: 1,
    componente: 'Ingeniería de Software I',
    codigo: 'CE 1.1',
    titulo: 'Evaluación de Diagramación y Patrones de Arquitectura UML (CE 1.1)',
    contexto:
      'En un sistema bancario, se requiere diseñar la relación entre la clase contenedora «Banco» y la clase «CuentaAhorros». Si el Banco cierra, las cuentas deben mantener su registro histórico.',
    enunciado: '¿Qué tipo de asociación UML garantiza que el ciclo de vida de la cuenta sea independiente?',
    puntaje: 1,
    tipo_pregunta: 'CERRADA',
    opciones: [
      { id_opcion_pregunta: 11, texto: 'Agregación débil entre Banco y CuentaAhorros' },
      { id_opcion_pregunta: 12, texto: 'Composición estricta con destrucción en cascada' },
      { id_opcion_pregunta: 13, texto: 'Herencia de interfaz abstracta transaccional' },
      { id_opcion_pregunta: 14, texto: 'Dependencia simple de paso de parámetros' }
    ]
  },
  {
    id_pregunta: 2,
    componente: 'Programación de Computadores',
    codigo: 'CE 1.2',
    titulo: 'Complejidad algorítmica y estructuras de datos (CE 1.2)',
    contexto:
      'Un módulo de reportes recorre una lista de n estudiantes y, por cada uno, consulta sus m materias para calcular promedios.',
    enunciado: '¿Cuál es la complejidad temporal del proceso completo?',
    puntaje: 1,
    tipo_pregunta: 'CERRADA',
    opciones: [
      { id_opcion_pregunta: 21, texto: 'O(n + m)' },
      { id_opcion_pregunta: 22, texto: 'O(n · m)' },
      { id_opcion_pregunta: 23, texto: 'O(log n)' },
      { id_opcion_pregunta: 24, texto: 'O(1)' }
    ]
  },
  {
    id_pregunta: 3,
    componente: 'Sistemas Operativos',
    codigo: 'CE 2.1',
    titulo: 'Paginación y gestión de memoria (CE 2.1)',
    contexto:
      'Un proceso ocupa 10 páginas con un marco de 4 KB. El sistema reporta 2 fallos de página al iniciar.',
    enunciado: '¿Qué mecanismo traduce la dirección lógica a física en este esquema?',
    puntaje: 1,
    tipo_pregunta: 'CERRADA',
    opciones: [
      { id_opcion_pregunta: 31, texto: 'Tabla de páginas con registro base y límite' },
      { id_opcion_pregunta: 32, texto: 'Segmentación pura sin paginación' },
      { id_opcion_pregunta: 33, texto: 'Memoria contigua asignada por primera adaptación' },
      { id_opcion_pregunta: 34, texto: 'Swapping completo del proceso' }
    ]
  }
];

export async function obtenerExamen(idEvaluacion) {
  try {
    const data = await fetchJSON(`/api/estudiante/evaluaciones/${idEvaluacion}`);
    if (data && data.evaluacion) {
      return { fuente: 'api', ...data };
    }
  } catch (error) {
    console.warn('Backend no disponible, usando examen demo:', error.message);
  }
  const item = CATALOGO.find((c) => c.id === idEvaluacion) || CATALOGO[0];
  return {
    fuente: 'demo',
    estudiante: { ...ESTUDIANTE_DEMO },
    evaluacion: {
      id_evaluacion: item.id,
      nombre: item.nombre,
      momento: item.componente,
      semestre: ESTUDIANTE_DEMO.semestre,
      grupo: ESTUDIANTE_DEMO.grupo,
      jornada: ESTUDIANTE_DEMO.jornada,
      puntaje_total: BANCO_PREGUNTAS_DEMO.length,
      fecha_fin: new Date(Date.now() + 45 * 60 * 1000).toISOString()
    },
    raps: [
      {
        id_evaluacion_rap: `${item.id}-rap1`,
        codigo_rap: item.componente,
        nombre: item.nombre,
        descripcion: item.descripcion,
        preguntas: BANCO_PREGUNTAS_DEMO
      }
    ],
    historial: HISTORIAL_DEMO
  };
}

export function obtenerHistorialDemo() {
  return HISTORIAL_DEMO;
}

// =====================================================================
// Adaptadores y endpoints "listos para el backend".
// Cuando el backend monte los endpoints, el frontend los consume sin
// cambiar la UI; si no están montados, se degrada a demo sin errores.
// =====================================================================

// True cuando el endpoint no está montado o no hay red (degradación elegante).
function esEndpointNoMontado(error) {
  return !error?.status || [404, 405, 501].includes(error.status);
}

// Asocia el `momento` que devuelve el backend con una pista del panel.
export function momentoAPista(momento) {
  const m = String(momento || '').toLowerCase();
  if (m.includes('saber')) return 'saberPro';
  if (m.includes('tesis') || m.includes('coterminal') || m.includes('grado')) return 'tesisCoterminal';
  if (m.includes('interestructurante') || m.includes('integrador') || m.includes('proyecto')) return 'interestructurante';
  return 'rap';
}

// Convierte una fila de `evaluaciones` del backend a la forma de ítem del panel.
// Un ítem de origen X queda visible desde X en adelante (histórico/solo-lectura).
export function itemDesdeEvaluacion(ev) {
  const origen = Number(ev.semestre) || 0;
  const semestres = [];
  for (let s = origen || 1; s <= 10; s++) semestres.push(s);
  let duracionMin;
  if (ev.fecha_inicio && ev.fecha_fin) {
    const min = Math.round((new Date(ev.fecha_fin) - new Date(ev.fecha_inicio)) / 60000);
    if (min > 0) duracionMin = min;
  }
  return {
    id: String(ev.id_evaluacion),
    pista: momentoAPista(ev.momento),
    nombre: ev.nombre,
    subtitulo: [ev.momento, ev.grupo].filter(Boolean).join(' · '),
    semestres,
    semestreOrigen: origen,
    estado: ev.estado || 'Habilitada',
    tono: 'ok',
    duracionMin,
    respuestas: 'A-B-C-D',
    componente: ev.momento,
    descripcion: ev.nombre
  };
}

export function itemsDesdeApi(evaluaciones) {
  return (Array.isArray(evaluaciones) ? evaluaciones : []).map(itemDesdeEvaluacion);
}

// Ítems del panel: prefiere el backend real; si no hay datos, usa el catálogo.
export function resolverItems(contexto, semestre, pistaClave) {
  if (
    contexto?.fuente === 'api' &&
    Array.isArray(contexto.evaluaciones) &&
    contexto.evaluaciones.length
  ) {
    return itemsDesdeApi(contexto.evaluaciones).filter(
      (item) => item.pista === pistaClave && item.semestres.includes(Number(semestre) || 0)
    );
  }
  return itemsPorSemestre(semestre, pistaClave);
}

// Registra el inicio del intento (se activa solo cuando el backend lo monte).
export async function iniciarIntento(idEvaluacion) {
  try {
    return await fetchJSON(`/api/estudiante/evaluaciones/${idEvaluacion}/iniciar`, {
      method: 'POST'
    });
  } catch (error) {
    if (esEndpointNoMontado(error)) return null;
    console.warn('No se pudo registrar el inicio del intento:', error.message);
    return null;
  }
}

// Envía las respuestas para autocalificación (se activa solo con el backend).
export async function finalizarIntento(idEvaluacion, respuestas) {
  try {
    return await fetchJSON(`/api/estudiante/evaluaciones/${idEvaluacion}/finalizar`, {
      method: 'POST',
      body: JSON.stringify({ respuestas })
    });
  } catch (error) {
    if (esEndpointNoMontado(error)) return null;
    console.warn('No se pudo finalizar el intento en el backend:', error.message);
    return null;
  }
}

// Historial real de intentos (se activa solo con el backend); si no, null.
export async function obtenerHistorial() {
  try {
    const data = await fetchJSON('/api/estudiante/evaluaciones/historial');
    const lista = data?.historial ?? data?.data ?? (Array.isArray(data) ? data : null);
    return Array.isArray(lista) ? lista : null;
  } catch (error) {
    if (esEndpointNoMontado(error)) return null;
    console.warn('No se pudo cargar el historial:', error.message);
    return null;
  }
}

// Normaliza una fila de historial (backend o demo) a la forma que pinta la vista.
export function normalizarResultado(h) {
  const puntaje = h.puntaje != null ? Number(h.puntaje) : null;
  return {
    id: h.id ?? h.id_evaluacion_respuesta ?? h.id_evaluacion ?? h.nombre,
    nombre: h.nombre || h.evaluacion || 'Evaluación',
    detalle: h.detalle || h.componente || '',
    fecha: h.fecha || '',
    puntaje,
    sobre: h.sobre != null ? Number(h.sobre) : 100,
    estado:
      h.estado ||
      (puntaje != null ? (puntaje >= 60 ? 'Aprobada' : 'Por debajo del mínimo') : '—'),
    tono:
      h.tono || (puntaje != null ? (puntaje >= 60 ? '#16A34A' : '#DC2626') : '#9CA3AF')
  };
}

// Resultados del estudiante (F5): prefiere /resultados, luego /historial;
// si ninguno está montado, usa el historial demo sin romper la vista.
export async function obtenerResultados() {
  try {
    const data = await fetchJSON('/api/estudiante/resultados');
    const lista =
      data?.resultados ?? data?.historial ?? data?.data ?? (Array.isArray(data) ? data : null);
    if (Array.isArray(lista)) {
      return { fuente: 'api', historial: lista.map(normalizarResultado) };
    }
  } catch (error) {
    if (!esEndpointNoMontado(error)) {
      console.warn('No se pudo cargar /resultados:', error.message);
    }
  }
  const hist = await obtenerHistorial();
  if (hist) return { fuente: 'api', historial: hist.map(normalizarResultado) };
  return { fuente: 'demo', historial: HISTORIAL_DEMO.map(normalizarResultado) };
}

export { apiBaseURL };
