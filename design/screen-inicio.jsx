// Inicio.jsx — Home dashboard for GestionAr admin
// Layout: KPI strip → Smart attention hero + Cashflow chart → Tables row → Calendar/Activity

const InicioScreen = () => {
  return (
    <div className="page">
      <PageHead
        kicker="Vista general"
        title="Buen día, Matías"
        sub="Esto es lo que pasa hoy en EDEN 6 — 12 de marzo, miércoles"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="download" size={13} />Exportar</button>
            <button className="btn btn-secondary"><Icon name="calendar" size={13} />Marzo 2025</button>
            <button className="btn btn-primary"><Icon name="bolt" size={13} />Acciones rápidas</button>
          </>
        }
      />

      {/* Smart attention strip — what needs me NOW */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 20 }}>
        <AttentionHero />
        <LiveVoteCard />
      </div>

      {/* Metrics */}
      <div className="metric-grid">
        <Metric
          label="Recaudación de marzo"
          value="$12.4"
          unit="M"
          delta="+8.2%"
          deltaTone="pos"
          meta="vs. febrero · proyectado $14.8M"
          spark={[8, 9, 7, 11, 10, 13, 12, 14]}
        />
        <Metric
          label="Cobranza"
          value="78"
          unit="%"
          delta="−3 pts"
          deltaTone="neg"
          meta="46 de 142 lotes sin pagar"
          progress={78}
        />
        <Metric
          label="Reclamos abiertos"
          value="7"
          unit=""
          delta="+2"
          deltaTone="neg"
          meta="3 con SLA en riesgo"
          spark={[3, 4, 5, 4, 6, 5, 7, 7]}
          sparkColor="var(--neg)"
        />
        <Metric
          label="Saldo en caja"
          value="$3.8"
          unit="M"
          delta="+$420k"
          deltaTone="pos"
          meta="3 cuentas · última conciliación 2 h"
        />
      </div>

      {/* Cashflow + Right column */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Flujo de caja</h3>
              <div className="sub">Últimos 12 meses · ingresos vs egresos</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="row gap-2" style={{ fontSize: 11, color: 'var(--ink-2)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--acc-1)' }}></span>
                  Ingresos
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--ink-3)' }}></span>
                  Egresos
                </span>
              </div>
              <button className="chip">12M <Icon name="chevDown" size={12} /></button>
            </div>
          </div>
          <div className="card-body">
            <CashflowChart />
          </div>
        </div>

        <div className="card">
          <div className="card-h">
            <div>
              <h3>Mix de ingresos</h3>
              <div className="sub">Marzo · $12.4M total</div>
            </div>
            <button className="icon-btn"><Icon name="more" size={16} /></button>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Donut
              size={120}
              stroke={18}
              segments={[
                { value: 68, color: 'var(--acc-1)' },
                { value: 18, color: '#7dd460' },
                { value: 9, color: '#5ba843' },
                { value: 5, color: 'var(--bg-4)' },
              ]}
            />
            <div style={{ flex: 1 }}>
              {[
                { label: 'Expensas ordinarias', value: '$8.4M', pct: '68%', color: 'var(--acc-1)' },
                { label: 'Expensas extraord.', value: '$2.2M', pct: '18%', color: '#7dd460' },
                { label: 'Multas y recargos', value: '$1.1M', pct: '9%', color: '#5ba843' },
                { label: 'Otros', value: '$680k', pct: '5%', color: 'var(--bg-4)' },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < 3 ? '1px solid var(--line-1)' : 'none' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color }}></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{r.pct}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-1)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Two-up: Pendientes / Actividad */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <PendingPaymentsCard />
        <ActivityFeed />
      </div>
    </div>
  );
};

const Metric = ({ label, value, unit, delta, deltaTone, meta, spark, sparkColor, progress }) => (
  <div className="metric">
    <div className="label">{label}</div>
    <div className="value mono">{value}{unit && <span className="unit">{unit}</span>}</div>
    {delta && (
      <div className={`delta ${deltaTone === 'pos' ? 'pos' : 'neg'}`}>
        <Icon name={deltaTone === 'pos' ? 'arrowUp' : 'arrowDown'} size={11} />
        {delta}
      </div>
    )}
    {meta && <div className="meta">{meta}</div>}
    {spark && (
      <div className="spark">
        <Sparkline values={spark} color={sparkColor || 'var(--acc-1)'} />
      </div>
    )}
    {progress != null && (
      <div className="bar" style={{ marginTop: 12 }}>
        <span style={{ width: `${progress}%` }}></span>
      </div>
    )}
  </div>
);

const AttentionHero = () => (
  <div style={{
    background: 'linear-gradient(135deg, rgba(156,242,123,0.08) 0%, rgba(156,242,123,0.02) 100%), var(--bg-2)',
    border: '1px solid var(--line-3)',
    borderRadius: 'var(--r-md)',
    padding: '20px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    position: 'relative',
    overflow: 'hidden',
  }}>
    <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'var(--acc-soft)', filter: 'blur(60px)' }}></div>
    <div style={{ position: 'relative' }}>
      <div className="kicker"><span className="dot"></span>Hoy te necesita</div>
      <h2 style={{ fontSize: 22, lineHeight: 1.15, margin: '4px 0 6px', maxWidth: 460 }}>
        3 cosas para resolver antes del cierre de marzo
      </h2>
      <p style={{ color: 'var(--ink-2)', fontSize: 13, maxWidth: 460 }}>
        El sistema priorizó lo que mueve la aguja en cobranza y operación esta semana.
      </p>
    </div>

    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { tone: 'neg', icon: 'alert', title: 'Aprobar 8 pagos en revisión', sub: '$2.14M acumulado · 3 vencen hoy', cta: 'Revisar' },
        { tone: 'warn', icon: 'clock', title: 'Cerrar liquidación de febrero', sub: 'Falta firma del consejo · 4 días tarde', cta: 'Continuar' },
        { tone: 'acc', icon: 'megaphone', title: 'Publicar comunicado: corte de agua jueves', sub: 'Borrador listo · revisar y enviar a 142 propietarios', cta: 'Enviar' },
      ].map((t, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--bg-1)',
          border: '1px solid var(--line-1)',
          borderRadius: 'var(--r-sm)',
          padding: '10px 12px',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: t.tone === 'neg' ? 'var(--neg-soft)' : t.tone === 'warn' ? 'var(--warn-soft)' : 'var(--acc-soft)',
            color: t.tone === 'neg' ? 'var(--neg)' : t.tone === 'warn' ? 'var(--warn)' : 'var(--acc-1)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <Icon name={t.icon} size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-0)' }}>{t.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{t.sub}</div>
          </div>
          <button className="btn btn-secondary btn-sm">{t.cta}<Icon name="chev" size={12} /></button>
        </div>
      ))}
    </div>
  </div>
);

const LiveVoteCard = () => (
  <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
    <div className="card-h">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 7px', borderRadius: 10, background: 'var(--neg-soft)', color: 'var(--neg)', fontSize: 10, fontWeight: 600 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--neg)', animation: 'pulse 1.5s infinite' }}></span>
            EN VIVO
          </span>
          <h3>Asamblea ordinaria</h3>
        </div>
        <div className="sub">2 votaciones abiertas · cierran 18:00</div>
      </div>
      <button className="icon-btn"><Icon name="external" size={14} /></button>
    </div>
    <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 12, color: 'var(--ink-1)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 500 }}>Aumento expensas Q2 — 8.5%</span>
          <span className="mono muted-2" style={{ fontSize: 11 }}>89/142</span>
        </div>
        <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
          <div style={{ flex: 62, background: 'var(--acc-1)', position: 'relative' }}>
            <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: 'var(--acc-ink)', fontWeight: 600 }}>62% Sí</span>
          </div>
          <div style={{ flex: 24, background: 'var(--neg)', opacity: 0.6 }}></div>
          <div style={{ flex: 14, background: 'var(--bg-4)' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 4, color: 'var(--ink-3)' }}>
          <span>62% Sí</span><span>24% No</span><span>14% Abst.</span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: 'var(--ink-1)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 500 }}>Cambio de proveedor de seguridad</span>
          <span className="mono muted-2" style={{ fontSize: 11 }}>71/142</span>
        </div>
        <div style={{ display: 'flex', height: 24, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
          <div style={{ flex: 41, background: 'var(--acc-1)' }}></div>
          <div style={{ flex: 38, background: 'var(--neg)', opacity: 0.6 }}></div>
          <div style={{ flex: 21, background: 'var(--bg-4)' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginTop: 4, color: 'var(--ink-3)' }}>
          <span>41% Sí</span><span>38% No</span><span>21% Abst.</span>
        </div>
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--line-1)' }}>
        <Icon name="clock" size={13} style={{ color: 'var(--warn)' }} />
        <span style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>Cierra en <span className="mono" style={{ color: 'var(--ink-0)' }}>04:23:11</span></span>
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }}>Ver detalle</button>
      </div>
    </div>
  </div>
);

const CashflowChart = () => {
  const months = ['Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar'];
  const inc = [9.2, 9.8, 10.1, 10.4, 10.8, 11.0, 11.2, 11.0, 11.4, 11.6, 11.8, 12.4];
  const exp = [7.8, 8.1, 8.6, 8.4, 8.9, 9.1, 9.0, 9.3, 9.7, 9.5, 10.0, 10.2];
  const max = 14;
  const w = 700, h = 220;
  const stepX = w / (months.length - 1);
  const ptsInc = inc.map((v, i) => `${i * stepX},${h - 30 - (v / max) * (h - 50)}`).join(' ');
  const ptsExp = exp.map((v, i) => `${i * stepX},${h - 30 - (v / max) * (h - 50)}`).join(' ');
  const areaInc = `M 0 ${h - 30} L ${ptsInc.split(' ').map(p => p.replace(',', ' ')).join(' L ')} L ${w} ${h - 30} Z`;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="cf-inc" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--acc-1)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--acc-1)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.33, 0.66, 1].map((p, i) => (
        <g key={i}>
          <line x1="0" y1={20 + p * (h - 50)} x2={w} y2={20 + p * (h - 50)} stroke="rgba(255,255,255,0.04)" />
          <text x="-2" y={24 + p * (h - 50)} fontSize="10" fill="var(--ink-3)" textAnchor="end" fontFamily="var(--ff-mono)">
            ${Math.round((max - p * max) * 10) / 10}M
          </text>
        </g>
      ))}
      <path d={areaInc} fill="url(#cf-inc)" />
      <polyline points={ptsInc} fill="none" stroke="var(--acc-1)" strokeWidth="1.8" strokeLinejoin="round" />
      <polyline points={ptsExp} fill="none" stroke="var(--ink-3)" strokeWidth="1.4" strokeLinejoin="round" strokeDasharray="3 3" />
      {/* last point dot */}
      <circle cx={(months.length - 1) * stepX} cy={h - 30 - (inc[inc.length - 1] / max) * (h - 50)} r="4" fill="var(--acc-1)" stroke="var(--bg-2)" strokeWidth="2" />
      {months.map((m, i) => (
        <text key={i} x={i * stepX} y={h - 8} fontSize="10" fill={i === months.length - 1 ? 'var(--acc-1)' : 'var(--ink-3)'} textAnchor="middle" fontFamily="var(--ff-mono)" fontWeight={i === months.length - 1 ? 600 : 400}>
          {m}
        </text>
      ))}
    </svg>
  );
};

const PendingPaymentsCard = () => {
  const rows = [
    { lot: 'Lote 042', name: 'Carolina Pereyra', amount: 248500, days: 2, status: 'warn' },
    { lot: 'Lote 087', name: 'Federico Antúnez', amount: 312000, days: 8, status: 'neg' },
    { lot: 'Lote 014', name: 'Sofía Marcucci', amount: 198750, days: 1, status: 'warn' },
    { lot: 'Lote 119', name: 'Hernán Ojeda', amount: 412000, days: 21, status: 'neg' },
    { lot: 'Lote 056', name: 'Verónica Salinas', amount: 198750, days: 0, status: 'info' },
    { lot: 'Lote 073', name: 'Rodrigo Ferrari', amount: 248500, days: 14, status: 'neg' },
  ];
  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Cobranza pendiente</h3>
          <div className="sub">46 lotes · $11.2M acumulado · ordenado por días vencido</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="chip">Vencidos <span className="mono" style={{ color: 'var(--neg)' }}>23</span></button>
          <button className="chip">Por vencer <span className="mono" style={{ color: 'var(--warn)' }}>15</span></button>
          <button className="btn btn-ghost btn-sm">Ver todos<Icon name="chev" size={12} /></button>
        </div>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Lote / Propietario</th>
            <th>Estado</th>
            <th>Días</th>
            <th className="num">Monto</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={r.name.split(' ').map(p => p[0]).join('')} size={28} />
                  <div>
                    <div className="strong" style={{ color: 'var(--ink-0)', fontSize: 12.5 }}>{r.name}</div>
                    <div className="muted-2 mono" style={{ fontSize: 11 }}>{r.lot}</div>
                  </div>
                </div>
              </td>
              <td>
                <Pill tone={r.status} dot>
                  {r.status === 'warn' ? 'Por vencer' : r.status === 'neg' ? 'Vencido' : 'Acordado'}
                </Pill>
              </td>
              <td className="mono" style={{ color: r.status === 'neg' ? 'var(--neg)' : r.status === 'warn' ? 'var(--warn)' : 'var(--ink-1)', fontSize: 12 }}>
                {r.days === 0 ? 'Hoy' : r.days < 0 ? `−${Math.abs(r.days)}d` : `${r.days}d`}
              </td>
              <td className="num">${r.amount.toLocaleString('es-AR')}</td>
              <td><button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="moreV" size={14} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ActivityFeed = () => {
  const items = [
    { who: 'María Quintana', what: 'pagó expensas marzo', when: 'hace 4 min', icon: 'wallet', tone: 'pos', amount: '$248.500' },
    { who: 'Sistema', what: 'cerró conciliación bancaria — Galicia', when: 'hace 22 min', icon: 'refresh', tone: 'info' },
    { who: 'Lucía Aguirre', what: 'envió un reclamo: ruido en Lote 89', when: 'hace 1 h', icon: 'alert', tone: 'warn' },
    { who: 'Diego Ramírez', what: 'reservó la cancha de tenis 18:00', when: 'hace 1 h', icon: 'calendar', tone: 'info' },
    { who: 'Vos', what: 'aprobaste pago a Limpieza Toribio S.R.L.', when: 'hace 2 h', icon: 'check', tone: 'pos', amount: '$680.000' },
    { who: 'Ana Pellegrini', what: 'subió 3 documentos a la asamblea', when: 'hace 3 h', icon: 'document', tone: 'info' },
    { who: 'Sistema', what: 'envió 142 recordatorios de expensas por WhatsApp', when: 'hace 5 h', icon: 'whatsapp', tone: 'pos' },
  ];
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-h">
        <div>
          <h3>Actividad</h3>
          <div className="sub">Últimas 24 horas</div>
        </div>
        <button className="icon-btn"><Icon name="filter" size={14} /></button>
      </div>
      <div className="card-body" style={{ paddingTop: 8, flex: 1 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 13, top: 8, bottom: 8, width: 1, background: 'var(--line-1)' }}></div>
          {items.map((it, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', position: 'relative' }}>
              <div style={{
                width: 27, height: 27, borderRadius: '50%',
                background: it.tone === 'pos' ? 'var(--pos-soft)' : it.tone === 'warn' ? 'var(--warn-soft)' : it.tone === 'neg' ? 'var(--neg-soft)' : 'var(--bg-3)',
                color: it.tone === 'pos' ? 'var(--pos)' : it.tone === 'warn' ? 'var(--warn)' : it.tone === 'neg' ? 'var(--neg)' : 'var(--ink-1)',
                display: 'grid', placeItems: 'center', flexShrink: 0,
                border: '2px solid var(--bg-2)',
                position: 'relative', zIndex: 1,
              }}>
                <Icon name={it.icon} size={12} />
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
                <div style={{ fontSize: 12, color: 'var(--ink-1)' }}>
                  <span style={{ color: 'var(--ink-0)', fontWeight: 500 }}>{it.who}</span> {it.what}
                  {it.amount && <span className="mono" style={{ color: 'var(--acc-1)', marginLeft: 6 }}>{it.amount}</span>}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>{it.when}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

window.InicioScreen = InicioScreen;
