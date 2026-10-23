import React from 'react';
import { FaSave, FaArrowLeft, FaPlus, FaTrashAlt } from 'react-icons/fa';
import { impedirEnvioPorEnter } from '../../../utils/impedirEnvioPorEnter.js';
import FichaPreview from './FichaPreview.jsx';

const inputBase =
  'w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-sky-400';

export default function FichaForm({
  formData,
  setFormData,
  espaciosAcademicos,
  raps,
  guardando = false,
  modoEdicion = false,
  pdfRef,
  onSubmit,
  onCancelar
}) {
  const campo = (clave, valor) => setFormData({ ...formData, [clave]: valor });

  const editarSemana = (indice, clave, valor) => {
    const semanas = formData.semanas.map((s, i) =>
      i === indice ? { ...s, [clave]: valor } : s
    );
    setFormData({ ...formData, semanas });
  };

  const agregarSemana = () => {
    const numero = formData.semanas.length + 1;
    setFormData({
      ...formData,
      semanas: [
        ...formData.semanas,
        {
          semana: `Semana ${numero}`,
          contenido_analitico: '',
          estrategias_didacticas: '',
          evaluacion: ''
        }
      ]
    });
  };

  const eliminarSemana = (indice) => {
    setFormData({ ...formData, semanas: formData.semanas.filter((_, i) => i !== indice) });
  };

  const rapSeleccionado = raps.find((r) => String(r.id_rap) === String(formData.id_rap));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onCancelar}
          className="flex items-center gap-2 text-[#112F5C] font-bold text-xs hover:underline bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm"
        >
          <FaArrowLeft /> Volver a la Lista
        </button>
      </div>

      <form onSubmit={onSubmit} onKeyDown={impedirEnvioPorEnter} className="space-y-6">
        {/* 1. IDENTIFICACIÓN */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#112F5C] border-b pb-3">
            1. Identificación <span className="text-gray-400 font-medium">— Encabezado y espacio académico</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Espacio Académico (EA):
              </label>
              <select
                value={formData.id_espacio_academico}
                onChange={(e) => campo('id_espacio_academico', e.target.value)}
                className={`${inputBase} font-semibold text-[#112F5C]`}
              >
                <option value="">-- Seleccionar --</option>
                {espaciosAcademicos.map((ea) => (
                  <option key={ea.id_espacio_academico} value={ea.id_espacio_academico}>
                    {ea.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Código (EA):</label>
              <input
                type="text"
                value={formData.codigo_ea}
                onChange={(e) => campo('codigo_ea', e.target.value)}
                className={inputBase}
                placeholder="1104041102"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Grupo:</label>
              <input
                type="text"
                value={formData.grupo}
                onChange={(e) => campo('grupo', e.target.value)}
                className={inputBase}
                placeholder="2H"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Facultad:</label>
              <input
                type="text"
                value={formData.facultad}
                onChange={(e) => campo('facultad', e.target.value)}
                className={inputBase}
                placeholder="Ingeniería"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Programa:</label>
              <input
                type="text"
                value={formData.programa}
                onChange={(e) => campo('programa', e.target.value)}
                className={inputBase}
                placeholder="Ingeniería de sistemas"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Componente:</label>
              <input
                type="text"
                value={formData.componente}
                onChange={(e) => campo('componente', e.target.value)}
                className={inputBase}
                placeholder="Gestión de la información"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Semestre:</label>
              <input
                type="text"
                value={formData.semestre}
                onChange={(e) => campo('semestre', e.target.value)}
                className={inputBase}
                placeholder="Segundo"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Periodo / Año:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.periodo}
                  onChange={(e) => campo('periodo', e.target.value)}
                  className={`${inputBase} px-3`}
                  placeholder="II"
                />
                <input
                  type="text"
                  value={formData.anio}
                  onChange={(e) => campo('anio', e.target.value)}
                  className={`${inputBase} px-3`}
                  placeholder="2026"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Versión / Fecha:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.version}
                  onChange={(e) => campo('version', e.target.value)}
                  className={`${inputBase} px-3`}
                  placeholder="3"
                />
                <input
                  type="date"
                  value={formData.fecha_documento ? formData.fecha_documento.split('T')[0] : ''}
                  onChange={(e) => campo('fecha_documento', e.target.value)}
                  className={`${inputBase} px-2 text-[11px]`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. RAP, COMPETENCIA Y OBJETIVO */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#112F5C] border-b pb-3">
            2. Resultado de aprendizaje y competencia{' '}
            <span className="text-gray-400 font-medium">— Al que tributa la ficha</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Resultado(s) de aprendizaje al que tributa:
              </label>
              <select
                value={formData.id_rap}
                onChange={(e) => campo('id_rap', e.target.value)}
                className={`${inputBase} font-semibold text-[#112F5C]`}
              >
                <option value="">-- Seleccionar RAP --</option>
                {raps.map((r) => (
                  <option key={r.id_rap} value={r.id_rap}>
                    {r.codigo_rap} — {r.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 border border-gray-100 bg-gray-50 rounded-xl p-3 text-[11px] text-gray-600">
              {rapSeleccionado ? (
                <p className="text-justify">{rapSeleccionado.descripcion || rapSeleccionado.nombre}</p>
              ) : (
                <span className="text-gray-400">Seleccione un RAP para ver su descripción.</span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Competencia (código):
              </label>
              <input
                type="text"
                value={formData.competencia_central_codigo}
                onChange={(e) => campo('competencia_central_codigo', e.target.value)}
                className={inputBase}
                placeholder="CP2"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Competencia central (verbo + objeto + finalidad):
              </label>
              <input
                type="text"
                value={formData.competencia_central}
                onChange={(e) => campo('competencia_central', e.target.value)}
                className={inputBase}
                placeholder="Resuelve problemas de ingeniería que aportan el desarrollo social..."
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Objetivo de aprendizaje:
              </label>
              <textarea
                rows={3}
                value={formData.objetivo_aprendizaje}
                onChange={(e) => campo('objetivo_aprendizaje', e.target.value)}
                className={inputBase}
              />
            </div>
          </div>
        </div>

        {/* 3. CONTENIDO POR SEMANA */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-sm font-bold text-[#112F5C]">
              3. Contenido por semana{' '}
              <span className="text-gray-400 font-medium">— Contenido, estrategias y evaluación</span>
            </h2>
            <button
              type="button"
              onClick={agregarSemana}
              className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <FaPlus /> Agregar semana
            </button>
          </div>

          {formData.semanas.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">
              No hay semanas registradas. Use «Agregar semana».
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#112F5C] text-white font-semibold">
                  <tr>
                    <th className="px-3 py-2 w-28">SEMANA</th>
                    <th className="px-3 py-2">CONTENIDO ANALÍTICO</th>
                    <th className="px-3 py-2">ESTRATEGIAS DIDÁCTICAS</th>
                    <th className="px-3 py-2">EVALUACIÓN</th>
                    <th className="px-3 py-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {formData.semanas.map((s, indice) => (
                    <tr key={indice} className="align-top">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={s.semana}
                          onChange={(e) => editarSemana(indice, 'semana', e.target.value)}
                          className={`${inputBase} px-2 text-[11px] font-semibold`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <textarea
                          rows={3}
                          value={s.contenido_analitico}
                          onChange={(e) => editarSemana(indice, 'contenido_analitico', e.target.value)}
                          className={`${inputBase} px-2 text-[11px]`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <textarea
                          rows={3}
                          value={s.estrategias_didacticas}
                          onChange={(e) => editarSemana(indice, 'estrategias_didacticas', e.target.value)}
                          className={`${inputBase} px-2 text-[11px]`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <textarea
                          rows={3}
                          value={s.evaluacion}
                          onChange={(e) => editarSemana(indice, 'evaluacion', e.target.value)}
                          className={`${inputBase} px-2 text-[11px]`}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => eliminarSemana(indice)}
                          aria-label="Eliminar semana"
                          className="text-[#B3282D] hover:text-red-800 transition"
                        >
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. CIERRE, FIRMAS Y DATOS DEL DOCENTE */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#112F5C] border-b pb-3">
            4. Observaciones, firmas y datos del docente{' '}
            <span className="text-gray-400 font-medium">— Cierre del documento</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Observaciones:</label>
              <textarea
                rows={2}
                value={formData.observaciones}
                onChange={(e) => campo('observaciones', e.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Coordinador Académico:
              </label>
              <input
                type="text"
                value={formData.coordinador}
                onChange={(e) => campo('coordinador', e.target.value)}
                className={inputBase}
                placeholder="Nombre de quien recibe"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Fechas de firma / recibido:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={formData.fecha_firma ? formData.fecha_firma.split('T')[0] : ''}
                  onChange={(e) => campo('fecha_firma', e.target.value)}
                  className={`${inputBase} px-2 text-[11px]`}
                />
                <input
                  type="date"
                  value={formData.fecha_recibido ? formData.fecha_recibido.split('T')[0] : ''}
                  onChange={(e) => campo('fecha_recibido', e.target.value)}
                  className={`${inputBase} px-2 text-[11px]`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Correo electrónico:
              </label>
              <input
                type="text"
                value={formData.docente_correo}
                onChange={(e) => campo('docente_correo', e.target.value)}
                className={inputBase}
                placeholder="docente@unicesmag.edu.co"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Celular:</label>
              <input
                type="text"
                value={formData.docente_celular}
                onChange={(e) => campo('docente_celular', e.target.value)}
                className={inputBase}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                Horario de atención:
              </label>
              <input
                type="text"
                value={formData.horario_atencion}
                onChange={(e) => campo('horario_atencion', e.target.value)}
                className={inputBase}
                placeholder="Martes: 2:00 – 5:00"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Lugar:</label>
              <input
                type="text"
                value={formData.lugar_atencion}
                onChange={(e) => campo('lugar_atencion', e.target.value)}
                className={inputBase}
                placeholder="Facultad de Ingeniería"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button
              type="submit"
              disabled={guardando}
              className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow transition flex items-center gap-2 disabled:opacity-60"
            >
              <FaSave />
              {guardando ? 'Guardando...' : modoEdicion ? 'Actualizar Ficha' : 'Guardar Ficha'}
            </button>
          </div>
        </div>
      </form>

      {/* Documento institucional de consulta */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md">
        <FichaPreview
          innerRef={pdfRef}
          formData={formData}
          espaciosAcademicos={espaciosAcademicos}
          raps={raps}
        />
      </div>
    </div>
  );
}

