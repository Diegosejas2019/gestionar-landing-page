/* screen-notices.jsx — Comunicados */

const ScreenNotices = () => {
  const items = [
    { id:1, type:'urgent',    title:'Corte de agua programado', body:'Hoy de 14 a 18hs. Cargá agua con anticipación.', date:'Hoy', unread:true, sender:'Administración' },
    { id:2, type:'important', title:'Vencimiento de Expensas',   body:'Recordamos que el período mayo vence el día 10.', date:'2 may', unread:true, sender:'Administración' },
    { id:3, type:'info',      title:'Reunión de Consorcio',      body:'Se convoca a propietarios el 15/05 a las 19:00 en SUM.', date:'1 may', unread:true, sender:'Administración' },
    { id:4, type:'info',      title:'Mantenimiento de pileta',   body:'Del 10 al 14 de mayo. Cerrada al uso durante esos días.', date:'28 abr', unread:false, sender:'Mantenimiento' },
    { id:5, type:'important', title:'Nuevo reglamento interno',  body:'Disponible para descarga en la sección Documentos.', date:'25 abr', unread:false, sender:'Administración' },
  ];
  const unread = items.filter(i=>i.unread).length;

  return (
    <div className="app-shell">
      <TopBar user="María García" unit="Lote 12" />
      <div className="app-scroll">
        <p className="page-eyebrow">Comunidad</p>
        <div className="row-between">
          <h1 className="page-title">Comunicados</h1>
          {unread > 0 && <span className="badge badge-accent">{unread} nuevos</span>}
        </div>

        <div className="seg" style={{ marginTop: 14 }}>
          <button className="seg-btn is-active">Todos</button>
          <button className="seg-btn">No leídos</button>
          <button className="seg-btn">Urgentes</button>
        </div>

        {unread > 0 && (
          <button className="btn btn-ghost btn-block" style={{ marginTop: 12, height: 38 }}>
            <Icon name="check" size={14}/> Marcar todos como leídos
          </button>
        )}

        <div className="stack-2" style={{ marginTop: 14 }}>
          {items.map(n => <NoticeCard key={n.id} {...n} />)}
        </div>

        <div style={{ height: 24 }}></div>
      </div>
      <BottomNav active="community" />
    </div>
  );
};

const NoticeCard = ({ type, title, body, date, unread, sender }) => {
  const meta = {
    urgent:    { color: 'var(--danger)', bg: 'var(--danger-bg)', icon: 'alert', label: 'Urgente' },
    important: { color: 'var(--warning)', bg: 'var(--warning-bg)', icon: 'alert', label: 'Importante' },
    info:      { color: 'var(--info)', bg: 'var(--info-bg)', icon: 'megaphone', label: 'Aviso' },
  }[type];

  return (
    <article className={`notice ${unread ? 'is-unread' : ''}`}>
      <div className="notice-side" style={{ background: meta.bg, color: meta.color }}>
        <Icon name={meta.icon} size={20}/>
      </div>
      <div className="notice-body">
        <div className="row-between" style={{ marginBottom: 4 }}>
          <span className={`badge`} style={{
            color: meta.color, background: meta.bg, border: 0,
          }}>{meta.label}</span>
          <span className="muted" style={{ font: 'var(--t-xs)' }}>{date}</span>
        </div>
        <h4 className="notice-title">{title}</h4>
        <p className="notice-text">{body}</p>
        <div className="row-between" style={{ marginTop: 10 }}>
          <span className="muted" style={{ font: 'var(--t-xs)' }}>{sender}</span>
          {unread
            ? <button className="btn btn-sm btn-ghost"><Icon name="check" size={12}/> Marcar leído</button>
            : <span className="muted" style={{ font: 'var(--t-xs)', display: 'inline-flex', gap: 4 }}><Icon name="check" size={12}/> Leído</span>}
        </div>
      </div>
    </article>
  );
};

window.ScreenNotices = ScreenNotices;
