import { useCallback, useEffect, useState } from 'react';
import { itemsApi } from '../services/api.js';
import { canEditItem, canManageItems } from '../utils/session.js';
import { TIPOS_ITEM } from '../utils/format.js';
import ItemCard from './ItemCard.jsx';
import ItemForm from './ItemForm.jsx';

/** Panel/catálogo de ítems digitales con filtros y CRUD según el rol. */
export default function Catalog({ session, onAuthError }) {
  const [items, setItems] = useState([]);
  const [filtros, setFiltros] = useState({ tipo: '', q: '' });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(null); // null | 'nuevo' | item

  const usuario = session?.usuario;
  const token = session?.token;

  const cargar = useCallback(async () => {
    try {
      setError('');
      setItems(await itemsApi.list(filtros));
    } catch (err) {
      setError(err.message);
    }
  }, [filtros]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function handleApiError(err) {
    if (err.status === 401) onAuthError?.();
    throw err;
  }

  async function guardar(payload) {
    try {
      if (editando === 'nuevo') {
        await itemsApi.create(payload, token);
        setMensaje('Ítem publicado exitosamente');
      } else {
        await itemsApi.update(editando.id_item, payload, token);
        setMensaje('Ítem actualizado exitosamente');
      }
      setEditando(null);
      await cargar();
    } catch (err) {
      handleApiError(err);
    }
  }

  async function eliminar(item) {
    if (!window.confirm(`¿Eliminar "${item.nombre}" del catálogo?`)) return;
    try {
      await itemsApi.remove(item.id_item, token);
      setMensaje('Ítem eliminado');
      await cargar();
    } catch (err) {
      if (err.status === 401) onAuthError?.();
      setError(err.message);
    }
  }

  return (
    <section>
      <div className="toolbar">
        <h2>Catálogo de ítems digitales</h2>
        {canManageItems(usuario) && editando === null && (
          <button type="button" onClick={() => { setMensaje(''); setEditando('nuevo'); }}>
            + Publicar ítem
          </button>
        )}
      </div>

      <div className="filters">
        <input
          type="search"
          placeholder="Buscar por nombre o servidor..."
          aria-label="Buscar"
          value={filtros.q}
          onChange={(e) => setFiltros({ ...filtros, q: e.target.value })}
        />
        <select
          aria-label="Filtrar por tipo"
          value={filtros.tipo}
          onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
        >
          <option value="">Todos los tipos</option>
          {TIPOS_ITEM.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {mensaje && <p className="success" role="status">{mensaje}</p>}
      {error && <p className="error" role="alert">{error}</p>}

      {editando !== null && (
        <ItemForm
          key={editando === 'nuevo' ? 'nuevo' : editando.id_item}
          item={editando === 'nuevo' ? null : editando}
          onSubmit={guardar}
          onCancel={() => setEditando(null)}
        />
      )}

      {items.length === 0 ? (
        <p className="muted">No hay ítems que coincidan con la búsqueda.</p>
      ) : (
        <div className="grid">
          {items.map((item) => (
            <ItemCard
              key={item.id_item}
              item={item}
              editable={canEditItem(usuario, item)}
              onEdit={(i) => { setMensaje(''); setEditando(i); }}
              onDelete={eliminar}
            />
          ))}
        </div>
      )}
    </section>
  );
}
