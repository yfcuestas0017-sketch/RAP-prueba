import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listarResultadosAprendizaje } from '../../../services/rapService';
import './ResultadosAprendizaje.css';

const initialFilters = {
  periodo: '',
  momentoId: '',
  grupoId: '',
  evaluacionId: '',
  tipo: 'grupo'
};

function getResults(data) {
  if (Array.isArray(data?.resultados)) return data.resultados;
  if (Array.isArray(data?.raps)) return data.raps;
  return [];
}

export default function ResultadosAprendizaje() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    momentoId: searchParams.get('momentoId') || ''
  }));
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const consultarResultados = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const data = await listarResultadosAprendizaje(filters);
      setResults(getResults(data));
    } catch (requestError) {
      setResults(null);
      setError(requestError.message || 'No fue posible consultar los resultados.');
    } finally {
      setLoading(false);
    }
  };

  const showUnavailable = () => {
    setNotice('Exportación no disponible aún.');
  };

  const showCriteriaUnavailable = () => {
    setNotice('Criterios no disponibles aún.');
  };

  return (
    <section className="results-page" aria-labelledby="results-title">
      <div className="results-heading">
        <div>
          <h1 id="results-title">Resultados de Aprendizaje</h1>
          <p>Consulte el cumplimiento obtenido a partir de las evaluaciones aplicadas.</p>
        </div>
        <div className="results-actions">
          <button type="button" className="results-export results-export-excel" onClick={showUnavailable}>
            Exportar Excel
          </button>
          <button type="button" className="results-export results-export-pdf" onClick={showUnavailable}>
            Exportar PDF
          </button>
        </div>
      </div>

      {notice && <p className="results-notice" role="status">{notice}</p>}

      <div className="results-tabs" role="tablist" aria-label="Secciones de resultados">
        <Link to="/admin/rap/momentos" role="tab" aria-selected="false">
          Momentos de evaluación
        </Link>
        <Link to="/admin/rap/resultados" role="tab" aria-selected="true" className="active">
          Resultados de aprendizaje
        </Link>
      </div>

      <>
          <form className="results-filters" onSubmit={consultarResultados}>
            <div className="results-field">
              <label htmlFor="periodo">Periodo académico</label>
              <input id="periodo" name="periodo" value={filters.periodo} onChange={handleChange} placeholder="Ej. 2026-2" />
            </div>
            <div className="results-field">
              <label htmlFor="momentoId">Momento de evaluación</label>
              <input id="momentoId" name="momentoId" value={filters.momentoId} onChange={handleChange} placeholder="Todos" />
            </div>
            <div className="results-field">
              <label htmlFor="grupoId">Grupo</label>
              <input id="grupoId" name="grupoId" value={filters.grupoId} onChange={handleChange} placeholder="Todos" />
            </div>
            <div className="results-field">
              <label htmlFor="evaluacionId">Evaluación origen</label>
              <input id="evaluacionId" name="evaluacionId" value={filters.evaluacionId} onChange={handleChange} placeholder="Todas" />
            </div>
            <div className="results-field results-type-field">
              <span className="results-label">Tipo de consulta</span>
              <div className="results-radio-group">
                <label><input type="radio" name="tipo" value="grupo" checked={filters.tipo === 'grupo'} onChange={handleChange} /> Por grupo</label>
                <label><input type="radio" name="tipo" value="individual" checked={filters.tipo === 'individual'} onChange={handleChange} /> Individual</label>
              </div>
            </div>
            <button type="submit" className="results-consult-button" disabled={loading}>
              {loading ? 'Consultando...' : 'Consultar'}
            </button>
            <button type="button" className="results-secondary-button" onClick={() => setFilters(initialFilters)}>
              Borrar
            </button>
            <button type="button" className="results-secondary-button" onClick={() => setNotice('Edición no disponible aún.')}>
              Editar
            </button>
            <button type="button" className="results-secondary-button" onClick={() => setNotice('Los filtros están visibles.')}>
              Ocultar / Mostrar
            </button>
          </form>

          <div className="results-context">
            <div><span>Fuente</span><strong>Sin datos de resultados</strong></div>
            <div><span>Grupo</span><strong>Seleccione filtros</strong></div>
            <div><span>Cobertura</span><strong>—</strong></div>
            <div><span>Promedio del grupo</span><strong>—</strong></div>
          </div>

          {error && <div className="results-state results-error" role="alert">{error}</div>}
          {!error && loading && <div className="results-state">Cargando resultados...</div>}
          {!error && !loading && results === null && (
            <div className="results-state">Seleccione filtros y consulte para ver resultados.</div>
          )}
          {!error && !loading && Array.isArray(results) && results.length === 0 && (
            <div className="results-state">Sin datos de resultados para los filtros seleccionados.</div>
          )}
          {!error && !loading && Array.isArray(results) && results.length > 0 && (
            <div className="results-table-card">
              <div className="results-table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>RAP</th>
                      <th>RESULTADO</th>
                      <th>NIVEL DE DESEMPEÑO</th>
                      <th>COBERTURA</th>
                      <th>DETALLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => {
                      const percentage = Number(result.porcentaje ?? result.resultado);
                      const safePercentage = Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : null;
                      return (
                        <tr key={result.id_rap || result.codigo_rap || index}>
                          <td><strong>{result.codigo_rap || result.codigo || '—'}</strong><span>{result.nombre || '—'}</span></td>
                          <td>
                            <strong>{safePercentage === null ? '—' : `${safePercentage}%`}</strong>
                            <div className="result-progress"><span style={{ width: `${safePercentage || 0}%` }} /></div>
                          </td>
                          <td>{result.nivel || result.nivel_desempeno || '—'}</td>
                          <td>{result.cobertura === undefined ? '—' : `${result.cobertura}%`}</td>
                          <td><button type="button" className="criteria-link" onClick={showCriteriaUnavailable}>Ver criterios →</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="results-count">{results.length} resultado(s)</p>
            </div>
          )}

          <p className="results-info">Los resultados provienen de las evaluaciones asignadas por el administrador al docente y al semestre.</p>
      </>
    </section>
  );
}
