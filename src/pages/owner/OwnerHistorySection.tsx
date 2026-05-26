import { useEffect, useState } from 'react';
import { Download, Receipt } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import { dateLabel, money } from '../admin/adminFormat';
import { Empty, Status } from '../admin/adminComponents';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function OwnerHistorySection() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    ownerApi.payments.list({ limit: 100 })
      .then((r) => setPayments(r?.data?.payments || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar pagos.'))
      .finally(() => setLoading(false));
  }, []);

  async function downloadReceipt(id: string, type: 'owner' | 'system', period: string) {
    const key = `${type}-${id}`;
    setDownloading(key);
    try {
      const blob = type === 'system'
        ? await ownerApi.payments.systemReceipt(id)
        : await ownerApi.payments.receipt(id);
      const ext = type === 'system' ? 'pdf' : blob.type.includes('pdf') ? 'pdf' : 'jpg';
      downloadBlob(blob, `recibo-${period}.${ext}`);
    } catch {
      // silently fail — rare edge case
    } finally {
      setDownloading(null);
    }
  }

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Historial de pagos</h2>

      {error && <div className="admin-notice error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'approved', 'pending', 'rejected'] as const).map(f => (
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
            {{ all: 'Todos', approved: 'Aprobados', pending: 'Pendientes', rejected: 'Rechazados' }[f]}
          </button>
        ))}
      </div>

      <section className="card">
        <div className="card-h">
          <div>
            <h3>Pagos registrados</h3>
            <div className="card-sub">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="skeleton-list">
              {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-box" style={{ height: 64, borderRadius: 8, marginBottom: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <Empty text="Sin pagos para mostrar." />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {filtered.map((p) => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <Receipt size={16} color="var(--text-faint)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {money(p.amount)} — {p.month || '-'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                      {dateLabel(p.createdAt)}
                      {p.rejectionNote ? ` · ${p.rejectionNote}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <Status value={p.status} />
                    {p.receipt && (
                      <button
                        onClick={() => downloadReceipt(p._id, 'owner', p.month)}
                        disabled={downloading === `owner-${p._id}`}
                        title="Descargar comprobante subido"
                        style={{ padding: '5px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                      >
                        <Download size={13} />
                        {downloading === `owner-${p._id}` ? '…' : 'Comprobante'}
                      </button>
                    )}
                    {p.status === 'approved' && (
                      <button
                        onClick={() => downloadReceipt(p._id, 'system', p.month)}
                        disabled={downloading === `system-${p._id}`}
                        title="Descargar recibo del sistema"
                        style={{ padding: '5px 8px', background: 'var(--green-soft)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                      >
                        <Download size={13} />
                        {downloading === `system-${p._id}` ? '…' : 'Recibo'}
                      </button>
                    )}
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
