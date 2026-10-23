// Asistente de redacción para pruebas Saber Pro.
//
// Genera BORRADORES de reactivos a partir de un tema y una competencia para que
// el docente los revise, corrija, edite y decida cuáles guardar. Funciona sin
// conexión y sirve de respaldo del endpoint POST /api/docente/saber-pro/asistente
// (si el backend lo implementa, el servicio devuelve las sugerencias reales y
// este asistente se usa solo cuando no hay respuesta).
//
// No sustituye a la revisión del docente: los borradores son plantillas de
// apoyo, nunca reactivos definitivos.

export const COMPETENCIAS_SABER_PRO = [
  { valor: 'lectura-critica', etiqueta: 'Lectura crítica', contexto: 'la interpretación de textos y la argumentación' },
  { valor: 'razonamiento-cuantitativo', etiqueta: 'Razonamiento cuantitativo', contexto: 'la modelación y solución de problemas con datos' },
  { valor: 'competencias-ciudadanas', etiqueta: 'Competencias ciudadanas', contexto: 'la convivencia, la participación y el pluralismo' },
  { valor: 'comunicacion-escrita', etiqueta: 'Comunicación escrita', contexto: 'la redacción clara, coherente y cohesionada' },
  { valor: 'ingles', etiqueta: 'Inglés', contexto: 'la comprensión y el uso del idioma' },
  { valor: 'proyectos-ingenieria', etiqueta: 'Formulación de proyectos de ingeniería', contexto: 'el diseño y la gestión de soluciones técnicas' }
];

export const DIFICULTADES = ['baja', 'media', 'alta'];

const PLANTILLAS_CERRADA = [
  {
    enunciado: ({ tema }) =>
      `Con base en la situación planteada sobre ${tema}, ¿cuál de las siguientes opciones describe mejor una característica central del tema?`,
    correcta: ({ tema }) => `Presenta una característica verificable de ${tema} y la sustenta con un ejemplo.`,
    distractores: [
      ({ tema }) => `Menciona ${tema} sin relacionarlo con el contexto de la situación.`,
      ({ tema }) => `Atribuye a ${tema} una característica que corresponde a otro concepto.`,
      () => 'Formula una opinión personal sin respaldo en la información.'
    ]
  },
  {
    enunciado: ({ tema, competencia }) =>
      `Un estudiante debe resolver una situación sobre ${tema}. ¿Qué acción demuestra mejor el desarrollo de la competencia de ${competencia}?`,
    correcta: ({ tema }) => `Analiza la situación, identifica las variables de ${tema} y justifica la decisión tomada.`,
    distractores: [
      ({ tema }) => `Responde por intuición sin analizar los datos disponibles sobre ${tema}.`,
      () => 'Copia una respuesta de un ejercicio anterior sin adaptarla al caso.',
      () => 'Selecciona la opción más extensa aunque no responda la pregunta.'
    ]
  },
  {
    enunciado: ({ tema }) =>
      `¿Cuál de los siguientes enunciados sobre ${tema} requiere mayor nivel de análisis para ser aceptado como válido?`,
    correcta: ({ tema }) =>
      `El enunciado que relaciona dos o más condiciones de ${tema} y las contrasta con la evidencia disponible.`,
    distractores: [
      ({ tema }) => `El enunciado que define ${tema} de memoria sin considerar el contexto.`,
      () => 'El enunciado que repite la primera idea que aparece en el texto.',
      () => 'El enunciado que se apoya en una única fuente sin verificarla.'
    ]
  },
  {
    enunciado: ({ tema, competencia }) =>
      `En el marco de ${competencia}, un grupo debate sobre ${tema}. ¿Cuál intervención aporta mejor a la solución del problema?`,
    correcta: ({ tema }) => `La intervención que delimita el problema de ${tema} y propone criterios para evaluar alternativas.`,
    distractores: [
      () => 'La intervención que cambia de tema para evitar el desacuerdo.',
      ({ tema }) => `La intervención que impone una postura sin escuchar los argumentos sobre ${tema}.`,
      () => 'La intervención que se limita a resumir lo ya dicho sin agregar análisis.'
    ]
  }
];

const PLANTILLAS_ABIERTA = [
  ({ tema, competencia }) =>
    `Explique cómo ${tema} se relaciona con el desarrollo de la competencia de ${competencia}. Argumente con al menos un ejemplo y una consecuencia.`,
  ({ tema }) =>
    `Describa una situación real donde ${tema} tenga impacto y justifique su respuesta con evidencia.`,
  ({ tema, competencia }) =>
    `A partir de ${tema}, proponga una solución y evalúela de acuerdo con los criterios de ${competencia}.`,
  ({ tema }) =>
    `Compare dos posturas frente a ${tema}. Indique cuál considera más sólida y por qué.`
];

let contador = 0;

// Genera borradores listos para revisar/editar. `tipo`: CERRADA | ABIERTA.
export function generarBorradores({
  tema = '',
  competencia = 'lectura-critica',
  cantidad = 3,
  tipo = 'CERRADA',
  dificultad = 'media'
} = {}) {
  const temaLimpio = String(tema || '').trim() || 'el tema propuesto';
  const competenciaObj =
    COMPETENCIAS_SABER_PRO.find((c) => c.valor === competencia) || COMPETENCIAS_SABER_PRO[0];
  const competenciaTexto = competenciaObj.etiqueta.toLowerCase();
  const total = Math.min(Math.max(Number(cantidad) || 1, 1), 10);
  const borradores = [];

  for (let i = 0; i < total; i += 1) {
    contador += 1;
    const base = {
      id: `borrador-${contador}`,
      tipo,
      puntaje: '1',
      dificultad,
      competencia: competenciaObj.etiqueta
    };

    if (tipo === 'ABIERTA') {
      const plantilla = PLANTILLAS_ABIERTA[i % PLANTILLAS_ABIERTA.length];
      borradores.push({
        ...base,
        enunciado: plantilla({ tema: temaLimpio, competencia: competenciaTexto }),
        opciones: [],
        correctaIndex: -1
      });
      continue;
    }

    const plantilla = PLANTILLAS_CERRADA[i % PLANTILLAS_CERRADA.length];
    const textoCorrecto = plantilla.correcta({ tema: temaLimpio, competencia: competenciaTexto });
    const distractores = plantilla.distractores.map((fn) =>
      fn({ tema: temaLimpio, competencia: competenciaTexto })
    );
    const correctaIndex = i % 4;
    const opciones = [];
    let d = 0;
    for (let pos = 0; pos < 4; pos += 1) {
      if (pos === correctaIndex) {
        opciones.push({ texto: textoCorrecto });
      } else {
        opciones.push({ texto: distractores[(i + d++) % distractores.length] });
      }
    }

    borradores.push({
      ...base,
      enunciado: plantilla.enunciado({ tema: temaLimpio, competencia: competenciaTexto }),
      opciones,
      correctaIndex
    });
  }

  return borradores;
}

const limpiar = (texto) => String(texto ?? '').replace(/\s+/g, ' ').trim();
const capitalizar = (texto) => {
  const limpio = limpiar(texto);
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : limpio;
};
const finalizar = (texto) => {
  const capitalizado = capitalizar(texto);
  return capitalizado && !/[.?!:;]$/.test(capitalizado) ? `${capitalizado}.` : capitalizado;
};

// Devuelve las observaciones de un reactivo (lista vacía = sin hallazgos).
export function revisarReactivo(reactivo) {
  const observaciones = [];
  const enunciado = limpiar(reactivo?.enunciado);
  if (!enunciado) observaciones.push('El enunciado está vacío.');
  else if (enunciado.length < 30) observaciones.push('El enunciado es muy corto; añada el contexto de la situación.');
  else if (enunciado.length > 400) observaciones.push('El enunciado es muy extenso; considere dividir la situación.');

  if (reactivo?.tipo === 'ABIERTA') {
    if (!enunciado) observaciones.push('Describa con claridad la tarea que debe realizar el estudiante.');
  } else {
    const opciones = (reactivo?.opciones || []).map((o) => limpiar(o?.texto));
    opciones.forEach((opcion, indice) => {
      if (!opcion) observaciones.push(`La opción ${indice + 1} está vacía.`);
    });
    const llenas = opciones.filter(Boolean);
    const repetidas = llenas.filter(
      (opcion, indice) => llenas.findIndex((o) => o.toLowerCase() === opcion.toLowerCase()) !== indice
    );
    if (repetidas.length) observaciones.push('Hay opciones repetidas.');
    if (!(reactivo?.correctaIndex >= 0 && reactivo?.correctaIndex < opciones.length)) {
      observaciones.push('No se ha marcado la opción correcta.');
    } else if (!opciones[reactivo.correctaIndex]) {
      observaciones.push('La opción marcada como correcta está vacía.');
    }
  }

  const puntaje = Number(reactivo?.puntaje);
  if (!Number.isFinite(puntaje) || puntaje <= 0) observaciones.push('El puntaje debe ser mayor que cero.');

  return observaciones;
}

// Normaliza el texto de un reactivo (espacios, mayúsculas y puntuación final).
export function corregirReactivo(reactivo) {
  const corregido = { ...reactivo, enunciado: finalizar(reactivo?.enunciado) };
  if (reactivo?.tipo !== 'ABIERTA') {
    corregido.opciones = (reactivo?.opciones || []).map((opcion) => ({
      ...opcion,
      texto: finalizar(opcion?.texto)
    }));
  }
  return corregido;
}
