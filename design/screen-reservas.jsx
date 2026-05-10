/* screen-reservas.jsx — Rediseño "Visitas / Reservas" estilo calendario moderno */

/* ---------- Datos compartidos ---------- */
const TYPE_META = {
  delivery:  { label: 'Delivery',  color: '#f5a85f', glyph: 'package' },
  proveedor: { label: 'Proveedor', color: '#7cc6f0', glyph: 'truck' },
  visita:    { label: 'Visita',    color: '#9cf27b', glyph: 'user' },
  servicio:  { label: 'Servicio',  color: '#b89cf2', glyph: 'wrench' },
};

const VISITS = [
  { id: 'v1', day: 0, time: '08:30', dur: 30, type: 'delivery',  who: 'Jose Sosa',     note: 'Pizza',                    status: 'aprobada' },
  { id: 'v2', day: 0, time: '10:15', dur: 45, type: 'servicio',  who: 'Gas natural BA', note: 'Lectura medidor',          status: 'pendiente' },
  { id: 'v3', day: 0, time: '14:00', dur: 60, type: 'proveedor', who: 'Maderera Norte', note: 'Materiales de construcción', status: 'aprobada' },
  { id: 'v4', day: 0, time: '17:30', dur: 90, type: 'visita',    who: 'Juan Carlos',   note: 'Visita de hermano',        status: 'aprobada' },
  { id: 'v5', day: 1, time: '09:00', dur: 30, type: 'delivery',  who: 'Mercado Libre', note: 'Paquete · 2 cajas',        status: 'aprobada' },
  { id: 'v6', day: 1, time: '15:30', dur: 60, type: 'visita',    who: 'Marina Aguirre',note: 'Cumpleaños Feli',          status: 'aprobada' },
  { id: 'v7', day: 2, time: '11:00', dur: 60, type: 'servicio',  who: 'Plomero',       note: 'Reparación pileta',        status: 'pendiente' },
];

const TIME_TO_MIN = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const FMT_TIME = (t) => {
  const [h, m] = t.split(':');
  return `${parseInt(h, 10)}:${m}`;
};

/* ---------- Glyph chiquito por tipo de visita ---------- */
const TypeGlyph = ({ type, size = 14, color }) => {
  const c = color || TYPE_META[type].color;
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (TYPE_META[type].glyph) {
    case 'package':
      return <svg {...common}><path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/></svg>;
    case 'truck':
      return <svg {...common}><rect x="1" y="6" width="14" height="11" rx="1"/><path d="M15 9h4l3 3v5h-7"/><circle cx="6" cy="18.5" r="1.7"/><circle cx="18" cy="18.5" r="1.7"/></svg>;
    case 'user':
      return <svg {...common}><circle cx="12" cy="8" r="3.5"/><path d="M5 21c0-3.5 3.1-6 7-6s7 2.5 7 6"/></svg>;
    case 'wrench':
      return <svg {...common}><path d="M14.7 6.3a4 4 0 0 0 5 5L17 14l-7 7-3-3 7-7-2.7-2.7z"/></svg>;
    default: return null;
  }
};

/* ============================================================
   VARIANTE A · Agenda con tira semanal + grupos por día
   ============================================================ */
const ScreenReservasAgenda = () => {
  const [activeDay, setActiveDay] = React.useState(0);
  const [filter, setFilter] = React.useState('all');

  const days = ['SÁB','DOM','LUN','MAR','MIÉ','JUE','VIE'];
  const nums = [9, 10, 11, 12, 13, 14, 15];

  const grouped = [0, 1, 2].map(d => ({
    day: d,
    label: d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : 'Lunes',
    sub: d === 0 ? 'sábado 9 may' : d === 1 ? 'domingo 10 may' : 'lunes 11 may',
    items: VISITS.filter(v => v.day === d && (filter === 'all' || v.type === filter)),
  })).filter(g => g.items.length);

  return (
    <div className="app-shell rv-shell">
      <TopBar user="Gabriel Pérez" notifs={1} />

      <div className="app-scroll" style={{ paddingTop: 4 }}>
        {/* Header: mes/año pill + "Mis Visitas" */}
        <div className="rv-pageHead">
          <div>
            <button className="rv-monthPill">
              Mayo 2026
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
            </button>
            <h1 className="page-title" style={{ marginTop: 10 }}>Mis Visitas</h1>
          </div>
          <button className="rv-fab-inline" aria-label="Nueva visita">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Nueva
          </button>
        </div>

        {/* Tira de semana */}
        <div className="rv-weekStrip">
          {days.map((d, i) => {
            const isActive = i === activeDay;
            const isToday = i === 0;
            const dayVisits = VISITS.filter(v => v.day === i);
            return (
              <button
                key={i}
                className={`rv-dayPill ${isActive ? 'is-active' : ''} ${isToday ? 'is-today' : ''}`}
                onClick={() => setActiveDay(i)}
              >
                <span className="rv-dayPill-d">{d}</span>
                <span className="rv-dayPill-n">{nums[i]}</span>
                <span className="rv-dayPill-dots">
                  {dayVisits.slice(0,3).map((v, k) => (
                    <i key={k} style={{ background: TYPE_META[v.type].color }} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>

        {/* Chips de filtro */}
        <div className="rv-chips">
          <button className={`rv-chip ${filter==='all'?'is-on':''}`} onClick={() => setFilter('all')}>
            Todas <span className="rv-chip-count">{VISITS.length}</span>
          </button>
          {Object.entries(TYPE_META).map(([k, m]) => {
            const n = VISITS.filter(v => v.type === k).length;
            return (
              <button key={k} className={`rv-chip ${filter===k?'is-on':''}`} style={filter===k?{ '--chip-acc': m.color }:{}} onClick={() => setFilter(k)}>
                <i className="rv-chip-dot" style={{ background: m.color }} />
                {m.label}
                {n > 0 && <span className="rv-chip-count">{n}</span>}
              </button>
            );
          })}
        </div>

        {/* Lista agrupada por día */}
        <div className="rv-agenda">
          {grouped.map(g => (
            <section key={g.day} className="rv-daySection">
              <header className="rv-daySection-h">
                <span className="rv-daySection-num">{nums[g.day]}</span>
                <div>
                  <div className="rv-daySection-title">{g.label}</div>
                  <div className="rv-daySection-sub">{g.sub} · {g.items.length} {g.items.length===1?'visita':'visitas'}</div>
                </div>
              </header>

              <div className="rv-events">
                {g.items.map(v => {
                  const meta = TYPE_META[v.type];
                  return (
                    <article key={v.id} className="rv-event" style={{ '--ev-color': meta.color }}>
                      <div className="rv-event-time">
                        <span className="rv-event-time-h">{FMT_TIME(v.time)}</span>
                        <span className="rv-event-time-dur">{v.dur}m</span>
                      </div>
                      <div className="rv-event-bar" />
                      <div className="rv-event-body">
                        <div className="rv-event-row1">
                          <h4 className="rv-event-title">{v.who}</h4>
                          {v.status === 'pendiente'
                            ? <span className="rv-event-status is-pending">Pendiente</span>
                            : <span className="rv-event-status is-ok">Aprobada</span>}
                        </div>
                        <div className="rv-event-row2">
                          <TypeGlyph type={v.type} size={13} />
                          <span className="rv-event-type" style={{ color: meta.color }}>{meta.label}</span>
                          <span className="rv-event-sep">·</span>
                          <span className="rv-event-note">{v.note}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}

          {grouped.length === 0 && (
            <div className="rv-empty">
              <div className="rv-empty-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>
              </div>
              <div className="rv-empty-t">Sin visitas con este filtro</div>
              <div className="rv-empty-s">Probá otro tipo o creá una nueva.</div>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="community" />
    </div>
  );
};

/* ============================================================
   VARIANTE B · Day timeline tipo Google Calendar
   ============================================================ */
const ScreenReservasTimeline = () => {
  const [view, setView] = React.useState('dia');
  const days = ['S','D','L','M','M','J','V'];
  const nums = [9, 10, 11, 12, 13, 14, 15];

  // Hora actual simulada para el indicador
  const NOW_MIN = 9 * 60 + 22; // 09:22
  const HOUR_PX = 64;
  const START_HOUR = 6;
  const END_HOUR = 22;

  const todayVisits = VISITS.filter(v => v.day === 0);

  const eventTop = (time) => ((TIME_TO_MIN(time) - START_HOUR * 60) / 60) * HOUR_PX;
  const eventH = (dur) => (dur / 60) * HOUR_PX - 4;
  const nowTop = ((NOW_MIN - START_HOUR * 60) / 60) * HOUR_PX;

  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);

  return (
    <div className="app-shell rv-shell">
      <TopBar user="Gabriel Pérez" notifs={1} />

      <div className="rv-tlHead">
        <div>
          <div className="rv-tlHead-eyebrow">SÁBADO</div>
          <div className="rv-tlHead-title">9 de mayo</div>
        </div>
        <div className="rv-segment">
          {[['dia','Día'],['sem','Semana'],['mes','Mes']].map(([k,l]) => (
            <button key={k} className={`rv-segment-i ${view===k?'is-on':''}`} onClick={() => setView(k)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="rv-tlWeek">
        {days.map((d, i) => (
          <button key={i} className={`rv-tlDay ${i===0?'is-on':''}`}>
            <span className="rv-tlDay-d">{d}</span>
            <span className="rv-tlDay-n">{nums[i]}</span>
            {VISITS.some(v => v.day === i) && <span className="rv-tlDay-mark" />}
          </button>
        ))}
      </div>

      <div className="rv-timelineWrap">
        <div className="rv-timeline" style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_PX + 8 }}>
          {/* Riel horario */}
          {hours.map((h, i) => (
            <div key={h} className="rv-tlHour" style={{ top: i * HOUR_PX }}>
              <span className="rv-tlHour-l">{String(h).padStart(2,'0')}</span>
              <span className="rv-tlHour-line" />
            </div>
          ))}

          {/* Línea "ahora" */}
          {nowTop >= 0 && (
            <div className="rv-tlNow" style={{ top: nowTop }}>
              <span className="rv-tlNow-dot" />
              <span className="rv-tlNow-line" />
            </div>
          )}

          {/* Eventos */}
          {todayVisits.map(v => {
            const meta = TYPE_META[v.type];
            return (
              <div
                key={v.id}
                className="rv-tlEvent"
                style={{
                  top: eventTop(v.time) + 2,
                  height: eventH(v.dur),
                  '--ev-color': meta.color,
                }}
              >
                <div className="rv-tlEvent-bar" />
                <div className="rv-tlEvent-content">
                  <div className="rv-tlEvent-row">
                    <span className="rv-tlEvent-time">{FMT_TIME(v.time)}</span>
                    {v.status === 'pendiente' && <span className="rv-tlEvent-pend">Pendiente</span>}
                  </div>
                  <div className="rv-tlEvent-name">{v.who}</div>
                  {eventH(v.dur) > 50 && (
                    <div className="rv-tlEvent-meta">
                      <TypeGlyph type={v.type} size={11} />
                      <span>{meta.label} · {v.note}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAB flotante */}
      <button className="rv-fab" aria-label="Nueva visita">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>

      <BottomNav active="community" />
    </div>
  );
};

/* ============================================================
   VARIANTE C · Nueva Visita — sheet renovado
   ============================================================ */
const ScreenNuevaVisita = () => {
  const [type, setType] = React.useState('delivery');
  const [day, setDay] = React.useState(0);
  const [hour, setHour] = React.useState('08:30');
  const days = [
    { d: 'HOY',    n: 9,  m: 'may' },
    { d: 'DOM',    n: 10, m: 'may' },
    { d: 'LUN',    n: 11, m: 'may' },
    { d: 'MAR',    n: 12, m: 'may' },
    { d: 'MIÉ',    n: 13, m: 'may' },
  ];
  const slots = ['08:30','10:00','12:30','15:00','17:30','19:00'];

  return (
    <div className="app-shell rv-shell">
      <TopBar user="Gabriel Pérez" notifs={1} />

      {/* Backdrop oscurecido del listado debajo */}
      <div className="rv-sheetBackdrop">
        <div className="rv-pageHead" style={{ opacity: 0.35 }}>
          <div>
            <span className="page-eyebrow">COMUNIDAD</span>
            <h1 className="page-title">Mis Visitas</h1>
          </div>
        </div>
        <div className="rv-eventGhost" />
        <div className="rv-eventGhost" />
        <div className="rv-eventGhost" />
      </div>

      {/* Sheet */}
      <div className="rv-sheet">
        <div className="rv-sheet-grab" />
        <div className="rv-sheet-head">
          <div>
            <div className="rv-sheet-eyebrow">NUEVA</div>
            <h2 className="rv-sheet-title">Visita</h2>
          </div>
          <button className="rv-sheet-close" aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tipo: chips visuales */}
        <div className="rv-fieldGroup">
          <label className="field-label">Tipo de visita</label>
          <div className="rv-typeRow">
            {Object.entries(TYPE_META).map(([k, m]) => (
              <button
                key={k}
                className={`rv-typeChip ${type===k?'is-on':''}`}
                style={{ '--c': m.color }}
                onClick={() => setType(k)}
              >
                <span className="rv-typeChip-icon"><TypeGlyph type={k} size={18} color={type===k ? m.color : 'currentColor'} /></span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Visitante */}
        <div className="rv-fieldGroup">
          <label className="field-label">Visitante</label>
          <div className="rv-inputWrap">
            <svg className="rv-inputIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="3.5"/><path d="M5 21c0-3.5 3.1-6 7-6s7 2.5 7 6"/></svg>
            <input className="rv-input" defaultValue="Jose Sosa" placeholder="Nombre y apellido" />
          </div>
        </div>

        {/* Fecha — strip de días */}
        <div className="rv-fieldGroup">
          <label className="field-label">¿Cuándo?</label>
          <div className="rv-dayStrip">
            {days.map((dd, i) => (
              <button key={i} className={`rv-dayCell ${day===i?'is-on':''} ${i===0?'is-today':''}`} onClick={() => setDay(i)}>
                <span className="rv-dayCell-d">{dd.d}</span>
                <span className="rv-dayCell-n">{dd.n}</span>
                <span className="rv-dayCell-m">{dd.m}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Hora — slots rápidos */}
        <div className="rv-fieldGroup">
          <label className="field-label">Hora estimada</label>
          <div className="rv-slots">
            {slots.map(s => (
              <button key={s} className={`rv-slot ${hour===s?'is-on':''}`} onClick={() => setHour(s)}>{s}</button>
            ))}
            <button className="rv-slot rv-slot-custom">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
              Otra
            </button>
          </div>
        </div>

        {/* Nota */}
        <div className="rv-fieldGroup">
          <label className="field-label">Nota <span className="rv-opt">(opcional)</span></label>
          <textarea className="rv-textarea" defaultValue="Pizza" placeholder="Detalle para seguridad…" rows="2" />
        </div>

        {/* Resumen + CTA */}
        <div className="rv-sheet-footer">
          <div className="rv-summary">
            <span className="rv-summary-dot" style={{ background: TYPE_META[type].color }} />
            <div>
              <div className="rv-summary-l">{TYPE_META[type].label} · {hour}</div>
              <div className="rv-summary-s">{days[day].d.toLowerCase()} {days[day].n} de {days[day].m}</div>
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-block">Registrar visita</button>
        </div>
      </div>

      <BottomNav active="community" />
    </div>
  );
};

window.ScreenReservasAgenda = ScreenReservasAgenda;
window.ScreenReservasTimeline = ScreenReservasTimeline;
window.ScreenNuevaVisita = ScreenNuevaVisita;
