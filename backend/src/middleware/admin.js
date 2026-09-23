function verificarAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      mensaje: "No está autenticado"
    });
  }

  if (Number(req.user.id_rol) !== 4) {
    return res.status(403).json({
      success: false,
      mensaje: "No tiene permisos de administrador"
    });
  }

  next();
}

module.exports = verificarAdmin;