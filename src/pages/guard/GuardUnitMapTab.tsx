import { useEffect, useState, useMemo } from 'react';
import { LogIn, LogOut, Search, Truck, Wrench, X } from 'lucide-react';
import { adminApi } from '../../services/adminService';

// ── Tipos ─────────────────────────────────────────────────────
type UnitMapVisit = {
  id: string;
  visitorName: string;
  type: 'visit' | 'provider' | 'delivery';
  status: 'pending' | 'approved' | 'rejected' | 'inside' | 'exited';
  expectedDate?: string;
};

type UnitMapItem = {
  unitId: string;
  unitLabel: string;
  hasOwner: boolean;
  status: 'inside' | 'approved' | 'pending' | 'rejected' | 'exited' | 'none';
  visitCounts: {
    expected: number;
    inside: number;
    pending: number;
    rejected: number;
    exited: number;
  };
  visits: UnitMapVisit[];
};

type FilterState = 'all' | 'inside' | 'approved' | 'pending' | 'rejected' | 'none';

// ── Paleta de colores por estado ──────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  inside:   { bg: '#22c55e', text: '#fff',        label: 'Adentro' },
  approved: { bg: '#3b82f6', text: '#fff',        label: 'Esperada' },
  pending:  { bg: '#eab308', text: '#1a1a1a',     label: 'Pendiente' },
  rejected: { bg: '#ef4444', text: '#fff',        label: 'Incidencia' },
  exited:   { bg: '#d1d5db', text: '#374151',     label: 'Solo salidas' },
  none:     { bg: '#e5e7eb', text: '#6b7280',     label: 'Sin visitas' },
};

// ── Helpers ───────────────────────────────────────────────────
function fmtTime(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

const VISIT_STATUS_LABEL: Record<string, string> = {
  pending:  'Pendiente',
  approved: 'Esperada',
  inside:   'Adentro',
  exited:   'Egresó',
  rejected: 'Bloqueada',
};

const TYPE_LABEL: Record<string, string> = {
  visit:    'Visita',
  provider: 'Proveedor',
  delivery: 'Delivery',
};

// ── Componente principal ──────────────────────────────────────
type Props = {
  onCheckIn:  (id: string, note?: string) => Promise<void>;
  onCheckOut: (id: string, note?: string) => Promise<void>;
  canCheckIn:  boolean;
  canCheckOut: boolean;
};

export function GuardUnitMapTab({ onCheckIn, onCheckOut, canCheckIn, canCheckOut }: Props) {
  const [units, setUnits]         = useState<UnitMapItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<FilterState>('all');
  const [selected, setSelected]   = useState<UnitMapItem | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [busy, setBusy]           = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.visits.unitMap();
      setUnits(res?.data?.units || []);
    } catch {
      setError('No se pudo cargar el mapa de unidades.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = units;
    if (filter !== 'all') {
      result = result.filter(u => u.status === filter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(u => u.unitLabel.toLowerCase().includes(q));
    }
    return result;
  }, [units, filter, search]);

  async function handleCheckIn(visitId: string) {
    setBusy(visitId);
    try {
      await onCheckIn(visitId, actionNote || undefined);
      setActionNote('');
      setSelected(null);
      await load();
    } finally {
      setBusy('');
    }
  }

  async function handleCheckOut(visitId: string) {
    setBusy(visitId);
    try {
      await onCheckOut(visitId, actionNote || undefined);
      setActionNote('');
      setSelected(null);
      await load();
    } finally {
      setBusy('');
    }
  }

  // ── Render ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, textAlign: 'center', color: 'var(--neg)' }}>
      <p style={{ marginBottom: 12, fontSize: 13 }}>{error}</p>
      <button className="btn btn-ghost" style={{ minHeight: 44 }} onClick={load}>Reintentar</button>
    </div>
  );

  return (
    <div>
      {/* Modal de detalle */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: 'var(--bg-1)', borderRadius: 12, padding: 20, width: '100%',
            maxWidth: 400, maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                background: STATUS_STYLE[selected.status]?.bg || '#e5e7eb'
              }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-0)', flex: 1 }}>
                {selected.unitLabel}
              </span>
              <button
                onClick={() => { setSelected(null); setActionNote(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {selected.visits.length === 0 ? (
              <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>Sin visitas registradas para esta unidad hoy.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selected.visits.map(v => (
                  <div key={v.id} style={{
                    background: 'var(--bg-2)', borderRadius: 8, padding: 12,
                    border: '1px solid var(--line-1)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-0)' }}>{v.visitorName}</span>
                      <span style={{
                        fontSize: 11, padding: '1px 6px', borderRadius: 6,
                        background: 'var(--bg-1)', border: '1px solid var(--line-1)', color: 'var(--ink-3)'
                      }}>{TYPE_LABEL[v.type] || v.type}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                        background: `${STATUS_STYLE[v.status]?.bg || '#e5e7eb'}22`,
                        color: v.status === 'exited' ? 'var(--ink-3)' : STATUS_STYLE[v.status]?.bg || 'var(--ink-2)'
                      }}>{VISIT_STATUS_LABEL[v.status] || v.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8 }}>
                      {v.expectedDate && `Esperada: ${fmtTime(v.expectedDate)}`}
                    </div>

                    {(canCheckIn && v.status === 'approved') && (
                      <button
                        className="guard-action-btn guard-action-in"
                        style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
                        disabled={!!busy}
                        onClick={() => handleCheckIn(v.id)}
                      >
                        <LogIn size={15} /> Registrar ingreso
                      </button>
                    )}
                    {(canCheckOut && v.status === 'inside') && (
                      <button
                        className="guard-action-btn guard-action-out"
                        style={{ width: '100%', justifyContent: 'center', minHeight: 44 }}
                        disabled={!!busy}
                        onClick={() => handleCheckOut(v.id)}
                      >
                        <LogOut size={15} /> Registrar egreso
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {selected.visits.some(v => v.status === 'approved' || v.status === 'inside') && (canCheckIn || canCheckOut) && (
              <textarea
                placeholder="Nota de portería (opcional)"
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                style={{
                  width: '100%', minHeight: 60, padding: 10, borderRadius: 8, marginTop: 12,
                  background: 'var(--bg-2)', border: '1px solid var(--line-1)',
                  color: 'var(--ink-0)', fontSize: 13, resize: 'vertical',
                  fontFamily: 'inherit', boxSizing: 'border-box'
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* Controles */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Buscador */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 8
        }}>
          <Search size={14} style={{ color: 'var(--ink-3)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Buscar unidad o lote…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--ink-0)', fontSize: 13, fontFamily: 'inherit'
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', padding: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {([
            ['all', 'Todos'],
            ['inside', 'Adentro'],
            ['approved', 'Esperadas'],
            ['pending', 'Pendientes'],
            ['rejected', 'Incidencias'],
            ['none', 'Sin visitas'],
          ] as [FilterState, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                border: filter === val ? 'none' : '1px solid var(--line-1)',
                background: filter === val
                  ? (val === 'all' ? 'var(--accent)' : STATUS_STYLE[val]?.bg || 'var(--accent)')
                  : 'var(--bg-2)',
                color: filter === val
                  ? (val === 'pending' ? '#1a1a1a' : (val === 'all' ? '#fff' : (STATUS_STYLE[val]?.text || '#fff')))
                  : 'var(--ink-2)',
                minHeight: 30,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Leyenda compacta */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: '4px 0' }}>
          {Object.entries(STATUS_STYLE).map(([key, s]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.bg, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grilla de unidades */}
      {filtered.length === 0 ? (
        <div style={{ padding: '20px 16px', color: 'var(--ink-3)', fontSize: 13, textAlign: 'center' }}>
          {search || filter !== 'all' ? 'Sin unidades que coincidan con la búsqueda.' : 'No hay unidades registradas.'}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
          gap: 8,
          padding: '0 16px 16px'
        }}>
          {filtered.map(unit => {
            const style = STATUS_STYLE[unit.status] || STATUS_STYLE.none;
            const totalVisits = Object.values(unit.visitCounts).reduce((a, b) => a + b, 0);
            const hasDelivery  = unit.visits.some(v => v.type === 'delivery');
            const hasProvider  = unit.visits.some(v => v.type === 'provider');

            return (
              <button
                key={unit.unitId}
                onClick={() => { setSelected(unit); setActionNote(''); }}
                style={{
                  background: style.bg, color: style.text,
                  border: 'none', borderRadius: 8, padding: '10px 8px',
                  cursor: 'pointer', position: 'relative', textAlign: 'center',
                  minHeight: 64, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  transition: 'opacity 0.15s',
                }}
                title={unit.unitLabel}
              >
                {/* Nombre de unidad */}
                <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>
                  {unit.unitLabel}
                </span>

                {/* Badge "Adentro" */}
                {unit.status === 'inside' && (
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3 }}>ADENTRO</span>
                )}

                {/* Íconos de tipo */}
                {(hasDelivery || hasProvider) && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {hasDelivery  && <Truck   size={10} />}
                    {hasProvider  && <Wrench  size={10} />}
                  </div>
                )}

                {/* Contador múltiples visitas */}
                {totalVisits > 1 && (
                  <div style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(0,0,0,0.35)', color: '#fff',
                    fontSize: 9, fontWeight: 700, borderRadius: '50%',
                    width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {totalVisits}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
