import React, { forwardRef } from 'react';
import {
  CELDA,
  CELDA_ETIQUETA,
  EncabezadoDocumento,
  PieDocumento,
  SeccionDocumento,
  TABLA,
  TITULO_SECCION
} from '../../../components/documentos/DocumentoBase.jsx';
import { formatearFechaMicrocurriculo, hoyISO } from '../../../utils/microcurriculo.js';

const TOTAL_PAGINAS = 5;

// Nota: cada <article> mide exactamente una hoja (height: 8.5in). NO se usa
// `pageBreakAfter`/`breakAfter` porque el plugin de saltos de html2pdf inserta
// una página en blanco cuando la hoja ya está alineada al borde de página. El
// corte se resuelve en pdfExporter respetando `data-docx-page` sin rellenar.
const estiloPagina = {
  width: '11in',
  height: '8.5in',
  padding: '0.42in',
  boxSizing: 'border-box',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
};

function Encabezado({ formData, numeroPagina }) {
  return (
    <EncabezadoDocumento
      titulo="Microcurrículo"
      subtitulo="Syllabus"
      codigo="DOC-CU-FR-002"
      version={formData.version || '3'}
      fecha={formatearFechaMicrocurriculo(formData.fecha_documento, formatearFechaMicrocurriculo(hoyISO()))}
      pagina={numeroPagina}
      totalPaginas={TOTAL_PAGINAS}
    />
  );
}

const Seccion = SeccionDocumento;

const MicrocurriculoDocumento = forwardRef(function MicrocurriculoDocumento({ formData }, ref) {
  const opcion = (actual, valor, etiqueta) => (
    <span className="mr-3 whitespace-nowrap">
      {actual === valor ? '☒' : '☐'} {etiqueta}
    </span>
  );

  return (
    <div ref={ref} className="mc-document mx-auto bg-white font-sans text-gray-900" style={{ width: '11in' }}>
      <article className="mc-page" style={estiloPagina} data-docx-page="1">
        <Encabezado formData={formData} numeroPagina="1" />
        <table className={`${TABLA} mt-2`}>
          <tbody>
            <tr>
              <td colSpan="4" className={TITULO_SECCION}>
                1. Identificación del espacio académico
              </td>
            </tr>
            <tr>
              <td className={`${CELDA_ETIQUETA} w-[12%]`}>Facultad:</td>
              <td className={`${CELDA} w-[38%]`}>{formData.facultad || '—'}</td>
              <td className={`${CELDA_ETIQUETA} w-[12%]`}>Programa:</td>
              <td className={CELDA}>{formData.programa || formData.programas?.map((programa) => programa.nombre).filter(Boolean).join(', ') || '—'}</td>
            </tr>
            <tr>
              <td className={CELDA_ETIQUETA}>Modalidad:</td>
              <td colSpan="3" className={CELDA}>
                {opcion(formData.modalidad, 'Presencial', 'Presencial')}
                {opcion(formData.modalidad, 'Virtual', 'Virtual')}
                {opcion(formData.modalidad, 'A Distancia', 'A Distancia')} ¿Otra, cuál?: ________
              </td>
            </tr>
            <tr>
              <td className={CELDA_ETIQUETA}>Nivel:</td>
              <td colSpan="3" className={CELDA}>
                {opcion(formData.nivel, 'Técnico', 'Técnico')}
                {opcion(formData.nivel, 'Tecnológico', 'Tecnológico')}
                {opcion(formData.nivel, 'Profesional', 'Profesional')}
                {opcion(formData.nivel, 'Especialización', 'Especialización')}
                {opcion(formData.nivel, 'Maestría', 'Maestría')}
                {opcion(formData.nivel, 'Doctorado', 'Doctorado')}
              </td>
            </tr>
            <tr>
              <td className={CELDA_ETIQUETA}>Espacio Académico (EA):</td>
              <td className={`${CELDA} font-bold`}>{formData.espacio_academico || ''}</td>
              <td className={CELDA_ETIQUETA}>Código (EA):</td>
              <td className={CELDA}>{formData.codigo}</td>
            </tr>
            <tr>
              <td className={CELDA_ETIQUETA}>Área:</td>
              <td colSpan="3" className={CELDA}>
                {opcion(formData.area, 'Básica', 'Básica')}
                {opcion(formData.area, 'Disciplinar', 'Disciplinar')}
                {opcion(formData.area, 'Investigación', 'Investigación')}
              </td>
            </tr>
            <tr>
              <td className={CELDA_ETIQUETA}>Componente:</td>
              <td className={CELDA}>{formData.componente || '—'}</td>
              <td className={CELDA_ETIQUETA}>No. de créditos:</td>
              <td className={CELDA}>{formData.creditos}</td>
            </tr>
            <tr>
              <td className={CELDA_ETIQUETA}>Horas Acompañamiento Directo:</td>
              <td className={CELDA}>{formData.horas_acompanamiento_directo}</td>
              <td className={CELDA_ETIQUETA}>Horas de Trabajo Independiente:</td>
              <td className={CELDA}>{formData.horas_trabajo_independiente}</td>
            </tr>
            <tr>
              <td className={CELDA_ETIQUETA}>Prerrequisito:</td>
              <td className={CELDA}>{formData.prerrequisito}</td>
              <td className={CELDA_ETIQUETA}>Semestre / Periodo:</td>
              <td className={CELDA}>{formData.semestre || '—'} / {formData.periodo}</td>
            </tr>
          </tbody>
        </table>

        <Seccion titulo="2. Síntesis del espacio académico">
          {formData.sintesis || '—'}
        </Seccion>
        <Seccion titulo="3. Propósito del espacio académico">
          {formData.proposito || '—'}
        </Seccion>
        <PieDocumento codigo="DOC-CU-FR-002" pagina="1" totalPaginas={TOTAL_PAGINAS} />
      </article>

      <article className="mc-page" style={estiloPagina} data-docx-page="2" data-docx-page-break="true">
        <Encabezado formData={formData} numeroPagina="2" />
        <Seccion titulo="4. Justificación">
          {formData.justificacion || '—'}
        </Seccion>
        <Seccion titulo="5. Competencia del programa">
          {formData.competencia_programa || '—'}
        </Seccion>
        <Seccion titulo="6. Resultado(s) de aprendizaje al que tributa">
          {formData.rap_tributa || formData.resultado_aprendizaje || '—'}
        </Seccion>
        <Seccion titulo="7. Competencia central (estructura: verbo + objeto + finalidad)">
          {formData.competencia_central || '—'}
        </Seccion>
        <Seccion titulo="8. Organización de contenidos" />
        <PieDocumento codigo="DOC-CU-FR-002" pagina="2" totalPaginas={TOTAL_PAGINAS} />
      </article>

      <article className="mc-page" style={estiloPagina} data-docx-page="3" data-docx-page-break="true">
        <Encabezado formData={formData} numeroPagina="3" />
        <Seccion titulo="8. Organización de contenidos">
          {formData.organizacion_contenidos || '—'}
        </Seccion>
        <Seccion titulo="9. Referentes bibliográficos">
          {formData.referentes_bibliograficos || '—'}
        </Seccion>
        <PieDocumento codigo="DOC-CU-FR-002" pagina="3" totalPaginas={TOTAL_PAGINAS} />
      </article>

      <article className="mc-page" style={estiloPagina} data-docx-page="4" data-docx-page-break="true">
        <Encabezado formData={formData} numeroPagina="4" />
        <Seccion titulo="9. Referentes bibliográficos (continuación)">
          {formData.referentes_bibliograficos || '—'}
        </Seccion>
        <Seccion titulo="10. Estrategias de enseñanza">
          {formData.estrategias_ensenanza || '—'}
        </Seccion>
        <Seccion titulo="11. Estrategias evaluativas">
          {formData.estrategias_evaluacion || '—'}
        </Seccion>
        <PieDocumento codigo="DOC-CU-FR-002" pagina="4" totalPaginas={TOTAL_PAGINAS} />
      </article>

      <article className="mc-page" style={estiloPagina} data-docx-page="5" data-docx-page-break="true">
        <Encabezado formData={formData} numeroPagina="5" />
        <Seccion titulo="11. Estrategias evaluativas (continuación)">
          <p>{formData.estrategias_evaluacion || '—'}</p>
          <p className="mt-2"><b>Criterios de evaluación:</b></p>
          <p>{formData.criterios_evaluacion || '—'}</p>
        </Seccion>
        <section className="mt-4">
          <h2 className={TITULO_SECCION}>12. Elaboró, revisó y aprobó</h2>
          <table className={TABLA}>
            <tbody>
              <tr>
                <td className={`${CELDA} w-1/3 align-top`}>
                  <div className="mb-6 font-bold text-[#112F5C]">ELABORÓ</div>
                  <div>Nombre: {formData.elaboro_nombre || '—'}</div>
                  <div>Cargo: {formData.elaboro_cargo || '—'}</div>
                  <div className="mt-6 border-t border-dotted border-gray-500 pt-1">Firma</div>
                  <div className="mt-1">Fecha: {formatearFechaMicrocurriculo(formData.fecha_documento, formatearFechaMicrocurriculo(hoyISO()))}</div>
                </td>
                <td className={`${CELDA} w-1/3 align-top`}>
                  <div className="mb-6 font-bold text-[#112F5C]">REVISÓ</div>
                  <div>Nombre: {formData.reviso_nombre || '—'}</div>
                  <div>Cargo: {formData.reviso_cargo || '—'}</div>
                  <div className="mt-6 border-t border-dotted border-gray-500 pt-1">Firma</div>
                  <div className="mt-1">Fecha: {formData.reviso_fecha || '—'}</div>
                </td>
                <td className={`${CELDA} w-1/3 align-top`}>
                  <div className="mb-6 font-bold text-[#112F5C]">APROBÓ</div>
                  <div>{formData.aprobo_comite || '—'}</div>
                  <div>Acta: {formData.aprobo_acta || '—'}</div>
                  <div className="mt-6 border-t border-dotted border-gray-500 pt-1">Firma</div>
                  <div className="mt-1">Fecha: {formData.aprobo_fecha || '—'}</div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        <PieDocumento codigo="DOC-CU-FR-002" pagina="5" totalPaginas={TOTAL_PAGINAS} />
      </article>
    </div>
  );
});

export default MicrocurriculoDocumento;
