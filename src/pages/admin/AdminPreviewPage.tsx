import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Bell, Building2, CalendarCheck, CheckCircle2, ChevronDown, ChevronRight,
  CreditCard, Download, FileText, Home, Inbox, Landmark, LogOut, Mail, Megaphone, MessageSquare, MoreVertical,
  Paperclip, RefreshCw, Search, Settings, ShieldCheck, TrendingUp, UserRoundCog, Users, Vote, WalletCards, X
} from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { isSuperAdminRole } from '../../services/authService';

type TabKey = 'inicio' | 'finanzas' | 'personal' | 'propietarios' | 'comunicados' | 'reclamos' | 'operaciones' | 'proveedores' | 'config';
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
const debtAmount = (row: any) => Number(row?.balanceOwed ?? row?.totalOwed ?? Math.max(0, -Number(row?.balance || 0)));
const hasDebt = (row: any) => debtAmount(row) > 0 || !!row?.isDebtor;
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

const documentCategoryLabels: Record<string, string> = {
  regulation: 'Reglamento',
  map: 'Mapa',
  rules: 'Normas de convivencia',
  assembly: 'Asamblea',
  insurance: 'Seguro',
  payment: 'Pagos',
  contract: 'Contrato',
  other: 'Otro'
};

const documentVisibilityLabels: Record<string, string> = {
  admin: 'Solo administradores',
  owners: 'Visible para propietarios'
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
  const tone = (value === 'approved' || value === 'paid' || value === 'resolved' || value === 'exited' || value === 'active') ? 'pos'
    : (value === 'rejected' || value === 'cancelled') ? 'neg'
    : (value === 'pending' || value === 'open' || value === 'in_progress' || value === 'inside') ? 'warn'
    : (value === 'closed') ? 'muted'
    : '';
  return (
    <span className={`pill ${tone}`}>
      <span className="d" />
      {statusText[value || ''] || value || '-'}
    </span>
  );
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

const tabCrumbs: Record<string, string[]> = {
  inicio: ['Inicio'],
  finanzas: ['Finanzas', 'Cobranza'],
  personal: ['Administración', 'Personal'],
  propietarios: ['Comunidad', 'Propietarios'],
  comunicados: ['Comunidad', 'Comunicados'],
  reclamos: ['Comunidad', 'Reclamos'],
  operaciones: ['Operaciones'],
  proveedores: ['Administración', 'Proveedores'],
  config: ['Administración', 'Configuración'],
};

function adminInitials(name: string) {
  return (name || 'Ad').split(' ').slice(0, 2).map((n) => n[0]?.toUpperCase() ?? '').join('');
}
function orgLogoText(name: string) {
  return (name || '').split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || 'Or';
}

const EXPENSE_COLORS: Record<string, string> = {
  cleaning: '#7bb8f2', security: '#f5c24a', maintenance: '#9cf27b',
  utilities: '#4af0c8', administration: '#b87bf2', other: '#f07567'
};
const EXPENSE_LABELS_MAP: Record<string, string> = {
  cleaning: 'Limpieza', security: 'Seguridad', maintenance: 'Mantenimiento',
  utilities: 'Servicios', administration: 'Administración', other: 'Otros'
};

function fmtK(n: number): string {
  const abs = Math.abs(n || 0);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return (n || 0).toLocaleString('es-AR');
}

function buildSparklinePoints(values: number[]): string {
  if (!values.length) return '0,16 50,16';
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? 50 / (values.length - 1) : 0;
  return values.map((v, i) => `${Math.round(i * step)},${Math.round(16 - (v / max) * 14)}`).join(' ');
}

function filteredMonthlyByPeriod(monthly: any[], period: string): any[] {
  if (!monthly.length) return monthly;
  const now = new Date();
  const curMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (period === 'mes') {
    const m = monthly.find((x) => x._id === curMonth);
    return m ? [m] : (monthly.length ? [monthly[monthly.length - 1]] : []);
  }
  if (period === 'trimestre') {
    const cutoff = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const cutStr = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}`;
    return monthly.filter((x) => x._id >= cutStr);
  }
  return monthly;
}

function expensesByCategory(expenses: any[]): Array<{ cat: string; label: string; amount: number; color: string; pct: number }> {
  const byCategory: Record<string, number> = {};
  let total = 0;
  expenses.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount || 0);
    total += Number(e.amount || 0);
  });
  return Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cat, amount]) => ({
      cat,
      label: EXPENSE_LABELS_MAP[cat] || cat,
      amount,
      color: EXPENSE_COLORS[cat] || '#888',
      pct: total > 0 ? Math.round((amount / total) * 100) : 0
    }));
}

export function AdminPreviewPage() {
  const [tab, setTab] = useState<TabKey>('inicio');
  const [finSubTab, setFinSubTab] = useState<'cobranza' | 'egresos'>('cobranza');
  const [dashPeriod, setDashPeriod] = useState<'mes' | 'trimestre' | 'año' | 'todo'>('año');
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [month, setMonth] = useState(todayMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [ownerUnitFilter, setOwnerUnitFilter] = useState('');
  const [ownerSelectedUnitIds, setOwnerSelectedUnitIds] = useState<Set<string>>(new Set());
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [ownerEmailError, setOwnerEmailError] = useState('');
  const [ownerEmailHint, setOwnerEmailHint] = useState<{ text: string; tone: 'info' | 'success' | 'danger' } | null>(null);
  const [ownerEmailChecking, setOwnerEmailChecking] = useState(false);
  const [ownerEmailResult, setOwnerEmailResult] = useState<any>(null);
  const [ownerLastCheckedEmail, setOwnerLastCheckedEmail] = useState('');
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeFiles, setNoticeFiles] = useState<File[]>([]);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteOptions, setVoteOptions] = useState(['', '']);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [employeeFiles, setEmployeeFiles] = useState<File[]>([]);
  const [empModalRole, setEmpModalRole] = useState('maintenance');
  const [state, setState] = useState<any>({
    me: null, config: {}, ownerStats: {}, dashboard: {}, report: {},
    owners: [], units: [], payments: [], notices: [], claims: [], expenses: [],
    employees: [], salaries: [], providers: [], votes: [], visits: [], spaces: [], reservations: [], orgDocuments: [],
    yearExpenses: [], yearPayments: [],
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

      if (target === 'propietarios' || target === 'comunicados' || target === 'reclamos' || target === 'inicio') {
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
        const [allPayments, expenses, allYearExpenses, allYearPayments, units] = await Promise.all([
          adminApi.payments.list({ limit: 100, effectiveMonth: month }),
          adminApi.expenses.list({ limit: 50, month }),
          adminApi.expenses.list({ limit: 500 }),
          adminApi.payments.list({ limit: 500, status: 'approved' }),
          adminApi.units.list({ limit: 200 })
        ]);
        next.payments = sortPayments(pick(allPayments, 'payments', []));
        next.expenses = sortExpenses(pick(expenses, 'expenses', []));
        next.units = pick(units, 'units', []);
        const yearStr = String(year);
        next.yearExpenses = pick(allYearExpenses, 'expenses', []).filter((e: any) => {
          const y = (e.date || e.createdAt || '').slice(0, 4);
          return y === yearStr;
        });
        next.yearPayments = pick(allYearPayments, 'payments', []).filter((p: any) => {
          if (p.month) return p.month.startsWith(yearStr);
          return (p.createdAt || '').startsWith(yearStr);
        });
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
        const documents = await adminApi.documents.list();
        next.orgDocuments = pick(documents, 'documents', []);
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

  function exportDashboardCSV(monthly: any[], payments: any[], selectedYear: number) {
    const monthLabels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const summaryRows = monthly.map((m) => {
      const [, mo] = String(m._id).split('-');
      return [monthLabels[Number(mo) - 1] || m._id, m.total || 0, m.count || 0, m.pending || 0, m.rejected || 0].join(',');
    });
    const detailRows = payments.map((p) => [
      `"${person(p)}"`, unitLabel(p) || '-', p.month || '-', p.amount || 0, 'Aprobado',
      p.paymentMethod === 'mercadopago' ? 'MercadoPago' : 'Manual',
      dateLabel(p.createdAt)
    ].join(','));

    const csv = [
      `Informe de cobranza ${selectedYear}`,
      '',
      'Resumen mensual',
      'Período,Recaudado,Aprobados,Pendientes,Rechazados',
      ...summaryRows,
      '',
      'Detalle de pagos',
      'Propietario,Unidad,Período,Monto,Estado,Canal,Fecha',
      ...detailRows
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `informe_cobranza_${selectedYear}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
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

  async function checkOwnerEmail(email: string) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return;
    if (email === ownerLastCheckedEmail) return;
    setOwnerEmailChecking(true);
    setOwnerEmailHint({ text: 'Verificando…', tone: 'info' });
    try {
      const res = await adminApi.owners.checkEmail(email);
      setOwnerLastCheckedEmail(email);
      setOwnerEmailResult(res);
      const tone = !res.canAddToCurrentOrganization ? 'danger' : res.exists ? 'success' : 'info';
      setOwnerEmailHint({ text: res.message, tone });
    } catch {
      setOwnerEmailHint(null);
      setOwnerEmailResult(null);
    } finally {
      setOwnerEmailChecking(false);
    }
  }

  function submitOwner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formObject(event);
    const email = (data.email as string) || '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setOwnerEmailError('Ingresá un correo electrónico válido.');
      return;
    }
    setOwnerEmailError('');
    if (ownerEmailResult && !ownerEmailResult.canAddToCurrentOrganization) {
      return;
    }
    const isNewUser = !ownerEmailResult || !ownerEmailResult.exists;
    if (isNewUser && !data.password) {
      setOwnerEmailError('La contraseña es obligatoria para nuevos propietarios.');
      return;
    }
    const chargeCurrentMonth = (form.querySelector('#chargeCurrentMonth') as HTMLInputElement)?.checked ?? true;
    run('owner', async () => {
      if (email !== ownerLastCheckedEmail) await checkOwnerEmail(email);
      await adminApi.owners.create({
        ...data,
        initialDebtAmount: Number(data.initialDebtAmount ?? 0),
        chargeCurrentMonth,
        unitIds: [...ownerSelectedUnitIds]
      });
      setOwnerSelectedUnitIds(new Set());
      setOwnerUnitFilter('');
      setOwnerEmailHint(null);
      setOwnerEmailResult(null);
      setOwnerLastCheckedEmail('');
      form.reset();
      setShowOwnerModal(false);
    }, 'Propietario creado con unidades seleccionadas.');
  }

  async function downloadNoticeAttachment(noticeId: string, index: number, filename: string) {
    try {
      const blob = await adminApi.notices.attachment(noticeId, index);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { /* silent */ }
  }

  function submitNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formObject(event);
    const sendPush = (form.querySelector('#n-push') as HTMLInputElement)?.checked ?? true;
    const sendEmail = (form.querySelector('#n-email') as HTMLInputElement)?.checked ?? true;
    run('notice', async () => {
      let payload: Record<string, unknown> | FormData;
      if (noticeFiles.length > 0) {
        const fd = new FormData();
        fd.append('title', String(data.title));
        fd.append('body', String(data.body));
        fd.append('tag', String(data.tag));
        fd.append('sendPush', String(sendPush));
        fd.append('sendEmail', String(sendEmail));
        noticeFiles.forEach(f => fd.append('attachments', f));
        payload = fd;
      } else {
        payload = { ...data, sendPush, sendEmail };
      }
      await adminApi.notices.create(payload);
      setNoticeFiles([]);
      form.reset();
      setShowNoticeModal(false);
    }, 'Comunicado publicado.');
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
    const form = event.currentTarget;
    const data = formObject(event);
    const fd = new FormData();
    ['name','role','customRole','documentNumber','phone','email','startDate','notes'].forEach(k => {
      const v = data[k];
      if (v && String(v)) fd.append(k, String(v));
    });
    employeeFiles.forEach(f => fd.append('documents', f));
    const isEdit = !!editingEmployee;
    run(isEdit ? idOf(editingEmployee) : 'employee', async () => {
      if (isEdit) {
        await adminApi.employees.update(idOf(editingEmployee), fd);
      } else {
        await adminApi.employees.create(fd);
      }
      setEmployeeFiles([]);
      form.reset();
      setEditingEmployee(null);
      setShowEmployeeModal(false);
    }, isEdit ? 'Empleado actualizado.' : 'Empleado creado.');
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
    setEditingEmployee(employee);
    setEmpModalRole(employee.role || 'maintenance');
    setEmployeeFiles([]);
    setShowEmployeeModal(true);
  }

  async function downloadEmployeeDocument(employeeId: string, index: number, filename: string) {
    try {
      const blob = await adminApi.employees.getDocument(employeeId, index);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename || 'archivo'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch { /* silent */ }
  }

  async function deleteEmployeeDocument(index: number) {
    if (!window.confirm('¿Eliminar este archivo?')) return;
    try {
      setBusy('emp-doc');
      await adminApi.employees.deleteDocument(idOf(editingEmployee), index);
      setEditingEmployee((prev: any) => {
        if (!prev) return prev;
        const docs = [...(prev.documents || [])];
        docs.splice(index, 1);
        return { ...prev, documents: docs };
      });
      setNotice({ type: 'ok', text: 'Archivo eliminado.' });
      refresh(tab);
    } catch {
      setNotice({ type: 'error', text: 'No se pudo eliminar el archivo.' });
    } finally {
      setBusy('');
    }
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
    const form = event.currentTarget;
    const data = formObject(event);
    const options = voteOptions.map(o => o.trim()).filter(Boolean);
    const sendPush = (form.querySelector('#v-push') as HTMLInputElement)?.checked ?? true;
    run('vote', async () => {
      await adminApi.votes.create({ title: data.title, description: data.description || undefined, options, endsAt: data.endsAt || undefined, sendPush });
      setVoteOptions(['', '']);
      form.reset();
      setShowVoteModal(false);
    }, 'Votación creada.');
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
    setShowUnitModal(false);
  }

  function submitUnitBulk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('unit', () => adminApi.units.bulkCreate({
      count: Number(data.count),
      start: Number(data.start ?? 1),
      prefix: String(data.prefix ?? 'Lote')
    }), 'Unidades creadas.');
    event.currentTarget.reset();
    setShowUnitModal(false);
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

  function submitMercadoPago(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    const update: Record<string, unknown> = {
      mpPublicKey: String(data.mpPublicKey || '').trim()
    };
    const token = String(data.mpAccessToken || '').trim();
    const secret = String(data.mpWebhookSecret || '').trim();
    if (token) update.mpAccessToken = token;
    if (secret) update.mpWebhookSecret = secret;

    run('mercadopago', () => adminApi.config.update(update), 'Credenciales de MercadoPago actualizadas.');
    event.currentTarget.reset();
  }

  function submitOrgDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.elements.namedItem('file') as HTMLInputElement | null)?.files?.[0];
    if (!file) {
      setNotice({ type: 'error', text: 'Selecciona un archivo para guardar.' });
      return;
    }

    const formData = new FormData(form);
    run('org-document', () => adminApi.documents.create(formData), 'Archivo de organizacion guardado.');
    form.reset();
  }

  async function downloadOrgDocument(document: any) {
    await run(idOf(document), async () => {
      const blob = await adminApi.documents.download(idOf(document));
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement('a');
      anchor.href = url;
      anchor.download = document.file?.filename || `${document.title || 'documento'}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    }, 'Descarga preparada.');
  }

  const adminName = state.me?.name || state.me?.data?.user?.name || 'Administrador';
  const orgName = state.config?.consortiumName || '';
  const crumbs = tabCrumbs[tab] || [tab];

  return (
    <main className={`admin-shell${busy ? ' is-busy' : ''}`}>
      <aside className="admin-sidebar">
        <a className="logo admin-logo" href="/">
          <span className="logo-mark" /> Gestion<span className="ar">ar</span>
        </a>

        {orgName && (
          <div className="admin-org-card">
            <div className="admin-org-logo">{orgLogoText(orgName)}</div>
            <div className="admin-org-meta">
              <div className="admin-org-name">{orgName}</div>
              <div className="admin-org-sub">{state.units?.length ?? 0} unidades</div>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          </div>
        )}

        <nav>
          <div className="admin-nav-group-label">Workspace</div>
          <button className={tab === 'inicio' ? 'active' : ''} onClick={() => setTab('inicio')}>
            <Home size={16} /> <span>Inicio</span>
          </button>
          <button className={tab === 'finanzas' ? 'active' : ''} onClick={() => setTab('finanzas')}>
            <CreditCard size={16} /> <span>Finanzas</span>
            {(state.dashboard?.pending ?? 0) > 0 && (
              <span className="admin-nav-badge">{state.dashboard.pending}</span>
            )}
          </button>

          <div className="admin-nav-group-label">Comunidad</div>
          <button className={tab === 'propietarios' ? 'active' : ''} onClick={() => setTab('propietarios')}>
            <Users size={16} /> <span>Propietarios</span>
          </button>
          <button className={tab === 'comunicados' ? 'active' : ''} onClick={() => setTab('comunicados')}>
            <Megaphone size={16} /> <span>Comunicados</span>
          </button>
          <button className={tab === 'reclamos' ? 'active' : ''} onClick={() => setTab('reclamos')}>
            <MessageSquare size={16} /> <span>Reclamos</span>
            {(state.claims?.filter((c: any) => c.status === 'open').length ?? 0) > 0 && (
              <span className="admin-nav-badge">{state.claims.filter((c: any) => c.status === 'open').length}</span>
            )}
          </button>

          {hasOperations && (
            <>
              <div className="admin-nav-group-label">Operaciones</div>
              <button className={tab === 'operaciones' ? 'active' : ''} onClick={() => setTab('operaciones')}>
                <CalendarCheck size={16} /> <span>Operaciones</span>
              </button>
            </>
          )}

          <div className="admin-nav-group-label">Administración</div>
          <button className={tab === 'personal' ? 'active' : ''} onClick={() => setTab('personal')}>
            <UserRoundCog size={16} /> <span>Personal</span>
          </button>
          {moduleEnabled('providers') && (
            <button className={tab === 'proveedores' ? 'active' : ''} onClick={() => setTab('proveedores')}>
              <Landmark size={16} /> <span>Proveedores</span>
            </button>
          )}
          <button className={tab === 'config' ? 'active' : ''} onClick={() => setTab('config')}>
            <Settings size={16} /> <span>Configuración</span>
          </button>
        </nav>

        <div className="admin-sidebar-foot">
          <div className="admin-user-row">
            <div className="admin-user-avatar">{adminInitials(adminName)}</div>
            <div className="admin-user-info">
              <b>{adminName}</b>
              <span>Administrador</span>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: '100%', marginTop: '8px', height: '36px', fontSize: '13px', borderRadius: '10px' }} onClick={logout}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <section className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar-crumbs">
            {crumbs.map((crumb, i) => (
              <span key={i} className={i === crumbs.length - 1 ? 'cur' : ''}>
                {i > 0 && <span className="sep" style={{ marginRight: '7px' }}>/</span>}
                {crumb}
              </span>
            ))}
          </div>
          <div className="admin-topbar-search">
            <Search size={13} />
            <span>Buscar…</span>
            <span className="kbd">⌘K</span>
          </div>
          <div className="admin-topbar-sep" />
          <button className="icon-btn" onClick={() => refresh(tab)} title="Actualizar">
            <RefreshCw size={15} />
          </button>
          <button className="icon-btn" title="Notificaciones">
            <Bell size={15} />
            <span className="dot" />
          </button>
          <button className="icon-btn admin-topbar-logout" onClick={logout} title="Cerrar sesión">
            <LogOut size={15} />
          </button>
        </header>

        {busy && <BusyBanner />}
        {notice && <div className={`admin-notice ${notice.type}`}>{notice.text}</div>}
        {tab === 'inicio' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Vista general</div>
                <h1 className="admin-page-title">Buen día, {state.me?.name?.split(' ')[0] || 'admin'}</h1>
                <div className="admin-page-sub">
                  {state.config?.consortiumName || 'Tu organización'} · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-primary" onClick={() => setTab('finanzas')}><CreditCard size={14} />Revisar pagos</button>
              </div>
            </div>

            <div className="metric-grid">
              <Metric loading={loading} label="Recaudacion anual" value={money(totalIncome)} hint={`${state.dashboard?.approved || 0} pagos aprobados`} icon={ShieldCheck}
                delta={(state.dashboard?.approved ?? 0) > 0 ? { text: `${state.dashboard.approved} aprobados`, trend: 'pos' } : undefined} />
              <Metric loading={loading} label="Pagos pendientes" value={state.dashboard?.pending || 0} hint="MP acreditado queda en revision" icon={CreditCard}
                delta={(state.dashboard?.pending ?? 0) > 0 ? { text: `${state.dashboard.pending} por revisar`, trend: 'neg' } : undefined} />
              <Metric loading={loading} label="Propietarios" value={state.ownerStats?.totalOwners || state.owners?.length || 0} hint={`${state.ownerStats?.upToDate || 0} al dia`} icon={Users}
                delta={(state.ownerStats?.upToDate ?? 0) > 0 ? { text: `${state.ownerStats.upToDate} al día`, trend: 'pos' } : undefined} />
              {moduleEnabled('claims') && <Metric loading={loading} label="Reclamos abiertos" value={state.claims?.length || 0} hint="Comunidad" icon={MessageSquare}
                delta={(state.claims?.length ?? 0) > 0 ? { text: `${state.claims.length} pendientes`, trend: 'neg' } : undefined} />}
            </div>

            <ComplianceHero
              ownerStats={state.ownerStats}
              pendingCount={state.dashboard?.pending || 0}
              debtorCount={state.ownerStats?.debtors || 0}
              claimCount={state.claims?.filter((c: any) => c.status === 'open').length || 0}
              loading={loading}
              onPending={() => setTab('finanzas')}
              onDebtors={() => setTab('finanzas')}
              onClaims={() => setTab('reclamos')}
            />

            <AttentionHero
              payments={state.payments}
              claims={state.claims}
              loading={loading}
              onFinanzas={() => setTab('finanzas')}
              onComunidad={() => setTab('reclamos')}
            />

            <PendingReceiptsSection
              payments={state.payments.filter((p: any) => p.status === 'pending').slice(0, 5)}
              loading={loading}
              onApprove={(id) => run(id, () => adminApi.payments.approve(id), 'Pago aprobado.')}
              onReject={(id) => {
                const note = window.prompt('Motivo de rechazo') || 'Rechazado';
                run(id, () => adminApi.payments.reject(id, note), 'Pago rechazado.');
              }}
              onViewAll={() => setTab('finanzas')}
            />

            {moduleEnabled('claims') && (
              <OpenClaimsSection
                claims={state.claims.filter((c: any) => c.status === 'open')}
                loading={loading}
                onNavigate={() => setTab('reclamos')}
              />
            )}

            <div className="admin-grid two">
              <PendingCollectionSection
                rows={state.owners.filter((o: any) => hasDebt(o)).slice(0, 10)}
                loading={loading}
                onViewAll={() => setTab('finanzas')}
              />
            </div>
          </>
        )}

        {tab === 'finanzas' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Finanzas</div>
                <h1 className="admin-page-title">Pagos y gastos</h1>
                <div className="admin-page-sub">Cobranza de expensas, egresos y conciliación · {state.config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <YearMonth year={year} setYear={setYear} month={month} setMonth={setMonth} />
                <button className="btn btn-ghost" onClick={downloadReport} disabled={busy === 'pdf'}><FileText size={14} />PDF expensas</button>
                <button className="btn btn-ghost" onClick={() => exportDashboardCSV(state.dashboard?.monthly || [], state.yearPayments, year)}><TrendingUp size={14} />Exportar CSV</button>
                <button className="btn btn-primary" onClick={() => run('reminders', adminApi.payments.reminders, 'Recordatorios enviados.')}><Bell size={14} />Recordatorios</button>
              </div>
            </div>

            <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {(() => {
                const bal = totalIncome - (state.dashboard?.totalExpenses || 0);
                return <Metric loading={loading} label={`Balance ${year}`} value={money(bal)} hint="Ingresos − egresos anuales" icon={Landmark}
                  delta={{ text: bal >= 0 ? '↑ ingresos superan gastos' : '↓ gastos superan ingresos', trend: bal >= 0 ? 'pos' : 'neg' }} />;
              })()}
              <Metric loading={loading} label="Ingresos" value={money(totalIncome)} hint={`Recaudado ${year}`} icon={CreditCard}
                delta={state.payments?.filter((p: any) => p.status === 'approved').length > 0 ? { text: `${state.payments.filter((p: any) => p.status === 'approved').length} pagos aprobados`, trend: 'pos' } : undefined} />
              <Metric loading={loading} label="Egresos" value={money(state.dashboard?.totalExpenses || 0)} hint={`Gastos ${year}`} icon={FileText} />
              <Metric loading={loading} label="Cumplimiento" value={`${state.ownerStats?.complianceRate || 0}%`} hint={`${state.ownerStats?.upToDate || 0} de ${state.ownerStats?.totalOwners || 0} propietarios`} icon={ShieldCheck}
                delta={state.ownerStats?.complianceRate >= 80 ? { text: 'Buen nivel de pago', trend: 'pos' } : { text: 'Requiere atención', trend: 'neg' }} />
              <Metric loading={loading} label="Morosos" value={state.ownerStats?.debtors || 0} hint={`${state.ownerStats?.pendingPayments || 0} pagos pendientes`} icon={Bell}
                delta={(state.ownerStats?.debtors || 0) === 0 ? { text: 'Sin morosos', trend: 'pos' } : { text: `${state.ownerStats.debtors} con deuda`, trend: 'neg' }} />
            </div>

            {/* Sub-tab bar */}
            <div className="fin-tabs-bar">
              <div className="fin-tabs">
                <button className={`fin-tab${finSubTab === 'cobranza' ? ' is-active' : ''}`} onClick={() => setFinSubTab('cobranza')}>
                  Cobranza <span className="fin-tab-count">{state.payments?.length || 0}</span>
                </button>
                <button className={`fin-tab${finSubTab === 'egresos' ? ' is-active' : ''}`} onClick={() => setFinSubTab('egresos')}>
                  Egresos <span className="fin-tab-count">{state.expenses?.length || 0}</span>
                </button>
              </div>
              {finSubTab === 'cobranza' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="chip is-active">{month} <ChevronDown size={12} /></span>
                  <span className="chip">Estado <ChevronDown size={12} /></span>
                </div>
              )}
            </div>

            {finSubTab === 'cobranza' && (
              <>
                <PeriodTabs value={dashPeriod} onChange={setDashPeriod} />
                <CobroStrip payments={state.payments} loading={loading} />
                <div className="admin-panel">
                  <div className="panel-head"><h2><CreditCard size={14} />Pagos</h2></div>
                  <Table loading={loading} searchPlaceholder="Buscar propietario, unidad o comprobante" filters={[
                    statusFilter(['pending', 'approved', 'rejected']),
                    monthFilter((p) => p.month || String(p.createdAt || '').slice(0, 7), month)
                  ]} rows={state.payments} columns={[
                    ['Unidad', (p: any) => {
                      const ownerId = idOf(p.owner);
                      const ownerUnits = (state.units || []).filter((u: any) => {
                        const uid = typeof u.owner === 'string' ? u.owner : idOf(u.owner);
                        return ownerId && uid === ownerId;
                      });
                      const names = ownerUnits.map((u: any) => u.name).filter(Boolean);
                      return <span className="fin-lote">{names.join(', ') || '—'}</span>;
                    }],
                    ['Propietario', (p: any) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="owner-avatar sm">{adminInitials(person(p))}</div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-bright)' }}>{person(p)}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.owner?.email || ''}</div>
                        </div>
                      </div>
                    )],
                    ['Período', (p: any) => <span className="fin-mono">{p.month || dateLabel(p.createdAt)}</span>],
                    ['Estado', (p: any) => <Status value={p.status} />],
                    ['Canal', (p: any) => <PaymentChannel payment={p} />],
                    ['Monto', (p: any) => <span className="fin-mono fin-strong">{money(p.amount)}</span>],
                    ['Acciones', (p: any) => p.status === 'pending' ? <Actions>
                      <button onClick={() => run(idOf(p), () => adminApi.payments.approve(idOf(p)), 'Pago aprobado.')}>Aprobar</button>
                      <button onClick={() => run(idOf(p), () => adminApi.payments.reject(idOf(p), window.prompt('Motivo de rechazo') || 'Rechazado'), 'Pago rechazado.')}>Rechazar</button>
                    </Actions> : null]
                  ]} />
                </div>
                <PeriodTable
                  monthly={filteredMonthlyByPeriod(state.dashboard?.monthly || [], dashPeriod)}
                  loading={loading}
                />

              </>
            )}

            {finSubTab === 'egresos' && (
              <div className="com-layout">
                <div className="com-main">
                  <ExpenseBreakdown yearExpenses={state.yearExpenses} loading={loading} />
                  <div className="admin-panel">
                    <Table loading={loading} searchPlaceholder="Buscar descripción, categoría o proveedor" filters={[
                      statusFilter(['paid', 'pending']),
                      categoryFilter()
                    ]} rows={state.expenses} columns={[
                      ['Descripción', (e: any) => <span style={{ fontWeight: 500, color: 'var(--text-bright)', fontSize: 13 }}>{e.description}</span>],
                      ['Categoría', (e: any) => {
                        const catLabels: Record<string, string> = { cleaning: 'Limpieza', security: 'Seguridad', maintenance: 'Mantenimiento', utilities: 'Servicios', administration: 'Administración', other: 'Otros' };
                        return <span className="fin-cat">{catLabels[e.category] || e.category}</span>;
                      }],
                      ['Fecha', (e: any) => <span className="fin-mono">{dateLabel(e.date)}</span>],
                      ['Monto', (e: any) => <span className="fin-mono fin-strong">{money(e.amount)}</span>],
                      ['Estado', (e: any) => <Status value={e.status} />],
                      ['Acciones', (e: any) => e.status === 'pending' ? <Actions>
                        <button onClick={() => run(idOf(e), () => adminApi.expenses.paid(idOf(e)), 'Gasto marcado como pagado.')}>Pagar</button>
                        <button onClick={() => run(idOf(e), () => adminApi.expenses.delete(idOf(e)), 'Gasto eliminado.')}>Eliminar</button>
                      </Actions> : null]
                    ]} />
                  </div>
                </div>
                <div className="com-side">
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
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'personal' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Administración</div>
                <h1 className="admin-page-title">Personal</h1>
                <div className="admin-page-sub">{state.employees?.filter((e: any) => e.isActive).length || 0} colaboradores activos · {state.config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-primary" onClick={() => { setEditingEmployee(null); setEmpModalRole('maintenance'); setEmployeeFiles([]); setShowEmployeeModal(true); }}><UserRoundCog size={14} />Nuevo empleado</button>
              </div>
            </div>
            <div className="metric-grid">
              <Metric loading={loading} label="Empleados activos" value={state.employees?.filter((e: any) => e.isActive).length || 0} hint="Colaboradores" icon={UserRoundCog} />
              <Metric loading={loading} label="Sueldos pendientes" value={money(state.salaries.filter((s: any) => s.status === 'pending').reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0))} hint={month} icon={WalletCards} />
              <Metric loading={loading} label="Sueldos pagados" value={money(state.salaries.filter((s: any) => s.status === 'paid').reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0))} hint="Período visible" icon={ShieldCheck} />
              <Metric loading={loading} label="Liquidaciones" value={state.salaries.length || 0} hint="Período visible" icon={FileText} />
            </div>
            <div className="admin-grid">
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
                ['Archivos', (e: any) => e.documents?.length ? `${e.documents.length} archivo${e.documents.length !== 1 ? 's' : ''}` : '-'],
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

            {showEmployeeModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true"
                onClick={(e) => { if (e.target === e.currentTarget) { setShowEmployeeModal(false); setEditingEmployee(null); setEmployeeFiles([]); } }}>
                <div className="form-modal form-modal--wide">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><UserRoundCog size={16} />{editingEmployee ? 'Editar empleado' : 'Nuevo empleado'}</div>
                    <button className="icon-btn" onClick={() => { setShowEmployeeModal(false); setEditingEmployee(null); setEmployeeFiles([]); }}><X size={16} /></button>
                  </div>
                  <form key={editingEmployee ? idOf(editingEmployee) : 'new'} className="admin-form" onSubmit={submitEmployee}>
                    <Field label="Nombre" name="name" required defaultValue={editingEmployee?.name} />
                    <label className="admin-field">
                      <span>Rol</span>
                      <select name="role" value={empModalRole} onChange={(e) => setEmpModalRole(e.target.value)}>
                        {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    {empModalRole === 'other' && (
                      <Field label="Rol personalizado" name="customRole" placeholder="Ej: Jardinero" defaultValue={editingEmployee?.customRole} />
                    )}
                    <Field label="DNI" name="documentNumber" defaultValue={editingEmployee?.documentNumber} />
                    <Field label="Telefono" name="phone" defaultValue={editingEmployee?.phone} />
                    <Field label="Email" name="email" type="email" defaultValue={editingEmployee?.email} />
                    <Field label="Fecha de inicio" name="startDate" type="date" defaultValue={editingEmployee?.startDate ? String(editingEmployee.startDate).slice(0, 10) : undefined} />
                    <label className="admin-field full"><span>Notas</span><textarea name="notes" rows={2} defaultValue={editingEmployee?.notes} /></label>

                    {editingEmployee?.documents?.length > 0 && (
                      <div className="admin-field full">
                        <span>Archivos cargados</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                          {editingEmployee.documents.map((d: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                              <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                📄 {d.filename || `archivo-${i + 1}`}
                              </span>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
                                onClick={() => downloadEmployeeDocument(idOf(editingEmployee), i, d.filename || 'archivo')}>
                                <Download size={12} />Descargar
                              </button>
                              <button type="button" className="btn btn-sm danger-action" style={{ flexShrink: 0 }}
                                disabled={busy === 'emp-doc'}
                                onClick={() => deleteEmployeeDocument(i)}>
                                Eliminar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="admin-field full">
                      <span>
                        {editingEmployee ? 'Agregar archivos' : 'Archivos relacionados'}
                        {' '}<small style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional · máx. 5 · PDF o imagen)</small>
                      </span>
                      <input type="file" id="emp-files-input" accept=".pdf,image/*" multiple style={{ display: 'none' }}
                        onChange={(e) => {
                          const incoming = Array.from(e.target.files || []);
                          setEmployeeFiles(prev => {
                            const remaining = 5 - prev.length;
                            return [...prev, ...incoming.slice(0, remaining)];
                          });
                          e.target.value = '';
                        }}
                      />
                      {employeeFiles.length < 5 && (
                        <div className="notice-attach-zone" onClick={() => document.getElementById('emp-files-input')?.click()}>
                          <Paperclip size={16} style={{ color: 'var(--muted)' }} />
                          <span style={{ fontSize: 13, color: 'var(--text)' }}>Adjuntar PDF o imagen</span>
                          <small style={{ color: 'var(--muted)', fontSize: 11 }}>Clic para seleccionar</small>
                        </div>
                      )}
                      {employeeFiles.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {employeeFiles.map((f, i) => (
                            <div key={i} className="notice-attach-chip notice-attach-chip--local">
                              <span>{f.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                              <span>{f.name.length > 24 ? f.name.slice(0, 23) + '…' : f.name}</span>
                              <span style={{ color: 'var(--muted)', fontSize: 10 }}>({(f.size / 1024).toFixed(0)} KB)</span>
                              <button type="button" className="notice-attach-chip-remove"
                                onClick={() => setEmployeeFiles(prev => prev.filter((_, j) => j !== i))}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowEmployeeModal(false); setEditingEmployee(null); setEmployeeFiles([]); }}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'employee' || busy === idOf(editingEmployee) || busy === 'emp-doc'}>
                        <UserRoundCog size={14} />{editingEmployee ? 'Guardar cambios' : 'Crear empleado'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'propietarios' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Comunidad</div>
                <h1 className="admin-page-title">Propietarios</h1>
                <div className="admin-page-sub">{state.owners?.length || 0} propietarios · {state.units?.length || 0} unidades · {state.config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-secondary" onClick={() => setShowUnitModal(true)}><Building2 size={14} />Nueva unidad</button>
                <button className="btn btn-primary" onClick={() => setShowOwnerModal(true)}><Users size={14} />Nuevo propietario</button>
              </div>
            </div>
            <div className="metric-grid">
              <Metric loading={loading} label="Total propietarios" value={state.owners?.length || 0} hint="Registrados" icon={Users} />
              <Metric loading={loading} label="Al día" value={state.ownerStats?.upToDate || 0} hint="Sin deuda activa" icon={ShieldCheck}
                delta={(state.ownerStats?.upToDate ?? 0) > 0 ? { text: `${Math.round(((state.ownerStats?.upToDate || 0) / Math.max(state.owners?.length || 1, 1)) * 100)}% de la comunidad`, trend: 'pos' } : undefined} />
              <Metric loading={loading} label="Con deuda" value={(state.owners?.filter((o: any) => hasDebt(o)).length) || 0} hint="Deudores activos" icon={CreditCard}
                delta={state.owners?.filter((o: any) => o.isDebtor).length > 0 ? { text: `${state.owners.filter((o: any) => o.isDebtor).length} morosos`, trend: 'neg' } : undefined} />
              <Metric loading={loading} label="Unidades" value={state.units?.length || 0} hint={`${state.units?.filter((u: any) => u.owner).length || 0} asignadas`} icon={Building2} />
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <Table loading={loading} searchPlaceholder="Buscar nombre, email o unidad" filters={[
                {
                  key: 'debt',
                  label: 'Estado',
                  allLabel: 'Todos',
                  options: [{ value: 'debtor', label: 'Con deuda' }, { value: 'clear', label: 'Al día' }],
                  match: (row, value) => value === 'debtor' ? hasDebt(row) : !hasDebt(row)
                }
              ]} rows={state.owners} columns={[
                ['Propietario', (o: any) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="owner-avatar">{adminInitials(o.name)}</div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-bright)' }}>{o.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{o.email}</div>
                    </div>
                  </div>
                )],
                ['Unidades', (o: any) => <span style={{ fontSize: 12 }}>{unitLabel(o)}</span>],
                ['Teléfono', (o: any) => <span style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace' }}>{o.phone || '—'}</span>],
                ['Estado', (o: any) => <Status value={hasDebt(o) ? 'pending' : 'approved'} />],
                ['Saldo', (o: any) => (
                  <span style={{ fontFamily: 'monospace', fontSize: 12.5, color: debtAmount(o) > 0 ? 'var(--neg)' : 'var(--muted)' }}>
                    {debtAmount(o) > 0 ? money(debtAmount(o)) : '—'}
                  </span>
                )],
                ['', (o: any) => <Actions><button onClick={() => run(idOf(o), () => adminApi.owners.delete(idOf(o)), 'Propietario eliminado.')}>Eliminar</button></Actions>]
              ]} />
            </div>
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
                ['Propietario', (u: any) => u.owner?.name || '—'],
                ['Coef.', (u: any) => u.coefficient || '1'],
                ['Cuota', (u: any) => money(u.finalFee || u.customFee)],
                ['Deuda', (u: any) => debtAmount(u) > 0 ? money(debtAmount(u)) : '—'],
                ['', (u: any) => <Actions><button onClick={() => run(idOf(u), () => adminApi.units.delete(idOf(u)), 'Unidad eliminada.')}>Eliminar</button></Actions>]
              ]} />
            </Panel>

            {showOwnerModal && (() => {
              const closeOwnerModal = () => {
                setShowOwnerModal(false);
                setOwnerEmailError('');
                setOwnerEmailHint(null);
                setOwnerEmailResult(null);
                setOwnerLastCheckedEmail('');
              };
              const userExists = ownerEmailResult?.exists && ownerEmailResult?.canAddToCurrentOrganization;
              const cantAdd = ownerEmailResult && !ownerEmailResult.canAddToCurrentOrganization;
              return (
              <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) closeOwnerModal(); }}>
                <div className="form-modal form-modal--wide">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><Users size={16} />Nuevo propietario</div>
                    <button className="icon-btn" onClick={closeOwnerModal}><X size={16} /></button>
                  </div>
                  <form className="admin-form" onSubmit={submitOwner}>
                    <p className="form-section-label">Datos personales</p>
                    <Field label="Nombre completo" name="name" required />
                    <label className="admin-field">
                      <span>Email</span>
                      <input
                        name="email"
                        type="email"
                        required
                        disabled={ownerEmailChecking}
                        style={ownerEmailError || cantAdd ? { borderColor: 'var(--danger)' } : ownerEmailHint?.tone === 'success' ? { borderColor: 'var(--success,#16a34a)' } : {}}
                        onChange={() => { if (ownerEmailError) setOwnerEmailError(''); if (ownerEmailHint) setOwnerEmailHint(null); if (ownerEmailResult) { setOwnerEmailResult(null); setOwnerLastCheckedEmail(''); } }}
                        onBlur={(e) => checkOwnerEmail(e.target.value.trim())}
                      />
                      {ownerEmailChecking && <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Verificando…</small>}
                      {!ownerEmailChecking && ownerEmailHint && (
                        <small style={{ fontSize: 11, marginTop: 2, color: ownerEmailHint.tone === 'danger' ? 'var(--danger)' : ownerEmailHint.tone === 'success' ? 'var(--success,#16a34a)' : 'var(--text-muted)' }}>
                          {ownerEmailHint.text}
                        </small>
                      )}
                      {ownerEmailError && <small style={{ color: 'var(--danger)', fontSize: 11, marginTop: 2 }}>{ownerEmailError}</small>}
                    </label>
                    {!userExists && (
                      <Field label="Contraseña temporal" name="password" type="password" placeholder="Mín. 6 caracteres" required={!userExists} />
                    )}
                    <Field label="Teléfono" name="phone" />
                    <p className="form-section-label">Configuración de cuenta</p>
                    <label className="admin-field">
                      <span>Deuda inicial / Saldo anterior ($)</span>
                      <input className="input" type="number" name="initialDebtAmount" defaultValue={0} min={0} />
                      <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Usá este campo si el propietario ingresa con deuda previa.</small>
                    </label>
                    <div className="admin-field full owner-check-row">
                      <input type="checkbox" name="chargeCurrentMonth" id="chargeCurrentMonth" defaultChecked />
                      <div>
                        <label htmlFor="chargeCurrentMonth" style={{ cursor: 'pointer' }}>¿Cobrar mes en curso?</label>
                        <div className="owner-check-hint">Si se desactiva, el cobro comenzará el mes siguiente.</div>
                      </div>
                    </div>
                    <p className="form-section-label">Unidades asignadas</p>
                    <div className="admin-field full">
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
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={closeOwnerModal}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'owner' || cantAdd || ownerEmailChecking}>Crear propietario</button>
                    </div>
                  </form>
                </div>
              </div>
              );
            })()}

            {showUnitModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setShowUnitModal(false); }}>
                <div className="form-modal">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><Building2 size={16} />Nueva unidad</div>
                    <button className="icon-btn" onClick={() => setShowUnitModal(false)}><X size={16} /></button>
                  </div>
                  <form className="admin-form" onSubmit={submitUnitBulk}>
                    <Field label="Cantidad" name="count" type="number" required />
                    <Field label="Desde" name="start" type="number" defaultValue="1" required />
                    <Field label="Prefijo" name="prefix" defaultValue="Lote" required />
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => setShowUnitModal(false)}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'unit'}>Crear unidades</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'comunicados' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Comunidad</div>
                <h1 className="admin-page-title">Comunicados</h1>
                <div className="admin-page-sub">{state.notices?.length || 0} comunicados · {state.config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-primary" onClick={() => setShowNoticeModal(true)}><Megaphone size={14} />Nuevo comunicado</button>
              </div>
            </div>
            {moduleEnabled('notices') ? (
              <div className="com-layout">
                <div className="com-main" style={{ gridColumn: '1 / -1' }}>
                  {loading ? (
                    <Empty text="Cargando comunicados…" />
                  ) : !state.notices?.length ? (
                    <Empty text="No hay comunicados publicados." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {state.notices.map((n: any) => (
                        <div key={idOf(n)} className="notice-card">
                          <div className="notice-card-head">
                            <Status value={n.tag === 'urgent' ? 'rejected' : n.tag === 'warning' ? 'pending' : 'approved'} />
                            <span className="notice-card-tag">{n.tag === 'urgent' ? 'Urgente' : n.tag === 'warning' ? 'Advertencia' : 'Info'}</span>
                            <span className="notice-card-date">{dateLabel(n.createdAt)}</span>
                          </div>
                          <h3 className="notice-card-title">{n.title}</h3>
                          {n.body && <p className="notice-card-body">{n.body}</p>}
                          {n.attachments?.length > 0 && (
                            <div className="notice-card-attachments">
                              {n.attachments.map((a: any, i: number) => (
                                <button key={i} className="notice-attach-chip" type="button"
                                  onClick={() => downloadNoticeAttachment(idOf(n), i, a.filename || `adjunto-${i + 1}`)}>
                                  {a.mimetype?.startsWith('image/') ? <span>🖼️</span> : <Paperclip size={11} />}
                                  <span>{a.filename?.length > 28 ? a.filename.slice(0, 27) + '…' : a.filename || `Adjunto ${i + 1}`}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="notice-card-foot">
                            <button className="btn btn-ghost btn-sm" onClick={() => run(idOf(n), () => adminApi.notices.delete(idOf(n)), 'Comunicado eliminado.')}>Eliminar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : <Empty text="El módulo de comunicados no está habilitado para esta organización." />}

            {showNoticeModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) { setShowNoticeModal(false); setNoticeFiles([]); } }}>
                <div className="form-modal form-modal--wide">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><Megaphone size={16} />Nuevo comunicado</div>
                    <button className="icon-btn" onClick={() => { setShowNoticeModal(false); setNoticeFiles([]); }}><X size={16} /></button>
                  </div>
                  <form className="admin-form" onSubmit={submitNotice}>
                    <Field label="Título" name="title" required placeholder="Título del comunicado" />
                    <SelectField label="Tipo" name="tag" defaultValue="info">
                      <option value="info">📢 Informativo</option>
                      <option value="warning">⚠️ Advertencia</option>
                      <option value="urgent">🔴 Urgente</option>
                    </SelectField>
                    <label className="admin-field full"><span>Mensaje</span><textarea name="body" rows={5} required placeholder="Escribí el contenido del comunicado…" maxLength={2000} /></label>
                    <div className="admin-field full">
                      <span>Adjuntos <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional · máx. 3 archivos · 10 MB c/u)</small></span>
                      <input type="file" id="n-files-input" accept="image/*,.pdf" multiple style={{ display: 'none' }}
                        onChange={(e) => {
                          const incoming = Array.from(e.target.files || []);
                          setNoticeFiles(prev => {
                            const remaining = 3 - prev.length;
                            return [...prev, ...incoming.slice(0, remaining)];
                          });
                          e.target.value = '';
                        }}
                      />
                      {noticeFiles.length < 3 && (
                        <div className="notice-attach-zone" onClick={() => document.getElementById('n-files-input')?.click()}>
                          <Paperclip size={16} style={{ color: 'var(--muted)' }} />
                          <span style={{ fontSize: 13, color: 'var(--text)' }}>Adjuntar imágenes o PDF</span>
                          <small style={{ color: 'var(--muted)', fontSize: 11 }}>Clic para seleccionar</small>
                        </div>
                      )}
                      {noticeFiles.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {noticeFiles.map((f, i) => (
                            <div key={i} className="notice-attach-chip notice-attach-chip--local">
                              <span>{f.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                              <span>{f.name.length > 24 ? f.name.slice(0, 23) + '…' : f.name}</span>
                              <span style={{ color: 'var(--muted)', fontSize: 10 }}>({(f.size / 1024).toFixed(0)} KB)</span>
                              <button type="button" className="notice-attach-chip-remove"
                                onClick={() => setNoticeFiles(prev => prev.filter((_, j) => j !== i))}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="admin-field full">
                      <span>Enviar a propietarios</span>
                      <div className="notice-checks-row">
                        <label className="notice-check-pill">
                          <input type="checkbox" id="n-push" defaultChecked />
                          <Bell size={13} />
                          <span>Notificación push</span>
                        </label>
                        <label className="notice-check-pill">
                          <input type="checkbox" id="n-email" defaultChecked />
                          <Mail size={13} />
                          <span>Correo electrónico</span>
                        </label>
                        <label className="notice-check-pill">
                          <input type="checkbox" id="n-whatsapp" />
                          <span>💬</span>
                          <span>WhatsApp <small style={{ color: 'var(--muted)', fontSize: 10 }}>(manual)</small></span>
                        </label>
                      </div>
                    </div>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowNoticeModal(false); setNoticeFiles([]); }}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'notice'}><Megaphone size={14} />Publicar comunicado</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'reclamos' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Comunidad</div>
                <h1 className="admin-page-title">Reclamos</h1>
                <div className="admin-page-sub">
                  {(state.claims || []).filter((c: any) => c.status === 'open').length} abiertos · {(state.claims || []).filter((c: any) => c.status === 'in_progress').length} en progreso · {state.config?.consortiumName || 'Tu organización'}
                </div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
              </div>
            </div>
            <div className="metric-grid">
              <Metric loading={loading} label="Abiertos" value={(state.claims || []).filter((c: any) => c.status === 'open').length} hint="Sin asignar" icon={MessageSquare}
                delta={(state.claims || []).filter((c: any) => c.status === 'open').length > 0 ? { text: 'Requieren atención', trend: 'neg' } : undefined} />
              <Metric loading={loading} label="En progreso" value={(state.claims || []).filter((c: any) => c.status === 'in_progress').length} hint="En gestión" icon={RefreshCw} />
              <Metric loading={loading} label="Resueltos" value={(state.claims || []).filter((c: any) => c.status === 'resolved').length} hint="Cerrados" icon={ShieldCheck}
                delta={(state.claims || []).filter((c: any) => c.status === 'resolved').length > 0 ? { text: 'Resueltos', trend: 'pos' } : undefined} />
              <Metric loading={loading} label="Total" value={(state.claims || []).length} hint="Histórico" icon={FileText} />
            </div>
            {moduleEnabled('claims') ? (
              <ClaimKanban
                claims={state.claims || []}
                loading={loading}
                onInProgress={(id) => run(id, () => adminApi.claims.status(id, 'in_progress'), 'Reclamo en progreso.')}
                onResolve={(id) => run(id, () => adminApi.claims.status(id, 'resolved', window.prompt('Nota para el propietario') || ''), 'Reclamo resuelto.')}
                onDelete={(id) => run(id, () => adminApi.claims.delete(id), 'Reclamo eliminado.')}
              />
            ) : <Empty text="El módulo de reclamos no está habilitado para esta organización." />}
          </>
        )}

        {tab === 'operaciones' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Operaciones</div>
                <h1 className="admin-page-title">Operaciones</h1>
                <div className="admin-page-sub">Votaciones, reservas y visitas · {state.config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                {moduleEnabled('votes') && <button className="btn btn-primary" onClick={() => setShowVoteModal(true)}><Vote size={14} />Nueva votación</button>}
              </div>
            </div>
            <div className="admin-grid">
            {!hasOperations && <Empty text="No hay modulos operativos habilitados para esta organizacion." />}
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

            {showVoteModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true"
                onClick={(e) => { if (e.target === e.currentTarget) { setShowVoteModal(false); setVoteOptions(['', '']); } }}>
                <div className="form-modal form-modal--wide">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><Vote size={16} />Nueva votación</div>
                    <button className="icon-btn" onClick={() => { setShowVoteModal(false); setVoteOptions(['', '']); }}><X size={16} /></button>
                  </div>
                  <form className="admin-form" onSubmit={submitVote}>
                    <Field label="Título" name="title" required placeholder="Ej: ¿Pintamos el palier?" />
                    <Field label="Fecha límite (opcional)" name="endsAt" type="datetime-local" />
                    <label className="admin-field full"><span>Descripción <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</small></span>
                      <textarea name="description" rows={3} placeholder="Contexto adicional para los propietarios…" maxLength={1000} />
                    </label>
                    <div className="admin-field full">
                      <span>Opciones <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(mínimo 2)</small></span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {voteOptions.map((opt, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input className="input" value={opt} required={i < 2}
                              placeholder={`Opción ${i + 1}`}
                              onChange={(e) => setVoteOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                              style={{ flex: 1 }}
                            />
                            {voteOptions.length > 2 && (
                              <button type="button" className="icon-btn"
                                onClick={() => setVoteOptions(prev => prev.filter((_, j) => j !== i))}>
                                <X size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                        {voteOptions.length < 6 && (
                          <button type="button" className="btn btn-ghost btn-sm"
                            onClick={() => setVoteOptions(prev => [...prev, ''])}>
                            + Agregar opción
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="admin-field full">
                      <label className="notice-check-pill" style={{ maxWidth: 320 }}>
                        <input type="checkbox" id="v-push" defaultChecked />
                        <Bell size={13} />
                        <span>Notificar a propietarios por push</span>
                      </label>
                    </div>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost"
                        onClick={() => { setShowVoteModal(false); setVoteOptions(['', '']); }}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'vote'}><Vote size={14} />Publicar votación</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'proveedores' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Administración</div>
                <h1 className="admin-page-title">Proveedores</h1>
                <div className="admin-page-sub">{state.providers?.length || 0} proveedores registrados · {state.config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
              </div>
            </div>
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
          </>
        )}

        {tab === 'config' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Administración</div>
                <h1 className="admin-page-title">Configuración</h1>
                <div className="admin-page-sub">{state.config?.consortiumName || 'Tu organización'} · Ajustes generales del consorcio</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
              </div>
            </div>
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
            <Panel title="MercadoPago" icon={CreditCard}>
              <form className="admin-form" onSubmit={submitMercadoPago}>
                <label className="admin-field full">
                  <span>Estado</span>
                  <input value={state.config?.hasMercadoPago ? 'Configurado' : 'No configurado'} disabled readOnly />
                </label>
                <Field label="Public Key" name="mpPublicKey" defaultValue={state.config?.mpPublicKey || ''} placeholder="APP_USR-..." />
                <Field label="Access Token" name="mpAccessToken" type="password" placeholder="Completar solo para actualizar" />
                <Field label="Webhook Secret" name="mpWebhookSecret" type="password" placeholder="Opcional" />
                <p className="admin-form-note">Por seguridad, el Access Token no se muestra. Si lo dejas vacio, se conserva el valor actual.</p>
                <button className="btn btn-primary" disabled={busy === 'mercadopago'}>Guardar MercadoPago</button>
              </form>
            </Panel>
            <Panel title="Archivos de organizacion" icon={FileText}>
              <form className="admin-form" onSubmit={submitOrgDocument}>
                <Field label="Titulo" name="title" required />
                <SelectField label="Categoria" name="category" defaultValue="other">
                  {Object.entries(documentCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </SelectField>
                <SelectField label="Visibilidad" name="visibility" defaultValue="owners">
                  {Object.entries(documentVisibilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </SelectField>
                <label className="admin-field">
                  <span>Archivo</span>
                  <input name="file" type="file" accept=".pdf,image/*" required />
                </label>
                <label className="admin-field full"><span>Descripcion</span><textarea name="description" rows={2} /></label>
                <button className="btn btn-primary" disabled={busy === 'org-document'}>Guardar archivo</button>
              </form>
              <Table loading={loading} searchPlaceholder="Buscar archivo, categoria o visibilidad" filters={[
                {
                  key: 'category',
                  label: 'Categoria',
                  allLabel: 'Todas las categorias',
                  options: Object.entries(documentCategoryLabels).map(([value, label]) => ({ value, label })),
                  match: (row, value) => row.category === value
                },
                {
                  key: 'visibility',
                  label: 'Visibilidad',
                  allLabel: 'Todas',
                  options: Object.entries(documentVisibilityLabels).map(([value, label]) => ({ value, label })),
                  match: (row, value) => row.visibility === value
                }
              ]} rows={state.orgDocuments} columns={[
                ['Titulo', (doc: any) => doc.title],
                ['Categoria', (doc: any) => doc.categoryLabel || documentCategoryLabels[doc.category] || doc.category],
                ['Visibilidad', (doc: any) => doc.visibilityLabel || documentVisibilityLabels[doc.visibility] || doc.visibility],
                ['Archivo', (doc: any) => doc.file?.filename || doc.fileTypeLabel || '-'],
                ['Fecha', (doc: any) => dateLabel(doc.createdAt)],
                ['Acciones', (doc: any) => <Actions>
                  <button onClick={() => downloadOrgDocument(doc)}>Descargar</button>
                  <button className="danger-action" onClick={() => run(idOf(doc), () => adminApi.documents.delete(idOf(doc)), 'Archivo eliminado.')}>Eliminar</button>
                </Actions>]
              ]} />
            </Panel>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, hint, delta, icon: _Icon, loading }: {
  label: string; value: string | number; hint: string;
  delta?: { text: string; trend: 'pos' | 'neg' | 'neutral' };
  icon: any; loading?: boolean
}) {
  if (loading) {
    return (
      <article className="metric">
        <div className="skeleton-line short" style={{ marginBottom: 8 }} />
        <div className="skeleton-line big" />
        <div className="skeleton-line" style={{ width: '55%', marginTop: 6 }} />
      </article>
    );
  }

  return (
    <article className="metric">
      <div className="m-label">{label}</div>
      <div className="m-value">{value}</div>
      {delta && <div className={`m-delta ${delta.trend}`}>{delta.text}</div>}
      {hint && <div className="m-meta">{hint}</div>}
    </article>
  );
}

function Panel({ title, sub, icon: _Icon, action, children }: { title: string; sub?: string; icon: any; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      <div className="card-h">
        <div>
          <h3>{title}</h3>
          {sub && <div className="card-sub">{sub}</div>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      <div className="card-body">
        {children}
      </div>
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
          <div className="tbl-wrap">
            <table className="tbl">
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

function AttentionHero({ payments, claims, loading, onFinanzas, onComunidad }: {
  payments: any[]; claims: any[]; loading: boolean;
  onFinanzas: () => void; onComunidad: () => void;
}) {
  const pendingPayments = (payments || []).filter((p) => p.status === 'pending');
  const openClaims = (claims || []).filter((c) => c.status === 'open');

  const items: Array<{ tone: string; title: string; sub: string; cta: string; onClick: () => void }> = [];
  if (pendingPayments.length > 0) {
    const total = pendingPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    items.push({
      tone: 'neg',
      title: `Aprobar ${pendingPayments.length} pago${pendingPayments.length !== 1 ? 's' : ''} en revisión`,
      sub: `${money(total)} acumulado · incluye pagos de MercadoPago`,
      cta: 'Revisar',
      onClick: onFinanzas,
    });
  }
  if (openClaims.length > 0) {
    items.push({
      tone: 'warn',
      title: `${openClaims.length} reclamo${openClaims.length !== 1 ? 's' : ''} abierto${openClaims.length !== 1 ? 's' : ''} sin resolver`,
      sub: `Comunidad esperando respuesta · revisá el estado de cada uno`,
      cta: 'Ver',
      onClick: onComunidad,
    });
  }

  if (loading || items.length === 0) return null;

  return (
    <div className="attention-hero">
      <div className="attention-hero-head">
        <div className="admin-page-kicker" style={{ marginBottom: 4 }}><span className="dot" />Requiere tu atención</div>
        <h2>{items.length === 1 ? '1 cosa para resolver hoy' : `${items.length} cosas para resolver hoy`}</h2>
        <p>El sistema identificó lo que mueve la aguja en cobranza y operación.</p>
      </div>
      <div className="attention-items">
        {items.map((item, i) => (
          <div key={i} className="attention-item">
            <div className={`attention-item-icon ${item.tone}`}>
              {item.tone === 'neg' ? <AlertTriangle size={14} /> : <Bell size={14} />}
            </div>
            <div className="attention-item-body">
              <b>{item.title}</b>
              <span>{item.sub}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={item.onClick}>{item.cta}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CashflowSVG({ rows, loading, onSelect }: {
  rows: any[]; loading: boolean; onSelect?: (month: string) => void;
}) {
  if (loading) {
    return (
      <div className="mini-chart skeleton-chart">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i}><span style={{ height: `${20 + ((i * 17) % 70)}%` }} /><small /></div>
        ))}
      </div>
    );
  }
  if (!rows?.length) return <Empty text="Sin datos de recaudación aún." />;

  const values = rows.map((r) => Number(r.total || 0));
  const max = Math.max(...values, 1);
  const labels = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const W = 640, H = 160, pad = 28;
  const step = (W - pad) / (rows.length - 1 || 1);
  const pts = values.map((v, i) => [i * step + pad / 2, H - 20 - (v / max) * (H - 36)]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ');
  const area = `M ${pad / 2} ${H - 20} L ${pts.map(([x, y]) => `${x} ${y}`).join(' L ')} L ${(rows.length - 1) * step + pad / 2} ${H - 20} Z`;
  const lastIdx = rows.length - 1;

  return (
    <div className="cf-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
        <defs>
          <linearGradient id="cf-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acc-1)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--acc-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.33, 0.66, 1].map((p, i) => (
          <line key={i} x1={pad / 2} y1={16 + p * (H - 36)} x2={W - pad / 2} y2={16 + p * (H - 36)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#cf-grad)" />
        <polyline points={line} fill="none" stroke="var(--acc-1)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === lastIdx ? 3.5 : 0} fill="var(--acc-1)" stroke="var(--surface)" strokeWidth="2" />
        ))}
        {rows.map((r, i) => {
          const isLast = i === lastIdx;
          const [x] = pts[i];
          return (
            <g key={i} style={{ cursor: 'pointer' }} onClick={() => onSelect?.(String(r._id))}>
              <rect x={x - step / 2} y={0} width={step} height={H} fill="transparent" />
              <text x={x} y={H - 4} fontSize="9.5" fill={isLast ? 'var(--acc-1)' : 'var(--ink-3)'}
                textAnchor="middle" fontFamily="var(--font-mono)" fontWeight={isLast ? '600' : '400'}>
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ActivityFeed({ payments, claims, notices, loading }: {
  payments: any[]; claims: any[]; notices: any[]; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="compact-list">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="compact-skeleton">
            <span className="skeleton-line" /><span className="skeleton-line short" /><span className="skeleton-pill" />
          </div>
        ))}
      </div>
    );
  }

  type FeedItem = { tone: string; icon: ReactNode; who: string; what: string; amount?: string; when: string };
  const items: FeedItem[] = [];

  const approvedPayments = (payments || []).filter((p) => p.status === 'approved').slice(0, 3);
  approvedPayments.forEach((p) => {
    items.push({
      tone: 'pos',
      icon: <CheckCircle2 size={12} />,
      who: person(p),
      what: `pagó expensas${p.month ? ` ${p.month}` : ''}`,
      amount: money(p.amount),
      when: dateLabel(p.updatedAt || p.createdAt),
    });
  });

  const recentClaims = (claims || []).filter((c) => c.status === 'open').slice(0, 2);
  recentClaims.forEach((c) => {
    items.push({
      tone: 'warn',
      icon: <AlertTriangle size={12} />,
      who: person(c),
      what: `envió un reclamo: ${c.title || c.description || ''}`,
      when: dateLabel(c.createdAt),
    });
  });

  const recentNotices = (notices || []).slice(0, 2);
  recentNotices.forEach((n) => {
    items.push({
      tone: 'info',
      icon: <Megaphone size={12} />,
      who: 'Comunicado',
      what: n.title || '',
      when: dateLabel(n.createdAt),
    });
  });

  if (!items.length) return <Empty text="Sin actividad reciente." />;

  return (
    <div className="activity-feed">
      {items.map((it, i) => (
        <div key={i} className="activity-item">
          <div className={`activity-icon ${it.tone}`}>{it.icon}</div>
          <div className="activity-body">
            <span className="act-text"><b>{it.who}</b> {it.what}</span>
            {it.amount && <span className="act-amount">{it.amount}</span>}
            <span className="act-time">{it.when}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CobroStrip({ payments, loading }: { payments: any[]; loading: boolean }) {
  if (loading || !payments?.length) return null;

  const approved = payments.filter((p) => p.status === 'approved');
  const pending = payments.filter((p) => p.status === 'pending');
  const rejected = payments.filter((p) => p.status === 'rejected');
  const total = payments.length;

  const cols = [
    { label: 'Pagado', tone: 'pos', count: approved.length, amount: money(approved.reduce((s, p) => s + Number(p.amount || 0), 0)), pct: Math.round((approved.length / total) * 100) },
    { label: 'Pendiente', tone: 'warn', count: pending.length, amount: money(pending.reduce((s, p) => s + Number(p.amount || 0), 0)), pct: Math.round((pending.length / total) * 100) },
    { label: 'Rechazado', tone: 'neg', count: rejected.length, amount: money(rejected.reduce((s, p) => s + Number(p.amount || 0), 0)), pct: Math.round((rejected.length / total) * 100) },
    { label: 'Total', tone: 'muted', count: total, amount: money(payments.reduce((s, p) => s + Number(p.amount || 0), 0)), pct: 100 },
  ];

  const barColors = ['var(--pos)', 'var(--warn)', 'var(--neg)', 'var(--line-2)'];

  return (
    <div className="cobro-strip">
      <div className="cobro-strip-cols">
        {cols.map((col, i) => (
          <div key={i} className="cobro-col">
            <div className="cobro-col-label">
              <span className={`pill ${col.tone}`}><span className="d" />{col.label} <span style={{ fontFamily: 'var(--font-mono)', opacity: .7 }}>{col.pct}%</span></span>
            </div>
            <div className="cobro-col-count">{col.count}</div>
            <div className="cobro-col-amount">{col.amount}</div>
          </div>
        ))}
      </div>
      <div className="cobro-bar">
        {cols.map((col, i) => (
          col.pct > 0 && <div key={i} className="cobro-bar-seg" style={{ flex: col.pct, background: barColors[i] }} />
        ))}
      </div>
    </div>
  );
}

function ClaimKanban({ claims, loading, onInProgress, onResolve, onDelete }: {
  claims: any[]; loading: boolean;
  onInProgress: (id: string) => void;
  onResolve: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (loading) return <Empty text="Cargando reclamos…" />;
  if (!claims.length) return <Empty text="No hay reclamos registrados." />;

  const claimCategoryLabel: Record<string, string> = {
    infrastructure: 'Infraestructura', security: 'Seguridad', noise: 'Ruido',
    cleaning: 'Limpieza', billing: 'Facturación', other: 'Otro',
  };

  const cols: Array<{ key: string; label: string; tone: string }> = [
    { key: 'open', label: 'Abierto', tone: 'warn' },
    { key: 'in_progress', label: 'En progreso', tone: 'info' },
    { key: 'resolved', label: 'Resuelto', tone: 'pos' },
  ];

  return (
    <div className="kanban-board">
      {cols.map((col) => {
        const items = claims.filter((c) => c.status === col.key);
        return (
          <div key={col.key} className="kanban-col">
            <div className="kanban-col-head">
              <span className={`pill ${col.tone}`}><span className="d" />{col.label}</span>
              <span className="kanban-col-count">{items.length}</span>
            </div>
            <div className="kanban-cards">
              {items.length === 0 ? (
                <div className="kanban-empty">Sin reclamos</div>
              ) : items.map((c) => (
                <div key={idOf(c)} className="kanban-card">
                  <div className="kanban-card-cat">
                    <span className="pill muted">{claimCategoryLabel[c.category] || c.category}</span>
                    <span className="kanban-card-time">{dateLabel(c.createdAt)}</span>
                  </div>
                  <div className="kanban-card-title">{c.title}</div>
                  {c.description && <p className="kanban-card-desc">{c.description}</p>}
                  <div className="kanban-card-from">
                    <div className="owner-avatar sm">{adminInitials(person(c))}</div>
                    <span>{person(c)}</span>
                  </div>
                  {c.adminNote && <p className="kanban-card-note">{c.adminNote}</p>}
                  <div className="kanban-card-actions">
                    {col.key === 'open' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => onInProgress(idOf(c))}>En progreso</button>
                    )}
                    {col.key !== 'resolved' && (
                      <button className="btn btn-primary btn-sm" onClick={() => onResolve(idOf(c))}>Resolver</button>
                    )}
                    {col.key === 'resolved' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => onDelete(idOf(c))}>Eliminar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ComplianceHero({ ownerStats, pendingCount, debtorCount, claimCount, loading, onPending, onDebtors, onClaims }: {
  ownerStats: any; pendingCount: number; debtorCount: number; claimCount: number; loading: boolean;
  onPending: () => void; onDebtors: () => void; onClaims: () => void;
}) {
  if (loading) {
    return (
      <div className="compliance-hero">
        <div className="skeleton-line" style={{ width: '40%', marginBottom: 12 }} />
        <div className="skeleton-line big" style={{ marginBottom: 10 }} />
        <div className="skeleton-line" style={{ marginBottom: 16, height: 6, borderRadius: 4 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton-line short" style={{ flex: 1 }} />
          <div className="skeleton-line short" style={{ flex: 1 }} />
          <div className="skeleton-line short" style={{ flex: 1 }} />
        </div>
      </div>
    );
  }
  const rate = ownerStats?.complianceRate || 0;
  const upToDate = ownerStats?.upToDate || 0;
  const total = ownerStats?.totalOwners || 0;
  return (
    <div className="compliance-hero">
      <div className="compliance-hero-top">
        <div className="compliance-hero-label"><span className="dot" />ESTADO DEL CONSORCIO</div>
      </div>
      <div className="compliance-hero-main">
        <div className="compliance-hero-percent">{rate}<span className="compliance-pct">%</span></div>
        <div className="compliance-hero-desc"><strong>{upToDate} de {total}</strong> propietarios al día este mes</div>
      </div>
      <div className="compliance-bar"><div className="compliance-fill" style={{ width: `${rate}%` }} /></div>
      <div className="compliance-chips">
        <button className="compliance-chip warn" onClick={onPending}>
          <span className="chip-num">{pendingCount}</span>
          <span className="chip-lbl">Por revisar</span>
        </button>
        <button className="compliance-chip alert" onClick={onDebtors}>
          <span className="chip-num">{debtorCount}</span>
          <span className="chip-lbl">Morosos</span>
        </button>
        <button className="compliance-chip" onClick={onClaims}>
          <span className="chip-num">{claimCount}</span>
          <span className="chip-lbl">Reclamos</span>
        </button>
      </div>
    </div>
  );
}

function PendingReceiptsSection({ payments, loading, onApprove, onReject, onViewAll }: {
  payments: any[]; loading: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewAll: () => void;
}) {
  if (loading || payments.length === 0) return null;
  return (
    <div className="pending-receipts-section">
      <div className="pending-receipts-head">
        <div>
          <h3>Comprobantes por revisar</h3>
          <span className="pending-receipts-sub">{payments.length} esperando aprobación</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onViewAll}>Ver todos →</button>
      </div>
      <div className="pending-receipts-list">
        {payments.map((p) => (
          <div key={idOf(p)} className="pending-receipt-row">
            <div className="pending-receipt-ava">{adminInitials(person(p))}</div>
            <div className="pending-receipt-info">
              <div className="pending-receipt-name">{person(p)}</div>
              <div className="pending-receipt-meta">
                {unitLabel(p) || p.owner?.unit || ''} · {p.month || dateLabel(p.createdAt)} · <strong>{money(p.amount)}</strong>
              </div>
            </div>
            <div className="pending-receipt-actions">
              <button className="btn btn-success btn-sm" onClick={() => onApprove(idOf(p))}>Aprobar</button>
              <button className="btn btn-danger btn-sm" onClick={() => onReject(idOf(p))}>Rechazar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PendingCollectionSection({ rows, loading, onViewAll }: {
  rows: any[]; loading: boolean; onViewAll: () => void;
}) {
  if (loading) return <TableSkeleton columns={5} />;
  if (!rows.length) return null;

  const totalAmount = rows.reduce((s, r) => s + debtAmount(r), 0);

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>Cobranza pendiente</h3>
          <div className="card-sub">{rows.length} {rows.length === 1 ? 'lote' : 'lotes'} · {money(totalAmount)} acumulado</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className="pill neg"><span className="d" />Vencidos <strong style={{ marginLeft: 3 }}>{rows.length}</strong></span>
          <button className="btn btn-ghost btn-sm" onClick={onViewAll}>Ver todos <ChevronRight size={12} /></button>
        </div>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th>Lote / Propietario</th>
            <th>Estado</th>
            <th className="num">Deuda</th>
            <th style={{ width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={idOf(r)}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="pending-receipt-ava">{adminInitials(person(r))}</div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 12.5 }}>{person(r)}</div>
                    <div style={{ fontSize: 11, opacity: 0.55, fontFamily: 'var(--font-mono, monospace)' }}>{unitLabel(r)}</div>
                  </div>
                </div>
              </td>
              <td>
                <span className="pill neg"><span className="d" />Vencido</span>
              </td>
              <td className="num" style={{ color: 'var(--danger)' }}>{money(debtAmount(r))}</td>
              <td>
                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 6px' }} onClick={onViewAll}>
                  <MoreVertical size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OpenClaimsSection({ claims, loading, onNavigate }: {
  claims: any[]; loading: boolean; onNavigate: () => void;
}) {
  if (loading || claims.length === 0) return null;
  const claimCatLabel: Record<string, string> = {
    infrastructure: 'Infraestructura', security: 'Seguridad', noise: 'Ruido',
    cleaning: 'Limpieza', billing: 'Facturación', other: 'Otro'
  };
  return (
    <div className="open-claims-section card">
      <div className="card-h">
        <div>
          <h3>Reclamos abiertos</h3>
          <div className="card-sub">{claims.length} sin resolver</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onNavigate}>Ver todos</button>
      </div>
      <div className="card-body">
        {claims.slice(0, 5).map((c) => (
          <div key={idOf(c)} className="open-claim-row">
            <div className="open-claim-info">
              <div className="open-claim-title">{c.title}</div>
              <div className="open-claim-meta">{person(c)} · {unitLabel(c) || c.owner?.unit || ''} · {claimCatLabel[c.category] || c.category}</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={onNavigate}>Ver</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BalanceHero({ totalIncome, totalExpenses, year, loading }: {
  totalIncome: number; totalExpenses: number; year: number; loading: boolean;
}) {
  if (loading) {
    return (
      <div className="balance-hero">
        <div className="skeleton-line short" style={{ marginBottom: 12 }} />
        <div className="skeleton-line big" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <div className="skeleton-line" style={{ flex: 1 }} />
          <div className="skeleton-line" style={{ flex: 1 }} />
        </div>
      </div>
    );
  }
  const balance = (totalIncome || 0) - (totalExpenses || 0);
  return (
    <div className="balance-hero">
      <div className="balance-hero-top">
        <div className="balance-hero-label"><span className="dot" />BALANCE {year}</div>
        <div className="balance-hero-ytd">YTD</div>
      </div>
      <div className="balance-hero-amt">
        <span className="balance-cur">$</span>
        <span className="balance-num">{fmtK(balance)}</span>
      </div>
      <div className="balance-hero-sub" style={{ color: balance >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
        {balance >= 0 ? '↑ ingresos superan los gastos' : '↓ gastos superan los ingresos'}
      </div>
      <div className="balance-flow">
        <div className="balance-flow-item in">
          <div className="balance-flow-lbl">Ingresos</div>
          <div className="balance-flow-val in">${fmtK(totalIncome)}</div>
        </div>
        <div className="balance-flow-item out">
          <div className="balance-flow-lbl">Gastos</div>
          <div className="balance-flow-val out">${fmtK(totalExpenses)}</div>
        </div>
      </div>
    </div>
  );
}

function KpiRow({ ownerStats, monthly, loading }: { ownerStats: any; monthly: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="kpi-row">
        <div className="kpi-card"><div className="skeleton-line short" /><div className="skeleton-line big" style={{ marginTop: 8 }} /></div>
        <div className="kpi-card"><div className="skeleton-line short" /><div className="skeleton-line big" style={{ marginTop: 8 }} /></div>
      </div>
    );
  }
  const complianceSpark = buildSparklinePoints(monthly.map((m) => m.count || 0));
  const debtorSpark = buildSparklinePoints(monthly.map((m) => (m.pending || 0) + (m.rejected || 0)));
  return (
    <div className="kpi-row">
      <div className="kpi-card">
        <div className="kpi-card-top">
          <span className="kpi-lbl">CUMPLIMIENTO</span>
          <span className="kpi-ico ok">✓</span>
        </div>
        <div className="kpi-val ok">{ownerStats?.complianceRate || 0}%</div>
        <div className="kpi-sub">{ownerStats?.upToDate || 0} de {ownerStats?.totalOwners || 0}</div>
        <svg className="kpi-spark" viewBox="0 0 50 20" preserveAspectRatio="none">
          <polyline points={complianceSpark} fill="none" stroke="var(--pos)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="kpi-card alert">
        <div className="kpi-card-top">
          <span className="kpi-lbl">MOROSOS</span>
          <span className="kpi-ico alert">!</span>
        </div>
        <div className="kpi-val alert">{ownerStats?.debtors || 0}</div>
        <div className="kpi-sub">{ownerStats?.pendingPayments || 0} pendiente{(ownerStats?.pendingPayments || 0) !== 1 ? 's' : ''}</div>
        <svg className="kpi-spark" viewBox="0 0 50 20" preserveAspectRatio="none">
          <polyline points={debtorSpark} fill="none" stroke="var(--neg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function PeriodTabs({ value, onChange }: { value: string; onChange: (v: 'mes' | 'trimestre' | 'año' | 'todo') => void }) {
  const opts: Array<{ key: 'mes' | 'trimestre' | 'año' | 'todo'; label: string }> = [
    { key: 'mes', label: 'Mes' },
    { key: 'trimestre', label: 'Trimestre' },
    { key: 'año', label: 'Año' },
    { key: 'todo', label: 'Todo' }
  ];
  return (
    <div className="period-tabs">
      {opts.map((o) => (
        <button key={o.key} className={`period-tab${value === o.key ? ' active' : ''}`} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ExpenseBreakdown({ yearExpenses, loading }: { yearExpenses: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="expense-breakdown card" style={{ marginBottom: 16 }}>
        <div className="card-h"><h3>Gastos por categoría</h3></div>
        <div className="card-body">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div className="skeleton-line short" style={{ marginBottom: 6 }} />
              <div className="skeleton-line" style={{ height: 6, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  const cats = expensesByCategory(yearExpenses);
  if (!cats.length) return null;
  const catTotal = cats.reduce((s, c) => s + c.amount, 0);
  return (
    <div className="expense-breakdown card" style={{ marginBottom: 16 }}>
      <div className="card-h">
        <h3>Gastos por categoría</h3>
        <div className="card-sub">${fmtK(catTotal)} total</div>
      </div>
      <div className="card-body">
        {cats.map((cat) => (
          <div key={cat.cat} className="expense-bd-item">
            <div className="expense-bd-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="expense-bd-dot" style={{ background: cat.color }} />
                <span className="expense-bd-label">{cat.label}</span>
              </div>
              <span className="expense-bd-amt">${fmtK(cat.amount)} <span style={{ color: 'var(--muted)', fontSize: 11 }}>{cat.pct}%</span></span>
            </div>
            <div className="expense-bd-bar">
              <div className="expense-bd-fill" style={{ width: `${Math.max(cat.pct, 2)}%`, background: cat.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopMovers({ yearPayments, owners, loading }: { yearPayments: any[]; owners: any[]; loading: boolean }) {
  if (loading) return null;
  const payerMap: Record<string, { owner: any; total: number; count: number }> = {};
  (yearPayments || []).forEach((p) => {
    if (!p.owner) return;
    const id = p.owner._id || p.owner;
    if (!payerMap[id]) payerMap[id] = { owner: p.owner, total: 0, count: 0 };
    payerMap[id].total += Number(p.amount || 0);
    payerMap[id].count++;
  });
  const topPayers = Object.values(payerMap).sort((a, b) => b.total - a.total).slice(0, 3);
  const topDebtors = (owners || [])
    .filter((o) => (o.totalOwed || 0) > 0)
    .sort((a, b) => (b.totalOwed || 0) - (a.totalOwed || 0))
    .slice(0, 3);

  if (!topPayers.length && !topDebtors.length) return null;

  return (
    <div className="top-movers card" style={{ marginBottom: 16 }}>
      <div className="card-h"><h3>Top propietarios</h3></div>
      <div style={{ padding: 0 }}>
        {topPayers.map(({ owner, total, count }) => (
          <div key={idOf(owner)} className="mover-row">
            <div className="mover-ava">{adminInitials(owner.name || '')}</div>
            <div className="mover-info">
              <div className="mover-name">{owner.name}</div>
              <div className="mover-meta">{owner.unit ? owner.unit + ' · ' : ''}{count} PAGO{count !== 1 ? 'S' : ''} APROBADOS</div>
            </div>
            <div className="mover-amt pos">+${fmtK(total)}<span className="mover-tag">YTD</span></div>
          </div>
        ))}
        {topDebtors.map((o) => (
          <div key={idOf(o)} className="mover-row">
            <div className="mover-ava debtor">{adminInitials(o.name || '')}</div>
            <div className="mover-info">
              <div className="mover-name">{o.name}</div>
              <div className="mover-meta">{o.unit ? o.unit + ' · ' : ''}MOROSO</div>
            </div>
            <div className="mover-amt neg">−${fmtK(o.totalOwed || 0)}<span className="mover-tag">DEUDA</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PeriodTable({ monthly, loading }: { monthly: any[]; loading: boolean }) {
  if (loading || !monthly.length) return null;
  const chip = (n: number, type: string) => (
    <span className={`period-chip ${n === 0 ? 'zero' : type}`}>{n}</span>
  );
  return (
    <div className="period-table card" style={{ marginBottom: 16, overflow: 'hidden' }}>
      <div className="card-h"><h3>Detalle por período</h3></div>
      <div className="period-table-cols">
        <span>Período</span><span>Aprobados</span><span>Pendientes</span><span>Rechazados</span><span style={{ textAlign: 'right' }}>Recaudado</span>
      </div>
      {monthly.map((m) => {
        const [yr, mo] = String(m._id).split('-');
        const mName = new Date(`${yr}-${mo}-15`).toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
        return (
          <div key={m._id} className="period-row">
            <div className="period-cell">
              <div className="period-mo">{mName}</div>
              <div className="period-yr">{yr}</div>
            </div>
            {chip(m.count || 0, 'ok')}
            {chip(m.pending || 0, 'pend')}
            {chip(m.rejected || 0, 'rej')}
            <div className="period-amt">${fmtK(m.total || 0)}</div>
          </div>
        );
      })}
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
