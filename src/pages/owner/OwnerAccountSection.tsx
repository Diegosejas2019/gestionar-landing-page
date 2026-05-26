import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, WalletCards } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import { dateLabel, money } from '../admin/adminFormat';
import { Empty, Metric, Status } from '../admin/adminComponents';

export function OwnerAccountSection() {
  const [loading, setLoading] = useState(true);
  const [debtItems, setDebtItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([ownerApi.debtItems.mine(), ownerApi.summary()])
      .then(([debtRes, sumRes]) => {
        setDebtItems(debtRes?.data?.debtItems || []);
        setSummary(sumRes?.data ?? sumRes);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar cuenta.'))
      .finally(() => setLoading(false));
  }, []);

  const balance = summary?.membership?.balance ?? summary?.balance;
  const isInDebt = Number(balance ?? 0) < 0;
  const pendingItems = debtItems.filter((d) => d.status === 'pending');
  const totalDebt = pendingItems.reduce((acc, d) => acc + Number(d.amount || 0), 0);

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Mi cuenta</h2>

      <div className="metric-grid" style={{ marginBottom: 24 }}>
        <Metric
          loading={loading}
          icon={isInDebt ? AlertTriangle : CheckCircle2}
          label="Estado"
          value={loading ? '' : isInDebt ? 'Con deuda' : 'Al día'}
          hint={balance !== undefined ? `Saldo: ${money(balance)}` : undefined}
        />
        {totalDebt > 0 && (
          <Metric
            loading={loading}
            icon={WalletCards}
            label="Deuda pendiente"
            value={loading ? '' : money(totalDebt)}
            hint={`${pendingItems.length} ítem${pendingItems.length !== 1 ? 's' : ''} pendiente${pendingItems.length !== 1 ? 's' : ''}`}
          />
        )}
      </div>

      {error && <div className="admin-notice error" style={{ marginBottom: 16 }}>{error}</div>}

      <section className="card">
        <div className="card-h">
          <div>
            <h3>Ítems de deuda</h3>
            <div className="card-sub">Saldos anteriores y ajustes manuales registrados por el administrador</div>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="skeleton-list">
              {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />)}
            </div>
          ) : debtItems.length === 0 ? (
            <Empty text="Sin ítems de deuda registrados." />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {debtItems.map((item) => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.description || item.type || 'Sin descripción'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                      {dateLabel(item.createdAt)}
                      {item.period ? ` · Período ${item.period}` : ''}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{money(item.amount)}</div>
                    <Status value={item.status} />
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
