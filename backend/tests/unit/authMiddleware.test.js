const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { authenticate, authorize } = require('../../src/middleware/auth');
const { generateToken } = require('../../src/services/authService');

const buildReq = (authorization) => ({ headers: authorization ? { authorization } : {} });

describe('middleware authenticate', () => {
  it('adjunta req.user cuando el token Bearer es válido', () => {
    const token = generateToken({ id_usuario: 3, email: 'v@mm.com', rol: 'VENDEDOR', gamertag_minecraft: 'Vendedor1' });
    const req = buildReq(`Bearer ${token}`);
    const next = jest.fn();

    authenticate(req, {}, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual({ id: 3, email: 'v@mm.com', rol: 'VENDEDOR', gamertag: 'Vendedor1' });
  });

  it.each([
    ['sin header', undefined],
    ['esquema distinto a Bearer', 'Basic abc123'],
    ['Bearer sin token', 'Bearer'],
  ])('responde 401 %s', (_caso, header) => {
    const next = jest.fn();
    authenticate(buildReq(header), {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, message: 'Token de autenticación requerido' });
  });

  it('responde 401 "Token inválido" con un token manipulado', () => {
    const next = jest.fn();
    authenticate(buildReq('Bearer esto.no.esunjwt'), {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, message: 'Token inválido' });
  });

  it('responde 401 "El token ha expirado" con un token vencido', () => {
    const expired = jwt.sign({ sub: 1, exp: Math.floor(Date.now() / 1000) - 60 }, config.jwtSecret);
    const next = jest.fn();
    authenticate(buildReq(`Bearer ${expired}`), {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401, message: 'El token ha expirado' });
  });
});

describe('middleware RBAC authorize', () => {
  const soloVendedores = authorize('VENDEDOR', 'ADMIN');

  it.each(['VENDEDOR', 'ADMIN'])('permite el acceso al rol %s', (rol) => {
    const next = jest.fn();
    soloVendedores({ user: { id: 1, rol } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('responde 403 a un COMPRADOR', () => {
    const next = jest.fn();
    soloVendedores({ user: { id: 1, rol: 'COMPRADOR' } }, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 403 });
  });

  it('responde 401 si no hay usuario autenticado', () => {
    const next = jest.fn();
    soloVendedores({}, {}, next);
    expect(next.mock.calls[0][0]).toMatchObject({ status: 401 });
  });
});
