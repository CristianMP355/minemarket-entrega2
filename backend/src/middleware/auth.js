const { verifyToken } = require('../services/authService');
const HttpError = require('../utils/httpError');

/** Verifica el JWT enviado en el header Authorization: Bearer <token>. */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Token de autenticación requerido'));
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email, rol: payload.rol, gamertag: payload.gamertag };
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'El token ha expirado' : 'Token inválido';
    return next(new HttpError(401, message));
  }
}

/** Middleware RBAC: permite el acceso solo a los roles indicados. */
function authorize(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) return next(new HttpError(401, 'No autenticado'));
    if (!rolesPermitidos.includes(req.user.rol)) {
      return next(new HttpError(403, 'No tienes permisos para realizar esta acción'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
