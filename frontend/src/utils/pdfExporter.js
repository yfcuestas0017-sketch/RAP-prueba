// Exportación a PDF de los documentos del sistema RAP.
//
// Estrategia general:
//   - html2canvas convierte cada bloque visible a un canvas de alta resolución.
//   - jsPDF coloca esos canvas en hojas reales del PDF, una por página.
//
// Se abandonó la paginación automática de html2pdf porque insertaba hojas en
// blanco, cortaba filas de tabla y usaba una única imagen gigante (texto
// borroso). Aquí:
//   - los documentos pre-paginados (`data-docx-page`) se dibujan hoja por hoja,
//   - el contenido continuo se corta en los bordes de bloques/filas para no
//     partir tablas ni párrafos,
//   - `data-docx-page-break="true"` fuerza el inicio de una hoja nueva.
//
// Calidad:
//   - se captura a 3x (≈288 ppp) en hojas fijas y 2.5x en contenido continuo,
//   - las imágenes se guardan como PNG (sin los artefactos del JPEG en el texto),
//   - se esperan fuentes e imágenes antes de capturar,
//   - se sustituyen los colores modernos de Tailwind v4 (oklch, oklab, lab,
//     lch, color(), color-mix()) por rgb(), que es lo único que entiende
//     html2canvas 1.4.1. Sin esto la captura falla y el PDF nunca se descarga.

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const SELECTOR_PAGINA_FIJA = '[data-docx-page]';
const SELECTOR_SALTO = '[data-docx-page-break="true"]';
const CLASE_OVERRIDE = 'pdf-export-color';

// Límites del navegador para no agotar la memoria ni congelar la pestaña.
const MAX_LADO_CANVAS = 16000;
const MAX_AREA_CANVAS = 90e6;

const ESCALA_PAGINA_FIJA = 3; // ≈288 ppp
const ESCALA_CONTENIDO = 2.5; // ≈240 ppp

const PX_POR_UNIDAD = {
  mm: 96 / 25.4,
  cm: 96 / 2.54,
  in: 96,
  pt: 96 / 72,
  px: 1
};

// Etiquetas que pueden servir como punto de corte entre páginas. Cortar en su
// borde superior/inferior evita partir una fila de tabla o un párrafo.
const ETIQUETAS_CORTE = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DIV', 'DL', 'FIELDSET',
  'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5',
  'H6', 'HEADER', 'HR', 'IMG', 'LI', 'MAIN', 'NAV', 'OL', 'P', 'PRE',
  'SECTION', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
]);

const PROPIEDADES_COLOR = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'caretColor',
  'columnRuleColor',
  'fill',
  'stroke',
  'stopColor',
  'floodColor',
  'lightingColor'
];

const PROPIEDADES_COMPUESTAS = [
  'backgroundImage',
  'borderImageSource',
  'boxShadow',
  'textShadow',
  'filter',
  'backdropFilter'
];

let paletaCache = null;
let lienzoColor = null;

// ---------------------------------------------------------------------------
// Colores
// ---------------------------------------------------------------------------

function contieneColorModerno(valor) {
  return /(oklch|oklab|lab|lch|hwb|color-mix|color)\(/i.test(String(valor || ''));
}

// Resuelve un color (incluidas las funciones modernas) a rgb/rgba usando el
// propio motor de color del navegador mediante un canvas de 1x1.
function colorARgb(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return null;

  try {
    if (!lienzoColor) {
      lienzoColor = document.createElement('canvas');
      lienzoColor.width = 1;
      lienzoColor.height = 1;
    }
    const contexto = lienzoColor.getContext('2d', { willReadFrequently: true });
    contexto.clearRect(0, 0, 1, 1);
    contexto.fillStyle = '#010203'; // valor centinela para detectar soporte
    contexto.fillStyle = texto;
    if (contexto.fillStyle === '#010203') return null;
    contexto.fillRect(0, 0, 1, 1);

    const [r, g, b, a] = contexto.getImageData(0, 0, 1, 1).data;
    if (a === 0) return 'rgba(0, 0, 0, 0)';
    return a === 255
      ? `rgb(${r}, ${g}, ${b})`
      : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  } catch {
    return null;
  }
}

// Recorre una cadena (por ejemplo un gradiente o una sombra) y reemplaza cada
// función de color moderna por su equivalente rgb. Las funciones anidadas
// (color-mix(in oklab, oklch(...), ...)) se procesan como un solo token.
function reemplazarFuncionesColor(texto) {
  const origen = String(texto || '');
  let salida = '';
  let posicion = 0;

  while (posicion < origen.length) {
    const resto = origen.slice(posicion);
    const coincidencia = /(oklch|oklab|lab|lch|hwb|color-mix|color)\(/i.exec(resto);
    if (!coincidencia) {
      salida += resto;
      break;
    }

    const inicio = posicion + coincidencia.index;
    salida += origen.slice(posicion, inicio);

    const abre = origen.indexOf('(', inicio);
    let nivel = 0;
    let fin = abre;
    for (; fin < origen.length; fin += 1) {
      if (origen[fin] === '(') nivel += 1;
      else if (origen[fin] === ')') {
        nivel -= 1;
        if (nivel === 0) break;
      }
    }

    const token = origen.slice(inicio, fin + 1);
    salida += colorARgb(token) || token;
    posicion = fin + 1;
  }

  return salida;
}

// Recolecta las variables --color-* de las hojas de estilo y las convierte a
// rgb. Es una primera pasada barata; la sanitización del clon se encarga de
// cualquier color que se escape.
function recolectarPaleta() {
  const resultado = new Map();
  const declaracion = /--color-[\w-]+\s*:\s*[^;}]+/g;

  const visitar = (reglas) => {
    for (const regla of reglas) {
      if (regla.cssText) {
        const coincidencias = regla.cssText.match(declaracion) || [];
        for (const fragmento of coincidencias) {
          const separador = fragmento.indexOf(':');
          const propiedad = fragmento.slice(0, separador).trim();
          const valor = fragmento.slice(separador + 1).trim();
          if (!contieneColorModerno(valor)) continue;
          const rgb = colorARgb(valor);
          if (rgb) resultado.set(propiedad, rgb);
        }
      }
      if (regla.cssRules) visitar(regla.cssRules);
    }
  };

  for (const hoja of Array.from(document.styleSheets)) {
    let reglas;
    try {
      reglas = hoja.cssRules; // lanza si la hoja es de otro origen (CORS)
    } catch {
      continue;
    }
    if (reglas) visitar(reglas);
  }

  return Array.from(resultado, ([propiedad, rgb]) => `${propiedad}: ${rgb};`).join('');
}

function prepararPaleta() {
  if (paletaCache === null) paletaCache = recolectarPaleta();
  return paletaCache;
}

function aplicarPaletaAlClon(documentoClon, elementoClon) {
  const contenido = prepararPaleta();
  if (!contenido || !elementoClon) return;

  elementoClon.classList.add(CLASE_OVERRIDE);
  const estilo = documentoClon.createElement('style');
  estilo.textContent = `.${CLASE_OVERRIDE}{${contenido}}`;
  documentoClon.head.appendChild(estilo);
}

// Última barrera: recorre el clon y fija en línea cualquier color que html2canvas
// no sepa interpretar. Así una utilidad de Tailwind con color-mix no rompe toda
// la exportación.
function sanitizarColores(documentoClon, raiz) {
  if (!raiz) return;
  const vista = documentoClon.defaultView || window;
  const elementos = [raiz, ...raiz.querySelectorAll('*')];

  for (const elemento of elementos) {
    let estilos;
    try {
      estilos = vista.getComputedStyle(elemento);
    } catch {
      continue;
    }
    if (!estilos) continue;

    for (const propiedad of PROPIEDADES_COLOR) {
      const valor = estilos[propiedad];
      if (!valor || !contieneColorModerno(valor)) continue;

      const convertido = reemplazarFuncionesColor(valor);
      if (convertido && !contieneColorModerno(convertido)) {
        elemento.style[propiedad] = convertido;
      } else if (propiedad === 'color') {
        elemento.style[propiedad] = '#111827';
      } else if (propiedad === 'fill' || propiedad === 'stroke') {
        elemento.style[propiedad] = 'none';
      } else {
        elemento.style[propiedad] = 'transparent';
      }
    }

    for (const propiedad of PROPIEDADES_COMPUESTAS) {
      const valor = estilos[propiedad];
      if (!valor || valor === 'none' || !contieneColorModerno(valor)) continue;

      const convertido = reemplazarFuncionesColor(valor);
      if (convertido && !contieneColorModerno(convertido)) {
        elemento.style[propiedad] = convertido;
      } else {
        elemento.style[propiedad] = 'none';
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Utilidades de página y renderizado
// ---------------------------------------------------------------------------

function calcularEscala(anchoCss, altoCss, escalaSolicitada) {
  let escala = Math.max(1, Number(escalaSolicitada) || 1);
  while (escala > 1) {
    const ancho = Math.max(1, anchoCss) * escala;
    const alto = Math.max(1, altoCss) * escala;
    if (ancho <= MAX_LADO_CANVAS && alto <= MAX_LADO_CANVAS && ancho * alto <= MAX_AREA_CANVAS) {
      break;
    }
    escala = Math.max(1, Number((escala - 0.25).toFixed(2)));
  }
  return escala;
}

function normalizarMargen(margen) {
  if (Array.isArray(margen)) {
    if (margen.length >= 4) {
      return {
        top: Number(margen[0]) || 0,
        right: Number(margen[1]) || 0,
        bottom: Number(margen[2]) || 0,
        left: Number(margen[3]) || 0
      };
    }
    const vertical = Number(margen[0]) || 0;
    const horizontal = Number(margen[1] ?? margen[0]) || 0;
    return { top: vertical, right: horizontal, bottom: vertical, left: horizontal };
  }
  const valor = Number(margen) || 0;
  return { top: valor, right: valor, bottom: valor, left: valor };
}

// Crea el documento jsPDF y calcula el área útil en unidades y en píxeles CSS.
function crearLienzo(opciones) {
  const unidad = opciones.unidad ?? 'mm';
  const formato = opciones.formato ?? 'a4';
  const orientacion = opciones.orientacion ?? 'portrait';
  const doc = new jsPDF({ unit: unidad, format: formato, orientation: orientacion, compress: true });

  const anchoPagina = doc.internal.pageSize.getWidth();
  const altoPagina = doc.internal.pageSize.getHeight();
  const margen = normalizarMargen(opciones.margen ?? 0);

  // Si el margen es absurdo, se deja un área mínima utilizable.
  const anchoUtil = Math.max(20, anchoPagina - margen.left - margen.right);
  const altoUtil = Math.max(20, altoPagina - margen.top - margen.bottom);
  const px = PX_POR_UNIDAD[unidad] ?? PX_POR_UNIDAD.mm;

  return {
    doc,
    unidad,
    margen,
    anchoUtil,
    altoUtil,
    anchoUtilPx: anchoUtil * px,
    altoUtilPx: altoUtil * px
  };
}

// Limita la espera de una promesa. Una fuente o una imagen que nunca termina de
// cargar (red lenta, recurso bloqueado) no puede dejar la exportación colgada:
// en ese caso se continúa con lo que el navegador ya tenga renderizado.
function conTiempoLimite(promesa, milisegundos) {
  return new Promise((resolver) => {
    let terminado = false;
    const finalizar = () => {
      if (terminado) return;
      terminado = true;
      resolver();
    };

    const temporizador = setTimeout(finalizar, milisegundos);
    Promise.resolve(promesa).then(
      () => {
        clearTimeout(temporizador);
        finalizar();
      },
      () => {
        clearTimeout(temporizador);
        finalizar();
      }
    );
  });
}

function esperarImagen(imagen) {
  if (imagen.complete && imagen.naturalWidth > 0) return Promise.resolve();
  if (typeof imagen.decode === 'function') {
    return imagen.decode().catch(() => undefined);
  }
  return new Promise((resolver) => {
    imagen.addEventListener('load', resolver, { once: true });
    imagen.addEventListener('error', resolver, { once: true });
  });
}

async function esperarRenderizado(elemento) {
  // `document.fonts.ready` puede quedarse pendiente indefinidamente si alguna
  // fuente no termina de cargar; se espera como máximo unos segundos.
  if (typeof document !== 'undefined' && document.fonts?.ready) {
    await conTiempoLimite(document.fonts.ready, 4000);
  }

  const imagenes = Array.from(elemento.querySelectorAll('img'));
  await Promise.all(imagenes.map((imagen) => conTiempoLimite(esperarImagen(imagen), 8000)));

  // Dos frames (o 200 ms) para que el navegador aplique estilos y pintura antes
  // de capturar. Si la pestaña está oculta, requestAnimationFrame no se ejecuta:
  // el temporizador garantiza que la exportación no quede esperando.
  await new Promise((resolver) => {
    let resuelto = false;
    const terminar = () => {
      if (resuelto) return;
      resuelto = true;
      resolver();
    };
    requestAnimationFrame(() => requestAnimationFrame(terminar));
    setTimeout(terminar, 200);
  });
}

// html2canvas mide el elemento dentro de un iframe clonado. Si el ancho del
// iframe es el de la ventana real, las media queries (sm:, lg:...) pueden
// cambiar el diseño. Se fuerza un ancho de escritorio mínimo y scroll en 0 para
// que el resultado no dependa de la posición/zoom del usuario.
function opcionesHtml2canvas(elemento, opciones, escala) {
  const rect = elemento.getBoundingClientRect();
  const anchoVentana = Math.min(1920, Math.max(1280, Math.ceil(rect.width) + 64));
  const altoVentana = Math.max(900, Math.ceil(rect.height) + 64);
  const onclonePersonalizado = opciones.html2canvas?.onclone;

  return {
    scale: escala,
    useCORS: true,
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: anchoVentana,
    windowHeight: altoVentana,
    imageTimeout: 15000,
    ...(opciones.html2canvas || {}),
    onclone: (documentoClon, elementoClon) => {
      if (onclonePersonalizado) onclonePersonalizado(documentoClon, elementoClon);
      aplicarPaletaAlClon(documentoClon, elementoClon);
      sanitizarColores(documentoClon, elementoClon);
    }
  };
}

function prepararHost(elemento) {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;top:0;left:-20000px;background:#ffffff;';
  document.body.appendChild(host);

  const clon = elemento.cloneNode(true);
  const rect = elemento.getBoundingClientRect();
  if (rect.width > 0) host.style.width = `${Math.ceil(rect.width)}px`;

  host.appendChild(clon);
  return { host, clon };
}

function eliminarHost(host) {
  if (host?.parentNode) host.parentNode.removeChild(host);
}

function tipoImagen(opciones) {
  const tipo = String(opciones.image?.type || 'png').toLowerCase();
  return tipo === 'jpeg' || tipo === 'jpg' ? 'JPEG' : 'PNG';
}

function insertarImagen(doc, canvas, opciones, caja, medidas) {
  const tipo = tipoImagen(opciones);
  const calidad = opciones.image?.quality;
  const data = tipo === 'JPEG'
    ? canvas.toDataURL('image/jpeg', calidad ?? 0.95)
    : canvas.toDataURL('image/png');

  doc.addImage(
    data,
    tipo,
    medidas.x,
    medidas.y,
    medidas.ancho,
    medidas.h,
    undefined,
    'FAST'
  );
}

// Inserta un canvas como una hoja completa respetando la proporción (contain).
function insertarHojaCompleta(doc, canvas, opciones, caja) {
  const ratioPagina = caja.anchoUtil / caja.altoUtil;
  const ratioImagen = canvas.width / canvas.height;
  let ancho = caja.anchoUtil;
  let alto = caja.altoUtil;

  if (ratioImagen > ratioPagina) {
    alto = caja.anchoUtil / ratioImagen;
  } else {
    ancho = caja.altoUtil * ratioImagen;
  }

  insertarImagen(doc, canvas, opciones, caja, {
    x: caja.margen.left + (caja.anchoUtil - ancho) / 2,
    y: caja.margen.top + (caja.altoUtil - alto) / 2,
    ancho,
    h: alto
  });
}

// ---------------------------------------------------------------------------
// Documentos pre-paginados: una hoja del DOM = una hoja del PDF
// ---------------------------------------------------------------------------

function obtenerPaginasFijas(elemento) {
  const paginas = Array.from(elemento.querySelectorAll(SELECTOR_PAGINA_FIJA));
  if (typeof elemento.matches === 'function' && elemento.matches(SELECTOR_PAGINA_FIJA)) {
    paginas.unshift(elemento);
  }
  return Array.from(new Set(paginas));
}

async function exportarPaginasFijas(elemento, nombreArchivo, opciones) {
  const caja = crearLienzo(opciones);
  const { host, clon } = prepararHost(elemento);
  const paginas = obtenerPaginasFijas(clon);

  try {
    if (paginas.length === 0) {
      throw new Error('El documento no tiene hojas para exportar.');
    }

    await esperarRenderizado(clon);

    let hojasAgregadas = 0;
    for (const pagina of paginas) {
      const rect = pagina.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;

      const escala = calcularEscala(
        rect.width,
        rect.height,
        Math.max(Number(opciones.escala) || 0, ESCALA_PAGINA_FIJA)
      );
      // eslint-disable-next-line no-await-in-loop
      const canvas = await html2canvas(pagina, opcionesHtml2canvas(pagina, opciones, escala));

      if (hojasAgregadas > 0) caja.doc.addPage();
      insertarHojaCompleta(caja.doc, canvas, opciones, caja);
      hojasAgregadas += 1;
    }

    if (hojasAgregadas === 0) {
      throw new Error('Las hojas del documento están vacías o no son visibles.');
    }

    caja.doc.save(nombreArchivo);
  } finally {
    eliminarHost(host);
  }
}

// ---------------------------------------------------------------------------
// Contenido continuo: se corta en bordes de bloques para no partir tablas
// ---------------------------------------------------------------------------

function recolectarCortes(clon) {
  const rect = clon.getBoundingClientRect();
  const alto = Math.max(1, rect.height);
  const top = rect.top;
  const candidatos = new Set();
  const forzados = new Set();

  const registrar = (conjunto, elemento, usarBordeInferior = false) => {
    const r = elemento.getBoundingClientRect();
    if (r.height < 0.5) return;
    const y = (usarBordeInferior ? r.bottom : r.top) - top;
    if (y > 1 && y < alto - 1) conjunto.add(y);
  };

  const elementos = Array.from(clon.querySelectorAll('*'));
  for (const elemento of elementos) {
    if (ETIQUETAS_CORTE.has(elemento.tagName)) {
      registrar(candidatos, elemento);
      // El borde inferior permite cerrar la hoja después de una fila/bloque.
      registrar(candidatos, elemento, true);
    }

    if (elemento.matches?.(SELECTOR_SALTO)) {
      registrar(forzados, elemento);
    }

    try {
      const estilos = window.getComputedStyle(elemento);
      const antes = estilos.breakBefore || estilos.pageBreakBefore;
      if (['always', 'page', 'left', 'right'].includes(antes)) {
        registrar(forzados, elemento);
      }
    } catch {
      // Si no se puede leer el estilo, se ignora este elemento.
    }
  }

  const ordenar = (conjunto) => Array.from(conjunto).sort((a, b) => a - b);
  return { alto, candidatos: ordenar(candidatos), forzados: ordenar(forzados) };
}

function siguienteCorte({ inicio, limite, total, candidatos, forzados }) {
  const finForzado = forzados.find((valor) => valor > inicio + 2);

  if (finForzado && finForzado <= limite + 2) {
    // Evita una hoja casi vacía cuando un salto explícito cae al inicio.
    if (finForzado - inicio < (limite - inicio) * 0.2) {
      return Math.min(total, Math.max(finForzado, limite));
    }
    return Math.min(total, finForzado);
  }

  if (limite >= total) return total;

  // Busca el último borde de bloque que quepa en la hoja y que no deje una
  // hoja demasiado corta (mínimo 45% de aprovechamiento).
  const minimo = inicio + (limite - inicio) * 0.45;
  let mejor = null;
  for (const valor of candidatos) {
    if (valor <= inicio + 1) continue;
    if (valor > limite) break;
    if (valor >= minimo) mejor = valor;
  }

  return mejor || limite;
}

async function exportarContenidoContinuo(elemento, nombreArchivo, opciones) {
  const caja = crearLienzo(opciones);

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText = 'position:fixed;top:0;left:-20000px;background:#ffffff;';
  host.style.width = `${Math.max(320, Math.floor(caja.anchoUtilPx))}px`;
  document.body.appendChild(host);

  const clon = elemento.cloneNode(true);
  clon.style.position = 'static';
  clon.style.left = 'auto';
  clon.style.top = 'auto';
  clon.style.width = '100%';
  clon.style.maxWidth = '100%';
  clon.style.boxSizing = 'border-box';
  host.appendChild(clon);

  try {
    await esperarRenderizado(clon);

    const altoCss = Math.max(
      1,
      clon.scrollHeight,
      Math.ceil(clon.getBoundingClientRect().height)
    );
    const escala = calcularEscala(
      caja.anchoUtilPx,
      altoCss,
      Math.max(Number(opciones.escala) || 0, ESCALA_CONTENIDO)
    );
    const canvas = await html2canvas(clon, opcionesHtml2canvas(clon, opciones, escala));

    // Altura de una hoja expresada en píxeles del canvas.
    const altoHojaCanvas = Math.max(
      1,
      Math.floor(canvas.width * (caja.altoUtil / caja.anchoUtil))
    );

    const { candidatos, forzados } = recolectarCortes(clon);
    const factor = canvas.height / Math.max(1, clon.getBoundingClientRect().height);
    const candidatosCanvas = candidatos.map((valor) => Math.min(canvas.height, Math.round(valor * factor)));
    const forzadosCanvas = forzados.map((valor) => Math.min(canvas.height, Math.round(valor * factor)));

    let inicio = 0;
    let pagina = 0;
    const paginaCanvas = document.createElement('canvas');
    const contexto = paginaCanvas.getContext('2d');
    paginaCanvas.width = canvas.width;

    while (inicio < canvas.height - 1 && pagina < 500) {
      const limite = Math.min(canvas.height, inicio + altoHojaCanvas);
      const fin = siguienteCorte({
        inicio,
        limite,
        total: canvas.height,
        candidatos: candidatosCanvas,
        forzados: forzadosCanvas
      });

      const alto = Math.max(1, fin - inicio);
      paginaCanvas.height = alto;
      contexto.fillStyle = '#ffffff';
      contexto.fillRect(0, 0, paginaCanvas.width, alto);
      contexto.drawImage(canvas, 0, inicio, canvas.width, alto, 0, 0, canvas.width, alto);

      if (pagina > 0) caja.doc.addPage();
      insertarImagen(caja.doc, paginaCanvas, opciones, caja, {
        x: caja.margen.left,
        y: caja.margen.top,
        ancho: caja.anchoUtil,
        h: caja.altoUtil * (alto / altoHojaCanvas)
      });

      pagina += 1;
      if (fin <= inicio) break;
      inicio = fin;
    }

    if (pagina === 0) {
      throw new Error('No hay contenido visible para exportar a PDF.');
    }

    caja.doc.save(nombreArchivo);
  } finally {
    eliminarHost(host);
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Exporta (descarga) un elemento del DOM como PDF.
 *
 * Si el documento contiene hojas institucionales marcadas con `data-docx-page`,
 * cada una se convierte en una hoja del PDF sin páginas en blanco. El contenido
 * continuo se pagina respetando `data-docx-page-break="true"` y evitando cortar
 * filas de tabla o bloques completos.
 *
 * @param {HTMLElement} elemento nodo con la previsualización del documento.
 * @param {string} nombreArchivo nombre del archivo a descargar.
 * @param {{
 *   escala?: number,
 *   orientacion?: 'portrait' | 'landscape',
 *   formato?: string | number[],
 *   unidad?: 'mm' | 'cm' | 'in' | 'pt' | 'px',
 *   margen?: number | number[],
 *   image?: { type?: 'png' | 'jpeg', quality?: number },
 *   html2canvas?: object
 * }} opciones
 * @returns {Promise<void>} se resuelve cuando termina la descarga.
 */
export async function exportarElementoAPdf(elemento, nombreArchivo, opciones = {}) {
  if (!elemento) {
    throw new Error('No hay contenido para exportar a PDF.');
  }

  try {
    if (obtenerPaginasFijas(elemento).length > 0) {
      await exportarPaginasFijas(elemento, nombreArchivo, opciones);
      return;
    }

    await exportarContenidoContinuo(elemento, nombreArchivo, opciones);
  } catch (error) {
    const detalle = error?.message ? `: ${error.message}` : '';
    throw new Error(`No fue posible generar el PDF${detalle}`);
  }
}
