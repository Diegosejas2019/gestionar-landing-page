// Screen-operaciones.jsx — Votaciones, Reservas, Visitas

const VotacionesScreen = () => {
  const items = [
    { id: 'V-12', title: 'Aumento expensas Q2 — 8.5%', status: 'live', votes: 89, total: 142, yes: 62, no: 24, abst: 14, closes: '04:23:11', critical: true },
    { id: 'V-11', title: 'Cambio de proveedor de seguridad', status: 'live', votes: 71, total: 142, yes: 41, no: 38, abst: 21, closes: '04:23:11' },
    { id: 'V-10', title: 'Reglamento de mascotas — actualización', status: 'closed', votes: 138, total: 142, yes: 78, no: 18, abst: 4, closed: '02 mar', result: 'Aprobada' },
    { id: 'V-09', title: 'Construcción de SUM cubierto (extraord.)', status: 'closed', votes: 142, total: 142, yes: 51, no: 47, abst: 2, closed: '20 feb', result: 'Rechazada' },
    { id: 'V-08', title: 'Horario de mudanzas — restringir fines de semana', status: 'draft', closes: 'no programada' },
  ];
  return (
    <div className="page">
      <PageHead
        kicker="Operaciones"
        title="Votaciones"
        sub="Asamblea ordinaria del 13 de marzo · 2 abiertas, 2 cerradas, 1 borrador"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="document" size={13} />Acta</button>
            <button className="btn btn-secondary"><Icon name="users" size={13} />Padrón</button>
            <button className="btn btn-primary"><Icon name="plus" size={13} />Nueva votación</button>
          </>
        }
      />

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <FinMetric label="Quórum hoy" value="89/142" delta="63% — válido" tone="pos" big />
        <FinMetric label="Participación promedio 2025" value="74%" delta="+11 pts vs 2024" tone="pos" />
        <FinMetric label="Pendientes de cerrar" value="2" delta="cierran 18:00" tone="warn" />
        <FinMetric label="Votos digitales" value="92%" delta="vs 8% presencial" tone="info" />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button className="chip active">Asamblea actual <Icon name="x" size={11} /></button>
        <button className="chip">Estado <Icon name="chevDown" size={12} /></button>
        <button className="chip">Tipo <Icon name="chevDown" size={12} /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {items.map((v, i) => (
          <div key={i} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: v.critical ? 'var(--acc-soft)' : 'var(--bg-3)', color: v.critical ? 'var(--acc-1)' : 'var(--ink-2)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="vote" size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span className="mono muted-2" style={{ fontSize: 11 }}>{v.id}</span>
                  {v.status === 'live' && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '1px 7px', borderRadius: 8, background: 'var(--neg-soft)', color: 'var(--neg)', fontSize: 10, fontWeight: 600 }}>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--neg)', animation: 'pulse 1.5s infinite' }}></span>EN VIVO
                    </span>
                  )}
                  {v.status === 'closed' && <Pill tone={v.result === 'Aprobada' ? 'pos' : 'neg'} dot>{v.result}</Pill>}
                  {v.status === 'draft' && <Pill tone="muted">Borrador</Pill>}
                  {v.critical && <Pill tone="warn">Crítica</Pill>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.015em', marginBottom: 12 }}>{v.title}</div>

                {v.status !== 'draft' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', height: 28, borderRadius: 6, overflow: 'hidden', gap: 2, marginBottom: 6 }}>
                        <div style={{ flex: v.yes, background: 'var(--acc-1)', position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--acc-ink)', fontWeight: 600 }}>{v.yes}% Sí</span>
                        </div>
                        <div style={{ flex: v.no, background: 'var(--neg)', opacity: 0.7, position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#fff', fontWeight: 600 }}>{v.no}% No</span>
                        </div>
                        <div style={{ flex: v.abst, background: 'var(--bg-4)' }}></div>
                      </div>
                      <div className="muted" style={{ fontSize: 11.5 }}>
                        <span className="mono" style={{ color: 'var(--ink-0)' }}>{v.votes}/{v.total}</span> votaron · {Math.round((v.votes / v.total) * 100)}% participación
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="muted-2" style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        {v.status === 'live' ? 'Cierra en' : 'Cerrada'}
                      </div>
                      <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: v.status === 'live' ? 'var(--warn)' : 'var(--ink-1)' }}>
                        {v.status === 'live' ? v.closes : v.closed}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button className="btn btn-secondary btn-sm">Ver detalle <Icon name="chev" size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ReservasScreen = () => {
  const days = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const hours = ['08', '10', '12', '14', '16', '18', '20'];
  // Synthetic reservation grid
  const reservations = [
    { day: 0, hour: 16, dur: 2, name: 'Familia Pereyra', amenity: 'Tenis 1', tone: 'acc' },
    { day: 0, hour: 18, dur: 2, name: 'Andrés Mariño', amenity: 'Quincho A', tone: 'info' },
    { day: 1, hour: 10, dur: 4, name: 'Clase de yoga', amenity: 'SUM', tone: 'warn' },
    { day: 1, hour: 18, dur: 2, name: 'Diego R.', amenity: 'Tenis 2', tone: 'acc' },
    { day: 2, hour: 16, dur: 2, name: 'Pablo Vinacur', amenity: 'Pileta evento', tone: 'info' },
    { day: 3, hour: 8, dur: 2, name: 'Mantenimiento', amenity: 'Tenis 1', tone: 'muted' },
    { day: 3, hour: 12, dur: 4, name: 'Almuerzo Lascano', amenity: 'Quincho B', tone: 'info' },
    { day: 4, hour: 18, dur: 2, name: 'Torneo paddle', amenity: 'Paddle', tone: 'acc' },
    { day: 5, hour: 10, dur: 8, name: 'Cumple 15 — Yacobi', amenity: 'SUM + Quincho A', tone: 'acc' },
    { day: 5, hour: 16, dur: 2, name: 'Familia Bracco', amenity: 'Tenis 2', tone: 'info' },
    { day: 6, hour: 12, dur: 6, name: 'Asado vecinal', amenity: 'Quincho B', tone: 'info' },
  ];

  return (
    <div className="page">
      <PageHead
        kicker="Operaciones"
        title="Reservas de amenities"
        sub="Semana del 10 al 16 de marzo · 24 reservas · 3 con espera"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="sliders" size={13} />Reglas</button>
            <button className="btn btn-secondary"><Icon name="calendar" size={13} />Mes</button>
            <button className="btn btn-primary"><Icon name="plus" size={13} />Reservar</button>
          </>
        }
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button className="chip">SUM <Icon name="x" size={11} /></button>
        <button className="chip">Tenis 1 <Icon name="x" size={11} /></button>
        <button className="chip">Tenis 2 <Icon name="x" size={11} /></button>
        <button className="chip">Paddle <Icon name="x" size={11} /></button>
        <button className="chip">Quincho A <Icon name="x" size={11} /></button>
        <button className="chip">Quincho B <Icon name="x" size={11} /></button>
        <button className="chip">+ Pileta evento</button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm"><Icon name="chevLeft" size={13} /></button>
          <button className="btn btn-secondary btn-sm">Hoy</button>
          <button className="btn btn-ghost btn-sm"><Icon name="chev" size={13} /></button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', borderBottom: '1px solid var(--line-1)' }}>
          <div></div>
          {['Lun 10', 'Mar 11', 'Mié 12', 'Jue 13', 'Vie 14', 'Sáb 15', 'Dom 16'].map((d, i) => (
            <div key={i} style={{ padding: '12px 10px', borderLeft: '1px solid var(--line-1)', textAlign: 'center' }}>
              <div className="muted-2" style={{ fontSize: 10.5, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>{d.split(' ')[0]}</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 600, color: i === 2 ? 'var(--acc-1)' : 'var(--ink-0)', marginTop: 2 }}>{d.split(' ')[1]}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '60px repeat(7, 1fr)', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {hours.map((h, i) => (
              <div key={i} style={{ height: 56, padding: '4px 10px', borderTop: i > 0 ? '1px solid var(--line-1)' : 'none', textAlign: 'right', fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--ff-mono)' }}>
                {h}:00
              </div>
            ))}
          </div>
          {days.map((_, dayI) => (
            <div key={dayI} style={{ borderLeft: '1px solid var(--line-1)', position: 'relative' }}>
              {hours.map((_, hI) => (
                <div key={hI} style={{ height: 56, borderTop: hI > 0 ? '1px solid var(--line-1)' : 'none' }}></div>
              ))}
              {reservations.filter(r => r.day === dayI).map((r, i) => {
                const top = ((r.hour - 8) / 2) * 56 + 2;
                const height = (r.dur / 2) * 56 - 4;
                const bg = r.tone === 'acc' ? 'var(--acc-soft)' : r.tone === 'warn' ? 'var(--warn-soft)' : r.tone === 'muted' ? 'var(--bg-3)' : 'var(--info-soft)';
                const border = r.tone === 'acc' ? 'var(--acc-1)' : r.tone === 'warn' ? 'var(--warn)' : r.tone === 'muted' ? 'var(--ink-3)' : 'var(--info)';
                const ink = r.tone === 'acc' ? 'var(--acc-1)' : r.tone === 'warn' ? 'var(--warn)' : r.tone === 'muted' ? 'var(--ink-2)' : 'var(--info)';
                return (
                  <div key={i} style={{ position: 'absolute', top, left: 4, right: 4, height, background: bg, borderLeft: `2px solid ${border}`, borderRadius: 4, padding: '6px 8px', overflow: 'hidden' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: ink, lineHeight: 1.2 }}>{r.amenity}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-1)', marginTop: 2 }}>{r.name}</div>
                  </div>
                );
              })}
            </div>
          ))}
          {/* Now line */}
          <div style={{ position: 'absolute', top: 100, left: 60, right: 0, height: 1, background: 'var(--neg)', zIndex: 2 }}>
            <div style={{ position: 'absolute', left: -4, top: -3, width: 7, height: 7, borderRadius: '50%', background: 'var(--neg)' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VisitasScreen = () => {
  const visits = [
    { time: '07:42', plate: 'AB 234 KQ', name: 'Pedro Quiroga', host: 'L-014 · Sofía Marcucci', type: 'Servicio doméstico', status: 'in', color: 'pos' },
    { time: '08:15', plate: 'AC 887 RT', name: 'Javier Mendieta', host: 'L-073 · Rodrigo Ferrari', type: 'Familiar', status: 'in', color: 'pos' },
    { time: '08:30', plate: 'AD 122 LK', name: 'Logística Andreani', host: 'L-029 · Pablo Vinacur', type: 'Delivery', status: 'in', color: 'info' },
    { time: '08:54', plate: 'AB 091 TR', name: 'Romina Carrasco', host: 'L-094 · Patricia Yacobi', type: 'Profesional', status: 'in', color: 'info' },
    { time: '09:12', plate: 'AC 447 GG', name: 'Cuadrilla pintura', host: 'L-014', type: 'Obra', status: 'in', color: 'warn' },
    { time: '09:38', plate: 'AB 661 NM', name: 'Marta Vázquez', host: 'L-128', type: 'Familiar', status: 'out', color: 'muted' },
    { time: '10:02', plate: '—', name: 'Andrés Lara', host: 'L-056 · QR', type: 'Invitado', status: 'expected', color: 'info' },
    { time: '10:30', plate: '—', name: 'Sin identificar', host: 'L-119', type: 'Sin pre-registro', status: 'denied', color: 'neg' },
  ];

  return (
    <div className="page">
      <PageHead
        kicker="Operaciones"
        title="Visitas e ingresos"
        sub="Hoy · 12 marzo · 38 ingresos / 24 egresos · 3 esperados en próximas 2 horas"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="document" size={13} />Bitácora</button>
            <button className="btn btn-primary"><Icon name="plus" size={13} />Pre-registrar</button>
          </>
        }
      />

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <FinMetric label="Adentro ahora" value="142" delta="autorizados" tone="pos" big />
        <FinMetric label="Pre-registrados hoy" value="24" delta="QR enviado" tone="info" />
        <FinMetric label="Pico previsto" value="18:00–20:00" delta="estimado 22 ingresos" tone="warn" />
        <FinMetric label="Bloqueados (mes)" value="3" delta="2 sin pre-registro · 1 alerta" tone="neg" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600 }}>Movimientos de hoy</h3>
            <Pill tone="muted">Tiempo real</Pill>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button className="chip active">Todos</button>
              <button className="chip">Ingresos</button>
              <button className="chip">Egresos</button>
              <button className="chip">Esperados</button>
            </div>
          </div>
          <div style={{ position: 'relative', padding: '12px 14px' }}>
            <div style={{ position: 'absolute', left: 84, top: 16, bottom: 16, width: 1, background: 'var(--line-1)' }}></div>
            {visits.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', position: 'relative' }}>
                <div className="mono" style={{ width: 56, fontSize: 12, color: v.status === 'expected' ? 'var(--warn)' : 'var(--ink-2)', fontWeight: v.status === 'expected' ? 600 : 400 }}>{v.time}</div>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--bg-2)', border: `2px solid var(--bg-2)`, display: 'grid', placeItems: 'center', position: 'relative', zIndex: 1 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color === 'pos' ? 'var(--pos)' : v.color === 'neg' ? 'var(--neg)' : v.color === 'warn' ? 'var(--warn)' : v.color === 'muted' ? 'var(--ink-3)' : 'var(--info)' }}></span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-0)', fontWeight: 500 }}>{v.name}</span>
                    <Pill tone={v.color}>{v.type}</Pill>
                    {v.status === 'in' && <Pill tone="pos" dot>Ingresó</Pill>}
                    {v.status === 'out' && <Pill tone="muted">Egresó</Pill>}
                    {v.status === 'expected' && <Pill tone="warn" dot>Esperado</Pill>}
                    {v.status === 'denied' && <Pill tone="neg" dot>Bloqueado</Pill>}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-2)', marginTop: 2 }}>
                    <span className="mono">{v.plate}</span> · destino {v.host}
                  </div>
                </div>
                <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="moreV" size={14} /></button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-h"><h3>Próximos esperados</h3><span className="muted-2 mono" style={{ fontSize: 11 }}>3</span></div>
            <div className="card-body" style={{ padding: 12 }}>
              {[
                { time: '10:02', name: 'Andrés Lara', host: 'L-056', via: 'QR' },
                { time: '11:30', name: 'Cocina del SUM', host: 'Evento Yacobi', via: 'lista' },
                { time: '14:00', name: 'Service de pileta', host: 'Personal', via: 'directo' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: i < 2 ? '1px solid var(--line-1)' : 'none' }}>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--warn)', width: 38, fontWeight: 600 }}>{p.time}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-0)' }}>{p.name}</div>
                    <div className="muted-2" style={{ fontSize: 11 }}>{p.host} · {p.via}</div>
                  </div>
                  <button className="icon-btn" style={{ width: 24, height: 24 }}><Icon name="check" size={13} /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Patrón semanal</h3></div>
            <div className="card-body" style={{ padding: 14 }}>
              <BarChart data={[
                { label: 'L', value: 38, label2: '' },
                { label: 'M', value: 42 },
                { label: 'X', value: 51 },
                { label: 'J', value: 47 },
                { label: 'V', value: 76 },
                { label: 'S', value: 124 },
                { label: 'D', value: 88 },
              ]} h={130} />
              <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>
                Sábado es 3.2× más cargado que un miércoles. Considerar refuerzo de personal.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.VotacionesScreen = VotacionesScreen;
window.ReservasScreen = ReservasScreen;
window.VisitasScreen = VisitasScreen;
