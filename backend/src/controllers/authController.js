const { usuarioRepo } = require('../data/store');
const { hashPassword, comparePassword, generateToken } = require('../services/authService');
const { validateRegister, validateLogin } = require('../utils/validators');
const { ROLES } = require('../utils/constants');
const HttpError = require('../utils/httpError');

/** Nunca exponer el hash de la contraseña. */
const toPublicUser = ({ password_hash: _omit, ...usuario }) => usuario;

async function register(req, res, next) {
  try {
    const errors = validateRegister(req.body);
    if (errors.length) throw new HttpError(400, 'Datos de registro inválidos', errors);

    const { nombre, email, password, gamertag_minecraft: gamertag, rol } = req.body;
    if (usuarioRepo.findByEmail(email)) throw new HttpError(409, 'El email ya está registrado');
    if (usuarioRepo.findByGamertag(gamertag)) throw new HttpError(409, 'El gamertag ya está registrado');

    const usuario = usuarioRepo.create({
      nombre,
      email,
      password_hash: await hashPassword(password),
      gamertag_minecraft: gamertag,
      rol: rol || ROLES.COMPRADOR,
    });

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente', usuario: toPublicUser(usuario) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const errors = validateLogin(req.body);
    if (errors.length) throw new HttpError(400, 'Datos de login inválidos', errors);

    const usuario = usuarioRepo.findByEmail(req.body.email);
    // Mismo mensaje en ambos casos para no revelar qué emails existen.
    const valid = usuario && (await comparePassword(req.body.password, usuario.password_hash));
    if (!valid) throw new HttpError(401, 'Credenciales inválidas');

    res.json({ token: generateToken(usuario), usuario: toPublicUser(usuario) });
  } catch (err) {
    next(err);
  }
}

function me(req, res, next) {
  const usuario = usuarioRepo.findById(req.user.id);
  if (!usuario) return next(new HttpError(404, 'Usuario no encontrado'));
  return res.json({ usuario: toPublicUser(usuario) });
}

module.exports = { register, login, me, toPublicUser };
