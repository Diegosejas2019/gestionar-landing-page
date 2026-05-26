import { useEffect, useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { Empty } from './adminComponents';

const TYPE_LABELS: Record<string, string> = {
  expense_due:                  'Gasto pendiente',
  payment_pending:              'Pagos por aprobar',
  unidentified_payment_pending: 'Pagos sin identificar',
  claim_stale:                  'Reclamo sin respuesta',
  salary_due:                   'Sueldo pendiente',
  rendition_due:                'Rendición no generada',
  access_request_pending:       'Solicitudes de acceso',
  admin_task:                   'Tarea',
};

const PRIORITY_CLASS: Record<string, string> = {
  high:   'badge-danger',
  medium: 'badge-warning',
  low:    'badge-neutral',
};

const PRIORITY_LABEL: Record<string, string> = {
  high: 'Alta', medium: 'Media', low: 'Baja',
};

type AgendaItem = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  date?: string;
  priority: 'high' | 'medium' | 'low';
};

type AgendaSummary = {
  total: number;
  high: number;
  medium: number;
  low: number;
  period?: string;
};

export function AdminAgendaSection() {
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [summary, setSummary] = useState<AgendaSummary>({ total: 0, high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', notes: '', dueDate: '', priority: 'medium' });
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.agenda.get();
      const data = res.data || {};
      setItems(data.items || []);
      setSummary(data.summary || { total: 0, high: 0, medium: 0, low: 0 });
    } catch {
      setError('No se pudo cargar la agenda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.priority === filter);

  const handleComplete = async (id: string) => {
    setBusy(true);
    try { await adminApi.agenda.completeTask(id); await load(); } finally { setBusy(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    setBusy(true);
    try { await adminApi.agenda.deleteTask(id); await load(); } finally { setBusy(false); }
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      await adminApi.agenda.createTask({
        title: form.title.trim(),
        notes: form.notes.trim() || undefined,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
      });
      setForm({ title: '', notes: '', dueDate: '', priority: 'medium' });
      setShowForm(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const chipClass = (key: string, modifier: string) =>
    `hero-chip${modifier ? ' ' + modifier : ''}${filter === key ? ' active' : ''}`;

  return (
    <div className="admin-section">
      <div className="admin-page-head">
        <div>
          <div className="admin-page-kicker"><span className="dot" />Pendientes</div>
          <h1 className="admin-page-title">Agenda</h1>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)} disabled={busy}>
          <Plus size={14} /> Nueva tarea
        </button>
      </div>

      {showForm && (
        <div className="panel" style={{ marginBottom: '1rem' }}>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="field-group">
              <label className="field-label">Título *</label>
              <input className="field-input" value={form.title} maxLength={200}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Ej: Llamar al proveedor de limpieza" />
            </div>
            <div className="field-group">
              <label className="field-label">Notas</label>
              <textarea className="field-input" value={form.notes} maxLength={1000} rows={2}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Detalles adicionales…" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="field-group" style={{ flex: 1, minWidth: 140 }}>
                <label className="field-label">Vencimiento</label>
                <input className="field-input" type="date" value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
              </div>
              <div className="field-group" style={{ flex: 1, minWidth: 120 }}>
                <label className="field-label">Prioridad</label>
                <select className="field-input" value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="low">Baja</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={busy || !form.title.trim()}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        {([
          { key: 'all',    label: 'Total',    count: summary.total,  mod: summary.high > 0 ? 'alert' : summary.total > 0 ? 'warn' : '' },
          { key: 'high',   label: 'Urgentes', count: summary.high,   mod: 'alert' },
          { key: 'medium', label: 'Medias',   count: summary.medium, mod: 'warn' },
          { key: 'low',    label: 'Bajas',    count: summary.low,    mod: '' },
        ] as const).map(({ key, label, count, mod }) => (
          <div key={key} className={chipClass(key, mod)}
               style={{ cursor: 'pointer', minWidth: 80 }}
               onClick={() => setFilter(key as any)}>
            <span className="chip-num">{count}</span>
            <span className="chip-lbl">{label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="skeleton-list">
          {[1, 2, 3].map(i => <div key={i} className="skeleton-row" />)}
        </div>
      ) : error ? (
        <div className="admin-empty">{error}</div>
      ) : filtered.length === 0 ? (
        <Empty text="Sin pendientes en esta categoría." />
      ) : (
        <div className="agenda-list">
          {filtered.map(item => (
            <div key={item.id} className="agenda-item">
              <div className="agenda-item-body">
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                  <span className={`badge ${PRIORITY_CLASS[item.priority] || 'badge-neutral'}`} style={{ fontSize: '0.68rem' }}>
                    {PRIORITY_LABEL[item.priority] || item.priority}
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                    {TYPE_LABELS[item.type] || item.type}
                  </span>
                </div>
                <div className="agenda-item-title">{item.title}</div>
                {item.subtitle && <div className="agenda-item-sub">{item.subtitle}</div>}
                {item.date && (
                  <div className="agenda-item-date">
                    {new Date(item.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
              {item.type === 'admin_task' && (
                <div className="agenda-item-actions">
                  <button className="btn-success btn-sm" title="Completar" disabled={busy}
                    onClick={() => handleComplete(String(item.id))}>
                    <CheckCircle2 size={14} />
                  </button>
                  <button className="btn-danger btn-sm" title="Eliminar" disabled={busy}
                    onClick={() => handleDelete(String(item.id))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {summary.period && (
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '1rem' }}>
          Período {summary.period}
        </div>
      )}
    </div>
  );
}
