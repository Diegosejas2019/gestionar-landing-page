import { useEffect, useState } from 'react';
import { AlertTriangle, Bell, CheckCircle2, Clock, CreditCard, MessageSquare, TrendingUp } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import { dateLabel, money } from '../admin/adminFormat';
import { Metric, Empty, Status } from '../admin/adminComponents';
import type { FeatureFlags, Membership, SessionUser } from '../../types/api';

type Props = {
  user: SessionUser | null;
  membership: Membership | null;
  features: FeatureFlags;
};

function paymentStatusLabel(status: string) {
  const map: Record<string, string> = {
    paid: 'Al día',
    pending: 'Pago pendiente',
    overdue: 'Con deuda',
    due: 'Por vencer',
  };
  return map[status] || status;
}

function deriveStatus(payments: any[], config: any): { status: string; lastApproved: any; nextDue: string | null } {
  const today = new Date();
  const dueDay = config?.dueDayOfMonth || 10;
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const currentPeriod = `${year}-${String(month).padStart(2, '0')}`;

  const currentMonthPayments = (payments || []).filter((p: any) => p.month === currentPeriod);
  const hasApproved = currentMonthPayments.some((p: any) => p.status === 'approved');
  const hasPending = currentMonthPayments.some((p: any) => p.status === 'pending');

  const due = new Date(year, month - 1, dueDay);
  const isPastDue = today > due;
  const lastApproved = [...(payments || [])].filter((p: any) => p.status === 'approved').sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  let status = 'overdue';
  if (hasApproved) status = 'paid';
  else if (hasPending) status = 'pending';
  else if (!isPastDue) status = 'due';

  const nextDue = `${String(dueDay).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  return { status, lastApproved, nextDue };
}

export function OwnerHomeSection({ user, features }: Props) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    ownerApi.summary()
      .then((r) => setSummary(r?.data ?? r))
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar resumen.'))
      .finally(() => setLoading(false));
  }, []);

  const config = summary?.config;
  const payments = summary?.payments || [];
  const notices = summary?.notices || [];
  const units = summary?.units || [];
  const { status, lastApproved, nextDue } = deriveStatus(payments, config);

  const unitNames = units.map((u: any) => u.name || u.unit?.name).filter(Boolean).join(', ') || '-';
  const balance = summary?.membership?.balance ?? summary?.balance;
  const hasBalance = balance !== undefined && Number(balance) !== 0;

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">
            Bienvenido{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          {unitNames !== '-' && (
            <div className="admin-page-sub">Unidad{units.length > 1 ? 'es' : ''}: {unitNames}</div>
          )}
        </div>
      </div>

      {/* Status metrics */}
      <div className="metric-grid" style={{ marginBottom: 24 }}>
        <Metric
          loading={loading}
          icon={status === 'paid' ? CheckCircle2 : status === 'overdue' ? AlertTriangle : Clock}
          label="Estado del mes"
          value={loading ? '' : paymentStatusLabel(status)}
          hint={`Vencimiento: ${nextDue}`}
        />
        <Metric
          loading={loading}
          icon={CreditCard}
          label="Último pago"
          value={loading ? '' : lastApproved ? money(lastApproved.amount) : 'Sin pagos'}
          hint={lastApproved ? dateLabel(lastApproved.createdAt) : undefined}
        />
        {hasBalance && (
          <Metric
            loading={loading}
            icon={TrendingUp}
            label="Saldo"
            value={loading ? '' : money(balance)}
            hint={Number(balance) < 0 ? 'Deuda pendiente' : 'A favor'}
          />
        )}
        {config?.monthlyFee && (
          <Metric
            loading={loading}
            icon={CreditCard}
            label="Cuota mensual"
            value={loading ? '' : money(config.monthlyFee)}
          />
        )}
      </div>

      {error && (
        <div className="admin-notice error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {/* Recent notices */}
      {(features.notices !== false) && (
        <section className="card" style={{ marginBottom: 16 }}>
          <div className="card-h">
            <div><h3>Últimos avisos</h3></div>
          </div>
          <div className="card-body">
            {loading ? (
              <div>
                {[1, 2, 3].map(i => <div key={i} className="skeleton-box" style={{ height: 44, borderRadius: 8, marginBottom: 8 }} />)}
              </div>
            ) : notices.length === 0 ? (
              <Empty text="Sin avisos recientes." />
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {notices.slice(0, 5).map((n: any) => (
                  <div key={n._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <Bell size={15} color="var(--green)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.title || n.subject}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{dateLabel(n.createdAt || n.sentAt)}</div>
                    </div>
                    {!n.isRead && <span className="pill warn" style={{ fontSize: 11 }}><span className="d" />Nuevo</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Recent payments */}
      <section className="card">
        <div className="card-h">
          <div><h3>Últimos pagos</h3></div>
        </div>
        <div className="card-body">
          {loading ? (
            <div>
              {[1, 2].map(i => <div key={i} className="skeleton-box" style={{ height: 44, borderRadius: 8, marginBottom: 8 }} />)}
            </div>
          ) : payments.length === 0 ? (
            <Empty text="Sin pagos registrados." />
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {payments.slice(0, 5).map((p: any) => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <MessageSquare size={15} color="var(--text-faint)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>
                      {money(p.amount)} — {p.month || '-'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>{dateLabel(p.createdAt)}</div>
                  </div>
                  <Status value={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
