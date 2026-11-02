const STORAGE_KEY = 'minemarket_session';

/** Decodifica el payload de un JWT (sin verificar la firma: eso lo hace el backend). */
export function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token, now = Date.now()) {
  const payload = decodeToken(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= now;
}

export function saveSession(token, usuario) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, usuario }));
}

/** Retorna la sesión guardada, o null si no existe o el token expiró. */
export function loadSession() {
  try {
    const session = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!session?.token || isTokenExpired(session.token)) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export const canManageItems = (usuario) => ['VENDEDOR', 'ADMIN'].includes(usuario?.rol);

export const canEditItem = (usuario, item) =>
  usuario?.rol === 'ADMIN' || (usuario?.rol === 'VENDEDOR' && item.id_vendedor === usuario.id_usuario);
