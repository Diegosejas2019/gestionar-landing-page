import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  Check,
  Clock,
  CreditCard,
  FileText,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Phone,
  Settings2,
  Smartphone,
} from 'lucide-react';

const CONTACT_EMAIL = 'gestionar.app.info@gmail.com';
const CONTACT_PHONE = '+54 11 5579-3722';
const CONTACT_PHONE_HREF = 'tel:+541155793722';

const problems = [
  {
    icon: MessageCircle,
    title: 'Consultas dispersas en WhatsApp',
    text: '"¿Cuánto debo?", "¿Llegó mi pago?", "¿Cuándo es la reunión?". Las mismas preguntas, en distintos chats, todos los días.',
  },
  {
    icon: FileText,
    title: 'Comprobantes repartidos',
    text: 'Recibos en el mail, facturas en una carpeta, transferencias en una planilla. Encontrar algo lleva demasiado tiempo.',
  },
  {
    icon: AlertCircle,
    title: 'Reclamos sin seguimiento',
    text: 'Llega un reclamo, se contesta y después se pierde. Nadie sabe en qué quedó ni quién lo está resolviendo.',
  },
  {
    icon: CreditCard,
    title: 'Cobranza poco visible',
    text: 'No sabés en tiempo real cuánto se cobró, quién pagó ni cuánto falta. Para verlo, hay que armar otro Excel.',
  },
  {
    icon: Bell,
    title: 'Avisos que no llegan',
    text: 'Comunicados pegados en el ascensor, mails que terminan en spam y propietarios que se enteran tarde.',
  },
  {
    icon: LayoutDashboard,
    title: 'Sin visibilidad para crecer',
    text: 'Querés sumar consorcios, pero con lo que tenés hoy la operación ya se siente desordenada.',
  },
];

const features = [
  {
    className: 'cell cell-hero',
    tag: 'DASHBOARD',
    title: 'Panel para administradores',
    text: 'Una vista en vivo de cobranzas, morosidad y actividad de todos los consorcios. Filtrá, compará y decidí con datos reales.',
    visual: (
      <div className="cell-viz">
        <div className="viz-card">
          <div className="vl">Cobrado este mes</div>
          <div className="vv">$ 18.4M</div>
          <div className="viz-bars-row">
            {[40, 65, 55, 80, 70, 90, 78, 95].map((height, index) => (
              <div key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
        <div className="viz-card">
          <div className="vl">Morosidad</div>
          <div className="vv">6,2%</div>
          <div className="viz-bars-row warn">
            {[65, 58, 50, 45, 38, 32, 28, 22].map((height, index) => (
              <div key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    className: 'cell cell-tall',
    tag: 'APP PROPIETARIOS',
    title: 'Una app clara para tus propietarios',
    text: 'Acceden a expensas, deuda, pagos, reclamos, avisos y documentos desde el celular.',
    visual: <PhoneMockup />,
  },
  {
    className: 'cell cell-half',
    tag: 'EXPENSAS & PAGOS',
    title: 'Liquidá expensas y registrá pagos',
    text: 'Cargá períodos, generá expensas por unidad, registrá pagos manuales o automáticos, emití recibos.',
    visual: (
      <div className="ticket-list">
        <div className="ticket-row"><span className="ticket-status done" /><span className="t">Período Abr 2026 · emitido</span><span className="meta">312/312</span></div>
        <div className="ticket-row"><span className="ticket-status progress" /><span className="t">Cobranzas en curso</span><span className="meta">94%</span></div>
      </div>
    ),
  },
  {
    className: 'cell cell-half',
    tag: 'RECLAMOS',
    title: 'Reclamos con estado y responsable',
    text: 'Cada reclamo queda registrado, se asigna y se sigue desde un solo lugar. Nada se pierde.',
    visual: (
      <div className="ticket-list">
        <div className="ticket-row"><span className="ticket-status open" /><span className="t">Pérdida de agua · 5°B</span><span className="meta">PENDIENTE</span></div>
        <div className="ticket-row"><span className="ticket-status progress" /><span className="t">Luz de palier · PB</span><span className="meta">EN CURSO</span></div>
        <div className="ticket-row"><span className="ticket-status done" /><span className="t">Cerradura puerta SUM</span><span className="meta">RESUELTO</span></div>
      </div>
    ),
  },
  {
    className: 'cell cell-third',
    tag: 'AVISOS',
    title: 'Comunicados al instante',
    text: 'Llegan a la app y por mail. Confirmás quién los vio.',
    visual: (
      <div className="notice-stack">
        <div className="notice-row"><span>Corte de agua · martes</span><span className="nl">312/312</span></div>
        <div className="notice-row"><span>Asamblea ordinaria</span><span className="nl">298/312</span></div>
      </div>
    ),
  },
  {
    className: 'cell cell-third',
    tag: 'DOCUMENTOS',
    title: 'Toda la documentación a un clic',
    text: 'Reglamento, liquidaciones, actas, contratos. Siempre disponible.',
    visual: (
      <div className="docs-row">
        {['Liquid. Abr 26', 'Reglamento', 'Acta Mar'].map((doc) => (
          <div className="doc-chip" key={doc}><FileText size={12} />{doc}</div>
        ))}
      </div>
    ),
  },
  {
    className: 'cell cell-third',
    tag: 'EXTRAS',
    title: 'Reservas, visitas y permisos',
    text: 'Espacios comunes, registro de visitas y permisos por módulo si aplica a tu barrio.',
    visual: (
      <div className="module-pills">
        <span className="pill on">Reservas</span>
        <span className="pill on">Visitas</span>
        <span className="pill on">Roles</span>
      </div>
    ),
  },
];

const benefits = [
  {
    tag: 'PARA TU ADMINISTRACIÓN',
    title: 'Operá más consorcios sin desorden.',
    text: 'Centralizá la información, automatizá lo repetitivo y ganá tiempo del equipo.',
    items: [
      ['Menos consultas repetidas', 'Los propietarios encuentran solos su deuda, recibos y avisos.'],
      ['Información centralizada', 'Una fuente única para cobranzas, reclamos, avisos y documentación.'],
      ['Dashboards de actividad y morosidad', 'Sabés en tiempo real qué pasa en cada consorcio.'],
      ['Operación más profesional', 'Imagen moderna y trazabilidad de cada acción del equipo.'],
      ['Escalabilidad real', 'Sumás consorcios sin sumar caos ni gente extra.'],
    ],
  },
  {
    tag: 'PARA LOS PROPIETARIOS',
    title: 'Una experiencia clara y moderna.',
    text: 'Todo lo que un propietario necesita, a un toque desde el celular.',
    items: [
      ['Ver deuda, pagos y comprobantes', 'Desde la app, sin tener que escribir al administrador.'],
      ['Recibir avisos importantes', 'Notificaciones de cortes, asambleas y novedades del consorcio.'],
      ['Crear reclamos con seguimiento', 'Saben siempre en qué estado está su pedido.'],
      ['Acceso a documentos del consorcio', 'Reglamento, actas, liquidaciones, siempre a mano.'],
      ['Reservar espacios comunes', 'SUM, parrilla o cocheras, según lo que tenga el consorcio.'],
    ],
  },
];

const steps = [
  {
    n: 1,
    title: 'Configuramos tu organización',
    desc: 'Damos de alta tu administración, usuarios del equipo y permisos por consorcio.',
    label: 'PASO 01 · ORGANIZACIÓN',
    panelTitle: 'Configuración inicial',
    rows: [['Datos de la administración', '✓'], ['Usuarios del equipo', '4 ALTAS'], ['Roles y permisos', '✓'], ['Logo y dominio propio', '✓']],
  },
  {
    n: 2,
    title: 'Cargamos unidades y propietarios',
    desc: 'Importamos el padrón desde Excel o tu sistema actual. Sin retipear nada.',
    label: 'PASO 02 · IMPORTACIÓN',
    panelTitle: 'Carga de datos',
    rows: [['Consorcios cargados', '12 / 12'], ['Unidades / lotes', '1.847'], ['Padrón de propietarios', '✓'], ['Saldos iniciales', '✓']],
  },
  {
    n: 3,
    title: 'Activamos los módulos que necesitás',
    desc: 'Expensas, reclamos, avisos, reservas, visitas. Sumás más cuando quieras.',
    label: 'PASO 03 · MÓDULOS',
    panelTitle: 'Activación funcional',
    rows: [['Expensas y pagos', '✓'], ['Reclamos', '✓'], ['Avisos y comunicados', '✓'], ['Reservas', 'OPCIONAL']],
  },
  {
    n: 4,
    title: 'Los propietarios ingresan a la app',
    desc: 'Reciben invitación, descargan la app y acceden a sus expensas y avisos.',
    label: 'PASO 04 · PROPIETARIOS',
    panelTitle: 'Acceso a la app',
    rows: [['Invitaciones enviadas', '1.847'], ['Activaciones', '1.612'], ['PWA / iOS / Android', '✓'], ['Soporte de onboarding', '✓']],
  },
  {
    n: 5,
    title: 'Operás todo desde tu panel',
    desc: 'Tu equipo gestiona, los propietarios consultan, GestionAr conecta a ambos.',
    label: 'PASO 05 · OPERACIÓN',
    panelTitle: 'Día a día en GestionAr',
    rows: [['Liquidación mensual', '✓'], ['Cobranzas en tiempo real', '✓'], ['Reclamos con seguimiento', '✓'], ['Soporte continuo', '✓']],
  },
];

const faqs = [
  ['¿GestionAr reemplaza a mi sistema actual?', 'GestionAr es la herramienta de gestión operativa de tu administración: expensas, pagos, reclamos, avisos, documentación, propietarios y reservas. Si hoy usás Excel, WhatsApp y mails, los reemplaza todos. Si tenés un sistema contable, convivimos: importamos datos y te ahorramos la doble carga.'],
  ['¿Puedo usarlo para varios consorcios al mismo tiempo?', 'Sí. GestionAr está pensada para administraciones que gestionan múltiples consorcios, barrios privados, countries o clubes de campo. Cada uno tiene su panel propio, y vos ves todo consolidado desde tu organización.'],
  ['¿Los propietarios tienen acceso a la app?', 'Sí. Cada propietario accede con su mail o DNI y ve su deuda, pagos, recibos, reclamos, avisos y documentos. Para tu equipo significa menos consultas repetidas; para el propietario, una experiencia clara y moderna.'],
  ['¿Se puede configurar por organización?', 'Sí. Definís roles y permisos por usuario, por consorcio y por módulo. Por ejemplo: tu equipo de cobranzas ve cobranzas de todos los consorcios, y un encargado solo ve reclamos del suyo.'],
  ['¿Puedo activar solo algunos módulos?', 'Sí. Arrancás con expensas, avisos y reclamos, y sumás reservas, visitas u otros módulos cuando lo necesites. No pagás por funcionalidades que no usás.'],
  ['¿La app funciona como PWA?', 'Sí. GestionAr funciona como Progressive Web App: tus propietarios la instalan desde el navegador en iOS y Android sin pasar por la store, y reciben notificaciones igual que una app nativa.'],
  ['¿Cómo se importan los datos iniciales?', 'Te pedimos un Excel con el padrón de unidades, propietarios y saldos. Nosotros lo cargamos por vos durante el onboarding. Si venís de otro sistema, evaluamos una migración asistida.'],
  ['¿Puedo solicitar una demo personalizada?', 'Sí. Coordinamos una demo de 30 minutos con alguien de nuestro equipo, donde recorremos los módulos clave y vemos cómo aplicaría a tu administración. Sin compromiso.'],
];

export function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const processRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!processRef.current?.matches(':hover')) {
        setActiveStep((current) => (current % steps.length) + 1);
      }
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a href="#" className="logo" aria-label="GestionAr">
          <span className="logo-mark" />
          Gestion<span className="ar">Ar</span>
        </a>
        <ul className="nav-links">
          <li><a href="#funcionalidades">Funcionalidades</a></li>
          <li><a href="#beneficios">Beneficios</a></li>
          <li><a href="#como-funciona">Cómo funciona</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="nav-cta">
          <a href="/login" className="nav-login">Ingresar</a>
          <a href="#contacto" className="btn btn-primary">Solicitar demo <span className="arrow">→</span></a>
        </div>
      </nav>

      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow"><span className="dot" /> SOFTWARE PARA ADMINISTRACIONES · ARGENTINA</div>
            <h1 className="display">
              La plataforma para administrar consorcios de forma <span className="accent">simple, clara y digital</span>.
            </h1>
            <p className="lead">
              GestionAr es la app que tu administración necesita para ordenar expensas, cobranzas, reclamos, avisos y documentación. Una sola herramienta para vos y tus propietarios.
            </p>
            <div className="hero-cta">
              <a href="#contacto" className="btn btn-primary btn-lg">Solicitar demo <span className="arrow">→</span></a>
              <a href="#funcionalidades" className="btn btn-ghost btn-lg">Ver funcionalidades</a>
            </div>
            <div className="hero-bullets">
              {['Multiconsorcio', 'App para propietarios', 'Implementación guiada'].map((item) => (
                <span key={item}><Check size={14} />{item}</span>
              ))}
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="panel panel-main">
              <div className="panel-head">
                <div className="panel-org">
                  <div className="org-mark">G</div>
                  <div>
                    <div className="org-name">Estudio Méndez · Admin.</div>
                    <div className="org-sub">12 CONSORCIOS · 1.847 UNIDADES</div>
                  </div>
                </div>
                <div className="panel-tabs"><span className="active">Mes</span><span>Trim.</span><span>Año</span></div>
              </div>
              <div className="panel-stats">
                <div className="stat-card"><div className="label">Cobrado</div><div className="val">94%</div><div className="delta">↑ 3.1</div></div>
                <div className="stat-card warn"><div className="label">Morosidad</div><div className="val">6%</div><div className="delta">↓ 1.2</div></div>
                <div className="stat-card"><div className="label">Reclamos</div><div className="val">18</div><div className="delta">↓ 24%</div></div>
              </div>
              <div className="panel-chart">
                <div className="chart-head">
                  <div className="t">Cobranzas por consorcio</div>
                  <div className="chart-legend">
                    <span><span className="sw" style={{ background: '#9cf27b' }} />Cobrado</span>
                    <span><span className="sw" style={{ background: '#3a5a48' }} />Emitido</span>
                  </div>
                </div>
                <svg className="chart-svg" viewBox="0 0 280 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="home-grad-in" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#9cf27b" stopOpacity="0.45" />
                      <stop offset="1" stopColor="#9cf27b" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,70 L40,55 L80,62 L120,40 L160,48 L200,28 L240,35 L280,20 L280,100 L0,100 Z" fill="url(#home-grad-in)" />
                  <path d="M0,70 L40,55 L80,62 L120,40 L160,48 L200,28 L240,35 L280,20" fill="none" stroke="#9cf27b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M0,82 L40,78 L80,80 L120,72 L160,76 L200,70 L240,68 L280,64" fill="none" stroke="#3a5a48" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="panel panel-toast">
              <div className="toast-icon"><Bell size={14} /></div>
              <div><div className="t">Aviso enviado · 312 propietarios</div><div className="s">CONSORCIO LAS ACACIAS</div></div>
            </div>
            <div className="panel panel-floater">
              <div className="float-head">
                <div className="float-icon"><CreditCard size={18} /></div>
                <div><div className="float-title">Pagos del día</div><div className="float-sub">CONFIRMADOS AUTOMÁTICAMENTE</div></div>
              </div>
              <div className="float-list">
                <div className="float-item"><span className="name">Unidad 4B · Pérez</span><span className="amt">$ 142.300</span></div>
                <div className="float-item"><span className="name">Unidad 12A · Morales</span><span className="amt">$ 142.300</span></div>
                <div className="float-item due"><span className="name">Unidad 7C · Sosa</span><span className="amt">vence hoy</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="problema">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow"><span className="dot" /> EL DÍA A DÍA SIN GESTIONAR</div>
            <h2>Una administración ordenada no debería depender de <span className="accent">grupos de WhatsApp</span>.</h2>
            <p>Si tu equipo sigue contestando las mismas consultas, perdiendo comprobantes en mails o sin saber cuánta deuda hay este mes, no es problema tuyo: es problema de las herramientas.</p>
          </div>
          <div className="problems-grid reveal">
            {problems.map(({ icon: Icon, title, text }) => (
              <div className="problem" key={title}>
                <div className="problem-icon"><Icon size={18} /></div>
                <div><h4>{title}</h4><p>{text}</p></div>
              </div>
            ))}
          </div>
          <div className="solution-callout reveal">
            <div className="ico"><Settings2 size={26} /></div>
            <div>
              <h3>GestionAr centraliza la operación diaria</h3>
              <p>Una sola plataforma para que tu administración trabaje ordenada y los propietarios tengan un canal claro para pagos, reclamos, avisos y documentos.</p>
            </div>
            <a href="#contacto" className="btn btn-primary">Solicitar demo <span className="arrow">→</span></a>
          </div>
        </div>
      </section>

      <section className="section" id="funcionalidades" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow"><span className="dot" /> FUNCIONALIDADES</div>
            <h2>Todos los módulos que una administración necesita, <span className="accent">en una sola app</span>.</h2>
            <p>Activá lo que te sirve hoy y sumá módulos a medida que crece la operación. Permisos por organización, por consorcio y por usuario.</p>
          </div>
          <div className="bento product-bento reveal">
            {features.map((feature) => (
              <div className={feature.className} key={feature.title}>
                <div><span className="tag">{feature.tag}</span><h3>{feature.title}</h3><p>{feature.text}</p></div>
                {feature.visual}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="beneficios" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow"><span className="dot" /> BENEFICIOS</div>
            <h2>Una herramienta que <span className="accent">potencia</span> el trabajo de la administración.</h2>
            <p>GestionAr no reemplaza al administrador: lo libera de las tareas repetitivas para que su equipo se enfoque en lo importante.</p>
          </div>
          <div className="audiences reveal">
            {benefits.map((group) => (
              <div className="audience" key={group.tag}>
                <span className="role-tag">{group.tag}</span>
                <h3>{group.title}</h3>
                <p className="sub">{group.text}</p>
                <ul className="benefit-list">
                  {group.items.map(([title, text]) => (
                    <li key={title}>
                      <span className="bi"><Check size={12} /></span>
                      <div>{title}<div className="bd">{text}</div></div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="como-funciona" style={{ paddingTop: 0 }} ref={processRef}>
        <div className="container">
          <div className="how reveal">
            <div className="how-grid">
              <div>
                <div className="eyebrow"><span className="dot" /> CÓMO FUNCIONA</div>
                <h2 className="how-title">Implementación guiada, en menos de lo que pensás.</h2>
                <div className="steps-list">
                  {steps.map((step) => (
                    <button
                      type="button"
                      key={step.n}
                      className={`step${activeStep === step.n ? ' active' : ''}`}
                      onClick={() => setActiveStep(step.n)}
                    >
                      <div className="step-num">{String(step.n).padStart(2, '0')}</div>
                      <div className="step-body"><h4>{step.title}</h4><p>{step.desc}</p></div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="how-visual">
                {steps.map((step) => (
                  <div className={`pv${activeStep === step.n ? ' active' : ''}`} key={step.n}>
                    <div className="pv-label">{step.label}</div>
                    <div className="pv-title">{step.panelTitle}</div>
                    <div className="pv-mock">
                      {step.rows.map(([label, value]) => (
                        <div className="pv-row" key={label}>
                          <span className="c1">{label}</span>
                          <span className={value === '✓' ? 'check' : value === 'OPCIONAL' ? 'pending' : 'c2'}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="faq" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow"><span className="dot" /> PREGUNTAS FRECUENTES</div>
            <h2>Lo que toda administración pregunta antes de empezar.</h2>
          </div>
          <div className="faq-grid reveal">
            {faqs.map(([question, answer]) => (
              <details className="faq" key={question}>
                <summary>{question}</summary>
                <div className="ans">{answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="contacto" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="contact reveal">
            <div className="contact-grid">
              <div>
                <div className="eyebrow"><span className="dot" /> HABLEMOS</div>
                <h2>Solicitá tu demo y te mostramos GestionAr funcionando en vivo.</h2>
                <p className="lead">Contanos cuántos consorcios y unidades manejás y te armamos una propuesta a medida en menos de 48 h.</p>
                <div className="contact-items">
                  <a className="contact-item" href={CONTACT_PHONE_HREF}>
                    <div className="i"><Phone size={16} /></div>
                    <div><div className="lb">Teléfono</div><div className="v">{CONTACT_PHONE}</div></div>
                  </a>
                  <a className="contact-item" href={`mailto:${CONTACT_EMAIL}`}>
                    <div className="i"><Mail size={16} /></div>
                    <div><div className="lb">Email</div><div className="v">{CONTACT_EMAIL}</div></div>
                  </a>
                  <div className="contact-item">
                    <div className="i"><Clock size={16} /></div>
                    <div><div className="lb">Respuesta</div><div className="v">Menos de 48 h hábiles</div></div>
                  </div>
                </div>
              </div>

              <form className={`form${submitted ? ' submitted' : ''}`} onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
                <div className="form-content">
                  <div className="form-row">
                    <div className="field"><label htmlFor="nombre">Nombre</label><input type="text" id="nombre" required placeholder="Tu nombre" /></div>
                    <div className="field"><label htmlFor="admin">Administración</label><input type="text" id="admin" required placeholder="Nombre del estudio o administración" /></div>
                  </div>
                  <div className="form-row">
                    <div className="field"><label htmlFor="email">Email</label><input type="email" id="email" required placeholder="vos@administracion.com" /></div>
                    <div className="field"><label htmlFor="tel">Teléfono</label><input type="tel" id="tel" required placeholder="+54 9 11 ..." /></div>
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="consorcios">Consorcios aprox.</label>
                      <select id="consorcios" required defaultValue="">
                        <option value="" disabled>Seleccionar...</option>
                        <option>1 - 3</option>
                        <option>4 - 10</option>
                        <option>11 - 30</option>
                        <option>Más de 30</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="unidades">Unidades / lotes aprox.</label>
                      <select id="unidades" required defaultValue="">
                        <option value="" disabled>Seleccionar...</option>
                        <option>Hasta 200</option>
                        <option>200 - 600</option>
                        <option>600 - 2.000</option>
                        <option>Más de 2.000</option>
                      </select>
                    </div>
                  </div>
                  <div className="field"><label htmlFor="msg">Mensaje</label><textarea id="msg" placeholder="Contanos brevemente qué módulos te interesan o qué dolor querés resolver..." /></div>
                  <button type="submit" className="btn btn-primary btn-lg">Solicitar demo <span className="arrow">→</span></button>
                </div>
                <div className="form-ok">✓ ¡Recibimos tu solicitud! Te contactamos en menos de 48 h hábiles.</div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="logo"><span className="logo-mark" /> Gestion<span className="ar">Ar</span></a>
              <p>Plataforma SaaS para que administraciones de consorcios, barrios privados y countries digitalicen su operación diaria.</p>
            </div>
            <div className="footer-col">
              <h5>Producto</h5>
              <ul>
                <li><a href="#funcionalidades">Funcionalidades</a></li>
                <li><a href="#beneficios">Beneficios</a></li>
                <li><a href="#como-funciona">Cómo funciona</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Recursos</h5>
              <ul>
                <li><a href="#faq">Preguntas frecuentes</a></li>
                <li><a href="#problema">Casos de uso</a></li>
                <li><a href="#contacto">Solicitar demo</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Contacto</h5>
              <ul>
                <li><a href="#contacto">Solicitar demo</a></li>
                <li><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
                <li><a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2026 GESTIONAR · SOFTWARE PARA ADMINISTRACIONES</div>
            <div>HECHO EN BUENOS AIRES</div>
          </div>
        </div>
      </footer>
    </>
  );
}

function PhoneMockup() {
  return (
    <div className="phone-mock" aria-hidden="true">
      <Smartphone size={20} className="phone-icon" />
      <div className="phone-card phone-balance">
        <span>Saldo actual</span>
        <strong>$ 142.300</strong>
        <small>Vence el 10/05</small>
      </div>
      <div className="phone-grid">
        <div><span>Pagos</span><strong>3</strong></div>
        <div><span>Avisos</span><strong>8</strong></div>
      </div>
      <div className="phone-row"><span className="dot" /> Reclamo actualizado</div>
    </div>
  );
}
