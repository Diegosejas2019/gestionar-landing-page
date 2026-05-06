import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Building2, Check, KeyRound, LayoutDashboard, LifeBuoy, LogOut, RefreshCw, Search, Shield, Users } from 'lucide-react';
import { superAdminApi } from '../../services/adminService';
import { isSuperAdminRole } from '../../services/authService';

type Notice = { type: 'ok' | 'error'; text: string } | null;

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
  const [user, setUser] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [statusModal, setStatusModal] = useState<{ org: any; nextActive: boolean } | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const selectedOrg = useMemo(
    () => organizations.find((org) => idOf(org) === selectedOrgId),
    [organizations, selectedOrgId]
  );

  const activeCount = organizations.filter((org) => org.isActive !== false).length;
  const inactiveCount = organizations.length - activeCount;

  async function refresh() {
    setLoading(true);
    try {
      const me = await superAdminApi.me();
      const loggedUser = me?.data?.user;
      if (!isSuperAdminRole(loggedUser?.role)) {
        window.location.assign('/admin');
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
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No pudimos cargar la organizacion.' });
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('gestionar_token')) {
      window.location.assign('/login');
      return;
    }
    refresh();
  }, []);

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
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No pudimos completar la accion.' });
    } finally {
      setBusy('');
    }
  }

  function logout() {
    localStorage.removeItem('gestionar_token');
    window.location.assign('/');
  }

  function submitOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('create-org', () => superAdminApi.organizations.create(data), 'Organizacion creada.');
    event.currentTarget.reset();
  }

  function updateSelectedOrg(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOrgId) return;
    const data = formObject(event);
    run('update-org', () => superAdminApi.organizations.update(selectedOrgId, data), 'Organizacion actualizada.');
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
      setNotice({ type: 'error', text: 'La contrasena debe tener al menos 6 caracteres.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', text: 'Las contrasenas no coinciden.' });
      return;
    }

    setBusy('change-user-password');
    try {
      await superAdminApi.users.updatePasswordByEmail({ email, newPassword });
      setNotice({ type: 'ok', text: `Contrasena actualizada para ${email}.` });
      form.reset();
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No pudimos cambiar la contrasena.' });
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
      nextActive ? 'Organizacion reactivada correctamente.' : 'Organizacion desactivada correctamente.'
    );
    setStatusModal(null);
    setStatusReason('');
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
          <button onClick={() => document.getElementById('password-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
            <KeyRound size={18} /> <span>Contrasenas</span>
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
            <h2>Gestion global de organizaciones, features y acceso interno del SaaS.</h2>
          </div>
        </section>

        <div className="metric-grid">
          <Metric loading={loading} label="Organizaciones" value={organizations.length} hint="Total SaaS" icon={Building2} />
          <Metric loading={loading} label="Activas" value={activeCount} hint="Operativas" icon={Check} />
          <Metric loading={loading} label="Inactivas" value={inactiveCount} hint="Desactivadas" icon={LayoutDashboard} />
          <Metric loading={loading} label="Miembros org" value={members.length} hint={selectedOrg?.name || 'Seleccion actual'} icon={Users} />
        </div>

        <div className="admin-grid">
          <Panel id="password-panel" title="Cambiar contrasena" icon={KeyRound}>
            <form className="admin-form" onSubmit={submitPasswordChange}>
              <Field label="Email del usuario" name="email" type="email" required />
              <Field label="Nueva contrasena" name="newPassword" type="password" required />
              <Field label="Confirmar contrasena" name="confirmPassword" type="password" required />
              <p className="admin-form-note">La sesion activa del usuario se cerrara cuando vuelva a usar la app.</p>
              <button className="btn btn-primary" disabled={busy === 'change-user-password'}>Actualizar contrasena</button>
            </form>
          </Panel>

          <Panel title="Nueva organizacion" icon={Building2}>
            <form className="admin-form" onSubmit={submitOrganization}>
              <Field label="Nombre" name="name" required />
              <Field label="Slug" name="slug" />
              <SelectField label="Tipo" name="businessType" defaultValue="consorcio">
                <option value="consorcio">Consorcio</option>
                <option value="barrio">Barrio privado</option>
                <option value="club">Club</option>
                <option value="gimnasio">Gimnasio</option>
                <option value="colegio">Colegio</option>
              </SelectField>
              <Field label="Email admin" name="adminEmail" type="email" />
              <Field label="Telefono" name="adminPhone" />
              <Field label="Direccion" name="address" />
              <button className="btn btn-primary" disabled={busy === 'create-org'}>Crear organizacion</button>
            </form>
          </Panel>

          <Panel title="Organizaciones" icon={Building2}>
            <Grid
              loading={loading}
              rows={organizations}
              searchPlaceholder="Buscar organizacion, slug o tipo"
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

          <Panel title="Detalle de organizacion" icon={LayoutDashboard}>
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
                    <strong>Organizacion inactiva</strong>
                    <span>Desactivada: {dateLabel(selectedOrg.deactivatedAt)}</span>
                    {selectedOrg.deactivationReason && <span>Motivo: {selectedOrg.deactivationReason}</span>}
                  </div>
                )}
                <button className="btn btn-primary" disabled={busy === 'update-org'}>Guardar cambios</button>
                {selectedOrg.isActive === false
                  ? <button className="btn btn-primary" type="button" disabled={busy === 'reactivate-org'} onClick={() => openStatusModal(selectedOrg, true)}>Reactivar organizacion</button>
                  : <button className="btn btn-ghost danger-outline" type="button" disabled={busy === 'deactivate-org'} onClick={() => openStatusModal(selectedOrg, false)}>Desactivar organizacion</button>}
              </form>
            ) : <Empty text="Selecciona una organizacion." />}
          </Panel>

          <Panel title="Features" icon={Shield}>
            {!selectedOrg ? <Empty text="Selecciona una organizacion." /> : (
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

          <Panel title="Miembros de la organizacion" icon={Users}>
            <Grid
              loading={loading}
              rows={members}
              searchPlaceholder="Buscar miembro, email o rol"
              columns={[
                ['Nombre', (member: any) => member.name],
                ['Email', (member: any) => member.email],
                ['Rol', (member: any) => member.role],
                ['Estado', (member: any) => member.isActive === false ? 'Inactivo' : 'Activo'],
                ['Ultimo ingreso', (member: any) => dateLabel(member.lastLogin)]
              ]}
            />
          </Panel>

          <Panel title="Soporte" icon={LifeBuoy}>
            <Grid
              loading={loading}
              rows={supportTickets}
              searchPlaceholder="Buscar ticket, organizacion, usuario o prioridad"
              columns={[
                ['Titulo', (ticket: any) => ticket.title],
                ['Organizacion', (ticket: any) => ticket.organizationId?.name || '-'],
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
            <h2>{statusModal.nextActive ? 'Reactivar organizacion' : 'Desactivar organizacion'}</h2>
            <p>
              {statusModal.nextActive
                ? 'Esta accion restaurara el acceso de administradores y propietarios a esta organizacion si no fueron bloqueados manualmente.'
                : 'Esta accion bloqueara el acceso de administradores y propietarios a esta organizacion, pero no eliminara sus datos.'}
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
                {statusModal.nextActive ? 'Reactivar organizacion' : 'Desactivar organizacion'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
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

function Metric({ label, value, hint, icon: Icon, loading }: { label: string; value: string | number; hint: string; icon: any; loading?: boolean }) {
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
      Ejecutando accion...
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
  const [query, setQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return rows.filter((row) => !normalized || JSON.stringify(row).toLowerCase().includes(normalized));
  }, [rows, query]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => setPage(1), [query, pageSize, rows]);

  if (loading) {
    return (
      <div className="table-skeleton">
        {Array.from({ length: 6 }).map((_, row) => <div className="skeleton-row" key={row}><span /><span /><span /><span /></div>)}
      </div>
    );
  }

  return (
    <>
      <div className="grid-toolbar">
        <Search size={17} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} />
      </div>
      {!visible.length ? <Empty text="No hay registros con esos filtros." /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr></thead>
            <tbody>
              {visible.map((row, index) => (
                <tr key={idOf(row) || index} className={selectedId === idOf(row) ? 'selected-row' : ''} onClick={() => onSelect?.(row)}>
                  {columns.map(([label, render]) => <td key={label}>{render(row)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="grid-footer">
        <span>{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</span>
        <label>Ver <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>{[5, 10, 20, 50].map(size => <option key={size} value={size}>{size}</option>)}</select></label>
        <div className="pager">
          <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage <= 1}>Anterior</button>
          <span>{safePage} / {pages}</span>
          <button onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={safePage >= pages}>Siguiente</button>
        </div>
      </div>
    </>
  );
}
