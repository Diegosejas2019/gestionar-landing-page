import { Bell, CreditCard, FileText, Home, MessageSquare, Settings, Users } from 'lucide-react';

const nav = [
  { icon: Home, label: 'Dashboard' },
  { icon: Users, label: 'Propietarios' },
  { icon: CreditCard, label: 'Pagos' },
  { icon: FileText, label: 'Gastos' },
  { icon: MessageSquare, label: 'Reclamos' },
  { icon: Bell, label: 'Avisos' },
  { icon: Settings, label: 'Configuracion' }
];

export function AdminPreviewPage() {
  return (
    <main className="admin-layout">
      <aside>
        <a className="brand admin-brand" href="/">Gestionar</a>
        <nav>
          {nav.map((item) => (
            <a href="#" key={item.label}><item.icon size={18} /> {item.label}</a>
          ))}
        </nav>
      </aside>
      <section className="admin-main">
        <header>
          <div>
            <span className="eyebrow">Panel web</span>
            <h1>Dashboard administrativo</h1>
          </div>
          <a className="btn ghost" href="/">Salir</a>
        </header>

        <div className="admin-cards">
          <article><small>Recaudacion</small><b>$ 8.420.000</b><span>+18% vs mes anterior</span></article>
          <article><small>Pagos pendientes</small><b>37</b><span>Requieren revision</span></article>
          <article><small>Reclamos abiertos</small><b>12</b><span>4 en progreso</span></article>
        </div>

        <div className="admin-panel">
          <h2>Estructura inicial preparada</h2>
          <p>
            Este panel queda como base visual para integrar los servicios reales de propietarios,
            pagos, gastos, reclamos y avisos usando la API existente.
          </p>
        </div>
      </section>
    </main>
  );
}
