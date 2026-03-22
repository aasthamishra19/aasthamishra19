const base = import.meta.env.VITE_API_URL || '';

export function getToken() {
  return localStorage.getItem('token');
}

export async function api(path, options = {}) {
  const headers = { ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${base}${path}`, { ...options, headers });
  const text = await res.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || 'Invalid response' };
  }
  if (!res.ok) {
    const err = new Error(data.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function assetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${base}${path}`;
}
