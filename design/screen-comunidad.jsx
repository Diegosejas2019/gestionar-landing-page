// Comunidad.jsx — Propietarios + Comunicados + Reclamos

const PropietariosScreen = () => {
  const rows = [
    { lot: '014', name: 'Sofía Marcucci', email: 'sofi.marcucci@gmail.com', phone: '+54 11 5234-1198', members: 4, status: 'al-dia', joined: 'Mar 2019', balance: 0 },
    { lot: '028', name: 'Juan Manuel Ríos', email: 'jm.rios@hotmail.com', phone: '+54 11 6022-7841', members: 3, status: 'al-dia', joined: 'Ago 2021', balance: 0 },
    { lot: '042', name: 'Carolina Pereyra', email: 'carolina.p@outlook.com', phone: '+54 11 4189-2204', members: 2, status: 'porvenir', joined: 'Ene 2020', balance: 248500 },
    { lot: '056', name: 'Verónica Salinas', email: 'vsalinas@gmail.com', phone: '+54 11 6712-9907', members: 5, status: 'plan', joined: 'Jul 2018', balance: 596250 },
    { lot: '073', name: 'Rodrigo Ferrari', email: 'rodriferrari@gmail.com', phone: '+54 11 5119-3320', members: 4, status: 'deuda', joined: 'May 2022', balance: 248500 },
    { lot: '087', name: 'Federico Antúnez', email: 'fede.antunez@gmail.com', phone: '+54 11 4882-1027', members: 2, status: 'deuda', joined: 'Nov 2017', balance: 624000 },
    { lot: '094', name: 'Patricia Yacobi', email: 'pyacobi@gmail.com', phone: '+54 11 5390-6624', members: 3, status: 'al-dia', joined: 'Feb 2020', balance: 0 },
    { lot: '119', name: 'Hernán Ojeda', email: 'h.ojeda@gmail.com', phone: '+54 11 6087-4419', members: 1, status: 'judicial', joined: 'Sep 2016', balance: 1236000 },
  ];
  const tone = (s) => ({ 'al-dia': 'pos', 'porvenir': 'warn', 'plan': 'info', 'deuda': 'neg', 'judicial': 'neg' }[s]);
  const label = (s) => ({ 'al-dia': 'Al día', 'porvenir': 'Por vencer', 'plan': 'Plan de pago', 'deuda': 'Deuda', 'judicial': 'En judicial' }[s]);

  return (
    <div className="page">
      <PageHead
        kicker="Comunidad"
        title="Propietarios"
        sub="142 lotes · 387 personas registradas en EDEN 6"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="upload" size={13} />Importar</button>
            <button className="btn btn-secondary"><Icon name="mail" size={13} />Enviar a todos</button>
            <button className="btn btn-primary"><Icon name="plus" size={13} />Nuevo propietario</button>
          </>
        }
      />

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <FinMetric label="Total lotes" value="142" delta="100% ocupados" tone="info" />
        <FinMetric label="Al día" value="96" delta="68% — saludable" tone="pos" />
        <FinMetric label="Con plan de pago" value="8" delta="$1.6M acordado" tone="info" />
        <FinMetric label="En deuda" value="38" delta="$5.9M · 1 judicial" tone="neg" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="tabs">
          <div className="tab active">Todos <span className="count">142</span></div>
          <div className="tab">Al día <span className="count">96</span></div>
          <div className="tab">Con deuda <span className="count">38</span></div>
          <div className="tab">Inactivos <span className="count">0</span></div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="chip"><Icon name="search" size={12} />Buscar</button>
          <button className="chip">Vista: Tabla <Icon name="chevDown" size={12} /></button>
        </div>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Lote</th>
              <th>Propietario titular</th>
              <th>Contacto</th>
              <th>Habitantes</th>
              <th>Antigüedad</th>
              <th>Estado</th>
              <th className="num">Saldo</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="mono" style={{ color: 'var(--ink-0)', fontSize: 12 }}>L-{r.lot}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={r.name.split(' ').map(p => p[0]).slice(0, 2).join('')} size={28} />
                    <div>
                      <div className="strong" style={{ fontSize: 12.5 }}>{r.name}</div>
                      <div className="muted-2" style={{ fontSize: 11 }}>desde {r.joined}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-1)' }}>{r.email}</div>
                  <div className="mono muted-2" style={{ fontSize: 11 }}>{r.phone}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name="user" size={12} style={{ color: 'var(--ink-3)' }} />
                    <span className="mono" style={{ fontSize: 12 }}>{r.members}</span>
                  </div>
                </td>
                <td className="mono muted" style={{ fontSize: 11.5 }}>
                  {Math.round((2025 - parseInt(r.joined.split(' ')[1])) ) }a
                </td>
                <td><Pill tone={tone(r.status)} dot>{label(r.status)}</Pill></td>
                <td className="num" style={{ color: r.balance > 0 ? 'var(--neg)' : 'var(--ink-3)' }}>
                  {r.balance > 0 ? `$${r.balance.toLocaleString('es-AR')}` : '—'}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="whatsapp" size={13} /></button>
                    <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="mail" size={13} /></button>
                    <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="moreV" size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ComunicadosScreen = () => {
  const items = [
    { tag: 'Mantenimiento', urgency: 'high', title: 'Corte programado de agua — jueves 14/03', body: 'Se realizará un corte de agua de 9 a 14 hs por mantenimiento del tanque principal. Sugerimos almacenar agua para necesidades básicas.', author: 'Administración', when: 'hoy 09:14', stats: { read: 89, total: 142, replies: 12 }, status: 'sent' },
    { tag: 'Asamblea', urgency: 'med', title: 'Recordatorio: asamblea ordinaria miércoles 13/03 — 19:00', body: 'Se aprobará el aumento de expensas Q2 y se discutirá el cambio de proveedor de seguridad. Tu voto digital ya está habilitado.', author: 'Consejo de administración', when: 'lunes 11:30', stats: { read: 142, total: 142, replies: 38 }, status: 'sent' },
    { tag: 'Seguridad', urgency: 'med', title: 'Nuevo procedimiento de visitas — código QR por WhatsApp', body: 'A partir del 20 de marzo, todas las visitas deben acceder con código QR generado por el propietario.', author: 'Administración', when: 'sábado 16:00', stats: { read: 124, total: 142, replies: 7 }, status: 'sent' },
    { tag: 'Eventos', urgency: 'low', title: 'Borrador: torneo de fútbol — fin de semana de Pascua', body: 'Pedimos confirmación de equipos antes del 25 de marzo. Categorías sub-15, libre y veteranos.', author: 'Vos', when: 'borrador', stats: { read: 0, total: 142, replies: 0 }, status: 'draft' },
  ];
  return (
    <div className="page">
      <PageHead
        kicker="Comunidad"
        title="Comunicados"
        sub="Comunicación oficial con propietarios · WhatsApp + email + tablero"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="bookmark" size={13} />Plantillas</button>
            <button className="btn btn-primary"><Icon name="send" size={13} />Nuevo comunicado</button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="tabs" style={{ marginBottom: 4 }}>
            <div className="tab active">Todos <span className="count">24</span></div>
            <div className="tab">Enviados <span className="count">21</span></div>
            <div className="tab">Borradores <span className="count">3</span></div>
            <div className="tab">Programados <span className="count">2</span></div>
          </div>
          {items.map((it, i) => (
            <div key={i} className="card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <Pill tone={it.urgency === 'high' ? 'neg' : it.urgency === 'med' ? 'warn' : 'muted'}>{it.tag}</Pill>
                {it.status === 'draft' && <Pill tone="info">Borrador</Pill>}
                <span className="muted-2" style={{ fontSize: 11, marginLeft: 'auto' }}>{it.when}</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, letterSpacing: '-0.015em' }}>{it.title}</h3>
              <p style={{ color: 'var(--ink-2)', fontSize: 13, marginBottom: 14, maxWidth: 720 }}>{it.body}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, paddingTop: 12, borderTop: '1px solid var(--line-1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar initials="MG" size={20} />
                  <span className="muted" style={{ fontSize: 11.5 }}>{it.author}</span>
                </div>
                {it.status === 'sent' ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="check" size={13} style={{ color: 'var(--pos)' }} />
                      <span className="muted" style={{ fontSize: 11.5 }}>
                        <span className="mono" style={{ color: 'var(--ink-0)' }}>{it.stats.read}/{it.stats.total}</span> leyeron
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="mail" size={13} style={{ color: 'var(--ink-3)' }} />
                      <span className="muted" style={{ fontSize: 11.5 }}>
                        <span className="mono" style={{ color: 'var(--ink-0)' }}>{it.stats.replies}</span> respuestas
                      </span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="bar" style={{ maxWidth: 180, marginLeft: 'auto' }}>
                        <span style={{ width: `${(it.stats.read / it.stats.total) * 100}%` }}></span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost btn-sm">Continuar editando</button>
                    <button className="btn btn-primary btn-sm">Enviar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-h"><h3>Engagement</h3></div>
            <div className="card-body">
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span className="mono" style={{ fontSize: 32, fontFamily: 'var(--ff-display)', fontWeight: 600, color: 'var(--ink-0)' }}>87%</span>
                <span className="text-pos mono" style={{ fontSize: 12 }}>+4 pts</span>
              </div>
              <div className="muted" style={{ fontSize: 11.5, marginBottom: 14 }}>tasa de lectura — últimos 30d</div>
              <Sparkline values={[80, 82, 78, 85, 83, 86, 87]} w={240} h={50} color="var(--acc-1)" />
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Canales</h3></div>
            <div className="card-body" style={{ padding: 12 }}>
              {[
                { name: 'WhatsApp', icon: 'whatsapp', read: '92%', tone: 'pos' },
                { name: 'Email', icon: 'mail', read: '74%', tone: 'warn' },
                { name: 'App / Tablero', icon: 'globe', read: '68%', tone: 'warn' },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px' }}>
                  <Icon name={c.icon} size={15} style={{ color: 'var(--ink-2)' }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-0)' }}>{c.name}</span>
                  <span className="mono" style={{ marginLeft: 'auto', fontSize: 12, color: c.tone === 'pos' ? 'var(--pos)' : 'var(--warn)' }}>{c.read}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Plantillas usadas</h3></div>
            <div className="card-body" style={{ padding: 12 }}>
              {['Corte de servicios', 'Recordatorio de pago', 'Convocatoria asamblea', 'Bienvenida nuevo propietario'].map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 4px', borderBottom: i < 3 ? '1px solid var(--line-1)' : 'none' }}>
                  <Icon name="document" size={13} style={{ color: 'var(--ink-3)' }} />
                  <span style={{ fontSize: 12, color: 'var(--ink-1)' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReclamosScreen = () => {
  const cols = [
    { key: 'nuevo', label: 'Nuevo', count: 3, tone: 'info' },
    { key: 'asignado', label: 'Asignado', count: 2, tone: 'warn' },
    { key: 'progreso', label: 'En progreso', count: 4, tone: 'acc' },
    { key: 'espera', label: 'En espera', count: 1, tone: 'muted' },
    { key: 'resuelto', label: 'Resuelto', count: 2, tone: 'pos' },
  ];
  const cards = {
    nuevo: [
      { id: 'R-241', title: 'Ruido fuerte después de medianoche', cat: 'Convivencia', from: 'L-089 · Lucía Aguirre', when: 'hace 1 h', sla: '23h', priority: 'med' },
      { id: 'R-240', title: 'Bache profundo en calle interna 4', cat: 'Mantenimiento', from: 'L-031 · José Bracco', when: 'hace 3 h', sla: '21h', priority: 'med' },
      { id: 'R-239', title: 'Luminaria fundida en plaza central', cat: 'Mantenimiento', from: 'L-112 · Andrea Rojo', when: 'hace 5 h', sla: '19h', priority: 'low' },
    ],
    asignado: [
      { id: 'R-237', title: 'Tapa de cloaca movida en esquina', cat: 'Mantenimiento', from: 'L-008 · Mauro Lascano', when: 'ayer', sla: 'vencido', priority: 'high', assignee: 'Diego (mant.)' },
      { id: 'R-236', title: 'Cámara de calle 7 sin imagen', cat: 'Seguridad', from: 'Rondín nocturno', when: 'ayer', sla: '4h', priority: 'high', assignee: 'Seguridad SAS' },
    ],
    progreso: [
      { id: 'R-232', title: 'Filtración en techo del SUM', cat: 'Mantenimiento', from: 'Personal', when: '2 días', sla: '−1d', priority: 'high', assignee: 'Limp. Toribio' },
      { id: 'R-231', title: 'Desagote sector A', cat: 'Mantenimiento', from: 'L-044', when: '2 días', sla: 'OK', priority: 'med', assignee: 'Diego (mant.)' },
      { id: 'R-228', title: 'Olor a humedad en gimnasio', cat: 'Mantenimiento', from: 'L-067', when: '3 días', sla: 'OK', priority: 'low', assignee: 'Diego (mant.)' },
      { id: 'R-225', title: 'Reclamo formal por construcción L-093', cat: 'Convivencia', from: 'L-095 · Mariela Toranzos', when: '4 días', sla: 'OK', priority: 'med', assignee: 'Vos' },
    ],
    espera: [
      { id: 'R-220', title: 'Cotización portón nuevo entrada principal', cat: 'Compras', from: 'Consejo', when: 'sem. pasada', sla: '—', priority: 'low', assignee: '3 proveedores' },
    ],
    resuelto: [
      { id: 'R-218', title: 'Robo de bicicleta — informe interno', cat: 'Seguridad', from: 'L-019', when: 'sem. pasada', sla: 'OK', priority: 'high' },
      { id: 'R-215', title: 'Caño roto en cancha de tenis', cat: 'Mantenimiento', from: 'Personal', when: 'sem. pasada', sla: 'OK', priority: 'med' },
    ],
  };

  return (
    <div className="page">
      <PageHead
        kicker="Comunidad"
        title="Reclamos"
        sub="12 abiertos · 3 con SLA en riesgo · tiempo medio de resolución 1.8 días"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="layers" size={13} />Categorías</button>
            <button className="btn btn-secondary"><Icon name="pieChart" size={13} />Reportes</button>
            <button className="btn btn-primary"><Icon name="plus" size={13} />Nuevo reclamo</button>
          </>
        }
      />

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button className="chip active">Vista: Tablero <Icon name="chevDown" size={12} /></button>
        <button className="chip">Mantenimiento <Icon name="x" size={11} /></button>
        <button className="chip">Seguridad <Icon name="x" size={11} /></button>
        <button className="chip">Asignado a cualquiera <Icon name="chevDown" size={12} /></button>
        <button className="chip"><Icon name="filter" size={12} />Más</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, alignItems: 'flex-start' }}>
        {cols.map(col => (
          <div key={col.key} style={{ background: 'var(--bg-2)', border: '1px solid var(--line-1)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid var(--line-1)' }}>
              <Pill tone={col.tone} dot>{col.label}</Pill>
              <span className="mono muted-2" style={{ fontSize: 11 }}>{col.count}</span>
              <button className="icon-btn" style={{ width: 22, height: 22, marginLeft: 'auto' }}><Icon name="plus" size={12} /></button>
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(cards[col.key] || []).map((c, i) => (
                <div key={i} style={{ background: 'var(--bg-1)', border: '1px solid var(--line-1)', borderRadius: 'var(--r-sm)', padding: 11 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                    <span className="mono muted-2" style={{ fontSize: 10.5 }}>{c.id}</span>
                    {c.priority === 'high' && <Icon name="fire" size={12} color="var(--neg)" />}
                  </div>
                  <div style={{ fontSize: 12.5, lineHeight: 1.35, color: 'var(--ink-0)', marginBottom: 8 }}>{c.title}</div>
                  <Pill tone="muted">{c.cat}</Pill>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 9, fontSize: 10.5, color: 'var(--ink-3)' }}>
                    <Icon name="user" size={11} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.from}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--line-1)' }}>
                    <span className="muted-2" style={{ fontSize: 10.5 }}>{c.when}</span>
                    {c.sla && (
                      <span className="mono" style={{ fontSize: 10.5, marginLeft: 'auto', color: c.sla === 'vencido' || c.sla.startsWith('−') ? 'var(--neg)' : c.sla === 'OK' ? 'var(--pos)' : 'var(--warn)' }}>
                        SLA {c.sla}
                      </span>
                    )}
                  </div>
                  {c.assignee && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
                      <Avatar initials={c.assignee.split(' ')[0].slice(0, 2).toUpperCase()} size={18} />
                      <span style={{ fontSize: 10.5, color: 'var(--ink-2)' }}>{c.assignee}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

window.PropietariosScreen = PropietariosScreen;
window.ComunicadosScreen = ComunicadosScreen;
window.ReclamosScreen = ReclamosScreen;
