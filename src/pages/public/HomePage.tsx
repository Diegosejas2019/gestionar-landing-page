import { useEffect, useRef, useState } from 'react';

export function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const processRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!processRef.current?.matches(':hover')) {
        setActiveStep((s) => (s % 4) + 1);
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* NAV */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a href="#" className="logo">
          <span className="logo-mark" />
          Gestion<span className="ar">Ar</span>
        </a>
        <ul className="nav-links">
          <li><a href="#beneficios">Beneficios</a></li>
          <li><a href="#servicios">Servicios</a></li>
          <li><a href="#proceso">Cómo trabajamos</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>
        <div className="nav-actions">
          <a href="/login" className="btn btn-ghost">Login</a>
          <a href="#contacto" className="btn btn-primary">Pedir propuesta <span className="arrow">→</span></a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <div className="eyebrow"><span className="dot" /> ADMINISTRACIÓN DE CONSORCIOS · ARGENTINA</div>
            <h1 className="display">
              La administración <span className="accent">transparente</span> que tu barrio privado necesita.
            </h1>
            <p className="lead">
              Simplificamos expensas, mantenimiento y comunicación en countries, barrios cerrados y clubes de campo. Todo en una plataforma, con respuesta humana de lunes a sábado.
            </p>
            <div className="hero-cta">
              <a href="#contacto" className="btn btn-primary btn-lg">Agendar diagnóstico gratuito <span className="arrow">→</span></a>
              <a href="#servicios" className="btn btn-ghost btn-lg">Ver servicios</a>
            </div>
            <div className="trust">
              <div className="avatars">
                <span>MP</span><span>LT</span><span>RC</span><span>+</span>
              </div>
              <div>+34 barrios confían en nosotros este año</div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dash dash-main">
              <div className="dash-head">
                <div>
                  <div className="dash-title">Panel del consorcio</div>
                  <div className="dash-sub">BARRIO LAS ACACIAS · ABR 2026</div>
                </div>
                <div className="dash-tabs">
                  <span className="active">Mes</span>
                  <span>Trim.</span>
                  <span>Año</span>
                </div>
              </div>
              <div className="dash-stats">
                <div className="stat-card">
                  <div className="label">Cobrado</div>
                  <div className="val">96%</div>
                  <div className="delta">↑ 4.2</div>
                </div>
                <div className="stat-card">
                  <div className="label">Tickets</div>
                  <div className="val">12</div>
                  <div className="delta">↓ 21%</div>
                </div>
                <div className="stat-card">
                  <div className="label">Reservas</div>
                  <div className="val">87</div>
                  <div className="delta">↑ 8</div>
                </div>
              </div>
              <div className="dash-chart">
                <div className="chart-head">
                  <div className="t">Ingresos vs. gastos</div>
                  <div className="chart-legend">
                    <span><span className="sw" style={{ background: '#9cf27b' }} />Ingresos</span>
                    <span><span className="sw" style={{ background: '#3a5a48' }} />Gastos</span>
                  </div>
                </div>
                <svg className="chart-svg" viewBox="0 0 280 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="grad-in" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor="#9cf27b" stopOpacity="0.45" />
                      <stop offset="1" stopColor="#9cf27b" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M0,70 L40,55 L80,62 L120,40 L160,48 L200,28 L240,35 L280,20 L280,100 L0,100 Z" fill="url(#grad-in)" />
                  <path d="M0,70 L40,55 L80,62 L120,40 L160,48 L200,28 L240,35 L280,20" fill="none" stroke="#9cf27b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M0,82 L40,78 L80,80 L120,72 L160,76 L200,70 L240,68 L280,64" fill="none" stroke="#3a5a48" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            <div className="dash dash-ticket">
              <div className="dot-g" />
              <div>
                <div className="t">Poda sector oeste</div>
                <div className="s">RESUELTO · 4h</div>
              </div>
            </div>

            <div className="dash dash-floater">
              <div className="float-head">
                <div className="float-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                  </svg>
                </div>
                <div>
                  <div className="float-title">Expensas pagas</div>
                  <div className="float-sub">Últimas 24 h</div>
                </div>
              </div>
              <div className="float-list">
                <div className="float-item"><span className="name">Lote 142 · Pérez</span><span className="amt">$ 184.500</span></div>
                <div className="float-item"><span className="name">Lote 087 · Morales</span><span className="amt">$ 184.500</span></div>
                <div className="float-item"><span className="name">Lote 031 · Sosa</span><span className="amt">$ 184.500</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <div className="container">
        <div className="logos-strip">
          <div className="label">Administramos barrios en GBA Norte, Zona Oeste y Pilar</div>
          <div className="logos-grid">
            <div className="logo-item">Las&nbsp;Acacias</div>
            <div className="logo-item">San&nbsp;Isidro&nbsp;Park</div>
            <div className="logo-item">El&nbsp;Ombú</div>
            <div className="logo-item">Arroyo&nbsp;Verde</div>
            <div className="logo-item">Pilar&nbsp;Golf</div>
            <div className="logo-item">Haras&nbsp;del&nbsp;Sur</div>
          </div>
        </div>
      </div>

      {/* BENEFICIOS */}
      <section className="section" id="beneficios">
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow"><span className="dot" /> POR QUÉ GESTIONAR</div>
            <h2>Nueve de cada diez vecinos no saben dónde va su expensa. Nosotros sí, y te lo mostramos.</h2>
            <p>Transparencia radical, tecnología que le saca el peso al administrador y trato humano con cada propietario. Una combinación rara en este rubro.</p>
          </div>

          <div className="benefits-grid">
            <div className="benefit reveal">
              <span className="num">01</span>
              <div className="benefit-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3>Transparencia total</h3>
              <p>Cada gasto con comprobante digital. Los propietarios ven adónde va cada peso, en tiempo real, desde el celular.</p>
            </div>

            <div className="benefit reveal">
              <span className="num">02</span>
              <div className="benefit-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3>Respuesta en menos de 4 h</h3>
              <p>Cada reclamo tiene un responsable y un tiempo. Podés seguir el estado del pedido como si fuera un envío.</p>
            </div>

            <div className="benefit reveal">
              <span className="num">03</span>
              <div className="benefit-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <h3>Liquidación mensual clara</h3>
              <p>Un PDF que se entiende sin un contador al lado. Capítulos, comparativos y reserva técnica calculada al día.</p>
            </div>

            <div className="benefit reveal">
              <span className="num">04</span>
              <div className="benefit-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h3>Un contacto humano</h3>
              <p>No sos un ticket. Tenés un administrador asignado que conoce tu barrio, con nombre y celular directo.</p>
            </div>

            <div className="benefit reveal">
              <span className="num">05</span>
              <div className="benefit-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3>Proveedores auditados</h3>
              <p>Tres presupuestos por obra y un panel de rendimiento por proveedor. Chau compadre del administrador.</p>
            </div>

            <div className="benefit reveal">
              <span className="num">06</span>
              <div className="benefit-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3>Asesoría legal incluida</h3>
              <p>Reglamentos, morosos, cocheras, mascotas. Tenés respaldo de un estudio socio, sin costo extra.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="section" id="servicios" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow"><span className="dot" /> SERVICIOS</div>
            <h2>Todo lo que un barrio privado necesita, en un solo lugar.</h2>
            <p>Desde la gestión contable hasta el portón de entrada. Nos encargamos de lo operativo para que la comisión directiva pueda dedicarse a vivir.</p>
          </div>

          <div className="bento reveal">
            <div className="bento-cell cell-1">
              <div>
                <span className="tag">CORE</span>
                <h3>Gestión integral del consorcio</h3>
                <p>Expensas, cobranzas, proveedores, liquidaciones, reserva técnica y auditoría mensual. Todo operado por un equipo dedicado con un panel en vivo para la comisión.</p>
              </div>
              <div className="viz viz-bars">
                {[40, 55, 70, 50, 85, 65, 92, 78, 60, 88].map((h, i) => (
                  <div key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            <div className="bento-cell cell-2">
              <div>
                <span className="tag">TECNOLOGÍA</span>
                <h3>App para propietarios</h3>
                <p>Expensas, reclamos, reservas de SUM y QR de invitados en un toque.</p>
              </div>
              <svg viewBox="0 0 220 80" style={{ width: '100%', marginTop: 'auto' }}>
                <rect x="4" y="6" width="60" height="68" rx="10" fill="#1a241f" stroke="rgba(255,255,255,0.08)" />
                <rect x="12" y="16" width="44" height="6" rx="2" fill="#9cf27b" />
                <rect x="12" y="28" width="32" height="4" rx="2" fill="#3a5a48" />
                <rect x="12" y="38" width="44" height="26" rx="4" fill="#0e1512" />
                <rect x="78" y="6" width="60" height="68" rx="10" fill="#1a241f" stroke="rgba(255,255,255,0.08)" />
                <circle cx="108" cy="30" r="10" fill="#9cf27b" fillOpacity="0.2" />
                <circle cx="108" cy="30" r="5" fill="#9cf27b" />
                <rect x="86" y="48" width="44" height="4" rx="2" fill="#3a5a48" />
                <rect x="86" y="56" width="32" height="4" rx="2" fill="#3a5a48" />
                <rect x="152" y="6" width="60" height="68" rx="10" fill="#1a241f" stroke="rgba(255,255,255,0.08)" />
                <rect x="160" y="16" width="44" height="12" rx="3" fill="#9cf27b" fillOpacity="0.15" />
                <rect x="160" y="34" width="44" height="12" rx="3" fill="#9cf27b" fillOpacity="0.3" />
                <rect x="160" y="52" width="44" height="12" rx="3" fill="#9cf27b" />
              </svg>
            </div>

            <div className="bento-cell cell-3">
              <span className="tag">OPERACIONES</span>
              <div>
                <h3>Seguridad y portería</h3>
                <p>Gestión del personal, rondas digitales y control de accesos integrado.</p>
              </div>
            </div>

            <div className="bento-cell cell-4">
              <span className="tag">INFRAESTRUCTURA</span>
              <div>
                <h3>Mantenimiento edilicio</h3>
                <p>Plan preventivo por rubro con historial y recordatorios automáticos.</p>
              </div>
            </div>

            <div className="bento-cell cell-5">
              <span className="tag">LEGAL &amp; RRHH</span>
              <div>
                <h3>Empleados del barrio</h3>
                <p>Liquidación de sueldos, ART y contratos al día, sin sorpresas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="section" id="proceso" style={{ paddingTop: 0 }} ref={processRef}>
        <div className="container">
          <div className="process reveal">
            <div className="process-grid">
              <div>
                <div className="eyebrow"><span className="dot" /> CÓMO TRABAJAMOS</div>
                <h2 style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', margin: '20px 0 40px' }}>Transición sin fricciones en 30 días.</h2>

                <div className="steps-list">
                  {[
                    { n: 1, title: 'Diagnóstico del barrio', desc: 'Reunión con la comisión, auditoría del estado actual y propuesta cerrada.' },
                    { n: 2, title: 'Traspaso y onboarding', desc: 'Migramos la información del administrador anterior y damos de alta a los propietarios.' },
                    { n: 3, title: 'Primer mes en paralelo', desc: 'Acompañamos la primera liquidación codo a codo con la comisión directiva.' },
                    { n: 4, title: 'Operación continua', desc: 'Revisiones trimestrales, mejoras en proveedores y reporte ejecutivo cada mes.' },
                  ].map(({ n, title, desc }) => (
                    <div
                      key={n}
                      className={`step${activeStep === n ? ' active' : ''}`}
                      onClick={() => setActiveStep(n)}
                    >
                      <div className="step-num">{String(n).padStart(2, '0')}</div>
                      <div className="step-body">
                        <h4>{title}</h4>
                        <p>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="process-visual">
                <div className={`pv-content${activeStep === 1 ? ' active' : ''}`}>
                  <div className="pv-label">PASO 01 · DIAGNÓSTICO</div>
                  <div className="pv-title">Auditoría sin costo</div>
                  <div className="pv-mock">
                    <div className="pv-row"><span className="c1">Estado financiero</span><span className="check">✓</span></div>
                    <div className="pv-row"><span className="c1">Morosidad histórica</span><span className="c2">23%</span></div>
                    <div className="pv-row"><span className="c1">Proveedores activos</span><span className="c2">14</span></div>
                    <div className="pv-row"><span className="c1">Empleados en relación</span><span className="c2">8</span></div>
                    <div className="pv-row"><span className="c1">Plan de transición</span><span className="check">✓</span></div>
                  </div>
                </div>
                <div className={`pv-content${activeStep === 2 ? ' active' : ''}`}>
                  <div className="pv-label">PASO 02 · TRASPASO</div>
                  <div className="pv-title">Migración ordenada</div>
                  <div className="pv-mock">
                    <div className="pv-row"><span className="c1">Padrón de propietarios</span><span className="check">✓</span></div>
                    <div className="pv-row"><span className="c1">Alta en app</span><span className="c2">347 / 347</span></div>
                    <div className="pv-row"><span className="c1">Contratos vigentes</span><span className="check">✓</span></div>
                    <div className="pv-row"><span className="c1">Expediente legal</span><span className="check">✓</span></div>
                    <div className="pv-row"><span className="c1">Apertura de cuenta</span><span className="check">✓</span></div>
                  </div>
                </div>
                <div className={`pv-content${activeStep === 3 ? ' active' : ''}`}>
                  <div className="pv-label">PASO 03 · PRIMER MES</div>
                  <div className="pv-title">Acompañamiento directo</div>
                  <div className="pv-mock">
                    <div className="pv-row"><span className="c1">Primera liquidación</span><span className="check">✓</span></div>
                    <div className="pv-row"><span className="c1">Asamblea virtual</span><span className="c2">AGENDADA</span></div>
                    <div className="pv-row"><span className="c1">Cobrabilidad mes 1</span><span className="c2">94%</span></div>
                    <div className="pv-row"><span className="c1">Tickets resueltos</span><span className="c2">28 / 31</span></div>
                  </div>
                </div>
                <div className={`pv-content${activeStep === 4 ? ' active' : ''}`}>
                  <div className="pv-label">PASO 04 · CONTINUIDAD</div>
                  <div className="pv-title">Ritmo mensual</div>
                  <div className="pv-mock">
                    <div className="pv-row"><span className="c1">Liquidación mensual</span><span className="check">✓</span></div>
                    <div className="pv-row"><span className="c1">Reporte a comisión</span><span className="check">✓</span></div>
                    <div className="pv-row"><span className="c1">Revisión de proveedores</span><span className="c2">TRIM.</span></div>
                    <div className="pv-row"><span className="c1">Plan de obras</span><span className="check">✓</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section className="section" id="planes" hidden style={{ display: 'none' }}>
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow"><span className="dot" /> PLANES</div>
            <h2>Precios transparentes, por tamaño del barrio.</h2>
            <p>Sin comisiones ocultas sobre expensas ni contratos de permanencia. Si no te sirve, te devolvemos el mes.</p>
          </div>

          <div className="plans-grid">
            <div className="plan reveal">
              <div className="plan-name">ESENCIAL</div>
              <div className="plan-tagline">Barrios chicos hasta 80 lotes.</div>
              <div className="plan-price"><span className="cur">$</span><span className="amt">380K</span></div>
              <div className="plan-per">mensuales · IVA incl.</div>
              <ul>
                <li>Gestión contable y cobranzas</li>
                <li>App móvil para propietarios</li>
                <li>1 reunión mensual con comisión</li>
                <li>Respuesta en 24 h hábiles</li>
                <li>Soporte de lunes a viernes</li>
              </ul>
              <a href="#contacto" className="btn btn-ghost">Empezar</a>
            </div>

            <div className="plan featured reveal">
              <div className="plan-name">GESTIÓN PLUS</div>
              <div className="plan-tagline">El plan que elige el 70% de los barrios.</div>
              <div className="plan-price"><span className="cur">$</span><span className="amt">680K</span></div>
              <div className="plan-per">mensuales · IVA incl.</div>
              <ul>
                <li>Todo lo de Esencial</li>
                <li>Administrador dedicado al barrio</li>
                <li>Respuesta en &lt; 4 h · lunes a sábado</li>
                <li>Gestión de personal y proveedores</li>
                <li>Asesoría legal incluida</li>
                <li>Panel ejecutivo en vivo</li>
              </ul>
              <a href="#contacto" className="btn btn-primary">Pedir propuesta</a>
            </div>

            <div className="plan reveal">
              <div className="plan-name">PREMIUM</div>
              <div className="plan-tagline">Barrios +300 lotes o con club house.</div>
              <div className="plan-price"><span className="cur">$</span><span className="amt">A&nbsp;medida</span></div>
              <div className="plan-per">según alcance</div>
              <ul>
                <li>Todo lo de Gestión Plus</li>
                <li>Equipo multidisciplinario asignado</li>
                <li>Gerente de barrio en sitio</li>
                <li>Auditoría externa trimestral</li>
                <li>Proyectos de obra y licitaciones</li>
                <li>SLA contractual garantizado</li>
              </ul>
              <a href="#contacto" className="btn btn-ghost">Hablar con ventas</a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" id="faq" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow"><span className="dot" /> PREGUNTAS FRECUENTES</div>
            <h2>Lo que siempre te preguntaste antes de cambiar de administrador.</h2>
          </div>

          <div className="faq-grid reveal">
            <details className="faq">
              <summary>¿Cómo es el proceso para cambiar de administrador?</summary>
              <div className="ans">La comisión directiva convoca a asamblea, se aprueba el cambio y nosotros coordinamos el traspaso con el administrador saliente. Nos hacemos cargo de la migración de datos, el alta de propietarios en la app y la apertura de cuenta bancaria del consorcio. Todo el proceso lleva entre 20 y 30 días.</div>
            </details>
            <details className="faq">
              <summary>¿Cobran comisión sobre las expensas o los proveedores?</summary>
              <div className="ans">No. Cobramos únicamente el abono mensual del plan contratado. No recibimos comisiones de proveedores, bancos ni aseguradoras. Esto lo firmamos por contrato y queda a disposición de la comisión.</div>
            </details>
            <details className="faq">
              <summary>¿Qué pasa si tenemos alta morosidad?</summary>
              <div className="ans">Trabajamos con un protocolo de cobranza amigable: recordatorios automáticos, contacto telefónico y acuerdos de pago. Cuando hace falta, derivamos al estudio jurídico asociado. En promedio bajamos la morosidad de los barrios que administramos en un 40% durante los primeros seis meses.</div>
            </details>
            <details className="faq">
              <summary>¿La app tiene costo adicional para los propietarios?</summary>
              <div className="ans">No, está incluida en todos los planes para el barrio. Los propietarios la descargan gratis en iOS y Android y acceden con su DNI y código de lote.</div>
            </details>
            <details className="faq">
              <summary>¿Atienden barrios fuera del AMBA?</summary>
              <div className="ans">Sí, trabajamos con barrios en Pilar, Escobar, La Plata, Córdoba y Rosario. El modelo es híbrido: tenemos equipo en territorio y operación centralizada. En ubicaciones nuevas evaluamos factibilidad en la reunión de diagnóstico.</div>
            </details>
            <details className="faq">
              <summary>¿Firmamos un contrato de permanencia?</summary>
              <div className="ans">El contrato estándar es anual y se renueva automáticamente, pero podés salir en cualquier momento con 60 días de preaviso sin penalidades. Creemos en retenerte por resultados, no por letra chica.</div>
            </details>
          </div>
        </div>
      </section>

      {/* CONTACTO */}
      <section className="section" id="contacto" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="contact reveal">
            <div className="contact-grid">
              <div>
                <div className="eyebrow"><span className="dot" /> HABLEMOS</div>
                <h2>Contanos sobre tu barrio y te enviamos una propuesta en 24 h.</h2>
                <p className="lead">Agendamos una reunión de diagnóstico sin costo, con o sin miembros de tu comisión directiva.</p>

                <div className="contact-items">
                  <div className="contact-item">
                    <div className="i">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </div>
                    <div>
                      <div className="lb">Teléfono</div>
                      <div className="v">+54 11 4893-2210</div>
                    </div>
                  </div>
                  <div className="contact-item">
                    <div className="i">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                      </svg>
                    </div>
                    <div>
                      <div className="lb">Email</div>
                      <div className="v">hola@gestionar.com.ar</div>
                    </div>
                  </div>
                  <div className="contact-item">
                    <div className="i">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <div className="lb">Oficina</div>
                      <div className="v">Av. del Libertador 5480 · CABA</div>
                    </div>
                  </div>
                </div>
              </div>

              <form
                className={`form${submitted ? ' submitted' : ''}`}
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              >
                <div className="form-content" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="nombre">Nombre</label>
                      <input type="text" id="nombre" required placeholder="Tu nombre" />
                    </div>
                    <div className="field">
                      <label htmlFor="rol">Cargo</label>
                      <select id="rol" required defaultValue="">
                        <option value="" disabled>Seleccionar…</option>
                        <option>Presidente de CD</option>
                        <option>Tesorero</option>
                        <option>Vocal</option>
                        <option>Propietario</option>
                        <option>Otro</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="barrio">Barrio o proyecto</label>
                    <input type="text" id="barrio" required placeholder="Ej. Barrio Las Acacias, Pilar" />
                  </div>
                  <div className="form-row">
                    <div className="field">
                      <label htmlFor="lotes">Cantidad de lotes</label>
                      <select id="lotes" required defaultValue="">
                        <option value="" disabled>Seleccionar…</option>
                        <option>Hasta 80</option>
                        <option>80 – 200</option>
                        <option>200 – 400</option>
                        <option>Más de 400</option>
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="tel">Teléfono</label>
                      <input type="tel" id="tel" required placeholder="+54 9 11 ..." />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="msg">Comentarios</label>
                    <textarea id="msg" placeholder="Contanos brevemente la situación actual..." />
                  </div>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                    Enviar solicitud <span className="arrow">→</span>
                  </button>
                </div>
                <div className="form-ok">
                  ✓ ¡Recibimos tu mensaje! Te contactamos en menos de 48 h.
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <a href="#" className="logo"><span className="logo-mark" /> Gestion<span className="ar">Ar</span></a>
              <p>Administración profesional de consorcios y barrios privados. Transparencia, tecnología y trato humano.</p>
            </div>
            <div className="footer-col">
              <h5>Empresa</h5>
              <ul>
                <li><a href="#beneficios">Beneficios</a></li>
                <li><a href="#servicios">Servicios</a></li>
                <li><a href="#proceso">Cómo trabajamos</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Recursos</h5>
              <ul>
                <li><a href="#faq">Preguntas frecuentes</a></li>
                <li><a href="#">Guía para CD</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Prensa</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h5>Contacto</h5>
              <ul>
                <li><a href="#contacto">Pedir propuesta</a></li>
                <li><a href="mailto:hola@gestionar.com.ar">hola@gestionar.com.ar</a></li>
                <li><a href="tel:+541148932210">+54 11 4893-2210</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <div>© 2026 GESTIONAR S.A.S. · CUIT 30-71728930-4</div>
            <div>HECHO EN BUENOS AIRES</div>
          </div>
        </div>
      </footer>
    </>
  );
}
