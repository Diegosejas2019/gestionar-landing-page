/* screen-pay.jsx — Pagar / Subir Comprobante (multi-período) */

const ScreenPay = () => {
  const [tab, setTab] = React.useState('upload');
  const [selected, setSelected] = React.useState({ may: true, abr: false, reciclaje: false });

  const periods = [
    { id:'may', label:'Mayo 2026',     sub:'Expensa ordinaria · vigente', amount:30000, status:'vigente' },
    { id:'abr', label:'Abril 2026',    sub:'Expensa ordinaria · vencida', amount:30000, status:'vencida' },
    { id:'reciclaje', label:'Reciclaje', sub:'Concepto extraordinario',   amount:5000,  status:'extra' },
  ];
  const total = periods.filter(p => selected[p.id]).reduce((s,p)=>s+p.amount, 0);
  const count = Object.values(selected).filter(Boolean).length;

  const toggle = (id) => setSelected(s => ({ ...s, [id]: !s[id] }));

  return (
    <div className="app-shell">
      <TopBar user="Diego" unit="Garden 3 · Lote 11" />
      <div className="app-scroll">
        <p className="page-eyebrow">Pagos</p>
        <h1 className="page-title">Pagar</h1>
        <p className="page-sub">Seleccioná uno o más períodos para pagar juntos.</p>

        <div className="seg" style={{ marginTop: 18 }}>
          <button className={`seg-btn ${tab==='upload'?'is-active':''}`} onClick={()=>setTab('upload')}>
            <Icon name="upload" size={16}/> Subir comprobante
          </button>
          <button className={`seg-btn ${tab==='online'?'is-active':''}`} onClick={()=>setTab('online')}>
            <Icon name="wallet" size={16}/> Pago online
          </button>
        </div>

        {/* Selección de períodos */}
        <div className="section-head" style={{ marginTop: 18 }}>
          <h3>Períodos a pagar</h3>
          <span className="muted" style={{ font: 'var(--t-xs)' }}>{count} seleccionados</span>
        </div>

        <div className="stack-2">
          {periods.map(p => {
            const isSel = selected[p.id];
            const tone = p.status === 'vencida' ? 'danger' : (p.status === 'vigente' ? 'accent' : 'warning');
            return (
              <label
                key={p.id}
                className={`period-card ${isSel ? 'is-selected' : ''}`}
                onClick={(e)=>{ e.preventDefault(); toggle(p.id); }}
              >
                <span className={`pc-check ${isSel ? 'is-on' : ''}`}>
                  {isSel && <Icon name="check" size={12}/>}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="bright" style={{ font: 'var(--t-body-md)' }}>{p.label}</span>
                    {p.status === 'vencida'  && <span className="badge badge-danger">Vencida</span>}
                    {p.status === 'vigente'  && <span className="badge badge-accent">Vigente</span>}
                    {p.status === 'extra'    && <span className="badge badge-warning">Extra</span>}
                  </div>
                  <div className="muted" style={{ font: 'var(--t-sm)', marginTop: 2 }}>{p.sub}</div>
                </div>
                <span className="tnum bright" style={{ font: 'var(--t-body-md)' }}>
                  ${p.amount.toLocaleString('es-AR')}
                </span>
              </label>
            );
          })}
        </div>

        {/* Total */}
        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          <div className="row-between">
            <div>
              <div className="muted" style={{ font: 'var(--t-xs)', letterSpacing: '.12em', textTransform: 'uppercase' }}>
                Total a pagar
              </div>
              <div className="muted" style={{ font: 'var(--t-xs)', marginTop: 4 }}>
                {count} {count === 1 ? 'período' : 'períodos'} seleccionados
              </div>
            </div>
            <span className="h-amount tnum accent" style={{ fontSize: 30 }}>
              ${total.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {tab === 'upload' ? (
          <>
            <div className="section-head"><h3>Comprobante</h3></div>
            <div className="upload-area">
              <div className="list-icon" style={{ width: 52, height: 52, background: 'var(--accent-lt)', color: 'var(--accent)' }}>
                <Icon name="upload" size={24} />
              </div>
              <div className="bright" style={{ font: 'var(--t-h3)', marginTop: 10 }}>Arrastrá tu archivo</div>
              <div className="muted" style={{ font: 'var(--t-sm)', marginTop: 4 }}>o tocá para seleccionar</div>
              <span className="badge badge-plain" style={{ marginTop: 12, background: 'var(--surface-3)' }}>
                PDF o imagen · máx. 10 MB
              </span>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label className="field-label">Nota (opcional)</label>
              <textarea className="textarea" placeholder="Ej: Transferencia Nº 12345…"></textarea>
            </div>
          </>
        ) : (
          <div className="card" style={{ marginTop: 16,
            background: 'radial-gradient(120% 100% at 100% 0%, rgba(156,242,123,0.10), transparent 55%), var(--surface)',
            border: '1px solid var(--border-md)' }}>
            <div className="row-between">
              <span className="muted" style={{ font: 'var(--t-xs)', letterSpacing: '.12em', textTransform: 'uppercase' }}>Pago online</span>
              <span className="badge badge-success">Seguro</span>
            </div>
            <div className="h-amount-xl tnum" style={{ marginTop: 12 }}>${total.toLocaleString('es-AR')}</div>
            <div className="muted" style={{ font: 'var(--t-sm)', marginTop: 4 }}>
              {count} {count === 1 ? 'período' : 'períodos'} · pasarela externa
            </div>
            <div className="stack-3" style={{ marginTop: 16 }}>
              <button className="btn btn-primary btn-lg btn-block">
                <Icon name="wallet" size={18}/> Ir al checkout seguro
              </button>
              <div className="row" style={{ justifyContent: 'center', gap: 6, color: 'var(--muted)', font: 'var(--t-xs)' }}>
                <Icon name="shield" size={14}/> Pago procesado por proveedor externo
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 80 }}></div>
      </div>

      {tab === 'upload' && (
        <div className="sticky-cta">
          <button className="btn btn-primary btn-lg btn-block" style={{ boxShadow: 'var(--glow-accent)' }}>
            <Icon name="check" size={18}/> Enviar comprobante · ${total.toLocaleString('es-AR')}
          </button>
        </div>
      )}

      <BottomNav active="pay" />
    </div>
  );
};

window.ScreenPay = ScreenPay;
