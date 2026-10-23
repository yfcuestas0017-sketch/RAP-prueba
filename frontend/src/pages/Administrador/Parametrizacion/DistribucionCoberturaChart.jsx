import React, { useMemo } from 'react';
import { agruparCoberturaPorRAP } from './ProgresoResultadosChart.jsx';

const RANGOS = [
  { etiqueta: '80% o más', color: '#19734b', coincide: (valor) => valor >= 80 },
  { etiqueta: '70–79%', color: '#2477bd', coincide: (valor) => valor >= 70 && valor < 80 },
  { etiqueta: '60–69%', color: '#e3a008', coincide: (valor) => valor >= 60 && valor < 70 },
  { etiqueta: 'Menos de 60%', color: '#c2413b', coincide: (valor) => valor < 60 }
];

export default function DistribucionCoberturaChart({ resultados = [] }) {
  const cantidades = useMemo(() => {
    const puntos = agruparCoberturaPorRAP(resultados);
    return RANGOS.map((rango) => ({
      ...rango,
      cantidad: puntos.filter((punto) => rango.coincide(punto.valor)).length
    }));
  }, [resultados]);

  const total = cantidades.reduce((suma, rango) => suma + rango.cantidad, 0);
  if (!total) return null;

  let acumulado = 0;
  const segmentos = cantidades.map((rango) => {
    const inicio = acumulado;
    acumulado += (rango.cantidad / total) * 100;
    return `${rango.color} ${inicio}% ${acumulado}%`;
  });

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm" aria-labelledby="distribucion-cobertura-titulo">
      <div className="mb-4">
        <h3 id="distribucion-cobertura-titulo" className="text-sm font-bold text-[#112F5C]">Distribución de cobertura por RAP</h3>
        <p className="mt-1 text-[11px] text-gray-500">Cantidad de RAP según su cobertura promedio.</p>
      </div>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
        <div
          role="img"
          aria-label={`Gráfico circular con la distribución de ${total} RAP por rango de cobertura`}
          className="h-40 w-40 shrink-0 rounded-full"
          style={{ background: `conic-gradient(${segmentos.join(', ')})` }}
        />
        <ul className="w-full space-y-2 sm:w-auto">
          {cantidades.map((rango) => (
            <li key={rango.etiqueta} className="flex items-center gap-2 text-xs text-gray-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: rango.color }} />
              <span className="min-w-24">{rango.etiqueta}</span>
              <strong className="ml-auto text-gray-800">{rango.cantidad}</strong>
              <span className="text-gray-400">({Math.round((rango.cantidad / total) * 100)}%)</span>
            </li>
          ))}
          <li className="border-t border-gray-100 pt-2 text-xs font-semibold text-[#112F5C]">Total: {total} RAP</li>
        </ul>
      </div>
    </section>
  );
}
