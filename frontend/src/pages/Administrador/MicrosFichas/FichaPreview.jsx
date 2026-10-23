import React from 'react';
import {
  CELDA,
  CELDA_ENCABEZADO,
  CELDA_ETIQUETA,
  EncabezadoDocumento,
  PieDocumento,
  SeccionDocumento,
  TABLA,
  TITULO_SECCION
} from '../../../components/documentos/DocumentoBase.jsx';

// Documento institucional de la ficha de desarrollo temático (DOC-CU-FR-003).
// Se usa tanto en la previsualización del formulario como en la exportación
// desde la tabla.
export default function FichaPreview({
  formData,
  espaciosAcademicos = [],
  raps = [],
  innerRef,
  exportMode = false
}) {
  const rapSeleccionado = raps.find((r) => String(r.id_rap) === String(formData.id_rap));

  return (
    <div
      ref={innerRef}
      className={`bg-white p-6 text-gray-900 text-[9px] font-sans space-y-2 ${exportMode ? 'w-full max-w-none mx-0' : 'max-w-5xl mx-auto'}`}
    >
      <EncabezadoDocumento
        titulo="Ficha de desarrollo temático"
        subtitulo="Planeación de aula"
        codigo={formData.codigo || 'DOC-CU-FR-003'}
        version={formData.version || '3'}
        fecha={formData.fecha_documento || '31/JUL/2023'}
      />

      <table className={`${TABLA} mt-2`}>
        <tbody>
          <tr>
            <td className={CELDA_ETIQUETA}>Facultad:</td>
            <td className={CELDA}>{formData.facultad}</td>
            <td className={CELDA_ETIQUETA}>Programa:</td>
            <td className={CELDA}>{formData.programa}</td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Componente:</td>
            <td className={CELDA}>{formData.componente}</td>
            <td className={CELDA_ETIQUETA}>Espacio Académico:</td>
            <td className={`${CELDA} font-bold`}>
              {formData.espacio_academico ||
                espaciosAcademicos.find(
                  (ea) => String(ea.id_espacio_academico) === String(formData.id_espacio_academico)
                )?.nombre}
            </td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Semestre:</td>
            <td className={CELDA}>{formData.semestre}</td>
            <td className={CELDA_ETIQUETA}>Código (EA):</td>
            <td className={CELDA}>{formData.codigo_ea}</td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Grupo:</td>
            <td className={CELDA}>{formData.grupo}</td>
            <td className={CELDA_ETIQUETA}>Periodo / Año:</td>
            <td className={`${CELDA} font-bold`}>
              {formData.periodo} {formData.anio}
            </td>
          </tr>
        </tbody>
      </table>

      <SeccionDocumento titulo="Resultado de aprendizaje (RAP) al que tributa">
        {rapSeleccionado ? (
          <div className="space-y-1">
            <p className="font-bold">{rapSeleccionado.codigo_rap || 'RAP'} — {rapSeleccionado.nombre || '—'}</p>
            {rapSeleccionado.descripcion && <p className="text-justify">{rapSeleccionado.descripcion}</p>}
          </div>
        ) : '—'}
      </SeccionDocumento>

      <SeccionDocumento titulo="Competencia central del espacio académico (CAP)">
        {formData.competencia_central
          ? `${formData.competencia_central_codigo} ${formData.competencia_central}`.trim()
          : '—'}
      </SeccionDocumento>

      <SeccionDocumento titulo="Objetivo de aprendizaje">
        {formData.objetivo_aprendizaje || '—'}
      </SeccionDocumento>

      <table className={`${TABLA} mt-2`}>
        <thead>
          <tr>
            <th className={`${CELDA_ENCABEZADO} w-[14%]`}>Semana</th>
            <th className={CELDA_ENCABEZADO}>Contenido analítico</th>
            <th className={CELDA_ENCABEZADO}>Estrategias didácticas</th>
            <th className={CELDA_ENCABEZADO}>Evaluación</th>
          </tr>
        </thead>
        <tbody>
          {formData.semanas.length === 0 ? (
            <tr>
              <td colSpan="4" className={`${CELDA} text-center text-gray-400`}>
                Sin semanas registradas
              </td>
            </tr>
          ) : (
            formData.semanas.map((s, indice) => {
              const fondo = indice % 2 === 1 ? ' bg-[#F1F5F9]' : '';
              return (
                <tr key={indice}>
                  <td className={`${CELDA} font-semibold${fondo}`}>{s.semana}</td>
                  <td className={`${CELDA} text-justify${fondo}`}>{s.contenido_analitico || '—'}</td>
                  <td className={`${CELDA} text-justify${fondo}`}>{s.estrategias_didacticas || '—'}</td>
                  <td className={`${CELDA} text-justify${fondo}`}>{s.evaluacion || '—'}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <table className={`${TABLA} mt-2`}>
        <tbody>
          <tr>
            <td className={`${CELDA} align-top`}>
              <div className="font-bold text-[#112F5C]">Nombre del Docente:</div>
              <div>{formData.nombre_docente || '—'}</div>
              <div className="mt-4">Firma: _______________</div>
              <div className="mt-1">Fecha: {formData.fecha_firma || '—'}</div>
            </td>
            <td className={`${CELDA} align-top`}>
              <div className="font-bold text-[#112F5C]">
                Nombre de quien recibe (Coordinador Académico):
              </div>
              <div>{formData.coordinador || '—'}</div>
              <div className="mt-4">Firma de Recibido: _______________</div>
              <div className="mt-1">Fecha: {formData.fecha_recibido || '—'}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table className={`${TABLA} mt-2`}>
        <tbody>
          <tr>
            <td colSpan="4" className={TITULO_SECCION}>
              Datos del docente
            </td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Correo electrónico:</td>
            <td className={CELDA}>{formData.docente_correo || '—'}</td>
            <td className={CELDA_ETIQUETA}>Celular:</td>
            <td className={CELDA}>{formData.docente_celular || '—'}</td>
          </tr>
          <tr>
            <td className={CELDA_ETIQUETA}>Horario de atención:</td>
            <td className={CELDA}>{formData.horario_atencion || '—'}</td>
            <td className={CELDA_ETIQUETA}>Lugar:</td>
            <td className={CELDA}>{formData.lugar_atencion || '—'}</td>
          </tr>
        </tbody>
      </table>

      <SeccionDocumento titulo="Observaciones">
        {formData.observaciones || '—'}
      </SeccionDocumento>

      <PieDocumento codigo={formData.codigo || 'DOC-CU-FR-003'} />
    </div>
  );
}
