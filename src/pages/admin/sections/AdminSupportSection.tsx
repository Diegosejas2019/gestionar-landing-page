import { FormEvent, useState } from 'react';
import { HelpCircle, Plus, RefreshCw, Ticket } from 'lucide-react';
import { adminApi } from '../../../services/adminService';
import { dateLabel } from '../adminFormat';
import { Field, Empty, Status } from '../adminComponents';

const TICKET_TYPES: Record<string, string> = {
  bug: 'Error en la app',
  question: 'Consulta',
  payment_issue: 'Problema con pago',
  suggestion: 'Sugerencia',
  other: 'Otro',
};
const TICKET_STATUS: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En proceso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

export function AdminSupportSection({ ctx }: { ctx: any }) {
  const { supportTickets, supportTicketsLoading, refresh, setNotice } = ctx;
  const [showSupportForm, setShowSupportForm] = useState(false);
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportInnerTab, setSupportInnerTab] = useState<'tickets' | 'faq'>('tickets');

  const openCount = (supportTickets || []).filter((t: any) => t.status === 'open' || t.status === 'in_progress').length;

  async function handleSupportSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = (fd.get('title') as string)?.trim();
    const description = (fd.get('description') as string)?.trim();
    const type = fd.get('type') as string;
    if (!title || title.length < 3) { setNotice({ type: 'error', text: 'El título debe tener al menos 3 caracteres.' }); return; }
    if (!description || description.length < 10) { setNotice({ type: 'error', text: 'La descripción debe tener al menos 10 caracteres.' }); return; }
    setSupportSubmitting(true);
    setNotice(null);
    try {
      await adminApi.support.create({ type, title, description });
      setNotice({ type: 'ok', text: 'Ticket enviado correctamente.' });
      setShowSupportForm(false);
      (e.target as HTMLFormElement).reset();
      await refresh('soporte');
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo enviar el ticket.' });
    } finally {
      setSupportSubmitting(false);
    }
  }

  return (
    <>
      <div className="admin-page-head">
        <div>
          <div className="admin-page-kicker"><span className="dot" />Soporte</div>
          <h1 className="admin-page-title">
            Soporte técnico
            {openCount > 0 && <span className="pill warn" style={{ marginLeft: 10, fontSize: 13 }}><span className="d" />{openCount} abierto{openCount !== 1 ? 's' : ''}</span>}
          </h1>
          <div className="admin-page-sub">Reportes técnicos al equipo de GestionAr</div>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-ghost" onClick={() => refresh('soporte')}><RefreshCw size={14} />Actualizar</button>
          <button className="btn btn-primary" onClick={() => { setShowSupportForm(v => !v); setNotice(null); }}><Plus size={14} />Nuevo ticket</button>
        </div>
      </div>

      {showSupportForm && (
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-h"><div><h3>Nuevo ticket de soporte</h3></div></div>
          <div className="card-body">
            <form onSubmit={handleSupportSubmit} style={{ display: 'grid', gap: 14 }}>
              <label className="admin-field">
                <span>Tipo</span>
                <select name="type">
                  {Object.entries(TICKET_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <Field label="Título" name="title" placeholder="Ej: No puedo cargar un comprobante" />
              <label className="admin-field">
                <span>Descripción</span>
                <textarea name="description" placeholder="Contanos qué pasó y qué estabas intentando hacer…" rows={4} maxLength={3000} required style={{ resize: 'vertical' }} />
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={supportSubmitting} className="btn btn-primary" style={{ flex: 1 }}>{supportSubmitting ? 'Enviando…' : 'Enviar ticket'}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowSupportForm(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </section>
      )}

      <div className="inner-tabs">
        {(['tickets', 'faq'] as const).map(t => (
          <button key={t} onClick={() => setSupportInnerTab(t)} className={`inner-tab-btn${supportInnerTab === t ? ' active' : ''}`}>
            {{ tickets: 'Mis tickets', faq: 'Preguntas frecuentes' }[t]}
          </button>
        ))}
      </div>

      {supportInnerTab === 'tickets' && (
        <section className="card">
          <div className="card-h"><div><h3>Mis tickets</h3><div className="card-sub">{(supportTickets || []).length} ticket{(supportTickets || []).length !== 1 ? 's' : ''}</div></div></div>
          <div className="card-body">
            {supportTicketsLoading ? (
              <div className="skeleton-list">{[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: 72, borderRadius: 8, marginBottom: 8 }} />)}</div>
            ) : (supportTickets || []).length === 0 ? (
              <Empty text="Todavía no enviaste ningún ticket de soporte." />
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {(supportTickets || []).map((t: any) => (
                  <div key={t._id} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Ticket size={15} color="var(--text-faint)" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{t.title}</span>
                          <Status value={t.status} label={TICKET_STATUS[t.status] || t.status} />
                          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{TICKET_TYPES[t.type] || t.type}</span>
                        </div>
                        {t.description && <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{t.description.length > 120 ? t.description.slice(0, 120) + '…' : t.description}</p>}
                        {t.adminResponse && <div style={{ fontSize: 12, color: 'var(--green)', padding: '6px 10px', background: 'var(--green-soft)', borderRadius: 6, marginBottom: 4 }}><strong>Respuesta de soporte:</strong> {t.adminResponse}</div>}
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

      {supportInnerTab === 'faq' && (
        <section className="card">
          <div className="card-h"><div><h3>Preguntas frecuentes</h3></div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { q: '¿Para qué es Soporte técnico?', a: 'Para reportar errores de la aplicación, consultas técnicas o sugerencias sobre GestionAr.' },
                { q: '¿Cuánto tarda en responderse un ticket?', a: 'El equipo de GestionAr revisa los tickets en días hábiles. La respuesta aparece en tu lista de tickets.' },
                { q: '¿Puedo ver si mi ticket fue atendido?', a: 'Sí. En "Mis tickets" podés ver el estado (Abierto, En proceso, Resuelto) y la respuesta del equipo.' },
                { q: '¿Cómo informo un error?', a: 'Creá un ticket con tipo "Error en la app" y describí el problema con detalle.' },
              ].map((item, i) => (
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
    </>
  );
}
