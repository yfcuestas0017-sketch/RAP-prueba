import React from 'react';
import logoCesmag from '../../assets/logo_unicesmag.png?inline';

// Paleta institucional. Se usan valores hex (en lugar de la paleta por defecto
// de Tailwind) para que el color viaje bien tanto al PDF como al .docx.
export const AZUL = '#112F5C';
export const AZUL_SUAVE = '#E8EDF5';
export const ROJO = '#B3282D';
export const GRIS_FILA = '#F1F5F9';
export const GRIS_BORDE = '#CBD5E1';

// Estilos reutilizables de tablas y bloques.
export const TABLA = 'w-full border-collapse border border-black text-[9px] leading-snug';
export const TABLA_LINEAS = 'w-full border-collapse text-[9px] leading-snug';
export const CELDA = 'border border-black px-2 py-1 align-top';
export const CELDA_ETIQUETA = 'border border-black bg-[#E8EDF5] px-2 py-1 align-top font-bold text-[#112F5C]';
export const CELDA_ENCABEZADO =
  'border border-black bg-[#112F5C] px-2 py-1 text-center text-[8.5px] font-bold uppercase tracking-wide text-white';
export const TITULO_SECCION =
  'border border-black bg-[#112F5C] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white';
export const CUERPO_SECCION =
  'border-x border-b border-black px-3 py-2 text-justify text-[9px] leading-relaxed';

// Encabezado institucional común a todos los documentos: franja superior,
// logotipo, título del formato y bloque de control documental.
export function EncabezadoDocumento({
  titulo,
  subtitulo,
  codigo,
  version,
  fecha,
  pagina,
  totalPaginas
}) {
  return (
    <table className="w-full border-collapse border border-black text-[9px]">
      <tbody>
        <tr>
          <td colSpan={3} className="h-[5px] bg-[#112F5C] p-0 leading-none" />
        </tr>
        <tr>
          <td className="w-[21%] border border-black px-2 py-2 text-center align-middle">
            <img
              src={logoCesmag}
              alt="Universidad CESMAG"
              className="mx-auto h-[56px] w-[56px] object-contain"
            />
            <div className="mt-1 text-[8px] font-bold uppercase leading-tight text-[#112F5C]">
              Universidad CESMAG
            </div>
            <div className="text-[7.5px] leading-tight text-gray-600">NIT: 800.109.387-7</div>
          </td>
          <td className="w-[52%] border border-black px-3 py-2 text-center align-middle">
            <div className="text-[14px] font-bold uppercase leading-tight tracking-wide text-[#112F5C]">
              {titulo}
            </div>
            {subtitulo ? (
              <div className="mt-1 text-[8.5px] uppercase tracking-[0.25em] text-gray-500">
                {subtitulo}
              </div>
            ) : null}
          </td>
          <td className="w-[27%] border border-black px-2 py-1.5 align-middle text-[8px] leading-tight">
            <div>
              <b>CÓDIGO:</b> {codigo}
            </div>
            <div>
              <b>VERSIÓN:</b> {version}
            </div>
            <div>
              <b>FECHA:</b> {fecha}
            </div>
            {pagina ? (
              <div>
                <b>PÁGINA:</b> {pagina} de {totalPaginas}
              </div>
            ) : null}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// Barra de título de sección (fondo azul institucional).
export function TituloSeccion({ children, className = '' }) {
  return <h2 className={`${TITULO_SECCION} ${className}`}>{children}</h2>;
}

// Sección completa: barra de título + cuerpo con borde.
export function SeccionDocumento({ titulo, children, className = '' }) {
  const vacio = children === null || children === undefined || children === '';
  return (
    <section className={`mt-2 ${className}`}>
      <h2 className={TITULO_SECCION}>{titulo}</h2>
      {!vacio && <div className={CUERPO_SECCION}>{children}</div>}
    </section>
  );
}

// Pie de página del documento (se pega al fondo de la página).
export function PieDocumento({ codigo, pagina, totalPaginas }) {
  return (
    <div className="mt-auto flex items-center justify-between border-t border-[#112F5C] pt-1 text-[7.5px] text-gray-600">
      <span className="font-bold uppercase tracking-wide text-[#112F5C]">Documento institucional</span>
      <span>{codigo}</span>
      <span>
        Página {pagina} de {totalPaginas}
      </span>
    </div>
  );
}
