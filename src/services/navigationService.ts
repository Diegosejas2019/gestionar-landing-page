export const TOKEN_KEY           = 'gestionar_token';
export const SUPERADMIN_TOKEN_KEY = 'gestionar_superadmin_token';

export function getSuperAdminToken() {
  return sessionStorage.getItem(SUPERADMIN_TOKEN_KEY);
}
export function saveSuperAdminToken(token: string) {
  sessionStorage.setItem(SUPERADMIN_TOKEN_KEY, token);
}
export function clearSuperAdminToken() {
  sessionStorage.removeItem(SUPERADMIN_TOKEN_KEY);
}

function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function isImpersonating(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  return payload?.impersonation?.active === true;
}

export function getImpersonationContext(): Record<string, any> | null {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload?.impersonation || null;
}
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
