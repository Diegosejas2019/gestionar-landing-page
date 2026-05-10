/* screen-claim-new.jsx — Modal Nuevo Reclamo */

const ScreenNewClaim = () => (
  <div className="app-shell">
    <TopBar user="María García" />
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(5,10,8,0.6)', backdropFilter: 'blur(4px)',
      zIndex: 10, display: 'flex', alignItems: 'flex-end',
    }}>
      <div className="sheet">
        <div className="sheet-handle"></div>
        <div className="row-between" style={{ marginBottom: 14 }}>
          <h2 style={{ font: 'var(--t-h2)', color: 'var(--text-bright)', margin: 0 }}>Nuevo reclamo</h2>
          <button className="topbar-icon-btn" aria-label="Cerrar"><Icon name="x" size={18}/></button>
        </div>

        <div className="stack-4">
          <div className="field">
            <label className="field-label">Categoría</label>
            <div style={{ display:'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {['Infraestructura','Mantenimiento','Seguridad','Limpieza'].map((c,i)=>(
                <button key={c} className={`chip ${i===0?'is-active':''}`}>
                  <Icon name={['wrench','sparkle','shield','sun'][i]} size={14}/>{c}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="field-label">Título</label>
            <input className="input" placeholder="Ej: Pérdida de agua en pasillo"/>
          </div>

          <div className="field">
            <label className="field-label">Descripción</label>
            <textarea className="textarea" placeholder="Contanos qué pasó, dónde y cuándo lo notaste…"></textarea>
          </div>

          <div className="field">
            <label className="field-label">Adjuntos (opcional · máx 3)</label>
            <div className="upload-area" style={{ padding: 18 }}>
              <Icon name="clip" size={20}/>
              <span style={{ font: 'var(--t-sm)', marginTop: 8 }}>Tocá para agregar fotos o PDFs</span>
            </div>
          </div>
        </div>

        <div className="stack-2" style={{ marginTop: 18 }}>
          <button className="btn btn-primary btn-lg btn-block">Enviar reclamo</button>
          <button className="btn btn-ghost btn-block">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
);

window.ScreenNewClaim = ScreenNewClaim;
