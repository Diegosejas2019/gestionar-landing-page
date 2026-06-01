import { Suspense, lazy, useEffect, useState } from 'react';
import { LoginPage } from './pages/auth/LoginPage';
import { HomePage } from './pages/public/HomePage';
import { JoinPage } from './pages/public/JoinPage';
import { clearAuthToken, clearSuperAdminToken, getImpersonationContext, getSuperAdminToken, isImpersonating, setAuthToken, goLogin, goSuperAdmin } from './services/navigationService';
import { superAdminApi } from './services/adminService';

const AdminPreviewPage = lazy(() => import(
  /* webpackPrefetch: true */
  './pages/admin/AdminPreviewPage'
).then(m => ({ default: m.AdminPreviewPage })));
const SuperAdminPage = lazy(() => import(
  /* webpackPrefetch: true */
  './pages/super-admin/SuperAdminPage'
).then(m => ({ default: m.SuperAdminPage })));
const OwnerPage = lazy(() => import(
  /* webpackPrefetch: true */
  './pages/owner/OwnerPage'
).then(m => ({ default: m.OwnerPage })));
const GuardPortalPage = lazy(() => import(
  /* webpackPrefetch: true */
  './pages/guard/GuardPortalPage'
).then(m => ({ default: m.GuardPortalPage })));

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0e1512',
      color: '#9cf27b',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px'
    }}>
      Cargando…
    </div>
  );
}

function SupportModeBanner() {
  const ctx = getImpersonationContext();
  if (!ctx) return null;

  async function handleExit() {
    try { await superAdminApi.impersonation.stopSession(); } catch { /* best-effort */ }
    const original = getSuperAdminToken();
    clearSuperAdminToken();
    if (original) {
      setAuthToken(original);
      goSuperAdmin();
    } else {
      clearAuthToken();
      goLogin();
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 99999,
      background: '#92400e', color: '#fef3c7',
      padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, fontSize: 13, fontFamily: 'Inter, sans-serif',
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    }}>
      <span>
        ⚠ <strong>Modo soporte activo</strong>: estás viendo como <strong>{ctx.actorEmail ? `${ctx.actorEmail}` : ''}</strong>.
        {ctx.reason && <> Motivo: <em>{ctx.reason}</em>.</>}
      </span>
      <button
        onClick={handleExit}
        style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fef3c7', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
      >
        Salir del modo soporte
      </button>
    </div>
  );
}

export function App() {
  const path = window.location.pathname;
  const [impersonating, setImpersonating] = useState(() => isImpersonating());

  useEffect(() => {
    const check = () => setImpersonating(isImpersonating());
    window.addEventListener('storage', check);
    return () => window.removeEventListener('storage', check);
  }, []);

  const banner = impersonating ? <SupportModeBanner /> : null;

  if (path.startsWith('/login')) {
    return <LoginPage />;
  }

  if (path.startsWith('/join/')) {
    return <JoinPage />;
  }

  if (path.startsWith('/super-admin')) {
    return (
      <>
        {banner}
        <Suspense fallback={<LoadingFallback />}>
          <SuperAdminPage />
        </Suspense>
      </>
    );
  }

  if (path.startsWith('/owner')) {
    return (
      <>
        {banner}
        <Suspense fallback={<LoadingFallback />}>
          <OwnerPage />
        </Suspense>
      </>
    );
  }

  if (path.startsWith('/admin')) {
    return (
      <>
        {banner}
        <Suspense fallback={<LoadingFallback />}>
          <AdminPreviewPage />
        </Suspense>
      </>
    );
  }

  if (path.startsWith('/guard')) {
    return (
      <>
        {banner}
        <Suspense fallback={<LoadingFallback />}>
          <GuardPortalPage />
        </Suspense>
      </>
    );
  }

  return <HomePage />;
}
