/* shared.jsx — TopBar, BottomNav, StatusPill, comunes a varias screens */

const TopBar = ({ user = 'Diego', unit = 'Lote 12 · Garden 3', notifs = 2 }) => (
  <div className="topbar">
    <div className="topbar-logo">
      <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: 6,
        background: 'var(--accent)', color: '#0a1408',
        textAlign: 'center', lineHeight: '22px', fontWeight: 800, fontSize: 13 }}>G</span>
      Gestion<em>Ar</em>
    </div>
    <div className="topbar-spacer" />
    <button className="topbar-icon-btn" aria-label="Notificaciones">
      <Icon name="bell" size={18} />
      {notifs > 0 && <span className="dot"></span>}
    </button>
    <div className="avatar" title={`${user} · ${unit}`}>
      {user.split(' ').map(p => p[0]).slice(0,2).join('').toUpperCase()}
    </div>
  </div>
);

const BottomNav = ({ active = 'home' }) => {
  const tabs = [
    { id: 'home',      label: 'Inicio',    icon: 'home' },
    { id: 'pay',       label: 'Pagar',     icon: 'wallet' },
    { id: 'community', label: 'Comunidad', icon: 'community' },
    { id: 'profile',   label: 'Perfil',    icon: 'profile' },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <button key={t.id} className={`bn-item ${active === t.id ? 'is-active' : ''}`}>
          <Icon name={t.icon} size={22} stroke={active === t.id ? 2 : 1.6} />
          {t.label}
        </button>
      ))}
    </nav>
  );
};

/* Status pill optimizado para estados de pago / reclamo */
const StatusPill = ({ status, children }) => {
  const map = {
    paid:    { cls: 'badge-success', label: 'Aprobado' },
    pending: { cls: 'badge-warning', label: 'Pendiente' },
    rejected:{ cls: 'badge-danger',  label: 'Rechazado' },
    open:    { cls: 'badge-accent',  label: 'Abierto' },
    progress:{ cls: 'badge-warning', label: 'En proceso' },
    resolved:{ cls: 'badge-success', label: 'Resuelto' },
    closed:  { cls: 'badge-success', label: 'Cerrado' },
    expired: { cls: 'badge-danger',  label: 'Vencida' },
    new:     { cls: 'badge-accent',  label: 'Nuevo' },
    info:    { cls: 'badge-info',    label: 'Aviso' },
    urgent:  { cls: 'badge-danger',  label: 'Urgente' },
    important:{ cls: 'badge-warning',label: 'Importante' },
  };
  const m = map[status] || { cls: 'badge', label: status };
  return <span className={`badge ${m.cls}`}>{children || m.label}</span>;
};

window.TopBar = TopBar;
window.BottomNav = BottomNav;
window.StatusPill = StatusPill;
