import React, { useState } from 'react';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { impedirEnvioPorEnter } from '../../../utils/impedirEnvioPorEnter.js';
import { SEMESTRES } from '../../../utils/microcurriculo.js';
import MicrocurriculoPreview from './MicrocurriculoPreview.jsx';

const PASOS = [
  { titulo: 'Identificación', descripcion: 'Espacio y documento' },
  { titulo: 'Datos académicos', descripcion: 'Periodo, modalidad y carga' },
  { titulo: 'Síntesis', descripcion: 'Descripción del espacio' },
  { titulo: 'Propósito', descripcion: 'Alcance formativo' },
  { titulo: 'Justificación', descripcion: 'Relevancia del espacio' },
  { titulo: 'Competencia', descripcion: 'Competencia central' }
];

export default function MicrocurriculoForm({
  formData,
  setFormData,
  espaciosAcademicos,
  nombreEspacioAcademico,
  guardando = false,
  modoEdicion = false,
  pdfRef,
  onSubmit,
  onCancelar
}) {
  const [pasoActual, setPasoActual] = useState(0);

  const campo = (clave, valor) => setFormData({ ...formData, [clave]: valor });

  const inputBase =
    'w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-sky-400';

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
            {PASOS.map((paso, indice) => (
              <React.Fragment key={paso.titulo}>
                <button
                  type="button"
                  onClick={() => setPasoActual(indice)}
                  className="min-w-[82px] flex flex-col items-center text-center"
                  aria-current={indice === pasoActual ? 'step' : undefined}
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition ${
                      indice === pasoActual
                        ? 'bg-[#112F5C] text-white ring-4 ring-blue-100'
                        : indice < pasoActual
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {indice + 1}
                  </span>
                  <span
                    className={`mt-2 text-[11px] font-bold ${
                      indice === pasoActual ? 'text-[#112F5C]' : 'text-gray-500'
                    }`}
                  >
                    {paso.titulo}
                  </span>
                  <span className="hidden sm:block text-[10px] text-gray-400 mt-0.5">
                    {paso.descripcion}
                  </span>
                </button>
                {indice < PASOS.length - 1 && (
                  <span
                    className={`h-0.5 min-w-3 flex-1 rounded ${
                      indice < pasoActual ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                    aria-hidden="true"
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#112F5C] border-b pb-3">
            {PASOS[pasoActual].titulo}{' '}
            <span className="text-gray-400 font-medium">— {PASOS[pasoActual].descripcion}</span>
          </h2>

          {pasoActual === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Espacio Académico:
                </label>
                <select
                  value={formData.id_espacio_academico}
                  onChange={(e) => campo('id_espacio_academico', e.target.value)}
                  className={`${inputBase} font-semibold text-[#112F5C]`}
                >
                  <option value="">-- Seleccionar --</option>
                  {espaciosAcademicos.length === 0 && (
                    <option value="" disabled>
                      No hay espacios académicos disponibles
                    </option>
                  )}
                  {espaciosAcademicos.map((ea) => (
                    <option key={ea.id_espacio_academico} value={ea.id_espacio_academico}>
                      {ea.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Código del Documento:
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => campo('codigo', e.target.value)}
                  className={inputBase}
                />
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
                    placeholder="v3"
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
          )}

          {pasoActual === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Semestre del Programa:
                </label>
                <select
                  value={formData.semestre || ''}
                  onChange={(e) => campo('semestre', e.target.value)}
                  className={inputBase}
                >
                  <option value="">-- Seleccionar --</option>
                  {SEMESTRES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Periodo Lectivo:
                </label>
                <input
                  type="text"
                  value={formData.periodo}
                  onChange={(e) => campo('periodo', e.target.value)}
                  className={inputBase}
                  placeholder="IIP-2026"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Modalidad:
                </label>
                <select
                  value={formData.modalidad}
                  onChange={(e) => campo('modalidad', e.target.value)}
                  className={inputBase}
                >
                  <option value="Presencial">Presencial</option>
                  <option value="Virtual">Virtual</option>
                  <option value="A Distancia">A Distancia</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Créditos:
                </label>
                <input
                  type="number"
                  value={formData.creditos}
                  onChange={(e) => campo('creditos', e.target.value)}
                  className={inputBase}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Horas Directo / Independiente:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    value={formData.horas_acompanamiento_directo}
                    onChange={(e) => campo('horas_acompanamiento_directo', e.target.value)}
                    className={`${inputBase} px-2`}
                    placeholder="Directo"
                  />
                  <input
                    type="number"
                    value={formData.horas_trabajo_independiente}
                    onChange={(e) => campo('horas_trabajo_independiente', e.target.value)}
                    className={`${inputBase} px-2`}
                    placeholder="Indep."
                  />
                </div>
              </div>
            </div>
          )}

          {pasoActual === 2 && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                2. Síntesis del Espacio Académico:
              </label>
              <textarea
                rows={4}
                value={formData.sintesis}
                onChange={(e) => campo('sintesis', e.target.value)}
                className={inputBase}
              />
            </div>
          )}

          {pasoActual === 3 && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                3. Propósito del Espacio Académico:
              </label>
              <textarea
                rows={4}
                value={formData.proposito}
                onChange={(e) => campo('proposito', e.target.value)}
                className={inputBase}
              />
            </div>
          )}

          {pasoActual === 4 && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                4. Justificación:
              </label>
              <textarea
                rows={4}
                value={formData.justificacion}
                onChange={(e) => campo('justificacion', e.target.value)}
                className={inputBase}
              />
            </div>
          )}

          {pasoActual === 5 && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                7. Competencia Central:
              </label>
              <textarea
                rows={3}
                value={formData.competencia_central}
                onChange={(e) => campo('competencia_central', e.target.value)}
                className={inputBase}
              />
            </div>
          )}

          <div className="flex justify-between pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setPasoActual((paso) => Math.max(0, paso - 1))}
              disabled={pasoActual === 0}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            {pasoActual < PASOS.length - 1 ? (
              <button
                key="paso-siguiente"
                type="button"
                onClick={(e) => { e.preventDefault(); setPasoActual((paso) => Math.min(PASOS.length - 1, paso + 1)); }}
                className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow transition"
              >
                Siguiente
              </button>
            ) : (
              <button
                key="paso-guardar"
                type="submit"
                disabled={guardando}
                className="bg-[#112F5C] hover:bg-blue-900 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow transition flex items-center gap-2 disabled:opacity-60"
              >
                <FaSave /> {guardando ? 'Guardando...' : modoEdicion ? 'Actualizar Microcurrículo' : 'Guardar Microcurrículo'}
              </button>
            )}
          </div>
        </div>
      </form>
      {/* Documento institucional de consulta */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md">
        <MicrocurriculoPreview
          innerRef={pdfRef}
          formData={formData}
          nombreEspacioAcademico={nombreEspacioAcademico}
        />
      </div>
    </div>
  );
}

