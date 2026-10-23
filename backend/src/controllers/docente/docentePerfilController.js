const pool = require("../../config/database");
const obtenerPerfil = async (req, res) => {
    try {
        const id_user = req.user?.id_user || req.user?.id;

        if (!id_user) {
            return res.status(401).json({
                mensaje: "No está autenticado"
            });
        }

        const query = `
            SELECT
                u.id_user,
                u.id_user_institucional,
                u.nombre,
                u.apellido,
                u.correo,
                u.estado,
                r.id_rol,
                r.nombre AS rol,

                COALESCE(
                    jsonb_agg(
                        DISTINCT jsonb_build_object(
                            'id_programa', p.id_programa,
                            'programa', p.nombre,
                            'id_facultad', f.id_facultad,
                            'facultad', f.nombre
                        )
                    ) FILTER (
                        WHERE p.id_programa IS NOT NULL
                    ),
                    '[]'::jsonb
                ) AS programas

            FROM usuarios u
            INNER JOIN rol r
                ON r.id_rol = u.id_rol
            LEFT JOIN usuario_grupo ug
                ON ug.id_user = u.id_user
                AND ug.estado = TRUE
            LEFT JOIN grupo g
                ON g.id_grupo = ug.id_grupo
            LEFT JOIN semestre s
                ON s.id_semestre = g.id_semestre
            LEFT JOIN programa p
                ON p.id_programa = s.id_programa
            LEFT JOIN facultad f
                ON f.id_facultad = p.id_facultad
            WHERE u.id_user = $1
              AND u.id_rol = 5

            GROUP BY
                u.id_user,
                u.id_user_institucional,
                u.nombre,
                u.apellido,
                u.correo,
                u.estado,
                r.id_rol,
                r.nombre
        `;

        const resultado = await pool.query(query, [id_user]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Docente no encontrado"
            });
        }

        return res.status(200).json({
            mensaje: "Perfil obtenido correctamente",
            perfil: resultado.rows[0]
        });

    } catch (error) {
        console.error(
            "Error al obtener perfil del docente:",
            error
        );

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};

module.exports = { obtenerPerfil };