import type { FormEvent } from 'react';

export const todayMonth = () => new Date().toISOString().slice(0, 7);
export const formatARS = (value: unknown) => `ARS ${Number(value || 0).toLocaleString('es-AR')}`;
export const money = formatARS;
export const formatDate = (value: unknown) => value ? new Date(String(value)).toLocaleDateString('es-AR') : '-';
export const formatDateTime = (value: unknown) => value ? new Date(String(value)).toLocaleString('es-AR') : '-';
export const shortMonth = (value: string) => {
  const [, month] = value.split('-');
  return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][Number(month) - 1] || value;
};
export const idOf = (row: any) => String(row?._id || row?.id || '');
export const person = (row: any) => row?.owner?.name || row?.user?.name || row?.name || 'Sin nombre';
export const debtAmount = (row: any) => Number(row?.balanceOwed ?? row?.totalOwed ?? Math.max(0, -Number(row?.balance || 0)));
export const hasDebt = (row: any) => debtAmount(row) > 0 || !!row?.isDebtor;
export const unitNames = (row: any) => {
  const units = row?.owner?.units || row?.units;
  if (Array.isArray(units) && units.length) {
    return units.map((unit: any) => typeof unit === 'string' ? unit : unit?.name).filter(Boolean);
  }
  return [row?.owner?.unit, row?.unit].filter(Boolean);
};
export const unitLabel = (row: any) => unitNames(row).join(', ') || '-';
export const dateLabel = formatDate;
export const formObject = (event: FormEvent<HTMLFormElement>) => Object.fromEntries(new FormData(event.currentTarget).entries());

export const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  mantenimiento: 'Mantenimiento',
  corte_servicio: 'Corte de servicio',
  expensas: 'Expensas',
  asamblea: 'Asamblea',
  mora: 'Mora',
  seguridad: 'Seguridad',
  emergencia: 'Emergencia',
  otro: 'Otro'
};
export const PRIORITY_LABELS: Record<string, string> = { low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente' };
export const STATUS_LABELS: Record<string, string> = { draft: 'Borrador', scheduled: 'Programado', sent: 'Enviado', cancelled: 'Cancelado' };
export const normalizeNotice = (n: any) => {
  const priority = n?.priority || (n?.tag === 'urgent' ? 'urgent' : n?.tag === 'warning' ? 'high' : 'normal');
  return {
    ...n,
    subject: n?.subject || n?.title || '',
    category: n?.category || 'general',
    priority,
    status: n?.status || 'sent',
    channels: { app: true, email: false, push: false, whatsapp: false, ...(n?.channels || {}) },
    targetType: n?.targetType || 'all',
    targetFilters: n?.targetFilters || {}
  };
};
export const toLocalInput = (value?: string) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const statusText: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  cancelled: 'Cancelado',
  inside: 'Dentro',
  exited: 'Salió',
  paid: 'Pagado',
  partially_paid: 'Parcialmente pagado',
  unpaid: 'Impago',
  closed: 'Cerrado',
  active: 'Activo',
  requested: 'Solicitado',
  defaulted: 'En mora',
  archived: 'Archivado',
  associated: 'Asociado'
};

export const roleLabels: Record<string, string> = {
  security: 'Seguridad',
  cleaning: 'Limpieza',
  admin: 'Administración',
  maintenance: 'Mantenimiento',
  other: 'Otro'
};

export const paymentMethodLabels: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  manual: 'Manual',
  mercadopago: 'MercadoPago'
};

export const salaryPaidAmount = (s: any) =>
  s?.paidAmount != null ? Number(s.paidAmount) : (s?.status === 'paid' ? Number(s?.totalAmount || 0) : 0);
export const salaryRemainingAmount = (s: any) =>
  s?.remainingAmount != null ? Number(s.remainingAmount) : Math.max(Number(s?.totalAmount || 0) - salaryPaidAmount(s), 0);

export const documentCategoryLabels: Record<string, string> = {
  regulation: 'Reglamento',
  map: 'Mapa',
  rules: 'Normas de convivencia',
  assembly: 'Asamblea',
  insurance: 'Seguro',
  payment: 'Pagos',
  contract: 'Contrato',
  other: 'Otro'
};

export const documentVisibilityLabels: Record<string, string> = {
  admin: 'Solo administradores',
  owners: 'Visible para propietarios'
};

export function pick<T>(response: any, key: string, fallback: T): T {
  return response?.data?.[key] ?? fallback;
}

export function adminInitials(name: string) {
  return name?.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'GA';
}

export function orgLogoText(name: string) {
  return name?.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'G';
}

export const EXPENSE_COLORS: Record<string, string> = {
  maintenance: '#8fd694', services: '#7cc6f0', salaries: '#f5c265', security: '#c9a7ff', cleaning: '#f08a8a', other: '#9aa3a0'
};

export const EXPENSE_LABELS_MAP: Record<string, string> = {
  maintenance: 'Mantenimiento', services: 'Servicios', salaries: 'Sueldos', security: 'Seguridad', cleaning: 'Limpieza', other: 'Otros'
};

export function fmtK(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

export function buildSparklinePoints(values: number[]): string {
  if (!values.length) return '';
  const max = Math.max(...values, 1);
  return values.map((value, i) => {
    const x = values.length === 1 ? 0 : (i / (values.length - 1)) * 50;
    const y = 18 - (value / max) * 16;
    return `${x},${y}`;
  }).join(' ');
}

export function filteredMonthlyByPeriod(monthly: any[], period: string): any[] {
  const rows = [...(monthly || [])];
  if (period === 'todo') return rows;
  if (period === 'mes') return rows.slice(-1);
  if (period === 'trimestre') return rows.slice(-3);
  if (period === 'año') return rows.slice(-12);
  return rows;
}

export function expensesByCategory(expenses: any[]): Array<{ cat: string; label: string; amount: number; color: string; pct: number }> {
  const map: Record<string, number> = {};
  (expenses || []).forEach((expense) => {
    const cat = expense.category || 'other';
    map[cat] = (map[cat] || 0) + Number(expense.amount || 0);
  });
  const total = Object.values(map).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(map)
    .map(([cat, amount]) => ({
      cat,
      amount,
      label: EXPENSE_LABELS_MAP[cat] || cat,
      color: EXPENSE_COLORS[cat] || EXPENSE_COLORS.other,
      pct: Math.round((amount / total) * 100)
    }))
    .sort((a, b) => b.amount - a.amount);
}
