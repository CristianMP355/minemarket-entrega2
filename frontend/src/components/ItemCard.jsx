import { formatPrecio } from '../utils/format.js';

export default function ItemCard({ item, editable, onEdit, onDelete }) {
  return (
    <article className="card item-card" data-testid="item-card" aria-label={item.nombre}>
      <span className={`badge badge-${item.tipo.toLowerCase()}`}>{item.tipo}</span>
      <h3>{item.nombre}</h3>
      <p>{item.descripcion}</p>
      <p className="muted">Servidor: <strong>{item.servidor}</strong></p>
      <div className="item-footer">
        <span className="price">{formatPrecio(item.precio)}</span>
        <span className={item.stock > 0 ? 'stock' : 'stock agotado'}>
          {item.stock > 0 ? `Stock: ${item.stock}` : 'Agotado'}
        </span>
      </div>
      {editable && (
        <div className="row">
          <button type="button" className="secondary" onClick={() => onEdit(item)}>Editar</button>
          <button type="button" className="danger" onClick={() => onDelete(item)}>Eliminar</button>
        </div>
      )}
    </article>
  );
}
