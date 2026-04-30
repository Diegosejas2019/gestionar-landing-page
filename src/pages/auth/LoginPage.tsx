import { FormEvent, useState } from 'react';
import { ArrowLeft, Building2, LogIn } from 'lucide-react';
import { login, LoginResponse, selectOrganization } from '../../services/authService';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<LoginResponse | null>(null);

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
        window.location.assign('/admin');
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
        window.location.assign('/admin');
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
      <section className="login-card">
        <div className="login-icon"><Building2 size={28} /></div>
        <h1>Ingresar a Gestionar</h1>
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
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Contrasena
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            <button className="btn primary" type="submit" disabled={loading}>
              <LogIn size={18} /> {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
            {message && <p className="form-message">{message}</p>}
          </form>
        )}
      </section>
    </main>
  );
}
