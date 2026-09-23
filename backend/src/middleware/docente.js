function verificarDocente(req, res, next) {

  if (!req.isAuthenticated || !req.isAuthenticated()) {

    return res.status(401).json({
      success: false,
      mensaje: "No está autenticado"
    });

  }

  if (Number(req.user.id_rol) !== 5) {

    return res.status(403).json({
      success: false,
      mensaje: "No tiene permisos de docente"
    });

  }

  next();
}

module.exports = verificarDocente;

