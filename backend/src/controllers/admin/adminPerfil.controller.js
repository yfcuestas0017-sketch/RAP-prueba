const pool = require("../../config/database");
const bcrypt = require("bcrypt");
const obtenerPerfil = async (req, res) => {
    try {
        if (!req.user || !req.user.id_user) {
            return res.status(401).json({
                mensaje: "No está autenticado"
            });
        }

        const id_user = req.user.id_user;

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
                a.usuario
            FROM usuarios u
            INNER JOIN rol r
                ON u.id_rol = r.id_rol
            INNER JOIN administradores a
                ON a.id_user = u.id_user
            WHERE u.id_user = $1
              AND u.id_rol = 4
        `;

        const resultado = await pool.query(query, [id_user]);

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Administrador no encontrado"
            });
        }

        return res.status(200).json({
            mensaje: "Perfil obtenido correctamente",
            perfil: resultado.rows[0]
        });

    } catch (error) {
        console.error("Error al obtener perfil del administrador:", error);

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};
const actualizarCredenciales = async (req, res) => {
    try {
        if (!req.user || !req.user.id_user) {
            return res.status(401).json({
                mensaje: "No está autenticado"
            });
        }

        const id_user = req.user.id_user;

        const {
            usuarioActual,
            usuarioNuevo,
            passwordActual,
            passwordNueva
        } = req.body;

        // ----------------------------------------------
        // Verificar que el administrador exista
        // ----------------------------------------------
        const administrador = await pool.query(
            `
            SELECT
                id_user,
                usuario,
                password_hash
            FROM administradores
            WHERE id_user = $1
            `,
            [id_user]
        );

        if (administrador.rows.length === 0) {
            return res.status(404).json({
                mensaje: "Administrador no encontrado"
            });
        }

        const admin = administrador.rows[0];
        if (usuarioNuevo !== undefined) {

            if (!usuarioActual || !usuarioNuevo) {
                return res.status(400).json({
                    mensaje: "Debe proporcionar el usuario actual y el nuevo usuario"
                });
            }

            if (admin.usuario !== usuarioActual) {
                return res.status(401).json({
                    mensaje: "El usuario actual no es correcto"
                });
            }

            const usuarioExiste = await pool.query(
                `
                SELECT id_user
                FROM administradores
                WHERE usuario = $1
                  AND id_user <> $2
                `,
                [usuarioNuevo, id_user]
            );

            if (usuarioExiste.rows.length > 0) {
                return res.status(409).json({
                    mensaje: "El nuevo usuario ya está en uso"
                });
            }

            await pool.query(
                `
                UPDATE administradores
                SET usuario = $1
                WHERE id_user = $2
                `,
                [usuarioNuevo, id_user]
            );
        }

        if (passwordNueva !== undefined) {

            if (!passwordActual || !passwordNueva) {
                return res.status(400).json({
                    mensaje: "Debe proporcionar la contraseña actual y la nueva contraseña"
                });
            }

            const passwordCorrecta = await bcrypt.compare(
                passwordActual,
                admin.password_hash
            );

            if (!passwordCorrecta) {
                return res.status(401).json({
                    mensaje: "La contraseña actual no es correcta"
                });
            }
            if (passwordNueva.length < 8) {
                return res.status(400).json({
                    mensaje: "La nueva contraseña debe tener al menos 8 caracteres"
                });
            }
            const mismaPassword = await bcrypt.compare(
                passwordNueva,
                admin.password_hash
            );

            if (mismaPassword) {
                return res.status(400).json({
                    mensaje: "La nueva contraseña debe ser diferente a la actual"
                });
            }

            const nuevoHash = await bcrypt.hash(passwordNueva, 10);

            await pool.query(
                `
                UPDATE administradores
                SET password_hash = $1
                WHERE id_user = $2
                `,
                [nuevoHash, id_user]
            );
        }
        
        if (
            usuarioNuevo === undefined &&
            passwordNueva === undefined
        ) {
            return res.status(400).json({
                mensaje: "No se proporcionaron datos para actualizar"
            });
        }


        return res.status(200).json({
            mensaje: "Credenciales actualizadas correctamente"
        });

    } catch (error) {
        console.error(
            "Error al actualizar credenciales del administrador:",
            error
        );

        return res.status(500).json({
            mensaje: "Error interno del servidor"
        });
    }
};


module.exports = {
    obtenerPerfil,
    actualizarCredenciales
};