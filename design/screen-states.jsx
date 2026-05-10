/* screen-states.jsx — Empty / Loading / Error / Toasts */

const ScreenStates = () => (
  <div className="app-shell">
    <TopBar user="Diego"/>
    <div className="app-scroll">
      <p className="page-eyebrow">Sistema de estados</p>
      <h1 className="page-title">Empty · Loading · Error</h1>
      <p className="page-sub">Patrones reutilizables para todas las pantallas.</p>

      {/* Empty */}
      <div className="section-head"><h3>Empty state</h3></div>
      <div className="card">
        <div className="empty">
          <div className="empty-icon"><Icon name="megaphone" size={22}/></div>
          <div className="empty-title">Sin novedades por ahora</div>
          <div className="empty-sub">Cuando la administración publique avisos, los vas a ver acá.</div>
          <button className="btn btn-ghost btn-sm">Refrescar</button>
        </div>
      </div>

      {/* Skeleton */}
      <div className="section-head"><h3>Loading skeleton</h3></div>
      <div className="card stack-3" style={{ padding: 14 }}>
        <div style={{ display:'flex', gap: 12, alignItems:'center' }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 12 }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 14, width: '60%' }}></div>
            <div className="skeleton" style={{ height: 10, width: '40%', marginTop: 8 }}></div>
          </div>
        </div>
        <div className="skeleton" style={{ height: 14, width: '90%' }}></div>
        <div className="skeleton" style={{ height: 14, width: '75%' }}></div>
      </div>

      {/* Error */}
      <div className="section-head"><h3>Error state</h3></div>
      <div className="card" style={{ borderColor: 'var(--danger)', background: 'rgba(240,138,138,0.05)' }}>
        <div className="row" style={{ gap: 12 }}>
          <div className="list-icon" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
            <Icon name="alert" size={18}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="bright" style={{ font: 'var(--t-h3)' }}>No pudimos cargar los pagos</div>
            <div className="muted" style={{ font: 'var(--t-sm)', marginTop: 4 }}>
              Revisá tu conexión y volvé a intentar.
            </div>
          </div>
        </div>
        <div className="stack-2" style={{ marginTop: 12 }}>
          <button className="btn btn-primary btn-block">Reintentar</button>
        </div>
      </div>

      {/* Toasts */}
      <div className="section-head"><h3>Toasts / feedback</h3></div>
      <div className="stack-2">
        <div className="toast toast-success">
          <div className="toast-icon"><Icon name="check" size={14}/></div>
          <div style={{ flex: 1 }}>
            <div className="bright" style={{ font: 'var(--t-body-md)' }}>Comprobante enviado</div>
            <div className="muted" style={{ font: 'var(--t-xs)' }}>Te avisamos cuando lo aprueben</div>
          </div>
        </div>
        <div className="toast" style={{ borderColor: 'var(--warning)' }}>
          <div className="toast-icon" style={{ background:'var(--warning-bg)', color:'var(--warning)' }}>
            <Icon name="alert" size={14}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="bright" style={{ font: 'var(--t-body-md)' }}>Cuota próxima a vencer</div>
            <div className="muted" style={{ font: 'var(--t-xs)' }}>Faltan 3 días</div>
          </div>
        </div>
        <div className="toast" style={{ borderColor: 'var(--danger)' }}>
          <div className="toast-icon" style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>
            <Icon name="x" size={14}/>
          </div>
          <div style={{ flex: 1 }}>
            <div className="bright" style={{ font: 'var(--t-body-md)' }}>Comprobante rechazado</div>
            <div className="muted" style={{ font: 'var(--t-xs)' }}>Subí uno nuevo desde Pagar</div>
          </div>
        </div>
      </div>

      <div style={{ height: 24 }}></div>
    </div>
    <BottomNav active="home"/>
  </div>
);

window.ScreenStates = ScreenStates;
