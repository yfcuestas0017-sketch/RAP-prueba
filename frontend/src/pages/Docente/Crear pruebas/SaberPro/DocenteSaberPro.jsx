import React, { useEffect, useState } from 'react';
import { FaBook, FaClipboardList, FaExclamationTriangle, FaHistory, FaSyncAlt } from 'react-icons/fa';
import { SubApartadosPruebas } from '../../../shared/ApartadosPruebas.jsx';
import { obtenerPermisoSaberPro, esModuloPendiente } from '../../../../services/saberProService';
import { obtenerGruposDocente } from '../../../../services/docenteGruposService';
import SaberProCrear from './SaberProCrear.jsx';
import SaberProHistorial from './SaberProHistorial.jsx';

const SUBAPARTADOS = [
  { id: 'crear', etiqueta: 'Crear pruebas', icono: <FaClipboardList /> },
  { id: 'historial', etiqueta: 'Historial de evaluaciones', icono: <FaHistory /> }
];

// Apartado "Pruebas Saber Pro" dentro de Crear Pruebas (docente).
// - Crear pruebas: el administrador debe otorgar el permiso; sin él se niega el
//   acceso a crear, editar, publicar y eliminar pruebas en los grupos asignados.
// - Historial: los resultados solo se ven cuando el docente ya aplicó la prueba.
export default function DocenteSaberPro() {
  const [subapartado, setSubapartado] = useState('crear');
  const [permiso, setPermiso] = useState(null); // null = consultando
  const [grupos, setGrupos] = useState([]);
  const [errorPermiso, setErrorPermiso] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      try {
        const [permisoSaberPro, misGrupos] = await Promise.all([
          obtenerPermisoSaberPro(),
          obtenerGruposDocente().catch(() => [])
        ]);
        if (!activo) return;
        setPermiso(permisoSaberPro);
        setGrupos(Array.isArray(misGrupos) ? misGrupos : []);
      } catch (error) {
        if (!activo) return;
        setPermiso({ permitido: false, puedePublicar: false });
        setErrorPermiso(!esModuloPendiente(error));
      }
    };

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <div className="flex items-start gap-3">
          <FaBook className="text-2xl text-[#B3282D] mt-0.5 shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-[#112F5C]">Pruebas Saber Pro y simulacros</h2>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed max-w-3xl">
              Redacte reactivos con ayuda del asistente, revíselos y publíquelos como simulacro o prueba Saber Pro en
              sus grupos asignados. La creación y publicación requieren la autorización del administrador.
            </p>
          </div>
        </div>

        <SubApartadosPruebas
          activo={subapartado}
          onCambiar={setSubapartado}
          apartados={SUBAPARTADOS}
          etiqueta="Secciones de Saber Pro"
        />

        {permiso === null ? (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <FaSyncAlt className="text-gray-400 animate-spin" />
            <p className="text-xs text-gray-600">Verificando el permiso de Saber Pro...</p>
          </div>
        ) : subapartado === 'crear' ? (
          <SaberProCrear permiso={permiso} grupos={grupos} errorPermiso={errorPermiso} />
        ) : (
          <SaberProHistorial />
        )}
      </div>

      {permiso !== null && !permiso.permitido && subapartado === 'historial' && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
          <FaExclamationTriangle className="text-blue-600 text-base mt-0.5 shrink-0" />
          <p className="text-xs text-blue-900 leading-relaxed">
            En el historial verá únicamente los resultados de las pruebas que usted haya aplicado. Las pruebas que aún
            no ha realizado aparecerán bloqueadas.
          </p>
        </div>
      )}
    </div>
  );
}
