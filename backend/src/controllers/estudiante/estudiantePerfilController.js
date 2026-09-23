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

                g.id_grupo,
                g.nombre AS grupo,
                g.jornada,
                g.periodo,
                g.codigo_jornada,

                s.id_semestre,
                s.numero AS semestre,
                s.nombre AS nombre_semestre,

                p.id_programa,
                p.nombre AS programa,

                f.clave AS facultad_clave,
                f.nombre AS facultad

            FROM usuarios u

            INNER JOIN rol r
                ON u.id_rol = r.id_rol

            LEFT JOIN usuario_grupo ug
                ON ug.id_user = u.id_user

            LEFT JOIN grupo g
                ON g.id_grupo = ug.id_grupo

            LEFT JOIN semestre s
                ON s.id_semestre = g.id_semestre

            LEFT JOIN programa p
                ON p.id_programa = s.id_programa

            LEFT JOIN facultad f
                ON f.clave = p.id_facultad

            WHERE u.id_user = $1
              AND u.id_rol = 6
        `;

        const resultado = await pool.query(query, [id_user]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Estudiante no encontrado"
            });
        }

        return res.status(200).json({
            mensaje: "Perfil obtenido correctamente",
            perfil: resultado.rows[0]
        });

    } catch (error) {

        console.error(
            "Error al obtener perfil del estudiante:",
            error
        );

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};


module.exports = {
    obtenerPerfil
};