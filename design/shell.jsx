// Shell.jsx — Sidebar + Topbar + Page wrapper for the GestionAr admin
// Uses window.Icon (icons.jsx)

const Sidebar = ({ active = 'inicio', collapsed = false }) => {
  const items = [
    { group: 'Workspace', children: [
      { id: 'inicio', label: 'Inicio', icon: 'home' },
      { id: 'finanzas', label: 'Finanzas', icon: 'wallet', badge: '3', alert: true },
    ]},
    { group: 'Comunidad', children: [
      { id: 'propietarios', label: 'Propietarios', icon: 'users' },
      { id: 'comunicados', label: 'Comunicados', icon: 'megaphone' },
      { id: 'reclamos', label: 'Reclamos', icon: 'alert', badge: '7' },
    ]},
    { group: 'Operaciones', children: [
      { id: 'votaciones', label: 'Votaciones', icon: 'vote', badge: 'EN VIVO', acc: true },
      { id: 'reservas', label: 'Reservas', icon: 'calendar' },
      { id: 'visitas', label: 'Visitas', icon: 'car' },
    ]},
    { group: 'Administración', children: [
      { id: 'personal', label: 'Personal', icon: 'briefcase' },
      { id: 'proveedores', label: 'Proveedores', icon: 'truck' },
      { id: 'soporte', label: 'Soporte', icon: 'help' },
      { id: 'config', label: 'Configuración', icon: 'cog' },
    ]},
  ];

  return (
    <aside className="sidebar">
      <div className="org-card">
        <div className="org-logo">E6</div>
        <div className="org-meta">
          <div className="org-name">EDEN 6</div>
          <div className="org-sub">Barrio cerrado · 142 lotes</div>
        </div>
        <Icon name="chevDown" size={14} style={{ color: 'var(--ink-3)' }} />
      </div>

      {items.map((g, gi) => (
        <React.Fragment key={gi}>
          <div className="nav-section">{g.group}</div>
          {g.children.map((it) => (
            <div key={it.id} className={`nav-item ${active === it.id ? 'active' : ''}`}>
              <Icon name={it.icon} size={16} />
              <span>{it.label}</span>
              {it.badge && (
                <span className={`badge ${it.alert ? 'alert' : ''} ${it.acc ? 'acc' : ''}`}>{it.badge}</span>
              )}
            </div>
          ))}
        </React.Fragment>
      ))}

      <div className="sidebar-foot">
        <div className="user-row">
          <div className="avatar acc">MG</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-0)' }}>Matías Giménez</div>
            <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>Administrador</div>
          </div>
          <Icon name="chev" size={14} style={{ color: 'var(--ink-3)' }} />
        </div>
      </div>
    </aside>
  );
};

const Topbar = ({ crumbs = ['Inicio'], children }) => (
  <div className="topbar">
    <div className="crumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          <span className={i === crumbs.length - 1 ? 'cur' : ''}>{c}</span>
        </React.Fragment>
      ))}
    </div>
    {children}
    <div className="search">
      <Icon name="search" size={14} style={{ color: 'var(--ink-3)' }} />
      <span>Buscar lote, persona, comprobante…</span>
      <span className="kbd">⌘K</span>
    </div>
    <button className="icon-btn" title="Notificaciones">
      <Icon name="bell" size={16} />
      <span className="dot"></span>
    </button>
    <button className="icon-btn" title="Bandeja">
      <Icon name="inbox" size={16} />
    </button>
    <div style={{ width: 1, height: 22, background: 'var(--line-1)', margin: '0 4px' }}></div>
    <button className="btn btn-primary btn-sm">
      <Icon name="plus" size={13} />
      Nueva acción
    </button>
  </div>
);

const PageHead = ({ kicker, title, sub, actions }) => (
  <div className="page-head">
    <div>
      {kicker && <div className="kicker"><span className="dot"></span>{kicker}</div>}
      <h1 className="page-title">{title}</h1>
      {sub && <div className="page-sub">{sub}</div>}
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </div>
);

const Pill = ({ tone, children, dot }) => (
  <span className={`pill ${tone || ''}`}>
    {dot && <span className="d"></span>}
    {children}
  </span>
);

const Avatar = ({ initials, tone, size = 28, src }) => (
  <div className={`avatar ${tone || ''}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
    {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
  </div>
);

// Tiny inline sparkline
const Sparkline = ({ values, w = 70, h = 24, color = 'var(--acc-1)', filled = true }) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 2) - 1}`).join(' ');
  const area = filled ? `M0,${h} L${pts.split(' ').join(' L')} L${w},${h} Z`.replace(/L /g, 'L') : null;
  return (
    <svg width={w} height={h}>
      {filled && (
        <path d={`M 0 ${h} L ${pts.split(' ').map(p => p.replace(',', ' ')).join(' L ')} L ${w} ${h} Z`}
              fill={color} opacity="0.12" />
      )}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
};

// Bar chart (simple)
const BarChart = ({ data, h = 140, accentLast = true }) => {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: h, padding: '8px 0' }}>
      {data.map((d, i) => {
        const isLast = i === data.length - 1;
        const fill = accentLast && isLast ? 'var(--acc-1)' : 'var(--bg-4)';
        const barH = (d.value / max) * (h - 28);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--ff-mono)' }}>
              {d.label2 || ''}
            </div>
            <div style={{ width: '100%', height: barH, background: fill, borderRadius: 3, transition: 'height .3s' }}></div>
            <div style={{ fontSize: 10, color: isLast ? 'var(--acc-1)' : 'var(--ink-3)', fontWeight: isLast ? 600 : 400 }}>
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Area chart
const AreaChart = ({ data, w = 600, h = 160, color = 'var(--acc-1)', label }) => {
  const max = Math.max(...data.map(d => d.value)) * 1.1;
  const min = 0;
  const step = w / (data.length - 1);
  const pts = data.map((d, i) => [i * step, h - 24 - ((d.value - min) / (max - min)) * (h - 40)]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `M 0 ${h - 24} L ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')} L ${w} ${h - 24} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* horizontal grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
        <line key={i} x1="0" y1={16 + p * (h - 40)} x2={w} y2={16 + p * (h - 40)} stroke="rgba(255,255,255,0.04)" />
      ))}
      <path d={area} fill="url(#ag)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === pts.length - 1 ? 3 : 0} fill={color} stroke="var(--bg-2)" strokeWidth="1.5" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={i * step} y={h - 6} fontSize="10" fill="var(--ink-3)" textAnchor="middle" fontFamily="var(--ff-mono)">
          {d.label}
        </text>
      ))}
    </svg>
  );
};

// Donut chart
const Donut = ({ size = 96, stroke = 14, segments }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-4)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const dasharray = `${len} ${c - len}`;
        const dashoffset = -offset;
        offset += len;
        return (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={dasharray} strokeDashoffset={dashoffset}
            strokeLinecap="butt" />
        );
      })}
    </svg>
  );
};

window.Sidebar = Sidebar;
window.Topbar = Topbar;
window.PageHead = PageHead;
window.Pill = Pill;
window.Avatar = Avatar;
window.Sparkline = Sparkline;
window.BarChart = BarChart;
window.AreaChart = AreaChart;
window.Donut = Donut;
