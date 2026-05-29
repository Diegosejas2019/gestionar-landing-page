import { useState } from 'react';
import { CalendarDays, CheckCircle2, LogIn, RefreshCw, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { idOf, person } from './adminFormat';

export function AdminVisitsSection({ ctx }: { ctx: any }) {
  const { visits, loading, config, tab, run, refresh, can } = ctx;
  const [visitFilter, setVisitFilter] = useState<'all' | 'inside' | 'exited' | 'expected'>('all');

  const vs = visits || [];
  const inside = vs.filter((v: any) => v.status === 'inside');
  const pending = vs.filter((v: any) => v.status === 'pending');
  const approved = vs.filter((v: any) => v.status === 'approved');
  const rejected = vs.filter((v: any) => v.status === 'rejected');
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayVisits = vs.filter((v: any) => v.expectedDate?.slice(0, 10) === todayStr);
  const exited = vs.filter((v: any) => v.status === 'exited');
  const filtered = visitFilter === 'all' ? vs
    : visitFilter === 'inside' ? inside
    : visitFilter === 'exited' ? exited
    : [...approved, ...pending];

  const dotColor = (status: string) => ({
    inside: 'var(--pos)', exited: 'var(--ink-3)',
    approved: 'var(--info)', pending: 'var(--warn)', rejected: 'var(--neg)'
  }[status] || 'var(--ink-3)');

  const statusPill = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      inside:   { label: 'Ingresó', color: 'var(--pos)' },
      exited:   { label: 'Egresó', color: 'var(--ink-2)' },
      approved: { label: 'Esperado', color: 'var(--warn)' },
      pending:  { label: 'Pendiente', color: 'var(--warn)' },
      rejected: { label: 'Bloqueado', color: 'var(--neg)' },
    };
    const m = map[status] || { label: status, color: 'var(--ink-2)' };
    return <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:500, padding:'1px 7px', borderRadius:10, background:`${m.color}18`, color:m.color }}>{m.label}</span>;
  };

  return (
    <>
      <div className="admin-page-head">
        <div>
          <div className="admin-page-kicker"><span className="dot" />Operaciones</div>
          <h1 className="admin-page-title">Visitas e ingresos</h1>
          <div className="admin-page-sub">
            {inside.length} adentro · {exited.length} egresos · {pending.length} pendientes · {vs.length} total
            {config?.consortiumName ? ` · ${config.consortiumName}` : ''}
          </div>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
        </div>
      </div>

      <div className="metric-grid compact" style={{ marginBottom: 16 }}>
        <div className={`metric-card pos-card ${loading ? 'skeleton' : ''}`}>
          <div className="metric-icon"><ShieldCheck size={18} /></div>
          <div className="metric-body">
            <div className="metric-label">Adentro ahora</div>
            {loading ? <div className="skeleton-val" /> : <div className="metric-value">{inside.length}</div>}
            <div className="metric-hint">autorizados</div>
          </div>
        </div>
        <div className={`metric-card ${loading ? 'skeleton' : ''}`}>
          <div className="metric-icon" style={{ color: 'var(--info)' }}><CheckCircle2 size={18} /></div>
          <div className="metric-body">
            <div className="metric-label">Pre-registrados</div>
            {loading ? <div className="skeleton-val" /> : <div className="metric-value">{approved.length}</div>}
            <div className="metric-hint">aprobados sin ingresar</div>
          </div>
        </div>
        <div className={`metric-card ${loading ? 'skeleton' : ''}`}>
          <div className="metric-icon" style={{ color: 'var(--accent)' }}><CalendarDays size={18} /></div>
          <div className="metric-body">
            <div className="metric-label">Visitas hoy</div>
            {loading ? <div className="skeleton-val" /> : <div className="metric-value">{todayVisits.length}</div>}
            <div className="metric-hint">programadas para hoy</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-h">
            <h3>Movimientos</h3>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all','inside','exited','expected'] as const).map(f => (
                <button key={f} className={`chip${visitFilter === f ? ' active' : ''}`} onClick={() => setVisitFilter(f)}>
                  {f === 'all' ? 'Todos' : f === 'inside' ? 'Ingresos' : f === 'exited' ? 'Egresos' : 'Esperados'}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="card-body">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 44, borderRadius: 6, marginBottom: 8 }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="card-body"><span style={{ color: 'var(--ink-3)', fontSize: 13 }}>Sin movimientos.</span></div>
          ) : (
            <div style={{ position: 'relative', padding: '12px 16px' }}>
              <div style={{ position: 'absolute', left: 88, top: 16, bottom: 16, width: 1, background: 'var(--line-1)' }} />
              {filtered.map((v: any, i: number) => (
                <div key={idOf(v)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', position: 'relative', borderBottom: i < filtered.length - 1 ? '1px solid var(--line-1)' : 'none' }}>
                  <div style={{ width: 52, fontSize: 11.5, color: v.status === 'pending' || v.status === 'approved' ? 'var(--warn)' : 'var(--ink-2)', fontWeight: v.status === 'pending' ? 600 : 400, fontFamily: 'monospace', flexShrink: 0 }}>
                    {v.expectedDate ? new Date(v.expectedDate).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-1)', border: '1px solid var(--line-1)', display: 'grid', placeItems: 'center', position: 'relative', zIndex: 1, flexShrink: 0 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(v.status), display: 'block' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-0)', fontWeight: 500 }}>{v.visitorName || v.name || '—'}</span>
                      {v.type && <span style={{ fontSize: 11, color: 'var(--ink-2)', padding: '1px 6px', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--line-1)' }}>{v.type}</span>}
                      {statusPill(v.status)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                      {person(v) || 'Sin propietario'}
                    </div>
                    {v.guardNote && (
                      <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 4, padding: '3px 7px', background: 'rgba(var(--accent-rgb,156,242,123),0.08)', borderRadius: 6, border: '1px solid rgba(156,242,123,0.15)' }}>
                        📋 {v.guardNote}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {(v.status === 'pending') && can('visits.update') && (
                      <>
                        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => run(idOf(v), () => adminApi.visits.status(idOf(v), 'approved'), 'Visita aprobada.')}>Aprobar</button>
                        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => run(idOf(v), () => adminApi.visits.status(idOf(v), 'rejected'), 'Visita rechazada.')}>Rechazar</button>
                      </>
                    )}
                    {(v.status === 'approved') && (
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => run(idOf(v), () => adminApi.visits.checkIn(idOf(v)), 'Ingreso registrado correctamente.')}>Ingreso</button>
                    )}
                    {v.status === 'inside' && (
                      <button className="btn btn-ghost" style={{ fontSize: 11, padding: '2px 7px' }} onClick={() => run(idOf(v), () => adminApi.visits.checkOut(idOf(v)), 'Egreso registrado correctamente.')}>Egreso</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-h">
              <h3>Próximos esperados</h3>
              <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'monospace' }}>{[...approved, ...pending].length}</span>
            </div>
            <div className="card-body" style={{ padding: 12 }}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 6, marginBottom: 6 }} />)
              ) : [...approved, ...pending].length === 0 ? (
                <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>Sin visitas esperadas.</span>
              ) : (
                [...approved, ...pending].slice(0, 8).map((v: any, i: number, arr: any[]) => (
                  <div key={idOf(v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: i < arr.length - 1 ? '1px solid var(--line-1)' : 'none' }}>
                    <div style={{ fontSize: 11.5, color: 'var(--warn)', fontFamily: 'monospace', fontWeight: 600, width: 40, flexShrink: 0 }}>
                      {v.expectedDate ? new Date(v.expectedDate).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, color: 'var(--ink-0)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.visitorName || v.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{person(v) || '—'} · {v.type || 'visita'}</div>
                    </div>
                    {v.status === 'approved' && (
                      <button className="icon-btn" title="Registrar ingreso" onClick={() => run(idOf(v), () => adminApi.visits.checkIn(idOf(v)), 'Ingreso registrado correctamente.')}>
                        <LogIn size={13} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Distribución por estado</h3></div>
            <div className="card-body" style={{ padding: 14 }}>
              {loading ? (
                <div className="skeleton" style={{ height: 80, borderRadius: 6 }} />
              ) : vs.length === 0 ? (
                <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>Sin datos.</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Adentro', count: inside.length, color: 'var(--pos)' },
                    { label: 'Pre-registrados', count: approved.length, color: 'var(--info)' },
                    { label: 'Pendientes', count: pending.length, color: 'var(--warn)' },
                    { label: 'Egresados', count: exited.length, color: 'var(--ink-3)' },
                    { label: 'Bloqueados', count: rejected.length, color: 'var(--neg)' },
                  ].filter(r => r.count > 0).map(row => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-1)', width: 100, flexShrink: 0 }}>{row.label}</span>
                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-2)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.round((row.count / vs.length) * 100)}%`, background: row.color, borderRadius: 3, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)', width: 20, textAlign: 'right', fontFamily: 'monospace' }}>{row.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
