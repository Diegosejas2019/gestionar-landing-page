import { AlertTriangle, Bell, CheckCircle2, FileText, RefreshCw, Vote, X } from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { Empty, Field, Metric } from './adminComponents';
import { dateLabel, idOf } from './adminFormat';

export function AdminVotesSection({ ctx }: { ctx: any }) {
  const {
    votes, config, refresh, tab, setShowVoteModal, loading, showVoteModal,
    setVoteOptions, voteOptions, submitVote, busy, run
  } = ctx;

  const vs = votes || [];
  const open = vs.filter((v: any) => v.status === 'open');
  const closed = vs.filter((v: any) => v.status === 'closed');
  const voteStatusPill = (v: any) => {
    if (v.status === 'open') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 8px', borderRadius: 8, background: 'var(--pos-soft)', color: 'var(--pos)', fontSize: 10.5, fontWeight: 600 }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pos)' }} />ABIERTA
      </span>
    );
    if (v.status === 'closed') return (
      <span style={{ padding: '1px 8px', borderRadius: 8, background: 'var(--bg-3)', color: 'var(--ink-2)', fontSize: 10.5, fontWeight: 600 }}>CERRADA</span>
    );
    return null;
  };

  return (
            <>
              <div className="admin-page-head">
                <div>
                  <div className="admin-page-kicker"><span className="dot" />Operaciones</div>
                  <h1 className="admin-page-title">Votaciones</h1>
                  <div className="admin-page-sub">{open.length} abierta{open.length !== 1 ? 's' : ''}, {closed.length} cerrada{closed.length !== 1 ? 's' : ''} · {config?.consortiumName || 'Tu organización'}</div>
                </div>
                <div className="admin-page-actions">
                  <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                  <button className="btn btn-primary" onClick={() => setShowVoteModal(true)}><Vote size={14} />Nueva votación</button>
                </div>
              </div>

              <div className="metric-grid" style={{ marginBottom: 20 }}>
                <Metric row loading={loading} label="Abiertas" value={open.length} hint="En curso" icon={Vote} />
                <Metric row loading={loading} label="Con cierre programado" value={open.filter((v: any) => v.endsAt).length} hint="Con fecha límite" icon={AlertTriangle} />
                <Metric row loading={loading} label="Cerradas" value={closed.length} hint="Finalizadas" icon={CheckCircle2} />
                <Metric row loading={loading} label="Total" value={vs.length} hint="Historial completo" icon={FileText} />
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 10 }} />)}
                </div>
              ) : vs.length === 0 ? (
                <Empty text="No hay votaciones registradas." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {vs.map((v: any) => {
                    const opts: any[] = v.options || [];
                    const total = opts.reduce((acc: number, o: any) => acc + (o.votes || 0), 0);
                    const hasVotes = total > 0;
                    return (
                      <div key={idOf(v)} className="card" style={{ padding: 18 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 10, background: v.status === 'open' ? 'var(--accent-soft)' : 'var(--bg-3)', color: v.status === 'open' ? 'var(--accent)' : 'var(--ink-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <Vote size={20} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                              {voteStatusPill(v)}
                            </div>
                            <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 10, color: 'var(--ink-0)' }}>{v.title}</div>
                            {opts.length > 0 && (
                              <div style={{ marginBottom: 8 }}>
                                {hasVotes && (
                                  <div style={{ display: 'flex', height: 20, borderRadius: 5, overflow: 'hidden', gap: 2, marginBottom: 8 }}>
                                    {opts.map((o: any, i: number) => {
                                      const pct = total > 0 ? Math.round((o.votes || 0) / total * 100) : 0;
                                      const colors = ['var(--accent)', 'var(--neg)', 'var(--warn)', 'var(--info)', 'var(--ink-2)'];
                                      return pct > 0 ? (
                                        <div key={i} style={{ flex: pct, background: colors[i % colors.length], position: 'relative', minWidth: 30 }}>
                                          <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden' }}>{pct}%</span>
                                        </div>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {opts.map((o: any, i: number) => {
                                    const pct = total > 0 ? Math.round((o.votes || 0) / total * 100) : 0;
                                    const colors = ['var(--accent)', 'var(--neg)', 'var(--warn)', 'var(--info)', 'var(--ink-2)'];
                                    return (
                                      <span key={i} style={{ fontSize: 11.5, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
                                        {o.text}{hasVotes ? `: ${o.votes || 0} (${pct}%)` : ''}
                                      </span>
                                    );
                                  })}
                                </div>
                                {hasVotes && <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4 }}>{total} voto{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</div>}
                              </div>
                            )}
                            {v.endsAt && (
                              <div style={{ fontSize: 11.5, color: v.status === 'open' ? 'var(--warn)' : 'var(--ink-3)' }}>
                                {v.status === 'open' ? 'Cierra: ' : 'Cerró: '}{dateLabel(v.endsAt)}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                            {v.status === 'open' && (
                              <button className="btn btn-secondary btn-sm" onClick={() => run(idOf(v), () => adminApi.votes.close(idOf(v)), 'Votación cerrada.')}>
                                Cerrar
                              </button>
                            )}
                            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--neg)' }} onClick={() => run(idOf(v), () => adminApi.votes.delete(idOf(v)), 'Votación eliminada.')}>
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {showVoteModal && (
                <div className="modal-backdrop" role="dialog" aria-modal="true"
                  onClick={(e) => { if (e.target === e.currentTarget) { setShowVoteModal(false); setVoteOptions(['', '']); } }}>
                  <div className="form-modal form-modal--wide">
                    <div className="form-modal-head">
                      <div className="form-modal-title"><Vote size={16} />Nueva votación</div>
                      <button className="icon-btn" onClick={() => { setShowVoteModal(false); setVoteOptions(['', '']); }}><X size={16} /></button>
                    </div>
                    <form className="admin-form" onSubmit={submitVote}>
                      <Field label="Título" name="title" required placeholder="Ej: ¿Pintamos el palier?" />
                      <Field label="Fecha límite (opcional)" name="endsAt" type="datetime-local" />
                      <label className="admin-field full"><span>Descripción <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</small></span>
                        <textarea name="description" rows={3} placeholder="Contexto adicional para los propietarios…" maxLength={1000} />
                      </label>
                      <div className="admin-field full">
                        <span>Opciones <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(mínimo 2)</small></span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {voteOptions.map((opt: string, i: number) => (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <input className="input" value={opt} required={i < 2}
                                placeholder={`Opción ${i + 1}`}
                                onChange={(e) => setVoteOptions((prev: string[]) => prev.map((o: string, j: number) => j === i ? e.target.value : o))}
                                style={{ flex: 1 }}
                              />
                              {voteOptions.length > 2 && (
                                <button type="button" className="icon-btn"
                                  onClick={() => setVoteOptions((prev: string[]) => prev.filter((_: string, j: number) => j !== i))}>
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                          {voteOptions.length < 6 && (
                            <button type="button" className="btn btn-ghost btn-sm"
                              onClick={() => setVoteOptions((prev: string[]) => [...prev, ''])}>
                              + Agregar opción
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="admin-field full">
                        <label className="notice-check-pill" style={{ maxWidth: 320 }}>
                          <input type="checkbox" id="v-push" defaultChecked />
                          <Bell size={13} />
                          <span>Notificar a propietarios por push</span>
                        </label>
                      </div>
                      <div className="form-modal-foot">
                        <button type="button" className="btn btn-ghost"
                          onClick={() => { setShowVoteModal(false); setVoteOptions(['', '']); }}>Cancelar</button>
                        <button className="btn btn-primary" disabled={busy === 'vote'}><Vote size={14} />Publicar votación</button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          );
}
