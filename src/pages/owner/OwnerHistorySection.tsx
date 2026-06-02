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

const DL_BTN_OWNER = { padding: '5px 8px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 } as const;
const DL_BTN_SYSTEM = { padding: '5px 8px', background: 'var(--green-soft)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 } as const;

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
      // silently fail
    } finally {
      setDownloading(null);
    }
  }

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  return (
    <div>
      <div className="admin-page-head">
        <div><h1 className="admin-page-title">Historial de pagos</h1></div>
      </div>

      {error && <div className="admin-notice error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['all', 'approved', 'pending', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-btn${filter === f ? ' active' : ''}`}
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
            <>
              {/* Desktop table — hidden on mobile via CSS */}
              <div className="owner-history-table-wrap">
                <div className="owner-history-head">
                  <span>Período</span>
                  <span>Monto</span>
                  <span>Fecha</span>
                  <span>Estado</span>
                  <span>Acciones</span>
                </div>
                {filtered.map((p) => (
                  <div key={`dt-${p._id}`} className="owner-history-tr">
                    <span className="oht-period">{p.month || '-'}</span>
                    <strong className="oht-amount">{money(p.amount)}</strong>
                    <span className="oht-date">{dateLabel(p.createdAt)}</span>
                    <span className="oht-status"><Status value={p.status} /></span>
                    <div className="oht-actions">
                      {p.receipt && (
                        <button
                          onClick={() => downloadReceipt(p._id, 'owner', p.month)}
                          disabled={downloading === `owner-${p._id}`}
                          title="Descargar comprobante subido"
                          style={DL_BTN_OWNER}
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
                          style={DL_BTN_SYSTEM}
                        >
                          <Download size={13} />
                          {downloading === `system-${p._id}` ? '…' : 'Recibo'}
                        </button>
                      )}
                    </div>
                    {p.status === 'rejected' && p.rejectionNote && (
                      <div className="owner-history-tr-extra">
                        Motivo del rechazo: {p.rejectionNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile list — hidden on desktop via CSS */}
              <div className="owner-history-mobile-list">
                {filtered.map((p) => (
                  <div key={`mo-${p._id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', marginBottom: 8 }}>
                    <Receipt size={16} color="var(--text-faint)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>
                        {money(p.amount)} — {p.month || '-'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>{dateLabel(p.createdAt)}</div>
                      {p.status === 'rejected' && p.rejectionNote && (
                        <div style={{ fontSize: 12, color: 'var(--neg)', background: 'var(--neg-soft)', borderRadius: 6, padding: '4px 8px', marginTop: 4 }}>
                          Motivo del rechazo: {p.rejectionNote}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <Status value={p.status} />
                      {p.receipt && (
                        <button
                          onClick={() => downloadReceipt(p._id, 'owner', p.month)}
                          disabled={downloading === `owner-${p._id}`}
                          title="Descargar comprobante subido"
                          style={DL_BTN_OWNER}
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
                          style={DL_BTN_SYSTEM}
                        >
                          <Download size={13} />
                          {downloading === `system-${p._id}` ? '…' : 'Recibo'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
