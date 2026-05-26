import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, CheckCircle2, Send } from 'lucide-react';
import { getJoinOrganization, JoinOrganizationInfo, submitJoinRequest } from '../../services/joinService';

function getJoinCode() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[1] || '';
}

export function JoinPage() {
  const code = useMemo(getJoinCode, []);
  const [organization, setOrganization] = useState<JoinOrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getJoinOrganization(code)
      .then((response) => {
        if (!cancelled) setOrganization(response.data);
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'El enlace de registro no esta disponible.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setMessage('');
    setSending(true);

    try {
      const response = await submitJoinRequest(code, {
        name: String(data.name || '').trim(),
        email: String(data.email || '').trim(),
        phone: String(data.phone || '').trim(),
        requestedUnitLabel: String(data.requestedUnitLabel || '').trim(),
        message: String(data.message || '').trim()
      });
      setSent(true);
      setMessage(response.message || 'Tu solicitud fue enviada. El administrador la revisara pronto.');
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos enviar la solicitud.');
    } finally {
      setSending(false);
    }
  }

  const memberLabel = organization?.memberLabel || 'Propietario';
  const unitLabel = organization?.unitLabel || 'Unidad';

  return (
    <main className="join-page">
      <a className="back-link" href="/"><ArrowLeft size={18} /> Volver</a>
      <section className="join-hero" aria-hidden="true">
        <div className="auth-secure"><span /> Registro seguro</div>
        <div className="auth-hero-copy">
          <div className="auth-accent" />
          <h2>Solicita tu acceso a GestionAr.</h2>
          <p>Completa tus datos para que la administracion valide tu alta y te habilite el ingreso a la app.</p>
        </div>
      </section>

      <section className="join-panel">
        <div className="login-card join-card">
          <div className="login-icon">{sent ? <CheckCircle2 size={28} /> : <Building2 size={28} />}</div>
          <h1>{loading ? 'Cargando registro' : organization?.organizationName || 'Registro no disponible'}</h1>
          <p>{loading ? 'Estamos validando el enlace.' : `Alta de ${memberLabel.toLowerCase()} para esta organización.`}</p>

          {sent ? (
            <div className="join-success">
              <CheckCircle2 size={38} />
              <strong>Solicitud enviada</strong>
              <span>{message}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label>
                Nombre completo
                <input name="name" autoComplete="name" placeholder="Ej: Ana Martinez" required disabled={loading || !organization} />
              </label>
              <label>
                Correo electronico
                <input name="email" type="email" autoComplete="email" placeholder="nombre@email.com" required disabled={loading || !organization} />
              </label>
              <label>
                Telefono
                <input name="phone" type="tel" autoComplete="tel" placeholder="Ej: 11 5555 5555" disabled={loading || !organization} />
              </label>
              <label>
                {unitLabel}
                <input name="requestedUnitLabel" placeholder={`Ej: ${unitLabel} 12`} disabled={loading || !organization} />
              </label>
              <label>
                Mensaje
                <textarea name="message" rows={4} placeholder="Agrega una referencia para la administracion" disabled={loading || !organization} />
              </label>
              <button className="btn primary login-submit" type="submit" disabled={loading || !organization || sending}>
                {sending ? 'Enviando...' : 'Enviar solicitud'} <Send size={20} />
              </button>
              {message && <p className="form-message">{message}</p>}
            </form>
          )}
        </div>
        <p className="login-footer">Gestionar © 2026</p>
      </section>
    </main>
  );
}
