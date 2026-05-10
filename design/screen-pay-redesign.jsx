/* screen-pay-redesign.jsx — Variaciones del flujo de Pagos para mobile.
   Mantiene paleta y tokens existentes (dark + lima).
   Foco: comprobante compacto, pensado para "tocar para seleccionar"
   (nadie arrastra archivos en un teléfono).
*/

const PAY_CONCEPTS = [
  { id: 'edenor',   label: 'Edenor',           sub: 'Concepto extraordinario',     amount: 16666.67, status: 'extra' },
  { id: 'expensa',  label: 'Expensa Mayo',     sub: 'Vence el 10/05',              amount: 42500.00, status: 'vigente' },
  { id: 'reciclaje',label: 'Reciclaje',        sub: 'Concepto extraordinario',     amount:  3200.00, status: 'extra' },
];

const fmt = (n) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ---------- Helper: chip de status reutilizable ---------- */
const ConceptBadge = ({ status }) => {
  if (status === 'vencida') return <span className="badge badge-danger">Vencida</span>;
  if (status === 'vigente') return <span className="badge badge-accent">Vigente</span>;
  return <span className="badge badge-warning">Extra</span>;
};

/* ============================================================
   A · COMPACTO
   Misma estructura, comprobante reducido a un solo renglón ("tile")
   con icono + texto + chip. Footer con total y CTA sticky.
   ============================================================ */
const ScreenPayCompact = () => {
  const [selected, setSelected] = React.useState({ edenor: true, expensa: false, reciclaje: false });
  const [file, setFile] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const total = PAY_CONCEPTS.filter(p => selected[p.id]).reduce((s,p)=>s+p.amount, 0);
  const count = Object.values(selected).filter(Boolean).length;

  const toggle = (id) => setSelected(s => ({ ...s, [id]: !s[id] }));
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile({ name: f.name, size: (f.size/1024).toFixed(0) + ' KB' });
  };
  const isReady = total > 0 && file;

  return (
    <div className="app-shell">
      <TopBar user="Diego" unit="Garden 3 · Lote 11" />
      <div className="app-scroll">
        <p className="page-eyebrow">Pagos</p>
        <h1 className="page-title">Pagar</h1>
        <p className="page-sub">Seleccioná los conceptos y subí tu comprobante.</p>

        {/* Atajo a historial — chip discreto */}
        <button className="btn btn-ghost" style={{ height: 36, marginTop: 14, paddingInline: 12 }}>
          <Icon name="document" size={14}/> Historial de pagos <Icon name="chev" size={14}/>
        </button>

        {/* Conceptos */}
        <div className="section-head" style={{ marginTop: 18 }}>
          <h3>Conceptos a pagar</h3>
          <span className="muted" style={{ font: 'var(--t-xs)', textTransform:'none', letterSpacing:0 }}>
            {count} seleccionado{count===1?'':'s'}
          </span>
        </div>

        <div className="stack-2">
          {PAY_CONCEPTS.map(p => {
            const isSel = selected[p.id];
            return (
              <label key={p.id} className={`period-card ${isSel?'is-selected':''}`}
                     onClick={(e)=>{ e.preventDefault(); toggle(p.id); }}>
                <span className={`pc-check ${isSel?'is-on':''}`}>
                  {isSel && <Icon name="check" size={12}/>}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="row" style={{ gap:6 }}>
                    <span className="bright" style={{ font:'var(--t-body-md)' }}>{p.label}</span>
                    <ConceptBadge status={p.status}/>
                  </div>
                  <div className="muted" style={{ font:'var(--t-sm)', marginTop:2 }}>{p.sub}</div>
                </div>
                <span className="tnum bright" style={{ font:'var(--t-body-md)' }}>{fmt(p.amount)}</span>
              </label>
            );
          })}
        </div>

        {/* Comprobante — reducido a un tile inline */}
        <div className="section-head"><h3>Comprobante</h3></div>

        {!file ? (
          <button className="upload-tile" onClick={()=>fileInputRef.current?.click()}>
            <span className="ut-icon"><Icon name="upload" size={18}/></span>
            <span className="ut-body">
              <span className="ut-title">Tocá para seleccionar</span>
              <span className="ut-sub">PDF o imagen · máx. 10 MB</span>
            </span>
            <Icon name="chev" size={16} style={{ color:'var(--muted)' }}/>
          </button>
        ) : (
          <div className="upload-tile is-attached">
            <span className="ut-icon ut-icon-ok"><Icon name="checkCircle" size={18}/></span>
            <span className="ut-body">
              <span className="ut-title bright">{file.name}</span>
              <span className="ut-sub">{file.size} · listo para enviar</span>
            </span>
            <button className="ut-x" onClick={()=>setFile(null)} aria-label="Quitar">
              <Icon name="x" size={14}/>
            </button>
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="application/pdf,image/*"
               onChange={onPick} style={{ display:'none' }}/>

        {/* Nota colapsable */}
        <details className="note-toggle">
          <summary>
            <Icon name="edit" size={14}/> Agregar nota (opcional)
            <Icon name="chevDown" size={14} style={{ marginLeft:'auto' }}/>
          </summary>
          <textarea className="textarea" placeholder="Ej: Transferencia Nº 12345…"
                    style={{ marginTop:8 }}/>
        </details>

        <div style={{ height: 140 }}></div>
      </div>

      {/* Footer rico: total + CTA */}
      <div className="pay-footer">
        <div className="pay-footer-row">
          <div>
            <div className="muted" style={{ font:'var(--t-xs)', letterSpacing:'.12em', textTransform:'uppercase' }}>
              Total
            </div>
            <div className="muted" style={{ font:'var(--t-xs)', marginTop:2 }}>
              {count} concepto{count===1?'':'s'}
            </div>
          </div>
          <span className="h-amount tnum bright" style={{ fontSize: 24 }}>{fmt(total)}</span>
        </div>
        <button className={`btn btn-primary btn-lg btn-block ${!isReady?'is-disabled':''}`}
                style={{ marginTop: 10, boxShadow: isReady ? 'var(--glow-accent)' : 'none' }}>
          <Icon name="check" size={18}/> Enviar comprobante
        </button>
      </div>

      <BottomNav active="pay"/>
    </div>
  );
};

/* ============================================================
   B · POR PASOS
   Indicador 1·2·3, una sola decisión por pantalla.
   Mostramos el paso 2 (comprobante) — el más conflictivo del original.
   ============================================================ */
const ScreenPaySteps = () => {
  const [step, setStep] = React.useState(2);
  const [file, setFile] = React.useState({ name: 'transferencia-1342.pdf', size: '187 KB' });
  const total = 16666.67;

  const Step = ({ n, label, state }) => (
    <div className={`pstep pstep-${state}`}>
      <span className="pstep-dot">{state==='done' ? <Icon name="check" size={12}/> : n}</span>
      <span className="pstep-label">{label}</span>
    </div>
  );

  return (
    <div className="app-shell">
      <TopBar user="Diego" unit="Garden 3 · Lote 11" />
      <div className="app-scroll">
        <p className="page-eyebrow">Pagos · Paso 2 de 3</p>
        <h1 className="page-title">Comprobante</h1>
        <p className="page-sub">Subí la transferencia que hiciste por <span className="bright tnum">{fmt(total)}</span>.</p>

        <div className="psteps" style={{ marginTop: 16 }}>
          <Step n={1} label="Conceptos" state="done"/>
          <Step n={2} label="Comprobante" state="active"/>
          <Step n={3} label="Confirmar" state="todo"/>
        </div>

        {/* Dos formas grandes de adjuntar — tocables */}
        <div className="attach-grid" style={{ marginTop: 18 }}>
          <button className="attach-cta">
            <span className="attach-icon"><Icon name="upload" size={20}/></span>
            <span className="attach-title">Subir archivo</span>
            <span className="attach-sub">PDF o imagen</span>
          </button>
          <button className="attach-cta">
            <span className="attach-icon"><Icon name="document" size={20}/></span>
            <span className="attach-title">Tomar foto</span>
            <span className="attach-sub">Cámara</span>
          </button>
        </div>

        {/* Estado actual: archivo adjunto */}
        {file && (
          <div className="card" style={{ marginTop: 14, padding: 12, display:'flex', gap:12, alignItems:'center' }}>
            <div className="list-icon" style={{ background:'var(--accent-lt)', color:'var(--accent)' }}>
              <Icon name="document" size={18}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="bright" style={{ font:'var(--t-body-md)' }}>{file.name}</div>
              <div className="muted" style={{ font:'var(--t-sm)', marginTop:2 }}>
                <Icon name="checkCircle" size={12} style={{ verticalAlign:'-2px', marginRight:4, color:'var(--success)'}}/>
                {file.size} · adjuntado
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={()=>setFile(null)}>
              <Icon name="x" size={14}/>
            </button>
          </div>
        )}

        <div className="field" style={{ marginTop: 16 }}>
          <label className="field-label">Nota (opcional)</label>
          <textarea className="textarea" placeholder="Ej: Transferencia Nº 12345…"></textarea>
        </div>

        {/* Resumen colapsado de los conceptos elegidos */}
        <div className="card" style={{ marginTop: 14, padding: 14 }}>
          <div className="row-between">
            <span className="muted" style={{ font:'var(--t-xs)', letterSpacing:'.12em', textTransform:'uppercase' }}>
              Conceptos seleccionados
            </span>
            <button className="btn btn-ghost btn-sm" style={{ height: 28, padding:'0 10px' }}>
              Editar
            </button>
          </div>
          <div className="row-between" style={{ marginTop: 10 }}>
            <span className="bright" style={{ font:'var(--t-body-md)' }}>Edenor · Extra</span>
            <span className="tnum bright">{fmt(total)}</span>
          </div>
        </div>

        <div style={{ height: 140 }}></div>
      </div>

      {/* Footer dual: atrás + siguiente */}
      <div className="pay-footer">
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-ghost" style={{ flex: '0 0 auto', width: 56, padding: 0 }}>
            <Icon name="chevLeft" size={18}/>
          </button>
          <button className="btn btn-primary btn-lg" style={{ flex:1, boxShadow:'var(--glow-accent)' }}>
            Continuar <Icon name="arrowRight" size={16}/>
          </button>
        </div>
      </div>

      <BottomNav active="pay"/>
    </div>
  );
};

/* ============================================================
   C · SHEET PRINCIPAL
   Lista de conceptos siempre visible. Comprobante se adjunta desde
   un sheet con dos atajos grandes (foto / archivo). El "drag area"
   desaparece — reemplazado por acciones nativas mobile.
   ============================================================ */
const ScreenPaySheet = () => {
  const [selected, setSelected] = React.useState({ edenor: true, expensa: true, reciclaje: false });
  const [sheetOpen, setSheetOpen] = React.useState(true);
  const [file, setFile] = React.useState(null);
  const total = PAY_CONCEPTS.filter(p => selected[p.id]).reduce((s,p)=>s+p.amount, 0);
  const count = Object.values(selected).filter(Boolean).length;
  const toggle = (id) => setSelected(s => ({ ...s, [id]: !s[id] }));

  return (
    <div className="app-shell" style={{ position:'relative' }}>
      <TopBar user="Diego" unit="Garden 3 · Lote 11" />
      <div className="app-scroll">
        <p className="page-eyebrow">Pagos</p>
        <h1 className="page-title">Pagar</h1>
        <p className="page-sub">Seleccioná los conceptos que querés pagar.</p>

        {/* Conceptos directos, sin tabs */}
        <div className="section-head" style={{ marginTop: 18 }}>
          <h3>Conceptos a pagar</h3>
          <a href="#"><Icon name="document" size={12}/> Historial</a>
        </div>

        <div className="stack-2">
          {PAY_CONCEPTS.map(p => {
            const isSel = selected[p.id];
            return (
              <label key={p.id} className={`period-card ${isSel?'is-selected':''}`}
                     onClick={(e)=>{ e.preventDefault(); toggle(p.id); }}>
                <span className={`pc-check ${isSel?'is-on':''}`}>
                  {isSel && <Icon name="check" size={12}/>}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div className="row" style={{ gap:6 }}>
                    <span className="bright" style={{ font:'var(--t-body-md)' }}>{p.label}</span>
                    <ConceptBadge status={p.status}/>
                  </div>
                  <div className="muted" style={{ font:'var(--t-sm)', marginTop:2 }}>{p.sub}</div>
                </div>
                <span className="tnum bright" style={{ font:'var(--t-body-md)' }}>{fmt(p.amount)}</span>
              </label>
            );
          })}
        </div>

        {/* Total destacado, en hero card */}
        <div className="card-hero" style={{ marginTop: 16 }}>
          <div className="row-between">
            <span className="muted" style={{ font:'var(--t-xs)', letterSpacing:'.12em', textTransform:'uppercase' }}>
              Total a pagar
            </span>
            <span className="badge badge-accent">{count} {count===1?'concepto':'conceptos'}</span>
          </div>
          <div className="h-amount-xl tnum accent" style={{ marginTop: 10 }}>{fmt(total)}</div>
          <div className="muted" style={{ font:'var(--t-sm)', marginTop:6 }}>
            Te alcanza con un único comprobante para todos.
          </div>
        </div>

        {/* Comprobante: una sola línea, abre sheet al tocar */}
        <button className="upload-tile" style={{ marginTop:14 }} onClick={()=>setSheetOpen(true)}>
          <span className="ut-icon"><Icon name="upload" size={18}/></span>
          <span className="ut-body">
            <span className="ut-title">Adjuntar comprobante</span>
            <span className="ut-sub">{file ? file.name : 'PDF o imagen · máx. 10 MB'}</span>
          </span>
          <Icon name="chev" size={16} style={{ color: 'var(--muted)' }}/>
        </button>

        <div style={{ height: 200 }}></div>
      </div>

      {/* Sticky CTA */}
      <div className="sticky-cta">
        <button className="btn btn-primary btn-lg btn-block" style={{ boxShadow: 'var(--glow-accent)' }}>
          <Icon name="check" size={18}/> Enviar comprobante · {fmt(total)}
        </button>
      </div>

      {/* Sheet de adjuntar */}
      {sheetOpen && (
        <>
          <div className="sheet-backdrop" onClick={()=>setSheetOpen(false)}/>
          <div className="sheet-wrap">
            <div className="sheet">
              <div className="sheet-handle"></div>
              <div className="row-between" style={{ marginBottom: 6 }}>
                <h3 style={{ font:'var(--t-h2)', color:'var(--text-bright)', margin:0, letterSpacing:'-0.01em' }}>
                  Adjuntar comprobante
                </h3>
                <button className="topbar-icon-btn" onClick={()=>setSheetOpen(false)} aria-label="Cerrar">
                  <Icon name="x" size={16}/>
                </button>
              </div>
              <p className="muted" style={{ font:'var(--t-sm)', margin:'0 0 16px' }}>
                Elegí cómo querés enviarlo. Aceptamos PDF o imagen, hasta 10 MB.
              </p>

              <div className="sheet-options">
                <button className="sheet-opt" onClick={()=>{ setFile({name:'foto-comprobante.jpg'}); setSheetOpen(false); }}>
                  <span className="sheet-opt-icon"><Icon name="document" size={20}/></span>
                  <span>
                    <span className="sheet-opt-title">Tomar foto</span>
                    <span className="sheet-opt-sub">Usá la cámara del teléfono</span>
                  </span>
                  <Icon name="chev" size={16} style={{ color:'var(--muted)', marginLeft:'auto' }}/>
                </button>

                <button className="sheet-opt" onClick={()=>{ setFile({name:'transferencia.pdf'}); setSheetOpen(false); }}>
                  <span className="sheet-opt-icon"><Icon name="upload" size={20}/></span>
                  <span>
                    <span className="sheet-opt-title">Elegir archivo</span>
                    <span className="sheet-opt-sub">Galería · Drive · iCloud</span>
                  </span>
                  <Icon name="chev" size={16} style={{ color:'var(--muted)', marginLeft:'auto' }}/>
                </button>

                <button className="sheet-opt sheet-opt-pay">
                  <span className="sheet-opt-icon" style={{ background:'var(--accent)', color:'#0a1408' }}>
                    <Icon name="wallet" size={20}/>
                  </span>
                  <span>
                    <span className="sheet-opt-title">Pagar online</span>
                    <span className="sheet-opt-sub">Pasarela segura · sin comprobante</span>
                  </span>
                  <Icon name="chev" size={16} style={{ color:'var(--muted)', marginLeft:'auto' }}/>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <BottomNav active="pay"/>
    </div>
  );
};

window.ScreenPayCompact = ScreenPayCompact;
window.ScreenPaySteps = ScreenPaySteps;
window.ScreenPaySheet = ScreenPaySheet;
