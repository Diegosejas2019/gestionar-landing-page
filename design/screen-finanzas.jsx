// Finanzas.jsx — Pagos + Gastos screen

const FinanzasScreen = () => {
  return (
    <div className="page">
      <PageHead
        kicker="Finanzas"
        title="Pagos y gastos"
        sub="Cobranza de expensas, egresos y conciliación bancaria de EDEN 6"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="upload" size={13} />Importar extracto</button>
            <button className="btn btn-secondary"><Icon name="document" size={13} />Liquidación</button>
            <button className="btn btn-primary"><Icon name="plus" size={13} />Registrar pago</button>
          </>
        }
      />

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <FinMetric label="Recaudado en marzo" value="$12.4M" delta="+8.2%" tone="pos" />
        <FinMetric label="Por cobrar" value="$11.2M" delta="46 lotes" tone="warn" />
        <FinMetric label="Egresos del mes" value="$10.2M" delta="−2.1%" tone="pos" />
        <FinMetric label="Resultado" value="+$2.2M" delta="margen 17.7%" tone="pos" big />
        <FinMetric label="Próx. vencimiento" value="10 abr" delta="$14.8M proyectado" tone="info" />
      </div>

      {/* Tabs + filters */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="tabs">
          <div className="tab active">Cobranza <span className="count">142</span></div>
          <div className="tab">Egresos <span className="count">38</span></div>
          <div className="tab">Conciliación <span className="count">3</span></div>
          <div className="tab">Liquidaciones <span className="count">12</span></div>
          <div className="tab">Caja <span className="count">3</span></div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="chip active">Marzo 2025 <Icon name="x" size={11} /></button>
          <button className="chip">Todos los lotes <Icon name="chevDown" size={12} /></button>
          <button className="chip">Estado <Icon name="chevDown" size={12} /></button>
          <button className="chip"><Icon name="filter" size={12} />Más filtros</button>
        </div>
      </div>

      {/* Cobranza summary strip */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: '1px solid var(--line-1)' }}>
          {[
            { label: 'Pagado', count: 96, amount: '$12.4M', tone: 'pos', pct: 68 },
            { label: 'Acordado', count: 8, amount: '$1.6M', tone: 'info', pct: 6 },
            { label: 'Por vencer', count: 15, amount: '$3.7M', tone: 'warn', pct: 11 },
            { label: 'Vencido', count: 23, amount: '$5.9M', tone: 'neg', pct: 15 },
            { label: 'Judicial', count: 0, amount: '$0', tone: 'muted', pct: 0 },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px 18px', borderRight: i < 4 ? '1px solid var(--line-1)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Pill tone={s.tone} dot>{s.label}</Pill>
                <span className="mono muted-2" style={{ fontSize: 11 }}>{s.pct}%</span>
              </div>
              <div className="mono" style={{ fontSize: 18, fontFamily: 'var(--ff-display)', fontWeight: 600, color: 'var(--ink-0)' }}>
                {s.count}
              </div>
              <div className="mono muted" style={{ fontSize: 11 }}>{s.amount}</div>
            </div>
          ))}
        </div>
        <div style={{ height: 6, display: 'flex' }}>
          <div style={{ flex: 68, background: 'var(--pos)' }}></div>
          <div style={{ flex: 6, background: 'var(--info)' }}></div>
          <div style={{ flex: 11, background: 'var(--warn)' }}></div>
          <div style={{ flex: 15, background: 'var(--neg)' }}></div>
        </div>
      </div>

      {/* Big table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: 10, borderBottom: '1px solid var(--line-1)' }}>
          <input className="input" placeholder="Buscar por nombre, lote o comprobante…" style={{ maxWidth: 320 }} />
          <span className="muted-2" style={{ fontSize: 11.5 }}>142 resultados</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn btn-ghost btn-sm"><Icon name="download" size={12} />CSV</button>
            <button className="btn btn-ghost btn-sm"><Icon name="sliders" size={12} />Columnas</button>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 28 }}><input type="checkbox" /></th>
              <th>Lote</th>
              <th>Propietario</th>
              <th>Período</th>
              <th>Vence</th>
              <th>Estado</th>
              <th>Medio</th>
              <th className="num">Original</th>
              <th className="num">Recargos</th>
              <th className="num">Total</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {[
              { lot: '014', name: 'Sofía Marcucci', period: 'Mar 25', due: '10 mar', status: 'pos', medium: 'Mercado Pago', orig: 198750, surchg: 0, total: 198750, statusLabel: 'Pagado' },
              { lot: '028', name: 'Juan Manuel Ríos', period: 'Mar 25', due: '10 mar', status: 'pos', medium: 'Débito Galicia', orig: 248500, surchg: 0, total: 248500, statusLabel: 'Pagado' },
              { lot: '042', name: 'Carolina Pereyra', period: 'Mar 25', due: '14 mar', status: 'warn', medium: '—', orig: 248500, surchg: 0, total: 248500, statusLabel: 'Por vencer' },
              { lot: '056', name: 'Verónica Salinas', period: 'Mar 25', due: '20 mar', status: 'info', medium: 'Plan 3 cuotas', orig: 198750, surchg: 0, total: 198750, statusLabel: 'Acordado' },
              { lot: '073', name: 'Rodrigo Ferrari', period: 'Feb 25', due: '−14d', status: 'neg', medium: '—', orig: 234100, surchg: 14400, total: 248500, statusLabel: 'Vencido' },
              { lot: '087', name: 'Federico Antúnez', period: 'Feb 25', due: '−8d', status: 'neg', medium: '—', orig: 295800, surchg: 16200, total: 312000, statusLabel: 'Vencido' },
              { lot: '094', name: 'Patricia Yacobi', period: 'Mar 25', due: '10 mar', status: 'pos', medium: 'Transferencia', orig: 248500, surchg: 0, total: 248500, statusLabel: 'Pagado' },
              { lot: '119', name: 'Hernán Ojeda', period: 'Ene 25', due: '−21d', status: 'neg', medium: '—', orig: 374200, surchg: 37800, total: 412000, statusLabel: 'Vencido' },
              { lot: '128', name: 'Marcela Bianchi', period: 'Mar 25', due: '10 mar', status: 'pos', medium: 'Mercado Pago', orig: 198750, surchg: 0, total: 198750, statusLabel: 'Pagado' },
              { lot: '134', name: 'Gabriel Tortorella', period: 'Mar 25', due: '12 mar', status: 'warn', medium: '—', orig: 248500, surchg: 0, total: 248500, statusLabel: 'Por vencer' },
            ].map((r, i) => (
              <tr key={i}>
                <td><input type="checkbox" /></td>
                <td className="mono" style={{ color: 'var(--ink-0)', fontSize: 12 }}>L-{r.lot}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Avatar initials={r.name.split(' ').map(p => p[0]).slice(0, 2).join('')} size={24} />
                    <span style={{ color: 'var(--ink-0)', fontSize: 12.5 }}>{r.name}</span>
                  </div>
                </td>
                <td className="mono" style={{ fontSize: 11.5 }}>{r.period}</td>
                <td className="mono" style={{ fontSize: 11.5, color: r.status === 'neg' ? 'var(--neg)' : r.status === 'warn' ? 'var(--warn)' : 'var(--ink-2)' }}>{r.due}</td>
                <td><Pill tone={r.status} dot>{r.statusLabel}</Pill></td>
                <td style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{r.medium}</td>
                <td className="num">${r.orig.toLocaleString('es-AR')}</td>
                <td className="num" style={{ color: r.surchg ? 'var(--neg)' : 'var(--ink-3)' }}>
                  {r.surchg ? `+$${r.surchg.toLocaleString('es-AR')}` : '—'}
                </td>
                <td className="num strong">${r.total.toLocaleString('es-AR')}</td>
                <td><button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="moreV" size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid var(--line-1)' }}>
          <span className="muted-2" style={{ fontSize: 11.5 }}>Mostrando 10 de 142</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-sm"><Icon name="chevLeft" size={12} /></button>
            <button className="btn btn-secondary btn-sm">1</button>
            <button className="btn btn-ghost btn-sm">2</button>
            <button className="btn btn-ghost btn-sm">3</button>
            <button className="btn btn-ghost btn-sm">…</button>
            <button className="btn btn-ghost btn-sm">15</button>
            <button className="btn btn-ghost btn-sm"><Icon name="chev" size={12} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FinMetric = ({ label, value, delta, tone, big }) => (
  <div className="metric" style={big ? { background: 'linear-gradient(135deg, var(--acc-soft), transparent), var(--bg-2)', borderColor: 'var(--line-3)' } : {}}>
    <div className="label">{label}</div>
    <div className="value mono" style={{ fontSize: big ? 28 : 22, color: big ? 'var(--acc-1)' : 'var(--ink-0)' }}>{value}</div>
    {delta && (
      <div style={{ fontSize: 11, color: tone === 'pos' ? 'var(--pos)' : tone === 'neg' ? 'var(--neg)' : tone === 'warn' ? 'var(--warn)' : 'var(--ink-2)', marginTop: 6, fontFamily: 'var(--ff-mono)' }}>
        {delta}
      </div>
    )}
  </div>
);

window.FinanzasScreen = FinanzasScreen;
