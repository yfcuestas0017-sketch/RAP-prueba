import React, { useMemo, useState } from 'react';
import {
  FaTimes,
  FaFileExcel,
  FaDownload,
  FaSyncAlt,
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaClipboardList
} from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { postFormData } from '../../../services/api';

const CONFIG = {
  docente: {
    titulo: 'Gestionar Docentes',
    singular: 'docente',
    plural: 'docentes',
    rolId: 5,
    hoja: 'Docentes',
    ejemplo: {
      Id_user_institucional: 1020304,
      Nombre: 'Juan',
      Apellido: 'Pérez',
      Correo: 'juan.perez@unicesmag.edu.co',
      Id_rol: 5,
      Estado: 'Activo'
    },
    etiquetaAsignar: 'Asignar docente a espacio, grupo o materia'
  },
  estudiante: {
    titulo: 'Gestionar Estudiantes',
    singular: 'estudiante',
    plural: 'estudiantes',
    rolId: 6,
    hoja: 'Estudiantes',
    ejemplo: {
      Id_user_institucional: 2020304,
      Nombre: 'María',
      Apellido: 'Gómez',
      Correo: 'maria.gomez@unicesmag.edu.co',
      Id_rol: 6,
      Estado: 'Activo'
    },
    etiquetaAsignar: 'Matricular estudiante en semestre, jornada y materia'
  }
};

const inputClass = 'w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#112F5C]';
const labelClass = 'block text-[11px] font-semibold text-gray-700 mb-1';

export default function GestionUsuariosModal({
  tipo,
  onClose,
  onImportado,
  programas = [],
  semestres = [],
  grupos = [],
  espacios = []
}) {
  const config = CONFIG[tipo] || CONFIG.estudiante;

  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  const [asignacion, setAsignacion] = useState({
    id_programa: '',
    id_semestre: '',
    jornada: '',
    id_espacio_academico: '',
    id_grupo: ''
  });
  const [avisoAsignacion, setAvisoAsignacion] = useState('');

  const semestresDelPrograma = useMemo(() => {
    if (!asignacion.id_programa) return semestres;
    return semestres.filter((s) => String(s.id_programa) === String(asignacion.id_programa));
  }, [semestres, asignacion.id_programa]);

  const jornadas = useMemo(() => {
    const valores = new Set();
    grupos.forEach((grupo) => {
      if (grupo.jornada) valores.add(String(grupo.jornada));
    });
    return Array.from(valores).sort();
  }, [grupos]);

  const gruposDelSemestre = useMemo(() => {
    if (!asignacion.id_semestre) return grupos;
    return grupos.filter((grupo) => String(grupo.id_semestre) === String(asignacion.id_semestre));
  }, [grupos, asignacion.id_semestre]);

  const descargarPlantilla = () => {
    const hoja = XLSX.utils.json_to_sheet([config.ejemplo]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, config.hoja);
    XLSX.writeFile(libro, `plantilla-${config.plural}.xlsx`);
  };

  const handleArchivo = (e) => {
    setArchivo(e.target.files?.[0] || null);
    setResultado(null);
    setError('');
  };

  const handleImportar = async (e) => {
    e.preventDefault();
    if (!archivo) {
      setError('Seleccione un archivo .xlsx o .xls antes de importar.');
      return;
    }
    try {
      setSubiendo(true);
      setError('');
      setResultado(null);
      const formData = new FormData();
      formData.append('archivo', archivo);
      const data = await postFormData('/api/users/usuarios/importar', formData);
      setResultado(data);
      if (onImportado) onImportado();
    } catch (err) {
      console.error('Error importando usuarios:', err);
      setError(err.message || 'No fue posible importar el archivo.');
    } finally {
      setSubiendo(false);
    }
  };

  const handleAsignar = () => {
    setAvisoAsignacion('Interfaz preparada. Pendiente del endpoint de asignación / matrícula en el backend; por ahora no se guarda ningún cambio.');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative animate-fade-in border border-gray-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-600 transition-colors p-1 z-10"
        >
          <FaTimes />
        </button>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2 pr-8">
            <FaClipboardList className="text-[#112F5C] text-lg shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[#112F5C]">{config.titulo}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Agregue o actualice {config.plural} de forma masiva y prepare sus asignaciones.
              </p>
            </div>
          </div>

          <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FaFileExcel className="text-emerald-600" />
              <h4 className="text-xs font-bold text-[#112F5C]">1. Importar desde Excel (.xlsx)</h4>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Si el correo ya existe, el {config.singular} se <strong>actualiza automáticamente</strong>; si no, se crea.
              Columnas requeridas:{' '}
              <span className="font-mono text-[10px] bg-gray-50 border border-gray-100 rounded px-1 py-0.5">
                Id_user_institucional, Nombre, Apellido, Correo, Id_rol, Estado
              </span>.
              Use <span className="font-mono">Id_rol = {config.rolId}</span> para {config.plural}.
            </p>

            <button
              type="button"
              onClick={descargarPlantilla}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-[#112F5C] text-[11px] font-bold px-3 py-2 rounded-xl transition"
            >
              <FaDownload /> Descargar plantilla
            </button>

            <form onSubmit={handleImportar} className="flex flex-col sm:flex-row gap-2">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleArchivo}
                className="flex-1 text-[11px] text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-gray-100 file:text-[#112F5C] hover:file:bg-gray-200 file:cursor-pointer cursor-pointer border border-gray-200 rounded-xl bg-white"
              />
              <button
                type="submit"
                disabled={subiendo}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-[11px] font-bold px-5 py-2 rounded-xl transition shadow flex items-center justify-center gap-2 shrink-0"
              >
                {subiendo ? (
                  <>
                    <FaSyncAlt className="animate-spin" /> Importando...
                  </>
                ) : (
                  <>
                    <FaFileExcel /> Importar
                  </>
                )}
              </button>
            </form>

            {error && (
              <p className="text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-start gap-2">
                <FaExclamationCircle className="mt-0.5 shrink-0" /> {error}
              </p>
            )}

            {resultado && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-2">
                <p className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <FaCheckCircle /> {resultado.mensaje || 'Importación completada.'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white rounded-lg border border-emerald-100 py-2">
                    <p className="text-sm font-bold text-[#112F5C]">{resultado.procesados ?? 0}</p>
                    <p className="text-[10px] text-gray-500">Procesados</p>
                  </div>
                  <div className="bg-white rounded-lg border border-emerald-100 py-2">
                    <p className="text-sm font-bold text-emerald-600">{resultado.nuevos ?? 0}</p>
                    <p className="text-[10px] text-gray-500">Nuevos</p>
                  </div>
                  <div className="bg-white rounded-lg border border-emerald-100 py-2">
                    <p className="text-sm font-bold text-sky-600">{resultado.actualizados ?? 0}</p>
                    <p className="text-[10px] text-gray-500">Actualizados</p>
                  </div>
                  <div className="bg-white rounded-lg border border-emerald-100 py-2">
                    <p className="text-sm font-bold text-[#B3282D]">{resultado.errores ?? 0}</p>
                    <p className="text-[10px] text-gray-500">Errores</p>
                  </div>
                </div>
                {Array.isArray(resultado.erroresDetalle) && resultado.erroresDetalle.length > 0 && (
                  <div className="bg-white rounded-lg border border-emerald-100 p-2 max-h-32 overflow-y-auto">
                    <p className="text-[10px] font-bold text-[#B3282D] mb-1">Detalle de errores:</p>
                    <ul className="list-disc ml-4 text-[10px] text-gray-600 space-y-0.5">
                      {resultado.erroresDetalle.map((detalle, idx) => (
                        <li key={idx}>{detalle}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border border-dashed border-gray-300 rounded-2xl p-4 space-y-3 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <FaInfoCircle className="text-amber-500" />
              <h4 className="text-xs font-bold text-[#112F5C]">2. {config.etiquetaAsignar}</h4>
            </div>
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Interfaz preparada. Aún no guarda cambios: el backend todavía no expone el endpoint
              de asignación / matrícula en grupos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Programa Académico:</label>
                <select
                  value={asignacion.id_programa}
                  onChange={(e) => setAsignacion((actual) => ({ ...actual, id_programa: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Seleccione un programa</option>
                  {programas.map((programa) => (
                    <option key={programa.id_programa} value={programa.id_programa}>{programa.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Semestre:</label>
                <select
                  value={asignacion.id_semestre}
                  onChange={(e) => setAsignacion((actual) => ({ ...actual, id_semestre: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Seleccione un semestre</option>
                  {semestresDelPrograma.map((semestre) => (
                    <option key={semestre.id_semestre} value={semestre.id_semestre}>
                      {semestre.nombre || `${semestre.numero}.º Semestre`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Jornada:</label>
                <select
                  value={asignacion.jornada}
                  onChange={(e) => setAsignacion((actual) => ({ ...actual, jornada: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Seleccione una jornada</option>
                  {jornadas.map((jornada) => (
                    <option key={jornada} value={jornada}>{jornada}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Materia / Espacio Académico:</label>
                <select
                  value={asignacion.id_espacio_academico}
                  onChange={(e) => setAsignacion((actual) => ({ ...actual, id_espacio_academico: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Seleccione una materia</option>
                  {espacios.map((espacio) => (
                    <option key={espacio.id_espacio_academico} value={espacio.id_espacio_academico}>{espacio.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Grupo:</label>
                <select
                  value={asignacion.id_grupo}
                  onChange={(e) => setAsignacion((actual) => ({ ...actual, id_grupo: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">Seleccione un grupo</option>
                  {gruposDelSemestre.map((grupo) => (
                    <option key={grupo.id_grupo} value={grupo.id_grupo}>
                      {grupo.nombre}{grupo.jornada ? ` · ${grupo.jornada}` : ''}{grupo.periodo ? ` · ${grupo.periodo}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {avisoAsignacion && (
              <p className="text-[11px] text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2">
                {avisoAsignacion}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAsignar}
                className="bg-white border border-gray-300 text-gray-500 hover:text-[#112F5C] hover:border-[#112F5C] text-[11px] font-bold px-5 py-2 rounded-xl transition"
              >
                Guardar (próximamente)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
