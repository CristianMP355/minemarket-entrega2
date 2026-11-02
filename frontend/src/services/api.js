const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(status, message, detalles = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detalles = detalles;
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || 'Error de comunicación con el servidor', data.detalles);
  return data;
}

export const authApi = {
  register: (datos) => request('/auth/register', { method: 'POST', body: datos }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
};

export const itemsApi = {
  list: ({ tipo, q } = {}) => {
    const params = new URLSearchParams();
    if (tipo) params.set('tipo', tipo);
    if (q) params.set('q', q);
    const qs = params.toString();
    return request(`/items${qs ? `?${qs}` : ''}`);
  },
  create: (item, token) => request('/items', { method: 'POST', body: item, token }),
  update: (id, cambios, token) => request(`/items/${id}`, { method: 'PUT', body: cambios, token }),
  remove: (id, token) => request(`/items/${id}`, { method: 'DELETE', token }),
};
