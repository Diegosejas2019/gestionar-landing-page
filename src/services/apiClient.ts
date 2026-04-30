type RequestOptions = RequestInit & {
  auth?: boolean;
};

declare global {
  interface Window {
    CONSORCIO_API_URL?: string;
  }
}

const DEFAULT_API_URL = 'https://consorcio-api-production.up.railway.app/api';

export const API_URL = import.meta.env.VITE_API_URL || window.CONSORCIO_API_URL || DEFAULT_API_URL;

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('gestionar_token');
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

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

export async function apiBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const token = localStorage.getItem('gestionar_token');
  const headers = new Headers(options.headers);

  if (options.auth && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'No pudimos descargar el archivo.');
  }

  return response.blob();
}
