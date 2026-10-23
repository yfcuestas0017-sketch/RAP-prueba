import React from 'react';
import { FaBook, FaClipboardList } from 'react-icons/fa';

export default function ApartadosPruebas({ activo, onCambiar }) {
  const apartados = [
    { id: 'rap', etiqueta: 'Pruebas RAP', icono: <FaClipboardList /> },
    { id: 'saber-pro', etiqueta: 'Pruebas Saber Pro', icono: <FaBook /> }
  ];

  return (
    <div className="flex border-b border-gray-200 gap-6 text-xs font-bold" role="tablist" aria-label="Tipo de pruebas">
      {apartados.map((apartado) => (
        <button
          key={apartado.id}
          type="button"
          role="tab"
          aria-selected={activo === apartado.id}
          onClick={() => onCambiar(apartado.id)}
          className={`pb-3 flex items-center gap-2 transition-all ${
            activo === apartado.id
              ? 'border-b-2 border-[#B3282D] text-[#B3282D]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {apartado.icono} {apartado.etiqueta}
        </button>
      ))}
    </div>
  );
}

// Sub-apartados reutilizables (por ejemplo: Evaluaciones / Historial) con el
// mismo estilo del selector de tipo de prueba.
export function SubApartadosPruebas({ activo, onCambiar, apartados = [], etiqueta = 'Sub-apartados' }) {
  return (
    <div className="flex border-b border-gray-200 gap-6 text-xs font-bold" role="tablist" aria-label={etiqueta}>
      {apartados.map((apartado) => (
        <button
          key={apartado.id}
          type="button"
          role="tab"
          aria-selected={activo === apartado.id}
          onClick={() => onCambiar(apartado.id)}
          className={`pb-3 flex items-center gap-2 transition-all ${
            activo === apartado.id
              ? 'border-b-2 border-[#B3282D] text-[#B3282D]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          {apartado.icono} {apartado.etiqueta}
        </button>
      ))}
    </div>
  );
}

export function PanelSaberProPendiente() {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
      <div className="max-w-2xl">
        <h2 className="text-sm font-bold text-[#112F5C]">Pruebas Saber Pro</h2>
        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
          Este apartado ya está ubicado dentro de Crear Pruebas. La aplicación todavía no cuenta con un flujo de
          administración para crear y asignar pruebas Saber Pro. Para habilitarlo se requiere soporte de datos y API.
        </p>
      </div>
    </section>
  );
}
