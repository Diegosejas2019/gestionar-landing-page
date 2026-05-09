import { Suspense, lazy } from 'react';
import { LoginPage } from './pages/auth/LoginPage';
import { HomePage } from './pages/public/HomePage';

const AdminPreviewPage = lazy(() => import('./pages/admin/AdminPreviewPage').then(m => ({ default: m.AdminPreviewPage })));
const SuperAdminPage = lazy(() => import('./pages/super-admin/SuperAdminPage').then(m => ({ default: m.SuperAdminPage })));

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

export function App() {
  const path = window.location.pathname;

  if (path.startsWith('/login')) {
    return <LoginPage />;
  }

  if (path.startsWith('/super-admin')) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <SuperAdminPage />
      </Suspense>
    );
  }

  if (path.startsWith('/admin')) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <AdminPreviewPage />
      </Suspense>
    );
  }

  return <HomePage />;
}
