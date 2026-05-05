import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Bell, Building2, CalendarCheck, CreditCard, FileText, Home, Inbox, Landmark,
  LogOut, Megaphone, MessageSquare, RefreshCw, Settings, ShieldCheck, UserRoundCog, Users, Vote, WalletCards
} from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { isSuperAdminRole } from '../../services/authService';

type TabKey = 'inicio' | 'finanzas' | 'personal' | 'comunidad' | 'operaciones' | 'proveedores' | 'config';
type Notice = { type: 'ok' | 'error'; text: string } | null;
type FeatureKey = 'visits' | 'reservations' | 'votes' | 'claims' | 'notices' | 'expenses' | 'providers';
type GridFilter = {
  key: string;
  label: string;
  allLabel?: string;
  options: Array<{ value: string; label: string }>;
  match: (row: any, value: string) => boolean;
};

const todayMonth = () => new Date().toISOString().slice(0, 7);
const money = (value: unknown) => `$ ${Number(value || 0).toLocaleString('es-AR')}`;
const shortMonth = (value: string) => {
  const [, month] = value.split('-');
  return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][Number(month) - 1] || value;
};
const idOf = (row: any) => String(row?._id || row?.id || '');
const person = (row: any) => row?.owner?.name || row?.user?.name || row?.name || 'Sin nombre';
const unitNames = (row: any) => {
  const units = row?.owner?.units || row?.units;
  if (Array.isArray(units) && units.length) {
    return units.map((unit: any) => typeof unit === 'string' ? unit : unit?.name).filter(Boolean);
  }
  return [row?.owner?.unit, row?.unit].filter(Boolean);
};
const unitLabel = (row: any) => unitNames(row).join(', ') || '-';
const dateLabel = (value: unknown) => value ? new Date(String(value)).toLocaleDateString('es-AR') : '-';
const formObject = (event: FormEvent<HTMLFormElement>) => Object.fromEntries(new FormData(event.currentTarget).entries());

const nav = [
  { key: 'inicio', label: 'Inicio', icon: Home },
  { key: 'finanzas', label: 'Finanzas', icon: CreditCard },
  { key: 'personal', label: 'Personal', icon: UserRoundCog },
  { key: 'comunidad', label: 'Comunidad', icon: Users },
  { key: 'operaciones', label: 'Operaciones', icon: CalendarCheck },
  { key: 'proveedores', label: 'Proveedores', icon: Landmark },
  { key: 'config', label: 'Configuracion', icon: Settings }
] as const;

const defaultFeatures: Record<FeatureKey, boolean> = {
  visits: false,
  reservations: false,
  votes: true,
  claims: true,
  notices: true,
  expenses: true,
  providers: true
};

const statusText: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  cancelled: 'Cancelado',
  inside: 'Dentro',
  exited: 'Salio',
  paid: 'Pagado',
  unpaid: 'Impago',
  closed: 'Cerrado',
  active: 'Activo'
};

const roleLabels: Record<string, string> = {
  security: 'Seguridad',
  cleaning: 'Limpieza',
  admin: 'Administracion',
  maintenance: 'Mantenimiento',
  other: 'Otro'
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  manual: 'Manual',
  mercadopago: 'MercadoPago'
};

function pick<T>(response: any, key: string, fallback: T): T {
  return response?.data?.[key] ?? fallback;
}

function Field(props: { label: string; name: string; type?: string; placeholder?: string; defaultValue?: string | number; required?: boolean }) {
  return (
    <label className="admin-field">
      <span>{props.label}</span>
      <input name={props.name} type={props.type || 'text'} placeholder={props.placeholder} defaultValue={props.defaultValue} required={props.required} />
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

function PaymentChannel({ payment }: { payment: any }) {
  const label = paymentMethodLabels[payment?.paymentMethod] || payment?.paymentMethod || '-';
  const isMpPending = payment?.paymentMethod === 'mercadopago' && payment?.mpStatus === 'approved' && payment?.status === 'pending';
  return (
    <span className={`channel-pill ${isMpPending ? 'mp-pending' : ''}`}>
      {label}{isMpPending ? ' acreditado' : ''}
    </span>
  );
}

function Empty({ text = 'Sin datos para mostrar.' }: { text?: string }) {
  return (
    <div className="admin-empty">
      <Inbox size={28} />
      <span>{text}</span>
    </div>
  );
}

function Status({ value }: { value?: string }) {
  return <span className={`status-pill ${value || 'idle'}`}>{statusText[value || ''] || value || '-'}</span>;
}

function statusFilter(statuses: string[]): GridFilter {
  return {
    key: 'status',
    label: 'Estado',
    allLabel: 'Todos',
    options: statuses.map((value) => ({ value, label: statusText[value] || value })),
    match: (row, value) => row.status === value
  };
}

function categoryFilter(): GridFilter {
  const labels: Record<string, string> = {
    cleaning: 'Limpieza',
    security: 'Seguridad',
    maintenance: 'Mantenimiento',
    utilities: 'Servicios',
    administration: 'Administracion',
    other: 'Otros'
  };
  return {
    key: 'category',
    label: 'Categoria',
    allLabel: 'Todas',
    options: Object.entries(labels).map(([value, label]) => ({ value, label })),
    match: (row, value) => row.category === value
  };
}

function tagFilter(tags: string[]): GridFilter {
  const labels: Record<string, string> = { info: 'Info', warning: 'Advertencia', urgent: 'Urgente' };
  return {
    key: 'tag',
    label: 'Tipo',
    allLabel: 'Todos',
    options: tags.map((value) => ({ value, label: labels[value] || value })),
    match: (row, value) => row.tag === value
  };
}

function monthFilter(getValue: (row: any) => string, optionMonth = todayMonth()): GridFilter {
  return {
    key: 'month',
    label: 'Periodo',
    allLabel: 'Todos',
    options: [{ value: optionMonth, label: optionMonth }],
    match: (row, value) => getValue(row) === value
  };
}

function dateFilter(getValue: (row: any) => string): GridFilter {
  const today = new Date().toISOString().slice(0, 10);
  return {
    key: 'date',
    label: 'Fecha',
    allLabel: 'Todas',
    options: [{ value: today, label: 'Hoy' }],
    match: (row, value) => getValue(row) === value
  };
}

function roleLabel(employee: any) {
  if (!employee) return '-';
  return employee.role === 'other' && employee.customRole ? employee.customRole : (roleLabels[employee.role] || employee.role || '-');
}

function uniqueOptions(rows: any[], getValue: (row: any) => string | undefined) {
  return Array.from(new Set((rows || []).map(getValue).filter(Boolean)))
    .sort()
    .map((value) => ({ value: String(value), label: String(value) }));
}

function sortPayments(rows: any[] = []) {
  const priority: Record<string, number> = { pending: 0, approved: 1, rejected: 2 };
  return [...rows].sort((a, b) => {
    const statusDiff = (priority[a?.status] ?? 9) - (priority[b?.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime();
  });
}

function sortExpenses(rows: any[] = []) {
  const priority: Record<string, number> = { pending: 0, unpaid: 1, paid: 2 };
  return [...rows].sort((a, b) => {
    const statusDiff = (priority[a?.status] ?? 9) - (priority[b?.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;
    return new Date(b?.createdAt || b?.date || 0).getTime() - new Date(a?.createdAt || a?.date || 0).getTime();
  });
}

function revenueMonths(rows: any[] = [], selectedYear: number) {
  const byMonth = new Map(rows.map((item) => [String(item._id), item]));
  return Array.from({ length: 12 }, (_, index) => {
    const key = `${selectedYear}-${String(index + 1).padStart(2, '0')}`;
    return {
      _id: key,
      total: 0,
      count: 0,
      pending: 0,
      rejected: 0,
      ...byMonth.get(key)
    };
  });
}

function orgIdFromSession(me: any, config: any) {
  const membershipOrg = me?.data?.membership?.organization;
  const userOrg = me?.data?.user?.organization;
  return config?.orgId
    || (typeof membershipOrg === 'string' ? membershipOrg : membershipOrg?._id)
    || (typeof userOrg === 'string' ? userOrg : userOrg?._id)
    || '';
}

export function AdminPreviewPage() {
  const [tab, setTab] = useState<TabKey>('inicio');
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [month, setMonth] = useState(todayMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [ownerUnitFilter, setOwnerUnitFilter] = useState('');
  const [ownerSelectedUnitIds, setOwnerSelectedUnitIds] = useState<Set<string>>(new Set());
  const [state, setState] = useState<any>({
    me: null, config: {}, ownerStats: {}, dashboard: {}, report: {},
    owners: [], units: [], payments: [], notices: [], claims: [], expenses: [],
    employees: [], salaries: [], providers: [], votes: [], visits: [], spaces: [], reservations: [],
    features: defaultFeatures
  });

  const moduleEnabled = (key: FeatureKey) => state.features?.[key] ?? defaultFeatures[key];
  const hasOperations = moduleEnabled('votes') || moduleEnabled('reservations') || moduleEnabled('visits');
  const visibleNav = nav.filter((item) => {
    if (item.key === 'operaciones') return hasOperations;
    if (item.key === 'proveedores') return moduleEnabled('providers');
    return true;
  });

  const totalIncome = useMemo(
    () => (state.dashboard?.monthly || []).reduce((sum: number, item: any) => sum + Number(item.total || 0), 0),
    [state.dashboard]
  );
  const availableOwnerUnits = useMemo(
    () => [...(state.units || [])]
      .filter((unit: any) => !unit.owner && unit.status !== 'occupied')
      .sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' })),
    [state.units]
  );
  const filteredOwnerUnits = useMemo(() => {
    const query = ownerUnitFilter.trim().toLowerCase();
    return query
      ? availableOwnerUnits.filter((unit: any) => String(unit.name || '').toLowerCase().includes(query))
      : availableOwnerUnits;
  }, [availableOwnerUnits, ownerUnitFilter]);
  const selectedOwnerUnits = useMemo(
    () => availableOwnerUnits.filter((unit: any) => ownerSelectedUnitIds.has(idOf(unit))),
    [availableOwnerUnits, ownerSelectedUnitIds]
  );

  function toggleOwnerUnit(unitId: string) {
    setOwnerSelectedUnitIds((current) => {
      const next = new Set(current);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }

  async function refresh(target: TabKey = tab) {
    setLoading(true);
    try {
      const [me, config] = await Promise.all([
        adminApi.me(),
        adminApi.config.get()
      ]);
      const configData = pick(config, 'config', {});
      const orgId = orgIdFromSession(me, configData);
      const featuresRes = orgId ? await adminApi.organizations.features(orgId) : null;
      const features = { ...defaultFeatures, ...pick<Record<string, boolean>>(featuresRes, 'features', {}) };
      const isEnabled = (key: FeatureKey) => features[key] ?? defaultFeatures[key];

      const [ownerStats, dashboard, payments, report, claims, notices] = await Promise.all([
        adminApi.owners.stats(),
        adminApi.payments.dashboard(year),
        adminApi.payments.list({ limit: 8, status: 'pending' }),
        adminApi.reports.monthly(month),
        isEnabled('claims') ? adminApi.claims.list({ limit: 8, status: 'open' }) : Promise.resolve(null),
        isEnabled('notices') ? adminApi.notices.list({ limit: 5 }) : Promise.resolve(null)
      ]);
      const next: any = {
        me: me?.data?.user,
        membership: me?.data?.membership,
        config: configData,
        features,
        ownerStats: ownerStats?.data || {},
        dashboard: dashboard?.data || {},
        payments: sortPayments(pick(payments, 'payments', [])),
        claims: isEnabled('claims') ? pick(claims, 'claims', []) : [],
        notices: isEnabled('notices') ? pick(notices, 'notices', []) : [],
        report: report?.data || {}
      };

      if (target === 'comunidad' || target === 'inicio') {
        const [owners, units, allClaims, allNotices] = await Promise.all([
          adminApi.owners.list({ limit: 50 }),
          adminApi.units.list({ limit: 200 }),
          isEnabled('claims') ? adminApi.claims.list({ limit: 50 }) : Promise.resolve(null),
          isEnabled('notices') ? adminApi.notices.list({ limit: 50 }) : Promise.resolve(null)
        ]);
        next.owners = pick(owners, 'owners', []);
        next.units = pick(units, 'units', []);
        next.claims = isEnabled('claims') ? pick(allClaims, 'claims', next.claims) : [];
        next.notices = isEnabled('notices') ? pick(allNotices, 'notices', next.notices) : [];
      }

      if (target === 'finanzas') {
        const [allPayments, expenses] = await Promise.all([
          adminApi.payments.list({ limit: 100, effectiveMonth: month }),
          adminApi.expenses.list({ limit: 50, month })
        ]);
        next.payments = sortPayments(pick(allPayments, 'payments', []));
        next.expenses = sortExpenses(pick(expenses, 'expenses', []));
      }

      if (target === 'personal') {
        const [employees, salaries] = await Promise.all([
          adminApi.employees.list({ isActive: '', limit: 200 }),
          adminApi.salaries.list({ limit: 200, period: month })
        ]);
        next.employees = pick(employees, 'employees', []);
        next.salaries = pick(salaries, 'salaries', []);
      }

      if (target === 'operaciones') {
        const [votes, visits, spaces, reservations] = await Promise.all([
          isEnabled('votes') ? adminApi.votes.list({ limit: 50 }) : Promise.resolve(null),
          isEnabled('visits') ? adminApi.visits.list({ limit: 50 }) : Promise.resolve(null),
          isEnabled('reservations') ? adminApi.spaces.list() : Promise.resolve(null),
          isEnabled('reservations') ? adminApi.reservations.list({ limit: 50 }) : Promise.resolve(null)
        ]);
        next.votes = isEnabled('votes') ? pick(votes, 'votes', []) : [];
        next.visits = isEnabled('visits') ? pick(visits, 'visits', []) : [];
        next.spaces = isEnabled('reservations') ? pick(spaces, 'spaces', []) : [];
        next.reservations = isEnabled('reservations') ? pick(reservations, 'reservations', []) : [];
      }

      if (target === 'proveedores') {
        if (isEnabled('providers')) {
          const providers = await adminApi.providers.list();
          next.providers = pick(providers, 'providers', []);
        } else {
          next.providers = [];
        }
      }

      if (target === 'config') {
        const [units, owners] = await Promise.all([
          adminApi.units.list({ limit: 100 }),
          adminApi.owners.list({ limit: 100 })
        ]);
        next.units = pick(units, 'units', []);
        next.owners = pick(owners, 'owners', []);
      }

      setState((current: any) => ({ ...current, ...next }));
      setNotice(null);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo cargar el dashboard.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('gestionar_token')) {
      window.location.assign('/login');
      return;
    }
    adminApi.me()
      .then((response) => {
        const user = response?.data?.user;
        if (isSuperAdminRole(user?.role)) {
          window.location.assign('/super-admin');
          return;
        }
        setState((current: any) => ({ ...current, me: user, membership: response?.data?.membership }));
        setAuthChecked(true);
      })
      .catch(() => {
        localStorage.removeItem('gestionar_token');
        window.location.assign('/login');
      });
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    refresh(tab);
  }, [authChecked, tab, month, year]);

  useEffect(() => {
    if (tab === 'operaciones' && !hasOperations) setTab('inicio');
    if (tab === 'proveedores' && !moduleEnabled('providers')) setTab('inicio');
  }, [tab, hasOperations, state.features]);

  async function run(label: string, action: () => Promise<unknown>, success = 'Cambios guardados.') {
    setBusy(label);
    try {
      await action();
      setNotice({ type: 'ok', text: success });
      await refresh(tab);
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

  async function downloadReport() {
    await run('pdf', async () => {
      const blob = await adminApi.reports.expensasPdf(month);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `liquidacion_expensas_${month}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    }, 'PDF generado.');
  }

  function submitOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formObject(event);
    run('owner', async () => {
      await adminApi.owners.create({
        ...data,
        unitIds: [...ownerSelectedUnitIds]
      });
      setOwnerSelectedUnitIds(new Set());
      setOwnerUnitFilter('');
      form.reset();
    }, 'Propietario creado con unidades seleccionadas.');
  }

  function submitNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('notice', () => adminApi.notices.create({ ...data, sendPush: true, sendEmail: true }), 'Comunicado publicado.');
    event.currentTarget.reset();
  }

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('expense', () => adminApi.expenses.create({ ...data, amount: Number(data.amount) }), 'Gasto registrado.');
    event.currentTarget.reset();
  }

  function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('provider', () => adminApi.providers.create(data), 'Proveedor creado.');
    event.currentTarget.reset();
  }

  function submitEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('employee', () => adminApi.employees.create({
      name: data.name,
      role: data.role,
      customRole: data.customRole || undefined,
      documentNumber: data.documentNumber || undefined,
      phone: data.phone || undefined,
      email: data.email || undefined,
      startDate: data.startDate || undefined,
      notes: data.notes || undefined
    }), 'Empleado creado.');
    event.currentTarget.reset();
  }

  function submitSalary(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('salary', () => adminApi.salaries.create({
      employeeId: data.employeeId,
      period: data.period,
      baseAmount: Number(data.baseAmount || 0),
      extraAmount: Number(data.extraAmount || 0),
      deductions: Number(data.deductions || 0),
      paymentMethod: data.paymentMethod || undefined,
      notes: data.notes || undefined
    }), 'Liquidacion creada.');
    event.currentTarget.reset();
  }

  function editEmployee(employee: any) {
    const name = window.prompt('Nombre del empleado', employee.name || '');
    if (name === null) return;
    const phone = window.prompt('Telefono', employee.phone || '');
    if (phone === null) return;
    const email = window.prompt('Email', employee.email || '');
    if (email === null) return;
    run(idOf(employee), () => adminApi.employees.update(idOf(employee), {
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined
    }), 'Empleado actualizado.');
  }

  function editSalary(salary: any) {
    const baseAmount = window.prompt('Monto base', String(salary.baseAmount ?? 0));
    if (baseAmount === null) return;
    const extraAmount = window.prompt('Extras', String(salary.extraAmount ?? 0));
    if (extraAmount === null) return;
    const deductions = window.prompt('Descuentos', String(salary.deductions ?? 0));
    if (deductions === null) return;
    run(idOf(salary), () => adminApi.salaries.update(idOf(salary), {
      baseAmount: Number(baseAmount || 0),
      extraAmount: Number(extraAmount || 0),
      deductions: Number(deductions || 0)
    }), 'Liquidacion actualizada.');
  }

  function submitVote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    const options = String(data.options || '').split('\n').map((item) => item.trim()).filter(Boolean);
    run('vote', () => adminApi.votes.create({ title: data.title, description: data.description, options, endsAt: data.endsAt || undefined }), 'Votacion creada.');
    event.currentTarget.reset();
  }

  function submitSpace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('space', () => adminApi.spaces.create({
      ...data,
      capacity: data.capacity ? Number(data.capacity) : undefined,
      requiresApproval: data.requiresApproval === 'on'
    }), 'Espacio creado.');
    event.currentTarget.reset();
  }

  function submitUnit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('unit', () => adminApi.units.create({
      name: data.name,
      ownerId: data.owner || undefined,
      coefficient: data.coefficient ? Number(data.coefficient) : undefined,
      customFee: data.customFee ? Number(data.customFee) : undefined
    }), 'Unidad creada.');
    event.currentTarget.reset();
  }

  function submitConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('config', () => adminApi.config.update({
      ...data,
      monthlyFee: Number(data.monthlyFee || 0),
      expenseAmount: Number(data.monthlyFee || 0),
      dueDayOfMonth: Number(data.dueDayOfMonth || 10),
      lateFeePercent: Number(data.lateFeePercent || 0),
      lateFeeFixed: Number(data.lateFeeFixed || 0)
    }), 'Configuracion actualizada.');
  }

  return (
    <main className={`admin-shell${busy ? ' is-busy' : ''}`}>
      <aside className="admin-sidebar">
        <a className="logo admin-logo" href="/">
          <span className="logo-mark" /> Gestion<span className="ar">ar</span>
        </a>
        <nav>
          {visibleNav.map((item) => (
            <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => setTab(item.key)}>
              <item.icon size={18} /> <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">{state.config?.consortiumName || 'Panel web'}</span>
            <h1>{visibleNav.find((item) => item.key === tab)?.label || nav.find((item) => item.key === tab)?.label}</h1>
          </div>
          <div className="admin-actions">
            <button className="icon-btn" onClick={() => refresh(tab)} title="Actualizar"><RefreshCw size={18} /></button>
            <button className="btn btn-ghost" onClick={logout}><LogOut size={17} /> Salir</button>
          </div>
        </header>

        {busy && <BusyBanner />}
        {notice && <div className={`admin-notice ${notice.type}`}>{notice.text}</div>}
        {tab === 'inicio' && (
          <>
            <section className="admin-hero">
              <div>
                <span className="admin-kicker">Hola, {state.me?.name?.split(' ')[0] || 'admin'}</span>
                <h2>Control operativo y financiero de {state.config?.consortiumName || 'tu organizacion'}.</h2>
              </div>
              <button className="btn btn-primary" onClick={() => setTab('finanzas')}><CreditCard size={18} /> Revisar pagos</button>
            </section>

            <div className="metric-grid">
              <Metric loading={loading} label="Recaudacion anual" value={money(totalIncome)} hint={`${state.dashboard?.approved || 0} pagos aprobados`} icon={ShieldCheck} />
              <Metric loading={loading} label="Pagos pendientes" value={state.dashboard?.pending || 0} hint="MP acreditado queda en revision" icon={CreditCard} />
              <Metric loading={loading} label="Propietarios" value={state.ownerStats?.totalOwners || state.owners?.length || 0} hint={`${state.ownerStats?.upToDate || 0} al dia`} icon={Users} />
              {moduleEnabled('claims') && <Metric loading={loading} label="Reclamos abiertos" value={state.claims?.length || 0} hint="Comunidad" icon={MessageSquare} />}
            </div>

            <div className="admin-grid two">
              <Panel title="Recaudacion mensual" icon={FileText}>
                <MiniChart
                  loading={loading}
                  rows={revenueMonths(state.dashboard?.monthly || [], state.dashboard?.year || year)}
                  selectedMonth={month}
                  onSelect={(selected) => {
                    setMonth(selected);
                    setTab('finanzas');
                  }}
                />
              </Panel>
              <Panel title="Pendientes criticos" icon={Bell}>
                <CompactList loading={loading} rows={[...state.payments, ...(moduleEnabled('claims') ? state.claims : [])].slice(0, 7)} />
              </Panel>
            </div>
          </>
        )}

        {tab === 'finanzas' && (
          <div className="admin-grid">
            <Panel title="Indicadores" icon={CreditCard} action={<YearMonth year={year} setYear={setYear} month={month} setMonth={setMonth} />}>
              <div className="metric-grid compact">
                <Metric loading={loading} label="Ingresos" value={money(state.report?.income?.total)} hint={month} icon={CreditCard} />
                <Metric loading={loading} label="Egresos" value={money(state.report?.expenses?.total)} hint="Pagados" icon={FileText} />
                <Metric loading={loading} label="Saldo" value={money(state.report?.balance)} hint="Mensual acumulado" icon={Landmark} />
              </div>
              <button className="btn btn-primary" onClick={downloadReport} disabled={busy === 'pdf'}><FileText size={17} /> Descargar expensas PDF</button>
            </Panel>

            <Panel title="Pagos" icon={CreditCard} action={<button className="btn btn-ghost" onClick={() => run('reminders', adminApi.payments.reminders, 'Recordatorios enviados.')}>Enviar recordatorios</button>}>
              <Table loading={loading} searchPlaceholder="Buscar propietario, unidad o periodo" filters={[
                statusFilter(['pending', 'approved', 'rejected']),
                monthFilter((p) => p.month || String(p.createdAt || '').slice(0, 7), month)
              ]} rows={state.payments} columns={[
                ['Propietario', (p: any) => person(p)],
                ['Unidad', (p: any) => unitLabel(p)],
                ['Periodo', (p: any) => p.month || dateLabel(p.createdAt)],
                ['Monto', (p: any) => money(p.amount)],
                ['Canal', (p: any) => <PaymentChannel payment={p} />],
                ['Estado', (p: any) => <Status value={p.status} />],
                ['Acciones', (p: any) => p.status === 'pending' ? <Actions>
                  <button onClick={() => run(idOf(p), () => adminApi.payments.approve(idOf(p)), 'Pago aprobado.')}>Aprobar</button>
                  <button onClick={() => run(idOf(p), () => adminApi.payments.reject(idOf(p), window.prompt('Motivo de rechazo') || 'Rechazado'), 'Pago rechazado.')}>Rechazar</button>
                </Actions> : null]
              ]} />
            </Panel>

            <Panel title="Registrar gasto" icon={FileText}>
              <form className="admin-form" onSubmit={submitExpense}>
                <Field label="Descripcion" name="description" required />
                <Field label="Monto" name="amount" type="number" required />
                <Field label="Fecha" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                <SelectField label="Categoria" name="category" defaultValue="maintenance">
                  <option value="cleaning">Limpieza</option><option value="security">Seguridad</option><option value="maintenance">Mantenimiento</option><option value="utilities">Servicios</option><option value="administration">Administracion</option><option value="other">Otros</option>
                </SelectField>
                <button className="btn btn-primary" disabled={busy === 'expense'}>Guardar gasto</button>
              </form>
            </Panel>

            <Panel title="Gastos" icon={FileText}>
              <Table loading={loading} searchPlaceholder="Buscar descripcion, categoria o proveedor" filters={[
                statusFilter(['paid', 'unpaid', 'pending']),
                categoryFilter()
              ]} rows={state.expenses} columns={[
                ['Descripcion', (e: any) => e.description],
                ['Categoria', (e: any) => e.category],
                ['Monto', (e: any) => money(e.amount)],
                ['Estado', (e: any) => <Status value={e.status} />],
                ['Acciones', (e: any) => e.status === 'pending' ? <Actions>
                  <button onClick={() => run(idOf(e), () => adminApi.expenses.paid(idOf(e)), 'Gasto marcado como pagado.')}>Pagar</button>
                  <button onClick={() => run(idOf(e), () => adminApi.expenses.delete(idOf(e)), 'Gasto eliminado.')}>Eliminar</button>
                </Actions> : null]
              ]} />
            </Panel>
          </div>
        )}

        {tab === 'personal' && (
          <div className="admin-grid">
            <Panel title="Nuevo empleado" icon={UserRoundCog}>
              <form className="admin-form" onSubmit={submitEmployee}>
                <Field label="Nombre" name="name" required />
                <SelectField label="Rol" name="role" defaultValue="maintenance">
                  {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </SelectField>
                <Field label="Rol personalizado" name="customRole" placeholder="Jardinero" />
                <Field label="DNI" name="documentNumber" />
                <Field label="Telefono" name="phone" />
                <Field label="Email" name="email" type="email" />
                <Field label="Fecha de inicio" name="startDate" type="date" />
                <label className="admin-field full"><span>Notas</span><textarea name="notes" rows={2} /></label>
                <button className="btn btn-primary" disabled={busy === 'employee'}>Crear empleado</button>
              </form>
            </Panel>

            <Panel title="Nueva liquidacion" icon={WalletCards}>
              <form className="admin-form" onSubmit={submitSalary}>
                <SelectField label="Empleado" name="employeeId">
                  <option value="">Seleccionar</option>
                  {state.employees.filter((employee: any) => employee.isActive).map((employee: any) => (
                    <option key={idOf(employee)} value={idOf(employee)}>{employee.name} ({roleLabel(employee)})</option>
                  ))}
                </SelectField>
                <Field label="Periodo" name="period" type="month" defaultValue={month} required />
                <Field label="Monto base" name="baseAmount" type="number" required />
                <Field label="Extras" name="extraAmount" type="number" defaultValue={0} />
                <Field label="Descuentos" name="deductions" type="number" defaultValue={0} />
                <SelectField label="Metodo de pago" name="paymentMethod">
                  <option value="">Sin especificar</option>
                  <option value="cash">Efectivo</option>
                  <option value="transfer">Transferencia</option>
                </SelectField>
                <label className="admin-field full"><span>Notas</span><textarea name="notes" rows={2} /></label>
                <button className="btn btn-primary" disabled={busy === 'salary'}>Crear liquidacion</button>
              </form>
            </Panel>

            <Panel title="Empleados" icon={UserRoundCog}>
              <Table loading={loading} searchPlaceholder="Buscar empleado, rol o DNI" filters={[
                {
                  key: 'role',
                  label: 'Rol',
                  allLabel: 'Todos los roles',
                  options: Object.entries(roleLabels).map(([value, label]) => ({ value, label })),
                  match: (row, value) => row.role === value
                },
                {
                  key: 'active',
                  label: 'Estado',
                  allLabel: 'Todos',
                  options: [{ value: 'yes', label: 'Activos' }, { value: 'no', label: 'Dados de baja' }],
                  match: (row, value) => value === 'yes' ? !!row.isActive : !row.isActive
                }
              ]} rows={state.employees} columns={[
                ['Nombre', (e: any) => e.name],
                ['Rol', (e: any) => roleLabel(e)],
                ['DNI', (e: any) => e.documentNumber || '-'],
                ['Telefono', (e: any) => e.phone || '-'],
                ['Inicio', (e: any) => dateLabel(e.startDate)],
                ['Estado', (e: any) => <Status value={e.isActive ? 'active' : 'cancelled'} />],
                ['Acciones', (e: any) => <Actions>
                  <button onClick={() => editEmployee(e)}>Editar</button>
                  {e.isActive
                    ? <button className="danger-action" onClick={() => run(idOf(e), () => adminApi.employees.delete(idOf(e)), 'Empleado dado de baja.')}>Baja</button>
                    : <button onClick={() => run(idOf(e), () => adminApi.employees.update(idOf(e), { isActive: true, endDate: null }), 'Empleado reactivado.')}>Reactivar</button>}
                </Actions>]
              ]} />
            </Panel>

            <Panel
              title="Sueldos"
              icon={WalletCards}
              action={<div className="period-controls"><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></div>}
            >
              <div className="metric-grid compact">
                <Metric loading={loading} label="Pendiente" value={money(state.salaries.filter((s: any) => s.status === 'pending').reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0))} hint={month} icon={WalletCards} />
                <Metric loading={loading} label="Pagado" value={money(state.salaries.filter((s: any) => s.status === 'paid').reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0))} hint="Sincroniza gastos" icon={ShieldCheck} />
                <Metric loading={loading} label="Liquidaciones" value={state.salaries.length || 0} hint="Periodo visible" icon={FileText} />
              </div>
              <Table loading={loading} searchPlaceholder="Buscar empleado o periodo" filters={[
                statusFilter(['pending', 'paid', 'cancelled']),
                monthFilter((s) => s.period || '', month)
              ]} rows={state.salaries} columns={[
                ['Periodo', (s: any) => s.period],
                ['Empleado', (s: any) => s.employee?.name || '-'],
                ['Rol', (s: any) => roleLabel(s.employee)],
                ['Base', (s: any) => money(s.baseAmount)],
                ['Extras', (s: any) => money(s.extraAmount)],
                ['Desc.', (s: any) => money(s.deductions)],
                ['Total', (s: any) => money(s.totalAmount)],
                ['Metodo', (s: any) => paymentMethodLabels[s.paymentMethod] || '-'],
                ['Estado', (s: any) => <Status value={s.status} />],
                ['Acciones', (s: any) => <Actions>
                  {s.status === 'pending' && <button onClick={() => editSalary(s)}>Editar</button>}
                  {s.status === 'pending' && <button onClick={() => run(idOf(s), () => adminApi.salaries.update(idOf(s), { status: 'paid', paymentDate: new Date().toISOString().slice(0, 10) }), 'Sueldo marcado como pagado.')}>Pagar</button>}
                  {s.status !== 'cancelled' && <button className="danger-action" onClick={() => run(idOf(s), () => adminApi.salaries.delete(idOf(s)), 'Liquidacion cancelada.')}>Cancelar</button>}
                </Actions>]
              ]} />
            </Panel>
          </div>
        )}

        {tab === 'comunidad' && (
          <div className="admin-grid">
            <Panel title="Nuevo propietario" icon={Users}>
              <form className="admin-form" onSubmit={submitOwner}>
                <Field label="Nombre" name="name" required />
                <Field label="Email" name="email" type="email" required />
                <Field label="Telefono" name="phone" />
                <Field label="Contrasena temporal" name="password" type="password" required />
                <div className="admin-field full">
                  <span>Unidades</span>
                  <div className="unit-picker">
                    <input
                      type="search"
                      placeholder="Buscar unidad disponible"
                      value={ownerUnitFilter}
                      onChange={(event) => setOwnerUnitFilter(event.target.value)}
                    />
                    {selectedOwnerUnits.length > 0 && (
                      <div className="unit-picker-chips">
                        {selectedOwnerUnits.map((unit: any) => (
                          <button type="button" key={idOf(unit)} onClick={() => toggleOwnerUnit(idOf(unit))}>
                            {unit.name} ×
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="unit-picker-list">
                      {filteredOwnerUnits.length ? filteredOwnerUnits.slice(0, 24).map((unit: any) => {
                        const unitId = idOf(unit);
                        const selected = ownerSelectedUnitIds.has(unitId);
                        return (
                          <button
                            type="button"
                            key={unitId}
                            className={selected ? 'selected' : ''}
                            onClick={() => toggleOwnerUnit(unitId)}
                          >
                            <input type="checkbox" tabIndex={-1} checked={selected} readOnly />
                            <span>{unit.name}</span>
                          </button>
                        );
                      }) : <Empty text="No hay unidades disponibles con ese filtro." />}
                    </div>
                    <small>{availableOwnerUnits.length} disponibles · {state.units.length - availableOwnerUnits.length} ocupadas.</small>
                  </div>
                </div>
                <button className="btn btn-primary" disabled={busy === 'owner'}>Crear propietario</button>
              </form>
            </Panel>
            <Panel title="Propietarios" icon={Users}>
              <Table loading={loading} searchPlaceholder="Buscar nombre, email o unidad" filters={[
                {
                  key: 'debt',
                  label: 'Deuda',
                  allLabel: 'Todos',
                  options: [{ value: 'debtor', label: 'Con deuda' }, { value: 'clear', label: 'Al dia' }],
                  match: (row, value) => value === 'debtor' ? !!row.isDebtor || Number(row.balance || 0) > 0 : !row.isDebtor && Number(row.balance || 0) <= 0
                }
              ]} rows={state.owners} columns={[
                ['Nombre', (o: any) => o.name],
                ['Email', (o: any) => o.email],
                ['Unidades', (o: any) => unitLabel(o)],
                ['Saldo', (o: any) => money(o.balance)],
                ['Acciones', (o: any) => <Actions><button onClick={() => run(idOf(o), () => adminApi.owners.delete(idOf(o)), 'Propietario eliminado.')}>Eliminar</button></Actions>]
              ]} />
            </Panel>
            {moduleEnabled('notices') && <Panel title="Nuevo comunicado" icon={Megaphone}>
              <form className="admin-form" onSubmit={submitNotice}>
                <Field label="Titulo" name="title" required />
                <SelectField label="Prioridad" name="tag" defaultValue="info"><option value="info">Info</option><option value="warning">Advertencia</option><option value="urgent">Urgente</option></SelectField>
                <label className="admin-field full"><span>Mensaje</span><textarea name="body" rows={4} required /></label>
                <button className="btn btn-primary" disabled={busy === 'notice'}>Publicar</button>
              </form>
            </Panel>}
            {moduleEnabled('notices') && <Panel title="Comunicados" icon={Bell}>
              <Table loading={loading} searchPlaceholder="Buscar comunicado" filters={[
                tagFilter(['info', 'warning', 'urgent'])
              ]} rows={state.notices} columns={[
                ['Titulo', (n: any) => n.title],
                ['Tipo', (n: any) => n.tag],
                ['Fecha', (n: any) => dateLabel(n.createdAt)],
                ['Acciones', (n: any) => <Actions><button onClick={() => run(idOf(n), () => adminApi.notices.delete(idOf(n)), 'Comunicado eliminado.')}>Eliminar</button></Actions>]
              ]} />
            </Panel>}
            {moduleEnabled('claims') && <Panel title="Reclamos" icon={MessageSquare}>
              <Table loading={loading} searchPlaceholder="Buscar reclamo o propietario" filters={[
                statusFilter(['open', 'in_progress', 'resolved'])
              ]} rows={state.claims} columns={[
                ['Titulo', (c: any) => c.title],
                ['Propietario', (c: any) => person(c)],
                ['Estado', (c: any) => <Status value={c.status} />],
                ['Acciones', (c: any) => <Actions>
                  <button onClick={() => run(idOf(c), () => adminApi.claims.status(idOf(c), 'in_progress'), 'Reclamo en progreso.')}>En progreso</button>
                  <button onClick={() => run(idOf(c), () => adminApi.claims.status(idOf(c), 'resolved', window.prompt('Nota para el propietario') || ''), 'Reclamo resuelto.')}>Resolver</button>
                </Actions>]
              ]} />
            </Panel>}
          </div>
        )}

        {tab === 'operaciones' && (
          <div className="admin-grid">
            {!hasOperations && <Empty text="No hay modulos operativos habilitados para esta organizacion." />}
            {moduleEnabled('votes') && <Panel title="Nueva votacion" icon={Vote}>
              <form className="admin-form" onSubmit={submitVote}>
                <Field label="Titulo" name="title" required />
                <Field label="Cierre" name="endsAt" type="datetime-local" />
                <label className="admin-field full"><span>Descripcion</span><textarea name="description" rows={2} /></label>
                <label className="admin-field full"><span>Opciones, una por linea</span><textarea name="options" rows={4} required /></label>
                <button className="btn btn-primary" disabled={busy === 'vote'}>Crear votacion</button>
              </form>
            </Panel>}
            {moduleEnabled('votes') && <Panel title="Votaciones" icon={Vote}>
              <Table loading={loading} searchPlaceholder="Buscar votacion" filters={[
                statusFilter(['open', 'closed'])
              ]} rows={state.votes} columns={[
                ['Titulo', (v: any) => v.title],
                ['Estado', (v: any) => <Status value={v.status} />],
                ['Cierre', (v: any) => dateLabel(v.endsAt)],
                ['Acciones', (v: any) => <Actions>
                  <button onClick={() => run(idOf(v), () => adminApi.votes.close(idOf(v)), 'Votacion cerrada.')}>Cerrar</button>
                  <button onClick={() => run(idOf(v), () => adminApi.votes.delete(idOf(v)), 'Votacion eliminada.')}>Eliminar</button>
                </Actions>]
              ]} />
            </Panel>}
            {moduleEnabled('reservations') && <Panel title="Nuevo espacio" icon={Building2}>
              <form className="admin-form" onSubmit={submitSpace}>
                <Field label="Nombre" name="name" required />
                <Field label="Capacidad" name="capacity" type="number" />
                <label className="admin-field full"><span>Descripcion</span><textarea name="description" rows={2} /></label>
                <label className="admin-check"><input name="requiresApproval" type="checkbox" /> Requiere aprobacion</label>
                <button className="btn btn-primary" disabled={busy === 'space'}>Crear espacio</button>
              </form>
            </Panel>}
            {moduleEnabled('reservations') && <Panel title="Espacios" icon={Building2}>
              <Table loading={loading} searchPlaceholder="Buscar espacio" filters={[
                {
                  key: 'approval',
                  label: 'Aprobacion',
                  allLabel: 'Todos',
                  options: [{ value: 'yes', label: 'Requiere' }, { value: 'no', label: 'Automatica' }],
                  match: (row, value) => value === 'yes' ? !!row.requiresApproval : !row.requiresApproval
                }
              ]} rows={state.spaces} columns={[
                ['Nombre', (s: any) => s.name],
                ['Capacidad', (s: any) => s.capacity || '-'],
                ['Aprobacion', (s: any) => s.requiresApproval ? 'Si' : 'No'],
                ['Acciones', (s: any) => <Actions><button onClick={() => run(idOf(s), () => adminApi.spaces.delete(idOf(s)), 'Espacio eliminado.')}>Eliminar</button></Actions>]
              ]} />
            </Panel>}
            {moduleEnabled('reservations') && <Panel title="Reservas" icon={CalendarCheck}>
              <Table loading={loading} searchPlaceholder="Buscar reserva, espacio o propietario" filters={[
                statusFilter(['pending', 'approved', 'rejected', 'cancelled']),
                dateFilter((r) => r.date)
              ]} rows={state.reservations} columns={[
                ['Espacio', (r: any) => r.space?.name],
                ['Propietario', (r: any) => person(r)],
                ['Fecha', (r: any) => `${r.date || '-'} ${r.startTime || ''}`],
                ['Estado', (r: any) => <Status value={r.status} />],
                ['Acciones', (r: any) => <Actions>
                  <button onClick={() => run(idOf(r), () => adminApi.reservations.status(idOf(r), 'approved'), 'Reserva aprobada.')}>Aprobar</button>
                  <button onClick={() => run(idOf(r), () => adminApi.reservations.status(idOf(r), 'rejected'), 'Reserva rechazada.')}>Rechazar</button>
                </Actions>]
              ]} />
            </Panel>}
            {moduleEnabled('visits') && <Panel title="Visitas" icon={ShieldCheck}>
              <Table loading={loading} searchPlaceholder="Buscar visitante o propietario" filters={[
                statusFilter(['pending', 'approved', 'rejected', 'inside', 'exited']),
                dateFilter((v) => String(v.expectedDate || '').slice(0, 10))
              ]} rows={state.visits} columns={[
                ['Visitante', (v: any) => v.visitorName || v.name],
                ['Propietario', (v: any) => person(v)],
                ['Fecha', (v: any) => dateLabel(v.expectedDate)],
                ['Estado', (v: any) => <Status value={v.status} />],
                ['Acciones', (v: any) => <Actions>
                  <button onClick={() => run(idOf(v), () => adminApi.visits.status(idOf(v), 'approved'), 'Visita aprobada.')}>Aprobar</button>
                  <button onClick={() => run(idOf(v), () => adminApi.visits.status(idOf(v), 'rejected'), 'Visita rechazada.')}>Rechazar</button>
                  <button onClick={() => run(idOf(v), () => adminApi.visits.status(idOf(v), 'inside'), 'Visita ingresada.')}>Ingreso</button>
                  <button onClick={() => run(idOf(v), () => adminApi.visits.status(idOf(v), 'exited'), 'Visita egresada.')}>Egreso</button>
                </Actions>]
              ]} />
            </Panel>}
          </div>
        )}

        {tab === 'proveedores' && (
          <div className="admin-grid two">
            <Panel title="Nuevo proveedor" icon={Landmark}>
              <form className="admin-form" onSubmit={submitProvider}>
                <Field label="Nombre" name="name" required />
                <Field label="Servicio" name="serviceType" required />
                <Field label="CUIT" name="cuit" />
                <Field label="Telefono" name="phone" />
                <Field label="Email" name="email" type="email" />
                <button className="btn btn-primary" disabled={busy === 'provider'}>Crear proveedor</button>
              </form>
            </Panel>
            <Panel title="Proveedores" icon={Landmark}>
              <Table loading={loading} searchPlaceholder="Buscar proveedor, servicio o contacto" filters={[
                {
                  key: 'service',
                  label: 'Servicio',
                  allLabel: 'Todos',
                  options: uniqueOptions(state.providers, (p: any) => p.serviceType),
                  match: (row, value) => row.serviceType === value
                }
              ]} rows={state.providers} columns={[
                ['Nombre', (p: any) => p.name],
                ['Servicio', (p: any) => p.serviceType],
                ['Contacto', (p: any) => p.phone || p.email || '-'],
                ['Acciones', (p: any) => <Actions><button onClick={() => run(idOf(p), () => adminApi.providers.delete(idOf(p)), 'Proveedor eliminado.')}>Eliminar</button></Actions>]
              ]} />
            </Panel>
          </div>
        )}

        {tab === 'config' && (
          <div className="admin-grid two">
            <Panel title="Configuracion general" icon={Settings}>
              <form className="admin-form" onSubmit={submitConfig}>
                <Field label="Nombre" name="consortiumName" defaultValue={state.config?.consortiumName} />
                <Field label="Direccion" name="consortiumAddress" defaultValue={state.config?.consortiumAddress} />
                <Field label="Email admin" name="adminEmail" type="email" defaultValue={state.config?.adminEmail} />
                <Field label="Telefono admin" name="adminPhone" defaultValue={state.config?.adminPhone} />
                <Field label="Cuota mensual" name="monthlyFee" type="number" defaultValue={state.config?.monthlyFee || state.config?.expenseAmount || 0} />
                <Field label="Periodo actual" name="expenseMonthCode" type="month" defaultValue={state.config?.expenseMonthCode || month} />
                <Field label="Dia vencimiento" name="dueDayOfMonth" type="number" defaultValue={state.config?.dueDayOfMonth || 10} />
                <SelectField label="Tipo recargo" name="lateFeeType" defaultValue={state.config?.lateFeeType || 'percent'}>
                  <option value="percent">Porcentaje</option><option value="fixed">Fijo</option>
                </SelectField>
                <Field label="% recargo" name="lateFeePercent" type="number" defaultValue={state.config?.lateFeePercent || 0} />
                <Field label="Recargo fijo" name="lateFeeFixed" type="number" defaultValue={state.config?.lateFeeFixed || 0} />
                <Field label="Banco" name="bankName" defaultValue={state.config?.bankName} />
                <Field label="CBU" name="bankCbu" defaultValue={state.config?.bankCbu} />
                <button className="btn btn-primary" disabled={busy === 'config'}>Guardar configuracion</button>
              </form>
            </Panel>
            <Panel title="Nueva unidad" icon={Building2}>
              <form className="admin-form" onSubmit={submitUnit}>
                <Field label="Nombre" name="name" required />
                <SelectField label="Propietario" name="owner"><option value="">Sin asignar</option>{state.owners.map((owner: any) => <option key={idOf(owner)} value={idOf(owner)}>{owner.name}</option>)}</SelectField>
                <Field label="Coeficiente" name="coefficient" type="number" />
                <Field label="Cuota custom" name="customFee" type="number" />
                <button className="btn btn-primary" disabled={busy === 'unit'}>Crear unidad</button>
              </form>
            </Panel>
            <Panel title="Unidades" icon={Building2}>
              <Table loading={loading} searchPlaceholder="Buscar unidad o propietario" filters={[
                {
                  key: 'assigned',
                  label: 'Asignacion',
                  allLabel: 'Todas',
                  options: [{ value: 'yes', label: 'Asignadas' }, { value: 'no', label: 'Sin asignar' }],
                  match: (row, value) => value === 'yes' ? !!row.owner : !row.owner
                }
              ]} rows={state.units} columns={[
                ['Nombre', (u: any) => u.name],
                ['Propietario', (u: any) => u.owner?.name || '-'],
                ['Coef.', (u: any) => u.coefficient || '-'],
                ['Cuota', (u: any) => money(u.finalFee || u.customFee)],
                ['Acciones', (u: any) => <Actions><button onClick={() => run(idOf(u), () => adminApi.units.delete(idOf(u)), 'Unidad eliminada.')}>Eliminar</button></Actions>]
              ]} />
            </Panel>
          </div>
        )}
      </section>
    </main>
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

function Panel({ title, icon: Icon, action, children }: { title: string; icon: any; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="admin-panel">
      <div className="panel-head">
        <h2><Icon size={18} /> {title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="row-actions">{children}</div>;
}

function BusyBanner() {
  return (
    <div className="admin-busy" role="status" aria-live="polite">
      <span className="action-spinner" />
      Ejecutando accion...
    </div>
  );
}

function Table({
  rows,
  columns,
  loading = false,
  filters = [],
  searchPlaceholder = 'Buscar'
}: {
  rows: any[];
  columns: Array<[string, (row: any) => ReactNode]>;
  loading?: boolean;
  filters?: GridFilter[];
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setPage(1);
  }, [query, pageSize, filterValues, rows]);

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (rows || []).filter((row) => {
      const matchesSearch = !normalized || JSON.stringify(row).toLowerCase().includes(normalized);
      const matchesFilters = filters.every((filter) => {
        const value = filterValues[filter.key];
        return !value || filter.match(row, value);
      });
      return matchesSearch && matchesFilters;
    });
  }, [rows, query, filterValues, filters]);

  const pages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  if (loading) return <TableSkeleton columns={columns.length} />;

  return (
    <>
      <div className="grid-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={searchPlaceholder} />
        {filters.map((filter) => (
          <select
            key={filter.key}
            value={filterValues[filter.key] || ''}
            onChange={(event) => setFilterValues((current) => ({ ...current, [filter.key]: event.target.value }))}
          >
            <option value="">{filter.allLabel || filter.label}</option>
            {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        ))}
      </div>

      {!filteredRows.length ? <Empty text="No hay registros con esos filtros." /> : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr>{columns.map(([label]) => <th key={label}>{label}</th>)}</tr></thead>
              <tbody>
                {visibleRows.map((row, index) => (
                  <tr key={idOf(row) || index}>
                    {columns.map(([label, render]) => <td key={label}>{render(row)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid-footer">
            <span>{filteredRows.length} registro{filteredRows.length !== 1 ? 's' : ''}</span>
            <label>
              Ver
              <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                {[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <div className="pager">
              <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={safePage <= 1}>Anterior</button>
              <span>{safePage} / {pages}</span>
              <button onClick={() => setPage((current) => Math.min(pages, current + 1))} disabled={safePage >= pages}>Siguiente</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function TableSkeleton({ columns }: { columns: number }) {
  return (
    <div className="table-skeleton">
      <div className="grid-toolbar skeleton-toolbar"><span /><span /><span /></div>
      {Array.from({ length: 6 }).map((_, row) => (
        <div className="skeleton-row" key={row}>
          {Array.from({ length: Math.max(3, Math.min(columns, 6)) }).map((__, col) => <span key={col} />)}
        </div>
      ))}
    </div>
  );
}

function CompactList({ rows, loading = false }: { rows: any[]; loading?: boolean }) {
  if (loading) {
    return (
      <div className="compact-list">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="compact-skeleton">
            <span className="skeleton-line" />
            <span className="skeleton-line short" />
            <span className="skeleton-pill" />
          </div>
        ))}
      </div>
    );
  }

  if (!rows?.length) return <Empty text="No hay pendientes abiertos." />;
  const iconColor: Record<string, { bg: string; color: string }> = {
    pending: { bg: 'rgba(245,194,101,0.12)', color: '#f5c265' },
    open: { bg: 'rgba(245,194,101,0.12)', color: '#f5c265' },
    in_progress: { bg: 'rgba(124,198,240,0.12)', color: '#7cc6f0' },
    approved: { bg: 'rgba(110,232,151,0.12)', color: '#6ee897' },
    rejected: { bg: 'rgba(240,138,138,0.12)', color: '#f08a8a' },
  };
  return (
    <div className="compact-list">
      {rows.map((row, index) => {
        const ic = iconColor[row.status] || { bg: 'rgba(255,255,255,0.06)', color: 'var(--text-faint)' };
        return (
          <div key={idOf(row) || index}>
            <div className="compact-list-icon" style={{ background: ic.bg, color: ic.color }}>
              {row.amount ? <CreditCard size={15} /> : <MessageSquare size={15} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>{row.title || person(row)}</b>
              <span>{row.amount ? money(row.amount) : row.description || row.month || dateLabel(row.createdAt)}</span>
            </div>
            <div className="compact-list-trail"><Status value={row.status} /></div>
          </div>
        );
      })}
    </div>
  );
}

function MiniChart({
  rows,
  loading = false,
  selectedMonth,
  onSelect
}: {
  rows: any[];
  loading?: boolean;
  selectedMonth?: string;
  onSelect?: (month: string) => void;
}) {
  if (loading) {
    return (
      <div className="mini-chart skeleton-chart">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index}><span style={{ height: `${20 + ((index * 17) % 70)}%` }} /><small /></div>
        ))}
      </div>
    );
  }

  if (!rows?.length) return <Empty text="Todavia no hay recaudacion registrada este ano." />;
  const max = Math.max(...rows.map((item) => Number(item.total || 0)), 1);
  return (
    <div className="mini-chart">
      {rows.map((item) => (
        <button
          key={item._id}
          type="button"
          className={selectedMonth === item._id ? 'active' : ''}
          title={`${item._id}: ${money(item.total)} aprobados, ${item.pending || 0} pendientes`}
          onClick={() => onSelect?.(item._id)}
        >
          <span className="chart-value">{money(item.total)}</span>
          <span className="chart-bar" style={{ height: `${Number(item.total || 0) > 0 ? Math.max(8, (Number(item.total || 0) / max) * 100) : 4}%` }} />
          <small>{shortMonth(String(item._id))}</small>
          <em>{item.count || 0} pagos</em>
        </button>
      ))}
    </div>
  );
}

function YearMonth({ year, setYear, month, setMonth }: { year: number; setYear: (year: number) => void; month: string; setMonth: (month: string) => void }) {
  return (
    <div className="period-controls">
      <button onClick={() => setYear(year - 1)}>-</button>
      <input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} />
      <button onClick={() => setYear(year + 1)}>+</button>
      <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
    </div>
  );
}
