import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, CreditCard, FileText } from 'lucide-react';
import { adminApi } from '../../../services/adminService';
import { dateLabel, money } from '../adminFormat';
import { Empty, Metric, Status } from '../adminComponents';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function fmtPeriod(ym: string): string {
  if (!ym) return ym;
  const [year, month] = ym.split('-');
  return `${MESES[parseInt(month, 10) - 1] || month} ${year}`;
}

const STATUS_LABELS: Record<string, string> = {
  approved:       'Pagado',
  pending:        'Pendiente',
  rejected:       'Rechazado',
  unpaid:         'Sin pago',
  not_applicable: 'No aplica',
};

const STATUS_TONES: Record<string, string> = {
  approved:       'pos',
  pending:        'warn',
  rejected:       'neg',
  unpaid:         'muted',
  not_applicable: 'muted',
};

type Props = { month: string };

export function AdminCompositionTab({ month }: Props) {
  const [period, setPeriod] = useState(month);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  async function load() {
    if (!period) return;
    setLoading(true);
    setError('');
    setData(null);
    setExpanded(new Set());
    try {
      const res = await adminApi.renditions.composition(period);
      setData(res?.data || null);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar la composición del período.');
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {/* Period selector */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap' }}>
        <label className="admin-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, margin: 0 }}>
          <span style={{ whiteSpace: 'nowrap', fontSize: 13 }}>Período</span>
          <input
            type="month"
            value={period}
            onChange={e => { setPeriod(e.target.value); setData(null); }}
            style={{ minWidth: 160 }}
          />
        </label>
        <button className="btn btn-primary" onClick={load} disabled={loading || !period}>
          {loading ? 'Cargando…' : 'Ver composición'}
        </button>
        {data && !loading && (
          <button className="btn btn-ghost" onClick={load} disabled={loading}>
            Refrescar
          </button>
        )}
      </div>

      {error && <div className="admin-notice error" style={{ marginBottom: 16 }}>{error}</div>}

      {!data && !loading && !error && (
        <Empty text="Seleccioná un período y hacé clic en 'Ver composición' para ver el detalle owner-by-owner." />
      )}

      {loading && (
        <div className="skeleton-list">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton-box" style={{ height: 64, borderRadius: 8, marginBottom: 8 }} />
          ))}
        </div>
      )}

      {data && !loading && (
        <>
          {/* Summary metrics */}
          <div className="metric-grid" style={{ marginBottom: 16 }}>
            <Metric row label="Pagados" value={data.stats.approved}
              hint={money(data.stats.totalCollected)} icon={CreditCard}
              delta={{ text: `de ${data.stats.total} propietarios`, trend: 'pos' }} />
            <Metric row label="Pendientes" value={data.stats.pending}
              hint={money(data.stats.totalPending)} icon={AlertTriangle}
              delta={data.stats.pending > 0 ? { text: 'Sin aprobar', trend: 'neg' } : { text: 'Sin pendientes', trend: 'pos' }} />
            <Metric row label="Sin pago" value={data.stats.unpaid}
              hint={data.stats.unpaid > 0 ? 'Requieren atención' : 'Todos pagaron'} icon={FileText}
              delta={data.stats.unpaid > 0 ? { text: 'Adeuda expensa', trend: 'neg' } : { text: 'Al día', trend: 'pos' }} />
            <Metric row label="Total esperado" value={money(data.stats.totalExpected)}
              hint={`Recaudado: ${money(data.stats.totalCollected)}`} icon={CreditCard} />
          </div>

          {/* Warnings */}
          {data.warnings?.length > 0 && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--surface)', borderLeft: '3px solid var(--warn)', borderRadius: 6, fontSize: 12 }}>
              {data.warnings.map((w: any, i: number) => (
                <div key={i} style={{ marginBottom: i < data.warnings.length - 1 ? 4 : 0, color: w.severity === 'warning' ? 'var(--warn)' : w.severity === 'critical' ? 'var(--neg)' : 'var(--text-dim)' }}>
                  {w.severity === 'warning' ? '⚠ ' : w.severity === 'critical' ? '✕ ' : 'ℹ '}{w.message}
                </div>
              ))}
            </div>
          )}

          {/* Existing rendition notice */}
          {data.existingRendition && (
            <div className="admin-notice" style={{ marginBottom: 16, fontSize: 13 }}>
              Rendición generada para {fmtPeriod(data.period)} (v{data.existingRendition.version}).
              {data.existingRendition.pdfUrl && (
                <a href={data.existingRendition.pdfUrl} target="_blank" rel="noopener" style={{ marginLeft: 8, color: 'var(--acc-1)', fontWeight: 600 }}>Ver PDF</a>
              )}
            </div>
          )}

          {/* Owner-by-owner table */}
          <div className="admin-panel">
            <div className="panel-head">
              <h2><FileText size={14} />Composición — {data.periodLabel}</h2>
              <span className="card-sub">{data.owners.length} propietarios activos</span>
            </div>

            {data.owners.length === 0 ? (
              <Empty text="Sin propietarios activos en este período." />
            ) : (
              <div style={{ padding: '0 0 8px' }}>
                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 120px 110px 36px', gap: 8, padding: '6px 14px', fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid var(--border)' }}>
                  <span>Propietario / Unidades</span>
                  <span style={{ textAlign: 'right' }}>Cuota</span>
                  <span style={{ textAlign: 'right' }}>Extras + Deuda</span>
                  <span style={{ textAlign: 'center' }}>Estado</span>
                  <span />
                </div>

                {data.owners.map((o: any) => {
                  const isExpanded = expanded.has(o.id || o._id);
                  const oid = o.id || o._id;
                  const extraTotal = (o.extraordinaryOwed || []).reduce((s: number, e: any) => s + (e.amount || 0), 0);
                  const debtTotal  = (o.debtItems || []).reduce((s: number, d: any) => s + (d.amount || 0), 0);
                  const addons = extraTotal + debtTotal;

                  const hasDetail = (
                    o.periodUnits?.length > 0 ||
                    o.payments?.approved?.length > 0 ||
                    o.payments?.pending?.length > 0 ||
                    o.payments?.rejected?.length > 0 ||
                    o.extraordinaryOwed?.length > 0 ||
                    o.debtItems?.length > 0 ||
                    o.balanceUnits?.length > 0
                  );

                  return (
                    <div key={oid} style={{ borderBottom: '1px solid var(--border)' }}>
                      {/* Main row */}
                      <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 130px 120px 110px 36px', gap: 8, padding: '10px 14px', alignItems: 'center', cursor: hasDetail ? 'pointer' : 'default' }}
                        onClick={() => hasDetail && toggleExpand(oid)}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-bright)' }}>{o.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                            {(o.units || []).map((u: any) => typeof u === 'string' ? u : u.name).filter(Boolean).join(', ') || '—'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                          {o.periodAmount !== null && o.periodAmount !== undefined ? money(o.periodAmount) : '—'}
                        </div>

                        <div style={{ textAlign: 'right', fontSize: 12, color: addons > 0 ? 'var(--neg)' : 'var(--text-dim)' }}>
                          {addons > 0 ? `+${money(addons)}` : '—'}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <span className={`pill ${STATUS_TONES[o.paymentStatus] || 'muted'}`}>
                            <span className="d" />
                            {STATUS_LABELS[o.paymentStatus] || o.paymentStatus}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-dim)' }}>
                          {hasDetail ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div style={{ padding: '10px 14px 14px', background: 'var(--bg)', borderTop: '1px solid var(--border)', fontSize: 12 }}>
                          {/* Unit breakdown (for unpaid/pending) */}
                          {o.periodUnits?.length > 0 && (
                            <DetailSection title="Detalle por unidad">
                              {o.periodUnits.map((u: any) => (
                                <DetailRow key={u.id || u._id} label={u.name} value={money(u.amount)} />
                              ))}
                            </DetailSection>
                          )}

                          {/* Payments */}
                          {(o.payments?.approved?.length > 0 || o.payments?.pending?.length > 0 || o.payments?.rejected?.length > 0) && (
                            <DetailSection title="Pagos del período">
                              {[
                                ...(o.payments.approved || []).map((p: any) => ({ ...p, _s: 'approved' })),
                                ...(o.payments.pending  || []).map((p: any) => ({ ...p, _s: 'pending'  })),
                                ...(o.payments.rejected || []).map((p: any) => ({ ...p, _s: 'rejected' })),
                              ].map((p: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0' }}>
                                  <span style={{ color: 'var(--text-dim)' }}>{dateLabel(p.createdAt)}</span>
                                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <span>{money(p.amount)}</span>
                                    <Status value={p._s} />
                                  </div>
                                </div>
                              ))}
                            </DetailSection>
                          )}

                          {/* Extraordinary */}
                          {o.extraordinaryOwed?.length > 0 && (
                            <DetailSection title="Extraordinarios imputados">
                              {o.extraordinaryOwed.map((e: any) => (
                                <DetailRow key={e.id || e._id} label={e.title} value={money(e.amount)} valueColor="var(--neg)" />
                              ))}
                            </DetailSection>
                          )}

                          {/* Debt items */}
                          {o.debtItems?.length > 0 && (
                            <DetailSection title="Deudas pendientes">
                              {o.debtItems.map((d: any) => (
                                <DetailRow key={d.id || d._id} label={d.description || d.type || 'Ajuste'} value={money(d.amount)} valueColor="var(--neg)" />
                              ))}
                            </DetailSection>
                          )}

                          {/* Balance anterior */}
                          {o.balanceUnits?.length > 0 && (
                            <DetailSection title="Saldo anterior por unidad">
                              {o.balanceUnits.map((b: any) => (
                                <DetailRow key={b.id || b._id} label={b.name} value={money(b.amount)} valueColor="var(--neg)" />
                              ))}
                            </DetailSection>
                          )}

                          {!hasDetail && (
                            <div style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                              {o.paymentStatus === 'not_applicable'
                                ? 'Período fuera del rango de facturación o incluido en plan de pagos.'
                                : 'Sin detalle disponible para este período.'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontWeight: 600, color: 'var(--text-dim)', marginBottom: 4, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em' }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--border)' }}>
      <span>{label}</span>
      <strong style={valueColor ? { color: valueColor } : undefined}>{value}</strong>
    </div>
  );
}
