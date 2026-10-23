import React from 'react';
import ReportesGlobal from '../../shared/reportes_global.jsx';

// Reutiliza la vista de reportes existente; el rol docente selecciona
// automáticamente sus endpoints y filtros a partir de la ruta.
export default function DocenteReportes() {
  return <ReportesGlobal />;
}
