import { AdminPreviewPage } from './pages/admin/AdminPreviewPage';
import { LoginPage } from './pages/auth/LoginPage';
import { HomePage } from './pages/public/HomePage';

export function App() {
  const path = window.location.pathname;

  if (path.startsWith('/login')) {
    return <LoginPage />;
  }

  if (path.startsWith('/admin')) {
    return <AdminPreviewPage />;
  }

  return <HomePage />;
}
