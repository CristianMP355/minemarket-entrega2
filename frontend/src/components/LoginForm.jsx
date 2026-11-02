import { useState } from 'react';
import { authApi } from '../services/api.js';

export default function LoginForm({ onLogin, onGoToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, usuario } = await authApi.login(email, password);
      onLogin(token, usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} aria-label="Formulario de inicio de sesión">
      <h2>Iniciar sesión</h2>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        Contraseña
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p role="alert" className="error">{error}</p>}
      <button type="submit" disabled={loading}>{loading ? 'Ingresando...' : 'Ingresar'}</button>
      <p className="muted">
        ¿No tienes cuenta?{' '}
        <button type="button" className="link" onClick={onGoToRegister}>Regístrate</button>
      </p>
    </form>
  );
}
