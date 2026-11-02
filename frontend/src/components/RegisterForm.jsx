import { useState } from 'react';
import { authApi } from '../services/api.js';

const initialState = { nombre: '', email: '', password: '', gamertag_minecraft: '', rol: 'COMPRADOR' };

export default function RegisterForm({ onRegistered, onGoToLogin }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    setLoading(true);
    try {
      await authApi.register(form);
      onRegistered(form.email);
    } catch (err) {
      setErrors(err.detalles?.length ? err.detalles : [err.message]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} aria-label="Formulario de registro">
      <h2>Crear cuenta</h2>
      <label>
        Nombre
        <input value={form.nombre} onChange={update('nombre')} required />
      </label>
      <label>
        Email
        <input type="email" value={form.email} onChange={update('email')} required />
      </label>
      <label>
        Contraseña
        <input type="password" value={form.password} onChange={update('password')} required minLength={8} />
      </label>
      <label>
        Gamertag de Minecraft
        <input
          value={form.gamertag_minecraft}
          onChange={update('gamertag_minecraft')}
          required
          pattern="\w{3,16}"
          title="3-16 caracteres: letras, números o _"
        />
      </label>
      <label>
        Tipo de cuenta
        <select value={form.rol} onChange={update('rol')}>
          <option value="COMPRADOR">Comprador</option>
          <option value="VENDEDOR">Vendedor</option>
        </select>
      </label>
      {errors.length > 0 && (
        <ul role="alert" className="error">
          {errors.map((msg) => <li key={msg}>{msg}</li>)}
        </ul>
      )}
      <button type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrarme'}</button>
      <p className="muted">
        ¿Ya tienes cuenta?{' '}
        <button type="button" className="link" onClick={onGoToLogin}>Inicia sesión</button>
      </p>
    </form>
  );
}
