/* screen-claims.jsx — Reclamos */

const ScreenClaims = () => {
  const claims = [
    { id:1, cat:'Infraestructura', title:'Pérdida de agua en pasillo', date:'27 abr', status:'progress', steps:['Recibido', 'Asignado', 'En proceso', 'Resuelto'], current: 2, attachments: 1 },
    { id:2, cat:'Mantenimiento',   title:'Foco quemado en cochera',    date:'12 abr', status:'resolved', steps:['Recibido', 'Asignado', 'En proceso', 'Resuelto'], current: 4 },
    { id:3, cat:'Seguridad',       title:'Portón principal lento',     date:'5 abr',  status:'open',     steps:['Recibido', 'Asignado', 'En proceso', 'Resuelto'], current: 1 },
  ];

  return (
    <div className="app-shell">
      <TopBar user="María García" unit="Lote 12" />
      <div className="app-scroll">
        <p className="page-eyebrow">Soporte</p>
        <div className="row-between">
          <h1 className="page-title">Mis reclamos</h1>
          <button className="btn btn-primary btn-sm"><Icon name="plus" size={14}/> Nuevo</button>
        </div>

        {/* Estado resumen */}
        <div className="card" style={{ marginTop: 14, padding: 12, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
          <Stat label="Abiertos" value="1" />
          <Stat label="En proceso" value="1" accent />
          <Stat label="Resueltos" value="1" />
        </div>

        <div className="stack-3" style={{ marginTop: 18 }}>
          {claims.map(c => <ClaimCard key={c.id} {...c} />)}
        </div>

        <div style={{ height: 24 }}></div>
      </div>

      <BottomNav active="community" />
    </div>
  );
};

const ClaimCard = ({ cat, title, date, status, steps, current, attachments }) => (
  <article className="card" style={{ padding: 14 }}>
    <div className="row-between">
      <span className="muted" style={{ font: 'var(--t-xs)', letterSpacing: '.12em', textTransform: 'uppercase' }}>{cat}</span>
      <StatusPill status={status} />
    </div>
    <h4 className="bright" style={{ margin: '6px 0 8px', font: 'var(--t-h3)' }}>{title}</h4>

    {/* Timeline */}
    <div className="timeline">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current - 1;
        return (
          <div key={s} className={`tl-step ${done ? 'is-done' : ''} ${active ? 'is-active' : ''}`}>
            <div className="tl-dot">
              {done ? <Icon name="check" size={10}/> : null}
            </div>
            <div className="tl-label">{s}</div>
          </div>
        );
      })}
    </div>

    <div className="row-between" style={{ marginTop: 12 }}>
      <span className="muted" style={{ font: 'var(--t-xs)' }}>
        {date} {attachments ? `· ${attachments} adjunto` : ''}
      </span>
      <button className="btn btn-sm btn-ghost">Ver detalle <Icon name="chevron-r" size={12}/></button>
    </div>
  </article>
);

window.ScreenClaims = ScreenClaims;
