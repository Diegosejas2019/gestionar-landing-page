/* screen-history.jsx — Historial de pagos */

const ScreenHistory = () => {
  const items = [
    { id:1, period:'Abril 2026',     amount:30000, date:'28 abr 2026', method:'MercadoPago', status:'paid' },
    { id:2, period:'Marzo 2026',     amount:30000, date:'30 mar 2026', method:'Comprobante manual', status:'paid' },
    { id:3, period:'Extraordinario · Reciclaje', amount:5000, date:'15 mar 2026', method:'Comprobante manual', status:'paid' },
    { id:4, period:'Febrero 2026',   amount:28000, date:'01 mar 2026', method:'MercadoPago', status:'paid' },
    { id:5, period:'Saldo anterior', amount:33000, date:'15 feb 2026', method:'Comprobante manual', status:'paid' },
  ];
  const total = items.reduce((s,i)=>s+i.amount,0);

  return (
    <div className="app-shell">
      <TopBar user="Diego" />
      <div className="app-scroll">
        <p className="page-eyebrow">Pagos</p>
        <div className="row-between">
          <h1 className="page-title">Historial</h1>
          <span className="badge badge-accent">{items.length} registros</span>
        </div>

        {/* Stats summary */}
        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            <Stat label="Pagado YTD" value={`$${(total/1000).toFixed(0)}k`} />
            <Stat label="Pagos" value={items.length} />
            <Stat label="Racha" value="5 meses" accent />
          </div>
        </div>

        {/* Filtros */}
        <div className="seg" style={{ marginTop: 14 }}>
          <button className="seg-btn is-active">Todos</button>
          <button className="seg-btn">Aprobados</button>
          <button className="seg-btn">Pendientes</button>
        </div>

        {/* Lista agrupada por mes */}
        <div className="section-head" style={{ marginTop: 18 }}>
          <h3>Abril 2026</h3>
          <span className="muted tnum" style={{ font: 'var(--t-sm)' }}>$30.000</span>
        </div>
        <PaymentRow item={items[0]} />

        <div className="section-head">
          <h3>Marzo 2026</h3>
          <span className="muted tnum" style={{ font: 'var(--t-sm)' }}>$35.000</span>
        </div>
        <PaymentRow item={items[1]} />
        <PaymentRow item={items[2]} />

        <div className="section-head">
          <h3>Febrero 2026</h3>
          <span className="muted tnum" style={{ font: 'var(--t-sm)' }}>$61.000</span>
        </div>
        <PaymentRow item={items[3]} />
        <PaymentRow item={items[4]} />

        <div style={{ height: 24 }}></div>
      </div>
      <BottomNav active="pay" />
    </div>
  );
};

const Stat = ({ label, value, accent }) => (
  <div>
    <div className={`tnum ${accent ? 'accent' : 'bright'}`} style={{ font: 'var(--t-h3)' }}>{value}</div>
    <div className="muted" style={{ font: 'var(--t-xs)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
  </div>
);

const PaymentRow = ({ item }) => (
  <div className="card" style={{ padding: 14, marginBottom: 8 }}>
    <div className="row-between">
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className={`dot-status s-success`}></span>
          <span className="bright" style={{ font: 'var(--t-body-md)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.period}</span>
        </div>
        <div className="muted" style={{ font: 'var(--t-sm)', marginTop: 6 }}>
          {item.date} · {item.method}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div className="h-amount tnum" style={{ fontSize: 20 }}>${item.amount.toLocaleString('es-AR')}</div>
        <div className="row" style={{ justifyContent: 'flex-end', gap: 6, marginTop: 6 }}>
          <StatusPill status={item.status} />
          <button className="btn btn-sm btn-ghost" style={{ padding: '0 8px' }} aria-label="Descargar">
            <Icon name="download" size={14} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

window.ScreenHistory = ScreenHistory;
