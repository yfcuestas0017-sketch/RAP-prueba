import React from 'react';
import {
  CELDA,
  CELDA_ETIQUETA,
  EncabezadoDocumento,
  PieDocumento,
  SeccionDocumento,
  TABLA,
  TITULO_SECCION
} from '../../../components/documentos/DocumentoBase.jsx';

// Documento institucional del microcurrículo (DOC-CU-FR-002). Se usa tanto en
// la previsualización del formulario como en la exportación desde la tabla.
export default function MicrocurriculoPreview({
  formData,
  nombreEspacioAcademico,
  innerRef,
  exportMode = false
}) {
  return (
    <div
      ref={innerRef}
      className={`bg-white p-6 text-gray-900 text-[9px] font-sans space-y-2 ${exportMode ? 'w-full max-w-none mx-0' : 'max-w-4xl mx-auto'}`}
    >
      <EncabezadoDocumento
        titulo="Microcurrículo"
        subtitulo="Syllabus"
        codigo={formData.codigo || 'DOC-CU-FR-002'}
        version={formData.version || '3'}
        fecha={formData.fecha_documento || '12/JUL/2023'}
      />

      <table className={`${TABLA} mt-2`}>
        <tbody>
          <tr>
            <td colSpan="4" className={TITULO_SECCION}>
              1. Identificación del espacio académico
            </td>
          </tr>
          <tr>
            <td className={`${CELDA_ETIQUETA} w-[16%]`}>Facultad:</td>
            <td className={`${CELDA} w-[34%]`}>{formData.facultad || '—'}</td>
            <td className={`${CELDA_ETIQUETA} w-[16%]`}>Programa:</td>
            <td className={CELDA}>{formData.programa || '—'}</td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Modalidad:</td>
            <td className={CELDA}>{formData.modalidad}</td>
            <td className={CELDA_ETIQUETA}>Nivel:</td>
            <td className={CELDA}>{formData.nivel}</td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Espacio Académico (EA):</td>
            <td className={`${CELDA} font-bold`}>
              {formData.espacio_academico || nombreEspacioAcademico(formData.id_espacio_academico) || '—'}
            </td>
            <td className={CELDA_ETIQUETA}>Código (EA):</td>
            <td className={CELDA}>{formData.codigo_ea || '—'}</td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Área:</td>
            <td className={CELDA}>{formData.area}</td>
            <td className={CELDA_ETIQUETA}>No. Créditos:</td>
            <td className={`${CELDA} font-bold`}>{formData.creditos}</td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Horas Directas:</td>
            <td className={CELDA}>{formData.horas_acompanamiento_directo} Horas</td>
            <td className={CELDA_ETIQUETA}>Horas Independiente:</td>
            <td className={CELDA}>{formData.horas_trabajo_independiente} Horas</td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Prerrequisito:</td>
            <td className={CELDA}>{formData.prerrequisito}</td>
            <td className={CELDA_ETIQUETA}>Semestre / Periodo:</td>
            <td className={`${CELDA} font-bold`}>
              {formData.semestre || '—'} / {formData.periodo}
            </td>
          </tr>
        </tbody>
      </table>

      <SeccionDocumento titulo="2. Síntesis del espacio académico">
        {formData.sintesis || '—'}
      </SeccionDocumento>

      <SeccionDocumento titulo="3. Propósito del espacio académico">
        {formData.proposito || '—'}
      </SeccionDocumento>

      <SeccionDocumento titulo="4. Justificación">
        {formData.justificacion || '—'}
      </SeccionDocumento>

      <SeccionDocumento titulo="7. Competencia central (verbo + objeto + finalidad)">
        <span className="font-semibold">
          {formData.competencia_central || '—'}
        </span>
      </SeccionDocumento>

      <table className={`${TABLA} mt-2`}>
        <tbody>
          <tr>
            <td colSpan="3" className={TITULO_SECCION}>
              12. Elaboró, revisó y aprobó
            </td>
          </tr>
          <tr>
            <td className={`${CELDA} w-1/3 align-top`}>
              <div className="mb-4 font-bold text-[#112F5C]">ELABORÓ</div>
              <div>Nombre: {formData.nombre_docente || '—'}</div>
              <div>Cargo: Docente TC</div>
              <div className="mt-6 border-t border-dotted border-gray-500 pt-1">Firma</div>
              <div className="mt-1">Fecha: {formData.fecha_documento || '06/08/2026'}</div>
            </td>
            <td className={`${CELDA} w-1/3 align-top`}>
              <div className="mb-4 font-bold text-[#112F5C]">REVISÓ</div>
              <div>Nombre: {formData.coordinador || '—'}</div>
              <div>Cargo: Coordinadora Académica</div>
              <div className="mt-6 border-t border-dotted border-gray-500 pt-1">Firma</div>
            </td>
            <td className={`${CELDA} w-1/3 align-top`}>
              <div className="mb-4 font-bold text-[#112F5C]">APROBÓ</div>
              <div>Comité Curricular</div>
              <div>Acta: —</div>
              <div className="mt-6 border-t border-dotted border-gray-500 pt-1">Firma</div>
            </td>
          </tr>
        </tbody>
      </table>

      <PieDocumento codigo={formData.codigo || 'DOC-CU-FR-002'} />
    </div>
  );
}
