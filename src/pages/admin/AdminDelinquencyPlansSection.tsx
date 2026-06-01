import { AlertTriangle, Building2, CalendarDays, CheckCircle2, CreditCard, Download, Inbox, RefreshCw, Search, TrendingUp, Users, WalletCards } from 'lucide-react';
import { Table } from '../../components/Table';
import { Actions, Field, Metric, Status } from './adminComponents';
import { dateLabel, idOf, money, person } from './adminFormat';

type SectionMode = 'morosidad' | 'planes';

export function AdminDelinquencyPlansSection({ mode, ctx }: { mode: SectionMode; ctx: any }) {
  if (mode === 'morosidad') return <DelinquencySection ctx={ctx} />;
  return <PaymentPlansSection ctx={ctx} />;
}

function DelinquencySection({ ctx }: { ctx: any }) {
  const {
    config, downloadDelinquencyCsv, refresh, tab, loading, delinquencySummary, delinquencyAging,
    delinquencyFilters, setDelinquencyFilters, delinquencyPagination, delinquencyOwners,
    openDelinquencyDetail, hasPermission, openDebtReminder
  } = ctx;

  return (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Finanzas</div>
                <h1 className="admin-page-title">Morosidad</h1>
                <div className="admin-page-sub">Ranking de deuda exigible, atrasos y recordatorios · {config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => downloadDelinquencyCsv()}><Download size={14} />CSV</button>
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
              </div>
            </div>

            <div className="metric-grid">
              <Metric row loading={loading} label="Deuda vencida" value={money(delinquencySummary.totalDebt)} icon={AlertTriangle} />
              <Metric row loading={loading} label="Morosos" value={delinquencySummary.delinquentOwners || 0} hint={`${delinquencySummary.delinquencyRate || 0}% de la comunidad`} icon={Users} />
              <Metric row loading={loading} label="Unidades" value={delinquencySummary.delinquentUnits || 0} hint="Con deuda" icon={Building2} />
              <Metric row loading={loading} label="Promedio" value={money(delinquencySummary.averageDebt)} hint="Por moroso" icon={TrendingUp} />
              <Metric row loading={loading} label="Más antigua" value={delinquencySummary.oldestDebtPeriod || '-'} hint="Período" icon={CalendarDays} />
              <Metric row loading={loading} label="Por aprobar" value={delinquencySummary.pendingPaymentsCount || 0} hint={money(delinquencySummary.pendingPaymentsAmount)} icon={Inbox} />
            </div>

            <div className="admin-panel">
              <div className="panel-head"><h2><CalendarDays size={14} />Antigüedad de deuda</h2></div>
              <div className="metric-grid">
                {delinquencyAging.map((bucket: any) => (
                  <Metric key={bucket.key} row loading={loading} label={bucket.label} value={money(bucket.amount)} hint={`${bucket.owners || 0} propietario${bucket.owners === 1 ? '' : 's'}`} icon={AlertTriangle} />
                ))}
              </div>
            </div>

            <div className="admin-panel">
              <div className="panel-head"><h2><Search size={14} />Filtros</h2></div>
              <div className="admin-form" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                <Field label="Buscar" value={delinquencyFilters.search} onChange={(e: any) => setDelinquencyFilters((f: any) => ({ ...f, search: e.target.value, page: 1 }))} placeholder="Propietario, email o unidad" />
                <Field label="Período" type="month" value={delinquencyFilters.period} onChange={(e: any) => setDelinquencyFilters((f: any) => ({ ...f, period: e.target.value, page: 1 }))} />
                <label className="admin-field"><span>Estado</span><select value={delinquencyFilters.status} onChange={(e) => setDelinquencyFilters((f: any) => ({ ...f, status: e.target.value, page: 1 }))}>
                  <option value="all">Todos</option><option value="al_dia">Al día</option><option value="deuda_leve">Deuda leve</option><option value="deuda_media">Deuda media</option><option value="deuda_alta">Deuda alta</option><option value="mora_critica">Mora crítica</option>
                </select></label>
                <label className="admin-field"><span>Orden</span><select value={delinquencyFilters.sort} onChange={(e) => setDelinquencyFilters((f: any) => ({ ...f, sort: e.target.value, page: 1 }))}>
                  <option value="debt_desc">Mayor deuda</option><option value="days_desc">Más atraso</option><option value="name">Nombre</option><option value="unit">Unidad</option><option value="last_payment">Último pago</option>
                </select></label>
                <Field label="Deuda mínima" type="number" value={delinquencyFilters.minDebt} onChange={(e: any) => setDelinquencyFilters((f: any) => ({ ...f, minDebt: e.target.value, page: 1 }))} />
                <Field label="Días atraso mín." type="number" value={delinquencyFilters.minDaysOverdue} onChange={(e: any) => setDelinquencyFilters((f: any) => ({ ...f, minDaysOverdue: e.target.value, page: 1 }))} />
                <label className="admin-check"><input type="checkbox" checked={delinquencyFilters.pendingReview} onChange={(e) => setDelinquencyFilters((f: any) => ({ ...f, pendingReview: e.target.checked, page: 1 }))} /> Solo por aprobar</label>
                <label className="admin-check"><input type="checkbox" checked={delinquencyFilters.criticalOnly} onChange={(e) => setDelinquencyFilters((f: any) => ({ ...f, criticalOnly: e.target.checked, page: 1 }))} /> Solo críticos</label>
              </div>
            </div>

            <div className="admin-panel">
              <div className="panel-head"><h2><AlertTriangle size={14} />Ranking de morosos</h2><span>{delinquencyPagination.total || 0} resultados</span></div>
              <Table loading={loading} searchPlaceholder="Buscar en página" rows={delinquencyOwners} columns={[
                ['Propietario', (o: any) => <div><strong>{o.name}</strong><div style={{ color: 'var(--muted)', fontSize: 12 }}>{o.email}</div></div>],
                ['Unidad/Lote', (o: any) => (o.units || []).join(', ') || '-'],
                ['Deuda total', (o: any) => money(o.totalOwed)],
                ['Períodos', (o: any) => (o.unpaidPeriods || []).join(', ') || '-'],
                ['Más antiguo', (o: any) => o.oldestPeriod || '-'],
                ['Atraso', (o: any) => `${o.daysOverdue || 0} días`],
                ['Estado', (o: any) => <span className={`badge ${o.status === 'mora_critica' || o.status === 'deuda_alta' ? 'danger' : o.status === 'al_dia' ? 'success' : 'warning'}`}>{String(o.status || '').replace(/_/g, ' ')}</span>],
                ['Riesgo', (o: any) => {
                  const level = o.riskLevel;
                  if (!level || level === 'sin_deuda') return null;
                  const cls = level === 'critico' || level === 'alto' ? 'danger' : level === 'medio' ? 'warning' : 'success';
                  const labels: Record<string, string> = { bajo: 'Bajo', medio: 'Medio', alto: 'Alto', critico: 'Crítico' };
                  const reasons = (o.riskReasons || []).join('\n');
                  return <span className={`badge ${cls}`} title={reasons}>{labels[level] || level}</span>;
                }],
                ['', (o: any) => <Actions>
                  <button onClick={() => openDelinquencyDetail(idOf(o))}>Detalle</button>
                  {hasPermission('payments.remind') && Number(o.totalOwed || 0) > 0 && <button onClick={() => openDebtReminder(o)}>Recordar</button>}
                  <button onClick={() => downloadDelinquencyCsv(idOf(o))}>CSV</button>
                </Actions>]
              ]} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <button className="btn btn-ghost" disabled={(delinquencyPagination.page || 1) <= 1} onClick={() => setDelinquencyFilters((f: any) => ({ ...f, page: Math.max(1, f.page - 1) }))}>Anterior</button>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>Página {delinquencyPagination.page || 1} de {delinquencyPagination.pages || 1}</span>
                <button className="btn btn-ghost" disabled={(delinquencyPagination.page || 1) >= (delinquencyPagination.pages || 1)} onClick={() => setDelinquencyFilters((f: any) => ({ ...f, page: f.page + 1 }))}>Siguiente</button>
              </div>
            </div>
          </>
  );
}

function PaymentPlansSection({ ctx }: { ctx: any }) {
  const {
    config, paymentPlanStatus, setPaymentPlanStatus, refresh, tab, paymentPlansLoading, loading,
    paymentPlans, approvePaymentPlan, rejectPaymentPlan, cancelPaymentPlan, registerPlanInstallment
  } = ctx;

  return (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Finanzas</div>
                <h1 className="admin-page-title">Planes de pago</h1>
                <div className="admin-page-sub">Solicitudes, cuotas y regularización de deuda · {config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <label className="admin-field" style={{ minWidth: 190 }}>
                  <span>Estado</span>
                  <select value={paymentPlanStatus} onChange={(e) => setPaymentPlanStatus(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="requested">Solicitados</option>
                    <option value="approved">Aprobados</option>
                    <option value="active">Activos</option>
                    <option value="completed">Completados</option>
                    <option value="rejected">Rechazados</option>
                    <option value="cancelled">Cancelados</option>
                    <option value="defaulted">En mora</option>
                  </select>
                </label>
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
              </div>
            </div>
            <div className="metric-grid">
              <Metric row loading={paymentPlansLoading || loading} label="Solicitados" value={paymentPlans.filter((p: any) => p.status === 'requested').length} hint="Esperan revisión" icon={Inbox} />
              <Metric row loading={paymentPlansLoading || loading} label="Activos" value={paymentPlans.filter((p: any) => p.status === 'active' || p.status === 'approved').length} hint="En curso" icon={WalletCards} />
              <Metric row loading={paymentPlansLoading || loading} label="Capital" value={money(paymentPlans.reduce((sum: number, p: any) => sum + Number(p.totalAmount || p.originalDebtAmount || 0), 0))} icon={CreditCard} />
              <Metric row loading={paymentPlansLoading || loading} label="Finalizados" value={paymentPlans.filter((p: any) => p.status === 'completed').length} hint="Completados" icon={CheckCircle2} />
            </div>
            <div className="admin-panel">
              <div className="panel-head"><h2><WalletCards size={14} />Planes</h2><span>{paymentPlans.length} registros</span></div>
              <Table loading={paymentPlansLoading || loading} searchPlaceholder="Buscar propietario o estado" rows={paymentPlans} columns={[
                ['Propietario', (p: any) => <div><strong>{person(p)}</strong><div style={{ color: 'var(--muted)', fontSize: 12 }}>{p.owner?.email || p.user?.email || '-'}</div></div>],
                ['Estado', (p: any) => <Status value={p.status} />],
                ['Deuda original', (p: any) => money(p.originalDebtAmount)],
                ['Total plan', (p: any) => money(p.totalAmount)],
                ['Cuotas', (p: any) => `${p.installmentsCount || p.installments?.length || '-'} cuota${Number(p.installmentsCount || p.installments?.length || 0) === 1 ? '' : 's'}`],
                ['Inicio', (p: any) => dateLabel(p.startDate)],
                ['Acciones', (p: any) => <Actions>
                  {p.status === 'requested' && <button onClick={() => approvePaymentPlan(p)}>Aprobar</button>}
                  {p.status === 'requested' && <button onClick={() => rejectPaymentPlan(p)}>Rechazar</button>}
                  {!['cancelled', 'completed', 'rejected'].includes(p.status) && <button onClick={() => cancelPaymentPlan(p)}>Cancelar</button>}
                  {(p.installments || []).find((i: any) => i.status === 'pending') && (
                    <button onClick={() => registerPlanInstallment((p.installments || []).find((i: any) => i.status === 'pending'))}>Pagar cuota</button>
                  )}
                </Actions>]
              ]} />
            </div>
          </>
  );
}

