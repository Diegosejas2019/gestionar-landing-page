import { FormEvent, useEffect, useState } from 'react';
import { HelpCircle, Plus, Ticket } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import { dateLabel } from '../admin/adminFormat';
import { Empty, Status } from '../admin/adminComponents';

const TICKET_TYPES = [
  { value: 'bug', label: 'Error en la app' },
  { value: 'question', label: 'Consulta' },
  { value: 'payment_issue', label: 'Problema con pago' },
  { value: 'suggestion', label: 'Sugerencia' },
  { value: 'other', label: 'Otro' },
];

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En proceso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

const FAQ = [
  {
    q: '¿Para qué es Soporte técnico?',
    a: 'Para reportar errores de la aplicación, consultas técnicas o sugerencias sobre GestionAr. No es para reclamos al consorcio.',
  },
  {
    q: '¿Qué diferencia hay entre Reclamos y Soporte?',
    a: 'Reclamos es para comunicarte con tu administrador sobre problemas del consorcio (filtraciones, ruidos, gastos). Soporte técnico es para problemas con la aplicación GestionAr.',
  },
  {
    q: '¿Cuánto tarda en responderse un ticket?',
    a: 'El equipo de GestionAr revisa los tickets en días hábiles. Cuando hay una respuesta, aparece en tu lista de tickets.',
  },
  {
    q: '¿Puedo ver si mi ticket fue atendido?',
    a: 'Sí. En la sección "Mis tickets" podés ver el estado (Abierto, En proceso, Resuelto) y la respuesta del equipo de soporte.',
  },
  {
    q: '¿Cómo informo un problema de pago?',
    a: 'Creá un ticket con tipo "Problema con pago" y describí el error que encontraste. Si el problema es que tu administrador no aprobó un pago, eso se gestiona dentro del consorcio, no por soporte técnico.',
  },
];

export function OwnerSupportTab() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [innerTab, setInnerTab] = useState<'tickets' | 'faq'>('tickets');

  const loadTickets = () => {
    setLoading(true);
    ownerApi.supportTickets.list()
      .then((r) => setTickets(r?.data?.tickets || r?.data || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar tickets.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTickets(); }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get('title') as string)?.trim();
    const description = (fd.get('description') as string)?.trim();
    const type = fd.get('type') as string;
    if (!title || title.length < 3) {
      setNotice({ type: 'error', text: 'El título debe tener al menos 3 caracteres.' });
      return;
    }
    if (!description || description.length < 10) {
      setNotice({ type: 'error', text: 'La descripción debe tener al menos 10 caracteres.' });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      await ownerApi.supportTickets.create({ type, title, description });
      setNotice({ type: 'ok', text: 'Ticket enviado correctamente. Podés seguirlo en Mis tickets.' });
      setShowForm(false);
      loadTickets();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo enviar el ticket.' });
    } finally {
      setSubmitting(false);
    }
  }

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">
            Soporte técnico
            {openCount > 0 && (
              <span className="pill warn" style={{ marginLeft: 10, fontSize: 13 }}>
                <span className="d" />{openCount} abierto{openCount !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 4 }}>
            Reportes técnicos al equipo de GestionAr.
          </p>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setNotice(null); }}>
            <Plus size={14} /> Nuevo ticket
          </button>
        </div>
      </div>

      {/* Disambiguation banner */}
      <div style={{ padding: '10px 14px', background: 'rgba(156,242,123,0.05)', border: '1px solid rgba(156,242,123,0.18)', borderRadius: 10, marginBottom: 16, fontSize: 13, color: 'var(--text-dim)' }}>
        <strong style={{ color: 'var(--text)' }}>¿Problema con el consorcio?</strong> Usá la sección <strong>Reclamos</strong> para comunicarte con tu administrador.
        Esta sección es exclusivamente para problemas técnicos con la aplicación GestionAr.
      </div>

      {error && <div className="admin-notice error" style={{ marginBottom: 16 }}>{error}</div>}
      {notice && <div className={`admin-notice ${notice.type}`} style={{ marginBottom: 16 }}>{notice.text}</div>}

      {/* New ticket form */}
      {showForm && (
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-h">
            <div><h3>Nuevo ticket de soporte</h3></div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
              <label className="admin-field">
                <span>Tipo</span>
                <select name="type">
                  {TICKET_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Título</span>
                <input name="title" placeholder="Ej: No puedo cargar un comprobante" maxLength={150} required />
              </label>
              <label className="admin-field">
                <span>Descripción</span>
                <textarea name="description" placeholder="Contanos qué pasó y qué estabas intentando hacer…" rows={4} maxLength={3000} required style={{ resize: 'vertical' }} />
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
                  {submitting ? 'Enviando…' : 'Enviar ticket'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Inner tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['tickets', 'faq'] as const).map(t => (
          <button
            key={t}
            onClick={() => setInnerTab(t)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)',
              background: innerTab === t ? 'var(--green)' : 'var(--surface)',
              color: innerTab === t ? '#0e1512' : 'var(--text-dim)',
              fontWeight: innerTab === t ? 700 : 500, fontSize: 13, cursor: 'pointer'
            }}
          >
            {{ tickets: 'Mis tickets', faq: 'Preguntas frecuentes' }[t]}
          </button>
        ))}
      </div>

      {/* Tickets list */}
      {innerTab === 'tickets' && (
        <section className="card">
          <div className="card-h">
            <div>
              <h3>Mis tickets</h3>
              <div className="card-sub">{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="skeleton-list">
                {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: 72, borderRadius: 8, marginBottom: 8 }} />)}
              </div>
            ) : tickets.length === 0 ? (
              <Empty text="Todavía no enviaste ningún ticket de soporte." />
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {tickets.map((t) => (
                  <div key={t._id} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Ticket size={15} color="var(--text-faint)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</span>
                          <Status value={t.status} label={STATUS_LABELS[t.status] || t.status} />
                          {t.priority === 'high' && (
                            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: 'rgba(248,113,113,0.15)', color: '#F87171', fontWeight: 600 }}>Alta</span>
                          )}
                        </div>
                        {t.description && (
                          <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                            {t.description.length > 120 ? t.description.slice(0, 120) + '…' : t.description}
                          </p>
                        )}
                        {t.adminResponse && (
                          <div style={{ fontSize: 12, color: 'var(--green)', padding: '6px 10px', background: 'var(--green-soft)', borderRadius: 6, marginBottom: 4 }}>
                            <strong>Respuesta de soporte:</strong> {t.adminResponse}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{dateLabel(t.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      {innerTab === 'faq' && (
        <section className="card">
          <div className="card-h">
            <div><h3>Preguntas frecuentes</h3></div>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 12 }}>
              {FAQ.map((item, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <HelpCircle size={15} color="var(--green)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>{item.q}</p>
                      <p style={{ fontSize: 13, color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>{item.a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
