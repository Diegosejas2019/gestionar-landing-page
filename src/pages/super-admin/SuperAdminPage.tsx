import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, Building2, Check, CreditCard, FileText, KeyRound, LayoutDashboard, LifeBuoy, LogOut, Megaphone, MessageSquare, RefreshCw, Shield, Upload, Users } from 'lucide-react';
import { superAdminApi } from '../../services/adminService';
import { isSuperAdminRole } from '../../services/authService';
import { Table } from '../../components/Table';
import { clearAuthToken, getAuthToken, goAdmin, goHome, goLogin } from '../../services/navigationService';
import type { ApiRecord, FeatureFlags, SessionUser } from '../../types/api';

type Notice = { type: 'ok' | 'error'; text: string } | null;
type DateRange = { from: string; to: string };
type SuperAdminRow = ApiRecord & {
  isActive?: boolean;
  totalEvents?: number;
  date?: string;
  module?: string;
  lastActivityAt?: string;
};
type SupportTicket = SuperAdminRow & {
  subject?: string;
  message?: string;
  priority?: string;
};
type StatusModal = { org: SuperAdminRow; nextActive: boolean };

const idOf = (row: any) => String(row?._id || row?.id || '');
const dateLabel = (value: unknown) => value ? new Date(String(value)).toLocaleDateString('es-AR') : '-';
const featureLabels: Record<string, string> = {
  visits: 'Visitas',
  reservations: 'Reservas',
  votes: 'Votaciones',
  claims: 'Reclamos',
  notices: 'Comunicados',
  expenses: 'Gastos',
  providers: 'Proveedores'
};
const ticketStatusLabels: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado'
};
const rangeLabels: Record<string, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  month: 'Mes actual',
  custom: 'Personalizado'
};
const moduleLabels: Record<string, string> = {
  auth: 'Autenticación',
  documents: 'Documentos',
  payments: 'Pagos',
  claims: 'Reclamos',
  notices: 'Comunicados',
  owners: 'Propietarios'
};

function localDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days + 1);
  return localDate(date);
}

function rangeForPreset(preset: string): DateRange {
  const today = new Date();
  if (preset === '7d') return { from: daysAgo(7), to: localDate(today) };
  if (preset === 'month') return { from: localDate(new Date(today.getFullYear(), today.getMonth(), 1)), to: localDate(today) };
  return { from: daysAgo(30), to: localDate(today) };
}

const initialRange = rangeForPreset('30d');

function pick<T>(response: any, key: string, fallback: T): T {
  return response?.data?.[key] ?? fallback;
}

function formObject(event: FormEvent<HTMLFormElement>) {
  return Object.fromEntries(new FormData(event.currentTarget).entries());
}

export function SuperAdminPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [organizations, setOrganizations] = useState<SuperAdminRow[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [members, setMembers] = useState<SuperAdminRow[]>([]);
  const [features, setFeatures] = useState<FeatureFlags>({});
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsOverview, setAnalyticsOverview] = useState<ApiRecord>({});
  const [dailyActivity, setDailyActivity] = useState<SuperAdminRow[]>([]);
  const [moduleUsage, setModuleUsage] = useState<SuperAdminRow[]>([]);
  const [organizationUsage, setOrganizationUsage] = useState<SuperAdminRow[]>([]);
  const [rangePreset, setRangePreset] = useState('30d');
  const [customRange, setCustomRange] = useState(initialRange);
  const [statusModal, setStatusModal] = useState<StatusModal | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const selectedOrg = useMemo(
    () => organizations.find((org) => idOf(org) === selectedOrgId),
    [organizations, selectedOrgId]
  );

  const activeCount = organizations.filter((org) => org.isActive !== false).length;
  const inactiveCount = organizations.length - activeCount;
  const analyticsRange = useMemo(
    () => rangePreset === 'custom' ? customRange : rangeForPreset(rangePreset),
    [rangePreset, customRange]
  );

  async function loadAnalytics(range = analyticsRange) {
    if (!range.from || !range.to) return;
    setAnalyticsLoading(true);
    try {
      const [overview, activity, modules, orgUsage] = await Promise.all([
        superAdminApi.analytics.overview(),
        superAdminApi.analytics.dailyActivity(range),
        superAdminApi.analytics.modules(range),
        superAdminApi.analytics.organizations(range)
      ]);
      setAnalyticsOverview(overview?.data || {});
      setDailyActivity(pick<any[]>(activity, 'activity', []));
      setModuleUsage(pick<any[]>(modules, 'modules', []));
      setOrganizationUsage(pick<any[]>(orgUsage, 'organizations', []));
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No pudimos cargar las métricas de uso.' });
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function refresh() {
    setLoading(true);
    try {
      const me = await superAdminApi.me();
      const loggedUser = me?.data?.user;
      if (!isSuperAdminRole(loggedUser?.role)) {
        goAdmin();
        return;
      }

      const [orgs, support] = await Promise.all([
        superAdminApi.organizations.list(),
        superAdminApi.support.list({ limit: 100 })
      ]);

      const list = pick<any[]>(orgs, 'organizations', []);
      setUser(loggedUser);
      setOrganizations(list);
      setSupportTickets(pick<any[]>(support, 'tickets', []));
      setSelectedOrgId((current) => current || idOf(list[0] || ''));
      setNotice(null);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No pudimos cargar SuperAdmin.' });
    } finally {
      setLoading(false);
    }
  }

  async function loadOrgDetails(orgId: string) {
    if (!orgId) return;
    try {
      const [membersRes, featuresRes] = await Promise.all([
        superAdminApi.organizations.members(orgId),
        superAdminApi.organizations.features(orgId)
      ]);
      setMembers(pick<any[]>(membersRes, 'members', []));
      setFeatures(pick<Record<string, boolean>>(featuresRes, 'features', {}));
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No pudimos cargar la organización.' });
    }
  }

  useEffect(() => {
    if (!getAuthToken()) {
      goLogin();
      return;
    }
    refresh();
  }, []);

  useEffect(() => {
    if (!getAuthToken()) return;
    loadAnalytics(analyticsRange);
  }, [analyticsRange]);

  useEffect(() => {
    loadOrgDetails(selectedOrgId);
  }, [selectedOrgId]);

  async function run(label: string, action: () => Promise<unknown>, success: string) {
    setBusy(label);
    try {
      await action();
      setNotice({ type: 'ok', text: success });
      await refresh();
      if (selectedOrgId) await loadOrgDetails(selectedOrgId);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No pudimos completar la acción.' });
    } finally {
      setBusy('');
    }
  }

  function logout() {
    clearAuthToken();
    goHome();
  }

  function submitOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('create-org', () => superAdminApi.organizations.create(data), 'Organización creada.');
    event.currentTarget.reset();
  }

  function updateSelectedOrg(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrgId) return;
    const data = formObject(event);
    run('update-org', () => superAdminApi.organizations.update(selectedOrgId, data), 'Organización actualizada.');
  }

  function updateFeature(key: string, value: boolean) {
    if (!selectedOrgId) return;
    run(`feature-${key}`, () => superAdminApi.organizations.updateFeatures(selectedOrgId, { ...features, [key]: value }), 'Feature actualizada.');
  }

  function updateTicket(ticket: any, data: Record<string, unknown>, success: string) {
    run(`ticket-${idOf(ticket)}`, () => superAdminApi.support.update(idOf(ticket), data), success);
  }

  async function submitPasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formObject(event);
    const email = String(data.email || '').trim().toLowerCase();
    const newPassword = String(data.newPassword || '');
    const confirmPassword = String(data.confirmPassword || '');

    if (!email) {
      setNotice({ type: 'error', text: 'Ingresa el email del usuario.' });
      return;
    }

    if (newPassword.length < 6) {
      setNotice({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    setBusy('change-user-password');
    try {
      await superAdminApi.users.updatePasswordByEmail({ email, newPassword });
      setNotice({ type: 'ok', text: `Contraseña actualizada para ${email}.` });
      form.reset();
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No pudimos cambiar la contraseña.' });
    } finally {
      setBusy('');
    }
  }

  function openStatusModal(org: any, nextActive: boolean) {
    setSelectedOrgId(idOf(org));
    setStatusReason('');
    setStatusModal({ org, nextActive });
  }

  async function confirmStatusChange() {
    if (!statusModal) return;
    const nextActive = statusModal.nextActive;
    await run(
      nextActive ? 'reactivate-org' : 'deactivate-org',
      () => superAdminApi.organizations.status(idOf(statusModal.org), {
        isActive: nextActive,
        reason: statusReason.trim() || undefined,
      }),
      nextActive ? 'Organización reactivada correctamente.' : 'Organización desactivada correctamente.'
    );
    setStatusModal(null);
    setStatusReason('');
  }

  function updateRangePreset(value: string) {
    setRangePreset(value);
    if (value !== 'custom') setCustomRange(rangeForPreset(value));
  }

  function organizationActivityStatus(lastActivityAt: unknown) {
    if (!lastActivityAt) return 'Sin actividad';
    const last = new Date(String(lastActivityAt)).getTime();
    const now = Date.now();
    if (now - last <= 7 * 24 * 60 * 60 * 1000) return 'Activa';
    if (now - last <= 30 * 24 * 60 * 60 * 1000) return 'Baja actividad';
    return 'Sin actividad';
  }

  return (
    <main className={`admin-shell${busy ? ' is-busy' : ''}`}>
      <aside className="admin-sidebar">
        <a className="logo admin-logo" href="/">
          <span className="logo-mark" /> Gestion<span className="ar">ar</span>
        </a>
        <nav>
          <button className="active"><Shield size={18} /> <span>SuperAdmin</span></button>
          <button onClick={() => setSelectedOrgId(idOf(organizations[0] || ''))}><Building2 size={18} /> <span>Organizaciones</span></button>
          <button onClick={() => document.getElementById('usage-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <BarChart3 size={18} /> <span>Uso</span>
          </button>
          <button onClick={() => document.getElementById('password-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <KeyRound size={18} /> <span>Contraseñas</span>
          </button>
          <button><LifeBuoy size={18} /> <span>Soporte</span></button>
        </nav>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">SaaS global</span>
            <h1>SuperAdmin</h1>
          </div>
          <div className="admin-actions">
            <button className="icon-btn" onClick={refresh} title="Actualizar"><RefreshCw size={18} /></button>
            <button className="btn btn-ghost" onClick={logout}><LogOut size={17} /> Salir</button>
          </div>
        </header>

        {busy && <BusyBanner />}
        {notice && <div className={`admin-notice ${notice.type}`}>{notice.text}</div>}

        <section className="admin-hero">
          <div>
            <span className="admin-kicker">Hola, {user?.name?.split(' ')[0] || 'SuperAdmin'}</span>
            <h2>Gestión global de organizaciones, features y acceso interno del SaaS.</h2>
          </div>
        </section>

        <div className="metric-grid">
          <Metric row loading={loading} label="Organizaciones" value={organizations.length} hint="Total SaaS" icon={Building2} />
          <Metric row loading={loading} label="Activas" value={activeCount} hint="Operativas" icon={Check} />
          <Metric row loading={loading} label="Inactivas" value={inactiveCount} hint="Desactivadas" icon={LayoutDashboard} />
          <Metric row loading={loading} label="Miembros org" value={members.length} hint={selectedOrg?.name || 'Seleccion actual'} icon={Users} />
        </div>

        <section className="admin-panel usage-panel" id="usage-panel">
          <div className="panel-head">
            <h2><BarChart3 size={18} /> Uso de la plataforma</h2>
            <div className="usage-range">
              <select value={rangePreset} onChange={(event) => updateRangePreset(event.target.value)}>
                <option value="7d">{rangeLabels['7d']}</option>
                <option value="30d">{rangeLabels['30d']}</option>
                <option value="month">{rangeLabels.month}</option>
                <option value="custom">{rangeLabels.custom}</option>
              </select>
              {rangePreset === 'custom' && (
                <>
                  <input type="date" value={customRange.from} onChange={(event) => setCustomRange((current) => ({ ...current, from: event.target.value }))} />
                  <input type="date" value={customRange.to} onChange={(event) => setCustomRange((current) => ({ ...current, to: event.target.value }))} />
                </>
              )}
            </div>
          </div>

          <div className="metric-grid usage-metrics">
            <Metric row loading={analyticsLoading} label="Usuarios activos hoy" value={analyticsOverview.activeUsersToday || 0} hint="Actividad diaria" icon={Activity} />
            <Metric row loading={analyticsLoading} label="Usuarios activos este mes" value={analyticsOverview.activeUsersThisMonth || 0} hint="Usuarios únicos" icon={Users} />
            <Metric row loading={analyticsLoading} label="Organizaciones activas" value={analyticsOverview.activeOrganizationsThisMonth || 0} hint="Este mes" icon={Building2} />
            <Metric row loading={analyticsLoading} label="Documentos subidos este mes" value={analyticsOverview.documentsUploadedThisMonth || 0} hint="Archivos" icon={Upload} />
            <Metric row loading={analyticsLoading} label="Pagos registrados este mes" value={analyticsOverview.paymentsCreatedThisMonth || 0} hint="ARS" icon={CreditCard} />
            <Metric row loading={analyticsLoading} label="Reclamos creados este mes" value={analyticsOverview.claimsCreatedThisMonth || 0} hint="Comunidad" icon={MessageSquare} />
            <Metric row loading={analyticsLoading} label="Comunicados creados este mes" value={analyticsOverview.noticesCreatedThisMonth || 0} hint="Avisos" icon={Megaphone} />
          </div>

          <div className="usage-grid">
            <div className="usage-card">
              <div className="usage-card-head">
                <span>Actividad diaria</span>
                <small>{analyticsRange.from} / {analyticsRange.to}</small>
              </div>
              <DailyActivityChart rows={dailyActivity} loading={analyticsLoading} />
            </div>
            <div className="usage-card">
              <div className="usage-card-head">
                <span>Uso por módulo</span>
                <small>{moduleUsage.length} módulos</small>
              </div>
              <ModuleUsageChart rows={moduleUsage} loading={analyticsLoading} />
            </div>
          </div>

          <div className="usage-table">
            <Grid
              loading={analyticsLoading}
              rows={organizationUsage}
              searchPlaceholder="Buscar organización por actividad"
              columns={[
                ['Organización', (org: any) => org.organizationName],
                ['Usuarios activos', (org: any) => org.activeUsers || 0],
                ['Eventos totales', (org: any) => org.totalEvents || 0],
                ['Última actividad', (org: any) => dateLabel(org.lastActivityAt)],
                ['Pagos', (org: any) => org.paymentsCreated || 0],
                ['Documentos', (org: any) => org.documentsUploaded || 0],
                ['Reclamos', (org: any) => org.claimsCreated || 0],
                ['Comunicados', (org: any) => org.noticesCreated || 0],
                ['Estado', (org: any) => <span className={`usage-status ${organizationActivityStatus(org.lastActivityAt).toLowerCase().replace(/\s+/g, '-')}`}>{organizationActivityStatus(org.lastActivityAt)}</span>]
              ]}
            />
          </div>
        </section>

        <div className="admin-grid">
          <Panel id="password-panel" title="Cambiar contraseña" icon={KeyRound}>
            <form className="admin-form" onSubmit={submitPasswordChange}>
              <Field label="Email del usuario" name="email" type="email" required />
              <Field label="Nueva contraseña" name="newPassword" type="password" required />
              <Field label="Confirmar contraseña" name="confirmPassword" type="password" required />
              <p className="admin-form-note">La sesión activa del usuario se cerrará cuando vuelva a usar la app.</p>
              <button className="btn btn-primary" disabled={busy === 'change-user-password'}>Actualizar contraseña</button>
            </form>
          </Panel>

          <Panel title="Nueva organización" icon={Building2}>
            <form className="admin-form" onSubmit={submitOrganization}>
              <Field label="Nombre" name="name" required />
              <Field label="Slug" name="slug" />
              <SelectField label="Tipo" name="businessType" defaultValue="consorcio">
                <option value="consorcio">Consorcio</option>
                <option value="other">Barrio privado / Otro</option>
                <option value="club">Club</option>
                <option value="gimnasio">Gimnasio</option>
                <option value="colegio">Colegio</option>
              </SelectField>
              <Field label="Email admin" name="adminEmail" type="email" />
              <Field label="Telefono" name="adminPhone" />
              <Field label="Direccion" name="address" />
              <button className="btn btn-primary" disabled={busy === 'create-org'}>Crear organización</button>
            </form>
          </Panel>

          <Panel title="Organizaciones" icon={Building2}>
            <Grid
              loading={loading}
              rows={organizations}
              searchPlaceholder="Buscar organización, slug o tipo"
              onSelect={(org) => setSelectedOrgId(idOf(org))}
              selectedId={selectedOrgId}
              columns={[
                ['Nombre', (org: any) => org.name],
                ['Slug', (org: any) => org.slug],
                ['Tipo', (org: any) => org.businessType],
                ['Estado', (org: any) => org.isActive === false ? 'Inactiva' : 'Activa'],
                ['Creada', (org: any) => dateLabel(org.createdAt)],
                ['Accion', (org: any) => (
                  <div className="row-actions">
                    {org.isActive === false
                      ? <button onClick={(event) => { event.stopPropagation(); openStatusModal(org, true); }}>Reactivar</button>
                      : <button className="danger-action" onClick={(event) => { event.stopPropagation(); openStatusModal(org, false); }}>Desactivar</button>}
                  </div>
                )]
              ]}
            />
          </Panel>

          <Panel title="Detalle de organización" icon={LayoutDashboard}>
            {selectedOrg ? (
              <form className="admin-form" onSubmit={updateSelectedOrg} key={selectedOrgId}>
                <Field label="Nombre" name="name" defaultValue={selectedOrg.name} />
                <Field label="Slug" name="slug" defaultValue={selectedOrg.slug} />
                <Field label="Email admin" name="adminEmail" type="email" defaultValue={selectedOrg.adminEmail} />
                <Field label="Telefono" name="adminPhone" defaultValue={selectedOrg.adminPhone} />
                <Field label="Direccion" name="address" defaultValue={selectedOrg.address} />
                <SelectField label="Estado" name="isActive" defaultValue={selectedOrg.isActive === false ? 'false' : 'true'}>
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </SelectField>
                {selectedOrg.isActive === false && (
                  <div className="org-status-note">
                    <strong>Organización inactiva</strong>
                    <span>Desactivada: {dateLabel(selectedOrg.deactivatedAt)}</span>
                    {selectedOrg.deactivationReason && <span>Motivo: {selectedOrg.deactivationReason}</span>}
                  </div>
                )}
                <button className="btn btn-primary" disabled={busy === 'update-org'}>Guardar cambios</button>
                {selectedOrg.isActive === false
                  ? <button className="btn btn-primary" type="button" disabled={busy === 'reactivate-org'} onClick={() => openStatusModal(selectedOrg, true)}>Reactivar organización</button>
                  : <button className="btn btn-ghost danger-outline" type="button" disabled={busy === 'deactivate-org'} onClick={() => openStatusModal(selectedOrg, false)}>Desactivar organización</button>}
              </form>
            ) : <Empty text="Selecciona una organización." />}
          </Panel>

          <Panel title="Features" icon={Shield}>
            {!selectedOrg ? <Empty text="Selecciona una organización." /> : (
              <div className="feature-list">
                {Object.entries(features).map(([key, enabled]) => (
                  <label key={key} className="feature-toggle">
                    <span>{featureLabels[key] || key}</span>
                    <input type="checkbox" checked={enabled} onChange={(event) => updateFeature(key, event.target.checked)} />
                  </label>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Miembros de la organización" icon={Users}>
            <Grid
              loading={loading}
              rows={members}
              searchPlaceholder="Buscar miembro, email o rol"
              columns={[
                ['Nombre', (member: any) => member.name],
                ['Email', (member: any) => member.email],
                ['Rol', (member: any) => member.role],
                ['Estado', (member: any) => member.isActive === false ? 'Inactivo' : 'Activo'],
                ['Último ingreso', (member: any) => dateLabel(member.lastLogin)]
              ]}
            />
          </Panel>

          <Panel title="Soporte" icon={LifeBuoy}>
            <Grid
              loading={loading}
              rows={supportTickets}
              searchPlaceholder="Buscar ticket, organización, usuario o prioridad"
              columns={[
                ['Titulo', (ticket: any) => ticket.title],
                ['Organización', (ticket: any) => ticket.organizationId?.name || '-'],
                ['Usuario', (ticket: any) => ticket.userId?.name || ticket.userId?.email || '-'],
                ['Tipo', (ticket: any) => ticket.typeLabel || ticket.type],
                ['Prioridad', (ticket: any) => ticket.priorityLabel || ticket.priority],
                ['Estado', (ticket: any) => ticketStatusLabels[ticket.status] || ticket.status],
                ['Acciones', (ticket: any) => (
                  <div className="row-actions">
                    <button onClick={() => updateTicket(ticket, { status: 'in_progress' }, 'Ticket en progreso.')}>En progreso</button>
                    <button onClick={() => updateTicket(ticket, { status: 'resolved', adminResponse: window.prompt('Respuesta') || '' }, 'Ticket resuelto.')}>Resolver</button>
                  </div>
                )]
              ]}
            />
          </Panel>
        </div>
      </section>

      {statusModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <section className="confirm-modal">
            <div className={`confirm-icon ${statusModal.nextActive ? 'ok' : 'danger'}`}>
              {statusModal.nextActive ? <Check size={22} /> : <AlertTriangle size={22} />}
            </div>
            <h2>{statusModal.nextActive ? 'Reactivar organización' : 'Desactivar organización'}</h2>
            <p>
              {statusModal.nextActive
                ? 'Esta acción restaurará el acceso de administradores y propietarios a esta organización si no fueron bloqueados manualmente.'
                : 'Esta acción bloqueará el acceso de administradores y propietarios a esta organización, pero no eliminará sus datos.'}
            </p>
            <label className="admin-field full">
              <span>Motivo opcional</span>
              <textarea rows={4} value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="Ej: falta de pago, reactivacion comercial..." />
            </label>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setStatusModal(null)}>Cancelar</button>
              <button
                className={statusModal.nextActive ? 'btn btn-primary' : 'btn danger-button'}
                onClick={confirmStatusChange}
                disabled={busy === 'deactivate-org' || busy === 'reactivate-org'}
              >
                {statusModal.nextActive ? 'Reactivar organización' : 'Desactivar organización'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function DailyActivityChart({ rows, loading }: { rows: any[]; loading: boolean }) {
  if (loading) {
    return <div className="usage-chart skeleton-chart">{Array.from({ length: 12 }).map((_, index) => <span key={index} />)}</div>;
  }
  if (!rows.length) return <Empty text="No hay actividad en el rango seleccionado." />;

  const max = Math.max(1, ...rows.map((row) => Number(row.totalEvents || 0)));
  return (
    <div className="usage-chart">
      {rows.map((row) => (
        <div className="usage-day" key={row.date} title={`${dateLabel(row.date)}: ${row.totalEvents || 0} eventos`}>
          <span className="usage-bar" style={{ height: `${Math.max(6, (Number(row.totalEvents || 0) / max) * 100)}%` }} />
          <small>{String(row.date).slice(5)}</small>
        </div>
      ))}
    </div>
  );
}

function ModuleUsageChart({ rows, loading }: { rows: any[]; loading: boolean }) {
  if (loading) {
    return <div className="usage-modules skeleton-modules">{Array.from({ length: 5 }).map((_, index) => <span key={index} />)}</div>;
  }
  if (!rows.length) return <Empty text="No hay uso por módulo en el rango seleccionado." />;

  const max = Math.max(1, ...rows.map((row) => Number(row.totalEvents || 0)));
  return (
    <div className="usage-modules">
      {rows.map((row) => (
        <div className="usage-module" key={row.module}>
          <div>
            <strong>{moduleLabels[row.module] || row.module}</strong>
            <small>{row.totalEvents || 0} eventos</small>
          </div>
          <span><i style={{ width: `${Math.max(4, (Number(row.totalEvents || 0) / max) * 100)}%` }} /></span>
        </div>
      ))}
    </div>
  );
}

function Field(props: { label: string; name: string; type?: string; defaultValue?: string | number; required?: boolean }) {
  return (
    <label className="admin-field">
      <span>{props.label}</span>
      <input name={props.name} type={props.type || 'text'} defaultValue={props.defaultValue || ''} required={props.required} />
    </label>
  );
}

function SelectField(props: { label: string; name: string; defaultValue?: string; children: ReactNode }) {
  return (
    <label className="admin-field">
      <span>{props.label}</span>
      <select name={props.name} defaultValue={props.defaultValue}>{props.children}</select>
    </label>
  );
}

function Metric({ label, value, hint, icon: Icon, loading, row }: { label: string; value: string | number; hint: string; icon: any; loading?: boolean; row?: boolean }) {
  if (loading) {
    return (
      <article className="metric-card">
        <div className="metric-icon skeleton-box" />
        <span className="skeleton-line short" />
        <span className="skeleton-line big" />
        <span className="skeleton-line" />
      </article>
    );
  }

  if (row) {
    return (
      <article className="metric-card" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
        <div className="metric-icon" style={{ marginBottom: 0 }}><Icon size={16} /></div>
        <small style={{ margin: 0, flexShrink: 0 }}>{label}</small>
        <b style={{ fontSize: '1.15rem', lineHeight: '1' }}>{value}</b>
        <span style={{ margin: 0, flexShrink: 0 }}>{hint}</span>
      </article>
    );
  }

  return (
    <article className="metric-card">
      <div className="metric-icon"><Icon size={18} /></div>
      <small>{label}</small>
      <b>{value}</b>
      <span>{hint}</span>
    </article>
  );
}

function Panel({ id, title, icon: Icon, children }: { id?: string; title: string; icon: any; children: ReactNode }) {
  return (
    <section className="admin-panel" id={id}>
      <div className="panel-head"><h2><Icon size={18} /> {title}</h2></div>
      {children}
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="admin-empty">{text}</div>;
}

function BusyBanner() {
  return (
    <div className="admin-busy" role="status" aria-live="polite">
      <span className="action-spinner" />
      Ejecutando acción...
    </div>
  );
}

function Grid({
  rows,
  columns,
  loading,
  searchPlaceholder,
  selectedId,
  onSelect
}: {
  rows: any[];
  columns: Array<[string, (row: any) => ReactNode]>;
  loading: boolean;
  searchPlaceholder: string;
  selectedId?: string;
  onSelect?: (row: any) => void;
}) {
  return (
    <Table
      rows={rows}
      columns={columns}
      loading={loading}
      searchPlaceholder={searchPlaceholder}
      onSelect={onSelect}
      rowClassName={(row) => selectedId === idOf(row) ? 'selected-row' : undefined}
    />
  );
}
