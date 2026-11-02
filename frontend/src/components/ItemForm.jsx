import { useState } from 'react';
import { TIPOS_ITEM } from '../utils/format.js';

const empty = { nombre: '', descripcion: '', tipo: 'RANGO', precio: '', stock: '', servidor: '' };

/** Formulario para crear o editar un ITEM_DIGITAL. */
export default function ItemForm({ item, onSubmit, onCancel }) {
  const [form, setForm] = useState(item ? { ...empty, ...item } : empty);
  const [errors, setErrors] = useState([]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      tipo: form.tipo,
      precio: Number(form.precio),
      stock: Number(form.stock),
      servidor: form.servidor,
    };
    try {
      await onSubmit(payload);
    } catch (err) {
      setErrors(err.detalles?.length ? err.detalles : [err.message]);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} aria-label="Formulario de ítem">
      <h3>{item ? 'Editar ítem' : 'Publicar nuevo ítem'}</h3>
      <label>
        Nombre del ítem
        <input value={form.nombre} onChange={update('nombre')} required />
      </label>
      <label>
        Descripción
        <textarea value={form.descripcion} onChange={update('descripcion')} required />
      </label>
      <div className="row">
        <label>
          Tipo
          <select value={form.tipo} onChange={update('tipo')}>
            {TIPOS_ITEM.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Servidor
          <input value={form.servidor} onChange={update('servidor')} required />
        </label>
      </div>
      <div className="row">
        <label>
          Precio (COP)
          <input type="number" min="1" value={form.precio} onChange={update('precio')} required />
        </label>
        <label>
          Stock
          <input type="number" min="0" step="1" value={form.stock} onChange={update('stock')} required />
        </label>
      </div>
      {errors.length > 0 && (
        <ul role="alert" className="error">
          {errors.map((msg) => <li key={msg}>{msg}</li>)}
        </ul>
      )}
      <div className="row">
        <button type="submit">{item ? 'Guardar cambios' : 'Publicar ítem'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
