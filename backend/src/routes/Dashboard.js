const express = require("express");
const router = express.Router();

const passport = require("../config/passport");

const {
  obtenerUsuarioActual,
  loginAdmin,
  googleCallback,
  testLoginEstudiante,
  testLoginDocente

} = require("../controllers/authController");

router.get("/me", obtenerUsuarioActual);
router.post("/admin-login", loginAdmin);
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"]
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0]
  }),
  googleCallback
);

router.post(
  "/test-login-estudiante",
  testLoginEstudiante
);

router.post(
  "/test-login-docente",
  testLoginDocente
);

module.exports = router;