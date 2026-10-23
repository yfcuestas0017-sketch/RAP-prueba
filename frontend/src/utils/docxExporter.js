// Genera un archivo .docx (WordprocessingML) a partir del contenido de un
// nodo del DOM, sin usar librerías externas. Devuelve un Blob listo para
// descargar con file-saver.
//
// El objetivo es que el .docx conserve el aspecto del documento que se ve en
// pantalla (PDF/previsualización): encabezados, cuadros con fondo, tablas con
// bordes y anchos reales, negritas, subrayados, listas y colores. Para lograrlo
// el exportador:
//   - recorre el DOM construyendo párrafos con "runs" (trozos de texto con
//     formato propio), de modo que un párrafo como "<b>RAP 2.</b> Diseña..."
//     conserve la negrita solo en "RAP 2.";
//   - traduce cualquier color (rgb, hex, oklch/lab/lch modernos) a hex;
//   - calcula los anchos de columna de cada tabla a partir de la medida real en
//     pantalla, para que Word no reparta las columnas en partes iguales;
//   - conserva combinaciones de celdas (colSpan/rowSpan) y repite la fila de
//     encabezado en cada hoja;
//   - convierte <ul>/<ol> en listas nativas de Word (numbering.xml);
//   - aplica una fuente y tamaño base institucionales mediante styles.xml.

const encoder = new TextEncoder();

// 1 px CSS = 1/96 in y 1 in = 1440 twips (unidad interna de Word).
const PX_A_TWIPS = 1440 / 96;
// 1 px CSS = 9525 EMU (unidad de las imágenes en OOXML).
const EMU_POR_PX = 9525;

const NUM_ID_VINETA = 1;
const NUM_ID_NUMERADA = 2;
const NIVELES_LISTA = 5;

// Tabla CRC32 usada por el formato ZIP.
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Empaqueta archivos en un ZIP sin compresión (método "store"),
// que es lo que exige el formato OOXML.
function zipStore(files) {
  const chunks = [];
  const central = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const { data } = file;
    const crc = crc32(data);

    const local = new Uint8Array(30 + nameBytes.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true); // firma local
    localView.setUint16(4, 20, true); // versión requerida
    localView.setUint16(6, 0, true); // banderas
    localView.setUint16(8, 0, true); // método: store
    localView.setUint16(10, 0, true); // hora
    localView.setUint16(12, 0, true); // fecha
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true); // extra
    local.set(nameBytes, 30);
    chunks.push(local, data);

    const dir = new Uint8Array(46 + nameBytes.length);
    const dirView = new DataView(dir.buffer);
    dirView.setUint32(0, 0x02014b50, true); // firma directorio central
    dirView.setUint16(4, 20, true); // creado por
    dirView.setUint16(6, 20, true); // requerido por
    dirView.setUint16(8, 0, true); // banderas
    dirView.setUint16(10, 0, true); // método
    dirView.setUint16(12, 0, true); // hora
    dirView.setUint16(14, 0, true); // fecha
    dirView.setUint32(16, crc, true);
    dirView.setUint32(20, data.length, true);
    dirView.setUint32(24, data.length, true);
    dirView.setUint16(28, nameBytes.length, true);
    dirView.setUint16(30, 0, true); // extra
    dirView.setUint16(32, 0, true); // comentario
    dirView.setUint16(34, 0, true); // disco
    dirView.setUint16(36, 0, true); // attrs internos
    dirView.setUint32(38, 0, true); // attrs externos
    dirView.setUint32(42, offset, true); // offset del header local
    dir.set(nameBytes, 46);
    central.push(dir);

    offset += local.length + data.length;
  });

  const centralSize = central.reduce((sum, entry) => sum + entry.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true); // firma fin de registro
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true); // comentario

  return new Blob([...chunks, ...central, end], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

function escapeXml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ---------------------------------------------------------------------------
// Colores: convierte cualquier color del navegador (incluidas las funciones
// modernas oklch/lab/lch/color que usa Tailwind v4) a un hex válido para Word.
// ---------------------------------------------------------------------------
let lienzoColor = null;

function resolverColorModerno(texto) {
  if (!/^(oklch|oklab|lab|lch|color|hwb)\(/i.test(texto)) return texto;
  try {
    if (!lienzoColor) {
      lienzoColor = document.createElement('canvas');
      lienzoColor.width = 1;
      lienzoColor.height = 1;
    }
    const contexto = lienzoColor.getContext('2d');
    contexto.clearRect(0, 0, 1, 1);
    contexto.fillStyle = '#010203'; // valor centinela
    contexto.fillStyle = texto;
    if (contexto.fillStyle === '#010203') return texto; // el navegador no lo soporta
    contexto.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = contexto.getImageData(0, 0, 1, 1).data;
    if (a === 0) return '';
    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  } catch {
    return texto;
  }
}

function colorToHex(value) {
  const resuelto = resolverColorModerno(String(value || '').trim());
  if (!resuelto || resuelto === 'transparent') return '';

  let r;
  let g;
  let b;
  let a = 1;

  const rgbMatch = resuelto.match(/^rgba?\(([^)]+)\)$/i);
  if (rgbMatch) {
    const partes = rgbMatch[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    [r, g, b] = partes;
    if (partes.length >= 4) a = partes[3];
  } else if (/^#[0-9a-f]{3,8}$/i.test(resuelto)) {
    let hex = resuelto.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if (hex.length === 8) a = parseInt(hex.slice(6, 8), 16) / 255;
  } else {
    return '';
  }

  if (![r, g, b].every(Number.isFinite) || a === 0) return '';
  return [r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

// ---------------------------------------------------------------------------
// Estilos por elemento
// ---------------------------------------------------------------------------
const TAGS_INLINE = new Set([
  'SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'A', 'SUP', 'SUB', 'CODE', 'SMALL',
  'FONT', 'MARK', 'S', 'DEL', 'INS', 'BR', 'CITE', 'Q', 'ABBR', 'TIME', 'LABEL'
]);

// Celdas y tablas ya dibujan sus propios bordes: convertirlos además en borde
// de párrafo los duplicaría.
const TAGS_SIN_BORDE_PARRAFO = new Set(['TD', 'TH', 'TR', 'TABLE', 'THEAD', 'TBODY', 'TFOOT']);

// Elementos que, aunque no sean "de bloque" en HTML, se exportan como bloque.
const TAGS_BLOQUE_ESPECIAL = new Set(['TABLE', 'IMG', 'UL', 'OL', 'HR']);

function esInline(tag) {
  return TAGS_INLINE.has(tag);
}

function esNodoEnLinea(nodo) {
  if (!nodo) return true;
  if (nodo.nodeType !== 1) return true;
  if (TAGS_BLOQUE_ESPECIAL.has(nodo.tagName)) return false;
  return esInline(nodo.tagName);
}

// Word solo empaqueta tres familias de fuentes de forma universal; cualquier
// otra se sustituye por Arial para no depender de fuentes instaladas.
function normalizarFuente(familiaCss) {
  const familia = String(familiaCss || '').toLowerCase();
  if (familia.includes('mono') || familia.includes('courier')) return 'Courier New';
  if (familia.includes('times') || familia.includes('georgia') || familia.includes('garamond')) {
    return 'Times New Roman';
  }
  if (familia.includes('serif') && !familia.includes('sans-serif')) return 'Times New Roman';
  return ''; // style.xml ya define Arial
}

function isBold(element) {
  const tag = element.tagName;
  if (/^H[1-6]$/.test(tag) || tag === 'STRONG' || tag === 'B' || tag === 'TH') return true;
  try {
    const weight = parseInt(window.getComputedStyle(element).fontWeight, 10);
    return Number.isFinite(weight) ? weight >= 600 : false;
  } catch {
    return false;
  }
}

function elementosOcultos(computed) {
  return computed.display === 'none' || computed.visibility === 'hidden';
}

function getElementStyle(element) {
  try {
    const computed = window.getComputedStyle(element);
    const decoracion = `${computed.textDecorationLine || ''} ${computed.textDecoration || ''}`;
    const bordeInferior = parseFloat(computed.borderBottomWidth) || 0;
    return {
      bold: isBold(element),
      italic: computed.fontStyle === 'italic' || computed.fontStyle === 'oblique',
      underline: decoracion.includes('underline'),
      strike: decoracion.includes('line-through'),
      uppercase: computed.textTransform === 'uppercase',
      color: colorToHex(computed.color),
      background: colorToHex(computed.backgroundColor),
      fontSize: Number.parseFloat(computed.fontSize) || 0,
      fontFamily: normalizarFuente(computed.fontFamily),
      align: computed.textAlign,
      verticalAlign: computed.verticalAlign,
      marginTop: Number.parseFloat(computed.marginTop) || 0,
      marginBottom: Number.parseFloat(computed.marginBottom) || 0,
      paddingLeft: Number.parseFloat(computed.paddingLeft) || 0,
      display: computed.display,
      visibility: computed.visibility,
      borderBottom:
        !TAGS_SIN_BORDE_PARRAFO.has(element.tagName) &&
        bordeInferior > 0 &&
        computed.borderBottomStyle !== 'none'
          ? { width: bordeInferior, color: colorToHex(computed.borderBottomColor) || '000000' }
          : null
    };
  } catch {
    return { bold: isBold(element) };
  }
}

// ---------------------------------------------------------------------------
// Párrafos y runs
// ---------------------------------------------------------------------------
// Recorre el contenido en línea de un elemento y devuelve una lista de runs
// (texto + formato), respetando negritas/cursivas/colores y mayúsculas
// parciales del formato original. Las listas anidadas se omiten porque se
// exportan como párrafos con numeración propia.
function recolectarRuns(elemento, heredado = {}) {
  const propio = getElementStyle(elemento);
  const base = {
    bold: Boolean(heredado.bold || propio.bold),
    italic: Boolean(heredado.italic || propio.italic),
    underline: Boolean(heredado.underline || propio.underline),
    strike: Boolean(heredado.strike || propio.strike),
    uppercase: Boolean(heredado.uppercase || propio.uppercase),
    color: propio.color || heredado.color || '',
    fontSize: propio.fontSize || heredado.fontSize || 0,
    fontFamily: propio.fontFamily || heredado.fontFamily || ''
  };

  const runs = [];
  elemento.childNodes.forEach((nodo) => {
    if (nodo.nodeType === 3) {
      const texto = nodo.textContent.replace(/\s+/g, ' ');
      if (texto) runs.push({ texto: base.uppercase ? texto.toUpperCase() : texto, ...base });
      return;
    }
    if (nodo.nodeType !== 1) return;
    if (nodo.tagName === 'UL' || nodo.tagName === 'OL') return;

    if (nodo.tagName === 'BR') {
      runs.push({ texto: '\n', ...base });
      return;
    }
    runs.push(...recolectarRuns(nodo, base));
  });

  return runs;
}

function runDesdeTexto(texto, estilo) {
  const limpio = String(texto || '').replace(/\s+/g, ' ');
  if (!limpio) return null;
  return {
    texto: estilo.uppercase ? limpio.toUpperCase() : limpio,
    bold: Boolean(estilo.bold),
    italic: Boolean(estilo.italic),
    underline: Boolean(estilo.underline),
    strike: Boolean(estilo.strike),
    color: estilo.color || '',
    fontSize: estilo.fontSize || 0,
    fontFamily: estilo.fontFamily || ''
  };
}

// Propiedades de párrafo en el orden que exige el esquema OOXML (w:pPr):
// keepNext, numPr, pBdr, shd, spacing, ind y jc.
function propiedadesParrafo(style = {}) {
  const partes = [];

  if (style.keepNext) partes.push('<w:keepNext/>');

  if (style.numId) {
    partes.push(
      `<w:numPr><w:ilvl w:val="${Math.min(NIVELES_LISTA - 1, style.ilvl || 0)}"/>` +
        `<w:numId w:val="${style.numId}"/></w:numPr>`
    );
  }

  if (style.borderBottom?.width > 0) {
    const grosor = Math.max(2, Math.min(24, Math.round(style.borderBottom.width * 6)));
    partes.push(
      '<w:pBdr><w:bottom ' +
        `w:val="single" w:sz="${grosor}" w:space="1" w:color="${style.borderBottom.color || '000000'}"/></w:pBdr>`
    );
  }

  if (style.background && style.background !== 'FFFFFF' && style.background !== '00000000') {
    partes.push(`<w:shd w:val="clear" w:color="auto" w:fill="${style.background}"/>`);
  }

  const antes = Math.round((style.marginTop || 0) * PX_A_TWIPS);
  const despues = Math.round((style.marginBottom || 0) * PX_A_TWIPS);
  if (antes > 0 || despues > 0) {
    const atributos = [
      antes > 0 ? `w:before="${antes}"` : '',
      despues > 0 ? `w:after="${despues}"` : ''
    ].filter(Boolean).join(' ');
    partes.push(`<w:spacing ${atributos}/>`);
  }

  if (style.numId) {
    const nivel = Math.min(NIVELES_LISTA - 1, style.ilvl || 0);
    partes.push(`<w:ind w:left="${720 * (nivel + 1)}" w:hanging="360"/>`);
  }

  if (style.align === 'center' || style.align === 'right' || style.align === 'justify') {
    const align = style.align === 'center' ? 'center' : style.align === 'right' ? 'right' : 'both';
    partes.push(`<w:jc w:val="${align}"/>`);
  }

  return partes.length ? `<w:pPr>${partes.join('')}</w:pPr>` : '';
}

function buildParagraph(runsOrText, style = {}) {
  const runs = typeof runsOrText === 'string'
    ? [{ texto: runsOrText, bold: style.bold, color: style.color, fontSize: style.fontSize }]
    : (runsOrText || []);

  const pPr = propiedadesParrafo(style);

  const runsXml = runs
    .map((run) => {
      const texto = String(run.texto ?? '');
      if (!texto) return '';

      // Orden del esquema w:rPr: rFonts, b, i, strike, color, sz, u.
      const runProperties = [];
      const fuente = run.fontFamily || style.fontFamily;
      if (fuente) {
        runProperties.push(`<w:rFonts w:ascii="${fuente}" w:hAnsi="${fuente}" w:cs="${fuente}"/>`);
      }
      if (run.bold || style.bold) runProperties.push('<w:b/>');
      if (run.italic || style.italic) runProperties.push('<w:i/>');
      if (run.strike) runProperties.push('<w:strike/>');
      if (run.color) runProperties.push(`<w:color w:val="${run.color}"/>`);
      const fontSize = run.fontSize || style.fontSize;
      if (fontSize) {
        const medioPunto = Math.max(2, Math.round(fontSize * 1.5));
        runProperties.push(`<w:sz w:val="${medioPunto}"/><w:szCs w:val="${medioPunto}"/>`);
      }
      if (run.underline) runProperties.push('<w:u w:val="single"/>');

      const rPr = runProperties.length ? `<w:rPr>${runProperties.join('')}</w:rPr>` : '';
      const contenido = texto
        .split('\n')
        .map((parte, i) => `${i > 0 ? '<w:br/>' : ''}<w:t xml:space="preserve">${escapeXml(parte)}</w:t>`)
        .join('');
      return `<w:r>${rPr}${contenido}</w:r>`;
    })
    .join('');

  return `<w:p>${pPr}${runsXml}</w:p>`;
}

function buildImageParagraph(image) {
  const widthEmu = Math.max(1, Math.round(image.width * EMU_POR_PX));
  const heightEmu = Math.max(1, Math.round(image.height * EMU_POR_PX));
  const alineacion = image.align === 'left' || image.align === 'right' ? image.align : 'center';
  return `<w:p><w:pPr><w:jc w:val="${alineacion}"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${widthEmu}" cy="${heightEmu}"/><wp:docPr id="${image.docId}" name="${escapeXml(image.name)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${image.docId}" name="${escapeXml(image.name)}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${image.relationshipId}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${widthEmu}" cy="${heightEmu}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
}

// ---------------------------------------------------------------------------
// Listas (viñetas y numeradas)
// ---------------------------------------------------------------------------
function recolectarLista(lista, registerImage, contexto, nivel) {
  const numId = lista.tagName === 'OL' ? NUM_ID_NUMERADA : NUM_ID_VINETA;
  const bloques = [];

  Array.from(lista.children).forEach((item) => {
    if (item.tagName !== 'LI') return;

    const runs = recolectarRuns(item, {});
    if (runs.map((run) => run.texto).join('').trim()) {
      bloques.push({
        type: 'p',
        runs,
        style: { ...getElementStyle(item), numId, ilvl: nivel, marginTop: 0, marginBottom: 0 }
      });
    }

    Array.from(item.children).forEach((nieto) => {
      if (nieto.tagName === 'UL' || nieto.tagName === 'OL') {
        bloques.push(...recolectarLista(nieto, registerImage, contexto, Math.min(nivel + 1, NIVELES_LISTA - 1)));
      }
    });
  });

  return bloques;
}

// ---------------------------------------------------------------------------
// Bloques (párrafos / tablas / imágenes / listas / saltos de página)
// ---------------------------------------------------------------------------
function recolectarBloques(elemento, registerImage, contexto, nivelLista = 0) {
  const bloques = [];
  const estiloContenedor = getElementStyle(elemento);
  if (elementosOcultos(estiloContenedor)) return bloques;

  const hijos = Array.from(elemento.childNodes).filter(
    (nodo) => nodo.nodeType === 1 || (nodo.nodeType === 3 && nodo.textContent.trim())
  );

  if (hijos.length === 0) {
    const runs = recolectarRuns(elemento, {});
    if (runs.map((run) => run.texto).join('').trim()) {
      bloques.push({ type: 'p', runs, style: estiloContenedor });
    }
    return bloques;
  }

  // Si todo el contenido es en línea, el contenedor es un párrafo.
  if (hijos.every(esNodoEnLinea)) {
    const runs = recolectarRuns(elemento, {});
    if (runs.map((run) => run.texto).join('').trim()) {
      bloques.push({ type: 'p', runs, style: estiloContenedor });
    }
    return bloques;
  }

  // Los nodos de texto y los elementos en línea consecutivos se agrupan en un
  // mismo párrafo; los bloques (tablas, listas, imágenes) se procesan aparte.
  let acumulado = [];
  const vaciarAcumulado = () => {
    if (!acumulado.length) return;
    if (acumulado.map((run) => run.texto).join('').trim()) {
      bloques.push({ type: 'p', runs: acumulado, style: estiloContenedor });
    }
    acumulado = [];
  };

  hijos.forEach((hijo) => {
    if (hijo.nodeType === 3) {
      const run = runDesdeTexto(hijo.textContent, estiloContenedor);
      if (run) acumulado.push(run);
      return;
    }

    if (hijo.dataset?.docxPageBreak === 'true') {
      vaciarAcumulado();
      bloques.push({ type: 'pageBreak' });
    }

    if (hijo.tagName === 'UL' || hijo.tagName === 'OL') {
      vaciarAcumulado();
      bloques.push(...recolectarLista(hijo, registerImage, contexto, nivelLista));
      return;
    }
    if (hijo.tagName === 'TABLE') {
      vaciarAcumulado();
      bloques.push({ type: 'table', tabla: leerTabla(hijo, registerImage, contexto) });
      return;
    }
    if (hijo.tagName === 'IMG') {
      vaciarAcumulado();
      const imagen = registerImage(hijo);
      if (imagen) bloques.push({ type: 'image', image: imagen });
      return;
    }
    if (hijo.tagName === 'HR') {
      vaciarAcumulado();
      const estilo = getElementStyle(hijo);
      bloques.push({
        type: 'p',
        runs: [{ texto: '' }],
        style: { ...estilo, borderBottom: estilo.borderBottom || { width: 1, color: '000000' } }
      });
      return;
    }
    if (esNodoEnLinea(hijo)) {
      const runs = recolectarRuns(hijo, {});
      if (runs.map((run) => run.texto).join('').trim()) acumulado.push(...runs);
      return;
    }

    vaciarAcumulado();
    bloques.push(...recolectarBloques(hijo, registerImage, contexto, nivelLista));
  });

  vaciarAcumulado();
  return bloques;
}

// ---------------------------------------------------------------------------
// Tablas
// ---------------------------------------------------------------------------
function medirColumnas(table) {
  const filas = Array.from(table.rows).slice(0, 12);
  let mejor = null;

  filas.forEach((fila) => {
    const propias = Array.from(fila.cells).filter((celda) => celda.parentElement === fila);
    if (!propias.length) return;

    const columnas = propias.reduce((total, celda) => total + Math.max(1, celda.colSpan || 1), 0);
    // Se prefieren filas con celdas individuales: una fila que solo tiene un
    // td con colSpan=4 no permite conocer el ancho real de cada columna.
    const simples = propias.filter((celda) => (celda.colSpan || 1) === 1).length;
    const puntaje = simples * 1000 + columnas;
    if (mejor && mejor.puntaje >= puntaje) return;

    const anchos = [];
    propias.forEach((celda) => {
      const span = Math.max(1, celda.colSpan || 1);
      const ancho = celda.getBoundingClientRect().width / span;
      for (let k = 0; k < span; k += 1) anchos.push(ancho);
    });
    mejor = { puntaje, columnas, anchos };
  });

  if (!mejor) return [];
  const suma = mejor.anchos.reduce((total, ancho) => total + ancho, 0);
  if (suma <= 0) return new Array(mejor.columnas).fill(0);
  return mejor.anchos;
}

function leerBordesTabla(table) {
  const muestra = table.querySelector('td, th');
  if (!muestra) return null;
  try {
    const computed = window.getComputedStyle(muestra);
    const ancho = parseFloat(computed.borderTopWidth) || 0;
    if (ancho <= 0 || computed.borderTopStyle === 'none' || computed.borderTopStyle === 'hidden') {
      return null;
    }
    return { width: ancho, color: colorToHex(computed.borderTopColor) || '000000' };
  } catch {
    return null;
  }
}

function leerTabla(table, registerImage, contexto) {
  const filasDom = Array.from(table.rows);
  const filas = [];
  const merges = []; // combinaciones verticales activas: { columna, span, restantes }

  const rectTabla = table.getBoundingClientRect();
  const anchoPx = rectTabla.width || 0;
  // La previsualización es la hoja: el ancho de la tabla se expresa como
  // porcentaje de la hoja para que Word lo reproduzca con sus propios márgenes.
  const anchoTwips = anchoPx > 0
    ? Math.max(
        1200,
        Math.min(
          contexto.anchoContenidoTwips,
          Math.round((anchoPx / contexto.anchoPaginaPx) * contexto.anchoPaginaTwips)
        )
      )
    : contexto.anchoContenidoTwips;

  const columnasPx = medirColumnas(table);
  const sumaColumnas = columnasPx.reduce((total, ancho) => total + ancho, 0) || 0;
  const columnasTwips = sumaColumnas > 0
    ? columnasPx.map((ancho) => Math.max(240, Math.round((ancho / sumaColumnas) * anchoTwips)))
    : [];

  filasDom.forEach((fila) => {
    const continuaciones = merges
      .filter((merge) => merge.restantes > 0)
      .map((merge) => ({ columna: merge.columna, span: merge.span, continuacion: true }));

    const tomadas = new Set(continuaciones.map((celda) => celda.columna));
    const estiloFila = getElementStyle(fila);
    const propias = Array.from(fila.cells).filter((celda) => celda.parentElement === fila);
    const celdas = [];
    let columna = 0;

    propias.forEach((celda) => {
      const span = Math.max(1, celda.colSpan || 1);
      while (tomadas.has(columna)) columna += 1;

      const estilo = getElementStyle(celda);
      celdas.push({
        columna,
        span,
        rowSpan: Math.max(1, celda.rowSpan || 1),
        background: estilo.background || estiloFila.background,
        valign: estilo.verticalAlign || estiloFila.verticalAlign,
        bloques: recolectarBloques(celda, registerImage, contexto)
      });

      for (let k = 0; k < span; k += 1) tomadas.add(columna + k);
      columna += span;
    });

    // Descontar un renglón a las combinaciones que ya se dibujaron.
    merges.forEach((merge) => {
      if (merge.restantes > 0) merge.restantes -= 1;
    });
    for (let i = merges.length - 1; i >= 0; i -= 1) {
      if (merges[i].restantes <= 0) merges.splice(i, 1);
    }
    celdas.forEach((celda) => {
      if (celda.rowSpan > 1) {
        merges.push({ columna: celda.columna, span: celda.span, restantes: celda.rowSpan - 1 });
      }
    });

    const todas = [...celdas, ...continuaciones].sort((a, b) => a.columna - b.columna);
    const esEncabezado =
      fila.parentElement?.tagName === 'THEAD' ||
      (filas.length === 0 && todas.length > 0 && propias.every((celda) => celda.tagName === 'TH'));

    filas.push({ celdas: todas, esEncabezado });
  });

  return {
    filas,
    columnasTwips,
    anchoTwips,
    bordes: leerBordesTabla(table)
  };
}

function construirCelda(celda, columnasTwips) {
  const propiedades = [];

  const ancho = columnasTwips.length
    ? columnasTwips
        .slice(celda.columna, celda.columna + celda.span)
        .reduce((total, valor) => total + valor, 0)
    : 0;
  propiedades.push(ancho > 0 ? `<w:tcW w:w="${ancho}" w:type="dxa"/>` : '<w:tcW w:w="0" w:type="auto"/>');
  if (celda.span > 1) propiedades.push(`<w:gridSpan w:val="${celda.span}"/>`);

  if (celda.continuacion) {
    propiedades.push('<w:vMerge/>');
  } else if (celda.rowSpan > 1) {
    propiedades.push('<w:vMerge w:val="restart"/>');
  }

  if (celda.background && celda.background !== 'FFFFFF' && celda.background !== '00000000') {
    propiedades.push(`<w:shd w:val="clear" w:color="auto" w:fill="${celda.background}"/>`);
  }

  if (celda.valign === 'top' || celda.valign === 'middle' || celda.valign === 'bottom') {
    propiedades.push(`<w:vAlign w:val="${celda.valign === 'middle' ? 'center' : celda.valign}"/>`);
  }

  const contenido = (celda.bloques || []).map(bloqueAXml).join('');
  // En Word una celda debe terminar en párrafo: si lo último es una tabla
  // anidada se agrega un párrafo vacío de cierre.
  const cierre = contenido.endsWith('</w:tbl>') ? '<w:p/>' : '';
  return `<w:tc><w:tcPr>${propiedades.join('')}</w:tcPr>${contenido || '<w:p/>'}${cierre}</w:tc>`;
}

// Reparte el ancho de la tabla entre las columnas medidas en pantalla y ajusta
// los redondeos para que la suma coincida exactamente con el ancho de la tabla.
function ajustarColumnas(columnasTwips, anchoTwips) {
  if (!columnasTwips.length) return [];

  const suma = columnasTwips.reduce((total, ancho) => total + ancho, 0);
  if (suma <= 0) {
    const partes = Math.floor(anchoTwips / columnasTwips.length);
    return columnasTwips.map((_, indice) =>
      indice === columnasTwips.length - 1
        ? anchoTwips - partes * (columnasTwips.length - 1)
        : partes
    );
  }

  const factor = anchoTwips / suma;
  const ajustadas = columnasTwips.map((ancho) => Math.max(240, Math.round(ancho * factor)));
  const diferencia = anchoTwips - ajustadas.reduce((total, ancho) => total + ancho, 0);
  ajustadas[ajustadas.length - 1] += diferencia;
  return ajustadas;
}

function construirTabla(tabla) {
  const { filas, bordes } = tabla;
  const columnas = ajustarColumnas(tabla.columnasTwips, tabla.anchoTwips);
  const anchoFinal = columnas.length
    ? columnas.reduce((total, ancho) => total + ancho, 0)
    : tabla.anchoTwips;

  const borders = bordes
    ? '<w:tblBorders>' +
      ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
        .map((lado) => {
          const sz = Math.max(2, Math.min(24, Math.round(bordes.width * 6)));
          return `<w:${lado} w:val="single" w:sz="${sz}" w:space="0" w:color="${bordes.color}"/>`;
        })
        .join('') +
      '</w:tblBorders>'
    : '';

  // El ancho real de la tabla y de sus columnas evita que Word las reparta en
  // partes iguales y respeta proporciones como 12% / 38% / 12% / 38%.
  const grid = columnas.length
    ? `<w:tblGrid>${columnas.map((ancho) => `<w:gridCol w:w="${ancho}"/>`).join('')}</w:tblGrid>`
    : '';
  const layout = columnas.length ? '<w:tblLayout w:type="fixed"/>' : '';

  const cellMargins =
    '<w:tblCellMar>' +
    '<w:top w:w="20" w:type="dxa"/><w:left w:w="60" w:type="dxa"/>' +
    '<w:bottom w:w="20" w:type="dxa"/><w:right w:w="60" w:type="dxa"/>' +
    '</w:tblCellMar>';

  const body = filas
    .map((fila) => {
      // Orden del esquema w:trPr: cantSplit y después tblHeader.
      const propiedades = ['<w:cantSplit/>'];
      if (fila.esEncabezado) propiedades.push('<w:tblHeader/>');
      const celdas = fila.celdas.map((celda) => construirCelda(celda, columnas)).join('');
      return `<w:tr><w:trPr>${propiedades.join('')}</w:trPr>${celdas}</w:tr>`;
    })
    .join('');

  return (
    '<w:tbl>' +
    `<w:tblPr><w:tblW w:w="${anchoFinal}" w:type="dxa"/>` +
    `${borders}${layout}${cellMargins}</w:tblPr>` +
    `${grid}${body}</w:tbl>`
  );
}

function bloqueAXml(bloque) {
  if (bloque.type === 'pageBreak') return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  if (bloque.type === 'image') return buildImageParagraph(bloque.image);
  if (bloque.type === 'table') return construirTabla(bloque.tabla);
  return buildParagraph(bloque.runs, bloque.style || {});
}

// ---------------------------------------------------------------------------
// Paquete OOXML
// ---------------------------------------------------------------------------
const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
  '<w:docDefaults>' +
  '<w:rPrDefault><w:rPr>' +
  '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>' +
  '<w:sz w:val="18"/><w:szCs w:val="18"/>' +
  '<w:lang w:val="es-CO"/>' +
  '</w:rPr></w:rPrDefault>' +
  '<w:pPrDefault><w:pPr>' +
  '<w:widowControl/><w:spacing w:after="40" w:line="240" w:lineRule="auto"/>' +
  '</w:pPr></w:pPrDefault>' +
  '</w:docDefaults>' +
  '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
  '</w:styles>';

// Viñetas y numeración nativas de Word. Los niveles impares usan símbolos
// distintos para que las listas anidadas se distingan visualmente.
function numeroNivel(ilvl, esVineta) {
  if (esVineta) {
    const simbolos = ['•', '◦', '▪'];
    const simbolo = simbolos[ilvl % simbolos.length];
    return (
      `<w:lvl w:ilvl="${ilvl}">` +
      '<w:start w:val="1"/><w:numFmt w:val="bullet"/>' +
      `<w:lvlText w:val="${simbolo}"/><w:lvlJc w:val="left"/>` +
      `<w:pPr><w:ind w:left="${720 * (ilvl + 1)}" w:hanging="360"/></w:pPr>` +
      '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/></w:rPr>' +
      '</w:lvl>'
    );
  }
  return (
    `<w:lvl w:ilvl="${ilvl}">` +
    '<w:start w:val="1"/><w:numFmt w:val="decimal"/>' +
    `<w:lvlText w:val="%${ilvl + 1}."/><w:lvlJc w:val="left"/>` +
    `<w:pPr><w:ind w:left="${720 * (ilvl + 1)}" w:hanging="360"/></w:pPr>` +
    '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/></w:rPr>' +
    '</w:lvl>'
  );
}

const NUMBERING_XML = (() => {
  const niveles = Array.from({ length: NIVELES_LISTA }, (_, ilvl) => ilvl);
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>' +
    niveles.map((ilvl) => numeroNivel(ilvl, true)).join('') +
    '</w:abstractNum>' +
    '<w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>' +
    niveles.map((ilvl) => numeroNivel(ilvl, false)).join('') +
    '</w:abstractNum>' +
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>' +
    '<w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>' +
    '</w:numbering>'
  );
})();

// Referencias de medida: ancho de la hoja que se ve en pantalla y su
// equivalente en twips, para trasladar proporciones (tablas, imágenes) a Word.
function medirContexto(elemento, opciones) {
  const landscape = opciones.orientation === 'landscape';
  const anchoPaginaTwips = landscape ? 15840 : 11906;
  const margenTwips = landscape ? 605 : 1134;

  const rect = elemento.getBoundingClientRect();
  const anchoPaginaPx = Math.max(1, rect.width || elemento.scrollWidth || 960);
  const anchoContenidoTwips = anchoPaginaTwips - margenTwips * 2;

  return {
    anchoPaginaPx,
    anchoPaginaTwips,
    anchoContenidoTwips,
    anchoContenidoPx: Math.max(1, (anchoPaginaPx * anchoContenidoTwips) / anchoPaginaTwips)
  };
}

/**
 * Convierte el contenido de `element` en un Blob .docx.
 * @param {HTMLElement} element nodo con la previsualización del documento
 * @param {string} title título interno del documento
 * @param {{ orientation?: 'portrait' | 'landscape' }} options
 * @returns {Blob} archivo .docx
 */
export function elementToDocxBlob(element, title = 'Documento', options = {}) {
  if (!element) {
    throw new Error('No hay contenido para exportar a Word');
  }

  const contexto = medirContexto(element, options);
  const images = [];
  const cacheImagenes = new Map();
  let dibujos = 0;
  const registerImage = (imageElement) => {
    const source = imageElement.getAttribute('src') || imageElement.currentSrc || '';
    const match = /^data:image\/(png|jpeg);base64,([\s\S]+)$/i.exec(source);
    if (!match) return null;
    const extension = match[1].toLowerCase() === 'jpeg' ? 'jpg' : 'png';

    // Tamaño real en pantalla; si la imagen aún no cargó se usa su proporción
    // natural o un cuadrado de 58 px para no romper la maquetación.
    const rect = imageElement.getBoundingClientRect();
    const naturalWidth = imageElement.naturalWidth || 0;
    const naturalHeight = imageElement.naturalHeight || 0;
    let width = rect.width || imageElement.width || naturalWidth || 58;
    let height = rect.height || imageElement.height || 0;
    if (!height && naturalWidth > 0) height = (width * naturalHeight) / naturalWidth;
    if (!height) height = width;
    if (width > contexto.anchoContenidoPx) {
      height *= contexto.anchoContenidoPx / width;
      width = contexto.anchoContenidoPx;
    }

    let align = 'center';
    try {
      const computed = window.getComputedStyle(imageElement);
      if (computed.marginLeft === '0px' && computed.marginRight !== '0px') align = 'left';
    } catch {
      // Se conserva el centrado por defecto.
    }

    // La misma imagen (por ejemplo el logotipo repetido en cada hoja) se guarda
    // una sola vez en el paquete; cada aparición solo crea su propio dibujo.
    let base = cacheImagenes.get(source);
    if (!base) {
      base = {
        name: `image${images.length + 1}.${extension}`,
        relationshipId: `rId${images.length + 3}`,
        data: Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0))
      };
      images.push(base);
      cacheImagenes.set(source, base);
    }

    dibujos += 1;
    return {
      ...base,
      docId: dibujos,
      width: Math.max(1, width),
      height: Math.max(1, height),
      align
    };
  };

  const bloques = recolectarBloques(element, registerImage, contexto);
  const cuerpo = bloques.map(bloqueAXml).join('');
  // El cuerpo no debe terminar en tabla: Word espera un párrafo de cierre.
  const body = cuerpo.endsWith('</w:tbl>') ? `${cuerpo}<w:p/>` : cuerpo;

  const landscape = options.orientation === 'landscape';
  const pageSize = landscape
    ? '<w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/>'
    : '<w:pgSz w:w="11906" w:h="16838"/>';
  const pageMargins = landscape
    ? '<w:pgMar w:top="605" w:right="605" w:bottom="605" w:left="605" w:header="400" w:footer="400" w:gutter="0"/>'
    : '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>';

  const documentXml =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
    `<w:body>${body}` +
    `<w:sectPr>${pageSize}${pageMargins}</w:sectPr></w:body></w:document>`;

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
    '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>' +
    '</Types>';

  const rels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>' +
    '</Relationships>';

  const documentRelationships =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    '<Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
    images
      .map((image) => `<Relationship Id="${image.relationshipId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${image.name}"/>`)
      .join('') +
    '</Relationships>';

  const coreProps =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
    'xmlns:dc="http://purl.org/dc/elements/1.1/">' +
    `<dc:title>${escapeXml(title)}</dc:title>` +
    '</cp:coreProperties>';

  const contentTypesWithImages = images.length
    ? contentTypes.replace(
        '</Types>',
        '<Default Extension="png" ContentType="image/png"/><Default Extension="jpg" ContentType="image/jpeg"/></Types>'
      )
    : contentTypes;

  return zipStore([
    { name: '[Content_Types].xml', data: encoder.encode(contentTypesWithImages) },
    { name: '_rels/.rels', data: encoder.encode(rels) },
    { name: 'docProps/core.xml', data: encoder.encode(coreProps) },
    { name: 'word/styles.xml', data: encoder.encode(STYLES_XML) },
    { name: 'word/numbering.xml', data: encoder.encode(NUMBERING_XML) },
    { name: 'word/document.xml', data: encoder.encode(documentXml) },
    { name: 'word/_rels/document.xml.rels', data: encoder.encode(documentRelationships) },
    ...images.map((image) => ({ name: `word/media/${image.name}`, data: image.data }))
  ]);
}
