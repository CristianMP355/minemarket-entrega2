const { ROLES_REGISTRABLES, TIPOS_ITEM } = require('./constants');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Reglas oficiales de Minecraft Java: 3-16 caracteres, letras, números y guion bajo.
const GAMERTAG_REGEX = /^\w{3,16}$/;
// Mínimo 8 caracteres, al menos una letra y un número.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

function validateRegister(body = {}) {
  const errors = [];
  const { nombre, email, password, gamertag_minecraft: gamertag, rol } = body;

  if (!isNonEmptyString(nombre)) errors.push('El nombre es obligatorio');
  if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email)) errors.push('El email no es válido');
  if (typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
    errors.push('La contraseña debe tener mínimo 8 caracteres, con letras y números');
  }
  if (typeof gamertag !== 'string' || !GAMERTAG_REGEX.test(gamertag)) {
    errors.push('El gamertag de Minecraft debe tener 3-16 caracteres (letras, números o _)');
  }
  if (rol !== undefined && !ROLES_REGISTRABLES.includes(rol)) {
    errors.push(`El rol debe ser uno de: ${ROLES_REGISTRABLES.join(', ')}`);
  }
  return errors;
}

function validateLogin(body = {}) {
  const errors = [];
  if (!isNonEmptyString(body.email)) errors.push('El email es obligatorio');
  if (!isNonEmptyString(body.password)) errors.push('La contraseña es obligatoria');
  return errors;
}

/**
 * Valida los datos de un ítem digital.
 * @param {object} body datos recibidos
 * @param {boolean} partial si es true (PUT), solo valida los campos presentes
 */
function validateItem(body = {}, partial = false) {
  const errors = [];
  const has = (field) => body[field] !== undefined;
  const check = (field, valid, message) => {
    if ((!partial || has(field)) && !valid) errors.push(message);
  };

  check('nombre', isNonEmptyString(body.nombre), 'El nombre del ítem es obligatorio');
  check('descripcion', isNonEmptyString(body.descripcion), 'La descripción es obligatoria');
  check('tipo', TIPOS_ITEM.includes(body.tipo), `El tipo debe ser uno de: ${TIPOS_ITEM.join(', ')}`);
  check(
    'precio',
    typeof body.precio === 'number' && Number.isFinite(body.precio) && body.precio > 0,
    'El precio debe ser un número mayor a 0',
  );
  check('stock', Number.isInteger(body.stock) && body.stock >= 0, 'El stock debe ser un entero mayor o igual a 0');
  check('servidor', isNonEmptyString(body.servidor), 'El servidor de Minecraft es obligatorio');

  if (partial && Object.keys(body).length === 0) errors.push('No se enviaron campos para actualizar');
  return errors;
}

module.exports = { validateRegister, validateLogin, validateItem };
