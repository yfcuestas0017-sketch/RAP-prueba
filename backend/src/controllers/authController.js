const pool = require("../config/database");
const passport = require("../config/passport");
const bcrypt = require("bcrypt");

const obtenerUsuarioActual = (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      mensaje: "No está autenticado"
    });
  }

  return res.status(200).json({
    success: true,
    usuario: {
      id: req.user.id_user,
      nombre: req.user.nombre,
      apellido: req.user.apellido,
      correo: req.user.correo,
      rol: req.user.id_rol
    }
  });
};

const loginAdmin = async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({
      success: false,
      mensaje: "Debe ingresar usuario y contraseña"
    });
  }

  try {
    
    const resultado = await pool.query(
      `
      SELECT 
        u."id_user",
        u."nombre",
        u."apellido",
        u."correo",
        u."estado",
        u."id_rol",
        a."usuario",
        a."password_hash"
      FROM "usuarios" u
      INNER JOIN "administradores" a
        ON u."id_user" = a."id_user"
      WHERE a."usuario" = $1
        AND u."id_rol" = 4
        AND u."estado" = TRUE;
      `,
      [usuario]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        success: false,
        mensaje: "Usuario o contraseña incorrectos"
      });
    }

    const admin = resultado.rows[0];
    const passwordCorrecta = await bcrypt.compare(
      password,
      admin.password_hash
    );

    if (!passwordCorrecta) {
      return res.status(401).json({
        success: false,
        mensaje: "Usuario o contraseña incorrectos"
      });
    }

    req.login(admin, (error) => {
      if (error) {
        console.error("Error creando sesión:", error);

        return res.status(500).json({
          success: false,
          mensaje: "No se pudo crear la sesión"
        });
      }

      return res.status(200).json({
        success: true,
        mensaje: "Successful Admin",
        rol: "ADMIN",
        usuario: {
          id: admin.id_user,
          nombre: admin.nombre,
          apellido: admin.apellido,
          correo: admin.correo,
          rol: admin.id_rol
        }
      });
    });

  } catch (error) {
    console.error("Error en login de administrador:", error);

    return res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor"
    });
  }
};

const googleCallback = (req, res) => {
  console.log("Usuario autenticado:");
  console.log(req.user);

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0];
  const idRol = Number(req.user.id_rol);

  if (idRol === 5) {
    return res.redirect(`${frontendUrl}/docente`);
  }

  if (idRol === 6) {
    return res.redirect(`${frontendUrl}/estudiante`);
  }

  if (idRol === 4) {
    return res.redirect(`${frontendUrl}/admin`);
  }

  return res.redirect(`${frontendUrl}/`);
};

const testLoginEstudiante = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        u."id_user",
        u."id_user_institucional",
        u."nombre",
        u."apellido",
        u."correo",
        u."estado",
        u."id_rol"
      FROM "usuarios" u
      WHERE u."id_user" = 10
        AND u."estado" = TRUE
        AND u."id_rol" = 6
    `);

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "No se encontró el estudiante"
      });
    }

    const usuario = resultado.rows[0];

    req.login(usuario, (error) => {
      if (error) {
        console.error("Error creando sesión:", error);

        return res.status(500).json({
          success: false,
          mensaje: "No se pudo crear la sesión"
        });
      }

      return res.status(200).json({
        success: true,
        mensaje: "Sesión de estudiante iniciada",
        usuario
      });
    });

  } catch (error) {
    console.error("Error en test-login-estudiante:", error);

    return res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor"
    });
  }
};

const testLoginDocente = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        u."id_user",
        u."id_user_institucional",
        u."nombre",
        u."apellido",
        u."correo",
        u."estado",
        u."id_rol"
      FROM "usuarios" u
      WHERE u."id_user" = 10
        AND u."estado" = TRUE
        AND u."id_rol" = 5
    `);

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        success: false,
        mensaje: "No se encontró el docente"
      });
    }

    const usuario = resultado.rows[0];

    req.login(usuario, (error) => {
      if (error) {
        console.error("Error creando sesión:", error);

        return res.status(500).json({
          success: false,
          mensaje: "No se pudo crear la sesión"
        });
      }

      return res.status(200).json({
        success: true,
        mensaje: "Sesión de docente iniciada",
        usuario
      });
    });

  } catch (error) {
    console.error("Error en test-login-docente:", error);

    return res.status(500).json({
      success: false,
      mensaje: "Error interno del servidor"
    });
  }
};

module.exports = {
  obtenerUsuarioActual,
  loginAdmin,
  googleCallback,
  testLoginEstudiante,
  testLoginDocente
};