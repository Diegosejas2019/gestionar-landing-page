import { useEffect, useState } from 'react';
import { AlertTriangle, Building2, CheckCircle2, WalletCards } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import { dateLabel, money } from '../admin/adminFormat';
import { Empty, Metric, Status } from '../admin/adminComponents';

const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function fmtPeriod(ym: string | undefined): string | null {
  if (!ym) return null;
  const [y, m] = ym.split('-');
  return `${MESES_CORTO[parseInt(m, 10) - 1] || m} ${y}`;
}

const PLAN_STATUS: Record<string, string> = {
  requested: 'Solicitado', approved: 'Aprobado', active: 'Activo',
  completed: 'Completado', rejected: 'Rechazado', cancelled: 'Cancelado', defaulted: 'Incumplido',
};

export function OwnerAccountSection() {
  const [loading, setLoading] = useState(true);
  const [debtItems, setDebtItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([ownerApi.debtItems.mine(), ownerApi.summary(), ownerApi.paymentPlans.my()])
      .then(([debtRes, sumRes, plansRes]) => {
        setDebtItems(debtRes?.data?.debtItems || []);
        const sd = sumRes?.data ?? sumRes;
        setSummary(sd);
        setUnits(sd?.units || []);
        setPaymentPlans(plansRes?.data?.plans || []);
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
      <div className="admin-page-head">
        <div><h1 className="admin-page-title">Mi cuenta</h1></div>
      </div>

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

      {(loading || units.length > 0) && (
        <section className="card">
          <div className="card-h">
            <div>
              <h3>Mis unidades</h3>
              <div className="card-sub">Unidades y cuotas mensuales asignadas</div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="skeleton-list">
                {[1, 2].map(i => <div key={i} className="skeleton-box" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {units.map((u) => (
                  <div key={u._id || u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <Building2 size={16} color="var(--text-faint)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name || 'Unidad'}</div>
                      {fmtPeriod(u.collectionStartPeriod) && (
                        <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                          Facturación desde {fmtPeriod(u.collectionStartPeriod)}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{money(u.finalFee ?? 0)}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>por mes</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {(loading || paymentPlans.length > 0) && (
        <section className="card">
          <div className="card-h">
            <div>
              <h3>Planes de pago</h3>
              <div className="card-sub">Acuerdos de pago en cuotas con el administrador</div>
            </div>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="skeleton-list">
                {[1, 2].map(i => <div key={i} className="skeleton-box" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />)}
              </div>
            ) : paymentPlans.length === 0 ? (
              <Empty text="Sin planes de pago activos." />
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {paymentPlans.map((plan) => (
                  <div key={plan._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <WalletCards size={16} color="var(--text-faint)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Plan de {plan.installmentsCount} cuota{plan.installmentsCount !== 1 ? 's' : ''}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                        {money(plan.totalAmount)} · {plan.startDate ? `Desde ${plan.startDate}` : 'Sin fecha'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <Status value={plan.status} label={PLAN_STATUS[plan.status] || plan.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
