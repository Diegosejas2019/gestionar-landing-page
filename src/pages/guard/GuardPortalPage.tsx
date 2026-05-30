import { useEffect, useState, useCallback } from 'react';
import { LogIn, LogOut, QrCode, RefreshCw, Search, ShieldCheck, Clock, Users, LayoutGrid } from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { clearAuthToken, getAuthToken, goAdmin, goLogin } from '../../services/navigationService';
import { GuardUnitMapTab } from './GuardUnitMapTab';

type Visit = {
  _id: string;
  name?: string;
  visitorName?: string;
  owner?: any;
  ownerName?: string;
  unitLabel?: string;
  type?: string;
  status: string;
  expectedDate?: string;
  note?: string;
  guardNote?: string;
};

type Log = {
  _id: string;
  action: 'check_in' | 'check_out';
  performedByName?: string;
  visitorName?: string;
  timestamp?: string;
  comment?: string;
};

const typeLabel: Record<string, string> = {
  visit: 'Visita',
  provider: 'Proveedor',
  delivery: 'Entrega',
};

const statusLabel: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Pendiente', color: 'var(--warn)' },
  approved: { label: 'Esperado',  color: 'var(--info)' },
  inside:   { label: 'Adentro',   color: 'var(--pos)' },
  exited:   { label: 'Egresó',    color: 'var(--ink-3)' },
  rejected: { label: 'Bloqueado', color: 'var(--neg)' },
};

function pill(status: string) {
  const s = statusLabel[status] || { label: status, color: 'var(--ink-2)' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
      background: `${s.color}18`, color: s.color, whiteSpace: 'nowrap'
    }}>{s.label}</span>
  );
}

function fmtTime(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function visitorName(v: Visit) {
  return v.visitorName || v.name || '—';
}

function ownerInfo(v: Visit) {
  const name = v.ownerName || (typeof v.owner === 'object' ? v.owner?.name : null) || '';
  const unit = v.unitLabel || '';
  return [name, unit].filter(Boolean).join(' · ') || '—';
}

function visitId(v: Visit) {
  return v._id;
}

export function GuardPortalPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [visitsEnabled, setVisitsEnabled] = useState(true);
  const [activeView, setActiveView] = useState<'list' | 'map'>('list');
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [pendingAction, setPendingAction] = useState<{ id: string; action: 'in' | 'out' } | null>(null);
  const [qrToken, setQrToken] = useState('');
  const [qrVisit, setQrVisit] = useState<Visit | null>(null);
  const [qrError, setQrError] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [logs, setLogs] = useState<Log[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) {
      goLogin();
      return;
    }
    Promise.all([adminApi.me(), adminApi.permissions.me()])
      .then(([me, perms]) => {
        const user = me?.data?.user;
        const adminRole = perms?.data?.role;
        if (!user || user.role !== 'admin') {
          goLogin();
          return;
        }
        if (adminRole !== 'security_guard') {
          goAdmin();
          return;
        }
        setAuthChecked(true);
      })
      .catch(() => {
        clearAuthToken();
        goLogin();
      });
  }, []);

  const loadVisits = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.visits.today();
      setVisits(res?.data?.visits || res?.data || []);
    } catch (err: any) {
      if (err?.status === 403 || err?.message?.includes('403')) {
        setVisitsEnabled(false);
      }
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const res = await adminApi.visits.history({ limit: 30 });
      const rawLogs: Log[] = [];
      const items = res?.data?.visits || res?.data || [];
      items.forEach((v: any) => {
        if (v.logs) rawLogs.push(...v.logs);
      });
      setLogs(rawLogs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()).slice(0, 20));
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    loadVisits();
  }, [authChecked, loadVisits]);

  function showNotice(type: 'ok' | 'error', text: string) {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 3500);
  }

  function startAction(id: string, action: 'in' | 'out') {
    setNote('');
    setPendingAction({ id, action });
  }

  async function confirmAction() {
    if (!pendingAction) return;
    const { id, action } = pendingAction;
    setBusy(id);
    setPendingAction(null);
    try {
      if (action === 'in') {
        await adminApi.visits.checkIn(id, note || undefined);
        showNotice('ok', 'Ingreso registrado correctamente.');
      } else {
        await adminApi.visits.checkOut(id, note || undefined);
        showNotice('ok', 'Egreso registrado correctamente.');
      }
      await loadVisits();
    } catch (err: any) {
      showNotice('error', err?.message || 'No se pudo completar la acción.');
    } finally {
      setBusy('');
      setNote('');
    }
  }

  async function validateQr() {
    if (!qrToken.trim()) return;
    setQrLoading(true);
    setQrError('');
    setQrVisit(null);
    try {
      const res = await adminApi.visits.validateQr(qrToken.trim());
      const v = res?.data?.visit || res?.data;
      if (v) {
        setQrVisit(v);
      } else {
        setQrError('QR no válido o visita no encontrada.');
      }
    } catch (err: any) {
      setQrError(err?.message || 'QR no válido para esta organización.');
    } finally {
      setQrLoading(false);
    }
  }

  async function checkInByQr() {
    if (!qrVisit) return;
    setBusy('qr');
    try {
      await adminApi.visits.checkInByQr(qrToken.trim(), note || undefined);
      showNotice('ok', 'Ingreso por QR registrado.');
      setQrVisit(null);
      setQrToken('');
      setNote('');
      await loadVisits();
    } catch (err: any) {
      showNotice('error', err?.message || 'No se pudo registrar el ingreso.');
    } finally {
      setBusy('');
    }
  }

  const filtered = visits.filter(v => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      visitorName(v).toLowerCase().includes(q) ||
      ownerInfo(v).toLowerCase().includes(q)
    );
  });

  const inside = visits.filter(v => v.status === 'inside');
  const exited = visits.filter(v => v.status === 'exited');

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0e1512', color: '#9cf27b', fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
        Verificando acceso…
      </div>
    );
  }

  if (!visitsEnabled) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0e1512', color: 'var(--ink-2)', fontFamily: 'Inter, sans-serif', textAlign: 'center', padding: 24 }}>
        <div>
          <ShieldCheck size={40} style={{ color: 'var(--ink-3)', marginBottom: 12 }} />
          <p style={{ fontSize: 16, marginBottom: 8 }}>Módulo de visitas no habilitado</p>
          <p style={{ fontSize: 13, color: 'var(--ink-3)' }}>Contacte al administrador para activarlo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="guard-portal">
      {notice && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 9999,
          background: notice.type === 'ok' ? 'var(--pos)' : 'var(--neg)',
          color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 13,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)', maxWidth: 320
        }}>
          {notice.text}
        </div>
      )}

      {pendingAction && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{ background: 'var(--bg-1)', borderRadius: 12, padding: 24, width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--ink-0)' }}>
              {pendingAction.action === 'in' ? 'Registrar ingreso' : 'Registrar egreso'}
            </h3>
            <textarea
              placeholder="Nota de portería (opcional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{
                width: '100%', minHeight: 80, padding: 10, borderRadius: 8,
                background: 'var(--bg-2)', border: '1px solid var(--line-1)',
                color: 'var(--ink-0)', fontSize: 13, resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                className="btn"
                style={{ flex: 1, minHeight: 44, fontWeight: 600, background: pendingAction.action === 'in' ? 'var(--pos)' : 'var(--accent)', color: '#fff', border: 'none' }}
                onClick={confirmAction}
              >
                {pendingAction.action === 'in' ? 'Confirmar ingreso' : 'Confirmar egreso'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ minHeight: 44 }}
                onClick={() => setPendingAction(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="guard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={22} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink-0)' }}>Portería</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 12, padding: '2px 10px', borderRadius: 10,
            background: 'var(--pos)18', color: 'var(--pos)', fontWeight: 600
          }}>
            {inside.length} adentro
          </span>
          <button className="btn btn-ghost" style={{ minHeight: 36 }} onClick={loadVisits} disabled={loading}>
            <RefreshCw size={14} /> Actualizar
          </button>
          <button className="btn btn-ghost" style={{ minHeight: 36 }} onClick={() => { clearAuthToken(); goLogin(); }}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </header>

      {visitsEnabled && (
        <div style={{
          display: 'flex', gap: 2, padding: '8px 16px 0',
          borderBottom: '1px solid var(--line-1)', background: 'var(--bg-0)'
        }}>
          <button
            onClick={() => setActiveView('list')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', minHeight: 44, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none',
              borderBottom: activeView === 'list' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeView === 'list' ? 'var(--accent)' : 'var(--ink-3)',
              marginBottom: -1, transition: 'color 0.15s'
            }}
          >
            <Users size={14} /> Lista
          </button>
          <button
            onClick={() => setActiveView('map')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', minHeight: 44, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none',
              borderBottom: activeView === 'map' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeView === 'map' ? 'var(--accent)' : 'var(--ink-3)',
              marginBottom: -1, transition: 'color 0.15s'
            }}
          >
            <LayoutGrid size={14} /> Mapa
          </button>
        </div>
      )}

      {activeView === 'map' && visitsEnabled ? (
        <GuardUnitMapTab
          onCheckIn={async (id, note) => {
            await adminApi.visits.checkIn(id, note);
            showNotice('ok', 'Ingreso registrado correctamente.');
          }}
          onCheckOut={async (id, note) => {
            await adminApi.visits.checkOut(id, note);
            showNotice('ok', 'Egreso registrado correctamente.');
          }}
          canCheckIn={true}
          canCheckOut={true}
        />
      ) : (

      <div className="guard-body">

        <div className="guard-search-bar">
          <Search size={16} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar por nombre o propietario…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--ink-0)', fontSize: 14, fontFamily: 'inherit'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >×</button>
          )}
        </div>

        <div className="guard-grid">

          <section className="guard-card">
            <div className="guard-card-head">
              <Users size={16} style={{ color: 'var(--pos)' }} />
              <span>Visitas de hoy</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-3)', fontFamily: 'monospace' }}>{filtered.length}</span>
            </div>
            {loading ? (
              <div style={{ padding: '12px 16px' }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8, marginBottom: 8 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '20px 16px', color: 'var(--ink-3)', fontSize: 13 }}>
                {search ? 'Sin resultados para esa búsqueda.' : 'Sin visitas registradas para hoy.'}
              </div>
            ) : (
              <div style={{ padding: '8px 0' }}>
                {filtered.map(v => (
                  <div key={visitId(v)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                    borderBottom: '1px solid var(--line-1)', opacity: busy === visitId(v) ? 0.5 : 1
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-0)' }}>{visitorName(v)}</span>
                        {v.type && (
                          <span style={{ fontSize: 11, color: 'var(--ink-3)', padding: '1px 6px', borderRadius: 6, background: 'var(--bg-2)', border: '1px solid var(--line-1)' }}>
                            {typeLabel[v.type] || v.type}
                          </span>
                        )}
                        {pill(v.status)}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {ownerInfo(v)}
                        {v.expectedDate && <span style={{ marginLeft: 6, color: 'var(--ink-3)' }}>· {fmtTime(v.expectedDate)}</span>}
                      </div>
                      {v.guardNote && (
                        <div style={{ fontSize: 11, color: 'var(--ink-2)', marginTop: 4, padding: '2px 6px', background: 'rgba(156,242,123,0.07)', borderRadius: 4 }}>
                          📋 {v.guardNote}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      {v.status === 'approved' && (
                        <button
                          className="guard-action-btn guard-action-in"
                          onClick={() => startAction(visitId(v), 'in')}
                          disabled={!!busy}
                          title="Registrar ingreso"
                        >
                          <LogIn size={16} /> Ingreso
                        </button>
                      )}
                      {v.status === 'inside' && (
                        <button
                          className="guard-action-btn guard-action-out"
                          onClick={() => startAction(visitId(v), 'out')}
                          disabled={!!busy}
                          title="Registrar egreso"
                        >
                          <LogOut size={16} /> Egreso
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <section className="guard-card">
              <div className="guard-card-head">
                <ShieldCheck size={16} style={{ color: 'var(--pos)' }} />
                <span>Dentro del predio</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--pos)', fontFamily: 'monospace', fontWeight: 700 }}>{inside.length}</span>
              </div>
              {inside.length === 0 ? (
                <div style={{ padding: '14px 16px', color: 'var(--ink-3)', fontSize: 13 }}>Sin visitas activas en este momento.</div>
              ) : (
                <div style={{ padding: '4px 0' }}>
                  {inside.map(v => (
                    <div key={visitId(v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--line-1)' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pos)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-0)' }}>{visitorName(v)}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{ownerInfo(v)}</div>
                      </div>
                      <button
                        className="guard-action-btn guard-action-out"
                        style={{ fontSize: 11, padding: '4px 10px' }}
                        onClick={() => startAction(visitId(v), 'out')}
                        disabled={!!busy}
                      >
                        <LogOut size={13} /> Egreso
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="guard-card">
              <div className="guard-card-head">
                <QrCode size={16} style={{ color: 'var(--accent)' }} />
                <span>Validar QR / Código</span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Token o código QR"
                    value={qrToken}
                    onChange={e => { setQrToken(e.target.value); setQrVisit(null); setQrError(''); }}
                    onKeyDown={e => e.key === 'Enter' && validateQr()}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 8,
                      background: 'var(--bg-2)', border: '1px solid var(--line-1)',
                      color: 'var(--ink-0)', fontSize: 13, fontFamily: 'inherit', outline: 'none'
                    }}
                  />
                  <button
                    className="btn btn-ghost"
                    style={{ minHeight: 42, padding: '0 14px' }}
                    onClick={validateQr}
                    disabled={qrLoading || !qrToken.trim()}
                  >
                    {qrLoading ? '…' : 'Buscar'}
                  </button>
                </div>
                {qrError && <div style={{ fontSize: 12, color: 'var(--neg)' }}>{qrError}</div>}
                {qrVisit && (
                  <div style={{ background: 'var(--bg-2)', borderRadius: 8, padding: 12, border: '1px solid var(--line-1)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-0)', marginBottom: 4 }}>{visitorName(qrVisit)}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>{ownerInfo(qrVisit)} · {pill(qrVisit.status)}</div>
                    {qrVisit.status === 'approved' && (
                      <button
                        className="guard-action-btn guard-action-in"
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={checkInByQr}
                        disabled={busy === 'qr'}
                      >
                        <LogIn size={15} /> Registrar ingreso
                      </button>
                    )}
                    {qrVisit.status !== 'approved' && (
                      <div style={{ fontSize: 12, color: 'var(--warn)' }}>
                        La visita no está en estado "Esperado". No se puede registrar ingreso.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="guard-card">
              <div className="guard-card-head">
                <Clock size={16} style={{ color: 'var(--ink-2)' }} />
                <span>Historial del día</span>
                <button
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', padding: 0 }}
                  onClick={() => { loadLogs(); }}
                  disabled={logsLoading}
                  title="Cargar historial"
                >
                  <RefreshCw size={13} />
                </button>
              </div>
              {exited.length === 0 && logs.length === 0 ? (
                <div style={{ padding: '14px 16px', color: 'var(--ink-3)', fontSize: 13 }}>Sin movimientos registrados hoy.</div>
              ) : (
                <div style={{ padding: '4px 0' }}>
                  {exited.map(v => (
                    <div key={visitId(v)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--line-1)' }}>
                      <LogOut size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-1)' }}>{visitorName(v)}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{ownerInfo(v)}</div>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'monospace' }}>Egresó</span>
                    </div>
                  ))}
                  {logsLoading && <div style={{ padding: '10px 16px', color: 'var(--ink-3)', fontSize: 12 }}>Cargando…</div>}
                  {logs.map((log, i) => (
                    <div key={log._id || i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--line-1)' }}>
                      {log.action === 'check_in'
                        ? <LogIn size={13} style={{ color: 'var(--pos)', flexShrink: 0 }} />
                        : <LogOut size={13} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: 'var(--ink-1)' }}>{log.visitorName || '—'}</div>
                        {log.comment && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>📋 {log.comment}</div>}
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'monospace' }}>
                        {fmtTime(log.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
