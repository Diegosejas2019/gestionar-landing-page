export const TOKEN_KEY = 'gestionar_token';
export const PWA_URL = 'https://gestionar-it.vercel.app/';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function goHome() {
  window.location.assign('/');
}

export function goLogin() {
  window.location.assign('/login');
}

export function goAdmin() {
  window.location.assign('/admin');
}

export function goGuard() {
  window.location.assign('/guard');
}

export function goSuperAdmin() {
  window.location.assign('/super-admin');
}

export function goOwnerApp(token: string) {
  window.location.assign(`${PWA_URL}#auth_token=${encodeURIComponent(token)}`);
}

export function goOwnerDashboard() {
  window.location.assign('/owner');
}

export function goDashboardForRole(role?: string) {
  window.location.assign(role === 'super_admin' || role === 'superadmin' ? '/super-admin' : '/admin');
}
