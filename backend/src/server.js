const express = require("express");
const cors = require("cors");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);

require("dotenv").config();

const passport = require("./config/passport");
const pool = require("./config/database");

const app = express();

// En Render la app queda detrás de un proxy; esto es necesario para que
// las cookies "secure" funcionen correctamente.
app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const ORIGEN_LOCAL = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
const ORIGENES_PERMITIDOS = [...new Set([
  FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173"
])];

app.use(cors({
  origin(origin, callback) {
    if (!origin || ORIGENES_PERMITIDOS.includes(origin) || ORIGEN_LOCAL.test(origin)) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json());

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "session",
      createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // En producción el frontend (Vercel) y el backend (Render) son
      // dominios distintos, por lo que la cookie debe ser "cross-site".
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000
    }
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  console.log("SESSION:", req.session);
  console.log("USER:", req.user);
  next();
});


const authRoutes = require("./routes/Dashboard");
const exportUsersRoutes = require("./routes/Admin/ExportUsers");
const adminUsuariosRoutes = require("./routes/Admin/adminUsuarios");
const adminRapRoutes = require("./routes/Admin/adminRAP");
const adminCompoRoutes = require("./routes/Admin/AdminCompo");
const adminEvaluacionesRoutes = require("./routes/Admin/adminEvaluaciones");
const estudianteRoutes = require("./routes/Estudiante/estudiante");
const estudianteReportesRoutes = require("./routes/Estudiante/estudianteReportes");
const docenteDashboardRoutes = require("./routes/Docente/docenteDashboard");
const docenteReportesRoutes = require("./routes/Docente/docenteReportes");
const adminReportesRoutes = require("./routes/Admin/adminReportes");
const adminPerfilRoutes = require("./routes/Admin/adminPerfil");
const docentePerfilRoutes = require("./routes/Docente/docentePerfil");
const estudiantePerfilRoutes = require("./routes/Estudiante/estudiantePerfil");
const docenteEvaluacionesRoutes = require("./routes/Docente/docenteEvaluaciones");
const estudianteEvaluacionesRoutes = require("./routes/Estudiante/estdianteEvaluaciones");
const adminSeguimientoRoutes = require("./routes/Admin/adminSeguimiento");
const docenteGrupoRoutes = require("./routes/Docente/docenteGrupos");
const docenteMicrocurriculoRoutes = require("./routes/Docente/microcurriculo");
const estudiantePruebaRoutes = require("./routes/Estudiante/estudiantePrueba");
const estudianteProyectosRoutes = require("./routes/Estudiante/estudianteProyectos");
const docenteFichasRoutes = require("./routes/Docente/docenteFichas");
const adminMicrocurriculoRoutes = require("./routes/Admin/adminMicrocurriculos");
const adminFichasRoutes = require("./routes/Admin/adminFichas");
const adminInterestructuranteRoutes = require("./routes/Admin/adminintere");
const adminTrabajoGradoRoutes = require("./routes/Admin/adminGrado");
const adminCatalogoRoutes = require("./routes/Admin/adminCatalogo");
const estudianteModalidadRoutes = require("./routes/Estudiante/modalidadGrado");
const adminModalidadRoutes = require("./routes/Admin/adminmodalidad");
const asistenteIARoutes = require("./routes/IA/asistenteIA");
const docenteSaberProRoutes = require("./routes/Docente/saberPro");
const adminSaberProRoutes = require("./routes/Admin/adminSaberPro");
const catalogosDocumentosRoutes = require("./routes/Admin/Catalogosdocumentos");







app.use("/api/auth", authRoutes);
app.use("/api/users", exportUsersRoutes);
app.use("/api/adminUsuarios", adminUsuariosRoutes);
app.use("/api/adminRap", adminRapRoutes);
app.use("/api/adminCompo", adminCompoRoutes);
app.use("/api/admin/evaluaciones", adminEvaluacionesRoutes);
app.use("/api/estudiante", estudianteRoutes);
app.use("/api/estudiante", estudianteReportesRoutes);
app.use("/api/docente", docenteDashboardRoutes);
app.use("/api/docente", docenteReportesRoutes);
app.use("/api/admin/reportes", adminReportesRoutes);
app.use("/api/admin/Perfil", adminPerfilRoutes);
app.use("/api/docente/Perfil", docentePerfilRoutes);
app.use("/api/estudiante/Perfil", estudiantePerfilRoutes);
app.use("/api/docente/evaluaciones", docenteEvaluacionesRoutes);
app.use("/api/estudiante/evaluaciones", estudianteEvaluacionesRoutes);
app.use("/api/admin/seguimiento", adminSeguimientoRoutes);
app.use("/api/docente", docenteGrupoRoutes);
app.use("/api/docente/microcurriculo", docenteMicrocurriculoRoutes);
app.use("/api/estudiante/prueba", estudiantePruebaRoutes);
app.use("/api/estudiante/proyecto", estudianteProyectosRoutes);
app.use("/api/docente/fichas-desarrollo", docenteFichasRoutes);
app.use("/api/admin/microcurriculo", adminMicrocurriculoRoutes);
app.use("/api/admin/fichas-desarrollo", adminFichasRoutes);
app.use("/api/admin/proyecto", adminInterestructuranteRoutes);
app.use("/api/admin/trabajo-grado", adminTrabajoGradoRoutes);
app.use("/api/admin/catalogos", adminCatalogoRoutes);
app.use("/api/estudiante/modalidad-grado", estudianteModalidadRoutes);
app.use("/api/admin/modalidad-grado", adminModalidadRoutes);
app.use("/api/ia/saber-pro", asistenteIARoutes);
app.use("/api/docente/saber-pro", docenteSaberProRoutes);
app.use("/api/admin/saber-pro", adminSaberProRoutes);
app.use("/api/admin/catalogosdocumentos", catalogosDocumentosRoutes);




// En producción (Render) el puerto lo asigna la plataforma mediante PORT.
// En desarrollo se mantiene el 3000 de siempre, aunque el .env tenga otro PORT,
// porque el frontend y el callback de Google apuntan a http://localhost:3000.
const PORT = isProduction ? (process.env.PORT || 3000) : 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});