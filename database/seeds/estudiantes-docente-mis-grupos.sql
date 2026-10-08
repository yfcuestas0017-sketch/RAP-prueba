-- ============================================================================
-- Estudiantes para los grupos del docente Juan Diego Cordoba (id_user = 1)
-- ----------------------------------------------------------------------------
--   Grupos del docente y su semestre:
--     id_grupo 1 = "Grupo A"                    -> Semestre 4
--     id_grupo 2 = "Grupo B"                    -> Semestre 4
--     id_grupo 3 = "Grupo C"                    -> Semestre 7
--     id_grupo 7 = "Grupo Ingeniería de Software" -> Semestre 9
--
--   Resultado: 10 estudiantes por grupo (40 en total = 2 ya existentes + 38 nuevos)
--
--   En pgAdmin: abrir el Query Tool de la base RAP y pegar este archivo.
--   Idempotente: se puede ejecutar varias veces sin duplicar filas.
--
--   NOTA: los estudiantes se loguean con Google OAuth, no con password, asi que
--   no hace falta tocar ninguna tabla de credenciales.
-- ============================================================================

BEGIN;

-- ===========================================================================
-- 1. LIMPIEZA DE DATOS INCONSISTENTES
-- ===========================================================================

-- 1.1 La unica fila de "estudiantes" apuntaba a id_user = 5, que es un
--     ADMINISTRADOR. Su codigo 1221105027 coincide con el
--     id_user_institucional de id_user = 3, asi que la fila se reasigna a su
--     dueno real y a la vez se le completa el perfil que le faltaba.
UPDATE "estudiantes"
SET "id_user" = 3
WHERE "id_user" = 5
  AND NOT EXISTS (SELECT 1 FROM "estudiantes" WHERE "id_user" = 3);

UPDATE "estudiantes"
SET "semestre_actual"     = 4,
    "programa_academico"  = 'Ingeniería de Sistemas'
WHERE "id_user" = 3;

-- 1.2 Un estudiante no puede estar en grupos de semestres distintos al suyo:
--     id_user = 3 se quedaba en el grupo C (Semestre 7) y en el E (Semestre 9).
--     Se conserva solo el Grupo A, que es de Semestre 4.
DELETE FROM "usuario_grupo"
WHERE "id_user" = 3
  AND "id_grupo" IN (3, 5);

-- 1.3 Karen Casanova (id_user = 2): no tenia fila en "estudiantes" ni grupo.
INSERT INTO "estudiantes" (id_user, codigo_estudiante, semestre_actual, programa_academico)
SELECT 2, '1221105028', 4, 'Ingeniería de Sistemas'
WHERE NOT EXISTS (SELECT 1 FROM "estudiantes" WHERE "id_user" = 2);

INSERT INTO "usuario_grupo" (estado, id_user, id_grupo)
SELECT TRUE, 2, 2
WHERE NOT EXISTS (SELECT 1 FROM "usuario_grupo" WHERE "id_user" = 2 AND "id_grupo" = 2);


-- ===========================================================================
-- 2. ALTA DE 38 ESTUDIANTES NUEVOS
-- ===========================================================================

CREATE TEMP TABLE tmp_nuevos (
    cod      text,
    nombre   text,
    apellido text,
    correo   text,
    semestre integer,
    id_grupo integer
) ON COMMIT DROP;

INSERT INTO tmp_nuevos VALUES
-- ---- Grupo A (id_grupo 1, Semestre 4) : 9 nuevos ----
('1221106001','Valentina',    'Restrepo Gómez',   'valentina.restrepo@unicesmag.edu.co',  4, 1),
('1221106002','Sebastián',    'Morales Ríos',     'sebastian.morales@unicesmag.edu.co',   4, 1),
('1221106003','Camila',       'Torres Agudelo',   'camila.torres@unicesmag.edu.co',       4, 1),
('1221106004','Andrés',       'Mejía Cardona',    'andres.mejia@unicesmag.edu.co',        4, 1),
('1221106005','Laura',        'Vargas Palacio',   'laura.vargas@unicesmag.edu.co',        4, 1),
('1221106006','Diego',        'Hernández Mejía',  'diego.hernandez@unicesmag.edu.co',     4, 1),
('1221106007','Sofía',        'Ramírez Ospina',   'sofia.ramirez@unicesmag.edu.co',       4, 1),
('1221106008','Mateo',        'Gómez Zapata',     'mateo.gomez@unicesmag.edu.co',         4, 1),
('1221106009','Daniela',      'Castro Molina',    'daniela.castro@unicesmag.edu.co',      4, 1),

-- ---- Grupo B (id_grupo 2, Semestre 4) : 9 nuevos ----
('1221106010','Santiago',     'Arango Villa',     'santiago.arango@unicesmag.edu.co',     4, 2),
('1221106011','Gabriela',     'Muñoz Cárdenas',   'gabriela.munoz@unicesmag.edu.co',      4, 2),
('1221106012','Nicolás',      'Salazar Herrera',  'nicolas.salazar@unicesmag.edu.co',     4, 2),
('1221106013','Paula',        'Ordóñez Cortés',   'paula.ordonez@unicesmag.edu.co',       4, 2),
('1221106014','Juan Pablo',   'Quintero Díaz',    'juanpablo.quintero@unicesmag.edu.co',  4, 2),
('1221106015','Camilo',       'Estrada Rivera',   'camilo.estrada@unicesmag.edu.co',      4, 2),
('1221106016','Valeria',      'Pineda Sandoval',  'valeria.pineda@unicesmag.edu.co',      4, 2),
('1221106017','Felipe',       'Bernal Guzmán',    'felipe.bernal@unicesmag.edu.co',       4, 2),
('1221106018','Laura Daniela','Acosta Prieto',    'lauradaniela.acosta@unicesmag.edu.co', 4, 2),

-- ---- Grupo C (id_grupo 3, Semestre 7) : 10 nuevos ----
('1221106019','Alejandra',    'Rendón Valencia',  'alejandra.rendon@unicesmag.edu.co',    7, 3),
('1221106020','Juan Esteban', 'Villegas Mesa',    'juanesteban.villegas@unicesmag.edu.co',7, 3),
('1221106021','Mariana',      'Botero Guerra',    'mariana.botero@unicesmag.edu.co',      7, 3),
('1221106022','Andrés Felipe','Pérez Ossa',       'andresfelipe.perez@unicesmag.edu.co',  7, 3),
('1221106023','Carolina',     'Londoño Arboleda', 'carolina.londono@unicesmag.edu.co',    7, 3),
('1221106024','Rafael',       'Jaramillo Echeverri','rafael.jaramillo@unicesmag.edu.co',  7, 3),
('1221106025','Natalia',      'Ceballos Arias',   'natalia.ceballos@unicesmag.edu.co',    7, 3),
('1221106026','Mauricio',     'Zapata Ruiz',      'mauricio.zapata@unicesmag.edu.co',     7, 3),
('1221106027','Camila Sofía', 'Hernández Ríos',   'camilasofia.hernandez@unicesmag.edu.co',7,3),
('1221106028','Luis Fernando','Acevedo Rivas',    'luisfernando.acevedo@unicesmag.edu.co',7, 3),

-- ---- Grupo Ingeniería de Software (id_grupo 7, Semestre 9) : 10 nuevos ----
('1221106029','Esteban',      'Ruiz Castaño',     'esteban.ruiz@unicesmag.edu.co',        9, 7),
('1221106030','Daniela',      'Ortiz Mendoza',    'daniela.ortiz@unicesmag.edu.co',       9, 7),
('1221106031','Andrés Camilo','Vega Montoya',     'andrescamilo.vega@unicesmag.edu.co',   9, 7),
('1221106032','María Alejandra','Sánchez Obando','mariaalejandra.sanchez@unicesmag.edu.co',9,7),
('1221106033','Jorge Iván',   'Márquez Delgado',  'jorgeivan.marquez@unicesmag.edu.co',   9, 7),
('1221106034','Xiomara',      'Perdomo Leyva',    'xiomara.perdomo@unicesmag.edu.co',     9, 7),
('1221106035','Samuel',       'Cardona Ríos',     'samuel.cardona@unicesmag.edu.co',      9, 7),
('1221106036','Laura',        'Gómez Naranjo',    'laura.gomez@unicesmag.edu.co',         9, 7),
('1221106037','Anderson',     'Peña Buitrago',    'anderson.pena@unicesmag.edu.co',       9, 7),
('1221106038','Michelle',     'Torres Aristizábal','michelle.torres@unicesmag.edu.co',    9, 7);

-- 2.1 usuarios (rol 6 = Estudiante)
INSERT INTO "usuarios" (id_user_institucional, nombre, apellido, correo, estado, id_rol)
SELECT t.cod::integer, t.nombre, t.apellido, t.correo, TRUE, 6
FROM tmp_nuevos t
WHERE NOT EXISTS (SELECT 1 FROM "usuarios" u WHERE u."correo" = t.correo);

-- 2.2 perfil de estudiante (codigo, semestre y programa)
INSERT INTO "estudiantes" (id_user, codigo_estudiante, semestre_actual, programa_academico)
SELECT u."id_user", t.cod, t.semestre, 'Ingeniería de Sistemas'
FROM tmp_nuevos t
INNER JOIN "usuarios" u ON u."correo" = t.correo
WHERE NOT EXISTS (SELECT 1 FROM "estudiantes" e WHERE e."id_user" = u."id_user");

-- 2.3 vinculo con el grupo
--     estado = TRUE es obligatorio: esta en el WHERE de
--     docenteGruposController, docenteReportes y estudianteEvaluacionController.
INSERT INTO "usuario_grupo" (estado, id_user, id_grupo)
SELECT TRUE, u."id_user", t.id_grupo
FROM tmp_nuevos t
INNER JOIN "usuarios" u ON u."correo" = t.correo
WHERE NOT EXISTS (
    SELECT 1 FROM "usuario_grupo" ug
    WHERE ug."id_user" = u."id_user"
      AND ug."id_grupo" = t.id_grupo
);

COMMIT;


-- ===========================================================================
-- 3. VERIFICACIONES
-- ===========================================================================

-- 3.1 Estudiantes por grupo del docente (debe dar 10 en cada uno)
SELECT
    g."id_grupo",
    g."nombre" AS grupo,
    s."numero" AS semestre,
    COUNT(*)   AS estudiantes
FROM "usuario_grupo" ug
INNER JOIN "grupo"   g ON ug."id_grupo" = g."id_grupo"
INNER JOIN "semestre" s ON g."id_semestre" = s."id_semestre"
INNER JOIN "usuarios" u ON ug."id_user" = u."id_user" AND u."id_rol" = 6
WHERE ug."estado" = TRUE
GROUP BY g."id_grupo", g."nombre", s."numero"
ORDER BY g."id_grupo";

-- 3.2 El docente debe seguir viendo sus 4 grupos
SELECT g."id_grupo", g."nombre" AS titulo_tarjeta, g."jornada", g."periodo", s."numero" AS semestre
FROM "usuario_grupo" ug
INNER JOIN "grupo"   g ON ug."id_grupo" = g."id_grupo"
INNER JOIN "semestre" s ON g."id_semestre" = s."id_semestre"
WHERE ug."id_user" = 1 AND ug."estado" = TRUE
ORDER BY s."numero", g."nombre";

-- 3.3 No debe quedar ningun administrador dentro de "estudiantes"
SELECT e."id_user", u."nombre" || ' ' || u."apellido" AS usuario, u."id_rol"
FROM "estudiantes" e
INNER JOIN "usuarios" u ON u."id_user" = e."id_user"
WHERE u."id_rol" <> 6;
