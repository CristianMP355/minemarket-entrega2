const { validateRegister, validateLogin, validateItem } = require('../../src/utils/validators');

describe('validateRegister', () => {
  const valido = {
    nombre: 'Steve',
    email: 'steve@minemarket.com',
    password: 'Diamante123',
    gamertag_minecraft: 'Steve_MC',
    rol: 'VENDEDOR',
  };

  it('acepta datos válidos', () => {
    expect(validateRegister(valido)).toEqual([]);
  });

  it('acepta un registro sin rol (se asignará COMPRADOR)', () => {
    const { rol: _rol, ...sinRol } = valido;
    expect(validateRegister(sinRol)).toEqual([]);
  });

  it('rechaza un gamertag con caracteres inválidos o longitud incorrecta', () => {
    expect(validateRegister({ ...valido, gamertag_minecraft: 'ab' })).toHaveLength(1);
    expect(validateRegister({ ...valido, gamertag_minecraft: 'Steve-MC!' })).toHaveLength(1);
    expect(validateRegister({ ...valido, gamertag_minecraft: 'a'.repeat(17) })).toHaveLength(1);
  });

  it('rechaza contraseñas débiles', () => {
    expect(validateRegister({ ...valido, password: 'corta1' })).toHaveLength(1);
    expect(validateRegister({ ...valido, password: 'solamenteletras' })).toHaveLength(1);
  });

  it('no permite auto-asignarse el rol ADMIN', () => {
    expect(validateRegister({ ...valido, rol: 'ADMIN' })[0]).toMatch(/rol/);
  });

  it('reporta todos los errores cuando el cuerpo está vacío', () => {
    expect(validateRegister()).toHaveLength(4);
  });
});

describe('validateLogin', () => {
  it('exige email y contraseña', () => {
    expect(validateLogin({})).toHaveLength(2);
    expect(validateLogin({ email: 'a@b.co', password: 'x' })).toEqual([]);
  });
});

describe('validateItem', () => {
  const item = {
    nombre: 'Rango MVP',
    descripcion: 'Rango con beneficios',
    tipo: 'RANGO',
    precio: 20000,
    stock: 10,
    servidor: 'CraftLand',
  };

  it('acepta un ítem completo y válido', () => {
    expect(validateItem(item)).toEqual([]);
  });

  it('rechaza tipo, precio y stock inválidos', () => {
    const errors = validateItem({ ...item, tipo: 'ESPADA', precio: -5, stock: 1.5 });
    expect(errors).toHaveLength(3);
  });

  it('en modo parcial solo valida los campos enviados', () => {
    expect(validateItem({ precio: 9999 }, true)).toEqual([]);
    expect(validateItem({ precio: 0 }, true)).toHaveLength(1);
  });

  it('en modo parcial rechaza un cuerpo vacío', () => {
    expect(validateItem({}, true)).toEqual(['No se enviaron campos para actualizar']);
  });
});
