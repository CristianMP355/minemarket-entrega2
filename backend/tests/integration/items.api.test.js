const request = require('supertest');
const app = require('../../src/app');
const { reset } = require('../../src/data/store');

const itemNuevo = {
  nombre: 'Kit Minero',
  descripcion: 'Pico de diamante Eficiencia V y antorchas',
  tipo: 'KIT',
  precio: 4500,
  stock: 30,
  servidor: 'CraftLand',
};

async function registrarYLogin(datos) {
  await request(app).post('/api/auth/register').send(datos);
  const res = await request(app).post('/api/auth/login').send({ email: datos.email, password: datos.password });
  return res.body.token;
}

const vendedorA = { nombre: 'A', email: 'a@mm.com', password: 'Vendedor1', gamertag_minecraft: 'VendedorA', rol: 'VENDEDOR' };
const vendedorB = { nombre: 'B', email: 'b@mm.com', password: 'Vendedor2', gamertag_minecraft: 'VendedorB', rol: 'VENDEDOR' };
const comprador = { nombre: 'C', email: 'c@mm.com', password: 'Comprador1', gamertag_minecraft: 'Comprador', rol: 'COMPRADOR' };

let tokenA;
let tokenB;
let tokenComprador;
let tokenAdmin;

beforeEach(async () => {
  reset();
  [tokenA, tokenB, tokenComprador] = await Promise.all([
    registrarYLogin(vendedorA),
    registrarYLogin(vendedorB),
    registrarYLogin(comprador),
  ]);
  const admin = await request(app).post('/api/auth/login').send({ email: 'admin@minemarket.com', password: 'Admin1234' });
  tokenAdmin = admin.body.token;
});

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe('GET /api/items (catálogo público)', () => {
  it('lista los ítems semilla sin autenticación', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
  });

  it('filtra por tipo y por texto', async () => {
    const porTipo = await request(app).get('/api/items?tipo=LLAVE');
    expect(porTipo.body.map((i) => i.tipo)).toEqual(['LLAVE']);

    const porTexto = await request(app).get('/api/items?q=skyblock');
    expect(porTexto.body).toHaveLength(1);
  });

  it('obtiene un ítem por id y responde 404 si no existe', async () => {
    expect((await request(app).get('/api/items/1')).body.nombre).toBe('Rango VIP');
    expect((await request(app).get('/api/items/999')).status).toBe(404);
  });
});

describe('POST /api/items', () => {
  it('un VENDEDOR crea un ítem asociado a su id', async () => {
    const res = await request(app).post('/api/items').set(auth(tokenA)).send(itemNuevo);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ ...itemNuevo, id_item: 4 });
    expect(res.body.id_vendedor).toBeDefined();
  });

  it('responde 401 sin token', async () => {
    expect((await request(app).post('/api/items').send(itemNuevo)).status).toBe(401);
  });

  it('responde 403 a un COMPRADOR (RBAC)', async () => {
    expect((await request(app).post('/api/items').set(auth(tokenComprador)).send(itemNuevo)).status).toBe(403);
  });

  it('responde 400 con datos inválidos', async () => {
    const res = await request(app).post('/api/items').set(auth(tokenA)).send({ ...itemNuevo, precio: 0 });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/items/:id', () => {
  let idItem;
  beforeEach(async () => {
    idItem = (await request(app).post('/api/items').set(auth(tokenA)).send(itemNuevo)).body.id_item;
  });

  it('el propietario actualiza precio y stock', async () => {
    const res = await request(app).put(`/api/items/${idItem}`).set(auth(tokenA)).send({ precio: 3900, stock: 25 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ precio: 3900, stock: 25, nombre: 'Kit Minero' });
  });

  it('ignora campos no editables como id_vendedor', async () => {
    const original = (await request(app).get(`/api/items/${idItem}`)).body;
    const res = await request(app).put(`/api/items/${idItem}`).set(auth(tokenA)).send({ id_vendedor: 999, stock: 1 });
    expect(res.body.id_vendedor).toBe(original.id_vendedor);
  });

  it('responde 403 si otro vendedor intenta editarlo', async () => {
    expect((await request(app).put(`/api/items/${idItem}`).set(auth(tokenB)).send({ precio: 1 })).status).toBe(403);
  });

  it('un ADMIN puede editar cualquier ítem', async () => {
    expect((await request(app).put(`/api/items/${idItem}`).set(auth(tokenAdmin)).send({ stock: 0 })).status).toBe(200);
  });

  it('responde 400 con datos inválidos y 404 si no existe', async () => {
    expect((await request(app).put(`/api/items/${idItem}`).set(auth(tokenA)).send({ tipo: 'X' })).status).toBe(400);
    expect((await request(app).put('/api/items/999').set(auth(tokenA)).send({ stock: 1 })).status).toBe(404);
  });
});

describe('DELETE /api/items/:id', () => {
  let idItem;
  beforeEach(async () => {
    idItem = (await request(app).post('/api/items').set(auth(tokenA)).send(itemNuevo)).body.id_item;
  });

  it('responde 403 si lo intenta un vendedor no propietario', async () => {
    expect((await request(app).delete(`/api/items/${idItem}`).set(auth(tokenB))).status).toBe(403);
  });

  it('el propietario elimina el ítem', async () => {
    expect((await request(app).delete(`/api/items/${idItem}`).set(auth(tokenA))).status).toBe(204);
    expect((await request(app).get(`/api/items/${idItem}`)).status).toBe(404);
  });

  it('responde 404 al eliminar un ítem inexistente', async () => {
    expect((await request(app).delete('/api/items/999').set(auth(tokenAdmin))).status).toBe(404);
  });
});

describe('Aplicación', () => {
  it('GET /api/health responde ok', async () => {
    expect((await request(app).get('/api/health')).body.status).toBe('ok');
  });

  it('responde 404 en rutas desconocidas', async () => {
    expect((await request(app).get('/api/no-existe')).status).toBe(404);
  });

  it('responde 400 con JSON mal formado', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('JSON mal formado');
  });
});
