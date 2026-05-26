import { useEffect, useState } from 'react';
import { Bell, Download, Eye, EyeOff } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import { dateLabel } from '../admin/adminFormat';
import { Empty } from '../admin/adminComponents';

const TAG_LABELS: Record<string, string> = {
  info: 'Información',
  warning: 'Atención',
  urgent: 'Urgente',
};
const TAG_TONE: Record<string, string> = { info: '', warning: 'warn', urgent: 'neg' };

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General', maintenance: 'Mantenimiento', expensas: 'Expensas',
  assembly: 'Asamblea', emergency: 'Emergencia', services: 'Servicios', other: 'Otro',
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function OwnerNoticesSection() {
  const [loading, setLoading] = useState(true);
  const [notices, setNotices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    ownerApi.notices.list({ limit: 100 })
      .then((r) => setNotices(r?.data?.notices || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar avisos.'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleRead(n: any) {
    setToggling(n._id);
    try {
      if (n.isRead) {
        await ownerApi.notices.markUnread(n._id);
      } else {
        await ownerApi.notices.markRead(n._id);
      }
      setNotices(prev => prev.map(x => x._id === n._id ? { ...x, isRead: !n.isRead } : x));
    } catch {
      // ignore
    } finally {
      setToggling(null);
    }
  }

  async function downloadAttachment(id: string, index: number, filename: string) {
    try {
      const blob = await ownerApi.notices.attachment(id, index);
      downloadBlob(blob, filename);
    } catch {
      // ignore
    }
  }

  const filtered = notices.filter(n => {
    const matchSearch = !search || (n.title || n.subject || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'unread' && !n.isRead) || (filter === 'read' && n.isRead);
    return matchSearch && matchFilter;
  });

  const unreadCount = notices.filter(n => !n.isRead).length;

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">
            Avisos
            {unreadCount > 0 && (
              <span className="pill warn" style={{ marginLeft: 10, fontSize: 13 }}>
                <span className="d" />{unreadCount} nuevo{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </h1>
        </div>
      </div>

      {error && <div className="admin-notice error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Buscar aviso…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 180, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13 }}
        />
        {(['all', 'unread', 'read'] as const).map(f => (
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
            {{ all: 'Todos', unread: 'No leídos', read: 'Leídos' }[f]}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="card-h">
          <div>
            <h3>Comunicados</h3>
            <div className="card-sub">{filtered.length} aviso{filtered.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="skeleton-list">
              {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: 80, borderRadius: 8, marginBottom: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <Empty text="Sin avisos para mostrar." />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {filtered.map((n) => (
                <div key={n._id} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--surface)', border: `1px solid ${n.isRead ? 'var(--border)' : 'var(--green)'}`, opacity: n.isRead ? 0.85 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <Bell size={15} color={n.isRead ? 'var(--text-faint)' : 'var(--green)'} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{n.title || n.subject}</span>
                        {n.tag && n.tag !== 'info' && (
                          <span className={`pill ${TAG_TONE[n.tag] || ''}`} style={{ fontSize: 11 }}>
                            <span className="d" />{TAG_LABELS[n.tag] || n.tag}
                          </span>
                        )}
                        {n.category && n.category !== 'general' && (
                          <span className="pill muted" style={{ fontSize: 11 }}>
                            <span className="d" />{CATEGORY_LABELS[n.category] || n.category}
                          </span>
                        )}
                      </div>
                      {n.body && (
                        <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{n.body}</p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{dateLabel(n.sentAt || n.createdAt)}</span>
                        {(n.attachments || []).map((att: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => downloadAttachment(n._id, i, att.name || `adjunto-${i + 1}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-dim)' }}
                          >
                            <Download size={11} /> {att.name || `Adjunto ${i + 1}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRead(n)}
                      disabled={toggling === n._id}
                      title={n.isRead ? 'Marcar como no leído' : 'Marcar como leído'}
                      style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--text-faint)', padding: 4, flexShrink: 0 }}
                    >
                      {n.isRead ? <EyeOff size={14} /> : <Eye size={14} color="var(--green)" />}
                    </button>
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
