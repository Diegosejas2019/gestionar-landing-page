import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, Bell, Building2, CalendarCheck, CalendarClock, CalendarDays, CheckCircle2, ChevronDown,
  CreditCard, Download, FileText, HelpCircle, Home, Inbox, Landmark, LogIn, LogOut, Mail, Megaphone, MessageSquare,
  Paperclip, Plus, RefreshCw, Search, Settings, ShieldCheck, Ticket, TrendingUp, UserCheck, UserRoundCog, Users, Vote, WalletCards, X
} from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { isSuperAdminRole } from '../../services/authService';
import { clearAuthToken, getAuthToken, goGuard, goHome, goLogin, goOwnerApp, goOwnerDashboard, goSuperAdmin, isImpersonating } from '../../services/navigationService';
import { useAdminStore } from '../../stores/adminStore';
import { Table, type GridFilter } from '../../components/Table';
import {
  type AdminRoleKey,
  defaultFeatures,
  type FeatureKey,
  orgIdFromSession,
  permissionGroups,
  tabPermissions,
  type TabKey
} from './adminAccess';
import {
  CATEGORY_LABELS,
  EXPENSE_LABELS_MAP,
  PRIORITY_LABELS,
  STATUS_LABELS,
  adminInitials,
  dateLabel,
  debtAmount,
  documentCategoryLabels,
  documentVisibilityLabels,
  expensesByCategory,
  filteredMonthlyByPeriod,
  fmtK,
  formObject,
  hasDebt,
  idOf,
  money,
  normalizeNotice,
  orgLogoText,
  person,
  pick,
  roleLabels,
  salaryPaidAmount,
  salaryRemainingAmount,
  statusText,
  todayMonth,
  toLocalInput,
  unitLabel
} from './adminFormat';
import { AdminFinanceSection } from './AdminFinanceSection';
import { AdminNoticesSection } from './AdminNoticesSection';
import { AdminOwnersUnitsSection } from './AdminOwnersUnitsSection';
import { AdminDelinquencyPlansSection } from './AdminDelinquencyPlansSection';
import { AdminEmployeesSalariesSection } from './AdminEmployeesSalariesSection';
import { AdminVotesSection } from './AdminVotesSection';
import { AdminAgendaSection } from './AdminAgendaSection';
import { AdminVisitsSection } from './AdminVisitsSection';
import { AdminReservationsSection } from './AdminReservationsSection';
import { AdminClaimsSection } from './sections/AdminClaimsSection';
import { AdminSupportSection } from './sections/AdminSupportSection';
import { Actions, BusyBanner, Empty, Field, Metric, Panel, PaymentChannel, SelectField, Status } from './adminComponents';
import {
  AttentionHero,
  ClaimKanban,
  CobroStrip,
  ComplianceHero,
  ExpenseBreakdown,
  OpenClaimsSection,
  PendingCollectionSection,
  PendingReceiptsSection,
  PeriodTable,
  PeriodTabs,
  YearMonth
} from './adminWidgets';

type Notice = { type: 'ok' | 'error'; text: string } | null;
type AdminInviteMode = 'new_user' | 'existing_owner';

const VALID_TABS: TabKey[] = ['agenda', 'inicio', 'finanzas', 'morosidad', 'planes', 'empleados', 'sueldos', 'propietarios', 'solicitudes', 'comunicados', 'reclamos', 'votaciones', 'reservas', 'visitas', 'proveedores', 'documentos', 'config', 'soporte'];
const getInitialTab = (): TabKey => {
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash as TabKey) ? (hash as TabKey) : 'inicio';
};

function navigateToTab(key: TabKey) {
  window.location.hash = key;
}

const nav = [
  { key: 'agenda', label: 'Agenda', icon: CalendarClock },
  { key: 'inicio', label: 'Inicio', icon: Home },
  { key: 'finanzas', label: 'Finanzas', icon: CreditCard },
  { key: 'morosidad', label: 'Morosidad', icon: AlertTriangle },
  { key: 'planes', label: 'Planes de pago', icon: WalletCards },
  { key: 'empleados', label: 'Empleados', icon: UserRoundCog },
  { key: 'sueldos', label: 'Sueldos', icon: WalletCards },
  { key: 'propietarios', label: 'Comunidad', icon: Users },
  { key: 'solicitudes', label: 'Registro autónomo', icon: Inbox },
  { key: 'comunicados', label: 'Comunicados', icon: Megaphone },
  { key: 'reclamos', label: 'Reclamos', icon: MessageSquare },
  { key: 'votaciones', label: 'Votaciones', icon: Vote },
  { key: 'reservas', label: 'Reservas', icon: CalendarCheck },
  { key: 'visitas', label: 'Visitas', icon: LogIn },
  { key: 'proveedores', label: 'Proveedores', icon: Landmark },
  { key: 'documentos', label: 'Documentos', icon: FileText },
  { key: 'config', label: 'Configuración', icon: Settings },
  { key: 'soporte', label: 'Soporte', icon: HelpCircle }
] as const;

const adminRoleLabels: Record<string, string> = {
  owner_admin: 'Administrador principal',
  read_only: 'Solo lectura',
  billing_manager: 'Cobranzas',
  communications_manager: 'Reclamos y avisos'
};

const adminRoleDescriptions: Record<string, string> = {
  owner_admin: 'Acceso total a todos los módulos de la organización.',
  read_only: 'Puede consultar información, pero no puede crear, editar, eliminar ni registrar pagos.',
  billing_manager: 'Puede ver propietarios, deudas, pagos y recibos, y registrar pagos.',
  communications_manager: 'Puede gestionar reclamos, avisos y comunicaciones.'
};

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

const tabCrumbs: Record<string, string[]> = {
  inicio: ['Inicio'],
  finanzas: ['Finanzas', 'Cobranza'],
  morosidad: ['Finanzas', 'Morosidad'],
  planes: ['Finanzas', 'Planes de pago'],
  empleados: ['Administración', 'Personal'],
  sueldos: ['Administración', 'Sueldos'],
  propietarios: ['Comunidad', 'Propietarios'],
  solicitudes: ['Comunidad', 'Solicitudes'],
  comunicados: ['Comunidad', 'Comunicados'],
  reclamos: ['Comunidad', 'Reclamos'],
  votaciones: ['Operaciones', 'Votaciones'],
  reservas: ['Operaciones', 'Reservas'],
  visitas: ['Operaciones', 'Visitas e ingresos'],
  proveedores: ['Administración', 'Proveedores'],
  documentos: ['Administración', 'Documentos'],
  config: ['Administración', 'Configuración'],
  soporte: ['Soporte', 'Mis tickets'],
};

export function AdminPreviewPage() {
  const readOnly = isImpersonating();
  const [tab, setTab] = useState<TabKey>(getInitialTab);
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (VALID_TABS.includes(hash as TabKey)) setTab(hash as TabKey);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const [finSubTab, setFinSubTab] = useState<'cobranza' | 'egresos' | 'noIdentificados'>('cobranza');
  const [dashPeriod, setDashPeriod] = useState<'mes' | 'trimestre' | 'año' | 'todo'>('año');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedTabs = useRef<Set<TabKey>>(new Set());
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
  const [noticeTemplates, setNoticeTemplates] = useState<any[]>([]);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [noticeTargetType, setNoticeTargetType] = useState('all');
  const [noticeStats, setNoticeStats] = useState<Record<string, any>>({});
  const [noticeFilters, setNoticeFilters] = useState({ status: 'all', category: 'all', priority: 'all', search: '' });
  const [delinquencySummary, setDelinquencySummary] = useState<any>({});
  const [delinquencyAging, setDelinquencyAging] = useState<any[]>([]);
  const [delinquencyOwners, setDelinquencyOwners] = useState<any[]>([]);
  const [delinquencyPagination, setDelinquencyPagination] = useState<any>({ total: 0, page: 1, pages: 1, limit: 10 });
  const [delinquencyFilters, setDelinquencyFilters] = useState({ search: '', period: '', status: 'all', sort: 'debt_desc', minDebt: '', minDaysOverdue: '', pendingReview: false, criticalOnly: false, page: 1, limit: 10 });
  const [delinquencyDetail, setDelinquencyDetail] = useState<any>(null);
  const [debtReminder, setDebtReminder] = useState<any>(null);
  const [debtReminderMessage, setDebtReminderMessage] = useState('');
  const [debtReminderChannel, setDebtReminderChannel] = useState('app');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [voteOptions, setVoteOptions] = useState(['', '']);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [employeeFiles, setEmployeeFiles] = useState<File[]>([]);
  const [empModalRole, setEmpModalRole] = useState('maintenance');
  const [empIsOnLeave, setEmpIsOnLeave] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState<any>(null);
  const [showSalaryPaymentModal, setShowSalaryPaymentModal] = useState(false);
  const [salaryForPayment, setSalaryForPayment] = useState<any>(null);
  const [salaryPaymentType, setSalaryPaymentType] = useState('advance');
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [showOrgDocumentModal, setShowOrgDocumentModal] = useState(false);
  const [editingOrgDocument, setEditingOrgDocument] = useState<any>(null);
  const [adminRole, setAdminRole] = useState<AdminRoleKey | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminRoles, setAdminRoles] = useState<any[]>([]);
  const [showAdminInviteModal, setShowAdminInviteModal] = useState(false);
  const [adminInviteMode, setAdminInviteMode] = useState<AdminInviteMode>('new_user');
  const [adminInviteRole, setAdminInviteRole] = useState('read_only');
  const [adminOwnerQuery, setAdminOwnerQuery] = useState('');
  const [adminOwnerResults, setAdminOwnerResults] = useState<any[]>([]);
  const [selectedAdminOwner, setSelectedAdminOwner] = useState<any>(null);
  const [editingAdminUser, setEditingAdminUser] = useState<any>(null);
  const [unidentifiedPayments, setUnidentifiedPayments] = useState<any[]>([]);
  const [unidentifiedPaymentsLoading, setUnidentifiedPaymentsLoading] = useState(false);
  const [unidentifiedPaymentsSummary, setUnidentifiedPaymentsSummary] = useState<any>({});
  const [unidentifiedPaymentsFilters, setUnidentifiedPaymentsFilters] = useState({ status: 'all', method: 'all', search: '', dateFrom: '', dateTo: '' });
  const [showUnidentifiedDetailModal, setShowUnidentifiedDetailModal] = useState(false);
  const [showUnidentifiedAssociateModal, setShowUnidentifiedAssociateModal] = useState(false);
  const [selectedUnidentified, setSelectedUnidentified] = useState<any>(null);
  const [paymentPlans, setPaymentPlans] = useState<any[]>([]);
  const [paymentPlansLoading, setPaymentPlansLoading] = useState(false);
  const [paymentPlanStatus, setPaymentPlanStatus] = useState('all');
  const [accessRequests, setAccessRequests] = useState<any[]>([]);
  const [accessRequestsLoading, setAccessRequestsLoading] = useState(false);
  const [accessRequestStatus, setAccessRequestStatus] = useState('pending');
  const [accessSettings, setAccessSettings] = useState<any>(null);
  const [arApproveModal, setArApproveModal] = useState<{ request: any; availableUnits: any[] } | null>(null);
  const [arApproveUnitIds, setArApproveUnitIds] = useState<string[]>([]);
  const [arApproveCharge, setArApproveCharge] = useState(true);
  const [arRejectModal, setArRejectModal] = useState<{ request: any } | null>(null);
  const [arRejectReason, setArRejectReason] = useState('');
  const [renditionPreview, setRenditionPreview] = useState<any>(null);
  const [renditionHistory, setRenditionHistory] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportTicketsLoading, setSupportTicketsLoading] = useState(false);
  const [ppEnabled, setPpEnabled] = useState(true);
  const [ppAllowOwnerRequests, setPpAllowOwnerRequests] = useState(true);

  const { me, membership, config, features, ownerStats, dashboard, owners, units, payments, notices, claims, expenses, employees, salaries, providers, votes, visits, spaces, reservations, orgDocuments, yearExpenses, yearPayments, report } = useAdminStore();
  const setMe = useAdminStore(s => s.setMe);
  const setConfig = useAdminStore(s => s.setConfig);
  const setFeatures = useAdminStore(s => s.setFeatures);
  const setOwnerStats = useAdminStore(s => s.setOwnerStats);
  const setDashboard = useAdminStore(s => s.setDashboard);
  const setOwners = useAdminStore(s => s.setOwners);
  const setUnits = useAdminStore(s => s.setUnits);
  const setPayments = useAdminStore(s => s.setPayments);
  const setNotices = useAdminStore(s => s.setNotices);
  const setClaims = useAdminStore(s => s.setClaims);
  const setExpenses = useAdminStore(s => s.setExpenses);
  const setEmployees = useAdminStore(s => s.setEmployees);
  const setSalaries = useAdminStore(s => s.setSalaries);
  const setProviders = useAdminStore(s => s.setProviders);
  const setVotes = useAdminStore(s => s.setVotes);
  const setVisits = useAdminStore(s => s.setVisits);
  const setSpaces = useAdminStore(s => s.setSpaces);
  const setReservations = useAdminStore(s => s.setReservations);
  const setOrgDocuments = useAdminStore(s => s.setOrgDocuments);
  const setYearExpenses = useAdminStore(s => s.setYearExpenses);
  const setYearPayments = useAdminStore(s => s.setYearPayments);
  const setReport = useAdminStore(s => s.setReport);

  const hasPermission = useCallback((permission: string) => (
    adminRole === 'owner_admin' || permissions.includes(permission)
  ), [adminRole, permissions]);
  const canSeeTab = useCallback((key: TabKey) => hasPermission(tabPermissions[key]), [hasPermission]);

  const moduleEnabled = (key: FeatureKey) => features?.[key] ?? defaultFeatures[key];
  const hasOperations = (moduleEnabled('votes') && canSeeTab('votaciones'))
    || (moduleEnabled('reservations') && canSeeTab('reservas'))
    || (moduleEnabled('visits') && canSeeTab('visitas'));
  const visibleNav = nav.filter((item) => {
    if (!canSeeTab(item.key)) return false;
    if (item.key === 'comunicados') return moduleEnabled('notices');
    if (item.key === 'reclamos') return moduleEnabled('claims');
    if (item.key === 'votaciones') return moduleEnabled('votes');
    if (item.key === 'reservas') return moduleEnabled('reservations');
    if (item.key === 'visitas') return moduleEnabled('visits');
    if (item.key === 'proveedores') return moduleEnabled('providers');
    if (item.key === 'documentos') return moduleEnabled('documents');
    return canSeeTab(item.key);
  });

  useEffect(() => {
    if (!showAdminInviteModal || adminInviteMode !== 'existing_owner') return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await adminApi.adminUsers.searchOwners(adminOwnerQuery);
        if (!cancelled) setAdminOwnerResults(pick(response, 'owners', []));
      } catch {
        if (!cancelled) setAdminOwnerResults([]);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [showAdminInviteModal, adminInviteMode, adminOwnerQuery]);

  const totalIncome = useMemo(
    () => (dashboard?.monthly || []).reduce((sum: number, item: any) => sum + Number(item.total || 0), 0),
    [dashboard]
  );
  const availableOwnerUnits = useMemo(
    () => [...(units || [])]
      .filter((unit: any) => !unit.owner && unit.status !== 'occupied')
      .sort((a: any, b: any) => String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' })),
    [units]
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
  const normalizedNotices = useMemo(() => (notices || []).map(normalizeNotice), [notices]);
  const filteredNotices = useMemo(() => {
    const query = noticeFilters.search.trim().toLowerCase();
    return normalizedNotices.filter((item: any) => {
      if (noticeFilters.status !== 'all' && item.status !== noticeFilters.status) return false;
      if (noticeFilters.category !== 'all' && item.category !== noticeFilters.category) return false;
      if (noticeFilters.priority !== 'all' && item.priority !== noticeFilters.priority) return false;
      if (query && !`${item.title} ${item.subject} ${item.body}`.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [normalizedNotices, noticeFilters]);
  const noticeCounts = useMemo(() => normalizedNotices.reduce((acc: Record<string, number>, item: any) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    if (item.priority === 'urgent') acc.urgent = (acc.urgent || 0) + 1;
    return acc;
  }, { sent: 0, scheduled: 0, draft: 0, urgent: 0 }), [normalizedNotices]);
  const publicJoinUrl = useMemo(() => (
    accessSettings?.publicJoinCode
      ? `${window.location.origin}/join/${encodeURIComponent(accessSettings.publicJoinCode)}`
      : ''
  ), [accessSettings?.publicJoinCode]);

  const delinquencyParams = useCallback((overrides: Record<string, unknown> = {}) => {
    const merged = { ...delinquencyFilters, ...overrides };
    return Object.fromEntries(Object.entries(merged).filter(([, value]) => value !== '' && value !== false && value !== 'all' && value !== null && value !== undefined));
  }, [delinquencyFilters]);

  const toggleOwnerUnit = useCallback((unitId: string) => {
    setOwnerSelectedUnitIds((current) => {
      const next = new Set(current);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }, []);

  async function fetchSession() {
    const [me, permissionsRes] = await Promise.all([
      adminApi.me(),
      adminApi.permissions.me()
    ]);
    const role = (permissionsRes?.data?.role || null) as AdminRoleKey | null;
    const sessionPermissions = permissionsRes?.data?.permissions || [];
    const can = (permission: string) => role === 'owner_admin' || sessionPermissions.includes(permission);
    const config = can('settings.read') ? await adminApi.config.get() : null;
    const configData = pick(config, 'config', {});
    const orgId = orgIdFromSession(me, configData);
    const featuresRes = orgId ? await adminApi.organizations.features(orgId) : null;
    const features = { ...defaultFeatures, ...pick<Record<string, boolean>>(featuresRes, 'features', {}) };
    return {
      me,
      config: configData,
      features,
      permissions: sessionPermissions,
      adminRole: role,
      adminRoles: permissionsRes?.data?.roles || []
    };
  }

  async function fetchForTab(target: TabKey, extra?: { me: any; config: any; features: Record<string, boolean>; permissions: string[]; adminRole: string | null; adminRoles: any[] }) {
    if (!extra) return;
    const { features } = extra;
    const isEnabled = (key: FeatureKey) => features[key] ?? defaultFeatures[key];
    const can = (permission: string) => extra.adminRole === 'owner_admin' || extra.permissions.includes(permission);
    const next: any = {};

    const core = [
      can('dashboard.read') ? adminApi.owners.stats() : Promise.resolve(null),
      can('dashboard.read') ? adminApi.payments.dashboard(year) : Promise.resolve(null),
      can('payments.read') ? adminApi.payments.list({ limit: 8, status: 'pending' }) : Promise.resolve(null),
      can('reports.read') ? adminApi.reports.monthly(month) : Promise.resolve(null),
      can('claims.read') && isEnabled('claims') ? adminApi.claims.list({ limit: 8, status: 'open' }) : Promise.resolve(null),
      can('notices.read') && isEnabled('notices') ? adminApi.notices.list({ limit: 5 }) : Promise.resolve(null)
    ];
    const [ownerStats, dashboard, payments, report, claims, notices] = await Promise.all(core);
    next.ownerStats = ownerStats?.data || {};
    next.dashboard = dashboard?.data || {};
    next.payments = sortPayments(pick(payments, 'payments', []));
    next.claims = isEnabled('claims') ? pick(claims, 'claims', []) : [];
    next.notices = isEnabled('notices') ? pick(notices, 'notices', []) : [];
    next.report = report?.data || {};

    if (target === 'propietarios' || target === 'comunicados' || target === 'reclamos' || target === 'inicio') {
      const [owners, units, allClaims, allNotices, templates] = await Promise.all([
        can('owners.read') ? adminApi.owners.list({ limit: 50 }) : Promise.resolve(null),
        can('units.read') ? adminApi.units.list({ limit: 200 }) : Promise.resolve(null),
        can('claims.read') && isEnabled('claims') ? adminApi.claims.list({ limit: 50 }) : Promise.resolve(null),
        can('notices.read') && isEnabled('notices') ? adminApi.notices.list({ limit: 200 }) : Promise.resolve(null),
        can('notices.read') && isEnabled('notices') ? adminApi.noticeTemplates.list() : Promise.resolve(null)
      ]);
      next.owners = pick(owners, 'owners', []);
      next.units = pick(units, 'units', []);
      next.claims = isEnabled('claims') ? pick(allClaims, 'claims', next.claims) : [];
      next.notices = isEnabled('notices') ? pick(allNotices, 'notices', next.notices) : [];
      if (target === 'comunicados') setNoticeTemplates(pick(templates, 'templates', []));
    }

    if (target === 'finanzas') {
      const [allPayments, expenses, allYearExpenses, allYearPayments, units] = await Promise.all([
        can('payments.read') ? adminApi.payments.list({ limit: 100, effectiveMonth: month }) : Promise.resolve(null),
        can('expenses.read') ? adminApi.expenses.list({ limit: 50, month }) : Promise.resolve(null),
        can('expenses.read') ? adminApi.expenses.list({ limit: 500 }) : Promise.resolve(null),
        can('payments.read') ? adminApi.payments.list({ limit: 500, status: 'approved' }) : Promise.resolve(null),
        can('units.read') ? adminApi.units.list({ limit: 200 }) : Promise.resolve(null)
      ]);
      next.payments = sortPayments(pick(allPayments, 'payments', []));
      next.expenses = sortExpenses(pick(expenses, 'expenses', []));
      next.units = pick(units, 'units', []);
      const yearStr = String(year);
      next.yearExpenses = pick(allYearExpenses, 'expenses', []).filter((e: any) => (e.date || e.createdAt || '').slice(0, 4) === yearStr);
      next.yearPayments = pick(allYearPayments, 'payments', []).filter((p: any) =>
        p.month ? p.month.startsWith(yearStr) : (p.createdAt || '').startsWith(yearStr)
      );
    }

    if (target === 'morosidad') {
      const params = delinquencyParams();
      const [summary, aging, owners] = await Promise.all([
        can('debt.read') ? adminApi.delinquency.summary(params) : Promise.resolve(null),
        can('debt.read') ? adminApi.delinquency.aging(params) : Promise.resolve(null),
        can('debt.read') ? adminApi.delinquency.owners(params) : Promise.resolve(null),
      ]);
      setDelinquencySummary(summary?.data?.summary || {});
      setDelinquencyAging(aging?.data?.buckets || []);
      setDelinquencyOwners(pick(owners, 'owners', []));
      setDelinquencyPagination(owners?.pagination || { total: 0, page: 1, pages: 1, limit: delinquencyFilters.limit });
    }

    if (target === 'planes') {
      setPaymentPlansLoading(true);
      try {
        const params = paymentPlanStatus === 'all' ? { limit: 200 } : { limit: 200, status: paymentPlanStatus };
        const plans = can('paymentPlans.read') ? await adminApi.paymentPlans.listAdmin(params) : null;
        setPaymentPlans(pick(plans, 'plans', []));
      } finally {
        setPaymentPlansLoading(false);
      }
    }

    if (target === 'solicitudes') {
      setAccessRequestsLoading(true);
      try {
        const [requests, settings] = await Promise.all([
          can('owners.create') ? adminApi.accessRequests.list({ status: accessRequestStatus, limit: 100 }) : Promise.resolve(null),
          can('settings.read') ? adminApi.accessRequests.settings().catch(() => null) : Promise.resolve(null)
        ]);
        setAccessRequests(pick(requests, 'requests', []));
        setAccessSettings(settings?.data?.settings || settings?.data || null);
      } finally {
        setAccessRequestsLoading(false);
      }
    }

    if (target === 'empleados') {
      const employees = can('employees.read') ? await adminApi.employees.list({ isActive: '', limit: 200 }) : null;
      next.employees = pick(employees, 'employees', []);
    }

    if (target === 'sueldos') {
      const [salaries, employees] = await Promise.all([
        can('salaries.read') ? adminApi.salaries.list({ limit: 200, period: month }) : Promise.resolve(null),
        can('employees.read') ? adminApi.employees.list({ isActive: '', limit: 200 }) : Promise.resolve(null)
      ]);
      next.salaries = pick(salaries, 'salaries', []);
      next.employees = pick(employees, 'employees', []);
    }

    if (target === 'votaciones') {
      const votesRes = can('votes.read') && isEnabled('votes') ? await adminApi.votes.list({ limit: 50 }) : null;
      next.votes = isEnabled('votes') ? pick(votesRes, 'votes', []) : [];
    }

    if (target === 'reservas') {
      const [spaces, reservations] = await Promise.all([
        can('spaces.read') && isEnabled('reservations') ? adminApi.spaces.list() : Promise.resolve(null),
        can('reservations.read') && isEnabled('reservations') ? adminApi.reservations.list({ limit: 50 }) : Promise.resolve(null)
      ]);
      next.spaces = isEnabled('reservations') ? pick(spaces, 'spaces', []) : [];
      next.reservations = isEnabled('reservations') ? pick(reservations, 'reservations', []) : [];
    }

    if (target === 'visitas') {
      const visitsRes = can('visits.read') && isEnabled('visits') ? await adminApi.visits.list({ limit: 100 }) : null;
      next.visits = isEnabled('visits') ? pick(visitsRes, 'visits', []) : [];
    }

    if (target === 'proveedores') {
      const [providers, expenses] = await Promise.all([
        can('providers.read') && isEnabled('providers') ? adminApi.providers.list() : Promise.resolve(null),
        can('expenses.read') ? adminApi.expenses.list({ limit: 500 }) : Promise.resolve(null)
      ]);
      next.providers = isEnabled('providers') ? pick(providers, 'providers', []) : [];
      const yearStr = String(new Date().getFullYear());
      next.yearExpenses = pick(expenses, 'expenses', []).filter((e: any) => (e.date || e.createdAt || '').slice(0, 4) === yearStr);
    }

    if (target === 'documentos') {
      const documents = can('documents.read') ? await adminApi.documents.list() : null;
      next.orgDocuments = pick(documents, 'documents', []);
    }

    if (target === 'soporte') {
      setSupportTicketsLoading(true);
      try {
        const res = await adminApi.support.listMy();
        setSupportTickets(pick(res, 'tickets', []));
      } finally {
        setSupportTicketsLoading(false);
      }
    }

    if (target === 'config' && can('admins.read')) {
      const admins = await adminApi.adminUsers.list();
      next.adminUsers = pick(admins, 'admins', []);
      next.adminRoles = admins?.data?.roles || extra.adminRoles || [];
    }

    return next;
  }

  async function refresh(target: TabKey = tab, silent = false) {
    const isFirstVisit = !loadedTabs.current.has(target);
    if (silent) {
      // no visual indicator
    } else if (isFirstVisit) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const session = await fetchSession();
      const user = session.me?.data?.user;
      setMe(user ?? null, session.me?.data?.membership ?? null);
      setConfig(session.config);
      setFeatures(session.features);
      setAdminRole(session.adminRole);
      if (session.adminRole === 'security_guard') {
        goGuard();
        return;
      }
      setPermissions(session.permissions);
      setAdminRoles(session.adminRoles);

      const tabData = await fetchForTab(target, session);
      if (tabData) {
        if (tabData.ownerStats !== undefined) setOwnerStats(tabData.ownerStats);
        if (tabData.dashboard !== undefined) setDashboard(tabData.dashboard);
        if (tabData.payments !== undefined) setPayments(tabData.payments);
        if (tabData.claims !== undefined) setClaims(tabData.claims);
        if (tabData.notices !== undefined) setNotices(tabData.notices);
        if (tabData.report !== undefined) setReport(tabData.report);
        if (tabData.owners !== undefined) setOwners(tabData.owners);
        if (tabData.units !== undefined) setUnits(tabData.units);
        if (tabData.expenses !== undefined) setExpenses(tabData.expenses);
        if (tabData.employees !== undefined) setEmployees(tabData.employees);
        if (tabData.salaries !== undefined) setSalaries(tabData.salaries);
        if (tabData.providers !== undefined) setProviders(tabData.providers);
        if (tabData.votes !== undefined) setVotes(tabData.votes);
        if (tabData.visits !== undefined) setVisits(tabData.visits);
        if (tabData.spaces !== undefined) setSpaces(tabData.spaces);
        if (tabData.reservations !== undefined) setReservations(tabData.reservations);
        if (tabData.orgDocuments !== undefined) setOrgDocuments(tabData.orgDocuments);
        if (tabData.yearExpenses !== undefined) setYearExpenses(tabData.yearExpenses);
        if (tabData.yearPayments !== undefined) setYearPayments(tabData.yearPayments);
        if (tabData.adminUsers !== undefined) setAdminUsers(tabData.adminUsers);
        if (tabData.adminRoles !== undefined) setAdminRoles(tabData.adminRoles);
      }

      setNotice(null);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo cargar el dashboard.' });
    } finally {
      loadedTabs.current.add(target);
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!getAuthToken()) {
      goLogin();
      return;
    }
    adminApi.me()
      .then((response) => {
        const user = response?.data?.user;
        if (isSuperAdminRole(user?.role)) {
          goSuperAdmin();
          return;
        }
        if (response?.data?.accessType === 'owner' || user?.role === 'owner') {
          goOwnerDashboard();
          return;
        }
        setMe(user ?? null, response?.data?.membership ?? null);
        setAuthChecked(true);
      })
      .catch(() => {
        clearAuthToken();
        goLogin();
      });
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (adminRole && !canSeeTab(tab)) {
      const fallback = (visibleNav[0]?.key || 'inicio') as TabKey;
      navigateToTab(fallback);
      return;
    }
    refresh(tab);
  }, [authChecked, tab, month, year, adminRole, permissions, delinquencyFilters, paymentPlanStatus, accessRequestStatus]);

  useEffect(() => {
    if ((tab === 'votaciones' || tab === 'reservas') && !hasOperations) setTab('inicio');
    if (tab === 'visitas' && !moduleEnabled('visits')) setTab('inicio');
    if (tab === 'proveedores' && !moduleEnabled('providers')) setTab('inicio');
    if (tab === 'documentos' && !moduleEnabled('documents')) setTab('inicio');
  }, [tab, hasOperations, features]);

  // Sync payment-plan toggles from loaded config
  useEffect(() => {
    if (!config) return;
    setPpEnabled((config as any).paymentPlansEnabled !== false);
    setPpAllowOwnerRequests((config as any).paymentPlansAllowOwnerRequests !== false);
  }, [config]);

  async function run(label: string, action: () => Promise<unknown>, success = 'Cambios guardados.') {
    setBusy(label);
    try {
      await action();
      setNotice({ type: 'ok', text: success });
      await refresh(tab, true);
      return true;
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No pudimos completar la acción.' });
      return false;
    } finally {
      setBusy('');
    }
  }

  function logout() {
    clearAuthToken();
    goHome();
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

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPaymentReceipt(payment: any, kind: 'uploaded' | 'system') {
    const id = idOf(payment);
    await run(`${kind}-receipt-${id}`, async () => {
      const blob = kind === 'uploaded'
        ? await adminApi.payments.receipt(id)
        : await adminApi.payments.systemReceipt(id);
      const name = kind === 'uploaded'
        ? `comprobante_${id}.pdf`
        : `recibo_${payment.receiptNumber || id}.pdf`;
      downloadBlob(blob, name);
    }, kind === 'uploaded' ? 'Comprobante descargado.' : 'Recibo descargado.');
  }

  async function resendPaymentReceipt(payment: any) {
    await run(`resend-receipt-${idOf(payment)}`, () => adminApi.payments.resendReceipt(idOf(payment)), 'Recibo reenviado por email.');
  }

  async function downloadDelinquencyCsv(ownerId?: string) {
    await run(ownerId ? `debt-csv-${ownerId}` : 'delinquency-csv', async () => {
      const blob = ownerId
        ? await adminApi.delinquency.ownerExport(ownerId)
        : await adminApi.delinquency.export(delinquencyParams());
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = ownerId ? 'estado_deuda.csv' : 'morosidad.csv';
      anchor.click();
      URL.revokeObjectURL(url);
    }, 'CSV generado.');
  }

  async function loadRenditionPreview() {
    await run(`rendition-${month}`, async () => {
      const [preview, history] = await Promise.all([
        adminApi.renditions.preview(month),
        adminApi.renditions.history().catch(() => null)
      ]);
      setRenditionPreview(preview?.data?.rendition || preview?.data || null);
      setRenditionHistory(pick(history, 'renditions', []));
    }, 'Liquidación actualizada.');
  }

  async function generateRenditionPdf() {
    await run(`rendition-pdf-${month}`, () => adminApi.renditions.generatePdf(month), 'PDF de rendición generado.');
  }

  async function exportRenditionCsv(section: string) {
    await run(`rendition-csv-${section}`, async () => {
      const blob = await adminApi.renditions.exportCsv(month, section);
      downloadBlob(blob, `rendicion_${month}_${section}.csv`);
    }, 'CSV de rendición generado.');
  }

  async function fetchUnidentifiedPayments() {
    setUnidentifiedPaymentsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (unidentifiedPaymentsFilters.status !== 'all') params.status = unidentifiedPaymentsFilters.status;
      if (unidentifiedPaymentsFilters.method !== 'all') params.paymentMethod = unidentifiedPaymentsFilters.method;
      if (unidentifiedPaymentsFilters.search) params.search = unidentifiedPaymentsFilters.search;
      if (unidentifiedPaymentsFilters.dateFrom) params.dateFrom = unidentifiedPaymentsFilters.dateFrom;
      if (unidentifiedPaymentsFilters.dateTo) params.dateTo = unidentifiedPaymentsFilters.dateTo;
      const [listRes, summaryRes] = await Promise.all([
        adminApi.unidentifiedPayments.list(params),
        adminApi.unidentifiedPayments.summary()
      ]);
      setUnidentifiedPayments(pick(listRes, 'payments', []));
      setUnidentifiedPaymentsSummary(pick(summaryRes, 'summary', {}));
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No se pudieron cargar los pagos no identificados.' });
    } finally {
      setUnidentifiedPaymentsLoading(false);
    }
  }

  async function openUnidentifiedDetail(payment: any) {
    setSelectedUnidentified(payment);
    setShowUnidentifiedDetailModal(true);
  }

  async function openUnidentifiedAssociate(payment: any) {
    setSelectedUnidentified(payment);
    setShowUnidentifiedAssociateModal(true);
  }

  async function handleUnidentifiedReject(payment: any) {
    const reason = window.prompt('Motivo de rechazo (opcional)') || '';
    await run(`unidentified-reject-${idOf(payment)}`, () => adminApi.unidentifiedPayments.reject(idOf(payment), reason), 'Pago rechazado.');
    fetchUnidentifiedPayments();
  }

  async function handleUnidentifiedArchive(payment: any) {
    const reason = window.prompt('Motivo de archivo (opcional)') || '';
    await run(`unidentified-archive-${idOf(payment)}`, () => adminApi.unidentifiedPayments.archive(idOf(payment), reason), 'Pago archivado.');
    fetchUnidentifiedPayments();
  }

  async function approvePaymentPlan(plan: any) {
    const installments = Number(window.prompt('Cantidad de cuotas', String(plan.installmentsCount || 3)) || 0);
    if (!installments || installments < 1) return;
    const startDate = window.prompt('Fecha de inicio (YYYY-MM-DD)', new Date().toISOString().slice(0, 10));
    if (!startDate) return;
    await run(`plan-approve-${idOf(plan)}`, () => adminApi.paymentPlans.approve(idOf(plan), {
      installmentsCount: installments,
      startDate,
      interestType: 'none',
      interestValue: 0
    }), 'Plan aprobado.');
  }

  async function rejectPaymentPlan(plan: any) {
    const rejectionReason = window.prompt('Motivo del rechazo') || '';
    await run(`plan-reject-${idOf(plan)}`, () => adminApi.paymentPlans.reject(idOf(plan), { rejectionReason }), 'Plan rechazado.');
  }

  async function cancelPaymentPlan(plan: any) {
    if (!window.confirm('¿Cancelar este plan de pago?')) return;
    await run(`plan-cancel-${idOf(plan)}`, () => adminApi.paymentPlans.cancel(idOf(plan)), 'Plan cancelado.');
  }

  async function registerPlanInstallment(installment: any) {
    if (!window.confirm('¿Registrar esta cuota como pagada?')) return;
    await run(`installment-${idOf(installment)}`, () => adminApi.paymentPlans.registerInstallmentPayment(idOf(installment)), 'Cuota registrada como pagada.');
  }

  async function approveAccessRequest(request: any) {
    const availableUnits = (units || []).filter((u: any) => !u.owner && u.active !== false);
    const query = (request.requestedUnitLabel || '').toLowerCase().trim();
    const suggested = query
      ? availableUnits.filter((u: any) => u.name?.toLowerCase().includes(query) || query.includes((u.name || '').toLowerCase()))
      : [];
    setArApproveUnitIds(suggested.map((u: any) => idOf(u)));
    setArApproveCharge(true);
    setArApproveModal({ request, availableUnits });
  }

  async function doApproveRequest() {
    if (!arApproveModal) return;
    const ok = await run(
      `access-approve-${idOf(arApproveModal.request)}`,
      () => adminApi.accessRequests.approve(idOf(arApproveModal.request), {
        unitIds: arApproveUnitIds,
        chargeCurrentMonth: arApproveCharge,
      }),
      'Solicitud aprobada. El propietario recibirá un email con sus datos de acceso.'
    );
    if (ok) setArApproveModal(null);
  }

  async function rejectAccessRequest(request: any) {
    setArRejectReason('');
    setArRejectModal({ request });
  }

  async function doRejectRequest() {
    if (!arRejectModal) return;
    const ok = await run(
      `access-reject-${idOf(arRejectModal.request)}`,
      () => adminApi.accessRequests.reject(idOf(arRejectModal.request), { rejectionReason: arRejectReason }),
      'Solicitud rechazada.'
    );
    if (ok) setArRejectModal(null);
  }

  async function toggleAccessRequestSettings(enabled: boolean) {
    await run('access-settings', () => adminApi.accessRequests.updateSettings({ publicJoinEnabled: enabled }), 'Configuración de solicitudes actualizada.');
  }

  async function regenerateAccessCode() {
    await run('access-code', () => adminApi.accessRequests.regenerateCode(), 'Código regenerado.');
  }

  async function copyAccessJoinLink() {
    if (!publicJoinUrl) return;
    try {
      await navigator.clipboard.writeText(publicJoinUrl);
      setNotice({ type: 'ok', text: 'Enlace copiado.' });
    } catch {
      setNotice({ type: 'error', text: 'No pudimos copiar el enlace. Podés seleccionarlo manualmente.' });
    }
  }

  async function openDelinquencyDetail(ownerId: string) {
    setBusy(`debt-detail-${ownerId}`);
    try {
      const response = await adminApi.delinquency.owner(ownerId);
      setDelinquencyDetail(response?.data?.detail || null);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo cargar el detalle de deuda.' });
    } finally {
      setBusy('');
    }
  }

  async function openDebtReminder(owner: any) {
    const response = await adminApi.delinquency.owner(idOf(owner));
    const detail = response?.data?.detail;
    const summary = detail?.summary || owner;
    const periods = (summary.unpaidPeriods || []).join(', ') || 'saldo pendiente';
    setDebtReminder(detail);
    setDebtReminderChannel('app');
    setDebtReminderMessage(`Hola ${detail?.owner?.name || person(owner)},\nTe informamos que registrás una deuda pendiente de ${money(summary.totalOwed)} correspondiente a ${periods}.\nPodés consultar el detalle y regularizar tu situación desde GestionAr.\n\nMuchas gracias.`);
  }

  async function sendDebtReminder() {
    if (!debtReminder?.owner?._id && !debtReminder?.owner?.id) return;
    if (!debtReminderMessage.trim()) {
      setNotice({ type: 'error', text: 'El mensaje del recordatorio es obligatorio.' });
      return;
    }
    const ownerId = idOf(debtReminder.owner);
    await run(`debt-reminder-${ownerId}`, () => adminApi.delinquency.reminder(ownerId, {
      channel: debtReminderChannel,
      message: debtReminderMessage
    }), debtReminderChannel === 'app' ? 'Recordatorio enviado.' : 'Recordatorio registrado.');
    setDebtReminder(null);
  }

  function openWhatsApp(phone?: string, message?: string) {
    const digits = String(phone || '').replace(/\D/g, '');
    if (!digits) {
      setNotice({ type: 'error', text: 'Este propietario no tiene teléfono cargado.' });
      return;
    }
    const normalized = digits.startsWith('54') ? digits : `54${digits}`;
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(message || '')}`, '_blank', 'noopener,noreferrer');
  }

  async function notifyOwner(owner: any) {
    const title = window.prompt('Título de la notificación', 'Aviso de administración');
    if (!title) return;
    const message = window.prompt('Mensaje') || '';
    if (!message.trim()) return;
    await run(`notify-${idOf(owner)}`, () => adminApi.owners.notify(idOf(owner), title, message), 'Notificación enviada.');
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

  function openNoticeComposer(item?: any) {
    const normalized = item ? normalizeNotice(item) : null;
    setEditingNotice(normalized);
    setNoticeTargetType(normalized?.targetType || 'all');
    setNoticeFiles([]);
    setShowNoticeModal(true);
  }

  function selectedFormValues(form: HTMLFormElement, name: string) {
    return Array.from(form.querySelectorAll<HTMLSelectElement | HTMLInputElement>(`[name="${name}"] option:checked, input[name="${name}"]:checked`))
      .map((el: any) => el.value)
      .filter(Boolean);
  }

  function buildNoticePayload(form: HTMLFormElement, action: 'draft' | 'schedule' | 'send') {
    const data = formObject({ currentTarget: form } as FormEvent<HTMLFormElement>);
    const scheduledAt = String(data.scheduledAt || '');
    if (action === 'schedule' && !scheduledAt) throw new Error('Elegí una fecha futura para programar.');
    if (scheduledAt && new Date(scheduledAt) <= new Date()) throw new Error('La fecha de programación debe ser futura.');
    const targetType = String(data.targetType || 'all');
    const targetFilters = {
      unitIds: targetType === 'specific_units' ? selectedFormValues(form, 'unitIds') : [],
      userIds: targetType === 'specific_users' ? selectedFormValues(form, 'userIds') : [],
      onlyWithDebt: targetType === 'debtors',
      includeInactive: false
    };
    if (targetType === 'specific_units' && targetFilters.unitIds.length === 0) throw new Error('Seleccioná al menos una unidad.');
    if (targetType === 'specific_users' && targetFilters.userIds.length === 0) throw new Error('Seleccioná al menos un propietario.');
    if (targetType === 'all' && action === 'send' && !window.confirm('Vas a enviar este comunicado a todos los propietarios.')) return null;
    return {
      title: String(data.title || '').trim(),
      subject: String(data.subject || data.title || '').trim(),
      body: String(data.body || '').trim(),
      category: String(data.category || 'general'),
      priority: String(data.priority || 'normal'),
      targetType,
      targetFilters,
      channels: {
        app: true,
        email: data.email === 'on',
        push: data.push === 'on',
        whatsapp: data.whatsapp === 'on'
      },
      scheduledAt: scheduledAt || undefined,
      status: action === 'draft' ? 'draft' : action === 'schedule' ? 'scheduled' : 'sent',
      action
    };
  }

  function submitNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const action = (submitter?.value || 'send') as 'draft' | 'schedule' | 'send';
    let data: any;
    try {
      data = buildNoticePayload(form, action);
      if (!data) return;
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Revisá los datos del comunicado.' });
      return;
    }
    const editingId = editingNotice ? idOf(editingNotice) : '';
    run(editingId || 'notice', async () => {
      let payload: Record<string, unknown> | FormData;
      if (noticeFiles.length > 0) {
        const fd = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined) fd.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        });
        noticeFiles.forEach(f => fd.append('attachments', f));
        payload = fd;
      } else {
        payload = data;
      }
      if (editingId) await adminApi.notices.update(editingId, payload);
      else await adminApi.notices.create(payload);
      setNoticeFiles([]);
      form.reset();
      setShowNoticeModal(false);
      setEditingNotice(null);
    }, action === 'draft' ? 'Borrador guardado.' : action === 'schedule' ? 'Comunicado programado.' : 'Comunicado enviado.');
  }

  function submitTemplate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run(editingTemplate ? idOf(editingTemplate) : 'notice-template', async () => {
      if (editingTemplate) await adminApi.noticeTemplates.update(idOf(editingTemplate), data);
      else await adminApi.noticeTemplates.create(data);
      setShowTemplateModal(false);
      setEditingTemplate(null);
    }, 'Plantilla guardada.');
  }

  function applyTemplateToForm(templateId: string) {
    const template = noticeTemplates.find(t => idOf(t) === templateId);
    if (!template) return;
    const form = document.getElementById('notice-form') as HTMLFormElement | null;
    if (!form) return;
    (form.elements.namedItem('title') as HTMLInputElement).value = template.title || '';
    (form.elements.namedItem('subject') as HTMLInputElement).value = template.subject || template.title || '';
    (form.elements.namedItem('body') as HTMLTextAreaElement).value = template.body || '';
    (form.elements.namedItem('category') as HTMLSelectElement).value = template.category || 'general';
  }

  async function showNoticeStats(item: any) {
    const id = idOf(item);
    setNoticeStats((current) => ({ ...current, [id]: { loading: true } }));
    try {
      const res = await adminApi.notices.stats(id);
      setNoticeStats((current) => ({ ...current, [id]: res.data?.stats || {} }));
    } catch {
      setNoticeStats((current) => ({ ...current, [id]: { error: true } }));
    }
  }

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    run('expense', () => adminApi.expenses.create({ ...data, amount: Number(data.amount) }), 'Gasto registrado.');
    event.currentTarget.reset();
  }

  function submitProviderModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const isEdit = !!editingProvider;
    run(isEdit ? idOf(editingProvider) : 'provider', async () => {
      if (isEdit) await adminApi.providers.update(idOf(editingProvider), fd);
      else await adminApi.providers.create(fd);
      setShowProviderModal(false);
      setEditingProvider(null);
    }, isEdit ? 'Proveedor actualizado.' : 'Proveedor creado.');
  }

  async function downloadProviderDoc(providerId: string, index: number, filename: string) {
    try {
      const blob = await adminApi.providers.getDocumentBlob(providerId, index);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `documento-${index + 1}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setNotice({ type: 'error', text: 'No se pudo descargar el archivo.' });
    }
  }

  async function deleteProviderDoc(providerId: string, index: number) {
    setBusy(providerId + '-doc' + index);
    try {
      await adminApi.providers.deleteDocument(providerId, index);
      const updatedDocs = [...(editingProvider?.documents || [])];
      updatedDocs.splice(index, 1);
      setEditingProvider((p: any) => ({ ...p, documents: updatedDocs }));
      setNotice({ type: 'ok', text: 'Archivo eliminado.' });
      refresh(tab);
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'No se pudo eliminar el archivo.' });
    } finally {
      setBusy('');
    }
  }

  function submitEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formObject(event);
    const fd = new FormData();
    ['name','role','customRole','documentNumber','phone','email','startDate','notes','schedule','leaveNote'].forEach(k => {
      const v = data[k];
      if (v && String(v)) fd.append(k, String(v));
    });
    fd.append('isOnLeave', String(empIsOnLeave));
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

  function submitSalaryModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    const isEdit = !!editingSalary;
    const payload: any = {
      period: data.period,
      baseAmount: Number(data.baseAmount || 0),
      extraAmount: Number(data.extraAmount || 0),
      deductions: Number(data.deductions || 0),
      paymentMethod: data.paymentMethod || undefined,
      notes: data.notes || undefined
    };
    if (!isEdit) payload.employeeId = data.employeeId;
    run(isEdit ? idOf(editingSalary) : 'salary', async () => {
      if (isEdit) await adminApi.salaries.update(idOf(editingSalary), payload);
      else await adminApi.salaries.create(payload);
      setShowSalaryModal(false);
      setEditingSalary(null);
    }, isEdit ? 'Liquidacion actualizada.' : 'Liquidacion creada.');
  }

  function submitSalaryPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = formObject(event);
    const amount = Number(data.amount);
    const remaining = salaryRemainingAmount(salaryForPayment);
    if (!(amount > 0)) { setNotice({ type: 'error', text: 'El monto debe ser mayor a cero.' }); return; }
    if (amount > remaining + 0.001) { setNotice({ type: 'error', text: 'El monto supera el saldo pendiente.' }); return; }
    run('sal-payment', async () => {
      await adminApi.salaryPayments.create({
        salary: idOf(salaryForPayment),
        type: data.type,
        amount,
        paymentDate: data.paymentDate || undefined,
        paymentMethod: data.paymentMethod || undefined,
        note: data.note || undefined
      });
      setShowSalaryPaymentModal(false);
      setSalaryForPayment(null);
    }, 'Pago registrado.');
  }

  function editEmployee(employee: any) {
    setEditingEmployee(employee);
    setEmpModalRole(employee.role || 'maintenance');
    setEmpIsOnLeave(!!employee.isOnLeave);
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

  function openEditSalary(salary: any) {
    setEditingSalary(salary);
    setShowSalaryModal(true);
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
    }), 'Configuración actualizada.');
  }

  function submitPaymentPlanConfig() {
    run('paymentPlanConfig', () => adminApi.config.update({
      paymentPlansEnabled: ppEnabled,
      paymentPlansAllowOwnerRequests: ppEnabled ? ppAllowOwnerRequests : false,
    }), 'Configuración de planes de pago actualizada.');
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

  function adminRoleOptions() {
    return (adminRoles.length ? adminRoles : Object.entries(adminRoleLabels).map(([role, label]) => ({ role, label, permissions: [] })));
  }

  function permissionsForRole(role: string) {
    return (adminRoleOptions().find((item: any) => item.role === role)?.permissions || []) as string[];
  }

  function closeAdminInviteModal() {
    setShowAdminInviteModal(false);
    setAdminInviteMode('new_user');
    setAdminInviteRole('read_only');
    setAdminOwnerQuery('');
    setAdminOwnerResults([]);
    setSelectedAdminOwner(null);
  }

  function submitAdminInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = formObject(event);
    if (adminInviteMode === 'existing_owner' && !selectedAdminOwner) {
      setNotice({ type: 'error', text: 'Selecciona un propietario.' });
      return;
    }
    run('admin-invite', async () => {
      if (adminInviteMode === 'existing_owner') {
        await adminApi.adminUsers.invite({
          mode: 'existing_owner',
          ownerId: selectedAdminOwner.ownerId,
          role: String(data.role || adminInviteRole || 'read_only')
        });
      } else {
        await adminApi.adminUsers.invite({
          mode: 'new_user',
          name: String(data.name || '').trim(),
          email: String(data.email || '').trim(),
          role: String(data.role || adminInviteRole || 'read_only')
        });
      }
      form.reset();
      closeAdminInviteModal();
    }, 'Administrador invitado correctamente.');
  }

  function submitAdminRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAdminUser) return;
    const data = formObject(event);
    run(idOf(editingAdminUser), async () => {
      await adminApi.adminUsers.updateRole(idOf(editingAdminUser), String(data.role || 'read_only'));
      setEditingAdminUser(null);
    }, 'Rol actualizado correctamente.');
  }

  function disableAdminUser(admin: any) {
    if (!window.confirm(`¿Desactivar el acceso administrativo de ${admin.name || admin.email}?`)) return;
    run(idOf(admin), () => adminApi.adminUsers.disable(idOf(admin)), 'Acceso administrativo desactivado.');
  }

  async function submitOrgDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (form.elements.namedItem('file') as HTMLInputElement | null)?.files?.[0];
    if (!editingOrgDocument && !file) {
      setNotice({ type: 'error', text: 'Selecciona un archivo para guardar.' });
      return;
    }

    const formData = new FormData(form);
    const label = editingOrgDocument ? idOf(editingOrgDocument) : 'org-document';
    const success = await run(
      label,
      () => editingOrgDocument
        ? adminApi.documents.update(idOf(editingOrgDocument), formData)
        : adminApi.documents.create(formData),
      editingOrgDocument ? 'Documento actualizado.' : 'Documento guardado.'
    );
    if (success) {
      form.reset();
      setShowOrgDocumentModal(false);
      setEditingOrgDocument(null);
    }
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

  const adminName = me?.name || 'Administrador';
  const orgName = config?.consortiumName || '';
  const crumbs = tabCrumbs[tab] || [tab];

  return (
    <main className={`admin-shell${busy ? ' is-busy' : ''}`}>
      {(loading || refreshing) && <div className="page-loading-bar" />}
      <aside className="admin-sidebar">
        <a className="logo admin-logo" href="/">
          <span className="logo-mark" /> Gestion<span className="ar">ar</span>
        </a>

        {orgName && (
          <div className="admin-org-card">
            <div className="admin-org-logo">{orgLogoText(orgName)}</div>
            <div className="admin-org-meta">
              <div className="admin-org-name">{orgName}</div>
              <div className="admin-org-sub">{units?.length ?? 0} unidades</div>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          </div>
        )}

        <nav>
          <div className="admin-nav-group-label">Workspace</div>
          {visibleNav.filter(item => ['inicio', 'finanzas', 'morosidad', 'planes'].includes(item.key)).map(item => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => navigateToTab(item.key)}>
                <Icon size={16} /> <span>{item.label}</span>
                {item.key === 'finanzas' && (dashboard?.pending ?? 0) > 0 && <span className="admin-nav-badge">{dashboard.pending}</span>}
                {item.key === 'morosidad' && (delinquencySummary?.delinquentOwners ?? 0) > 0 && <span className="admin-nav-badge">{delinquencySummary.delinquentOwners}</span>}
              </button>
            );
          })}

          {visibleNav.some(item => ['propietarios', 'solicitudes', 'comunicados', 'reclamos'].includes(item.key)) && <div className="admin-nav-group-label">Comunidad</div>}
          {visibleNav.filter(item => ['propietarios', 'solicitudes', 'comunicados', 'reclamos'].includes(item.key)).map(item => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => navigateToTab(item.key)}>
                <Icon size={16} /> <span>{item.label}</span>
                {item.key === 'reclamos' && (claims?.filter((c: any) => c.status === 'open').length ?? 0) > 0 && (
                  <span className="admin-nav-badge">{claims.filter((c: any) => c.status === 'open').length}</span>
                )}
              </button>
            );
          })}

          {hasOperations && <div className="admin-nav-group-label">Operaciones</div>}
          {visibleNav.filter(item => ['votaciones', 'reservas', 'visitas'].includes(item.key)).map(item => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => navigateToTab(item.key)}>
                <Icon size={16} /> <span>{item.label}</span>
              </button>
            );
          })}

          {visibleNav.some(item => ['empleados', 'sueldos', 'proveedores', 'documentos', 'config'].includes(item.key)) && <div className="admin-nav-group-label">Administración</div>}
          {visibleNav.filter(item => ['empleados', 'sueldos', 'proveedores', 'documentos', 'config'].includes(item.key)).map(item => {
            const Icon = item.icon;
            return (
              <button key={item.key} className={tab === item.key ? 'active' : ''} onClick={() => navigateToTab(item.key)}>
                <Icon size={16} /> <span>{item.label}</span>
              </button>
            );
          })}
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
        {tab === 'agenda' && <AdminAgendaSection />}
        {tab === 'inicio' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Vista general</div>
                <h1 className="admin-page-title">Buen día, {me?.name?.split(' ')[0] || 'admin'}</h1>
                <div className="admin-page-sub">
                  {config?.consortiumName || 'Tu organización'} · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-primary" onClick={() => navigateToTab('finanzas')}><CreditCard size={14} />Revisar pagos</button>
              </div>
            </div>

            <div className="metric-grid">
              <Metric row loading={loading} label="Recaudacion anual" value={money(totalIncome)} hint={`${dashboard?.approved || 0} pagos aprobados`} icon={ShieldCheck}
                delta={(dashboard?.approved ?? 0) > 0 ? { text: `${dashboard.approved} aprobados`, trend: 'pos' } : undefined} />
              <Metric row loading={loading} label="Pagos pendientes" value={dashboard?.pending || 0} hint="MP acreditado queda en revision" icon={CreditCard}
                delta={(dashboard?.pending ?? 0) > 0 ? { text: `${dashboard.pending} por revisar`, trend: 'neg' } : undefined} />
              <Metric row loading={loading} label="Propietarios" value={ownerStats?.totalOwners || owners?.length || 0} hint={`${ownerStats?.upToDate || 0} al dia`} icon={Users}
                delta={(ownerStats?.upToDate ?? 0) > 0 ? { text: `${ownerStats.upToDate} al día`, trend: 'pos' } : undefined} />
              {moduleEnabled('claims') && <Metric row loading={loading} label="Reclamos abiertos" value={claims?.length || 0} hint="Comunidad" icon={MessageSquare}
                delta={(claims?.length ?? 0) > 0 ? { text: `${claims.length} pendientes`, trend: 'neg' } : undefined} />}
            </div>

            <ComplianceHero
              ownerStats={ownerStats}
              pendingCount={dashboard?.pending || 0}
              debtorCount={ownerStats?.debtors || 0}
              claimCount={claims?.filter((c: any) => c.status === 'open').length || 0}
              loading={loading}
              onPending={() => setTab('finanzas')}
              onDebtors={() => setTab('finanzas')}
              onClaims={() => setTab('reclamos')}
            />

            <AttentionHero
              payments={payments}
              claims={claims}
              loading={loading}
              onFinanzas={() => setTab('finanzas')}
              onComunidad={() => setTab('reclamos')}
            />

            <PendingReceiptsSection
              payments={payments.filter((p: any) => p.status === 'pending').slice(0, 5)}
              loading={loading}
              onApprove={readOnly ? () => setNotice({ type: 'error', text: 'No disponible en modo soporte.' }) : (id) => run(id, () => adminApi.payments.approve(id), 'Pago aprobado.')}
              onReject={readOnly ? () => setNotice({ type: 'error', text: 'No disponible en modo soporte.' }) : (id) => {
                const note = window.prompt('Motivo de rechazo') || 'Rechazado';
                run(id, () => adminApi.payments.reject(id, note), 'Pago rechazado.');
              }}
              onViewAll={() => setTab('finanzas')}
            />

            {moduleEnabled('claims') && (
              <OpenClaimsSection
                claims={claims.filter((c: any) => c.status === 'open')}
                loading={loading}
                onNavigate={() => setTab('reclamos')}
              />
            )}

            <PendingCollectionSection
              rows={owners.filter((o: any) => hasDebt(o)).slice(0, 10)}
              loading={loading}
              onViewAll={() => setTab('finanzas')}
            />
          </>
        )}

        {tab === 'finanzas' && (
          <AdminFinanceSection ctx={{
            config, year, setYear, month, setMonth, busy, downloadReport, exportDashboardCSV,
            dashboard, yearPayments, run, totalIncome, ownerStats, payments, finSubTab, dashPeriod, setDashPeriod,
            setFinSubTab, expenses, unidentifiedPaymentsSummary, fetchUnidentifiedPayments,
            loading, units, statusFilter, monthFilter, downloadPaymentReceipt, resendPaymentReceipt,
            loadRenditionPreview, generateRenditionPdf, exportRenditionCsv, renditionPreview,
            renditionHistory, categoryFilter, submitExpense, unidentifiedPaymentsLoading,
            unidentifiedPaymentsFilters, setUnidentifiedPaymentsFilters, unidentifiedPayments,
            openUnidentifiedDetail, openUnidentifiedAssociate, handleUnidentifiedReject,
            handleUnidentifiedArchive, showUnidentifiedDetailModal, selectedUnidentified,
            setShowUnidentifiedDetailModal, setSelectedUnidentified, showUnidentifiedAssociateModal,
            setShowUnidentifiedAssociateModal, owners, yearExpenses, AssociateUnidentifiedModal
          }} />
        )}

        {tab === 'empleados' && (
          <AdminEmployeesSalariesSection mode="empleados" ctx={{
            employees, config, refresh, tab, setEditingEmployee, setEmpModalRole, setEmpIsOnLeave,
            setEmployeeFiles, setShowEmployeeModal, loading, editEmployee, run, showEmployeeModal,
            editingEmployee, empModalRole, empIsOnLeave, submitEmployee,
            employeeFiles, downloadEmployeeDocument, deleteEmployeeDocument, busy
          }} />
        )}

        {tab === 'sueldos' && (
          <AdminEmployeesSalariesSection mode="sueldos" ctx={{
            salaries, config, refresh, tab, setEditingSalary, setShowSalaryModal, loading, month,
            setMonth, statusFilter, monthFilter, roleLabel, openEditSalary, setSalaryForPayment,
            setSalaryPaymentType, setShowSalaryPaymentModal, run, showSalaryModal, editingSalary,
            submitSalaryModal, employees, busy, showSalaryPaymentModal, salaryForPayment,
            salaryPaymentType, submitSalaryPayment
          }} />
        )}

        {tab === 'morosidad' && (
          <AdminDelinquencyPlansSection mode="morosidad" ctx={{
            config, downloadDelinquencyCsv, refresh, tab, loading, delinquencySummary, delinquencyAging,
            delinquencyFilters, setDelinquencyFilters, delinquencyPagination, delinquencyOwners,
            openDelinquencyDetail, hasPermission, openDebtReminder
          }} />
        )}

        {tab === 'planes' && (
          <AdminDelinquencyPlansSection mode="planes" ctx={{
            config, paymentPlanStatus, setPaymentPlanStatus, refresh, tab, paymentPlansLoading, loading,
            paymentPlans, approvePaymentPlan, rejectPaymentPlan, cancelPaymentPlan, registerPlanInstallment
          }} />
        )}

        {tab === 'solicitudes' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Comunidad</div>
                <h1 className="admin-page-title">Registro autónomo de propietarios</h1>
                <div className="admin-page-sub">Solicitudes de alta enviadas por propietarios desde el enlace público</div>
              </div>
              <div className="admin-page-actions">
                <label className="admin-field" style={{ minWidth: 180 }}>
                  <span>Estado</span>
                  <select value={accessRequestStatus} onChange={(e) => setAccessRequestStatus(e.target.value)}>
                    <option value="pending">Pendientes</option>
                    <option value="approved">Aprobadas</option>
                    <option value="rejected">Rechazadas</option>
                    <option value="all">Todas</option>
                  </select>
                </label>
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
              </div>
            </div>
            <div className="admin-panel">
              <div className="panel-head"><h2><Settings size={14} />Registro autónomo</h2></div>
              <div className="access-link-box">
                <div>
                  <span className={`pill ${accessSettings?.publicJoinEnabled ? 'pos' : 'muted'}`}><span className="d" />{accessSettings?.publicJoinEnabled ? 'Habilitado' : 'Deshabilitado'}</span>
                  <p>Compartí este enlace para que los propietarios pidan acceso sin cargarlos manualmente.</p>
                </div>
                {publicJoinUrl ? (
                  <div className="access-link-row">
                    <input value={publicJoinUrl} readOnly onFocus={(event) => event.currentTarget.select()} />
                    <button className="btn btn-ghost" onClick={copyAccessJoinLink}>Copiar</button>
                    <a className="btn btn-ghost" href={publicJoinUrl} target="_blank" rel="noreferrer">Abrir</a>
                  </div>
                ) : (
                  <p className="admin-form-note">Generá un código para crear el enlace de registro.</p>
                )}
                {publicJoinUrl && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(publicJoinUrl)}&format=svg&ecc=M`}
                      alt="QR de registro"
                      width={100} height={100}
                      style={{ borderRadius: 8, background: '#fff', padding: 4 }}
                    />
                    <div>
                      <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--muted)' }}>Código QR</p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>Escaneá para solicitar acceso o compartí el QR por WhatsApp.</p>
                    </div>
                  </div>
                )}
                <div className="admin-page-actions" style={{ justifyContent: 'flex-start', marginTop: '0.75rem' }}>
                  {accessSettings?.publicJoinCode && <span className="chip is-active">Código: {accessSettings.publicJoinCode}</span>}
                  <button className="btn btn-ghost" onClick={() => toggleAccessRequestSettings(!accessSettings?.publicJoinEnabled)}>
                    {accessSettings?.publicJoinEnabled ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                  <button className="btn btn-ghost" onClick={regenerateAccessCode}>Regenerar código</button>
                </div>
                {accessSettings?.publicJoinCode && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--muted)' }}>⚠️ Regenerar el código invalida el enlace anterior.</p>
                )}
              </div>
            </div>
            <div className="admin-panel">
              <div className="panel-head"><h2><Inbox size={14} />Solicitudes</h2><span>{accessRequests.length} registros</span></div>
              <Table loading={accessRequestsLoading || loading} searchPlaceholder="Buscar nombre, email o unidad" rows={accessRequests} columns={[
                ['Solicitante', (r: any) => (
                  <div>
                    <strong>{r.name || r.userName || '-'}</strong>
                    {r.isExistingUser && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, background: 'rgba(251,191,36,0.15)', color: 'var(--warn)' }}>Usuario existente</span>}
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>{r.email || '-'}</div>
                  </div>
                )],
                ['Teléfono', (r: any) => r.phone || '-'],
                ['Unidad declarada', (r: any) => r.requestedUnitLabel || r.unitName || r.unit || '-'],
                ['Estado', (r: any) => <Status value={r.status} />],
                ['Fecha', (r: any) => dateLabel(r.createdAt)],
                ['Acciones', (r: any) => <Actions>
                  {r.status === 'pending' && <button onClick={() => approveAccessRequest(r)}>Aprobar</button>}
                  {r.status === 'pending' && <button onClick={() => rejectAccessRequest(r)}>Rechazar</button>}
                </Actions>]
              ]} />
            </div>

            {arApproveModal && (() => {
              const r = arApproveModal.request;
              const avail = arApproveModal.availableUnits;
              const query = (r.requestedUnitLabel || '').toLowerCase().trim();
              const suggested = query ? avail.filter((u: any) => u.name?.toLowerCase().includes(query) || query.includes((u.name || '').toLowerCase())) : [];
              return (
                <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setArApproveModal(null); }}>
                  <div className="form-modal">
                    <div className="form-modal-head">
                      <div className="form-modal-title"><UserCheck size={16} />Aprobar solicitud</div>
                      <button className="icon-btn" onClick={() => setArApproveModal(null)}><X size={16} /></button>
                    </div>
                    {r.isExistingUser && (
                      <div style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid var(--warn)', borderRadius: 8, padding: '0.6rem 0.875rem', marginBottom: '1rem', fontSize: '0.83rem', color: 'var(--warn)' }}>
                        ⚠️ Este email ya tiene cuenta en GestionAr. Se vinculará sin modificar su contraseña.
                      </div>
                    )}
                    <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-bright)', marginBottom: 2 }}>{r.name}</div>
                      <div style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>{r.email}</div>
                      {r.phone && <div style={{ fontSize: '0.81rem', color: 'var(--muted)' }}>📞 {r.phone}</div>}
                      {r.requestedUnitLabel && <div style={{ fontSize: '0.83rem', color: 'var(--muted)', marginTop: 2 }}>Solicita: <strong>{r.requestedUnitLabel}</strong></div>}
                      {r.message && <div style={{ fontSize: '0.81rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: 4 }}>"{r.message}"</div>}
                    </div>
                    <label className="admin-field full" style={{ marginBottom: '0.5rem' }}>
                      <span>Unidades a asignar <span style={{ fontWeight: 400, color: 'var(--muted)' }}>({avail.length} disponibles, opcional)</span></span>
                      <select multiple style={{ minHeight: 100 }}
                        value={arApproveUnitIds}
                        onChange={(e) => setArApproveUnitIds([...e.target.selectedOptions].map(o => o.value))}>
                        {suggested.length > 0 && <optgroup label={`Sugeridas por "${r.requestedUnitLabel}"`}>
                          {suggested.map((u: any) => <option key={idOf(u)} value={idOf(u)}>{u.name}</option>)}
                        </optgroup>}
                        {avail.filter((u: any) => !suggested.find((s: any) => idOf(s) === idOf(u))).length > 0 && (
                          <optgroup label="Otras disponibles">
                            {avail.filter((u: any) => !suggested.find((s: any) => idOf(s) === idOf(u))).map((u: any) => <option key={idOf(u)} value={idOf(u)}>{u.name}</option>)}
                          </optgroup>
                        )}
                      </select>
                      <small style={{ color: 'var(--muted)' }}>Ctrl/Cmd para seleccionar varias.</small>
                      {suggested.length > 0 && <small style={{ color: 'var(--accent)' }}>✓ {suggested.length} unidad{suggested.length !== 1 ? 'es' : ''} preseleccionada{suggested.length !== 1 ? 's' : ''} por coincidencia con el nombre declarado.</small>}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer', marginBottom: '1rem' }}>
                      <input type="checkbox" checked={arApproveCharge} onChange={(e) => setArApproveCharge(e.target.checked)} style={{ accentColor: 'var(--accent)' }} />
                      Cobrar mes en curso
                    </label>
                    <div className="form-modal-foot">
                      <button className="btn btn-ghost" onClick={() => setArApproveModal(null)}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy.startsWith('access-approve')} onClick={doApproveRequest}>
                        {busy.startsWith('access-approve') ? 'Aprobando…' : 'Aprobar'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {arRejectModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setArRejectModal(null); }}>
                <div className="form-modal">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><X size={16} />Rechazar solicitud</div>
                    <button className="icon-btn" onClick={() => setArRejectModal(null)}><X size={16} /></button>
                  </div>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{arRejectModal.request.name}</div>
                    <div style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>{arRejectModal.request.email}</div>
                    {arRejectModal.request.requestedUnitLabel && (
                      <div style={{ fontSize: '0.83rem', color: 'var(--muted)', marginTop: 2 }}>Solicita: <strong>{arRejectModal.request.requestedUnitLabel}</strong></div>
                    )}
                  </div>
                  <label className="admin-field full" style={{ marginBottom: '1rem' }}>
                    <span>Motivo del rechazo <span style={{ fontWeight: 400, color: 'var(--muted)' }}>(recomendado)</span></span>
                    <textarea rows={3} value={arRejectReason} onChange={(e) => setArRejectReason(e.target.value)}
                      placeholder="Ej: La unidad indicada no existe o ya tiene propietario asignado." />
                  </label>
                  <div className="form-modal-foot">
                    <button className="btn btn-ghost" onClick={() => setArRejectModal(null)}>Cancelar</button>
                    <button className="btn btn-primary" disabled={busy.startsWith('access-reject')} onClick={doRejectRequest}>
                      {busy.startsWith('access-reject') ? 'Rechazando…' : 'Rechazar'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'propietarios' && (
          <AdminOwnersUnitsSection ctx={{
            owners, units, config, refresh, tab, setShowUnitModal, setShowOwnerModal, loading, ownerStats,
            openDelinquencyDetail, notifyOwner, openWhatsApp, run, showOwnerModal, setOwnerEmailError,
            setOwnerEmailHint, setOwnerEmailResult, setOwnerLastCheckedEmail, ownerEmailResult, submitOwner,
            ownerEmailChecking, ownerEmailError, ownerEmailHint, checkOwnerEmail, ownerUnitFilter,
            setOwnerUnitFilter, selectedOwnerUnits, toggleOwnerUnit, filteredOwnerUnits, ownerSelectedUnitIds,
            availableOwnerUnits, busy, showUnitModal, submitUnitBulk
          }} />
        )}

        {tab === 'comunicados' && (
          <AdminNoticesSection ctx={{
            moduleEnabled, normalizedNotices, filteredNotices, noticeTemplates, config, openNoticeComposer,
            refresh, tab, noticeCounts, loading, showNoticeModal, editingNotice,
            setShowNoticeModal, setEditingNotice, setNoticeFiles, submitNotice, applyTemplateToForm,
            noticeTargetType, setNoticeTargetType, units, owners, noticeFiles, busy, noticeFilters, setNoticeFilters, noticeStats,
            showTemplateModal, setShowTemplateModal, editingTemplate, setEditingTemplate,
            submitTemplate, run, showNoticeStats, downloadNoticeAttachment
          }} />
        )}

        {tab === 'reclamos' && (
          <AdminClaimsSection ctx={{ claims, config, loading, run, refresh, tab, claimsEnabled: moduleEnabled('claims') }} />
        )}

        {tab === 'votaciones' && (
          <AdminVotesSection ctx={{
            votes, config, refresh, tab, setShowVoteModal, loading, showVoteModal,
            setVoteOptions, voteOptions, submitVote, busy, run
          }} />
        )}

        {tab === 'reservas' && (
          <AdminReservationsSection ctx={{ reservations, spaces, loading, config, tab, run, refresh }} />
        )}

        {tab === 'visitas' && (
          <AdminVisitsSection ctx={{ visits, loading, config, tab, run, refresh, can: hasPermission }} />
        )}

        {tab === 'proveedores' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Administración</div>
                <h1 className="admin-page-title">Proveedores</h1>
                <div className="admin-page-sub">
                  {(providers || []).filter((p: any) => p.active !== false).length} activos
                  {(providers?.length || 0) > 0 ? ` · ${providers.length} en total` : ''}
                  {config?.consortiumName ? ` · ${config.consortiumName}` : ''}
                </div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-primary" onClick={() => { setEditingProvider(null); setShowProviderModal(true); }}><Plus size={14} />Nuevo proveedor</button>
              </div>
            </div>

            {(() => {
              const cats = expensesByCategory(yearExpenses || []);
              const catTotal = cats.reduce((s: number, c: any) => s + c.amount, 0);
              if (!cats.length) return null;
              return (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-h">
                    <div>
                      <h3>Gasto por categoría · YTD {new Date().getFullYear()}</h3>
                      <div className="card-sub">${fmtK(catTotal)} total acumulado</div>
                    </div>
                  </div>
                  <div className="card-body">
                    {cats.map((cat: any, i: number) => (
                      <div key={cat.cat} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < cats.length - 1 ? '1px solid var(--line-1)' : 'none' }}>
                        <div style={{ width: 110, fontSize: 12, color: 'var(--ink-0)', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, flexShrink: 0, display: 'inline-block' }} />
                          {cat.label}
                        </div>
                        <div style={{ flex: 1, height: 8, background: 'var(--bg-2)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(cat.pct, 2)}%`, height: '100%', background: cat.color, borderRadius: 4 }} />
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', width: 100, textAlign: 'right', fontSize: 12, color: 'var(--ink-0)' }}>${fmtK(cat.amount)}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', width: 30, textAlign: 'right', fontSize: 11, color: 'var(--ink-2)' }}>{cat.pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="card" style={{ marginBottom: 0 }}>
              <Table loading={loading} searchPlaceholder="Buscar proveedor, servicio o contacto" filters={[
                {
                  key: 'active',
                  label: 'Estado',
                  allLabel: 'Todos',
                  options: [
                    { value: 'active', label: 'Activos' },
                    { value: 'inactive', label: 'Inactivos' }
                  ],
                  match: (row: any, value: string) => value === 'active' ? row.active !== false : row.active === false
                },
                {
                  key: 'serviceType',
                  label: 'Servicio',
                  allLabel: 'Todos',
                  options: Object.entries(EXPENSE_LABELS_MAP).map(([value, label]) => ({ value, label })),
                  match: (row: any, value: string) => row.serviceType === value
                }
              ]} rows={providers} columns={[
                ['Proveedor', (p: any) => (
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 12.5, color: 'var(--ink-0)' }}>{p.name}</div>
                    {p.cuit && <div style={{ fontSize: 11, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>CUIT {p.cuit}</div>}
                  </div>
                )],
                ['Servicio', (p: any) => <span className="pill muted">{EXPENSE_LABELS_MAP[p.serviceType] || p.serviceType || '—'}</span>],
                ['Contacto', (p: any) => p.phone || p.email || <span style={{ color: 'var(--ink-3)' }}>—</span>],
                ['Estado', (p: any) => (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.active === false
                      ? <span className="pill neg"><span className="d" />Inactivo</span>
                      : p.status === 'suspended'
                        ? <span className="pill neg"><span className="d" />Suspendido</span>
                        : p.status === 'incomplete'
                          ? <span className="pill warn"><span className="d" />Incompleto</span>
                          : <span className="pill pos"><span className="d" />Activo</span>}
                    {p.documentStatus === 'expired' && <span className="pill neg" style={{ fontSize: 10 }}>Doc. vencida</span>}
                    {p.documentStatus === 'expiring_soon' && <span className="pill warn" style={{ fontSize: 10 }}>Por vencer</span>}
                    {p.documentStatus === 'no_docs' && <span className="pill muted" style={{ fontSize: 10 }}>Sin docs</span>}
                  </div>
                )],
                ['Archivos', (p: any) => {
                  const docs: any[] = p.documents || [];
                  if (!docs.length) return <span style={{ color: 'var(--ink-3)' }}>—</span>;
                  return (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {docs.map((doc: any, i: number) => (
                        <button key={i} type="button" className="btn btn-ghost"
                          style={{ fontSize: 11, padding: '2px 6px', gap: 4 }}
                          onClick={() => downloadProviderDoc(idOf(p), i, doc.filename)}>
                          <Paperclip size={13} />{doc.filename || `Doc ${i + 1}`}
                        </button>
                      ))}
                    </div>
                  );
                }],
                ['Acciones', (p: any) => (
                  <Actions>
                    <button onClick={() => { setEditingProvider(p); setShowProviderModal(true); }}>Editar</button>
                    <button className="danger-action" onClick={() => run(idOf(p), () => adminApi.providers.delete(idOf(p)), 'Proveedor eliminado.')}>Eliminar</button>
                  </Actions>
                )]
              ]} />
            </div>

            {showProviderModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true"
                onClick={(e) => { if (e.target === e.currentTarget) { setShowProviderModal(false); setEditingProvider(null); } }}>
                <div className="form-modal">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><Landmark size={16} />{editingProvider ? 'Editar proveedor' : 'Nuevo proveedor'}</div>
                    <button className="icon-btn" onClick={() => { setShowProviderModal(false); setEditingProvider(null); }}><X size={16} /></button>
                  </div>
                  <form key={editingProvider ? idOf(editingProvider) : 'new'} className="admin-form" onSubmit={submitProviderModal}>
                    <Field label="Nombre" name="name" required defaultValue={editingProvider?.name} />
                    <label className="admin-field">
                      <span>Servicio</span>
                      <select name="serviceType" defaultValue={editingProvider?.serviceType || 'other'}>
                        {Object.entries(EXPENSE_LABELS_MAP).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <Field label="CUIT" name="cuit" defaultValue={editingProvider?.cuit} />
                    <Field label="Telefono" name="phone" defaultValue={editingProvider?.phone} />
                    <Field label="Email" name="email" type="email" defaultValue={editingProvider?.email} />
                    {editingProvider?.documents?.length > 0 && (
                      <label className="admin-field">
                        <span>Archivos actuales</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {editingProvider.documents.map((doc: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <button type="button" className="btn btn-ghost"
                                style={{ fontSize: 11, padding: '2px 8px', gap: 4, flex: 1, textAlign: 'left', justifyContent: 'flex-start' }}
                                onClick={() => downloadProviderDoc(idOf(editingProvider), i, doc.filename)}>
                                <Paperclip size={11} />{doc.filename || `Documento ${i + 1}`}
                              </button>
                              <button type="button" className="icon-btn"
                                disabled={busy === idOf(editingProvider) + '-doc' + i}
                                onClick={() => deleteProviderDoc(idOf(editingProvider), i)}>
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </label>
                    )}
                    <label className="admin-field">
                      <span>Adjuntar archivos</span>
                      <input type="file" name="documents" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" />
                    </label>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowProviderModal(false); setEditingProvider(null); }}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'provider' || (!!editingProvider && busy === idOf(editingProvider))}>
                        {editingProvider ? 'Guardar cambios' : 'Crear proveedor'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'documentos' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Administración</div>
                <h1 className="admin-page-title">Documentos</h1>
                <div className="admin-page-sub">
                  {orgDocuments?.length || 0} documento{(orgDocuments?.length || 0) !== 1 ? 's' : ''} · {config?.consortiumName || 'Tu organización'}
                </div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-primary" onClick={() => { setEditingOrgDocument(null); setShowOrgDocumentModal(true); }}><Plus size={14} />Nuevo documento</button>
              </div>
            </div>

            <div className="card">
              <Table loading={loading} searchPlaceholder="Buscar documento, categoria o visibilidad" filters={[
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
              ]} rows={orgDocuments} columns={[
                ['Documento', (doc: any) => (
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 12.5, color: 'var(--ink-0)' }}>{doc.title}</div>
                    {doc.description && <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{doc.description}</div>}
                  </div>
                )],
                ['Categoria', (doc: any) => <span className="pill muted">{doc.categoryLabel || documentCategoryLabels[doc.category] || doc.category}</span>],
                ['Visibilidad', (doc: any) => (
                  <span className={`pill ${doc.visibility === 'owners' ? 'pos' : 'warn'}`}>
                    <span className="d" />{doc.visibilityLabel || documentVisibilityLabels[doc.visibility] || doc.visibility}
                  </span>
                )],
                ['Archivo', (doc: any) => {
                  const meta = [doc.fileTypeLabel, doc.formattedSize].filter(Boolean).join(' · ');
                  return (
                    <div>
                      <div style={{ fontSize: 12 }}>{doc.file?.filename || '-'}</div>
                      {meta && <div style={{ fontSize: 11, color: 'var(--ink-2)' }}>{meta}</div>}
                    </div>
                  );
                }],
                ['Fecha', (doc: any) => dateLabel(doc.createdAt)],
                ['Acciones', (doc: any) => <Actions>
                  <button onClick={() => downloadOrgDocument(doc)}>Descargar</button>
                  <button onClick={() => { setEditingOrgDocument(doc); setShowOrgDocumentModal(true); }}>Editar</button>
                  <button className="danger-action" onClick={() => run(idOf(doc), () => adminApi.documents.delete(idOf(doc)), 'Documento eliminado.')}>Eliminar</button>
                </Actions>]
              ]} />
            </div>

            {showOrgDocumentModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true"
                onClick={(e) => { if (e.target === e.currentTarget) { setShowOrgDocumentModal(false); setEditingOrgDocument(null); } }}>
                <div className="form-modal">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><FileText size={16} />{editingOrgDocument ? 'Editar documento' : 'Nuevo documento'}</div>
                    <button className="icon-btn" onClick={() => { setShowOrgDocumentModal(false); setEditingOrgDocument(null); }}><X size={16} /></button>
                  </div>
                  <form key={editingOrgDocument ? idOf(editingOrgDocument) : 'new'} className="admin-form" onSubmit={submitOrgDocument}>
                    <Field label="Titulo" name="title" required defaultValue={editingOrgDocument?.title} />
                    <SelectField label="Categoria" name="category" defaultValue={editingOrgDocument?.category || 'other'}>
                      {Object.entries(documentCategoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </SelectField>
                    <SelectField label="Visibilidad" name="visibility" defaultValue={editingOrgDocument?.visibility || 'owners'}>
                      {Object.entries(documentVisibilityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </SelectField>
                    <label className="admin-field">
                      <span>{editingOrgDocument ? 'Reemplazar archivo' : 'Archivo'}</span>
                      <input name="file" type="file" accept=".pdf,application/pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" required={!editingOrgDocument} />
                      {editingOrgDocument?.file?.filename && (
                        <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Actual: {editingOrgDocument.file.filename}</small>
                      )}
                    </label>
                    <label className="admin-field full">
                      <span>Descripcion</span>
                      <textarea name="description" rows={3} defaultValue={editingOrgDocument?.description || ''} maxLength={500} />
                    </label>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowOrgDocumentModal(false); setEditingOrgDocument(null); }}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'org-document' || (!!editingOrgDocument && busy === idOf(editingOrgDocument))}>
                        {editingOrgDocument ? 'Guardar cambios' : 'Guardar documento'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'config' && (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Administración</div>
                <h1 className="admin-page-title">Configuración</h1>
                <div className="admin-page-sub">{config?.consortiumName || 'Tu organización'} · Ajustes generales del consorcio</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
              </div>
            </div>
            <div className="admin-grid two">
            <Panel title="Configuración general" icon={Settings}>
              <form className="admin-form" onSubmit={submitConfig}>
                <Field label="Nombre" name="consortiumName" defaultValue={config?.consortiumName} />
                <Field label="Direccion" name="consortiumAddress" defaultValue={config?.consortiumAddress} />
                <Field label="Email admin" name="adminEmail" type="email" defaultValue={config?.adminEmail} />
                <Field label="Telefono admin" name="adminPhone" defaultValue={config?.adminPhone} />
                <Field label="Cuota mensual" name="monthlyFee" type="number" defaultValue={config?.monthlyFee || config?.expenseAmount || 0} />
                <Field label="Periodo actual" name="expenseMonthCode" type="month" defaultValue={config?.expenseMonthCode || month} />
                <Field label="Dia vencimiento" name="dueDayOfMonth" type="number" defaultValue={config?.dueDayOfMonth || 10} />
                <SelectField label="Tipo recargo" name="lateFeeType" defaultValue={config?.lateFeeType || 'percent'}>
                  <option value="percent">Porcentaje</option><option value="fixed">Fijo</option>
                </SelectField>
                <Field label="% recargo" name="lateFeePercent" type="number" defaultValue={config?.lateFeePercent || 0} />
                <Field label="Recargo fijo" name="lateFeeFixed" type="number" defaultValue={config?.lateFeeFixed || 0} />
                <Field label="Banco" name="bankName" defaultValue={config?.bankName} />
                <Field label="CBU" name="bankCbu" defaultValue={config?.bankCbu} />
                {hasPermission('settings.update') && <button className="btn btn-primary" disabled={busy === 'config'}>Guardar configuracion</button>}
              </form>
            </Panel>
            <Panel title="Planes de pago" icon={CreditCard}>
              <div className="admin-form" style={{ gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={ppEnabled}
                    onChange={e => { setPpEnabled(e.target.checked); if (!e.target.checked) setPpAllowOwnerRequests(false); }}
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Módulo de planes de pago</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Si está desactivado, los propietarios no verán el módulo de planes de pago.</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: ppEnabled ? 'pointer' : 'not-allowed', opacity: ppEnabled ? 1 : 0.45 }}>
                  <input
                    type="checkbox"
                    checked={ppAllowOwnerRequests}
                    disabled={!ppEnabled}
                    onChange={e => setPpAllowOwnerRequests(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Permitir que propietarios soliciten planes</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Si está desactivado, solo el administrador podrá crear planes. Los propietarios podrán ver sus planes existentes pero no solicitar nuevos.</div>
                  </div>
                </label>
                {hasPermission('settings.update') && (
                  <button className="btn btn-primary" disabled={busy === 'paymentPlanConfig'} onClick={submitPaymentPlanConfig} type="button">
                    Guardar planes de pago
                  </button>
                )}
              </div>
            </Panel>
            <Panel title="MercadoPago" icon={CreditCard}>
              <form className="admin-form" onSubmit={submitMercadoPago}>
                <label className="admin-field full">
                  <span>Estado</span>
                  <input value={config?.hasMercadoPago ? 'Configurado' : 'No configurado'} disabled readOnly />
                </label>
                <Field label="Public Key" name="mpPublicKey" defaultValue={config?.mpPublicKey || ''} placeholder="APP_USR-..." />
                <Field label="Access Token" name="mpAccessToken" type="password" placeholder="Completar solo para actualizar" />
                <Field label="Webhook Secret" name="mpWebhookSecret" type="password" placeholder="Opcional" />
                <p className="admin-form-note">Por seguridad, el Access Token no se muestra. Si lo dejas vacio, se conserva el valor actual.</p>
                {hasPermission('settings.update') && <button className="btn btn-primary" disabled={busy === 'mercadopago'}>Guardar MercadoPago</button>}
              </form>
            </Panel>
            {hasPermission('admins.read') && (
              <Panel
                title="Usuarios administradores"
                sub="Accesos internos de esta organización"
                icon={ShieldCheck}
                action={hasPermission('admins.create') ? (
                  <button className="btn btn-primary" onClick={() => { setAdminInviteRole('read_only'); setShowAdminInviteModal(true); }}><Plus size={14} />Invitar</button>
                ) : undefined}
              >
                <Table
                  rows={adminUsers}
                  searchPlaceholder="Buscar administrador"
                  columns={[
                    ['Nombre', (row: any) => <strong>{row.name || '-'}</strong>],
                    ['Email', (row: any) => row.email || '-'],
                    ['Rol', (row: any) => row.roleLabel || adminRoleLabels[row.role] || row.role || '-'],
                    ['Estado', (row: any) => <span className={`status ${row.isActive ? 'approved' : 'rejected'}`}>{row.isActive ? 'Activo' : 'Desactivado'}</span>],
                    ['Acciones', (row: any) => (
                      <Actions>
                        {hasPermission('admins.update') && row.isActive && (
                          <button onClick={() => setEditingAdminUser(row)}>Cambiar rol</button>
                        )}
                        {hasPermission('admins.disable') && row.isActive && (
                          <button className="danger-action" onClick={() => disableAdminUser(row)}>Desactivar</button>
                        )}
                      </Actions>
                    )]
                  ]}
                />
                <div className="admin-role-grid">
                  {adminRoleOptions().map((role: any) => {
                    const rolePermissions = permissionsForRole(role.role);
                    const groups = permissionGroups(rolePermissions);
                    return (
                      <div className="admin-role-card" key={role.role}>
                        <strong>{role.label || adminRoleLabels[role.role] || role.role}</strong>
                        <span>{adminRoleDescriptions[role.role] || 'Permisos administrativos configurados para la organización.'}</span>
                        <small>{rolePermissions.length} permisos incluidos</small>
                        <div className="permission-group-list">
                          {groups.length ? groups.map((group) => (
                            <p key={group.module}><b>{group.module}:</b> {group.labels.join(', ')}</p>
                          )) : <p><b>Otros:</b> Permiso adicional</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Panel>
            )}
            </div>
            {showAdminInviteModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) closeAdminInviteModal(); }}>
                <div className="form-modal">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><ShieldCheck size={16} />Invitar administrador</div>
                    <button className="icon-btn" onClick={closeAdminInviteModal}><X size={16} /></button>
                  </div>
                  <form className="admin-form" onSubmit={submitAdminInvite}>
                    <div className="admin-invite-mode">
                      <button
                        type="button"
                        className={adminInviteMode === 'new_user' ? 'active' : ''}
                        onClick={() => { setAdminInviteMode('new_user'); setSelectedAdminOwner(null); }}
                      >
                        Nuevo usuario
                      </button>
                      <button
                        type="button"
                        className={adminInviteMode === 'existing_owner' ? 'active' : ''}
                        onClick={() => setAdminInviteMode('existing_owner')}
                      >
                        Propietario existente
                      </button>
                    </div>
                    {adminInviteMode === 'new_user' ? (
                      <>
                        <Field label="Nombre" name="name" required />
                        <Field label="Email" name="email" type="email" required />
                      </>
                    ) : (
                      <>
                        <label className="admin-field full">
                          <span>Buscar propietario</span>
                          <input
                            type="search"
                            value={adminOwnerQuery}
                            onChange={(event) => { setAdminOwnerQuery(event.target.value); setSelectedAdminOwner(null); }}
                            placeholder="Nombre, email o unidad"
                          />
                        </label>
                        <div className="owner-admin-results">
                          {adminOwnerResults.map((owner: any) => (
                            <button
                              type="button"
                              key={owner.membershipId || owner.ownerId}
                              className={`owner-admin-option ${selectedAdminOwner?.ownerId === owner.ownerId ? 'selected' : ''}`}
                              onClick={() => !owner.isAdminActive && setSelectedAdminOwner(owner)}
                              disabled={owner.isAdminActive}
                            >
                              <strong>{owner.name || 'Sin nombre'}</strong>
                              <span>{owner.email || '-'}</span>
                              <small>{owner.unitNames?.length ? owner.unitNames.join(', ') : 'Sin unidad asignada'}{owner.isAdminActive ? ' · Ya es administrador' : ''}</small>
                            </button>
                          ))}
                          {!adminOwnerResults.length && (
                            <p className="admin-form-note">Busca por nombre, email, unidad, lote o departamento.</p>
                          )}
                        </div>
                        {selectedAdminOwner && (
                          <>
                            <label className="admin-field">
                              <span>Nombre</span>
                              <input value={selectedAdminOwner.name || ''} disabled readOnly />
                            </label>
                            <label className="admin-field">
                              <span>Email</span>
                              <input value={selectedAdminOwner.email || ''} disabled readOnly />
                            </label>
                          </>
                        )}
                      </>
                    )}
                    <label className="admin-field full">
                      <span>Rol</span>
                      <select name="role" value={adminInviteRole} onChange={(event) => setAdminInviteRole(event.target.value)}>
                      {adminRoleOptions().map((role: any) => (
                        <option key={role.role} value={role.role}>{role.label || adminRoleLabels[role.role] || role.role}</option>
                      ))}
                      </select>
                    </label>
                    <p className="admin-form-note">{adminRoleDescriptions[adminInviteRole] || 'Permisos administrativos configurados para la organización.'}</p>
                    <p className="admin-form-note">
                      {adminInviteMode === 'existing_owner'
                        ? 'Se reutiliza el usuario del propietario y se agrega un acceso administrativo separado.'
                        : 'Si el email ya existe, se agrega a esta organización sin modificar su contraseña.'}
                    </p>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={closeAdminInviteModal}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'admin-invite'}>
                        {adminInviteMode === 'existing_owner' ? 'Asociar administrador' : 'Enviar invitación'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {editingAdminUser && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setEditingAdminUser(null); }}>
                <div className="form-modal">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><ShieldCheck size={16} />Cambiar rol</div>
                    <button className="icon-btn" onClick={() => setEditingAdminUser(null)}><X size={16} /></button>
                  </div>
                  <form className="admin-form" onSubmit={submitAdminRole}>
                    <label className="admin-field full">
                      <span>Administrador</span>
                      <input value={`${editingAdminUser.name || '-'} · ${editingAdminUser.email || '-'}`} disabled readOnly />
                    </label>
                    <SelectField label="Rol" name="role" defaultValue={editingAdminUser.role || 'read_only'}>
                      {adminRoleOptions().map((role: any) => (
                        <option key={role.role} value={role.role}>{role.label || adminRoleLabels[role.role] || role.role}</option>
                      ))}
                    </SelectField>
                    <p className="admin-form-note">{adminRoleDescriptions[editingAdminUser.role] || 'Permisos administrativos configurados para la organización.'}</p>
                    <p className="admin-form-note">La organización debe conservar al menos un administrador principal activo.</p>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => setEditingAdminUser(null)}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === idOf(editingAdminUser)}>Guardar rol</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'soporte' && (
          <AdminSupportSection ctx={{ supportTickets, supportTicketsLoading, refresh, setNotice }} />
        )}

        {delinquencyDetail && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setDelinquencyDetail(null); }}>
            <div className="form-modal form-modal--wide">
              <div className="form-modal-head">
                <div className="form-modal-title"><AlertTriangle size={16} />Detalle de deuda</div>
                <button className="icon-btn" onClick={() => setDelinquencyDetail(null)}><X size={16} /></button>
              </div>
              <div className="admin-page-sub">{delinquencyDetail.owner?.name} · {(delinquencyDetail.units || []).map((u: any) => u.name).join(', ') || 'Sin unidad'}</div>
              <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', margin: '1rem 0' }}>
                <Metric row loading={false} label="Deuda total" value={money(delinquencyDetail.summary?.totalOwed)} hint="ARS" icon={AlertTriangle} />
                <Metric row loading={false} label="Períodos" value={delinquencyDetail.summary?.periodsCount || 0} hint={(delinquencyDetail.summary?.unpaidPeriods || []).join(', ') || '-'} icon={CalendarDays} />
                <Metric row loading={false} label="Atraso" value={`${delinquencyDetail.summary?.daysOverdue || 0} días`} hint={delinquencyDetail.summary?.oldestPeriod || '-'} icon={Bell} />
              </div>
              <Table loading={false} searchPlaceholder="Buscar concepto" rows={[...(delinquencyDetail.periodDetails || []), ...(delinquencyDetail.balanceItems || []), ...(delinquencyDetail.extraordinaryItems || []), ...(delinquencyDetail.debtItems || [])]} columns={[
                ['Concepto', (r: any) => r.concept || '-'],
                ['Período', (r: any) => r.period || '-'],
                ['Vencimiento', (r: any) => r.dueDate ? dateLabel(r.dueDate) : 'sin vencimiento definido'],
                ['Saldo', (r: any) => money(r.balance)],
                ['Estado', (r: any) => `${r.status || '-'}${r.daysOverdue ? ` · ${r.daysOverdue} días` : ''}`]
              ]} />
              <div className="form-modal-foot">
                <button className="btn btn-ghost" onClick={() => downloadDelinquencyCsv(idOf(delinquencyDetail.owner))}>Descargar CSV</button>
                {hasPermission('payments.remind') && Number(delinquencyDetail.summary?.totalOwed || 0) > 0 && <button className="btn btn-primary" onClick={() => openDebtReminder(delinquencyDetail.owner)}>Enviar recordatorio</button>}
              </div>
            </div>
          </div>
        )}

        {debtReminder && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setDebtReminder(null); }}>
            <div className="form-modal form-modal--wide">
              <div className="form-modal-head">
                <div className="form-modal-title"><Bell size={16} />Recordatorio de deuda</div>
                <button className="icon-btn" onClick={() => setDebtReminder(null)}><X size={16} /></button>
              </div>
              <p className="admin-form-note">Se enviará solo después de confirmar. El canal app crea un comunicado interno dirigido al propietario.</p>
              <div className="admin-form">
                <label className="admin-field">
                  <span>Canal</span>
                  <select value={debtReminderChannel} onChange={(e) => setDebtReminderChannel(e.target.value)}>
                    <option value="app">Comunicado interno</option>
                    <option value="manual">Registro manual</option>
                    <option value="email" disabled>Email próximamente</option>
                    <option value="whatsapp" disabled>WhatsApp próximamente</option>
                  </select>
                </label>
                <label className="admin-field full">
                  <span>Mensaje</span>
                  <textarea rows={8} value={debtReminderMessage} onChange={(e) => setDebtReminderMessage(e.target.value)} />
                </label>
              </div>
              <div className="form-modal-foot">
                <button className="btn btn-ghost" onClick={() => setDebtReminder(null)}>Cancelar</button>
                <button className="btn btn-primary" onClick={sendDebtReminder} disabled={busy.startsWith('debt-reminder')}>Enviar</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function AssociateUnidentifiedModal({ payment, owners, units, onClose, onSuccess }: { payment: any; owners: any[]; units: any[]; onClose: () => void; onSuccess: () => void }) {
  const [ownerSearch, setOwnerSearch] = useState('');
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState(payment?.period || todayMonth());
  const [amount, setAmount] = useState(String(payment?.amount || 0));
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (payment?._id) {
      adminApi.unidentifiedPayments.getSuggestions(idOf(payment)).then(res => {
        setSuggestions(pick(res, 'suggestions', []));
      }).catch(() => {});
    }
  }, [payment]);

  const filteredOwners = useMemo(() => {
    if (!ownerSearch.trim()) return owners || [];
    const q = ownerSearch.toLowerCase();
    return (owners || []).filter((o: any) => o.name?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q));
  }, [owners, ownerSearch]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedOwner) { alert('Seleccioná un propietario.'); return; }
    if (!selectedUnit) { alert('Seleccioná una unidad.'); return; }
    setLoading(true);
    try {
      await adminApi.unidentifiedPayments.associate(idOf(payment), {
        ownerId: idOf(selectedOwner),
        unitId: selectedUnit,
        period: selectedPeriod,
        amount: Number(amount)
      });
      onSuccess();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo asociar el pago.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="form-modal form-modal--wide">
        <div className="form-modal-head">
          <div className="form-modal-title"><CreditCard size={16} />Asociar Pago No Identificado</div>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', padding: '0.5rem 0', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
          <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Monto recibido</span><div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: 16 }}>{money(payment?.amount)}</div></div>
          <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Fecha</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{dateLabel(payment?.paymentDate)}</div></div>
          <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Referencia</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{payment?.reference || '-'}</div></div>
          <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Remitente</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{payment?.senderName || '-'}</div></div>
        </div>
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 12, padding: '0.5rem', background: 'var(--surface)', borderRadius: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Sugerencias</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              {suggestions.slice(0, 3).map((s: any, i: number) => (
                <button key={i} type="button" className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                  onClick={() => { setSelectedOwner(s.owner); setSelectedUnit(s.unitId || ''); setAmount(String(s.suggestedAmount || payment?.amount)); }}>
                  {s.owner?.name || '—'} · {s.unitName || '—'} · {s.suggestedAmount ? money(s.suggestedAmount) : '?'}
                </button>
              ))}
            </div>
          </div>
        )}
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="admin-field full">
            <span>Buscar propietario</span>
            <input type="search" value={ownerSearch} onChange={(e) => { setOwnerSearch(e.target.value); setSelectedOwner(null); }} placeholder="Nombre o email" />
          </div>
          {selectedOwner ? (
            <div style={{ padding: '0.5rem', background: 'var(--accent-soft)', borderRadius: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Seleccionado</span>
              <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{selectedOwner.name}</div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedOwner(null)}>Cambiar</button>
            </div>
          ) : (
            <div className="admin-field full" style={{ maxHeight: 120, overflowY: 'auto' }}>
              <span>Propietarios</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredOwners.slice(0, 20).map((o: any) => (
                  <button key={idOf(o)} type="button" className="btn btn-ghost btn-sm" style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                    onClick={() => setSelectedOwner(o)}>
                    {o.name} · {o.email}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="admin-field full">
            <span>Unidad</span>
            <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} required>
              <option value="">Seleccionar unidad</option>
              {(selectedOwner?.units || []).map((u: any) => (
                <option key={idOf(u)} value={idOf(u)}>{typeof u === 'string' ? u : u.name}</option>
              ))}
            </select>
          </div>
          <Field label="Período" name="period" type="month" required value={selectedPeriod} onChange={(e: any) => setSelectedPeriod(e.target.value)} />
          <Field label="Monto a asociar" name="amount" type="number" required value={amount} onChange={(e: any) => setAmount(e.target.value)} />
          <div className="form-modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Asociando…' : 'Asociar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
