// Exportación de los reportes del administrador (Excel y PDF) con una plantilla
// institucional ordenada.
//
// El backend solo entrega un	listado plano de componentes/espacios. Aquí se
// agrupa por **grupo** para poder exportar:
//   - el consolidado completo (todas las filas juntas),
//   - un archivo con una hoja/bloque por cada grupo,
//   - o un único grupo de forma individual.
//
// No se modifica el backend: todo se compone en el frontend a partir de los
// datos que ya devuelve GET /api/admin/reportes.

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { exportarElementoAPdf } from './pdfExporter';

const NOMBRE_INSTITUCION = 'Institución Universitaria CESMAG';
const SISTEMA = 'Sistema RAP · Resultados de Aprendizaje';
const COLOR_ENCABEZADO = '112F5C';
const COLOR_SUBENCABEZADO = 'E8EFF3';

const saneado = (valor) =>
  valor === null || valor === undefined || valor === '' ? '—' : String(valor);

const numero = (valor, decimales = 0) => {
  const n = Number(valor);
  if (Number.isNaN(n)) return '—';
  return n.toFixed(decimales);
};

// Etiqueta de la columna "Espacio / Componente" del reporte del backend. El
// backend entrega `componente`, `clave`, `grupo`, `jornada`, `periodo`,
// `semestre`, `docente`, `evaluados`, `estudiantes`, `cobertura`, `porcentaje`
// y `nivel`.
function etiquetaEspacio(fila) {
  const base = fila.clave ? `${fila.clave} · ${fila.componente}` : fila.componente;
  return saneado(base);
}

// Agrupa las filas del reporte por grupo. Devuelve un arreglo de bloques:
//   { clave, grupo, jornada, periodo, semestre, docente, filas }
export function agruparPorGrupo(filas = []) {
  const mapa = new Map();
  filas.forEach((fila) => {
    const clave = `${fila.grupo || 'Sin grupo'}|${fila.jornada || ''}|${fila.periodo || ''}`;
    if (!mapa.has(clave)) {
      mapa.set(clave, {
        clave,
        grupo: fila.grupo || 'Sin grupo',
        jornada: fila.jornada || '—',
        periodo: fila.periodo || '—',
        semestre: fila.semestre,
        docentes: new Set(),
        filas: []
      });
    }
    const bloque = mapa.get(clave);
    if (fila.docente) bloque.docentes.add(fila.docente);
    bloque.filas.push(fila);
  });

  return Array.from(mapa.values())
    .map((bloque) => {
      const evaluados = bloque.filas.reduce((acc, f) => acc + Number(f.evaluados || 0), 0);
      const estudiantes = bloque.filas.reduce((acc, f) => acc + Number(f.estudiantes || 0), 0);
      const porcentajePonderado =
        estudiantes > 0
          ? bloque.filas.reduce(
              (acc, f) => acc + Number(f.porcentaje || 0) * Number(f.estudiantes || 0),
              0
            ) / estudiantes
          : 0;
      return {
        ...bloque,
        docentes: Array.from(bloque.docentes).join(', ') || 'Sin docente',
        totalComponentes: bloque.filas.length,
        evaluados,
        estudiantes,
        cobertura: estudiantes > 0 ? (evaluados / estudiantes) * 100 : 0,
        porcentaje: porcentajePonderado
      };
    })
    .sort((a, b) => {
      const s = (Number(a.semestre) || 0) - (Number(b.semestre) || 0);
      if (s !== 0) return s;
      return String(a.grupo).localeCompare(String(b.grupo), 'es');
    });
}

const COLUMNAS = [
  'Espacio / Componente',
  'Docente',
  'Jornada',
  'Periodo',
  'Semestre',
  'Evaluados',
  'Estudiantes',
  'Cobertura (%)',
  'Porcentaje (%)',
  'Nivel'
];

function filaExportable(fila) {
  return [
    etiquetaEspacio(fila),
    saneado(fila.docente),
    saneado(fila.jornada),
    saneado(fila.periodo),
    fila.semestre != null ? `${fila.semestre}.º` : '—',
    Number(fila.evaluados || 0),
    Number(fila.estudiantes || 0),
    Number(fila.cobertura || 0),
    Number(fila.porcentaje || 0),
    saneado(fila.nivel)
  ];
}

// ---- Excel ----

const ANCHOS_COLUMNA = [42, 28, 14, 14, 12, 11, 12, 13, 14, 14];

function hojaDesdeBloque(bloque) {
  const filas = [
    [NOMBRE_INSTITUCION],
    [SISTEMA],
    [`Reporte por grupo · ${bloque.grupo} · Jornada ${bloque.jornada} · Periodo ${bloque.periodo}`],
    [`Semestre ${bloque.semestre != null ? `${bloque.semestre}.º` : '—'} · Docente(s): ${bloque.docentes}`],
    [],
    COLUMNAS,
    ...bloque.filas.map(filaExportable),
    [],
    [
      'Totales del grupo',
      '',
      '',
      '',
      '',
      bloque.evaluados,
      bloque.estudiantes,
      Number(bloque.cobertura.toFixed(2)),
      Number(bloque.porcentaje.toFixed(2)),
      ''
    ]
  ];

  const hoja = XLSX.utils.aoa_to_sheet(filas);
  hoja['!cols'] = ANCHOS_COLUMNA.map((wch) => ({ wch }));
  hoja['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } }
  ];
  return hoja;
}

function nombreHojaSeguro(texto, usados) {
  let base = String(texto || 'Grupo').replace(/[\\/?*[\]:]/g, '-').trim().slice(0, 31) || 'Grupo';
  let nombre = base;
  let i = 2;
  while (usados.has(nombre.toLowerCase())) {
    const sufijo = ` (${i})`;
    nombre = base.slice(0, 31 - sufijo.length) + sufijo;
    i += 1;
  }
  usados.add(nombre.toLowerCase());
  return nombre;
}

function construirNombreArchivo(parte) {
  const fecha = new Date().toISOString().slice(0, 10);
  return `reporte-rap-${parte}-${fecha}`;
}

/**
 * Exporta a Excel.
 * @param {Array} filas filas del reporte del backend.
 * @param {{ modo: 'consolidado'|'porGrupo'|'individual', grupoClave?: string }} opciones
 */
export function exportarExcel(filas, opciones = {}) {
  const { modo = 'consolidado' } = opciones;
  const bloques = agruparPorGrupo(filas);
  const libro = XLSX.utils.book_new();
  const usados = new Set();

  if (modo === 'porGrupo') {
    bloques.forEach((bloque) => {
      XLSX.utils.book_append_sheet(
        libro,
        hojaDesdeBloque(bloque),
        nombreHojaSeguro(bloque.grupo, usados)
      );
    });
    if (bloques.length === 0) XLSX.utils.book_append_sheet(libro, hojaDesdeBloque({ grupo: 'Sin datos', filas: [], docentes: '—', evaluados: 0, estudiantes: 0, cobertura: 0, porcentaje: 0 }), 'Reporte');
    XLSX.writeFile(libro, `${construirNombreArchivo('por-grupo')}.xlsx`);
    return;
  }

  // consolidado e individual comparten una sola hoja con encabezado y totales.
  const seleccion = modo === 'individual'
    ? bloques.filter((b) => b.clave === opciones.grupoClave)
    : bloques;

  const filasConsolidadas = seleccion.flatMap((b) => b.filas);
  const titulo = modo === 'individual' && seleccion[0]
    ? `Reporte individual · Grupo ${seleccion[0].grupo} · Jornada ${seleccion[0].jornada} · Periodo ${seleccion[0].periodo}`
    : 'Reporte consolidado · Todos los grupos';

  const totalEvaluados = seleccion.reduce((a, b) => a + b.evaluados, 0);
  const totalEstudiantes = seleccion.reduce((a, b) => a + b.estudiantes, 0);
  const cobertura = totalEstudiantes > 0 ? (totalEvaluados / totalEstudiantes) * 100 : 0;
  const porcentaje =
    totalEstudiantes > 0
      ? seleccion.reduce((a, b) => a + b.porcentaje * b.estudiantes, 0) / totalEstudiantes
      : 0;

  const filasHoja = [
    [NOMBRE_INSTITUCION],
    [SISTEMA],
    [titulo],
    [`Generado: ${new Date().toLocaleString('es-CO')}`],
    [],
    COLUMNAS,
    ...filasConsolidadas.map(filaExportable),
    [],
    ['Totales', '', '', '', '', totalEvaluados, totalEstudiantes, Number(cobertura.toFixed(2)), Number(porcentaje.toFixed(2)), '']
  ];

  const hoja = XLSX.utils.aoa_to_sheet(filasHoja);
  hoja['!cols'] = ANCHOS_COLUMNA.map((wch) => ({ wch }));
  hoja['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 9 } }
  ];
  XLSX.utils.book_append_sheet(libro, hoja, 'Reporte');

  const sufijo = modo === 'individual' ? 'grupo' : 'consolidado';
  XLSX.writeFile(libro, `${construirNombreArchivo(sufijo)}.xlsx`);
}

// ---- PDF ----

const escapar = (valor) =>
  String(valor === null || valor === undefined ? '' : valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function nivelClase(nivel) {
  const n = String(nivel || '').toLowerCase();
  if (n.includes('excelente')) return 'excelente';
  if (n.includes('bueno')) return 'bueno';
  if (n.includes('regular')) return 'regular';
  if (n.includes('ineficiente') || n.includes('insuficiente')) return 'ineficiente';
  return 'sin';
}

function filaHtml(fila) {
  return `
    <tr>
      <td class="col-espacio">${escapar(etiquetaEspacio(fila))}</td>
      <td>${escapar(saneado(fila.docente))}</td>
      <td>${escapar(saneado(fila.jornada))}</td>
      <td>${escapar(saneado(fila.periodo))}</td>
      <td class="centro">${fila.semestre != null ? `${fila.semestre}.º` : '—'}</td>
      <td class="centro">${Number(fila.evaluados || 0)}</td>
      <td class="centro">${Number(fila.estudiantes || 0)}</td>
      <td class="centro">${numero(fila.cobertura, 1)}%</td>
      <td class="centro">${numero(fila.porcentaje, 1)}%</td>
      <td class="centro"><span class="nivel ${nivelClase(fila.nivel)}">${escapar(saneado(fila.nivel))}</span></td>
    </tr>`;
}

function bloqueHtml(bloque, opciones = {}) {
  const { conTitulo = true } = opciones;
  const encabezadoGrupo = conTitulo
    ? `<h2 class="pdf-grupo">Grupo ${escapar(bloque.grupo)} · Jornada ${escapar(bloque.jornada)} · Periodo ${escapar(bloque.periodo)} · Semestre ${bloque.semestre != null ? `${bloque.semestre}.º` : '—'}</h2>
       <p class="pdf-docentes">Docente(s): ${escapar(bloque.docentes)}</p>`
    : '';

  return `
    <section class="pdf-bloque" data-docx-page-break="${conTitulo}">
      ${encabezadoGrupo}
      <table class="pdf-tabla">
        <thead>
          <tr>${COLUMNAS.map((c) => `<th>${escapar(c)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${bloque.filas.map(filaHtml).join('')}
        </tbody>
        <tfoot>
          <tr class="pdf-totales">
            <td colspan="5">Totales del grupo</td>
            <td class="centro">${bloque.evaluados}</td>
            <td class="centro">${bloque.estudiantes}</td>
            <td class="centro">${numero(bloque.cobertura, 1)}%</td>
            <td class="centro">${numero(bloque.porcentaje, 1)}%</td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </section>`;
}

function construirContenedorPdf({ titulo, subtitulo, cuerpoHtml }) {
  const contenedor = document.createElement('div');
  contenedor.style.position = 'fixed';
  contenedor.style.left = '-10000px';
  contenedor.style.top = '0';
  contenedor.style.width = '1100px';
  contenedor.style.background = '#ffffff';
  contenedor.style.padding = '24px';
  contenedor.style.color = '#263747';
  contenedor.style.fontFamily = 'Arial, sans-serif';
  contenedor.style.fontSize = '11px';
  contenedor.innerHTML = `
    <style>
      .pdf-encabezado { display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 3px solid #${COLOR_ENCABEZADO}; padding-bottom: 12px; margin-bottom: 16px; }
      .pdf-encabezado h1 { margin: 0; font-size: 18px; color: #${COLOR_ENCABEZADO}; }
      .pdf-encabezado p { margin: 2px 0 0; font-size: 11px; color: #666; }
      .pdf-encabezado .pdf-info { text-align: right; font-size: 11px; color: #666; }
      .pdf-grupo { font-size: 14px; color: #${COLOR_ENCABEZADO}; margin: 18px 0 4px; }
      .pdf-docentes { font-size: 11px; color: #666; margin: 0 0 8px; }
      .pdf-tabla { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
      .pdf-tabla th { background: #${COLOR_ENCABEZADO}; color: #fff; font-size: 10px; padding: 7px 6px; text-align: left; border: 1px solid #${COLOR_ENCABEZADO}; }
      .pdf-tabla td { font-size: 10px; padding: 6px; border: 1px solid #dfe5ea; vertical-align: top; }
      .pdf-tabla tbody tr:nth-child(even) td { background: #f7f9fb; }
      .pdf-tabla .centro { text-align: center; }
      .pdf-tabla .col-espacio { font-weight: 700; color: #${COLOR_ENCABEZADO}; }
      .pdf-totales td { background: #${COLOR_SUBENCABEZADO}; font-weight: 700; }
      .pdf-bloque { page-break-inside: auto; }
      .nivel { display: inline-block; padding: 2px 7px; border-radius: 999px; font-size: 9px; font-weight: 700; }
      .nivel.excelente { background: #d5f8e5; color: #087343; }
      .nivel.bueno { background: #dceaff; color: #1d62ae; }
      .nivel.regular { background: #fff0c1; color: #a57200; }
      .nivel.ineficiente { background: #ffe1e1; color: #bc1d1d; }
      .nivel.sin { background: #eef1f3; color: #5b6670; }
    </style>
    <header class="pdf-encabezado">
      <div>
        <h1>${escapar(NOMBRE_INSTITUCION)}</h1>
        <p>${escapar(SISTEMA)}</p>
      </div>
      <div class="pdf-info">
        <strong>${escapar(titulo)}</strong><br/>
        ${escapar(subtitulo)}<br/>
        Generado: ${escapar(new Date().toLocaleString('es-CO'))}
      </div>
    </header>
    <div class="pdf-cuerpo">${cuerpoHtml}</div>
  `;
  return contenedor;
}

/**
 * Exporta a PDF.
 * @param {Array} filas filas del reporte del backend.
 * @param {{ modo: 'consolidado'|'porGrupo'|'individual', grupoClave?: string }} opciones
 */
export async function exportarPdf(filas, opciones = {}) {
  const { modo = 'consolidado' } = opciones;
  const bloques = agruparPorGrupo(filas);

  if (bloques.length === 0) {
    throw new Error('No hay datos para exportar con los filtros seleccionados.');
  }

  let seleccion;
  let titulo;
  let subtitulo;
  if (modo === 'individual') {
    seleccion = bloques.filter((b) => b.clave === opciones.grupoClave);
    if (seleccion.length === 0) throw new Error('El grupo seleccionado no tiene datos.');
    titulo = `Reporte individual · ${seleccion[0].grupo}`;
    subtitulo = `Jornada ${seleccion[0].jornada} · Periodo ${seleccion[0].periodo} · Semestre ${seleccion[0].semestre != null ? `${seleccion[0].semestre}.º` : '—'}`;
  } else if (modo === 'porGrupo') {
    seleccion = bloques;
    titulo = 'Reporte por grupo';
    subtitulo = `${bloques.length} grupo(s)`;
  } else {
    seleccion = bloques;
    titulo = 'Reporte consolidado';
    subtitulo = 'Todos los grupos';
  }

  const cuerpoHtml = seleccion
    .map((bloque) => bloqueHtml(bloque, { conTitulo: modo !== 'individual' }))
    .join('');

  const contenedor = construirContenedorPdf({ titulo, subtitulo, cuerpoHtml });
  document.body.appendChild(contenedor);

  try {
    await exportarElementoAPdf(contenedor, `${construirNombreArchivo(modo === 'individual' ? 'grupo' : modo === 'porGrupo' ? 'por-grupo' : 'consolidado')}.pdf`, {
      formato: 'a4',
      orientacion: 'landscape',
      unidad: 'mm',
      margen: 10
    });
  } finally {
    contenedor.remove();
  }
}
