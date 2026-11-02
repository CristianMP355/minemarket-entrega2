const ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  VENDEDOR: 'VENDEDOR',
  COMPRADOR: 'COMPRADOR',
});

// Roles que un usuario puede elegir al registrarse (ADMIN no es auto-asignable).
const ROLES_REGISTRABLES = [ROLES.VENDEDOR, ROLES.COMPRADOR];

const TIPOS_ITEM = Object.freeze(['RANGO', 'KIT', 'LLAVE', 'COSMETICO', 'MONEDA']);

module.exports = { ROLES, ROLES_REGISTRABLES, TIPOS_ITEM };
