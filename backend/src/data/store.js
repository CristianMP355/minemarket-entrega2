/**
 * Almacenamiento en memoria para USUARIO e ITEM_DIGITAL.
 * Expone una interfaz tipo repositorio para poder reemplazarlo luego por una BD real
 * (PostgreSQL/MySQL) sin modificar controladores.
 */
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

let usuarios = [];
let items = [];
let nextUsuarioId = 1;
let nextItemId = 1;

const clone = (obj) => (obj ? { ...obj } : null);

// ---------- USUARIO ----------
const usuarioRepo = {
  findByEmail(email) {
    const normalized = String(email).trim().toLowerCase();
    return clone(usuarios.find((u) => u.email === normalized));
  },
  findByGamertag(gamertag) {
    const normalized = String(gamertag).toLowerCase();
    return clone(usuarios.find((u) => u.gamertag_minecraft.toLowerCase() === normalized));
  },
  findById(id) {
    return clone(usuarios.find((u) => u.id_usuario === Number(id)));
  },
  create({ nombre, email, password_hash: passwordHash, gamertag_minecraft: gamertag, rol }) {
    const usuario = {
      id_usuario: nextUsuarioId++,
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      gamertag_minecraft: gamertag,
      rol,
      fecha_registro: new Date().toISOString(),
    };
    usuarios.push(usuario);
    return clone(usuario);
  },
};

// ---------- ITEM_DIGITAL ----------
const itemRepo = {
  findAll({ tipo, q } = {}) {
    let result = items;
    if (tipo) result = result.filter((i) => i.tipo === tipo);
    if (q) {
      const term = String(q).toLowerCase();
      result = result.filter(
        (i) => i.nombre.toLowerCase().includes(term) || i.servidor.toLowerCase().includes(term),
      );
    }
    return result.map(clone);
  },
  findById(id) {
    return clone(items.find((i) => i.id_item === Number(id)));
  },
  create(data, idVendedor) {
    const item = {
      id_item: nextItemId++,
      nombre: data.nombre.trim(),
      descripcion: data.descripcion.trim(),
      tipo: data.tipo,
      precio: data.precio,
      stock: data.stock,
      servidor: data.servidor.trim(),
      id_vendedor: idVendedor,
      fecha_creacion: new Date().toISOString(),
    };
    items.push(item);
    return clone(item);
  },
  update(id, changes) {
    const idx = items.findIndex((i) => i.id_item === Number(id));
    if (idx === -1) return null;
    const allowed = ['nombre', 'descripcion', 'tipo', 'precio', 'stock', 'servidor'];
    const filtered = Object.fromEntries(Object.entries(changes).filter(([k]) => allowed.includes(k)));
    items[idx] = { ...items[idx], ...filtered, fecha_actualizacion: new Date().toISOString() };
    return clone(items[idx]);
  },
  remove(id) {
    const before = items.length;
    items = items.filter((i) => i.id_item !== Number(id));
    return items.length < before;
  },
};

/** Reinicia el almacenamiento y carga datos semilla (usado al iniciar y en pruebas). */
function reset({ seed = true } = {}) {
  usuarios = [];
  items = [];
  nextUsuarioId = 1;
  nextItemId = 1;
  if (!seed) return;

  const admin = usuarioRepo.create({
    nombre: 'Administrador',
    email: 'admin@minemarket.com',
    password_hash: bcrypt.hashSync('Admin1234', 10),
    gamertag_minecraft: 'MineAdmin',
    rol: ROLES.ADMIN,
  });

  const seedItems = [
    { nombre: 'Rango VIP', descripcion: 'Acceso a /fly y kits exclusivos por 30 días', tipo: 'RANGO', precio: 15000, stock: 100, servidor: 'CraftLand' },
    { nombre: 'Kit Guerrero', descripcion: 'Armadura de diamante encantada y espada Filo V', tipo: 'KIT', precio: 8000, stock: 50, servidor: 'CraftLand' },
    { nombre: 'Llave Legendaria', descripcion: 'Abre una caja de recompensas legendaria', tipo: 'LLAVE', precio: 5000, stock: 200, servidor: 'SkyBlock Andino' },
  ];
  seedItems.forEach((item) => itemRepo.create(item, admin.id_usuario));
}

reset();

module.exports = { usuarioRepo, itemRepo, reset };
