import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  obtenerReportesAdmin,
  obtenerFiltrosReportesAdmin,
  descargarReporteAdmin,
  obtenerReportesDocente,
  obtenerFiltrosReportesDocente,
  descargarReporteDocente,
  obtenerReportesEstudiante,
  obtenerFiltrosReportesEstudiante,
  descargarReporteEstudiante
} from '../../services/reportesService';
import './reportes_global.css';

const COLORES = {
  excelente: '#42bc62',
  bueno: '#2196df',
  regular: '#ffd324',
  ineficiente: '#f84141'
};

function rolDesdeRuta(pathname) {
  if (pathname.startsWith('/docente')) return 'docente';
  if (pathname.startsWith('/estudiante')) return 'estudiante';
  return 'admin';
}

function nivelDesdePorcentaje(porcentaje) {
  const valor = Number(porcentaje || 0);
  if (valor >= 80) return 'Excelente';
  if (valor >= 70) return 'Bueno';
  if (valor >= 60) return 'Regular';
  return 'Ineficiente';
}

function esPendiente(nivel) {
  const n = String(nivel || '').toLowerCase();
  return n.includes('pendiente') || n.includes('sin resultados') || n.includes('sin calificar');
}

function claseNivel(nivel) {
  const nombre = String(nivel || '').toLowerCase();
  if (esPendiente(nombre)) return 'pending';
  if (nombre.includes('excelente')) return 'excellent';
  if (nombre.includes('bueno')) return 'good';
  if (nombre.includes('regular')) return 'regular';
  return 'poor';
}

function colorBarra(porcentaje) {
  const valor = Number(porcentaje || 0);
  if (valor >= 80) return '#009b51';
  if (valor >= 60) return '#123c61';
  return '#b90805';
}

function donutGradient(niveles) {
  const e = Number(niveles.excelente || 0);
  const b = Number(niveles.bueno || 0);
  const r = Number(niveles.regular || 0);
  return `conic-gradient(${COLORES.excelente} 0 ${e}%, ${COLORES.bueno} ${e}% ${
    e + b
  }%, ${COLORES.regular} ${e + b}% ${e + b + r}%, ${COLORES.ineficiente} ${
    e + b + r
  }% 100%)`;
}

function levelsGradient(niveles) {
  const total =
    Number(niveles.excelentes || 0) +
    Number(niveles.buenos || 0) +
    Number(niveles.regulares || 0) +
    Number(niveles.ineficientes || 0) || 1;
  const e = (Number(niveles.excelentes || 0) / total) * 100;
  const b = (Number(niveles.buenos || 0) / total) * 100;
  const r = (Number(niveles.regulares || 0) / total) * 100;
  return `linear-gradient(to right, #117b45 0 ${e}%, #50a5e6 ${e}% ${
    e + b
  }%, #fed124 ${e + b}% ${e + b + r}%, #d52a28 ${e + b + r}% 100%)`;
}

function promedio(valores) {
  const lista = valores.filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)));
  if (lista.length === 0) return 0;
  const suma = lista.reduce((acc, v) => acc + Number(v), 0);
  return Number((suma / lista.length).toFixed(2));
}

// Etiqueta única de componente: como varios comparten nombre (clave nula) y se
// distinguen solo por su momento de evaluación, se añade el momento al final.
function etiquetaComponente(c) {
  const base = c.clave ? `${c.clave} · ${c.nombre}` : c.nombre;
  return c.momento ? `${base} — ${c.momento}` : base;
}

function Performance({ exitoGlobal, niveles }) {
  const leyenda = [
    ['excellent', 'Excelente', niveles.excelente],
    ['good', 'Bueno', niveles.bueno],
    ['regular', 'Regular', niveles.regular],
    ['poor', 'Ineficiente', niveles.ineficiente]
  ];
  return (
    <article className="report-card">
      <h2>Cumplimiento Institucional del RAP</h2>
      <p>Distribución porcentual por Niveles de Desempeño</p>
      <div className="report-performance">
        <div className="report-donut" style={{ background: donutGradient(niveles) }}>
          <strong>{Math.round(Number(exitoGlobal || 0))}%</strong>
          <span>Éxito Global</span>
        </div>
        <div className="report-legend">
          {leyenda.map(([clase, etiqueta, valor]) => (
            <span className={clase} key={etiqueta}>
              ● {etiqueta}
              <br />
              &nbsp;&nbsp;{Number(valor || 0).toFixed(0)}%
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function Bars({ barras }) {
  if (!barras.length) {
    return (
      <article className="report-card">
        <h2>Rendimiento por Semestre</h2>
        <p>Sin datos suficientes para comparar.</p>
      </article>
    );
  }
  return (
    <article className="report-card">
      <h2>Rendimiento por Semestre</h2>
      <p>Comparativa del nivel alcanzado en los hitos del plan de estudios</p>
      <div className="report-bars">
        {barras.map((barra) => (
          <div
            className="report-bar"
            key={barra.label}
            style={{ '--height': `${Math.max(4, Math.min(100, barra.valor))}%`, '--bar-color': barra.color }}
          >
            <b>{Math.round(barra.valor)}%</b>
            <span>{barra.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function SelectFiltro({ etiqueta, valor, opciones, onChange }) {
  return (
    <select
      className="report-select"
      aria-label={etiqueta}
      value={valor || ''}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{etiqueta}</option>
      {opciones.map((op) => (
        <option key={op.valor} value={op.valor}>
          {op.etiqueta}
        </option>
      ))}
    </select>
  );
}

export default function ReportesGlobal() {
  const location = useLocation();
  const rol = rolDesdeRuta(location.pathname);
  const esDocente = rol === 'docente';
  const esEstudiante = rol === 'estudiante';

  const [filtros, setFiltros] = useState({});
  const [opciones, setOpciones] = useState({ programas: [], semestres: [], jornadas: [], periodos: [], componentes: [] });
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [exportando, setExportando] = useState('');
  const [mensaje, setMensaje] = useState('');

  const titulo = esEstudiante
    ? 'Mis Resultados y Evidencias'
    : esDocente
    ? 'Reportes de Evaluaciones y Proyectos por grupo'
    : 'Reportes Consolidados y Exportación Masiva';

  const descripcion = esEstudiante
    ? 'Consulte el historial de sus Niveles de Desempeño y el estado de revisión de sus evaluaciones.'
    : esDocente
    ? 'Seleccione su clase para visualizar el resumen de rúbricas y los Niveles de Desempeño.'
    : 'Filtre por programa, cohorte, período y genere reportes institucionales globales.';

  // Opciones de filtro (solo admin y docente tienen endpoint de filtros).
  useEffect(() => {
    let activo = true;
    async function cargarOpciones() {
      try {
        if (rol === 'admin') {
          const res = await obtenerFiltrosReportesAdmin();
          if (!activo) return;
          const d = res?.data || {};
          const programas = (d.programas || []).map((p) => ({ valor: p.id_programa, etiqueta: p.nombre }));
          const semestres = [...new Set((d.semestres || []).map((s) => Number(s.numero)))]
            .sort((a, b) => a - b)
            .map((n) => ({ valor: n, etiqueta: `${n}.º Semestre` }));
          const jornadas = [...new Set((d.grupos || []).map((g) => g.jornada).filter(Boolean))].map((j) => ({
            valor: j,
            etiqueta: j
          }));
          const periodos = [...new Set((d.grupos || []).map((g) => g.periodo).filter(Boolean))].map((p) => ({
            valor: p,
            etiqueta: p
          }));
          const componentes = (d.componentes || []).map((c) => ({
            valor: c.id_componentes,
            etiqueta: etiquetaComponente(c)
          }));
          setOpciones({ programas, semestres, jornadas, periodos, componentes });
        } else if (rol === 'docente') {
          const res = await obtenerFiltrosReportesDocente();
          if (!activo) return;
          const d = res?.data || {};
          const semestres = (d.semestres || []).map((n) => ({ valor: n, etiqueta: `${n}.º Semestre` }));
          const periodos = (d.periodos || []).map((p) => ({ valor: p, etiqueta: p }));
          const componentes = (d.componentes || []).map((c) => ({
            valor: c.id_componentes,
            etiqueta: etiquetaComponente(c)
          }));
          setOpciones({ programas: [], semestres, jornadas: [], periodos, componentes });
        } else {
          const res = await obtenerFiltrosReportesEstudiante();
          if (!activo) return;
          const d = res?.data || {};
          const semestres = (d.semestres || []).map((n) => ({ valor: n, etiqueta: `${n}.º Semestre` }));
          const componentes = (d.componentes || []).map((c) => ({
            valor: c.id_componentes,
            etiqueta: etiquetaComponente(c)
          }));
          setOpciones({ programas: [], semestres, jornadas: [], periodos: [], componentes });
        }
      } catch (err) {
        console.error('Error cargando filtros:', err);
      }
    }
    cargarOpciones();
    return () => {
      activo = false;
    };
  }, [rol]);

  // Datos del reporte según rol y filtros.
  useEffect(() => {
    let activo = true;
    async function cargarDatos() {
      setCargando(true);
      setError('');
      try {
        const filtrosEnvio = { ...filtros };
        if (filtrosEnvio.componente === 'todos') delete filtrosEnvio.componente;
        let res;
        if (rol === 'admin') res = await obtenerReportesAdmin(filtrosEnvio);
        else if (rol === 'docente') res = await obtenerReportesDocente(filtrosEnvio);
        else res = await obtenerReportesEstudiante(filtrosEnvio);
        if (!activo) return;
        setDatos(res?.data ?? null);
      } catch (err) {
        if (!activo) return;
        setError(err.message || 'No fue posible cargar los reportes.');
        setDatos(null);
      } finally {
        if (activo) setCargando(false);
      }
    }
    cargarDatos();
    return () => {
      activo = false;
    };
  }, [rol, filtros]);

  // El estudiante ahora carga sus opciones (semestres y componentes) desde su
  // endpoint de filtros, igual que admin y docente.

  function actualizarFiltro(clave, valor) {
    setFiltros((prev) => {
      const next = { ...prev };
      if (valor) next[clave] = valor;
      else delete next[clave];
      return next;
    });
  }

  async function exportar(formato) {
    setExportando(formato);
    setMensaje('');
    const filtrosEnvio = { ...filtros };
    if (filtrosEnvio.componente === 'todos') delete filtrosEnvio.componente;
    try {
      if (rol === 'admin') await descargarReporteAdmin(formato, filtrosEnvio);
      else if (rol === 'docente') await descargarReporteDocente(formato, filtrosEnvio);
      else await descargarReporteEstudiante(formato, filtrosEnvio);
    } catch (err) {
      setMensaje(err.message || 'No fue posible exportar el reporte.');
    } finally {
      setExportando('');
    }
  }

  const vista = useMemo(() => construirVista(rol, datos, busqueda), [rol, datos, busqueda]);

  // La tabla de cada rol solo se genera tras elegir un componente.
  const bloquearTabla = !filtros.componente;

  // "Todos" desbloquea la vista y genera el reporte completo (sin filtro de componente).
  const componentesOpciones = [{ valor: 'todos', etiqueta: 'Todos' }, ...opciones.componentes];

  const filtrosVisibles = esEstudiante
    ? [
        { clave: 'componente', etiqueta: 'Componente:', opciones: componentesOpciones },
        { clave: 'semestre', etiqueta: 'Filtro por Semestre:', opciones: opciones.semestres }
      ]
    : esDocente
    ? [
        { clave: 'componente', etiqueta: 'Componente:', opciones: componentesOpciones },
        { clave: 'semestre', etiqueta: 'Semestre:', opciones: opciones.semestres },
        { clave: 'periodo', etiqueta: 'Periodo Académico:', opciones: opciones.periodos }
      ]
    : [
        { clave: 'componente', etiqueta: 'Componente:', opciones: componentesOpciones },
        { clave: 'programa', etiqueta: 'Programa:', opciones: opciones.programas },
        { clave: 'semestre', etiqueta: 'Semestre:', opciones: opciones.semestres },
        { clave: 'jornada', etiqueta: 'Jornada:', opciones: opciones.jornadas },
        { clave: 'periodo', etiqueta: 'Periodo Académico:', opciones: opciones.periodos }
      ];

  return (
    <section className="reports-page">
      <h1 className="reports-title">{titulo}</h1>
      <p className="reports-description">{descripcion}</p>

      {mensaje && <p className="reports-description" style={{ color: '#b90805' }}>{mensaje}</p>}

      {esEstudiante && !bloquearTabla && vista.progreso !== null && (
        <div className="report-card" style={{ minHeight: 0, marginBottom: 25 }}>
          <h2>Progreso General del Plan de Estudios</h2>
          <p>Cumplimiento acumulado de Resultados de Aprendizaje en la carrera.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ height: 11, background: '#e8eff3', borderRadius: 8, flex: 1 }}>
              <div
                style={{ height: '100%', width: `${vista.progreso}%`, background: '#19734b', borderRadius: 8 }}
              />
            </div>
            <b className="excellent" style={{ background: 'none' }}>
              {Math.round(vista.progreso)}% Completado
            </b>
          </div>
        </div>
      )}

      <div className="report-filters">
        {filtrosVisibles.map((f) => (
          <SelectFiltro
            key={f.clave}
            etiqueta={f.etiqueta}
            valor={filtros[f.clave]}
            opciones={f.opciones}
            onChange={(v) => actualizarFiltro(f.clave, v)}
          />
        ))}
      </div>

      {cargando && <p className="reports-description">Cargando reportes…</p>}

      {!cargando && error && (
        <p className="reports-description" style={{ color: '#b90805' }}>
          {error}
        </p>
      )}

      {!cargando && !error && rol !== 'estudiante' && !bloquearTabla && (
        <div className="report-dashboard">
          <Performance exitoGlobal={vista.exitoGlobal} niveles={vista.niveles} />
          <Bars barras={vista.barras} />
        </div>
      )}

      <div className="report-table-section">
        <h2>
          {esEstudiante
            ? 'Historial de Evaluaciones y Calificaciones'
            : esDocente
            ? 'Resumen de Evaluaciones por Grupo'
            : 'Resumen Consolidado por Espacio Académico'}
        </h2>
        <p>
          {esEstudiante
            ? 'Consulta personal del Nivel de Desempeño, porcentaje alcanzado y docente responsable.'
            : 'Monitoreo detallado del porcentaje de éxito y distribución del nivel alcanzado.'}
        </p>

        <div className="report-table-toolbar">
          <input
            className="report-search"
            placeholder="Buscar…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <div className="report-toolbar-actions">
            <button className="report-button" disabled={!!exportando || bloquearTabla} onClick={() => exportar('excel')}>
              {exportando === 'excel' ? 'Exportando…' : 'Exportar Excel'}
            </button>
            <button className="report-button pdf" disabled={!!exportando || bloquearTabla} onClick={() => exportar('pdf')}>
              {exportando === 'pdf' ? 'Generando…' : 'Descargar PDF'}
            </button>
          </div>
        </div>

        {bloquearTabla ? (
          <p className="reports-description">Seleccione un componente (o «Todos») para generar el reporte.</p>
        ) : cargando ? (
          <p className="reports-description">Cargando tabla…</p>
        ) : error ? null : vista.filas.length === 0 ? (
          <p className="reports-description">No se encontraron resultados con los filtros seleccionados.</p>
        ) : (
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  {vista.columnas.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{vista.filas}</tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

// Construye columnas, filas (JSX) y datos de dashboard según el rol.
function construirVista(rol, datos, busqueda) {
  const texto = String(busqueda || '').toLowerCase();

  if (rol === 'admin') {
    const d = datos || {};
    const estadisticas = d.estadisticas || {};
    const niveles = d.niveles || { excelente: 0, bueno: 0, regular: 0, ineficiente: 0 };
    const espacios = d.espacios || [];
    const semestres = d.semestres || [];

    const filtrados = espacios.filter(
      (e) =>
        !texto ||
        `${e.espacioAcademico} ${e.docente} ${e.grupo}`.toLowerCase().includes(texto)
    );

    const barras = semestres.map((s) => ({
      label: `${s.semestre}.º Sem`,
      valor: Number(s.porcentaje || 0),
      color: colorBarra(s.porcentaje)
    }));

    const filas = filtrados.map((e) => (
      <tr key={`${e.idEspacioAcademico}-${e.grupo}-${e.periodo}`}>
        <td>
          <strong>{e.espacioAcademico}</strong>
          <small>
            {e.grupo} · {e.jornada}
          </small>
        </td>
        <td>{e.docente}</td>
        <td>
          <strong>{e.semestre}.º Semestre</strong>
          <small>{e.periodo}</small>
        </td>
        <td>
          {e.evaluados} / {e.estudiantes}
          <small
            className={esPendiente(e.nivel) ? '' : 'excellent'}
            style={{ background: 'none' }}
          >
            {Math.round(Number(e.cobertura || 0))}% Cobertura
          </small>
        </td>
        <td>
          {esPendiente(e.nivel) ? (
            <div className="report-levels pending" />
          ) : (
            <div className="report-levels" style={{ background: levelsGradient(e.niveles || {}) }} />
          )}
        </td>
        <td>
          <span className={`report-status ${claseNivel(e.nivel)}`}>{e.nivel}</span>
        </td>
      </tr>
    ));

    return {
      columnas: [
        'Espacio Académico',
        'Docente a Cargo',
        'Semestre / Periodo',
        'Evaluados',
        'Distribución de Niveles',
        'Estado Global'
      ],
      filas,
      barras,
      exitoGlobal: estadisticas.exitoGlobal || 0,
      niveles,
      progreso: null
    };
  }

  if (rol === 'docente') {
    const filas0 = Array.isArray(datos) ? datos : [];
    const evaluadas = filas0.filter((r) => Number(r.estudiantes_evaluados || 0) > 0);
    const exitoGlobal = promedio(evaluadas.map((r) => r.porcentaje_promedio));

    const bandas = { excelente: 0, bueno: 0, regular: 0, ineficiente: 0 };
    evaluadas.forEach((r) => {
      const nivel = nivelDesdePorcentaje(r.porcentaje_promedio).toLowerCase();
      bandas[nivel] += 1;
    });
    const totalBandas = evaluadas.length || 1;
    const niveles = {
      excelente: (bandas.excelente / totalBandas) * 100,
      bueno: (bandas.bueno / totalBandas) * 100,
      regular: (bandas.regular / totalBandas) * 100,
      ineficiente: (bandas.ineficiente / totalBandas) * 100
    };

    const porSemestre = {};
    evaluadas.forEach((r) => {
      const clave = Number(r.semestre);
      if (!porSemestre[clave]) porSemestre[clave] = [];
      porSemestre[clave].push(r.porcentaje_promedio);
    });
    const barras = Object.keys(porSemestre)
      .sort((a, b) => a - b)
      .map((clave) => ({
        label: `${clave}.º Sem`,
        valor: promedio(porSemestre[clave]),
        color: colorBarra(promedio(porSemestre[clave]))
      }));

    const filtradas = filas0.filter(
      (r) => !texto || `${r.evaluacion} ${r.grupo} ${r.jornada}`.toLowerCase().includes(texto)
    );

    const filas = filtradas.map((r) => (
      <tr key={r.id_evaluacion}>
        <td>
          <strong>{r.evaluacion}</strong>
          <small>
            {r.grupo} · {r.jornada}
          </small>
        </td>
        <td>{r.periodo}</td>
        <td>{r.semestre}.º Semestre</td>
        <td>
          {r.estudiantes_evaluados} / {r.estudiantes_grupo}
        </td>
        <td>
          {Number(r.estudiantes_evaluados || 0) === 0 ? (
            <span className="report-status pending">Pendiente · 0%</span>
          ) : (
            <span className={`report-status ${claseNivel(nivelDesdePorcentaje(r.porcentaje_promedio))}`}>
              {Number(r.porcentaje_promedio || 0).toFixed(1)}%
            </span>
          )}
        </td>
      </tr>
    ));

    return {
      columnas: ['Evaluación / Grupo', 'Periodo', 'Semestre', 'Evaluados', 'Promedio'],
      filas,
      barras,
      exitoGlobal,
      niveles,
      progreso: null
    };
  }

  // Estudiante
  const filas0 = Array.isArray(datos) ? datos : [];
  const progreso = filas0.length ? promedio(filas0.map((r) => r.porcentaje)) : null;

  const filtradas = filas0.filter(
    (r) => !texto || `${r.evaluacion} ${r.docente} ${r.grupo}`.toLowerCase().includes(texto)
  );

  const filas = filtradas.map((r, i) => (
    <tr key={`${r.id_evaluacion}-${i}`}>
      <td>
        <strong>{r.evaluacion}</strong>
        <small>{r.grupo}</small>
      </td>
      <td>{r.docente}</td>
      <td>{r.semestre}.º Semestre</td>
      <td>
        <span className={`report-status ${claseNivel(r.nivel_desempeno)}`}>{r.nivel_desempeno}</span>
      </td>
      <td>{Number(r.porcentaje || 0).toFixed(1)}%</td>
    </tr>
  ));

  return {
    columnas: ['Evaluación / Grupo', 'Docente', 'Semestre', 'Nivel de Desempeño', 'Porcentaje'],
    filas,
    barras: [],
    exitoGlobal: progreso || 0,
    niveles: { excelente: 0, bueno: 0, regular: 0, ineficiente: 0 },
    progreso
  };
}
