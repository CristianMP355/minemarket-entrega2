import { describe, expect, it } from 'vitest';
import { ApiError, authApi, itemsApi } from '../../src/services/api.js';
import { jsonResponse, mockFetch } from '../helpers.js';

describe('authApi', () => {
  it('login envía email y password por POST y retorna el token', async () => {
    const fetchMock = mockFetch(jsonResponse(200, { token: 'abc', usuario: { id_usuario: 1 } }));

    const res = await authApi.login('steve@mm.com', 'Clave1234');

    expect(res.token).toBe('abc');
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/auth/login');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({ email: 'steve@mm.com', password: 'Clave1234' });
  });

  it('lanza ApiError con status, mensaje y detalles cuando el backend responde error', async () => {
    mockFetch(jsonResponse(400, { error: 'Datos de registro inválidos', detalles: ['El email no es válido'] }));

    const promise = authApi.register({ email: 'x' });
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ status: 400, detalles: ['El email no es válido'] });
  });

  it('usa un mensaje genérico si la respuesta de error no es JSON', async () => {
    mockFetch(jsonResponse(500));
    await expect(authApi.login('a', 'b')).rejects.toThrow('Error de comunicación con el servidor');
  });
});

describe('itemsApi', () => {
  it('list construye la query string con los filtros', async () => {
    const fetchMock = mockFetch(jsonResponse(200, []), jsonResponse(200, []));
    await itemsApi.list({ tipo: 'KIT', q: 'sky block' });
    await itemsApi.list();
    expect(fetchMock.mock.calls[0][0]).toBe('/api/items?tipo=KIT&q=sky+block');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/items');
  });

  it('create, update y remove envían el token Bearer', async () => {
    const fetchMock = mockFetch(jsonResponse(201, {}), jsonResponse(200, {}), { ok: true, status: 204 });

    await itemsApi.create({ nombre: 'X' }, 'tok');
    await itemsApi.update(3, { precio: 10 }, 'tok');
    const removed = await itemsApi.remove(3, 'tok');

    expect(removed).toBeNull();
    expect(fetchMock.mock.calls.map(([url, o]) => `${o.method} ${url}`)).toEqual([
      'POST /api/items',
      'PUT /api/items/3',
      'DELETE /api/items/3',
    ]);
    fetchMock.mock.calls.forEach(([, o]) => expect(o.headers.Authorization).toBe('Bearer tok'));
    expect(fetchMock.mock.calls[2][1].headers['Content-Type']).toBeUndefined();
  });
});
