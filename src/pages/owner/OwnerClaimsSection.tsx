import { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageSquare, Paperclip, Plus, X } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import { dateLabel } from '../admin/adminFormat';
import { Empty, Status } from '../admin/adminComponents';

const CLAIM_CATEGORIES = [
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'noise', label: 'Ruidos molestos' },
  { value: 'cleanliness', label: 'Limpieza' },
  { value: 'security', label: 'Seguridad' },
  { value: 'common_areas', label: 'Áreas comunes' },
  { value: 'infrastructure', label: 'Infraestructura' },
  { value: 'other', label: 'Otro' },
];

const STATUS_LABELS: Record<string, string> = {
  open: 'Abierto', in_progress: 'En progreso', resolved: 'Resuelto', closed: 'Cerrado',
};

export function OwnerClaimsSection() {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadClaims = () => {
    ownerApi.claims.list({ limit: 100 })
      .then((r) => setClaims(r?.data?.claims || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar reclamos.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadClaims(); }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    if (!data.title || !data.description) {
      setNotice({ type: 'error', text: 'Completá título y descripción.' });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      const fd = new FormData(e.currentTarget);
      attachments.forEach((f) => fd.append('attachments', f));
      await ownerApi.claims.create(fd);
      setNotice({ type: 'ok', text: 'Reclamo enviado correctamente.' });
      setShowForm(false);
      setAttachments([]);
      setLoading(true);
      loadClaims();
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo enviar el reclamo.' });
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = filter === 'all' ? claims : claims.filter(c => c.status === filter);
  const openCount = claims.filter(c => c.status === 'open' || c.status === 'in_progress').length;

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">
            Reclamos
            {openCount > 0 && (
              <span className="pill warn" style={{ marginLeft: 10, fontSize: 13 }}>
                <span className="d" />{openCount} abierto{openCount !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setNotice(null); }}>
            <Plus size={14} /> Nuevo reclamo
          </button>
        </div>
      </div>

      {error && <div className="admin-notice error" style={{ marginBottom: 16 }}>{error}</div>}
      {notice && <div className={`admin-notice ${notice.type}`} style={{ marginBottom: 16 }}>{notice.text}</div>}

      {/* New claim form */}
      {showForm && (
        <section className="card" style={{ marginBottom: 20 }}>
          <div className="card-h">
            <div><h3>Nuevo reclamo</h3></div>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
              <label className="admin-field">
                <span>Título</span>
                <input name="title" placeholder="Resumen del problema" required />
              </label>
              <label className="admin-field">
                <span>Categoría</span>
                <select name="category">
                  {CLAIM_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Descripción</span>
                <textarea name="description" placeholder="Describí el problema con detalle…" rows={4} required style={{ resize: 'vertical' }} />
              </label>

              {/* Attachments */}
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>Adjuntos (opcional, máx. 3)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {attachments.map((f, i) => (
                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}>
                      <Paperclip size={11} />{f.name}
                      <button type="button" onClick={() => setAttachments(a => a.filter((_, j) => j !== i))} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-faint)', padding: 0 }}><X size={11} /></button>
                    </span>
                  ))}
                  {attachments.length < 3 && (
                    <button type="button" onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-dim)' }}>
                      <Plus size={11} /> Agregar archivo
                    </button>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.[0] && attachments.length < 3) { setAttachments(a => [...a, e.target.files![0]]); e.target.value = ''; } }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1 }}>
                  {submitting ? 'Enviando…' : 'Enviar reclamo'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 16px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 14 }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)',
              background: filter === f ? 'var(--green)' : 'var(--surface)',
              color: filter === f ? '#0e1512' : 'var(--text-dim)',
              fontWeight: filter === f ? 700 : 500, fontSize: 13, cursor: 'pointer'
            }}
          >
            {{ all: 'Todos', open: 'Abiertos', in_progress: 'En progreso', resolved: 'Resueltos' }[f]}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="card-h">
          <div>
            <h3>Mis reclamos</h3>
            <div className="card-sub">{filtered.length} reclamo{filtered.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="skeleton-list">
              {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: 72, borderRadius: 8, marginBottom: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <Empty text="Sin reclamos para mostrar." />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {filtered.map((c) => (
                <div key={c._id} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <MessageSquare size={15} color="var(--text-faint)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</span>
                        <Status value={c.status} label={STATUS_LABELS[c.status] || c.status} />
                      </div>
                      {c.description && (
                        <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{c.description}</p>
                      )}
                      {c.adminNote && (
                        <div style={{ fontSize: 12, color: 'var(--green)', padding: '6px 10px', background: 'var(--green-soft)', borderRadius: 6, marginBottom: 4 }}>
                          Respuesta del administrador: {c.adminNote}
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{dateLabel(c.createdAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
