import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CELDA,
  CELDA_ENCABEZADO,
  CELDA_ETIQUETA,
  EncabezadoDocumento,
  PieDocumento,
  TABLA
} from '../../../components/documentos/DocumentoBase.jsx';

// ---------------------------------------------------------------------------
// Formato carta horizontal (11in x 8.5in). En CSS 1in equivale a 96px, así que
// las alturas se miden en píxeles y se comparan contra el alto útil de la hoja.
// ---------------------------------------------------------------------------
const PX_POR_PULGADA = 96;
const ANCHO_PAGINA = '11in';
const PADDING_PAGINA_IN = 0.38;
const ALTO_UTIL_PX = (8.5 - PADDING_PAGINA_IN * 2) * PX_POR_PULGADA;
const GAP_PAGINA_PX = 8; // separación flex (`gap-2`) entre bloques de la página
const MARGEN_TABLA_PX = 4; // margen superior de la tabla semanal (`mt-1`)
const HOLGURA_PX = 8; // evita desbordes por redondeos de medición

const pageStyle = {
  width: ANCHO_PAGINA,
  minHeight: '8.5in',
  padding: `${PADDING_PAGINA_IN}in`,
  boxSizing: 'border-box',
  background: '#fff',
  color: '#111827',
  fontFamily: 'Arial, sans-serif',
  fontSize: '9px'
};

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// La fecha del encabezado proviene siempre del valor que el docente diligenció.
// Se acepta "2026-08-03" o "2026-08-03T05:00:00.000Z" y se presenta como
// "03/AGO/2026"; si el valor ya viene formateado se respeta tal cual.
export function formatearFechaDocumento(valor) {
  if (!valor) return '—';
  const texto = String(valor).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(texto);
  if (iso) {
    const mes = Number(iso[2]) - 1;
    if (mes >= 0 && mes < 12) return `${iso[3]}/${MESES[mes]}/${iso[1]}`;
  }
  return texto;
}

function Header({ formData, page, totalPaginas }) {
  return (
    <EncabezadoDocumento
      titulo="Ficha de desarrollo temático"
      subtitulo="Planeación de aula"
      codigo={formData.codigo_documento || 'DOC-CU-FR-003'}
      version={formData.version_documento || formData.version || '3'}
      fecha={formatearFechaDocumento(formData.fecha_documento || formData.fecha_formato)}
      pagina={page}
      totalPaginas={totalPaginas}
    />
  );
}

// Tabla semanal. En la medición recibe `registrarFila` y `refThead` para conocer
// la altura real (en píxeles) de cada fila y repartirlas por página.
function WeeklyTable({ weeks, registrarFila, refThead }) {
  return (
    <table className={`${TABLA} mt-1`}>
      <thead ref={refThead}>
        <tr>
          {['Semana', 'Contenido analítico', 'Estrategias didácticas', 'Evaluación'].map((label) => (
            <th key={label} className={CELDA_ENCABEZADO}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week, index) => {
          const fondo = index % 2 === 1 ? ' bg-[#F1F5F9]' : '';
          return (
            <tr
              key={`${week?.numero_semana || index}-${index}`}
              ref={registrarFila ? (elemento) => registrarFila(index, elemento) : undefined}
            >
              <td className={`${CELDA} w-[19%] font-bold${fondo}`}>
                {week?.semana || `Semana ${week?.numero_semana || index + 1}`}
                {week?.titulo ? `: ${week.titulo}` : ''}
              </td>
              <td className={`${CELDA} w-[31%] whitespace-pre-wrap${fondo}`}>
                {week?.contenido ||
                  (Array.isArray(week?.contenido_analitico)
                    ? week.contenido_analitico.map((x) => x.descripcion || x.tema).filter(Boolean).join('\n')
                    : '')}
              </td>
              <td className={`${CELDA} w-[27%] whitespace-pre-wrap${fondo}`}>
                {week?.estrategias_didacticas ||
                  (Array.isArray(week?.estrategias)
                    ? week.estrategias
                        .map((x) => (typeof x === 'string' ? x : `${x.nombre || ''} ${x.descripcion || ''}`))
                        .join('\n')
                    : week?.estrategias)}
              </td>
              <td className={`${CELDA} w-[23%] whitespace-pre-wrap${fondo}`}>
                {week?.evaluacion ||
                  (Array.isArray(week?.evaluaciones)
                    ? week.evaluaciones.map((x) => `${x.tipo || ''}: ${x.descripcion || ''}`).join('\n')
                    : '')}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Bloque de identificación del espacio académico (solo en la primera página).
function BloqueIdentidad({ formData, espacio, grupo }) {
  return (
    <div className="space-y-1">
      <table className={TABLA}>
        <tbody>
          <tr>
            <td className={CELDA_ETIQUETA}>Facultad</td>
            <td className={CELDA}>Ingeniería</td>
            <td className={CELDA_ETIQUETA}>Componente</td>
            <td className={CELDA}>{formData.componente || '—'}</td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Espacio académico</td>
            <td className={`${CELDA} font-bold`}>{espacio || '—'}</td>
            <td className={CELDA_ETIQUETA}>Semestre / Código</td>
            <td className={CELDA}>
              {grupo?.semestre || '—'} / {formData.codigo_espacio || '—'}
            </td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Programa</td>
            <td className={CELDA}>{grupo?.programa || '—'}</td>
            <td className={CELDA_ETIQUETA}>Grupo</td>
            <td className={`${CELDA} font-bold`}>
              {grupo?.codigo_jornada || grupo?.nombre || formData.grupo || '—'}
            </td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Periodo / Año</td>
            <td className={`${CELDA} font-bold`} colSpan="3">
              {formData.periodo} - {formData.anio}
            </td>
          </tr>
        </tbody>
      </table>
      <table className={TABLA}>
        <tbody>
          <tr>
            <td className={CELDA_ETIQUETA}>Resultado(s) de aprendizaje al que tributa</td>
            <td className={CELDA}>
              {formData.rap_tributa || formData.resultado_aprendizaje || '—'}
            </td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Competencia central</td>
            <td className={CELDA}>{formData.competencia_central || '—'}</td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Objetivo de aprendizaje</td>
            <td className={CELDA}>{formData.objetivo_aprendizaje || '—'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Observaciones y firmas: van al final de la planeación, en la página donde
// alcancen; si no caben, el paginador les crea su propia página.
function BloqueCierre({ formData }) {
  return (
    <div className="space-y-1">
      <table className={TABLA}>
        <tbody>
          <tr>
            <td className={CELDA_ETIQUETA}>Observaciones</td>
            <td className={`${CELDA} whitespace-pre-wrap`}>{formData.observaciones || ''}</td>
          </tr>
        </tbody>
      </table>
      <table className={TABLA}>
        <tbody>
          <tr>
            <td className={CELDA} style={{ height: '60px' }}>
              <b>Firma docente:</b> {formData.docente_nombre || '—'}
            </td>
            <td className={CELDA}>
              <b>Revisión / coordinación académica</b>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Última página institucional: datos de contacto del docente.
function PaginaContacto({ formData, page, totalPaginas }) {
  return (
    <article
      data-docx-page-break="true"
      className="mx-auto flex flex-col gap-3 bg-white"
      style={pageStyle}
    >
      <Header formData={formData} page={page} totalPaginas={totalPaginas} />
      <h2 className="border-b border-black pb-2 text-center text-sm font-bold text-[#112F5C]">
        DATOS DE CONTACTO DEL DOCENTE
      </h2>
      <table className={`${TABLA} text-[10px]`}>
        <tbody>
          {[
            ['Nombre', formData.docente_nombre],
            ['Correo', formData.docente_correo],
            ['Celular', formData.docente_celular],
            ['Horario de atención', formData.docente_atencion],
            ['Lugar de atención', formData.docente_lugar]
          ].map(([label, value]) => (
            <tr key={label}>
              <td className={`${CELDA_ETIQUETA} w-1/3`}>{label}</td>
              <td className={`${CELDA} whitespace-pre-wrap`}>{value || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-auto text-center text-[9px]">
        Firma del docente: ____________________________________
      </p>
      <PieDocumento
        codigo={formData.codigo_documento || 'DOC-CU-FR-003'}
        pagina={page}
        totalPaginas={totalPaginas}
      />
    </article>
  );
}

export default function FichaDocumento({ formData, espacio, grupo }) {
  const semanas = formData.semanas || [];
  const [paginas, setPaginas] = useState([{ filas: [], inicial: true, cierre: true }]);

  const filasMedidas = useRef(new Map());
  const refHeader = useRef(null);
  const refPie = useRef(null);
  const refInicial = useRef(null);
  const refCierre = useRef(null);
  const refThead = useRef(null);

  // Reparte las semanas por páginas según la altura real medida de cada fila.
  // En lugar de reservar un valor fijo de separaciones, calcula la altura exacta
  // que ocuparía cada página (encabezado + bloques + gaps + pie) para
  // aprovechar el alto disponible; si una fila no cabe, abre una página nueva.
  useLayoutEffect(() => {
    const alto = (elemento) => (elemento ? elemento.getBoundingClientRect().height : 0);

    const altoHeader = alto(refHeader.current);
    const altoPie = alto(refPie.current);
    const altoInicial = alto(refInicial.current);
    const altoCierre = alto(refCierre.current);
    const altoThead = alto(refThead.current);
    const alturasFilas = semanas.map((_, indice) => alto(filasMedidas.current.get(indice)));

    const limite = ALTO_UTIL_PX - HOLGURA_PX;

    // Altura total de una página compuesta por los bloques indicados.
    const alturaPagina = ({ inicial, conTabla, alturaTabla, cierre }) => {
      const bloques = [altoHeader, altoPie];
      if (inicial) bloques.push(altoInicial);
      if (conTabla) bloques.push(alturaTabla + MARGEN_TABLA_PX);
      if (cierre) bloques.push(altoCierre);
      const contenido = bloques.reduce((suma, valor) => suma + valor, 0);
      return contenido + GAP_PAGINA_PX * (bloques.length - 1);
    };

    const paginas = [];
    let pagina = { filas: [], inicial: true, cierre: false };
    let alturaTabla = altoThead;

    alturasFilas.forEach((alturaFila, indice) => {
      const cabeConFila = alturaPagina({
        inicial: pagina.inicial,
        conTabla: true,
        alturaTabla: alturaTabla + alturaFila,
        cierre: false
      }) <= limite;

      if (!cabeConFila && (pagina.filas.length > 0 || pagina.inicial)) {
        paginas.push(pagina);
        pagina = { filas: [], inicial: false, cierre: false };
        alturaTabla = altoThead;
      }

      pagina.filas.push(indice);
      alturaTabla += alturaFila;
    });

    const cierreCabe = alturaPagina({
      inicial: pagina.inicial,
      conTabla: pagina.filas.length > 0,
      alturaTabla,
      cierre: true
    }) <= limite;

    paginas.push(cierreCabe ? { ...pagina, cierre: true } : pagina);
    if (!cierreCabe) {
      paginas.push({ filas: [], inicial: false, cierre: true });
    }

    setPaginas((previas) => (JSON.stringify(previas) === JSON.stringify(paginas) ? previas : paginas));
  }, [formData, espacio, grupo]);

  const totalPaginas = paginas.length + 1;
  const codigoDocumento = formData.codigo_documento || 'DOC-CU-FR-003';

  return (
    <div className="bg-white">
      {paginas.map((pagina, indice) => (
        <article
          key={indice}
          data-docx-page-break={indice ? 'true' : undefined}
          className="mx-auto flex flex-col gap-2 bg-white"
          style={pageStyle}
        >
          <Header formData={formData} page={indice + 1} totalPaginas={totalPaginas} />
          {pagina.inicial && <BloqueIdentidad formData={formData} espacio={espacio} grupo={grupo} />}
          {pagina.filas.length > 0 && (
            <WeeklyTable weeks={pagina.filas.map((fila) => semanas[fila])} />
          )}
          {pagina.cierre && <BloqueCierre formData={formData} />}
          <PieDocumento codigo={codigoDocumento} pagina={indice + 1} totalPaginas={totalPaginas} />
        </article>
      ))}

      <PaginaContacto formData={formData} page={totalPaginas} totalPaginas={totalPaginas} />

      {/* Contenedor oculto de medición. Vive fuera de la previsualización
          (portal en el body) para que ni el PDF ni el .docx lo capturen. */}
      {createPortal(
        <div
          aria-hidden="true"
          className="bg-white"
          style={{
            ...pageStyle,
            minHeight: 0,
            position: 'absolute',
            top: 0,
            left: '-20000px',
            visibility: 'hidden',
            pointerEvents: 'none'
          }}
        >
          <div ref={refHeader}>
            <Header formData={formData} page={1} totalPaginas={1} />
          </div>
          <div className="flex flex-col gap-2">
            <div ref={refInicial}>
              <BloqueIdentidad formData={formData} espacio={espacio} grupo={grupo} />
            </div>
            <div>
              <WeeklyTable
                weeks={semanas}
                refThead={refThead}
                registrarFila={(indice, elemento) => {
                  if (elemento) filasMedidas.current.set(indice, elemento);
                  else filasMedidas.current.delete(indice);
                }}
              />
            </div>
            <div ref={refCierre}>
              <BloqueCierre formData={formData} />
            </div>
            <div ref={refPie}>
              <PieDocumento codigo={codigoDocumento} pagina={1} totalPaginas={1} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
