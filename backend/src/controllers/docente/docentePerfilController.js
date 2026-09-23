const pool = require("../../config/database");
const obtenerPerfil = async (req, res) => {
    try {

        // Obtener el ID del usuario autenticado
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
                r.nombre AS rol
            FROM usuarios u
            INNER JOIN rol r
                ON u.id_rol = r.id_rol
            WHERE u.id_user = $1
              AND u.id_rol = 5
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


module.exports = {
    obtenerPerfil
};