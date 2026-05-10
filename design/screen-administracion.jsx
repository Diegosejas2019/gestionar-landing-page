// Screen-administracion.jsx — Personal, Proveedores, Soporte, Configuración

const PersonalScreen = () => {
  const staff = [
    { name: 'Diego Maldonado', role: 'Mantenimiento general', dept: 'Técnico', schedule: 'L-V 8-17', status: 'active', tickets: 4, since: '2019' },
    { name: 'Carolina Velazco', role: 'Recepción y administración', dept: 'Administración', schedule: 'L-V 9-18', status: 'active', tickets: 0, since: '2021' },
    { name: 'Ramón Quispe', role: 'Jardinería', dept: 'Espacios verdes', schedule: 'L,X,V 7-13', status: 'active', tickets: 1, since: '2017' },
    { name: 'Pablo Cerruti', role: 'Pileta y mantenimiento', dept: 'Técnico', schedule: 'M,J,S 8-14', status: 'active', tickets: 0, since: '2022' },
    { name: 'Vanesa Lema', role: 'Limpieza áreas comunes', dept: 'Limpieza', schedule: 'L-S 6-12', status: 'leave', tickets: 0, since: '2020', note: 'Vacaciones · vuelve 18/03' },
    { name: 'Hugo Gauna', role: 'Seguridad — turno noche', dept: 'Seguridad', schedule: 'L-V 22-06', status: 'active', tickets: 2, since: '2023' },
    { name: 'Cristian Ferreyra', role: 'Seguridad — turno tarde', dept: 'Seguridad', schedule: 'L-V 14-22', status: 'active', tickets: 0, since: '2024' },
  ];
  return (
    <div className="page">
      <PageHead
        kicker="Administración"
        title="Personal"
        sub="7 colaboradores activos · 1 en licencia · próxima liquidación de sueldos: 28 de marzo"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="calendar" size={13} />Planilla horaria</button>
            <button className="btn btn-secondary"><Icon name="document" size={13} />Liquidación</button>
            <button className="btn btn-primary"><Icon name="plus" size={13} />Alta</button>
          </>
        }
      />

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <FinMetric label="Costo laboral marzo" value="$4.2M" delta="33% del egreso total" tone="info" big />
        <FinMetric label="Asistencia" value="96%" delta="último 30d" tone="pos" />
        <FinMetric label="Horas extra mes" value="32 h" delta="dentro de presupuesto" tone="info" />
        <FinMetric label="Próx. vacaciones" value="2" delta="Lema, Cerruti" tone="warn" />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button className="chip active">Todos los departamentos <Icon name="chevDown" size={12} /></button>
        <button className="chip">Activos · 6</button>
        <button className="chip">En licencia · 1</button>
      </div>

      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Persona</th>
              <th>Departamento</th>
              <th>Turno</th>
              <th>Antigüedad</th>
              <th>Tickets activos</th>
              <th>Estado</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={s.name.split(' ').map(p => p[0]).slice(0, 2).join('')} size={30} />
                    <div>
                      <div className="strong" style={{ fontSize: 12.5 }}>{s.name}</div>
                      <div className="muted-2" style={{ fontSize: 11 }}>{s.role}</div>
                    </div>
                  </div>
                </td>
                <td><Pill tone="muted">{s.dept}</Pill></td>
                <td className="mono" style={{ fontSize: 12 }}>{s.schedule}</td>
                <td className="muted" style={{ fontSize: 12 }}>desde {s.since}</td>
                <td className="mono" style={{ fontSize: 12, color: s.tickets > 0 ? 'var(--ink-0)' : 'var(--ink-3)' }}>
                  {s.tickets > 0 ? s.tickets : '—'}
                </td>
                <td>
                  {s.status === 'active' ? <Pill tone="pos" dot>Activo</Pill> : <Pill tone="warn" dot>{s.note}</Pill>}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="phone" size={13} /></button>
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

const ProveedoresScreen = () => {
  const vendors = [
    { name: 'Limpieza Toribio S.R.L.', cat: 'Limpieza', tags: ['mensual', 'crítico'], rating: 4.8, ytd: 8160000, last: '02 mar', status: 'active', cbu: '0070····3456' },
    { name: 'Seguridad SAS', cat: 'Seguridad', tags: ['24/7', 'contrato'], rating: 4.5, ytd: 18900000, last: '02 mar', status: 'active', cbu: '0150····7821' },
    { name: 'Jardines del Sur', cat: 'Espacios verdes', tags: ['mensual'], rating: 4.2, ytd: 2940000, last: '02 mar', status: 'active', cbu: '0007····9912' },
    { name: 'AquaTec Piletas', cat: 'Pileta', tags: ['estacional'], rating: 4.7, ytd: 980000, last: '15 feb', status: 'active', cbu: '0034····2287' },
    { name: 'Eléctrica Norte', cat: 'Electricidad', tags: ['eventual'], rating: 3.9, ytd: 1240000, last: '08 mar', status: 'review', cbu: '0029····0114' },
    { name: 'Andreani — logística', cat: 'Logística', tags: ['eventual'], rating: 4.4, ytd: 145000, last: 'hoy', status: 'active', cbu: '0072····5559' },
    { name: 'Construcciones MV', cat: 'Construcción', tags: ['proyecto'], rating: 4.0, ytd: 6740000, last: '20 ene', status: 'active', cbu: '0017····8842' },
    { name: 'Pinturas Sur', cat: 'Pintura', tags: ['eventual'], rating: 0, ytd: 0, last: '—', status: 'pending', cbu: 'pendiente' },
  ];

  return (
    <div className="page">
      <PageHead
        kicker="Administración"
        title="Proveedores"
        sub="14 activos · gasto YTD $38.4M · 1 en revisión, 1 alta pendiente"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="document" size={13} />Cotizaciones</button>
            <button className="btn btn-primary"><Icon name="plus" size={13} />Nuevo proveedor</button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        <div className="card">
          <div className="card-h">
            <div>
              <h3>Gasto por categoría · YTD 2025</h3>
              <div className="sub">$38.4M total acumulado</div>
            </div>
          </div>
          <div className="card-body">
            {[
              { name: 'Seguridad', val: 18900000, pct: 49, color: 'var(--acc-1)' },
              { name: 'Limpieza', val: 8160000, pct: 21, color: '#7dd460' },
              { name: 'Construcción', val: 6740000, pct: 18, color: '#5ba843' },
              { name: 'Espacios verdes', val: 2940000, pct: 8, color: 'var(--info)' },
              { name: 'Otros', val: 1660000, pct: 4, color: 'var(--bg-4)' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--line-1)' : 'none' }}>
                <div style={{ width: 110, fontSize: 12, color: 'var(--ink-0)' }}>{c.name}</div>
                <div style={{ flex: 1, height: 8, background: 'var(--bg-3)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${c.pct}%`, height: '100%', background: c.color, borderRadius: 4 }}></div>
                </div>
                <div className="mono" style={{ width: 110, textAlign: 'right', fontSize: 12 }}>${c.val.toLocaleString('es-AR')}</div>
                <div className="mono muted-2" style={{ width: 36, textAlign: 'right', fontSize: 11 }}>{c.pct}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-h"><h3>Vencimientos próximos</h3></div>
          <div className="card-body" style={{ padding: 12 }}>
            {[
              { name: 'Seguridad SAS', what: 'Renovación contrato', when: 'en 12d', tone: 'warn' },
              { name: 'AquaTec Piletas', what: 'Cierre temporada', when: 'en 18d', tone: 'info' },
              { name: 'Limpieza Toribio', what: 'Aumento de tarifa', when: 'en 24d', tone: 'info' },
              { name: 'Eléctrica Norte', what: 'Revisión calidad', when: 'hoy', tone: 'neg' },
            ].map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 4px', borderBottom: i < 3 ? '1px solid var(--line-1)' : 'none' }}>
                <Icon name="clock" size={13} style={{ color: v.tone === 'neg' ? 'var(--neg)' : v.tone === 'warn' ? 'var(--warn)' : 'var(--ink-2)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--ink-0)' }}>{v.name}</div>
                  <div className="muted-2" style={{ fontSize: 11 }}>{v.what}</div>
                </div>
                <Pill tone={v.tone}>{v.when}</Pill>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-h">
          <div><h3>Directorio</h3><div className="sub">14 proveedores · ordenado por gasto YTD</div></div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="chip active">Todos · 14</button>
            <button className="chip">Activos · 12</button>
            <button className="chip">En revisión · 1</button>
            <button className="chip">Pendientes · 1</button>
          </div>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th>Categoría</th>
              <th>Calificación</th>
              <th>CBU</th>
              <th>Último pago</th>
              <th className="num">YTD</th>
              <th>Estado</th>
              <th style={{ width: 30 }}></th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v, i) => (
              <tr key={i}>
                <td>
                  <div className="strong" style={{ fontSize: 12.5 }}>{v.name}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                    {v.tags.map((t, j) => <Pill key={j} tone="muted">{t}</Pill>)}
                  </div>
                </td>
                <td><Pill tone="muted">{v.cat}</Pill></td>
                <td>
                  {v.rating > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="star" size={12} color="var(--warn)" />
                      <span className="mono" style={{ fontSize: 12 }}>{v.rating.toFixed(1)}</span>
                    </div>
                  ) : <span className="muted-2">—</span>}
                </td>
                <td className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>{v.cbu}</td>
                <td className="muted" style={{ fontSize: 12 }}>{v.last}</td>
                <td className="num">${v.ytd.toLocaleString('es-AR')}</td>
                <td>
                  {v.status === 'active' && <Pill tone="pos" dot>Activo</Pill>}
                  {v.status === 'review' && <Pill tone="warn" dot>En revisión</Pill>}
                  {v.status === 'pending' && <Pill tone="info" dot>Alta pendiente</Pill>}
                </td>
                <td><button className="icon-btn" style={{ width: 26, height: 26 }}><Icon name="moreV" size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SoporteScreen = () => {
  const tickets = [
    { id: 'S-094', subject: 'No me llega el QR de visita por WhatsApp', user: 'Sofía Marcucci · L-014', cat: 'Visitas', priority: 'high', age: '42 min', status: 'new', last: 'usuario' },
    { id: 'S-093', subject: 'Quiero pagar con tarjeta de crédito', user: 'Federico Antúnez · L-087', cat: 'Pagos', priority: 'med', age: '2 h', status: 'in-progress', last: 'agente' },
    { id: 'S-092', subject: '¿Cómo cambio mi contraseña?', user: 'Patricia Yacobi · L-094', cat: 'Cuenta', priority: 'low', age: '3 h', status: 'in-progress', last: 'agente' },
    { id: 'S-091', subject: 'Error al descargar liquidación de febrero', user: 'Verónica Salinas · L-056', cat: 'Reportes', priority: 'med', age: '5 h', status: 'waiting', last: 'usuario' },
    { id: 'S-090', subject: 'Problema con la app en Android', user: 'Diego Ramírez · L-022', cat: 'App', priority: 'high', age: '1 d', status: 'waiting', last: 'tech' },
    { id: 'S-089', subject: 'Solicitud de baja de 2do dueño', user: 'Carolina Pereyra · L-042', cat: 'Cuenta', priority: 'low', age: '2 d', status: 'in-progress', last: 'agente' },
  ];
  return (
    <div className="page">
      <PageHead
        kicker="Administración"
        title="Soporte"
        sub="6 tickets abiertos · tiempo promedio de respuesta 23 min · CSAT 4.6"
        actions={
          <>
            <button className="btn btn-secondary"><Icon name="document" size={13} />Base de conocimiento</button>
            <button className="btn btn-primary"><Icon name="plus" size={13} />Crear ticket</button>
          </>
        }
      />

      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <FinMetric label="Tickets abiertos" value="6" delta="−2 vs ayer" tone="pos" />
        <FinMetric label="Tiempo medio respuesta" value="23 min" delta="bajo SLA (1h)" tone="pos" />
        <FinMetric label="Resueltos esta semana" value="38" delta="92% en SLA" tone="pos" />
        <FinMetric label="CSAT" value="4.6/5" delta="basado en 142 respuestas" tone="info" big />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <div className="card">
          <div className="card-h">
            <div><h3>Tickets activos</h3></div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="chip active">Mis asignados · 4</button>
              <button className="chip">Sin asignar · 2</button>
              <button className="chip">Todos · 6</button>
            </div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>ID</th>
                <th>Asunto</th>
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Antigüedad</th>
                <th>Estado</th>
                <th>Último</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t, i) => (
                <tr key={i}>
                  <td className="mono muted-2" style={{ fontSize: 11 }}>{t.id}</td>
                  <td>
                    <div className="strong" style={{ fontSize: 12.5, marginBottom: 2 }}>{t.subject}</div>
                    <div className="muted-2" style={{ fontSize: 11 }}>{t.user}</div>
                  </td>
                  <td><Pill tone="muted">{t.cat}</Pill></td>
                  <td>
                    {t.priority === 'high' && <Pill tone="neg" dot>Alta</Pill>}
                    {t.priority === 'med' && <Pill tone="warn" dot>Media</Pill>}
                    {t.priority === 'low' && <Pill tone="info" dot>Baja</Pill>}
                  </td>
                  <td className="mono" style={{ fontSize: 11.5, color: t.age.includes('d') ? 'var(--neg)' : 'var(--ink-2)' }}>{t.age}</td>
                  <td>
                    {t.status === 'new' && <Pill tone="info">Nuevo</Pill>}
                    {t.status === 'in-progress' && <Pill tone="acc">En curso</Pill>}
                    {t.status === 'waiting' && <Pill tone="warn">Esperando</Pill>}
                  </td>
                  <td className="muted" style={{ fontSize: 11.5 }}>
                    {t.last === 'usuario' ? '👤 usuario' : t.last === 'agente' ? '🛠 agente' : '⚙ sistema'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card">
            <div className="card-h"><h3>Top categorías</h3><span className="muted-2 mono" style={{ fontSize: 11 }}>30d</span></div>
            <div className="card-body" style={{ padding: 12 }}>
              {[
                { name: 'Pagos', count: 84, pct: 38 },
                { name: 'Visitas', count: 62, pct: 28 },
                { name: 'Reportes', count: 34, pct: 15 },
                { name: 'Cuenta', count: 27, pct: 12 },
                { name: 'App', count: 16, pct: 7 },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 4px' }}>
                  <span style={{ flex: 1, fontSize: 12 }}>{c.name}</span>
                  <div style={{ width: 80, height: 5, background: 'var(--bg-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${c.pct * 2}%`, height: '100%', background: 'var(--acc-1)' }}></div>
                  </div>
                  <span className="mono" style={{ fontSize: 11, width: 28, textAlign: 'right' }}>{c.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Equipo</h3></div>
            <div className="card-body" style={{ padding: 12 }}>
              {[
                { name: 'Carolina V.', open: 4, csat: 4.8 },
                { name: 'Vos (Matías)', open: 1, csat: 4.7 },
                { name: 'Fernando A.', open: 1, csat: 4.5 },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: i < 2 ? '1px solid var(--line-1)' : 'none' }}>
                  <Avatar initials={p.name.split(' ').map(s => s[0]).slice(0, 2).join('')} size={26} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-0)' }}>{p.name}</div>
                    <div className="muted-2" style={{ fontSize: 10.5 }}>CSAT {p.csat}</div>
                  </div>
                  <Pill tone="muted">{p.open} abiertos</Pill>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigScreen = () => {
  return (
    <div className="page">
      <PageHead
        kicker="Administración"
        title="Configuración"
        sub="EDEN 6 · ajustes generales del consorcio"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            { id: 'general', label: 'General', icon: 'building', active: true },
            { id: 'expensas', label: 'Expensas y multas', icon: 'wallet' },
            { id: 'roles', label: 'Roles y permisos', icon: 'shield' },
            { id: 'integraciones', label: 'Integraciones', icon: 'link' },
            { id: 'notificaciones', label: 'Notificaciones', icon: 'bell' },
            { id: 'amenities', label: 'Amenities y reglas', icon: 'calendar' },
            { id: 'plantillas', label: 'Plantillas y documentos', icon: 'document' },
            { id: 'auditoria', label: 'Auditoría', icon: 'key' },
            { id: 'plan', label: 'Plan y facturación', icon: 'package' },
          ].map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px',
              borderRadius: 'var(--r-sm)',
              background: item.active ? 'var(--bg-3)' : 'transparent',
              color: item.active ? 'var(--ink-0)' : 'var(--ink-1)',
              fontWeight: item.active ? 500 : 400,
              fontSize: 12.5,
              cursor: 'pointer',
            }}>
              <Icon name={item.icon} size={15} style={{ color: item.active ? 'var(--acc-1)' : 'var(--ink-3)' }} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-h"><h3>Identidad del consorcio</h3></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <ConfigField label="Razón social" value="Consorcio EDEN 6 — Country Norte S.A." />
              <ConfigField label="CUIT" value="30-71284103-5" mono />
              <ConfigField label="Domicilio fiscal" value="Av. del Lago 8800, Pilar" />
              <ConfigField label="Teléfono" value="+54 2304 487-291" mono />
              <ConfigField label="Email administración" value="admin@eden6.com.ar" />
              <ConfigField label="Sitio web" value="eden6.com.ar" />
              <div style={{ gridColumn: 'span 2' }}>
                <ConfigField label="Logo institucional" custom={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div className="org-logo" style={{ width: 56, height: 56, borderRadius: 12, fontSize: 18 }}>E6</div>
                    <button className="btn btn-secondary btn-sm"><Icon name="upload" size={12} />Reemplazar</button>
                    <span className="muted-2" style={{ fontSize: 11 }}>PNG/SVG · máx. 1 MB</span>
                  </div>
                } />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div><h3>Integraciones activas</h3><div className="sub">3 de 8 conectadas</div></div>
              <button className="btn btn-ghost btn-sm">Ver todas <Icon name="chev" size={12} /></button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {[
                { name: 'Mercado Pago', desc: 'Cobro digital de expensas — link de pago + débito automático', icon: 'wallet', status: 'on', acc: 'cuenta verificada' },
                { name: 'Banco Galicia', desc: 'Conciliación bancaria automática — extractos diarios', icon: 'building', status: 'on', acc: 'CBU ····1842' },
                { name: 'WhatsApp Business API', desc: 'Comunicados, recordatorios de pago, QR de visitas', icon: 'whatsapp', status: 'on', acc: '+54 9 11 6082-····' },
                { name: 'AFIP — facturación', desc: 'Emitir factura C automática por expensas pagas', icon: 'document', status: 'off' },
                { name: 'Modo', desc: 'Cobro con QR interoperable', icon: 'wallet', status: 'off' },
              ].map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderBottom: i < 4 ? '1px solid var(--line-1)' : 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-3)', display: 'grid', placeItems: 'center', color: it.status === 'on' ? 'var(--acc-1)' : 'var(--ink-2)' }}>
                    <Icon name={it.icon} size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-0)' }}>{it.name}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{it.desc}</div>
                    {it.acc && <div className="mono muted-2" style={{ fontSize: 10.5, marginTop: 3 }}>{it.acc}</div>}
                  </div>
                  {it.status === 'on'
                    ? <Pill tone="pos" dot>Conectada</Pill>
                    : <button className="btn btn-secondary btn-sm">Conectar</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-h"><h3>Roles y permisos</h3></div>
            <div className="card-body" style={{ padding: 0 }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Rol</th>
                    <th>Personas</th>
                    <th>Finanzas</th>
                    <th>Comunidad</th>
                    <th>Operaciones</th>
                    <th>Configuración</th>
                    <th style={{ width: 60 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { role: 'Administrador', count: 2, perms: ['full', 'full', 'full', 'full'] },
                    { role: 'Consejo', count: 5, perms: ['view', 'view', 'edit', 'view'] },
                    { role: 'Personal', count: 7, perms: ['none', 'edit', 'edit', 'none'] },
                    { role: 'Propietario', count: 142, perms: ['view-self', 'view', 'edit-self', 'none'] },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td className="strong" style={{ fontSize: 12.5 }}>{r.role}</td>
                      <td className="mono">{r.count}</td>
                      {r.perms.map((p, j) => (
                        <td key={j}>
                          <Pill tone={p === 'full' ? 'acc' : p === 'edit' || p === 'edit-self' ? 'pos' : p === 'view' || p === 'view-self' ? 'info' : 'muted'}>
                            {p === 'full' ? 'Total' : p === 'edit' ? 'Editar' : p === 'edit-self' ? 'Propio' : p === 'view' ? 'Ver' : p === 'view-self' ? 'Ver propio' : 'Sin acceso'}
                          </Pill>
                        </td>
                      ))}
                      <td><button className="btn btn-ghost btn-sm">Editar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-h">
              <div><h3>Plan</h3><div className="sub">GestionAr Pro · próximo cargo 28 de marzo</div></div>
              <button className="btn btn-secondary btn-sm">Cambiar plan</button>
            </div>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--acc-soft)', color: 'var(--acc-1)', display: 'grid', placeItems: 'center' }}>
                <Icon name="package" size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>GestionAr Pro · 142 lotes</div>
                <div className="muted" style={{ fontSize: 12 }}>Incluye: pagos digitales, WhatsApp, conciliación bancaria, votaciones, AFIP, soporte prioritario</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>$184.500</div>
                <div className="muted-2" style={{ fontSize: 11 }}>/ mes · IVA inc.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfigField = ({ label, value, mono, custom }) => (
  <div>
    <div className="muted-2" style={{ fontSize: 11, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
    {custom || (
      <div style={{
        background: 'var(--bg-1)',
        border: '1px solid var(--line-1)',
        borderRadius: 'var(--r-sm)',
        padding: '8px 10px',
        fontSize: 12.5,
        color: 'var(--ink-0)',
        fontFamily: mono ? 'var(--ff-mono)' : 'inherit',
      }}>{value}</div>
    )}
  </div>
);

window.PersonalScreen = PersonalScreen;
window.ProveedoresScreen = ProveedoresScreen;
window.SoporteScreen = SoporteScreen;
window.ConfigScreen = ConfigScreen;
