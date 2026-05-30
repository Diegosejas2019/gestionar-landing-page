import { FormEvent, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { login, LoginResponse, selectOrganization } from '../../services/authService';
import { goDashboardForRole, goOwnerApp, goOwnerDashboard, setAuthToken } from '../../services/navigationService';

const OWNER_WEB_ENABLED = import.meta.env.VITE_OWNER_WEB_ENABLED !== 'false';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<LoginResponse | null>(null);
  const [toast, setToast] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(''), 3500);
  }

  function isOwnerContext(response: LoginResponse) {
    return response.data?.accessType === 'owner' || response.data?.user?.role === 'owner';
  }

  function redirectWithToken(response: LoginResponse, token: string) {
    if (isOwnerContext(response)) {
      if (OWNER_WEB_ENABLED) {
        goOwnerDashboard();
      } else {
        goOwnerApp(token);
      }
      return;
    }
    const role = response.data?.user?.role;
    goDashboardForRole(role);
  }

  function contextLabel(org: NonNullable<LoginResponse['organizations']>[number]) {
    return org.accessType === 'admin' || org.role === 'admin'
      ? 'Ingresar como administrador'
      : 'Ingresar como propietario';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await login(email, password);
      const token = response.token || response.data?.token;

      if (response.requiresOrganizationSelection) {
        setSelection(response);
        return;
      }

      if (token) {
        setAuthToken(token);
        redirectWithToken(response, token);
        return;
      }

      showToast('No pudimos iniciar sesión. Revisá tu correo y contraseña.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No pudimos iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectOrganization(membershipId: string) {
    if (!selection?.selectionToken) return;
    setLoading(true);

    try {
      const response = await selectOrganization(membershipId, selection.selectionToken);
      const token = response.token || response.data?.token;
      if (token) {
        setAuthToken(token);
        redirectWithToken(response, token);
        return;
      }
      showToast('No pudimos seleccionar la organización.');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No pudimos seleccionar la organización.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-stage">

      {/* LEFT — EDITORIAL HERO */}
      <aside className="login-hero">
        <div className="login-hero-top">
          <a className="login-brand" href="/" aria-label="GestionAr">
            <span className="login-brand-word">Gestion<strong>AR</strong></span>
          </a>
          <div className="login-hero-meta">
            <span className="login-pulse-dot" />Sistema operativo
          </div>
        </div>

        <div className="login-hero-center">
          <div className="login-eyebrow">Plataforma de gestión · Buenos Aires</div>
          <h2 className="login-display">
            Una sola<br />
            plataforma &amp;<br />
            cero <em>fricción.</em>
          </h2>
          <p className="login-lede">
            Cobros, expensas, reservas y comunicación para consorcios, barrios privados, clubes y colegios. Diseñada para administradores exigentes y propietarios apurados.
          </p>
        </div>

        <div className="login-diagram" aria-hidden="true">
          <span className="login-corner tl" /><span className="login-corner tr" />
          <span className="login-corner bl" /><span className="login-corner br" />
          <div className="login-diagram-frame" />
          <div className="login-diagram-grid" />
          <div className="login-blk" style={{ top: 32, left: 38, width: 62, height: 42 }} />
          <div className="login-blk" style={{ top: 32, left: 110, width: 48, height: 42 }} />
          <div className="login-blk login-blk--accent" style={{ top: 32, left: 168, width: 74, height: 42 }} />
          <div className="login-blk" style={{ top: 86, left: 38, width: 48, height: 54 }} />
          <div className="login-blk" style={{ top: 86, left: 96, width: 62, height: 54 }} />
          <div className="login-blk" style={{ top: 86, left: 168, width: 46, height: 54 }} />
          <div className="login-blk" style={{ top: 86, left: 222, width: 20, height: 54 }} />
          <div className="login-blk" style={{ top: 160, left: 38, width: 74, height: 46 }} />
          <div className="login-blk" style={{ top: 160, left: 122, width: 36, height: 46 }} />
          <div className="login-blk" style={{ top: 160, left: 168, width: 74, height: 46 }} />
          <div className="login-blk" style={{ top: 216, left: 38, width: 54, height: 28 }} />
          <div className="login-blk" style={{ top: 216, left: 100, width: 90, height: 28 }} />
          <div className="login-blk" style={{ top: 216, left: 198, width: 44, height: 28 }} />
          <div className="login-road-h" style={{ left: 18, right: 18, top: '50%' }} />
          <div className="login-road-v" style={{ top: 18, bottom: 18, left: '50%' }} />
          <span className="login-diagram-lbl" style={{ top: -22, left: 0 }}>FIG.01 · CONSORCIO</span>
          <span className="login-diagram-lbl" style={{ bottom: -22, right: 0 }}>
            <span style={{ color: '#b8f561' }}>●</span>&nbsp;UNIDAD ACTIVA
          </span>
        </div>

        <div className="login-hero-bottom">
          <a href="/" className="login-back-link">
            <ArrowLeft size={14} /> Volver al sitio
          </a>
          <div className="login-stats">
            <div className="login-stat">
              <span className="login-stat-n">+1.240</span>
              <span className="login-stat-l">Consorcios</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-n">98.7%</span>
              <span className="login-stat-l">Uptime · 90d</span>
            </div>
            <div className="login-stat">
              <span className="login-stat-n">24/7</span>
              <span className="login-stat-l">Soporte AR</span>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT — FORM */}
      <section className="login-form-panel" aria-label="Ingresar a GestionAr">
        <header className="login-form-head">
          <div className="login-form-step">Iniciar sesión</div>
          <h1>Bienvenido <em>de nuevo.</em></h1>
          <p>Ingresá con tu cuenta para administrar tu consorcio o ver el estado de tu unidad.</p>
        </header>

        {selection ? (
          <div className="login-org-picker">
            {selection.organizations?.map((org) => (
              <button
                key={org.membershipId || org.id}
                type="button"
                className="login-org-btn"
                onClick={() => handleSelectOrganization(org.membershipId || org.id || '')}
                disabled={loading}
              >
                <strong>{contextLabel(org)}</strong>
                <span>{org.organizationName || org.name}</span>
              </button>
            ))}
            <button className="login-link-btn" type="button" onClick={() => setSelection(null)}>
              Usar otra cuenta
            </button>
          </div>
        ) : (
          <form className="login-form-body" onSubmit={handleSubmit} noValidate>
            <div className="login-field">
              <div className="login-field-lbl"><span>Correo electrónico</span></div>
              <div className="login-input-wrap">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@dominio.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <div className="login-field-lbl">
                <span>Contraseña</span>
                <a href="mailto:soporte@gestionar.com.ar">¿La olvidaste?</a>
              </div>
              <div className="login-input-wrap">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPw(!showPw)}
                  aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label className="login-check">
              <input type="checkbox" />
              <span className="login-check-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                  strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span className="login-check-txt">Recordar mi sesión</span>
            </label>

            <button
              type="submit"
              className={`login-submit-btn${loading ? ' is-loading' : ''}`}
              disabled={loading}
            >
              <span className="login-submit-label">Ingresar a GestionAr</span>
              <ArrowRight size={18} className="login-submit-arr" />
              <span className="login-spinner" aria-hidden="true" />
            </button>
          </form>
        )}

        <footer className="login-form-foot">
          <div className="login-form-support">
            ¿No tenés cuenta?<br />
            <a href="mailto:soporte@gestionar.com.ar">Contactar soporte →</a>
          </div>
          <div className="login-form-legal">
            GestionAr © 2026<br />
            Hecho en Argentina
          </div>
        </footer>
      </section>

      {toast && (
        <div className="login-toast is-on" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
