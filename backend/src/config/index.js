const config = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET || 'minemarket-dev-secret-cambiar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 10,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

module.exports = config;
