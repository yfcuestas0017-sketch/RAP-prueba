// Utilidades compartidas del microcurrículo (Syllabus DOC-CU-FR-002).
//
// Mantiene en un único lugar:
//  - los nombres de los campos que esperan el formulario y MicrocurriculoDocumento,
//  - los valores por defecto,
//  - la normalización de las filas que llegan de la base de datos (null/undefined
//    -> cadena vacía, fechas -> "yyyy-mm-dd", selects -> opción válida).
//
// Así se evitan valores `undefined` o campos vacíos inesperados al previsualizar
// y al exportar el documento.

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

export const MODALIDADES = ['Presencial', 'Virtual', 'A Distancia'];
export const NIVELES = ['Técnico', 'Tecnológico', 'Profesional', 'Especialización', 'Maestría', 'Doctorado'];
export const AREAS = ['Básica', 'Disciplinar', 'Investigación'];

// Semestre del programa al que pertenece el espacio académico (1 a 10).
// Se guarda con la palabra ordinal para que coincida con el formato del
// documento y con el campo "Semestre" de la ficha.
export const SEMESTRES = [
  'Primero',
  'Segundo',
  'Tercero',
  'Cuarto',
  'Quinto',
  'Sexto',
  'Séptimo',
  'Octavo',
  'Noveno',
  'Décimo'
];

// Acepta el semestre como palabra ordinal ("Segundo") o como número ("2") y lo
// devuelve siempre como la palabra ordinal válida. Devuelve '' si no es válido.
export const normalizarSemestre = (valor) => {
  const crudo = texto(valor).trim();
  if (!crudo) return '';
  const comoNumero = Number(crudo);
  if (Number.isInteger(comoNumero) && comoNumero >= 1 && comoNumero <= 10) {
    return SEMESTRES[comoNumero - 1];
  }
  const encontrado = SEMESTRES.find((s) => s.toLowerCase() === crudo.toLowerCase());
  return encontrado || '';
};

// Convierte cualquier valor escalar en texto; null/undefined -> ''.
export const texto = (valor) => (valor === null || valor === undefined ? '' : String(valor));

// Fecha de hoy en formato ISO corto (yyyy-mm-dd), que es el que entiende
// `<input type="date">` y el que espera el backend para una columna DATE.
export const hoyISO = () => {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
};

// Normaliza a "yyyy-mm-dd" una fecha que puede llegar como Date, ISO completo
// ("2026-08-06T05:00:00.000Z") o cadena. Devuelve '' si no hay valor.
export const aISODia = (valor) => {
  const cadena = texto(valor).trim();
  if (!cadena) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(cadena);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const fecha = new Date(cadena);
  if (!Number.isNaN(fecha.getTime())) {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }
  return cadena;
};

// Presenta la fecha como "06/AGO/2026". Si el valor ya viene formateado se
// respeta; si no hay valor se usa el respaldo (por defecto, la fecha de hoy).
export const formatearFechaMicrocurriculo = (valor, respaldo = '') => {
  const crudo = texto(valor).trim();
  if (/^\d{2}\/[A-Za-z]{3}\/\d{4}$/.test(crudo)) return crudo.toUpperCase();

  const iso = aISODia(crudo);
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (partes) {
    const mes = Number(partes[2]) - 1;
    if (mes >= 0 && mes < 12) return `${partes[3]}/${MESES[mes]}/${partes[1]}`;
  }
  return crudo || respaldo;
};

// Elige una opción válida para los campos de selección.
const unaDe = (valor, permitidos, porDefecto) => {
  const normalizado = texto(valor).trim();
  return permitidos.includes(normalizado) ? normalizado : porDefecto;
};

// Valores iniciales del formulario. Los nombres coinciden exactamente con los
// que lee MicrocurriculoDocumento.
export const crearFormDataMicrocurriculo = (valoresIniciales = {}) => ({
  id_espacio_academico: '',
  codigo: '',
  version: '1',
  fecha_documento: hoyISO(),
  periodo: '',
  semestre: '',
  modalidad: 'Presencial',
  nivel: 'Profesional',
  area: 'Disciplinar',
  creditos: '',
  horas_acompanamiento_directo: '',
  horas_trabajo_independiente: '',
  prerrequisito: 'Ninguno',
  sintesis: '',
  proposito: '',
  justificacion: '',
  competencia_central: '',
  ...valoresIniciales
});

// Normaliza la fila que devuelve la base de datos para el formulario de edición.
export const normalizarMicrocurriculo = (fila = {}) => {
  const base = crearFormDataMicrocurriculo();
  return {
    ...base,
    // Se conservan los identificadores que usa el guardado.
    id_microcurriculo: fila.id_microcurriculo ?? undefined,
    estado: fila.estado ?? undefined,
    id_espacio_academico:
      fila.id_espacio_academico === null || fila.id_espacio_academico === undefined
        ? ''
        : String(fila.id_espacio_academico),
    codigo: texto(fila.codigo),
    version: texto(fila.version).trim() || base.version,
    fecha_documento: aISODia(fila.fecha_documento) || base.fecha_documento,
    periodo: texto(fila.periodo),
    semestre: normalizarSemestre(fila.semestre),
    modalidad: unaDe(fila.modalidad, MODALIDADES, base.modalidad),
    nivel: unaDe(fila.nivel, NIVELES, base.nivel),
    area: unaDe(fila.area, AREAS, base.area),
    creditos: texto(fila.creditos),
    horas_acompanamiento_directo: texto(fila.horas_acompanamiento_directo),
    horas_trabajo_independiente: texto(fila.horas_trabajo_independiente),
    prerrequisito: texto(fila.prerrequisito),
    sintesis: texto(fila.sintesis),
    proposito: texto(fila.proposito),
    justificacion: texto(fila.justificacion),
    competencia_central: texto(fila.competencia_central)
  };
};
