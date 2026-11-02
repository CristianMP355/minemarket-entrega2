export const TIPOS_ITEM = ['RANGO', 'KIT', 'LLAVE', 'COSMETICO', 'MONEDA'];

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export const formatPrecio = (valor) => copFormatter.format(valor);
