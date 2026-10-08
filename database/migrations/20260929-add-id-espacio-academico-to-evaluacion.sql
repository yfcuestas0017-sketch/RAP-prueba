-- Opcion 3: vincular cada evaluacion a un espacio academico real para que los
-- reportes del admin puedan agregarse por componente/espacio (no por cross-join).
--
-- UP (aplicar con: psql "$DATABASE_URL" -f este_archivo.sql  o via node/pg)
ALTER TABLE evaluacion
  ADD COLUMN IF NOT EXISTS id_espacio_academico INT;

ALTER TABLE evaluacion
  DROP CONSTRAINT IF EXISTS fk_evaluacion_espacio_academico;
ALTER TABLE evaluacion
  ADD CONSTRAINT fk_evaluacion_espacio_academico
  FOREIGN KEY (id_espacio_academico)
  REFERENCES espacio_academico (id_espacio_academico);

CREATE INDEX IF NOT EXISTS idx_evaluacion_espacio_academico
  ON evaluacion (id_espacio_academico);

-- Backfill DEMO: asigna a cada evaluacion un espacio de un componente distinto
-- dentro de su mismo momento, para que filtrar por componente muestre datos
-- variados. En produccion este valor lo fija la app al crear la evaluacion.
--   eval1 (mom7) -> componente 41 Programacion        -> espacio 113
--   eval2 (mom7) -> componente 43 Matematicas         -> espacio 120
--   eval3 (mom8) -> componente 48 Programacion        -> espacio 137
--   eval4 (mom8) -> componente 50 Telematica          -> espacio 145
--   eval5 (mom9) -> componente 54 Programacion        -> espacio 152
--   eval6 (mom9) -> componente 58 Socioeconomico      -> espacio 160
UPDATE evaluacion e
SET id_espacio_academico = esp.id_espacio_academico
FROM (VALUES
  (1, 41), (2, 43), (3, 48), (4, 50), (5, 54), (6, 58)
) AS m(id_evaluacion, id_componente)
JOIN LATERAL (
  SELECT MIN(pe.id_espacio_academico) AS id_espacio_academico
  FROM programa_espacio pe
  WHERE pe.id_componente = m.id_componente
) AS esp ON TRUE
WHERE e.id_evaluacion = m.id_evaluacion;

-- DOWN (revertir):
--   DROP INDEX IF EXISTS idx_evaluacion_espacio_academico;
--   ALTER TABLE evaluacion DROP CONSTRAINT IF EXISTS fk_evaluacion_espacio_academico;
--   ALTER TABLE evaluacion DROP COLUMN IF EXISTS id_espacio_academico;
