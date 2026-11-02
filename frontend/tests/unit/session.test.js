import { describe, expect, it } from 'vitest';
import {
  canEditItem,
  canManageItems,
  clearSession,
  decodeToken,
  isTokenExpired,
  loadSession,
  saveSession,
} from '../../src/utils/session.js';
import { fakeJwt, futureExp } from '../helpers.js';

describe('decodeToken', () => {
  it('decodifica el payload de un JWT, incluyendo caracteres especiales', () => {
    const token = fakeJwt({ sub: 1, gamertag: 'Ñandú_MC' });
    expect(decodeToken(token)).toMatchObject({ sub: 1, gamertag: 'Ñandú_MC' });
  });

  it('retorna null con un token mal formado', () => {
    expect(decodeToken('no-es-un-token')).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('detecta tokens vigentes y expirados', () => {
    expect(isTokenExpired(fakeJwt({ exp: futureExp() }))).toBe(false);
    expect(isTokenExpired(fakeJwt({ exp: 1000 }))).toBe(true);
  });

  it('considera expirado un token sin exp', () => {
    expect(isTokenExpired(fakeJwt({ sub: 1 }))).toBe(true);
  });
});

describe('persistencia de sesión', () => {
  const usuario = { id_usuario: 1, gamertag_minecraft: 'Steve', rol: 'VENDEDOR' };

  it('guarda y recupera una sesión vigente', () => {
    const token = fakeJwt({ exp: futureExp() });
    saveSession(token, usuario);
    expect(loadSession()).toEqual({ token, usuario });
  });

  it('descarta una sesión con token expirado', () => {
    saveSession(fakeJwt({ exp: 1 }), usuario);
    expect(loadSession()).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('descarta datos corruptos en localStorage', () => {
    localStorage.setItem('minemarket_session', '{corrupto');
    expect(loadSession()).toBeNull();
  });

  it('clearSession elimina la sesión', () => {
    saveSession(fakeJwt({ exp: futureExp() }), usuario);
    clearSession();
    expect(loadSession()).toBeNull();
  });
});

describe('permisos en cliente (RBAC)', () => {
  const item = { id_item: 1, id_vendedor: 5 };

  it('solo VENDEDOR y ADMIN pueden gestionar ítems', () => {
    expect(canManageItems({ rol: 'VENDEDOR' })).toBe(true);
    expect(canManageItems({ rol: 'ADMIN' })).toBe(true);
    expect(canManageItems({ rol: 'COMPRADOR' })).toBe(false);
    expect(canManageItems(null)).toBe(false);
  });

  it('un vendedor solo edita sus ítems; el admin edita todos', () => {
    expect(canEditItem({ rol: 'VENDEDOR', id_usuario: 5 }, item)).toBe(true);
    expect(canEditItem({ rol: 'VENDEDOR', id_usuario: 6 }, item)).toBe(false);
    expect(canEditItem({ rol: 'ADMIN', id_usuario: 1 }, item)).toBe(true);
    expect(canEditItem(undefined, item)).toBe(false);
  });
});
