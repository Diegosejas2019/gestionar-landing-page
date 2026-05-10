/* screen-home.jsx — Inicio Owner */

const ScreenHome = () => {
  const dueDays = 8;
  const dueAmount = 30000;
  const status = 'upcoming'; // 'paid' | 'upcoming' | 'overdue'

  const statusMap = {
    paid:     { dot: 's-success', label: 'Al día', accentCls: '' },
    upcoming: { dot: 's-warning', label: 'Próximo a vencer', accentCls: '' },
    overdue:  { dot: 's-danger',  label: 'Vencido', accentCls: 'is-overdue' },
  }[status];

  return (
    <div className="app-shell">
      <TopBar user="Diego" unit="Garden 3 · Lote 11" notifs={2} />

      <div className="app-scroll">
        <p className="page-eyebrow">Buenos días · Dom 3 May</p>
        <h1 className="greeting">Hola, <span>Diego</span> 👋</h1>
        <p className="page-sub" style={{ marginTop: 4 }}>Garden 3 · Lote 11</p>

        {/* HERO: estado de cuota — versión enfática */}
        <div className="card-hero hero-due" style={{ marginTop: 18 }}>
          {/* Glow decorativo */}
          <div aria-hidden style={{
            position: 'absolute', top: -60, right: -60,
            width: 220, height: 220, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,194,101,0.18), transparent 70%)',
            pointerEvents: 'none',
          }}></div>

          <div className="row-between" style={{ marginBottom: 14 }}>
            <span className="badge" style={{
              color: 'var(--warning)', background: 'var(--warning-bg)', border: 0
            }}>
              <span className="dot-status s-warning" style={{ marginRight: 2 }}></span>
              Próximo a vencer
            </span>
            <span className="muted" style={{ font: 'var(--t-xs)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
              Mayo 2026
            </span>
          </div>

          <div className="muted" style={{ font: 'var(--t-xs)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>
            Tu cuota de este mes
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="h-amount-xl" style={{ fontSize: 52 }}>$30.000</span>
          </div>

          {/* Vencimiento card-in-card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            marginTop: 16, padding: '12px 14px',
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderRadius: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--warning-bg)', color: 'var(--warning)',
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              <Icon name="calendar" size={20}/>
            </div>
            <div style={{ flex: 1 }}>
              <div className="bright" style={{ font: 'var(--t-body-md)' }}>
                Vence el <span style={{ color: 'var(--warning)' }}>10 de mayo</span>
              </div>
              <div className="muted tnum" style={{ font: 'var(--t-sm)', marginTop: 2 }}>
                en {dueDays} días · Dom · 23:59hs
              </div>
            </div>
          </div>

          {/* Progress de tiempo */}
          <div className="progress" style={{ marginTop: 14, marginBottom: 16 }}>
            <span style={{ width: '60%' }}></span>
          </div>

          <div className="stack-2">
            <button className="btn btn-primary btn-lg btn-block" style={{ height: 56, fontSize: 16 }}>
              <Icon name="upload" size={20} /> Subir comprobante
              <Icon name="arrow-r" size={16} style={{ marginLeft: 'auto' }}/>
            </button>
            <button className="btn btn-ghost btn-block" style={{ height: 44 }}>
              <Icon name="wallet" size={16} /> Pagar online con MercadoPago
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="section-head"><h3>Acciones rápidas</h3></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <QuickAction icon="megaphone" label="Comunicados" hint="2 nuevos" badge />
          <QuickAction icon="wrench" label="Nuevo reclamo" hint="Reportá un problema" />
          <QuickAction icon="court" label="Reservar espacio" hint="Pileta · SUM · Cancha" />
          <QuickAction icon="visit" label="Visitas" hint="Autorizar ingreso" />
        </div>

        {/* Último pago */}
        <div className="section-head">
          <h3>Último pago</h3>
          <a href="#">Ver historial →</a>
        </div>
        <div className="list-item">
          <div className="list-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
            <Icon name="check" size={18} />
          </div>
          <div className="list-body">
            <p className="list-title">Abril 2026</p>
            <p className="list-sub">28/04 · MercadoPago</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="bright tnum" style={{ font: 'var(--t-body-md)' }}>$30.000</div>
            <StatusPill status="paid" />
          </div>
        </div>

        {/* Novedades del barrio */}
        <div className="section-head">
          <h3>Novedades</h3>
          <a href="#">Ver todo →</a>
        </div>
        <div className="stack-2">
          <NoticePreview type="urgent" title="Corte de agua programado" date="Hoy · 14:00" unread />
          <NoticePreview type="info" title="Reunión de Consorcio — Mayo" date="5 may" unread />
        </div>

        <div style={{ height: 24 }}></div>
      </div>

      <BottomNav active="home" />
    </div>
  );
};

const QuickAction = ({ icon, label, hint, badge }) => (
  <button className="qa-card">
    <div className="qa-icon">
      <Icon name={icon} size={20} />
      {badge && <span className="qa-badge"></span>}
    </div>
    <div className="qa-body">
      <div className="qa-label">{label}</div>
      <div className="qa-hint">{hint}</div>
    </div>
  </button>
);

const NoticePreview = ({ type, title, date, unread }) => {
  const meta = {
    urgent:    { color: 'var(--danger)', bg: 'var(--danger-bg)', icon: 'alert' },
    important: { color: 'var(--warning)', bg: 'var(--warning-bg)', icon: 'alert' },
    info:      { color: 'var(--info)', bg: 'var(--info-bg)', icon: 'megaphone' },
  }[type];
  return (
    <div className="list-item" style={{ position: 'relative' }}>
      {unread && <span style={{
        position: 'absolute', left: -2, top: 16, width: 4, height: 28,
        borderRadius: 4, background: 'var(--accent)', boxShadow: '0 0 8px var(--accent)'
      }}></span>}
      <div className="list-icon" style={{ background: meta.bg, color: meta.color }}>
        <Icon name={meta.icon} size={18} />
      </div>
      <div className="list-body">
        <p className="list-title" style={{ fontWeight: unread ? 600 : 500 }}>{title}</p>
        <p className="list-sub">{date}</p>
      </div>
      <Icon name="chevron-r" size={16} className="list-trail" />
    </div>
  );
};

window.ScreenHome = ScreenHome;
