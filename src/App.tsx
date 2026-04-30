import { AdminPreviewPage } from './pages/admin/AdminPreviewPage';
import { LoginPage } from './pages/auth/LoginPage';
import { HomePage } from './pages/public/HomePage';
import { SuperAdminPage } from './pages/super-admin/SuperAdminPage';

export function App() {
  const path = window.location.pathname;

  if (path.startsWith('/login')) {
    return <LoginPage />;
  }

  if (path.startsWith('/super-admin')) {
    return <SuperAdminPage />;
  }

  if (path.startsWith('/admin')) {
    return <AdminPreviewPage />;
  }

  return <HomePage />;
}
