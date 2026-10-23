import React, { useMemo } from 'react';

const numero = (valor) => {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? Math.max(0, Math.min(100, resultado)) : 0;
};

export function agruparCoberturaPorRAP(resultados = []) {
  const acumulados = new Map();
  resultados.forEach((fila) => {
    const clave = String(fila.codigo_rap || fila.id_rap || fila.nombre_rap || 'RAP');
    const actual = acumulados.get(clave) || { etiqueta: clave, nombre: fila.nombre_rap || clave, suma: 0, cantidad: 0 };
    actual.suma += numero(fila.cobertura);
    actual.cantidad += 1;
    acumulados.set(clave, actual);
  });
  return Array.from(acumulados.values()).map((fila) => ({
    ...fila,
    valor: fila.suma / fila.cantidad
  }));
}

export default function ProgresoResultadosChart({ resultados = [] }) {
  const puntos = useMemo(() => agruparCoberturaPorRAP(resultados), [resultados]);

  if (!puntos.length) return null;

  const anchoPunto = 92;
  const ancho = Math.max(600, puntos.length * anchoPunto + 56);
  const alto = 250;
  const izquierda = 42;
  const arriba = 18;
  const abajo = 42;
  const altoGrafico = alto - arriba - abajo;
  const x = (indice) => izquierda + (puntos.length === 1 ? (ancho - izquierda - 16) / 2 : indice * (ancho - izquierda - 32) / (puntos.length - 1));
  const y = (valor) => arriba + (100 - valor) * altoGrafico / 100;
  const linea = puntos.map((punto, indice) => `${x(indice)},${y(punto.valor)}`).join(' ');

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm" aria-labelledby="progreso-resultados-titulo">
      <div className="mb-3">
        <h3 id="progreso-resultados-titulo" className="text-sm font-bold text-[#112F5C]">Progreso de resultados de aprendizaje</h3>
        <p className="mt-1 text-[11px] text-gray-500">Cobertura promedio registrada por RAP para los filtros seleccionados. No representa una calificación individual.</p>
      </div>
      <div className="overflow-x-auto" role="img" aria-label="Gráfico de cobertura promedio por resultado de aprendizaje, en porcentaje">
        <svg viewBox={`0 0 ${ancho} ${alto}`} className="min-w-full" style={{ minWidth: `${ancho}px`, height: '250px' }}>
          {[0, 25, 50, 75, 100].map((valor) => (
            <g key={valor}>
              <line x1={izquierda} x2={ancho - 16} y1={y(valor)} y2={y(valor)} stroke="#e5e7eb" strokeDasharray="4 4" />
              <text x={izquierda - 8} y={y(valor) + 4} textAnchor="end" fontSize="10" fill="#6b7280">{valor}%</text>
            </g>
          ))}
          <polyline points={linea} fill="none" stroke="#19734b" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {puntos.map((punto, indice) => (
            <g key={`${punto.etiqueta}-${indice}`}>
              <circle cx={x(indice)} cy={y(punto.valor)} r="5" fill="#19734b" stroke="white" strokeWidth="2">
                <title>{`${punto.nombre}: ${Math.round(punto.valor)}% de cobertura promedio`}</title>
              </circle>
              <text x={x(indice)} y={alto - 16} textAnchor="middle" fontSize="10" fill="#475569">{punto.etiqueta}</text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
