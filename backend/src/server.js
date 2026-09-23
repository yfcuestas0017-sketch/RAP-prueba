const express = require("express");
const cors = require("cors");
const session = require("express-session");

require("dotenv").config();

const passport = require("./config/passport");

const app = express();

// En Render la app queda detrás de un proxy; esto es necesario para que
// las cookies "secure" funcionen correctamente.
app.set("trust proxy", 1);

// FRONTEND_URL puede traer una o varias URLs separadas por coma
// (útil para tener la de Vercel de producción y previews a la vez).
const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",")
  .map((url) => url.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Permite peticiones sin origin (curl, health checks) y las de la lista.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("No permitido por CORS"));
  },
  credentials: true
}));

app.use(express.json());

const isProduction = process.env.NODE_ENV === "production";

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // En producción el frontend (Vercel) y el backend (Render) son
      // dominios distintos, por lo que la cookie debe ser "cross-site".
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    },
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
const docenteDashboardRoutes = require("./routes/Docente/docenteDashboard");
const adminReportesRoutes = require("./routes/Admin/adminReportes");
const adminPerfilRoutes = require("./routes/Admin/adminPerfil");
const docentePerfilRoutes = require("./routes/Docente/docentePerfil");
const estudiantePerfilRoutes = require("./routes/Estudiante/estudiantePerfil");
const docenteEvaluacionesRoutes = require("./routes/Docente/docenteEvaluaciones");
const estudianteEvaluacionesRoutes = require("./routes/Estudiante/estdianteEvaluaciones");
const adminSeguimientoRoutes = require("./routes/Admin/adminSeguimiento");

app.use("/api/auth", authRoutes);
app.use("/api/users", exportUsersRoutes);
app.use("/api/adminUsuarios", adminUsuariosRoutes);
app.use("/api/adminRap", adminRapRoutes);
app.use("/api/adminCompo", adminCompoRoutes);
app.use("/api/admin/evaluaciones", adminEvaluacionesRoutes);
app.use("/api/estudiante", estudianteRoutes);
app.use("/api/docente", docenteDashboardRoutes);
app.use("/api/admin/reportes", adminReportesRoutes);
app.use("/api/admin/Perfil", adminPerfilRoutes);
app.use("/api/docente/Perfil", docentePerfilRoutes);
app.use("/api/estudiante/Perfil", estudiantePerfilRoutes);
app.use("/api/docente/evaluaciones", docenteEvaluacionesRoutes);
app.use("/api/estudiante/evaluaciones", estudianteEvaluacionesRoutes);
app.use("/api/admin/seguimiento", adminSeguimientoRoutes);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});