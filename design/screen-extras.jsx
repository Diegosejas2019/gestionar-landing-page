// Extras.jsx — Mobile patterns + Design system + Modal/states

const MobileInicio = () => (
  <div className="phone">
    <div className="notch"></div>
    <div className="phone-body" style={{ background: 'var(--bg-1)' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 22px 10px', fontSize: 12, color: 'var(--ink-0)', fontWeight: 600, fontFamily: 'var(--ff-mono)' }}>
        <span>9:41</span>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{ width: 14, height: 9, border: '1px solid var(--ink-1)', borderRadius: 2, position: 'relative' }}>
            <span style={{ position: 'absolute', inset: 1, background: 'var(--acc-1)', borderRadius: 1 }}></span>
          </span>
        </span>
      </div>
      {/* Header */}
      <div style={{ padding: '0 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="org-logo" style={{ width: 34, height: 34 }}>E6</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>EDEN 6</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Hola, Matías</div>
        </div>
        <button className="icon-btn" style={{ position: 'relative' }}>
          <Icon name="bell" size={18} />
          <span className="dot"></span>
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 14px 24px' }}>
        {/* Hero attention */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(156,242,123,0.12), rgba(156,242,123,0.02))',
          border: '1px solid var(--line-3)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 12,
        }}>
          <div className="kicker" style={{ marginBottom: 4 }}><span className="dot"></span>Para hoy</div>
          <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.25, marginBottom: 10 }}>3 cosas para resolver antes del cierre</div>
          <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Ver lista <Icon name="chev" size={12} /></button>
        </div>

        {/* KPI pair */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div className="metric" style={{ padding: 12 }}>
            <div className="label" style={{ fontSize: 10 }}>Recaudado</div>
            <div className="value mono" style={{ fontSize: 20, marginTop: 4 }}>$12.4<span className="unit" style={{ fontSize: 11 }}>M</span></div>
            <div className="delta pos" style={{ marginTop: 4 }}><Icon name="arrowUp" size={10} />+8.2%</div>
          </div>
          <div className="metric" style={{ padding: 12 }}>
            <div className="label" style={{ fontSize: 10 }}>Cobranza</div>
            <div className="value mono" style={{ fontSize: 20, marginTop: 4 }}>78<span className="unit" style={{ fontSize: 11 }}>%</span></div>
            <div className="bar" style={{ marginTop: 8 }}><span style={{ width: '78%' }}></span></div>
          </div>
        </div>

        {/* Live vote */}
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', borderRadius: 8, background: 'var(--neg-soft)', color: 'var(--neg)', fontSize: 9, fontWeight: 600 }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--neg)' }}></span>EN VIVO
              </span>
              <span style={{ fontSize: 12, fontWeight: 500 }}>Asamblea</span>
              <span className="muted-2 mono" style={{ marginLeft: 'auto', fontSize: 11 }}>04:23:11</span>
            </div>
            <div style={{ fontSize: 12, marginBottom: 6 }}>Aumento expensas Q2 — 8.5%</div>
            <div style={{ display: 'flex', height: 18, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
              <div style={{ flex: 62, background: 'var(--acc-1)' }}></div>
              <div style={{ flex: 24, background: 'var(--neg)', opacity: 0.6 }}></div>
              <div style={{ flex: 14, background: 'var(--bg-4)' }}></div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>Acciones rápidas</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {[
            { icon: 'wallet', label: 'Cobrar' },
            { icon: 'megaphone', label: 'Avisar' },
            { icon: 'alert', label: 'Reclamo' },
            { icon: 'document', label: 'Liquidar' },
          ].map((q, i) => (
            <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 'var(--r-md)', padding: '14px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <Icon name={q.icon} size={18} style={{ color: 'var(--acc-1)' }} />
              <span style={{ fontSize: 11, color: 'var(--ink-1)' }}>{q.label}</span>
            </div>
          ))}
        </div>

        {/* Activity */}
        <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8, padding: '0 4px' }}>Actividad</div>
        {[
          { who: 'María Quintana', what: 'pagó expensas', when: '4 min', amount: '$248.500', tone: 'pos', icon: 'wallet' },
          { who: 'Lucía Aguirre', what: 'envió un reclamo', when: '1 h', tone: 'warn', icon: 'alert' },
          { who: 'Diego R.', what: 'reservó cancha tenis', when: '1 h', tone: 'info', icon: 'calendar' },
        ].map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 4px', alignItems: 'center', borderBottom: i < 2 ? '1px solid var(--line-1)' : 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: it.tone === 'pos' ? 'var(--pos-soft)' : it.tone === 'warn' ? 'var(--warn-soft)' : 'var(--bg-3)', color: it.tone === 'pos' ? 'var(--pos)' : it.tone === 'warn' ? 'var(--warn)' : 'var(--ink-1)', display: 'grid', placeItems: 'center' }}>
              <Icon name={it.icon} size={13} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-0)' }}>{it.who} {it.what}</div>
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>hace {it.when}</div>
            </div>
            {it.amount && <span className="mono" style={{ fontSize: 11, color: 'var(--acc-1)' }}>{it.amount}</span>}
          </div>
        ))}
      </div>
      {/* Bottom nav */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--line-1)', padding: '8px 4px 14px', background: 'var(--bg-1)' }}>
        {[
          { icon: 'home', label: 'Inicio', active: true },
          { icon: 'wallet', label: 'Finanzas' },
          { icon: 'users', label: 'Comunidad' },
          { icon: 'alert', label: 'Reclamos', badge: 7 },
          { icon: 'cog', label: 'Más' },
        ].map((t, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: t.active ? 'var(--acc-1)' : 'var(--ink-3)', position: 'relative' }}>
            <Icon name={t.icon} size={18} />
            <span style={{ fontSize: 9.5, fontWeight: t.active ? 600 : 400 }}>{t.label}</span>
            {t.badge && (
              <span style={{ position: 'absolute', top: -2, right: '28%', background: 'var(--neg)', color: '#fff', fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 8, fontFamily: 'var(--ff-mono)' }}>{t.badge}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MobileFinanzas = () => (
  <div className="phone">
    <div className="notch"></div>
    <div className="phone-body" style={{ background: 'var(--bg-1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 22px 10px', fontSize: 12, color: 'var(--ink-0)', fontWeight: 600, fontFamily: 'var(--ff-mono)' }}>
        <span>9:41</span>
        <span><span style={{ width: 14, height: 9, border: '1px solid var(--ink-1)', borderRadius: 2, display: 'inline-block', position: 'relative' }}><span style={{ position: 'absolute', inset: 1, background: 'var(--acc-1)', borderRadius: 1, display: 'block' }}></span></span></span>
      </div>
      <div style={{ padding: '0 18px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="icon-btn"><Icon name="chevLeft" size={18} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Cobranza</div>
          <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>marzo 2025</div>
        </div>
        <button className="icon-btn"><Icon name="filter" size={18} /></button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 14px 24px' }}>
        {/* Big number */}
        <div style={{ background: 'linear-gradient(135deg, rgba(156,242,123,0.10), transparent), var(--bg-2)', border: '1px solid var(--line-3)', borderRadius: 'var(--r-md)', padding: 18, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>RECAUDADO</div>
          <div className="mono" style={{ fontSize: 34, fontFamily: 'var(--ff-display)', fontWeight: 600, marginTop: 4, color: 'var(--acc-1)' }}>$12.4M</div>
          <div className="text-pos" style={{ fontSize: 12, fontFamily: 'var(--ff-mono)' }}>+8.2% vs febrero</div>
          <div style={{ height: 6, background: 'var(--bg-4)', borderRadius: 3, marginTop: 14, overflow: 'hidden', display: 'flex' }}>
            <div style={{ flex: 68, background: 'var(--pos)' }}></div>
            <div style={{ flex: 6, background: 'var(--info)' }}></div>
            <div style={{ flex: 11, background: 'var(--warn)' }}></div>
            <div style={{ flex: 15, background: 'var(--neg)' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 6, color: 'var(--ink-3)' }}>
            <span>96 al día</span><span>23 vencidos</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 10, overflow: 'auto' }}>
          <button className="chip active">Vencidos · 23</button>
          <button className="chip">Por vencer · 15</button>
          <button className="chip">Pagados · 96</button>
        </div>

        {[
          { lot: 'L-119', name: 'Hernán Ojeda', days: 21, amount: 412000 },
          { lot: 'L-087', name: 'Federico Antúnez', days: 8, amount: 312000 },
          { lot: 'L-073', name: 'Rodrigo Ferrari', days: 14, amount: 248500 },
          { lot: 'L-104', name: 'Mariela Toranzos', days: 6, amount: 198750 },
          { lot: 'L-029', name: 'Pablo Vinacur', days: 12, amount: 248500 },
        ].map((r, i) => (
          <div key={i} style={{ background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 'var(--r-md)', padding: 12, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar initials={r.name.split(' ').map(p=>p[0]).join('')} size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--ink-0)', fontWeight: 500 }}>{r.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }} className="mono">{r.lot} · vencido hace {r.days}d</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 13, color: 'var(--neg)', fontWeight: 600 }}>${r.amount.toLocaleString('es-AR')}</div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 4, padding: '3px 8px', fontSize: 10 }}><Icon name="whatsapp" size={11} />Recordar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Design system showcase
const DesignSystemShowcase = () => (
  <div style={{ background: 'var(--bg-1)', padding: 32, color: 'var(--ink-0)' }}>
    <div style={{ marginBottom: 28 }}>
      <div className="kicker"><span className="dot"></span>Sistema</div>
      <h1 className="page-title" style={{ fontSize: 32 }}>Lenguaje visual</h1>
      <div className="page-sub">Un sistema oscuro con acento verde, denso pero respirable. Pensado para admins que pasan 4-8 hs diarias.</div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
      {/* Color */}
      <div>
        <div className="sect-head"><h2>Color</h2></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 18 }}>
          {[
            { name: 'bg-0', val: '#0a0e0c', label: 'Page' },
            { name: 'bg-1', val: '#0f1411', label: 'Shell' },
            { name: 'bg-2', val: '#131a16', label: 'Card' },
            { name: 'bg-3', val: '#18211c', label: 'Hover' },
            { name: 'bg-4', val: '#1f2a24', label: 'Input' },
          ].map(c => (
            <div key={c.name}>
              <div style={{ background: c.val, height: 60, borderRadius: 8, border: '1px solid var(--line-1)' }}></div>
              <div className="mono" style={{ fontSize: 10.5, marginTop: 5, color: 'var(--ink-0)' }}>{c.name}</div>
              <div className="mono muted-2" style={{ fontSize: 10 }}>{c.val}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 18 }}>
          {[
            { val: '#b6f590', name: 'acc-0' },
            { val: '#9cf27b', name: 'acc-1' },
            { val: '#7dd460', name: 'acc-2' },
            { val: '#5ba843', name: 'acc-3' },
            { val: 'rgba(156,242,123,0.12)', name: 'acc-soft', dim: true },
          ].map(c => (
            <div key={c.name}>
              <div style={{ background: c.val, height: 60, borderRadius: 8, border: c.dim ? '1px solid var(--line-3)' : 'none' }}></div>
              <div className="mono" style={{ fontSize: 10.5, marginTop: 5 }}>{c.name}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { val: '#6fd47a', name: 'pos' },
            { val: '#ef6b6b', name: 'neg' },
            { val: '#f5b757', name: 'warn' },
            { val: '#6ec1ff', name: 'info' },
          ].map(c => (
            <div key={c.name}>
              <div style={{ background: c.val, height: 50, borderRadius: 8 }}></div>
              <div className="mono" style={{ fontSize: 10.5, marginTop: 5 }}>{c.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Type */}
      <div>
        <div className="sect-head"><h2>Tipografía</h2></div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ borderBottom: '1px solid var(--line-1)', paddingBottom: 14, marginBottom: 14 }}>
            <div className="muted-2" style={{ fontSize: 11, marginBottom: 4 }}>Inter Tight · Display 600</div>
            <div style={{ fontFamily: 'var(--ff-display)', fontSize: 32, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1 }}>Esto es lo que pasa hoy</div>
          </div>
          <div style={{ borderBottom: '1px solid var(--line-1)', paddingBottom: 14, marginBottom: 14 }}>
            <div className="muted-2" style={{ fontSize: 11, marginBottom: 4 }}>Inter Tight · Heading 600 · 16px</div>
            <div style={{ fontFamily: 'var(--ff-display)', fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em' }}>Cobranza pendiente</div>
          </div>
          <div style={{ borderBottom: '1px solid var(--line-1)', paddingBottom: 14, marginBottom: 14 }}>
            <div className="muted-2" style={{ fontSize: 11, marginBottom: 4 }}>Inter · Body 400 · 13px</div>
            <div style={{ fontSize: 13, color: 'var(--ink-1)' }}>46 lotes · $11.2M acumulado · ordenado por días vencido</div>
          </div>
          <div style={{ borderBottom: '1px solid var(--line-1)', paddingBottom: 14, marginBottom: 14 }}>
            <div className="muted-2" style={{ fontSize: 11, marginBottom: 4 }}>JetBrains Mono · Numerals tabular</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>$12.483.594</div>
          </div>
          <div>
            <div className="muted-2" style={{ fontSize: 11, marginBottom: 4 }}>Inter · Caption 600 · 11px · 0.06em uppercase</div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)' }}>VISTA GENERAL</div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div>
        <div className="sect-head"><h2>Botones</h2></div>
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-primary"><Icon name="plus" size={13} />Nuevo pago</button>
            <button className="btn btn-secondary"><Icon name="download" size={13} />Exportar</button>
            <button className="btn btn-ghost">Cancelar</button>
            <span className="muted-2" style={{ fontSize: 11, marginLeft: 'auto' }}>md · 32px</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-primary btn-sm">Confirmar</button>
            <button className="btn btn-secondary btn-sm">Editar</button>
            <button className="btn btn-ghost btn-sm">Ver</button>
            <span className="muted-2" style={{ fontSize: 11, marginLeft: 'auto' }}>sm · 24px</span>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="icon-btn"><Icon name="bell" size={16} /></button>
            <button className="icon-btn"><Icon name="cog" size={16} /></button>
            <button className="icon-btn"><Icon name="search" size={16} /></button>
            <span className="muted-2" style={{ fontSize: 11, marginLeft: 'auto' }}>icon · 32px</span>
          </div>
        </div>
      </div>

      {/* Pills + chips */}
      <div>
        <div className="sect-head"><h2>Estados &amp; chips</h2></div>
        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Pill tone="pos" dot>Pagado</Pill>
            <Pill tone="warn" dot>Por vencer</Pill>
            <Pill tone="neg" dot>Vencido</Pill>
            <Pill tone="info" dot>Acordado</Pill>
            <Pill tone="acc" dot>En vivo</Pill>
            <Pill tone="muted">Borrador</Pill>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="chip active">Marzo 2025 <Icon name="x" size={11} /></button>
            <button className="chip">Estado <Icon name="chevDown" size={11} /></button>
            <button className="chip"><Icon name="filter" size={12} />Filtros</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Modal example
const ModalShowcase = () => (
  <div style={{
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    height: '100%', width: '100%',
    display: 'grid', placeItems: 'center',
    padding: 40,
  }}>
    <div style={{
      width: 560,
      background: 'var(--bg-2)',
      border: '1px solid var(--line-2)',
      borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-pop)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--line-1)' }}>
        <div className="kicker"><span className="dot"></span>Aprobación requerida</div>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>Aprobar pago a proveedor</h2>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>El pago será procesado vía transferencia inmediata.</div>
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--bg-1)', borderRadius: 'var(--r-md)', border: '1px solid var(--line-1)' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-3)', display: 'grid', placeItems: 'center' }}>
            <Icon name="truck" size={20} style={{ color: 'var(--ink-1)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Limpieza Toribio S.R.L.</div>
            <div className="muted" style={{ fontSize: 12 }}>Servicio mensual · Marzo 2025 · 3 facturas</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>$680.000</div>
            <div className="muted-2 mono" style={{ fontSize: 11 }}>CBU ····3456</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div className="muted-2" style={{ fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Cuenta de origen</div>
            <div style={{ padding: 10, background: 'var(--bg-1)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="wallet" size={14} style={{ color: 'var(--acc-1)' }} />
              <div style={{ flex: 1, fontSize: 12 }}>Galicia ····1842</div>
              <div className="mono muted" style={{ fontSize: 11 }}>$3.8M</div>
            </div>
          </div>
          <div>
            <div className="muted-2" style={{ fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Categoría</div>
            <div style={{ padding: 10, background: 'var(--bg-1)', borderRadius: 'var(--r-sm)', border: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--acc-1)' }}></span>
              <div style={{ flex: 1, fontSize: 12 }}>Servicios · Limpieza</div>
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-1)' }}>
            <input type="checkbox" defaultChecked /> Notificar al consejo por WhatsApp
          </label>
        </div>
      </div>
      <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="muted-2" style={{ fontSize: 11 }}>Acción registrada en auditoría</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost">Cancelar</button>
          <button className="btn btn-primary"><Icon name="check" size={13} />Confirmar pago</button>
        </div>
      </div>
    </div>
  </div>
);

window.MobileInicio = MobileInicio;
window.MobileFinanzas = MobileFinanzas;
window.DesignSystemShowcase = DesignSystemShowcase;
window.ModalShowcase = ModalShowcase;
