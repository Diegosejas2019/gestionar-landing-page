import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  MessageSquare,
  ShieldCheck,
  Users
} from 'lucide-react';

const modules = [
  { icon: Users, title: 'Propietarios', text: 'Alta, unidades, datos de contacto y saldos centralizados.' },
  { icon: CreditCard, title: 'Pagos y expensas', text: 'Cobros mensuales, comprobantes, recibos y seguimiento de mora.' },
  { icon: FileText, title: 'Gastos', text: 'Control de gastos ordinarios y extraordinarios por organizacion.' },
  { icon: MessageSquare, title: 'Reclamos', text: 'Seguimiento claro de solicitudes, estados y respuestas.' },
  { icon: Bell, title: 'Avisos', text: 'Comunicacion directa con propietarios desde un solo panel.' },
  { icon: ClipboardList, title: 'Modulos opcionales', text: 'Reservas, visitas y votaciones disponibles segun configuracion.' }
];

const benefits = [
  'Menos trabajo administrativo',
  'Mayor transparencia para propietarios',
  'Control de morosidad',
  'Informacion centralizada',
  'Acceso desde cualquier dispositivo',
  'Comunicacion mas ordenada'
];

export function HomePage() {
  return (
    <main className="site-shell">
      <Header />

      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Gestionar para consorcios y barrios privados</span>
            <h1>Administra propietarios, pagos y reclamos desde un solo lugar.</h1>
            <p>
              Una plataforma simple para digitalizar expensas, comunicacion y gestion diaria
              sin perder el trato humano que necesita cada administracion.
            </p>
            <div className="hero-actions">
              <a className="btn primary" href="#contacto">
                Solicitar demo <ArrowRight size={18} />
              </a>
              <a className="btn ghost" href="/login">Ingresar</a>
            </div>
          </div>

          <div className="dashboard-mockup" aria-label="Vista previa del dashboard">
            <div className="mockup-top">
              <span />
              <span />
              <span />
            </div>
            <div className="mockup-content">
              <div className="metric strong">
                <small>Recaudado abril</small>
                <b>$ 8.420.000</b>
              </div>
              <div className="metric">
                <small>Morosidad</small>
                <b>12%</b>
              </div>
              <div className="chart">
                <i style={{ height: '42%' }} />
                <i style={{ height: '58%' }} />
                <i style={{ height: '48%' }} />
                <i style={{ height: '72%' }} />
                <i style={{ height: '86%' }} />
                <i style={{ height: '64%' }} />
              </div>
              <div className="activity">
                <span><CheckCircle2 size={16} /> Pago aprobado - Lote 18</span>
                <span><MessageSquare size={16} /> Reclamo en progreso</span>
                <span><Bell size={16} /> Aviso enviado a propietarios</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="funcionalidades">
        <div className="container split">
          <div>
            <span className="eyebrow">Problema</span>
            <h2>La administracion manual vuelve dificil saber que pasa.</h2>
          </div>
          <p>
            Cobros desordenados, reclamos por WhatsApp, comprobantes dispersos y vecinos sin
            visibilidad generan mas trabajo y menos confianza. Gestionar ordena esa operacion
            en una experiencia clara para administradores y propietarios.
          </p>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow">Modulos</span>
            <h2>Todo lo importante del consorcio en una misma plataforma.</h2>
          </div>
          <div className="module-grid">
            {modules.map((item) => (
              <article className="feature-card" key={item.title}>
                <item.icon size={24} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="precios">
        <div className="container benefits-grid">
          <div>
            <span className="eyebrow">Beneficios</span>
            <h2>Mas control, menos trabajo manual.</h2>
            <p>
              La landing queda preparada para conectar formularios, login y panel admin con la
              API existente, sin duplicar contratos ni hardcodear URLs productivas.
            </p>
          </div>
          <div className="benefit-list">
            {benefits.map((benefit) => (
              <span key={benefit}><CheckCircle2 size={18} /> {benefit}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="final-cta" id="contacto">
        <div className="container cta-card">
          <Building2 size={34} />
          <h2>Digitaliza la administracion de tu consorcio.</h2>
          <p>Contanos sobre tu organizacion y armamos una demo orientada a tu operacion real.</p>
          <a className="btn primary light" href="mailto:contacto@gestionar.com">Solicitar demo</a>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <strong>Gestionar</strong>
          <span>Software para administracion de consorcios.</span>
        </div>
      </footer>
    </main>
  );
}

function Header() {
  return (
    <header className="header">
      <a className="brand" href="/">
        <span className="brand-mark"><ShieldCheck size={20} /></span>
        Gestionar
      </a>
      <nav>
        <a href="#funcionalidades">Funcionalidades</a>
        <a href="#precios">Beneficios</a>
        <a href="#contacto">Contacto</a>
        <a href="/login">Ingresar</a>
      </nav>
    </header>
  );
}
