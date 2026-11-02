const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');

async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, config.bcryptSaltRounds);
}

async function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

function generateToken(usuario) {
  const payload = {
    sub: usuario.id_usuario,
    email: usuario.email,
    rol: usuario.rol,
    gamertag: usuario.gamertag_minecraft,
  };
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

/** Lanza un error de jsonwebtoken si el token es inválido o expiró. */
function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

module.exports = { hashPassword, comparePassword, generateToken, verifyToken };
