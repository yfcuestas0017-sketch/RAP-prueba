import React, { useState } from 'react';
import { FaClipboardList, FaFolderOpen, FaCommentDots } from 'react-icons/fa';

export default function EstudianteInicio() {
  const [rapSeleccionado, setRapSeleccionado] = useState('rap1');

  const criteriosEvaluacion = [
    {
      id: 1,
      criterio: 'CE1. Analiza problemas de ingeniería y contrasta las teorías...',
      materia: 'Introducción a la Programación - Evaluado el 12/05/2026',
      nivel: 'Bueno',
      nivelColor: 'bg-blue-100 text-blue-700'
    },
    {
      id: 2,
      criterio: 'CE2. Propone diferentes soluciones a problemas de Ingeniería...',
      materia: 'Programación de Computadores - Evaluado en 20/05/2026',
      nivel: 'Excelente',
      nivelColor: 'bg-emerald-100 text-emerald-700'
    },
    {
      id: 3,
      criterio: 'CE3. Diseña la solución planteada utilizando metodologías...',
      materia: 'Programación Entornos Gráficos - Pendiente de evaluación',
      nivel: 'Pendiente',
      nivelColor: 'bg-amber-100 text-amber-700'
    }
  ];

  return (
    <div className="w-full space-y-8 animate-fade-in">
      
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-[#112F5C]">¡Bienvenido, Juan Diego!</h1>
        <p className="text-xs text-gray-500 mt-1">Momento de evaluación actual: 4.º Semestre.</p>
      </div>

      {/* Tarjetas de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Evaluaciones Activas */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#112F5C] flex items-center justify-center text-xl shrink-0">
              <FaClipboardList />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">Evaluaciones activas</p>
              <p className="text-xl font-bold text-[#112F5C] mt-0.5">2 Pendientes</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Tienes evaluaciones por resolver</p>
            </div>
          </div>
          <a href="#evaluaciones" className="text-xs font-bold text-[#112F5C] mt-4 inline-block hover:underline">Ver evaluaciones &rarr;</a>
        </div>

        {/* Proyectos por cargar */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center text-xl shrink-0">
              <FaFolderOpen />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">Proyectos por cargar</p>
              <p className="text-xl font-bold text-[#B3282D] mt-0.5">1 Requerida</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Tienes proyectos por cargar</p>
            </div>
          </div>
          <a href="#proyectos" className="text-xs font-bold text-[#112F5C] mt-4 inline-block hover:underline">Ver proyectos &rarr;</a>
        </div>

        {/* Mi progreso general */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="relative w-12 h-12 rounded-full border-4 border-[#B3282D] border-t-gray-200 flex items-center justify-center font-bold text-xs text-[#112F5C] shrink-0">
              60%
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">Mi progreso general</p>
              <p className="text-sm font-bold text-[#112F5C] mt-1">3 de 5 RAP evaluados</p>
            </div>
          </div>
          <a href="#progreso" className="text-xs font-bold text-[#112F5C] mt-4 inline-block hover:underline">Ver proyectos &rarr;</a>
        </div>
      </div>

      {/* Detalle de Resultados por RAP */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-[#112F5C]">Detalle de Resultados por RAP y Criterios</h2>
        
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Seleccionar RAP:</label>
          <select
            value={rapSeleccionado}
            onChange={(e) => setRapSeleccionado(e.target.value)}
            className="w-full md:w-1/2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#112F5C] focus:outline-none focus:border-[#112F5C] shadow-sm"
          >
            <option value="rap1">RAP 1: Desarrolla sistemas y productos software utilizando herramientas...</option>
            <option value="rap2">RAP 2: Diseña arquitecturas de bases de datos relacionales...</option>
          </select>
        </div>

        {/* Tabla / Lista de Criterios */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="grid grid-cols-12 gap-4 pb-3 border-b border-gray-100 text-xs font-bold text-gray-600">
            <div className="col-span-7">Criterio de Evaluación (CE)</div>
            <div className="col-span-3 text-center">Nivel Alcanzado</div>
            <div className="col-span-2 text-center">Observaciones</div>
          </div>

          <div className="divide-y divide-gray-50">
            {criteriosEvaluacion.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 py-4 items-center text-xs">
                <div className="col-span-7">
                  <p className="font-bold text-[#112F5C]">{item.criterio}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.materia}</p>
                </div>
                <div className="col-span-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.nivelColor}`}>
                    {item.nivel}
                  </span>
                </div>
                <div className="col-span-2 text-center">
                  <button className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors">
                    <FaCommentDots className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}