import { AlertTriangle, Bell, ChevronRight, MoreVertical } from 'lucide-react';
import { Empty, Status } from './adminComponents';
import { adminInitials, dateLabel, debtAmount, expensesByCategory, fmtK, idOf, money, person, unitLabel } from './adminFormat';

export function AttentionHero({ payments, claims, loading, onFinanzas, onComunidad }: {
  payments: any[]; claims: any[]; loading: boolean;
  onFinanzas: () => void; onComunidad: () => void;
}) {
  const pendingPayments = (payments || []).filter((p) => p.status === 'pending');
  const openClaims = (claims || []).filter((c) => c.status === 'open');

  const items: Array<{ tone: string; title: string; sub: string; cta: string; onClick: () => void }> = [];
  if (pendingPayments.length > 0) {
    const total = pendingPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    items.push({
      tone: 'neg',
      title: `Aprobar ${pendingPayments.length} pago${pendingPayments.length !== 1 ? 's' : ''} en revisión`,
      sub: `${money(total)} acumulado · incluye pagos de MercadoPago`,
      cta: 'Revisar',
      onClick: onFinanzas,
    });
  }
  if (openClaims.length > 0) {
    items.push({
      tone: 'warn',
      title: `${openClaims.length} reclamo${openClaims.length !== 1 ? 's' : ''} abierto${openClaims.length !== 1 ? 's' : ''} sin resolver`,
      sub: 'Comunidad esperando respuesta · revisá el estado de cada uno',
      cta: 'Ver',
      onClick: onComunidad,
    });
  }

  if (loading || items.length === 0) return null;

  return (
    <div className="attention-hero">
      <div className="attention-hero-head">
        <div className="admin-page-kicker" style={{ marginBottom: 4 }}><span className="dot" />Requiere tu atención</div>
        <h2>{items.length === 1 ? '1 cosa para resolver hoy' : `${items.length} cosas para resolver hoy`}</h2>
        <p>El sistema identificó lo que mueve la aguja en cobranza y operación.</p>
      </div>
      <div className="attention-items">
        {items.map((item, i) => (
          <div key={i} className="attention-item">
            <div className={`attention-item-icon ${item.tone}`}>
              {item.tone === 'neg' ? <AlertTriangle size={14} /> : <Bell size={14} />}
            </div>
            <div className="attention-item-body">
              <b>{item.title}</b>
              <span>{item.sub}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={item.onClick}>{item.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CobroStrip({ payments, loading }: { payments: any[]; loading: boolean }) {
  if (loading || !payments?.length) return null;

  const approved = payments.filter((p) => p.status === 'approved');
  const pending = payments.filter((p) => p.status === 'pending');
  const rejected = payments.filter((p) => p.status === 'rejected');
  const total = payments.length;

  const cols = [
    { label: 'Pagado', tone: 'pos', count: approved.length, amount: money(approved.reduce((s, p) => s + Number(p.amount || 0), 0)), pct: Math.round((approved.length / total) * 100) },
    { label: 'Pendiente', tone: 'warn', count: pending.length, amount: money(pending.reduce((s, p) => s + Number(p.amount || 0), 0)), pct: Math.round((pending.length / total) * 100) },
    { label: 'Rechazado', tone: 'neg', count: rejected.length, amount: money(rejected.reduce((s, p) => s + Number(p.amount || 0), 0)), pct: Math.round((rejected.length / total) * 100) },
    { label: 'Total', tone: 'muted', count: total, amount: money(payments.reduce((s, p) => s + Number(p.amount || 0), 0)), pct: 100 },
  ];

  const barColors = ['var(--pos)', 'var(--warn)', 'var(--neg)', 'var(--line-2)'];

  return (
    <div className="cobro-strip">
      <div className="cobro-strip-cols">
        {cols.map((col, i) => (
          <div key={i} className="cobro-col">
            <div className="cobro-col-label">
              <span className={`pill ${col.tone}`}><span className="d" />{col.label} <span style={{ fontFamily: 'var(--font-mono)', opacity: .7 }}>{col.pct}%</span></span>
            </div>
            <div className="cobro-col-count">{col.count}</div>
            <div className="cobro-col-amount">{col.amount}</div>
          </div>
        ))}
      </div>
      <div className="cobro-bar">
        {cols.map((col, i) => (
          col.pct > 0 && <div key={i} className="cobro-bar-seg" style={{ flex: col.pct, background: barColors[i] }} />
        ))}
      </div>
    </div>
  );
}

export function ClaimKanban({ claims, loading, onInProgress, onResolve, onDelete }: {
  claims: any[]; loading: boolean;
  onInProgress: (id: string) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) return <Empty text="Cargando reclamos…" />;
  if (!claims.length) return <Empty text="No hay reclamos registrados." />;

  const claimCategoryLabel: Record<string, string> = {
    infrastructure: 'Infraestructura', security: 'Seguridad', noise: 'Ruido',
    cleaning: 'Limpieza', billing: 'Facturación', other: 'Otro',
  };

  const cols: Array<{ key: string; label: string; tone: string }> = [
    { key: 'open', label: 'Abierto', tone: 'warn' },
    { key: 'in_progress', label: 'En progreso', tone: 'info' },
    { key: 'resolved', label: 'Resuelto', tone: 'pos' },
  ];

  return (
    <div className="kanban-board">
      {cols.map((col) => {
        const items = claims.filter((c) => c.status === col.key);
        return (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-head">
              <span className={`pill ${col.tone}`}><span className="d" />{col.label}</span>
              <span className="kanban-col-count">{items.length}</span>
            </div>
            <div className="kanban-cards">
              {items.length === 0 ? (
                <div className="kanban-empty">Sin reclamos</div>
              ) : items.map((c) => (
                <div key={idOf(c)} className="kanban-card">
                  <div className="kanban-card-cat">
                    <span className="pill muted">{claimCategoryLabel[c.category] || c.category}</span>
                    <span className="kanban-card-time">{dateLabel(c.createdAt)}</span>
                  </div>
                  <div className="kanban-card-title">{c.title}</div>
                  {c.description && <p className="kanban-card-desc">{c.description}</p>}
                  <div className="kanban-card-from">
                    <div className="owner-avatar sm">{adminInitials(person(c))}</div>
                    <span>{person(c)}</span>
                  </div>
                  {c.adminNote && <p className="kanban-card-note">{c.adminNote}</p>}
                  <div className="kanban-card-actions">
                    {col.key === 'open' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => onInProgress(idOf(c))}>En progreso</button>
                    )}
                    {col.key !== 'resolved' && (
                      <button className="btn btn-primary btn-sm" onClick={() => onResolve(idOf(c))}>Resolver</button>
                    )}
                    {col.key === 'resolved' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => onDelete(idOf(c))}>Eliminar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ComplianceHero({ ownerStats, pendingCount, debtorCount, claimCount, loading, onPending, onDebtors, onClaims }: {
  ownerStats: any; pendingCount: number; debtorCount: number; claimCount: number; loading: boolean;
  onPending: () => void; onDebtors: () => void; onClaims: () => void;
}) {
  if (loading) {
    return (
      <div className="compliance-hero">
        <div className="skeleton-line" style={{ width: '40%', marginBottom: 12 }} />
        <div className="skeleton-line big" style={{ marginBottom: 10 }} />
        <div className="skeleton-line" style={{ marginBottom: 16, height: 6, borderRadius: 4 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton-line short" style={{ flex: 1 }} />
          <div className="skeleton-line short" style={{ flex: 1 }} />
          <div className="skeleton-line short" style={{ flex: 1 }} />
        </div>
      </div>
    );
  }
  const rate = ownerStats?.complianceRate || 0;
  const upToDate = ownerStats?.upToDate || 0;
  const total = ownerStats?.totalOwners || 0;
  return (
    <div className="compliance-hero">
      <div className="compliance-hero-top">
        <div className="compliance-hero-label"><span className="dot" />ESTADO DEL CONSORCIO</div>
      </div>
      <div className="compliance-hero-main">
        <div className="compliance-hero-percent">{rate}<span className="compliance-pct">%</span></div>
        <div className="compliance-hero-desc"><strong>{upToDate} de {total}</strong> propietarios al día este mes</div>
      </div>
      <div className="compliance-bar"><div className="compliance-fill" style={{ width: `${rate}%` }} /></div>
      <div className="compliance-chips">
        <button className="compliance-chip warn" onClick={onPending}>
          <span className="chip-num">{pendingCount}</span>
          <span className="chip-lbl">Por revisar</span>
        </button>
        <button className="compliance-chip alert" onClick={onDebtors}>
          <span className="chip-num">{debtorCount}</span>
          <span className="chip-lbl">Morosos</span>
        </button>
        <button className="compliance-chip" onClick={onClaims}>
          <span className="chip-num">{claimCount}</span>
          <span className="chip-lbl">Reclamos</span>
        </button>
      </div>
    </div>
  );
}

export function PendingReceiptsSection({ payments, loading, onApprove, onReject, onViewAll }: {
  payments: any[]; loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewAll: () => void;
}) {
  if (loading || payments.length === 0) return null;
  return (
    <div className="pending-receipts-section">
      <div className="pending-receipts-head">
        <div>
          <h3>Comprobantes por revisar</h3>
          <span className="pending-receipts-sub">{payments.length} esperando aprobación</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onViewAll}>Ver todos →</button>
      </div>
      <div className="pending-receipts-list">
        {payments.map((p) => (
          <div key={idOf(p)} className="pending-receipt-row">
            <div className="pending-receipt-ava">{adminInitials(person(p))}</div>
            <div className="pending-receipt-info">
              <div className="pending-receipt-name">{person(p)}</div>
              <div className="pending-receipt-meta">
                {unitLabel(p) || p.owner?.unit || ''} · {p.month || dateLabel(p.createdAt)} · <strong>{money(p.amount)}</strong>
              </div>
            </div>
            <div className="pending-receipt-actions">
              <button className="btn btn-success btn-sm" onClick={() => onApprove(idOf(p))}>Aprobar</button>
              <button className="btn btn-danger btn-sm" onClick={() => onReject(idOf(p))}>Rechazar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PendingCollectionSection({ rows, loading, onViewAll }: {
  rows: any[]; loading: boolean; onViewAll: () => void;
}) {
  if (loading) return (
    <div className="card">
      <div className="card-h"><div className="skeleton-line short" style={{ width: '40%' }} /></div>
      <div className="compact-list">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="compact-skeleton"><span className="skeleton-line" /><span className="skeleton-line short" /></div>)}
      </div>
    </div>
  );
  if (!rows.length) return null;

  const totalAmount = rows.reduce((s, r) => s + debtAmount(r), 0);

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Cobranza pendiente</h3>
          <div className="card-sub">{rows.length} {rows.length === 1 ? 'lote' : 'lotes'} · {money(totalAmount)} acumulado</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="pill neg"><span className="d" />Vencidos <strong style={{ marginLeft: 3 }}>{rows.length}</strong></span>
          <button className="btn btn-ghost btn-sm" onClick={onViewAll}>Ver todos <ChevronRight size={12} /></button>
        </div>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Lote / Propietario</th>
            <th>Estado</th>
            <th className="num">Deuda</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={idOf(r)}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="pending-receipt-ava">{adminInitials(person(r))}</div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 12.5 }}>{person(r)}</div>
                    <div style={{ fontSize: 11, opacity: 0.55, fontFamily: 'var(--font-mono, monospace)' }}>{unitLabel(r)}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className="pill neg"><span className="d" />Vencido</span>
              </td>
              <td className="num" style={{ color: 'var(--danger)' }}>{money(debtAmount(r))}</td>
              <td>
                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={onViewAll}>
                  <MoreVertical size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OpenClaimsSection({ claims, loading, onNavigate }: {
  claims: any[]; loading: boolean; onNavigate: () => void;
}) {
  if (loading || claims.length === 0) return null;
  const claimCatLabel: Record<string, string> = {
    infrastructure: 'Infraestructura', security: 'Seguridad', noise: 'Ruido',
    cleaning: 'Limpieza', billing: 'Facturación', other: 'Otro'
  };
  return (
    <div className="open-claims-section card">
      <div className="card-h">
        <div>
          <h3>Reclamos abiertos</h3>
          <div className="card-sub">{claims.length} sin resolver</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onNavigate}>Ver todos</button>
      </div>
      <div className="card-body">
        {claims.slice(0, 5).map((c) => (
          <div key={idOf(c)} className="open-claim-row">
            <div className="open-claim-info">
              <div className="open-claim-title">{c.title}</div>
              <div className="open-claim-meta">{person(c)} · {unitLabel(c) || c.owner?.unit || ''} · {claimCatLabel[c.category] || c.category}</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={onNavigate}>Ver</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PeriodTabs({ value, onChange }: { value: string; onChange: (v: 'mes' | 'trimestre' | 'año' | 'todo') => void }) {
  const opts: Array<{ key: 'mes' | 'trimestre' | 'año' | 'todo'; label: string }> = [
    { key: 'mes', label: 'Mes' },
    { key: 'trimestre', label: 'Trimestre' },
    { key: 'año', label: 'Año' },
    { key: 'todo', label: 'Todo' }
  ];
  return (
    <div className="period-tabs">
      {opts.map((o) => (
        <button key={o.key} className={`period-tab${value === o.key ? ' active' : ''}`} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ExpenseBreakdown({ yearExpenses, loading }: { yearExpenses: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="expense-breakdown card" style={{ marginBottom: 16 }}>
        <div className="card-h"><h3>Gastos por categoría</h3></div>
        <div className="card-body">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div className="skeleton-line short" style={{ marginBottom: 6 }} />
              <div className="skeleton-line" style={{ height: 6, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  const cats = expensesByCategory(yearExpenses);
  if (!cats.length) return null;
  const catTotal = cats.reduce((s, c) => s + c.amount, 0);
  return (
    <div className="expense-breakdown card" style={{ marginBottom: 16 }}>
      <div className="card-h">
        <h3>Gastos por categoría</h3>
        <div className="card-sub">${fmtK(catTotal)} total</div>
      </div>
      <div className="card-body">
        {cats.map((cat) => (
          <div key={cat.cat} className="expense-bd-item">
            <div className="expense-bd-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="expense-bd-dot" style={{ background: cat.color }} />
                <span className="expense-bd-label">{cat.label}</span>
              </div>
              <span className="expense-bd-amt">${fmtK(cat.amount)} <span style={{ color: 'var(--muted)', fontSize: 11 }}>{cat.pct}%</span></span>
            </div>
            <div className="expense-bd-bar">
              <div className="expense-bd-fill" style={{ width: `${Math.max(cat.pct, 2)}%`, background: cat.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PeriodTable({ monthly, loading }: { monthly: any[]; loading: boolean }) {
  if (loading || !monthly.length) return null;
  const chip = (n: number, type: string) => (
    <span className={`period-chip ${n === 0 ? 'zero' : type}`}>{n}</span>
  );
  return (
    <div className="period-table card" style={{ marginBottom: 16, overflow: 'hidden' }}>
      <div className="card-h"><h3>Detalle por período</h3></div>
      <div className="period-table-cols">
        <span>Período</span><span>Aprobados</span><span>Pendientes</span><span>Rechazados</span><span style={{ textAlign: 'right' }}>Recaudado</span>
      </div>
      {monthly.map((m) => {
        const [yr, mo] = String(m._id).split('-');
        const mName = new Date(`${yr}-${mo}-15`).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
        return (
          <div key={m._id} className="period-row">
            <div className="period-cell">
              <div className="period-mo">{mName}</div>
              <div className="period-yr">{yr}</div>
            </div>
            {chip(m.count || 0, 'ok')}
            {chip(m.pending || 0, 'pend')}
            {chip(m.rejected || 0, 'rej')}
            <div className="period-amt">${fmtK(m.total || 0)}</div>
          </div>
        );
      })}
    </div>
  );
}

export function YearMonth({ year, setYear, month, setMonth }: { year: number; setYear: (year: number) => void; month: string; setMonth: (month: string) => void }) {
  return (
    <div className="period-controls">
      <button onClick={() => setYear(year - 1)}>-</button>
      <input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
      <button onClick={() => setYear(year + 1)}>+</button>
      <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
    </div>
  );
}
