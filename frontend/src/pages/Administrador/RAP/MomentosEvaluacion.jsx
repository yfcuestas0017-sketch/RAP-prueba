import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listarMomentosEvaluacion } from '../../../services/rapService';
import './MomentosEvaluacion.css';

const initialFilters = {
  periodo: '',
  estado: '',
  programaId: ''
};

function getMomentos(data) {
  if (Array.isArray(data?.momentos)) return data.momentos;
  if (Array.isArray(data?.resultados)) return data.resultados;
  return [];
}

function fieldValue(moment, keys) {
  for (const key of keys) {
    if (moment?.[key] !== undefined && moment?.[key] !== null && moment?.[key] !== '') {
      return moment[key];
    }
  }
  return null;
}

export default function MomentosEvaluacion() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [momentos, setMomentos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const actualizarMomentos = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const data = await listarMomentosEvaluacion(filters);
      setMomentos(getMomentos(data));
    } catch (requestError) {
      setMomentos(null);
      setError(requestError.message || 'No fue posible consultar los momentos de evaluación.');
    } finally {
      setLoading(false);
    }
  };

  const verResultados = (momento) => {
    const momentoId = fieldValue(momento, ['id_momento_evaluacion', 'momentoId', 'id']);
    navigate(`/admin/rap/resultados${momentoId ? `?momentoId=${encodeURIComponent(momentoId)}` : ''}`);
  };

  return (
    <section className="moments-page" aria-labelledby="moments-title">
      <div className="moments-heading">
        <div>
          <h1 id="moments-title">Seguimiento de resultados de aprendizaje</h1>
          <p>Consulte los momentos de evaluación configurados y su avance general.</p>
        </div>
        <button type="button" className="moments-help-button" onClick={() => setNotice('Seleccione los filtros y pulse Actualizar para consultar los momentos disponibles.')}>
          ? Ayuda
        </button>
      </div>

      {notice && <p className="moments-notice" role="status">{notice}</p>}

      <div className="results-tabs moments-tabs" role="tablist" aria-label="Secciones de resultados">
        <Link to="/admin/rap/momentos" role="tab" aria-selected="true" className="active">
          Momentos de evaluación
        </Link>
        <Link to="/admin/rap/resultados" role="tab" aria-selected="false">
          Resultados de aprendizaje
        </Link>
      </div>

      <form className="moments-filters" onSubmit={actualizarMomentos}>
        <div className="moments-field">
          <label htmlFor="moments-periodo">Periodo académico</label>
          <input id="moments-periodo" name="periodo" value={filters.periodo} onChange={handleChange} placeholder="Ej. 2026-II" />
        </div>
        <div className="moments-field">
          <label htmlFor="moments-estado">Estado</label>
          <select id="moments-estado" name="estado" value={filters.estado} onChange={handleChange}>
            <option value="">Todos</option>
            <option value="en_curso">En curso</option>
            <option value="programado">Programado</option>
            <option value="cerrado">Cerrado</option>
          </select>
        </div>
        <div className="moments-field">
          <label htmlFor="moments-programa">Programa</label>
          <input id="moments-programa" name="programaId" value={filters.programaId} onChange={handleChange} placeholder="Ej. Ingeniería de Sistemas" />
        </div>
        <button type="submit" className="moments-update-button" disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </form>

      {error && <div className="moments-state moments-error" role="alert">{error}</div>}
      {!error && loading && <div className="moments-state">Cargando momentos de evaluación...</div>}
      {!error && !loading && momentos === null && (
        <div className="moments-state">Seleccione los filtros y pulse Actualizar para consultar momentos de evaluación.</div>
      )}
      {!error && !loading && Array.isArray(momentos) && momentos.length === 0 && (
        <div className="moments-state">No hay momentos de evaluación disponibles para los filtros seleccionados.</div>
      )}
      {!error && !loading && Array.isArray(momentos) && momentos.length > 0 && (
        <div className="moments-list">
          {momentos.map((momento, index) => {
            const semester = fieldValue(momento, ['semestre', 'numero_semestre']);
            const title = fieldValue(momento, ['nombre', 'titulo']);
            const status = fieldValue(momento, ['estado', 'status']);
            const raps = fieldValue(momento, ['raps', 'rap_asociados']);
            const coverage = fieldValue(momento, ['cobertura']);
            const average = fieldValue(momento, ['promedio', 'promedio_general']);
            const hasResults = fieldValue(momento, ['tiene_resultados', 'hasResults']);
            const normalizedStatus = typeof status === 'string' ? status.toLowerCase().replaceAll(' ', '_') : '';

            return (
              <article className="moment-card" key={fieldValue(momento, ['id_momento_evaluacion', 'id']) || index}>
                <div className="moment-card-top">
                  <div className="moment-semester">{semester === null ? '—' : `${semester}°`}</div>
                  <div>
                    <h2>{title || 'Momento de evaluación'}</h2>
                    <p className="moment-meta">
                      Semestre: {semester === null ? '—' : semester} · Periodo: {fieldValue(momento, ['periodo']) || '—'} · Origen: {fieldValue(momento, ['origen', 'evaluacion_origen']) || '—'}
                    </p>
                  </div>
                  <span className={`moment-status moment-status-${normalizedStatus || 'unknown'}`}>{status || '—'}</span>
                </div>
                <div className="moment-card-details">
                  <div>
                    <span className="moment-label">RAP asociados</span>
                    <div className="moment-chips">
                      {Array.isArray(raps) && raps.length > 0 ? raps.map((rap, rapIndex) => (
                        <span className="moment-chip" key={rap.id_rap || rap.codigo_rap || rapIndex}>{rap.codigo_rap || rap.codigo || rap.nombre || 'RAP'}</span>
                      )) : <span className="moment-muted">—</span>}
                    </div>
                  </div>
                  <div><span className="moment-label">Cobertura</span><strong>{coverage === null ? '—' : coverage}</strong></div>
                  <div><span className="moment-label">Promedio general</span><strong>{average === null ? '—' : average}</strong></div>
                </div>
                <div className="moment-card-footer">
                  {hasResults === false ? (
                    <button type="button" className="moment-results-disabled" disabled>Aún sin resultados</button>
                  ) : (
                    <button type="button" className="moment-results-link" onClick={() => verResultados(momento)}>Ver resultados →</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="moments-info">Un RAP puede variar por momento de evaluación según las evaluaciones configuradas para cada semestre y grupo.</p>
    </section>
  );
}
