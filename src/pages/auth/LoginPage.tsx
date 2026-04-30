import { FormEvent, useState } from 'react';
import { ArrowLeft, Building2, LogIn } from 'lucide-react';
import { isSuperAdminRole, login, LoginResponse, selectOrganization } from '../../services/authService';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<LoginResponse | null>(null);

  function redirectByRole(role?: string) {
    window.location.assign(isSuperAdminRole(role) ? '/super-admin' : '/admin');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const response = await login(email, password);
      const token = response.token || response.data?.token;

      if (response.requiresOrganizationSelection) {
        setSelection(response);
        return;
      }

      if (token) {
        localStorage.setItem('gestionar_token', token);
        redirectByRole(response.data?.user?.role);
        return;
      }

      setMessage('No pudimos iniciar sesion. Revisa tu correo y contrasena.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos iniciar sesion.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectOrganization(membershipId: string) {
    if (!selection?.selectionToken) return;
    setMessage('');
    setLoading(true);

    try {
      const response = await selectOrganization(membershipId, selection.selectionToken);
      const token = response.token || response.data?.token;
      if (token) {
        localStorage.setItem('gestionar_token', token);
        redirectByRole(response.data?.user?.role);
        return;
      }
      setMessage('No pudimos seleccionar la organizacion.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos seleccionar la organizacion.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <a className="back-link" href="/"><ArrowLeft size={18} /> Volver</a>
      <section className="auth-visual" aria-hidden="true">
        <div className="auth-secure"><span /> Sistema seguro</div>
        <div className="auth-hero-copy">
          <div className="auth-accent" />
          <h2>Excelencia en la administracion de barrios privados.</h2>
          <p>Descubra la plataforma lider para gestionar consorcios con la tranquilidad y eficiencia que sus residentes merecen.</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-icon"><Building2 size={28} /></div>
          <h1>Ingresar a GestionAr</h1>
          <p>Acceso para administradores de consorcios y organizaciones.</p>

          {selection ? (
            <div className="org-picker">
              {selection.organizations?.map((org) => (
                <button
                  key={org.membershipId || org.id}
                  type="button"
                  onClick={() => handleSelectOrganization(org.membershipId || org.id || '')}
                  disabled={loading}
                >
                  <strong>{org.organizationName || org.name}</strong>
                  <span>{org.role === 'admin' ? 'Administrador' : 'Propietario'}</span>
                </button>
              ))}
              <button className="link-button" type="button" onClick={() => setSelection(null)}>Usar otra cuenta</button>
              {message && <p className="form-message">{message}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                Correo electronico
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@empresa.com" required />
              </label>
              <label>
                <span className="login-label-row">
                  Contrasena
                  <a href="mailto:soporte@gestionar.com">Olvido su contrasena?</a>
                </span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
              </label>
              <label className="remember-row">
                <input type="checkbox" />
                <span>Recordar mi sesion</span>
              </label>
              <button className="btn primary login-submit" type="submit" disabled={loading}>
                {loading ? 'Ingresando...' : 'Ingresar'} <LogIn size={20} />
              </button>
              {message && <p className="form-message">{message}</p>}
            </form>
          )}

          <div className="login-support">
            <p>No tiene una cuenta? <a href="mailto:soporte@gestionar.com">Contactar soporte</a></p>
          </div>
        </div>
        <p className="login-footer">Gestionar © 2026</p>
      </section>
    </main>
  );
}
