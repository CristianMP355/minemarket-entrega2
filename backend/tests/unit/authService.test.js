const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} = require('../../src/services/authService');

describe('authService - bcrypt', () => {
  it('genera un hash bcrypt distinto a la contraseña en texto plano', async () => {
    const hash = await hashPassword('Steve12345');
    expect(hash).not.toBe('Steve12345');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('genera hashes distintos para la misma contraseña (salt aleatorio)', async () => {
    const [h1, h2] = await Promise.all([hashPassword('Steve12345'), hashPassword('Steve12345')]);
    expect(h1).not.toBe(h2);
  });

  it('comparePassword retorna true con la contraseña correcta', async () => {
    const hash = await hashPassword('Creeper2024');
    await expect(comparePassword('Creeper2024', hash)).resolves.toBe(true);
  });

  it('comparePassword retorna false con una contraseña incorrecta', async () => {
    const hash = await hashPassword('Creeper2024');
    await expect(comparePassword('Enderman2024', hash)).resolves.toBe(false);
  });
});

describe('authService - JWT', () => {
  const usuario = {
    id_usuario: 7,
    email: 'alex@minemarket.com',
    rol: 'VENDEDOR',
    gamertag_minecraft: 'AlexCrafter',
  };

  it('genera un JWT firmado con id, email, rol y gamertag', () => {
    const token = generateToken(usuario);
    expect(token.split('.')).toHaveLength(3);

    const payload = verifyToken(token);
    expect(payload).toMatchObject({ sub: 7, email: 'alex@minemarket.com', rol: 'VENDEDOR', gamertag: 'AlexCrafter' });
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it('no incluye la contraseña ni el hash en el payload', () => {
    const payload = verifyToken(generateToken({ ...usuario, password_hash: 'secreto' }));
    expect(payload).not.toHaveProperty('password_hash');
  });

  it('rechaza un token firmado con otro secreto', () => {
    const forged = jwt.sign({ sub: 1, rol: 'ADMIN' }, 'secreto-falso');
    expect(() => verifyToken(forged)).toThrow(jwt.JsonWebTokenError);
  });

  it('rechaza un token expirado', () => {
    const expired = jwt.sign({ sub: 1, exp: Math.floor(Date.now() / 1000) - 10 }, config.jwtSecret);
    expect(() => verifyToken(expired)).toThrow(jwt.TokenExpiredError);
  });
});
