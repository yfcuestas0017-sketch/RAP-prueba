const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const pool = require("./database");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        (process.env.BACKEND_URL || "http://localhost:3000") +
        "/api/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {

        const correo = profile.emails[0].value;

        console.log("Correo de Google:", correo);

        const resultado = await pool.query(
          `
          SELECT
              u."id_user",
              u."nombre",
              u."apellido",
              u."correo",
              u."estado",
              u."id_rol"
          FROM "usuarios" u
          WHERE LOWER(u."correo") = LOWER($1)
          AND u."estado" = TRUE;
          `,
          [correo]
        );

        if (resultado.rows.length === 0) {

          console.log("Usuario no registrado:", correo);

          return done(null, false);
        }

        const usuario = resultado.rows[0];

        console.log("Usuario encontrado:", usuario);


        return done(null, usuario);

      } catch (error) {

        console.error("Error consultando PostgreSQL:", error);

        return done(error, null);
      }
    }
  )
);

passport.serializeUser((usuario, done) => {
  done(null, usuario);
});

passport.deserializeUser((usuario, done) => {
  done(null, usuario);
});

module.exports = passport;