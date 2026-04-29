const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type RequestOptions = RequestInit & {
  auth?: boolean;
};

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('gestionar_token');
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  if (options.auth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('gestionar_token');
      window.location.assign('/login');
    }

    throw new Error(data?.message || 'Ocurrio un error inesperado. Intenta nuevamente.');
  }

  return data as T;
}
