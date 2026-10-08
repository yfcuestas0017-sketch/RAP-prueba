-- ============================================================================
-- Muestra para "Mis Grupos" del docente
-- ----------------------------------------------------------------------------
--   · Crea 1 grupo nuevo
--   · Asigna a Juan Diego Cordoba (id_user = 1) el grupo nuevo + los grupos
--     B y C que hoy no tienen docente asignado
--
--   En pgAdmin: abrir el Query Tool de la base RAP y pegar este archivo.
--   Idempotente: se puede ejecutar varias veces sin duplicar filas.
--
--   NOTA SOBRE "Grupo Grupo A"
--   ---------------------------
--   La BD guarda el nombre COMPLETO que se muestra ("Grupo A"). La UI ya no
--   antepone "Grupo " (se quito en DocenteMisGrupos.jsx, DocenteEditorPruebas.jsx,
--   AdminEditorPrueba.jsx, EstudiantePruebas.jsx y EstudianteExamenActivo.jsx),
--   por eso ahora solo aparece una vez la palabra "Grupo".
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Normalizar el nombre del grupo nuevo por si quedo sin el prefijo "Grupo "
-- ---------------------------------------------------------------------------
UPDATE "grupo"
SET "nombre" = 'Grupo Ingeniería de Software'
WHERE "nombre" = 'Ingeniería de Software';

-- ---------------------------------------------------------------------------
-- 2. Grupo nuevo
--    Reutiliza el semestre 9 (id_semestre 15) y periodo 2026-1, ya usados
--    por los grupos existentes, para que el INNER JOIN grupo->semestre->programa
--    resuelva y la tarjeta aparezca.
-- ---------------------------------------------------------------------------
INSERT INTO "grupo" (nombre, codigo_jornada, jornada, periodo, id_semestre)
SELECT 'Grupo Ingeniería de Software', 'JORN-007', 'Mañana', '2026-1', 15
WHERE NOT EXISTS (
    SELECT 1 FROM "grupo"
    WHERE "nombre" = 'Grupo Ingeniería de Software'
      AND "periodo" = '2026-1'
);

-- ---------------------------------------------------------------------------
-- 3. Asignar los 4 grupos al docente Juan Diego Cordoba (id_user = 1)
--    estado = TRUE es obligatorio: aparece en el WHERE de
--    docenteGruposController.obtenerGrupos y de docenteDashboard.
-- ---------------------------------------------------------------------------
INSERT INTO "usuario_grupo" (estado, id_user, id_grupo)
SELECT TRUE, v.id_user, g."id_grupo"
FROM (
    VALUES (1::integer, 'Grupo A'),
           (1::integer, 'Grupo B'),
           (1::integer, 'Grupo C'),
           (1::integer, 'Grupo Ingeniería de Software')
) AS v(id_user, grupo_nombre)
INNER JOIN "grupo" g
        ON g."nombre" = v.grupo_nombre
WHERE NOT EXISTS (
    SELECT 1 FROM "usuario_grupo" ug
    WHERE ug."id_user" = v.id_user
      AND ug."id_grupo" = g."id_grupo"
);

COMMIT;

-- ---------------------------------------------------------------------------
-- 4. Verificacion: esto es lo que debe devolver GET /api/docente/grupos
-- ---------------------------------------------------------------------------
SELECT
    g."id_grupo"           AS id_grupo,
    g."nombre"             AS titulo_tarjeta,
    g."codigo_jornada",
    g."jornada",
    g."periodo",
    s."numero"             AS semestre,
    s."nombre"             AS nombre_semestre,
    p."nombre"             AS programa
FROM "usuario_grupo" ug
INNER JOIN "grupo"   g ON ug."id_grupo" = g."id_grupo"
INNER JOIN "semestre" s ON g."id_semestre" = s."id_semestre"
INNER JOIN "programa" p ON s."id_programa" = p."id_programa"
WHERE ug."id_user" = 1
  AND ug."estado" = TRUE
ORDER BY s."numero", g."nombre";
