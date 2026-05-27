import { FormEvent, useState } from 'react';
import { Building2, CalendarCheck, RefreshCw, X } from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { type GridFilter } from '../../components/Table';
import { formObject, idOf, person, statusText } from './adminFormat';
import { Actions, Empty, Field, Panel, Status } from './adminComponents';
import { Table } from '../../components/Table';

function statusFilter(statuses: string[]): GridFilter {
  return {
    key: 'status',
    label: 'Estado',
    allLabel: 'Todos',
    options: statuses.map((value) => ({ value, label: statusText[value] || value })),
    match: (row, value) => row.status === value
  };
}

function dateFilter(getValue: (row: any) => string): GridFilter {
  const today = new Date().toISOString().slice(0, 10);
  return {
    key: 'date',
    label: 'Fecha',
    allLabel: 'Todas',
    options: [{ value: today, label: 'Hoy' }],
    match: (row, value) => getValue(row) === value
  };
}

export function AdminReservationsSection({ ctx }: { ctx: any }) {
  const { reservations, spaces, loading, config, tab, run, refresh } = ctx;
  const [reservasWeekOffset, setReservasWeekOffset] = useState(0);
  const [reservasSpaceFilter, setReservasSpaceFilter] = useState<string[]>([]);

  const rs = (reservations || []) as any[];
  const sp = (spaces || []) as any[];
  const SLOT_H = 52;
  const HOUR_START = 8;
  const HOURS = Array.from({ length: 13 }, (_, i) => HOUR_START + i); // 08–20

  const weekStart = (() => {
    const d = new Date();
    const dow = d.getDay();
    d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1) + reservasWeekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  })();
  const calDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
  const dayKey = (date: Date) => date.toISOString().slice(0, 10);
  const today = dayKey(new Date());
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const filteredRs = reservasSpaceFilter.length > 0
    ? rs.filter((r: any) => reservasSpaceFilter.includes(r.space?.name))
    : rs;

  const weekRs = rs.filter((r: any) => {
    if (!r.date) return false;
    const d = new Date(r.date + 'T00:00:00');
    return d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000);
  });
  const pendingCount = rs.filter((r: any) => r.status === 'pending').length;

  const toneColor = (status: string) => ({
    pending:   { bg: 'rgba(250,173,20,0.13)', border: 'var(--warn)', text: 'var(--warn)' },
    approved:  { bg: 'var(--accent-soft)',    border: 'var(--accent)', text: 'var(--accent)' },
    rejected:  { bg: 'rgba(239,68,68,0.10)', border: 'var(--neg)',  text: 'var(--neg)' },
    cancelled: { bg: 'var(--bg-3)',            border: 'var(--ink-3)', text: 'var(--ink-3)' },
  }[status] || { bg: 'var(--bg-3)', border: 'var(--ink-3)', text: 'var(--ink-3)' });

  const weekLabel = (() => {
    const last = calDays[6];
    const fmt = (d: Date) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    return `${fmt(weekStart)} – ${fmt(last)}`;
  })();

  function submitSpace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('space', () => adminApi.spaces.create({
      ...data,
      capacity: data.capacity ? Number(data.capacity) : undefined,
      requiresApproval: data.requiresApproval === 'on'
    }), 'Espacio creado.');
    event.currentTarget.reset();
  }

  return (
    <>
      <div className="admin-page-head">
        <div>
          <div className="admin-page-kicker"><span className="dot" />Operaciones</div>
          <h1 className="admin-page-title">Reservas de amenities</h1>
          <div className="admin-page-sub">
            {weekLabel} · {weekRs.length} reserva{weekRs.length !== 1 ? 's' : ''} · {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} de aprobación
          </div>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {sp.map((s: any) => (
          <button key={idOf(s)} className={`chip${reservasSpaceFilter.includes(s.name) ? ' active' : ''}`}
            onClick={() => setReservasSpaceFilter(prev => prev.includes(s.name) ? prev.filter(x => x !== s.name) : [...prev, s.name])}>
            {s.name}
          </button>
        ))}
        {reservasSpaceFilter.length > 0 && (
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 4 }} onClick={() => setReservasSpaceFilter([])}>
            <X size={12} />Limpiar filtro
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setReservasWeekOffset(p => p - 1)}>‹</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setReservasWeekOffset(0)}>Hoy</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setReservasWeekOffset(p => p + 1)}>›</button>
        </div>
      </div>

      {loading ? (
        <div className="card skeleton" style={{ height: 360, marginBottom: 20 }} />
      ) : (
        <div className="card" style={{ padding: 0, marginBottom: 24, overflow: 'auto' }}>
          <div style={{ minWidth: 600 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', borderBottom: '1px solid var(--line-1)' }}>
              <div />
              {calDays.map((d, i) => (
                <div key={i} style={{ padding: '10px 8px', borderLeft: '1px solid var(--line-1)', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em', color: 'var(--ink-3)' }}>{dayLabels[i]}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: dayKey(d) === today ? 'var(--accent)' : 'var(--ink-0)', marginTop: 2, fontFamily: 'var(--ff-mono, monospace)' }}>{d.getDate()}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)' }}>
              <div>
                {HOURS.map((h, i) => (
                  <div key={h} style={{ height: SLOT_H, padding: '4px 8px 0 0', borderTop: i > 0 ? '1px solid var(--line-1)' : 'none', textAlign: 'right', fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--ff-mono, monospace)' }}>
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              {calDays.map((d, dayI) => {
                const dayRs = filteredRs.filter((r: any) => r.date === dayKey(d));
                return (
                  <div key={dayI} style={{ borderLeft: '1px solid var(--line-1)', position: 'relative', minHeight: HOURS.length * SLOT_H }}>
                    {HOURS.map((_, hI) => (
                      <div key={hI} style={{ height: SLOT_H, borderTop: hI > 0 ? '1px solid var(--line-1)' : 'none',
                        background: dayKey(d) === today ? 'rgba(var(--accent-rgb,99,102,241),0.03)' : undefined }} />
                    ))}
                    {dayRs.map((r: any, rI: number) => {
                      if (!r.startTime) return null;
                      const startMin = toMin(r.startTime) - HOUR_START * 60;
                      const endMin = r.endTime ? toMin(r.endTime) - HOUR_START * 60 : startMin + 120;
                      const top = Math.max((startMin / 60) * SLOT_H + 2, 0);
                      const height = Math.max(((endMin - startMin) / 60) * SLOT_H - 4, 22);
                      const { bg, border, text } = toneColor(r.status);
                      return (
                        <div key={rI} title={`${r.space?.name || 'Espacio'} · ${person(r)} · ${r.startTime}${r.endTime ? '–' + r.endTime : ''} · ${r.status}`}
                          style={{ position: 'absolute', top, left: 3, right: 3, height, background: bg, borderLeft: `2px solid ${border}`, borderRadius: 4, padding: '4px 6px', overflow: 'hidden' }}>
                          <div style={{ fontSize: 10.5, fontWeight: 600, color: text, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.space?.name || 'Espacio'}
                          </div>
                          {height > 32 && (
                            <div style={{ fontSize: 10, color: 'var(--ink-2)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {person(r)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="admin-grid">
        <Panel title="Nuevo espacio" icon={Building2}>
          <form className="admin-form" onSubmit={submitSpace}>
            <Field label="Nombre" name="name" required />
            <Field label="Capacidad" name="capacity" type="number" />
            <label className="admin-field full"><span>Descripcion</span><textarea name="description" rows={2} /></label>
            <label className="admin-check"><input name="requiresApproval" type="checkbox" /> Requiere aprobacion</label>
            <button className="btn btn-primary">Crear espacio</button>
          </form>
        </Panel>
        <Panel title="Espacios" icon={Building2}>
          <Table loading={loading} searchPlaceholder="Buscar espacio" filters={[{
            key: 'approval', label: 'Aprobacion', allLabel: 'Todos',
            options: [{ value: 'yes', label: 'Requiere' }, { value: 'no', label: 'Automatica' }],
            match: (row, value) => value === 'yes' ? !!row.requiresApproval : !row.requiresApproval
          }]} rows={spaces} columns={[
            ['Nombre', (s: any) => s.name],
            ['Capacidad', (s: any) => s.capacity || '-'],
            ['Aprobacion', (s: any) => s.requiresApproval ? 'Si' : 'No'],
            ['Acciones', (s: any) => <Actions><button onClick={() => run(idOf(s), () => adminApi.spaces.delete(idOf(s)), 'Espacio eliminado.')}>Eliminar</button></Actions>]
          ]} />
        </Panel>
        <Panel title="Reservas pendientes" icon={CalendarCheck}>
          <Table loading={loading} searchPlaceholder="Buscar reserva, espacio o propietario" filters={[
            statusFilter(['pending', 'approved', 'rejected', 'cancelled']),
            dateFilter((r) => r.date)
          ]} rows={reservations} columns={[
            ['Espacio', (r: any) => r.space?.name],
            ['Propietario', (r: any) => person(r)],
            ['Fecha', (r: any) => `${r.date || '-'} ${r.startTime || ''}`],
            ['Estado', (r: any) => <Status value={r.status} />],
            ['Acciones', (r: any) => <Actions>
              <button onClick={() => run(idOf(r), () => adminApi.reservations.status(idOf(r), 'approved'), 'Reserva aprobada.')}>Aprobar</button>
              <button onClick={() => run(idOf(r), () => adminApi.reservations.status(idOf(r), 'rejected'), 'Reserva rechazada.')}>Rechazar</button>
            </Actions>]
          ]} />
        </Panel>
      </div>
    </>
  );
}
