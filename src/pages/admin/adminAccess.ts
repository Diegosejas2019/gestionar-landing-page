export type TabKey = 'agenda' | 'inicio' | 'finanzas' | 'morosidad' | 'planes' | 'empleados' | 'sueldos' | 'propietarios' | 'solicitudes' | 'comunicados' | 'reclamos' | 'votaciones' | 'reservas' | 'visitas' | 'proveedores' | 'documentos' | 'config';
export type FeatureKey = 'visits' | 'reservations' | 'votes' | 'claims' | 'notices' | 'expenses' | 'providers' | 'documents';
export type AdminRoleKey = 'owner_admin' | 'read_only' | 'billing_manager' | 'communications_manager' | 'security_guard';

export const tabPermissions: Record<TabKey, string> = {
  agenda: 'dashboard.read',
  inicio: 'dashboard.read',
  finanzas: 'payments.read',
  morosidad: 'debt.read',
  planes: 'paymentPlans.read',
  empleados: 'employees.read',
  sueldos: 'salaries.read',
  propietarios: 'owners.read',
  solicitudes: 'owners.create',
  comunicados: 'notices.read',
  reclamos: 'claims.read',
  votaciones: 'votes.read',
  reservas: 'reservations.read',
  visitas: 'visits.read',
  proveedores: 'providers.read',
  documentos: 'documents.read',
  config: 'settings.read'
};

export const defaultFeatures: Record<FeatureKey, boolean> = {
  visits: false,
  reservations: false,
  votes: true,
  claims: true,
  notices: true,
  expenses: true,
  providers: true,
  documents: true
};

export const permissionDisplay: Record<string, { module: string; label: string }> = {
  'dashboard.read': { module: 'Inicio', label: 'Ver dashboard' },
  'owners.read': { module: 'Propietarios', label: 'Ver' },
  'owners.create': { module: 'Propietarios', label: 'Crear' },
  'owners.update': { module: 'Propietarios', label: 'Editar' },
  'owners.delete': { module: 'Propietarios', label: 'Eliminar' },
  'payments.read': { module: 'Pagos', label: 'Ver' },
  'payments.register': { module: 'Pagos', label: 'Registrar pagos' },
  'payments.approve': { module: 'Pagos', label: 'Aprobar pagos' },
  'payments.cancel': { module: 'Pagos', label: 'Anular pagos' },
  'payments.remind': { module: 'Pagos', label: 'Enviar recordatorios' },
  'debt.read': { module: 'Deudas', label: 'Ver' },
  'debt.create': { module: 'Deudas', label: 'Crear saldo/ajuste' },
  'debt.cancel': { module: 'Deudas', label: 'Anular saldo/ajuste' },
  'paymentPlans.read': { module: 'Planes de pago', label: 'Ver' },
  'paymentPlans.create': { module: 'Planes de pago', label: 'Crear' },
  'paymentPlans.approve': { module: 'Planes de pago', label: 'Aprobar' },
  'paymentPlans.cancel': { module: 'Planes de pago', label: 'Cancelar' },
  'paymentPlans.registerPayment': { module: 'Planes de pago', label: 'Registrar pago de cuota' },
  'claims.read': { module: 'Reclamos', label: 'Ver' },
  'claims.respond': { module: 'Reclamos', label: 'Responder' },
  'claims.close': { module: 'Reclamos', label: 'Cerrar' },
  'notices.read': { module: 'Avisos', label: 'Ver' },
  'notices.create': { module: 'Avisos', label: 'Crear' },
  'notices.update': { module: 'Avisos', label: 'Editar' },
  'notices.delete': { module: 'Avisos', label: 'Eliminar' },
  'settings.read': { module: 'Configuración', label: 'Ver' },
  'settings.update': { module: 'Configuración', label: 'Editar' },
  'admins.read': { module: 'Administradores', label: 'Ver' },
  'admins.create': { module: 'Administradores', label: 'Invitar' },
  'admins.update': { module: 'Administradores', label: 'Editar rol' },
  'admins.disable': { module: 'Administradores', label: 'Desactivar' },
  'expenses.read': { module: 'Gastos', label: 'Ver' },
  'expenses.create': { module: 'Gastos', label: 'Crear' },
  'expenses.update': { module: 'Gastos', label: 'Editar' },
  'expenses.delete': { module: 'Gastos', label: 'Eliminar' },
  'providers.read': { module: 'Proveedores', label: 'Ver' },
  'providers.create': { module: 'Proveedores', label: 'Crear' },
  'providers.update': { module: 'Proveedores', label: 'Editar' },
  'providers.delete': { module: 'Proveedores', label: 'Eliminar' },
  'employees.read': { module: 'Empleados', label: 'Ver' },
  'employees.create': { module: 'Empleados', label: 'Crear' },
  'employees.update': { module: 'Empleados', label: 'Editar' },
  'employees.delete': { module: 'Empleados', label: 'Eliminar' },
  'salaries.read': { module: 'Sueldos', label: 'Ver' },
  'salaries.create': { module: 'Sueldos', label: 'Crear' },
  'salaries.update': { module: 'Sueldos', label: 'Editar' },
  'salaries.delete': { module: 'Sueldos', label: 'Eliminar' },
  'visits.read': { module: 'Visitas', label: 'Ver' },
  'visits.create': { module: 'Visitas', label: 'Crear' },
  'visits.update': { module: 'Visitas', label: 'Editar' },
  'visits.delete': { module: 'Visitas', label: 'Eliminar' },
  'reservations.read': { module: 'Reservas', label: 'Ver' },
  'reservations.create': { module: 'Reservas', label: 'Crear' },
  'reservations.update': { module: 'Reservas', label: 'Editar' },
  'reservations.delete': { module: 'Reservas', label: 'Eliminar' },
  'spaces.read': { module: 'Espacios', label: 'Ver' },
  'spaces.create': { module: 'Espacios', label: 'Crear' },
  'spaces.update': { module: 'Espacios', label: 'Editar' },
  'spaces.delete': { module: 'Espacios', label: 'Eliminar' },
  'votes.read': { module: 'Votaciones', label: 'Ver' },
  'votes.create': { module: 'Votaciones', label: 'Crear' },
  'votes.update': { module: 'Votaciones', label: 'Editar' },
  'votes.delete': { module: 'Votaciones', label: 'Eliminar' },
  'documents.read': { module: 'Documentos', label: 'Ver' },
  'documents.create': { module: 'Documentos', label: 'Crear' },
  'documents.update': { module: 'Documentos', label: 'Editar' },
  'documents.delete': { module: 'Documentos', label: 'Eliminar' }
};

export function permissionGroups(permissions: string[]) {
  const groups = new Map<string, string[]>();
  permissions.forEach((permission) => {
    const item = permissionDisplay[permission] || { module: 'Otros', label: 'Permiso adicional' };
    const labels = groups.get(item.module) || [];
    if (!labels.includes(item.label)) labels.push(item.label);
    groups.set(item.module, labels);
  });
  return Array.from(groups.entries()).map(([module, labels]) => ({ module, labels }));
}

export function orgIdFromSession(me: any, config: any) {
  const membershipOrg = me?.data?.membership?.organization;
  const userOrg = me?.data?.user?.organization;
  return config?.orgId
    || (typeof membershipOrg === 'string' ? membershipOrg : membershipOrg?._id)
    || (typeof userOrg === 'string' ? userOrg : userOrg?._id)
    || '';
}
