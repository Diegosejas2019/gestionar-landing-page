import { apiBlob, apiClient } from './apiClient';
import { cacheDelete, cacheDeletePrefix, cacheKey, cachedApiCall } from './cache';

type Params = Record<string, string | number | boolean | undefined | null>;
type Payload = Record<string, unknown> | FormData;

const qs = (params: Params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  const value = search.toString();
  return value ? `?${value}` : '';
};

const body = (data: Payload) => data instanceof FormData ? data : JSON.stringify(data);
const invalidateList = (prefix: string) => cacheDeletePrefix(prefix);

export const adminApi = {
  me: () => cachedApiCall('me', () => apiClient<any>('/auth/me', { auth: true })),

  owners: {
    stats: () => cachedApiCall('owners:stats', () => apiClient<any>('/owners/stats', { auth: true })),
    checkEmail: (email: string) => apiClient<any>(`/owners/check-email?${new URLSearchParams({ email })}`, { auth: true }),
    list: (params?: Params) => cachedApiCall(
      cacheKey('owners:list', params),
      () => apiClient<any>(`/owners${qs(params)}`, { auth: true })
    ),
    getOne: (id: string) => apiClient<any>(`/owners/${id}`, { auth: true }),
    availableItems: (id: string) => apiClient<any>(`/owners/${id}/available-items`, { auth: true }),
    create: (data: Payload) => { invalidateList('owners:list'); return apiClient<any>('/owners', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { invalidateList('owners:list'); return apiClient<any>(`/owners/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    notify: (id: string, title: string, message: string) =>
      apiClient<any>(`/owners/${id}/notify`, { method: 'POST', auth: true, body: JSON.stringify({ title, body: message }) }),
    delete: (id: string) => { invalidateList('owners:list'); return apiClient<any>(`/owners/${id}`, { method: 'DELETE', auth: true }); }
  },

  units: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('units:list', params),
      () => apiClient<any>(`/units${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { invalidateList('units:list'); return apiClient<any>('/units', { method: 'POST', auth: true, body: body(data) }); },
    bulkCreate: (data: { count: number; start: number; prefix: string }) => { invalidateList('units:list'); return apiClient<any>('/units/bulk', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { invalidateList('units:list'); return apiClient<any>(`/units/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    assignOwner: (id: string, ownerId: string) => { invalidateList('units:list'); return apiClient<any>(`/units/${id}/assign-owner`, { method: 'PATCH', auth: true, body: JSON.stringify({ ownerId }) }); },
    releaseOwner: (id: string) => { invalidateList('units:list'); return apiClient<any>(`/units/${id}/release-owner`, { method: 'PATCH', auth: true, body: JSON.stringify({}) }); },
    delete: (id: string) => { invalidateList('units:list'); return apiClient<any>(`/units/${id}`, { method: 'DELETE', auth: true }); }
  },

  payments: {
    dashboard: (year: number) => cachedApiCall(
      `payments:dashboard:${year}`,
      () => apiClient<any>(`/payments/dashboard?year=${year}`, { auth: true })
    ),
    list: (params?: Params) => cachedApiCall(
      cacheKey('payments:list', params),
      () => apiClient<any>(`/payments${qs(params)}`, { auth: true })
    ),
    adminOwners: (params?: Params) => cachedApiCall(
      cacheKey('payments:admin-owners', params),
      () => apiClient<any>(`/payments/admin/owners${qs(params)}`, { auth: true })
    ),
    create: (data: FormData) => { invalidateList('payments:list'); return apiClient<any>('/payments', { method: 'POST', auth: true, body: data }); },
    availableItems: (params?: Params) => apiClient<any>(`/payments/available-items${qs(params)}`, { auth: true }),
    approve: (id: string) => { invalidateList('payments:list'); return apiClient<any>(`/payments/${id}/approve`, { method: 'PATCH', auth: true }); },
    reject: (id: string, rejectionNote: string) => {
      invalidateList('payments:list');
      return apiClient<any>(`/payments/${id}/reject`, { method: 'PATCH', auth: true, body: JSON.stringify({ rejectionNote }) });
    },
    delete: (id: string) => { invalidateList('payments:list'); return apiClient<any>(`/payments/${id}`, { method: 'DELETE', auth: true }); },
    receipt: (id: string) => apiBlob(`/payments/${id}/receipt`, { auth: true }),
    systemReceipt: (id: string) => apiBlob(`/payments/${id}/system-receipt?download=1`, { auth: true }),
    resendReceipt: (id: string) => apiClient<any>(`/payments/${id}/resend-receipt`, { method: 'POST', auth: true }),
    reminders: () => apiClient<any>('/payments/send-reminders', { method: 'POST', auth: true })
  },

  unidentifiedPayments: {
    summary: (params?: Params) => cachedApiCall(
      'unidentifiedPayments:summary',
      () => apiClient<any>(`/unidentified-payments/summary${qs(params)}`, { auth: true })
    ),
    list: (params?: Params) => cachedApiCall(
      cacheKey('unidentifiedPayments:list', params),
      () => apiClient<any>(`/unidentified-payments${qs(params)}`, { auth: true })
    ),
    getOne: (id: string) => apiClient<any>(`/unidentified-payments/${id}`, { auth: true }),
    create: (data: Payload) => { invalidateList('unidentifiedPayments:list'); return apiClient<any>('/unidentified-payments', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { invalidateList('unidentifiedPayments:list'); return apiClient<any>(`/unidentified-payments/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    delete: (id: string) => { invalidateList('unidentifiedPayments:list'); return apiClient<any>(`/unidentified-payments/${id}`, { method: 'DELETE', auth: true }); },
    getSuggestions: (id: string) => apiClient<any>(`/unidentified-payments/${id}/suggestions`, { auth: true }),
    associate: (id: string, data: Payload) => { invalidateList('unidentifiedPayments:list'); return apiClient<any>(`/unidentified-payments/${id}/associate`, { method: 'POST', auth: true, body: body(data) }); },
    reject: (id: string, reason: string) => { invalidateList('unidentifiedPayments:list'); return apiClient<any>(`/unidentified-payments/${id}/reject`, { method: 'POST', auth: true, body: JSON.stringify({ reason }) }); },
    archive: (id: string, reason?: string) => { invalidateList('unidentifiedPayments:list'); return apiClient<any>(`/unidentified-payments/${id}/archive`, { method: 'POST', auth: true, body: JSON.stringify({ reason }) }); },
  },

  delinquency: {
    summary: (params?: Params) => cachedApiCall(
      cacheKey('delinquency:summary', params),
      () => apiClient<any>(`/delinquency/summary${qs(params)}`, { auth: true })
    ),
    owners: (params?: Params) => cachedApiCall(
      cacheKey('delinquency:owners', params),
      () => apiClient<any>(`/delinquency/owners${qs(params)}`, { auth: true })
    ),
    owner: (id: string) => apiClient<any>(`/delinquency/owners/${id}`, { auth: true }),
    aging: (params?: Params) => cachedApiCall(
      cacheKey('delinquency:aging', params),
      () => apiClient<any>(`/delinquency/aging${qs(params)}`, { auth: true })
    ),
    reminder: (id: string, data: Payload) => {
      cacheDeletePrefix('delinquency:');
      invalidateList('notices:list');
      return apiClient<any>(`/delinquency/owners/${id}/reminders`, { method: 'POST', auth: true, body: body(data) });
    },
    export: (params?: Params) => apiBlob(`/delinquency/export${qs(params)}`, { auth: true }),
    ownerExport: (id: string, params?: Params) => apiBlob(`/delinquency/owners/${id}/export${qs(params)}`, { auth: true })
  },

  permissions: {
    me: () => cachedApiCall('admin:permissions:me', () => apiClient<any>('/admin/permissions/me', { auth: true }))
  },

  adminUsers: {
    list: () => cachedApiCall('admin:users', () => apiClient<any>('/admin/users', { auth: true })),
    searchOwners: (query: string) => apiClient<any>(`/admin/owners/search${qs({ query })}`, { auth: true }),
    invite: (data: Payload) => { cacheDelete('admin:users'); return apiClient<any>('/admin/users/invite', { method: 'POST', auth: true, body: body(data) }); },
    updateRole: (id: string, role: string) => { cacheDelete('admin:users'); return apiClient<any>(`/admin/users/${id}/role`, { method: 'PATCH', auth: true, body: JSON.stringify({ role }) }); },
    disable: (id: string) => { cacheDelete('admin:users'); return apiClient<any>(`/admin/users/${id}/disable`, { method: 'PATCH', auth: true }); }
  },

  notices: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('notices:list', params),
      () => apiClient<any>(`/notices${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { invalidateList('notices:list'); return apiClient<any>('/notices', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { invalidateList('notices:list'); return apiClient<any>(`/notices/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    delete: (id: string) => { invalidateList('notices:list'); return apiClient<any>(`/notices/${id}`, { method: 'DELETE', auth: true }); },
    sendNow: (id: string) => { invalidateList('notices:list'); return apiClient<any>(`/notices/${id}/send-now`, { method: 'POST', auth: true }); },
    cancel: (id: string) => { invalidateList('notices:list'); return apiClient<any>(`/notices/${id}/cancel`, { method: 'POST', auth: true }); },
    processScheduled: () => { invalidateList('notices:list'); return apiClient<any>('/notices/process-scheduled', { method: 'POST', auth: true }); },
    stats: (id: string) => apiClient<any>(`/notices/${id}/stats`, { auth: true }),
    attachment: (id: string, index: number) => apiBlob(`/notices/${id}/attachment/${index}`, { auth: true })
  },

  noticeTemplates: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('notice-templates:list', params),
      () => apiClient<any>(`/notice-templates${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { cacheDeletePrefix('notice-templates:list'); return apiClient<any>('/notice-templates', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { cacheDeletePrefix('notice-templates:list'); return apiClient<any>(`/notice-templates/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    delete: (id: string) => { cacheDeletePrefix('notice-templates:list'); return apiClient<any>(`/notice-templates/${id}`, { method: 'DELETE', auth: true }); }
  },

  claims: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('claims:list', params),
      () => apiClient<any>(`/claims${qs(params)}`, { auth: true })
    ),
    status: (id: string, status: string, adminNote?: string) => {
      invalidateList('claims:list');
      return apiClient<any>(`/claims/${id}/status`, { method: 'PATCH', auth: true, body: JSON.stringify({ status, adminNote }) });
    },
    attachment: (id: string, index: number) => apiBlob(`/claims/${id}/attachment/${index}`, { auth: true }),
    delete: (id: string) => { invalidateList('claims:list'); return apiClient<any>(`/claims/${id}`, { method: 'DELETE', auth: true }); }
  },

  expenses: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('expenses:list', params),
      () => apiClient<any>(`/expenses${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { invalidateList('expenses:list'); return apiClient<any>('/expenses', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { invalidateList('expenses:list'); return apiClient<any>(`/expenses/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    paid: (id: string) => { invalidateList('expenses:list'); return apiClient<any>(`/expenses/${id}/paid`, { method: 'PATCH', auth: true, body: JSON.stringify({}) }); },
    attachment: (id: string, index: number) => apiBlob(`/expenses/${id}/attachment/${index}`, { auth: true }),
    deleteAttachment: (id: string, index: number) => apiClient<any>(`/expenses/${id}/attachment/${index}`, { method: 'DELETE', auth: true }),
    delete: (id: string) => { invalidateList('expenses:list'); return apiClient<any>(`/expenses/${id}`, { method: 'DELETE', auth: true }); }
  },

  employees: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('employees:list', params),
      () => apiClient<any>(`/employees${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { invalidateList('employees:list'); return apiClient<any>('/employees', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { invalidateList('employees:list'); return apiClient<any>(`/employees/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    delete: (id: string) => { invalidateList('employees:list'); return apiClient<any>(`/employees/${id}`, { method: 'DELETE', auth: true }); },
    getDocument: (id: string, index: number) => apiBlob(`/employees/${id}/document/${index}`, { auth: true }),
    deleteDocument: (id: string, index: number) => apiClient<any>(`/employees/${id}/document/${index}`, { method: 'DELETE', auth: true })
  },

  salaries: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('salaries:list', params),
      () => apiClient<any>(`/salaries${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { invalidateList('salaries:list'); return apiClient<any>('/salaries', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { invalidateList('salaries:list'); return apiClient<any>(`/salaries/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    delete: (id: string) => { invalidateList('salaries:list'); return apiClient<any>(`/salaries/${id}`, { method: 'DELETE', auth: true }); }
  },

  salaryPayments: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('salary-payments:list', params),
      () => apiClient<any>(`/salary-payments${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { invalidateList('salary-payments:list'); return apiClient<any>('/salary-payments', { method: 'POST', auth: true, body: body(data) }); },
    delete: (id: string) => { invalidateList('salary-payments:list'); return apiClient<any>(`/salary-payments/${id}`, { method: 'DELETE', auth: true }); }
  },

  providers: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('providers:list', params),
      () => apiClient<any>(`/providers${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { invalidateList('providers:list'); return apiClient<any>('/providers', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { invalidateList('providers:list'); return apiClient<any>(`/providers/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    delete: (id: string) => { invalidateList('providers:list'); return apiClient<any>(`/providers/${id}`, { method: 'DELETE', auth: true }); },
    deleteDocument: (id: string, index: number) => { invalidateList('providers:list'); return apiClient<any>(`/providers/${id}/document/${index}`, { method: 'DELETE', auth: true }); },
    getDocumentBlob: (id: string, index: number) => apiBlob(`/providers/${id}/document/${index}`, { auth: true }),
  },

  reports: {
    monthly: (month: string) => cachedApiCall(
      `reports:monthly:${month}`,
      () => apiClient<any>(`/reports/monthly-summary?month=${encodeURIComponent(month)}`, { auth: true })
    ),
    expensasPdf: (month: string) => apiBlob(`/reports/expensas-pdf?month=${encodeURIComponent(month)}`, { auth: true }),
    ownerStatement: (data: Payload) => apiClient<any>('/reports/owner-statement', { method: 'POST', auth: true, body: body(data) }),
    ownerStatementPdf: (data: Payload) => apiBlob('/reports/owner-statement/pdf', { method: 'POST', auth: true, body: body(data) }),
    delinquency: (data: Payload) => apiClient<any>('/reports/delinquency', { method: 'POST', auth: true, body: body(data) }),
    payments: (data: Payload) => apiClient<any>('/reports/payments', { method: 'POST', auth: true, body: body(data) }),
    expenses: (data: Payload) => apiClient<any>('/reports/expenses', { method: 'POST', auth: true, body: body(data) }),
    owners: (data: Payload) => apiClient<any>('/reports/owners', { method: 'POST', auth: true, body: body(data) })
  },

  renditions: {
    preview: (period: string) => apiClient<any>(`/renditions/preview?period=${encodeURIComponent(period)}`, { auth: true }),
    history: () => apiClient<any>('/renditions/history', { auth: true }),
    annual: (year: number) => apiClient<any>(`/renditions/annual?year=${year}`, { auth: true }),
    generatePdf: (period: string) => apiClient<any>(`/renditions/${encodeURIComponent(period)}/generate-pdf`, { method: 'POST', auth: true }),
    exportCsv: (period: string, section: string) => apiBlob(`/renditions/${encodeURIComponent(period)}/export-csv?section=${encodeURIComponent(section)}`, { auth: true }),
    saveObservations: (period: string, observations: string) =>
      apiClient<any>(`/renditions/${encodeURIComponent(period)}/observations`, { method: 'PATCH', auth: true, body: JSON.stringify({ observations }) })
  },

  debtItems: {
    listByOwner: (ownerId: string) => apiClient<any>(`/owners/${ownerId}/debt-items`, { auth: true }),
    create: (ownerId: string, data: Payload) => apiClient<any>(`/owners/${ownerId}/debt-items`, { method: 'POST', auth: true, body: body(data) }),
    markAsPaid: (id: string) => apiClient<any>(`/debt-items/${id}/paid`, { method: 'PATCH', auth: true }),
    cancel: (id: string, cancellationReason: string) =>
      apiClient<any>(`/debt-items/${id}/cancel`, { method: 'PATCH', auth: true, body: JSON.stringify({ cancellationReason }) })
  },

  paymentPlans: {
    listAdmin: (params?: Params) => cachedApiCall(
      cacheKey('payment-plans:admin', params),
      () => apiClient<any>(`/payment-plans/admin${qs(params)}`, { auth: true })
    ),
    getAdmin: (id: string) => apiClient<any>(`/payment-plans/admin/${id}`, { auth: true }),
    create: (data: Payload) => { cacheDeletePrefix('payment-plans:admin'); return apiClient<any>('/payment-plans/admin', { method: 'POST', auth: true, body: body(data) }); },
    approve: (id: string, data: Payload) => { cacheDeletePrefix('payment-plans:admin'); return apiClient<any>(`/payment-plans/admin/${id}/approve`, { method: 'POST', auth: true, body: body(data) }); },
    reject: (id: string, data: Payload) => { cacheDeletePrefix('payment-plans:admin'); return apiClient<any>(`/payment-plans/admin/${id}/reject`, { method: 'POST', auth: true, body: body(data) }); },
    cancel: (id: string) => { cacheDeletePrefix('payment-plans:admin'); return apiClient<any>(`/payment-plans/admin/${id}/cancel`, { method: 'PATCH', auth: true }); },
    delete: (id: string) => { cacheDeletePrefix('payment-plans:admin'); return apiClient<any>(`/payment-plans/admin/${id}`, { method: 'DELETE', auth: true }); },
    registerInstallmentPayment: (id: string) => { cacheDeletePrefix('payment-plans:admin'); return apiClient<any>(`/payment-plans/admin/installments/${id}/register-payment`, { method: 'POST', auth: true }); }
  },

  votes: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('votes:list', params),
      () => apiClient<any>(`/votes${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { invalidateList('votes:list'); return apiClient<any>('/votes', { method: 'POST', auth: true, body: body(data) }); },
    close: (id: string) => { invalidateList('votes:list'); return apiClient<any>(`/votes/${id}/close`, { method: 'PATCH', auth: true }); },
    delete: (id: string) => { invalidateList('votes:list'); return apiClient<any>(`/votes/${id}`, { method: 'DELETE', auth: true }); }
  },

  visits: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('visits:list', params),
      () => apiClient<any>(`/visits${qs(params)}`, { auth: true })
    ),
    today: () => apiClient<any>('/visits/today', { auth: true }),
    history: (params?: Params) => apiClient<any>(`/visits/history${qs(params)}`, { auth: true }),
    status: (id: string, status: string) => {
      invalidateList('visits:list');
      return apiClient<any>(`/visits/${id}/status`, { method: 'PATCH', auth: true, body: JSON.stringify({ status }) });
    },
    checkIn: (id: string, comment?: string) => {
      invalidateList('visits:list');
      return apiClient<any>(`/visits/${id}/check-in`, { method: 'POST', auth: true, body: JSON.stringify({ comment }) });
    },
    checkOut: (id: string, comment?: string) => {
      invalidateList('visits:list');
      return apiClient<any>(`/visits/${id}/check-out`, { method: 'POST', auth: true, body: JSON.stringify({ comment }) });
    },
    delete: (id: string) => { invalidateList('visits:list'); return apiClient<any>(`/visits/${id}`, { method: 'DELETE', auth: true }); }
  },

  spaces: {
    list: () => cachedApiCall('spaces:list', () => apiClient<any>('/spaces', { auth: true })),
    create: (data: Payload) => { invalidateList('spaces:list'); return apiClient<any>('/spaces', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { invalidateList('spaces:list'); return apiClient<any>(`/spaces/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    delete: (id: string) => { invalidateList('spaces:list'); return apiClient<any>(`/spaces/${id}`, { method: 'DELETE', auth: true }); }
  },

  reservations: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('reservations:list', params),
      () => apiClient<any>(`/reservations${qs(params)}`, { auth: true })
    ),
    status: (id: string, status: string) => {
      invalidateList('reservations:list');
      return apiClient<any>(`/reservations/${id}/status`, { method: 'PATCH', auth: true, body: JSON.stringify({ status }) });
    },
    delete: (id: string) => { invalidateList('reservations:list'); return apiClient<any>(`/reservations/${id}`, { method: 'DELETE', auth: true }); }
  },

  accessRequests: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('access-requests:list', params),
      () => apiClient<any>(`/access-requests${qs(params)}`, { auth: true })
    ),
    getOne: (id: string) => apiClient<any>(`/access-requests/${id}`, { auth: true }),
    approve: (id: string, data: Payload) => { cacheDeletePrefix('access-requests:list'); return apiClient<any>(`/access-requests/${id}/approve`, { method: 'POST', auth: true, body: body(data) }); },
    reject: (id: string, data: Payload) => { cacheDeletePrefix('access-requests:list'); return apiClient<any>(`/access-requests/${id}/reject`, { method: 'POST', auth: true, body: body(data) }); },
    settings: () => apiClient<any>('/access-requests/settings', { auth: true }),
    updateSettings: (data: Payload) => apiClient<any>('/access-requests/settings', { method: 'PATCH', auth: true, body: body(data) }),
    regenerateCode: () => apiClient<any>('/access-requests/regenerate-code', { method: 'POST', auth: true })
  },

  config: {
    get: () => cachedApiCall('config', () => apiClient<any>('/config', { auth: true })),
    update: (data: Payload) => { cacheDelete('config'); return apiClient<any>('/config', { method: 'PATCH', auth: true, body: body(data) }); }
  },

  documents: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('documents:list', params),
      () => apiClient<any>(`/organization-documents${qs(params)}`, { auth: true })
    ),
    create: (data: FormData) => { cacheDeletePrefix('documents:list'); return apiClient<any>('/organization-documents', { method: 'POST', auth: true, body: data }); },
    update: (id: string, data: FormData) => { cacheDeletePrefix('documents:list'); return apiClient<any>(`/organization-documents/${id}`, { method: 'PATCH', auth: true, body: data }); },
    delete: (id: string) => { cacheDeletePrefix('documents:list'); return apiClient<any>(`/organization-documents/${id}`, { method: 'DELETE', auth: true }); },
    download: (id: string) => apiBlob(`/organization-documents/${id}/download`, { auth: true })
  },

  organizations: {
    features: (id: string) => cachedApiCall(
      `organizations:features:${id}`,
      () => apiClient<any>(`/organizations/${id}/features`, { auth: true })
    ),
    updateFeatures: (id: string, data: Payload) => {
      cacheDelete(`organizations:features:${id}`);
      return apiClient<any>(`/organizations/${id}/features`, { method: 'PUT', auth: true, body: body(data) });
    }
  }
};

export const superAdminApi = {
  me: () => cachedApiCall('super-admin:me', () => apiClient<any>('/auth/me', { auth: true })),

  analytics: {
    overview: () => apiClient<any>('/super-admin/analytics/overview', { auth: true }),
    dailyActivity: (params?: Params) => apiClient<any>(`/super-admin/analytics/daily-activity${qs(params)}`, { auth: true }),
    organizations: (params?: Params) => apiClient<any>(`/super-admin/analytics/organizations${qs(params)}`, { auth: true }),
    modules: (params?: Params) => apiClient<any>(`/super-admin/analytics/modules${qs(params)}`, { auth: true })
  },

  users: {
    updatePasswordByEmail: (data: { email: string; newPassword: string }) =>
      apiClient<any>('/super-admin/users/password', { method: 'PATCH', auth: true, body: JSON.stringify(data) })
  },

  support: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('support:list', params),
      () => apiClient<any>(`/support-tickets${qs(params)}`, { auth: true })
    ),
    update: (id: string, data: Payload) => { invalidateList('support:list'); return apiClient<any>(`/support-tickets/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    delete: (id: string) => { invalidateList('support:list'); return apiClient<any>(`/support-tickets/${id}`, { method: 'DELETE', auth: true }); }
  },

  organizations: {
    list: () => cachedApiCall('organizations:list', () => apiClient<any>('/organizations', { auth: true })),
    create: (data: Payload) => { invalidateList('organizations:list'); return apiClient<any>('/organizations', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { invalidateList('organizations:list'); return apiClient<any>(`/organizations/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    delete: (id: string) => { invalidateList('organizations:list'); return apiClient<any>(`/organizations/${id}`, { method: 'DELETE', auth: true }); },
    status: (id: string, data: Payload) => {
      invalidateList('organizations:list');
      return apiClient<any>(`/super-admin/organizations/${id}/status`, { method: 'PATCH', auth: true, body: body(data) });
    },
    members: (id: string, params?: Params) => cachedApiCall(
      cacheKey(`organizations:members:${id}`, params),
      () => apiClient<any>(`/organizations/${id}/members${qs(params)}`, { auth: true })
    ),
    features: (id: string) => cachedApiCall(
      `organizations:features:${id}`,
      () => apiClient<any>(`/organizations/${id}/features`, { auth: true })
    ),
    updateFeatures: (id: string, data: Payload) => {
      cacheDelete(`organizations:features:${id}`);
      return apiClient<any>(`/organizations/${id}/features`, { method: 'PUT', auth: true, body: body(data) });
    }
  }
};
