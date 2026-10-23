// Clasificación compartida de proyectos, usada por el panel del docente,
// los reportes, las vistas de proyectos y el CRUD del administrador.
//
// Un proyecto se considera "modalidad de grado" cuando el estudiante marcó
// especialización o cuando el tipo de proyecto menciona grado, tesis o
// coterminalidad. Todo lo demás se clasifica como proyecto interestructurante.

export const TIPOS_INTERESTRUCTURANTE = [
  'Proyecto Integrador',
  'Proyecto de Aula',
  'Proyecto de Investigación'
];

export const TIPOS_MODALIDAD_GRADO = [
  'Trabajo de Grado',
  'Tesis',
  'Coterminalidad'
];

export const CATEGORIAS_PROYECTO = {
  interestructurante: {
    titulo: 'Proyectos Interestructurantes',
    descripcion: 'Gestión de proyectos interestructurantes registrados por los estudiantes.',
    vacio: 'No hay proyectos interestructurantes registrados.',
    tipos: TIPOS_INTERESTRUCTURANTE
  },
  modalidad: {
    titulo: 'Proyectos de Modalidad de Grado',
    descripcion: 'Gestión de trabajos de grado, tesis y coterminalidad registrados por los estudiantes.',
    vacio: 'No hay proyectos de modalidad de grado registrados.',
    tipos: TIPOS_MODALIDAD_GRADO
  }
};

export function esProyectoGrado(proyecto) {
  return (
    proyecto?.especializacion === true ||
    /grado|tesis|coterminalidad/i.test(proyecto?.tipo_proyecto || '')
  );
}

export function esModalidadGrado(proyecto) {
  return esProyectoGrado(proyecto);
}

export function esDeCategoria(proyecto, categoria) {
  const esGrado = esModalidadGrado(proyecto);
  return categoria === 'modalidad' ? esGrado : !esGrado;
}

export function tiposDeCategoria(categoria) {
  return CATEGORIAS_PROYECTO[categoria]?.tipos || TIPOS_INTERESTRUCTURANTE;
}

// Fuerza la regla de negocio del formulario: los proyectos de modalidad de
// grado siempre se guardan con especializacion = true y los interestructurantes
// con especializacion = false.
export function datosParaGuardar(formulario, categoria) {
  const esModalidad = categoria === 'modalidad';
  return {
    nombre: (formulario.nombre || '').trim(),
    informacion: (formulario.informacion || '').trim(),
    id_user: formulario.id_user ? Number(formulario.id_user) : null,
    tipo_proyecto: (formulario.tipo_proyecto || '').trim() || null,
    especializacion: esModalidad
  };
}

export function fechaCorta(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function textoBusquedaProyecto(proyecto) {
  return [
    proyecto?.nombre,
    proyecto?.tipo_proyecto,
    proyecto?.estudiante_nombre,
    proyecto?.estudiante_apellido,
    proyecto?.grupo,
    proyecto?.codigo_grupo
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
