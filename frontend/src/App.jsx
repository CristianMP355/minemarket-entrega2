import { useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import Catalog from './components/Catalog.jsx';
import { clearSession, loadSession, saveSession } from './utils/session.js';

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [vista, setVista] = useState('catalogo'); // 'catalogo' | 'login' | 'registro'
  const [aviso, setAviso] = useState('');

  function handleLogin(token, usuario) {
    saveSession(token, usuario);
    setSession({ token, usuario });
    setAviso('');
    setVista('catalogo');
  }

  function handleLogout(mensaje = '') {
    clearSession();
    setSession(null);
    setAviso(mensaje);
    setVista('login');
  }

  function handleRegistered() {
    setAviso('Registro exitoso. Ahora puedes iniciar sesión.');
    setVista('login');
  }

  return (
    <>
      <header className="navbar">
        <button type="button" className="brand" onClick={() => setVista('catalogo')}>⛏ MineMarket</button>
        <nav>
          {session ? (
            <>
              <span className="user-chip" data-testid="user-chip">
                {session.usuario.gamertag_minecraft} · {session.usuario.rol}
              </span>
              <button type="button" className="secondary" onClick={() => handleLogout()}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <button type="button" className="secondary" onClick={() => { setAviso(''); setVista('login'); }}>Iniciar sesión</button>
              <button type="button" onClick={() => { setAviso(''); setVista('registro'); }}>Registrarse</button>
            </>
          )}
        </nav>
      </header>

      <main className="container">
        {aviso && <p className="success" role="status">{aviso}</p>}
        {vista === 'login' && !session && (
          <LoginForm onLogin={handleLogin} onGoToRegister={() => { setAviso(''); setVista('registro'); }} />
        )}
        {vista === 'registro' && !session && (
          <RegisterForm onRegistered={handleRegistered} onGoToLogin={() => setVista('login')} />
        )}
        {(vista === 'catalogo' || session) && (
          <Catalog session={session} onAuthError={() => handleLogout('Tu sesión expiró, inicia sesión nuevamente.')} />
        )}
      </main>
    </>
  );
}
