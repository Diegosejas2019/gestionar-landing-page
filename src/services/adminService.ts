import { apiBlob, apiClient } from './apiClient';
import { cacheGet, cacheSet, cacheDelete, cacheDeletePrefix, cacheKey, cachedApiCall } from './cache';

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

const noCache = (method?: string) => method && method !== 'GET';

export const adminApi = {
  me: () => cachedApiCall('me', () => apiClient<any>('/auth/me', { auth: true })),

  owners: {
    stats: () => cachedApiCall('owners:stats', () => apiClient<any>('/owners/stats', { auth: true })),
    checkEmail: (email: string) => apiClient<any>(`/owners/check-email?${new URLSearchParams({ email })}`, { auth: true }),
    list: (params?: Params) => cachedApiCall(
      cacheKey('owners:list', params),
      () => apiClient<any>(`/owners${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { cacheDelete('owners:list'); return apiClient<any>('/owners', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => apiClient<any>(`/owners/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => { cacheDelete('owners:list'); return apiClient<any>(`/owners/${id}`, { method: 'DELETE', auth: true }); }
  },

  units: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('units:list', params),
      () => apiClient<any>(`/units${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { cacheDelete('units:list'); return apiClient<any>('/units', { method: 'POST', auth: true, body: body(data) }); },
    bulkCreate: (data: { count: number; start: number; prefix: string }) => { cacheDelete('units:list'); return apiClient<any>('/units/bulk', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => apiClient<any>(`/units/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => { cacheDelete('units:list'); return apiClient<any>(`/units/${id}`, { method: 'DELETE', auth: true }); }
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
    approve: (id: string) => { cacheDelete('payments:list'); return apiClient<any>(`/payments/${id}/approve`, { method: 'PATCH', auth: true }); },
    reject: (id: string, rejectionNote: string) => {
      cacheDelete('payments:list');
      return apiClient<any>(`/payments/${id}/reject`, { method: 'PATCH', auth: true, body: JSON.stringify({ rejectionNote }) });
    },
    delete: (id: string) => { cacheDelete('payments:list'); return apiClient<any>(`/payments/${id}`, { method: 'DELETE', auth: true }); },
    reminders: () => apiClient<any>('/payments/send-reminders', { method: 'POST', auth: true })
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
    create: (data: Payload) => { cacheDelete('notices:list'); return apiClient<any>('/notices', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => apiClient<any>(`/notices/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => { cacheDelete('notices:list'); return apiClient<any>(`/notices/${id}`, { method: 'DELETE', auth: true }); },
    attachment: (id: string, index: number) => apiBlob(`/notices/${id}/attachment/${index}`, { auth: true })
  },

  claims: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('claims:list', params),
      () => apiClient<any>(`/claims${qs(params)}`, { auth: true })
    ),
    status: (id: string, status: string, adminNote?: string) => {
      cacheDelete('claims:list');
      return apiClient<any>(`/claims/${id}/status`, { method: 'PATCH', auth: true, body: JSON.stringify({ status, adminNote }) });
    },
    delete: (id: string) => { cacheDelete('claims:list'); return apiClient<any>(`/claims/${id}`, { method: 'DELETE', auth: true }); }
  },

  expenses: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('expenses:list', params),
      () => apiClient<any>(`/expenses${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { cacheDelete('expenses:list'); return apiClient<any>('/expenses', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => apiClient<any>(`/expenses/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    paid: (id: string) => { cacheDelete('expenses:list'); return apiClient<any>(`/expenses/${id}/paid`, { method: 'PATCH', auth: true, body: JSON.stringify({}) }); },
    delete: (id: string) => { cacheDelete('expenses:list'); return apiClient<any>(`/expenses/${id}`, { method: 'DELETE', auth: true }); }
  },

  employees: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('employees:list', params),
      () => apiClient<any>(`/employees${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { cacheDelete('employees:list'); return apiClient<any>('/employees', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => apiClient<any>(`/employees/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => { cacheDelete('employees:list'); return apiClient<any>(`/employees/${id}`, { method: 'DELETE', auth: true }); },
    getDocument: (id: string, index: number) => apiBlob(`/employees/${id}/document/${index}`, { auth: true }),
    deleteDocument: (id: string, index: number) => apiClient<any>(`/employees/${id}/document/${index}`, { method: 'DELETE', auth: true })
  },

  salaries: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('salaries:list', params),
      () => apiClient<any>(`/salaries${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { cacheDelete('salaries:list'); return apiClient<any>('/salaries', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => apiClient<any>(`/salaries/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => { cacheDelete('salaries:list'); return apiClient<any>(`/salaries/${id}`, { method: 'DELETE', auth: true }); }
  },

  salaryPayments: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('salary-payments:list', params),
      () => apiClient<any>(`/salary-payments${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { cacheDelete('salary-payments:list'); return apiClient<any>('/salary-payments', { method: 'POST', auth: true, body: body(data) }); },
    delete: (id: string) => { cacheDelete('salary-payments:list'); return apiClient<any>(`/salary-payments/${id}`, { method: 'DELETE', auth: true }); }
  },

  providers: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('providers:list', params),
      () => apiClient<any>(`/providers${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { cacheDelete('providers:list'); return apiClient<any>('/providers', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => { cacheDelete('providers:list'); return apiClient<any>(`/providers/${id}`, { method: 'PATCH', auth: true, body: body(data) }); },
    delete: (id: string) => { cacheDelete('providers:list'); return apiClient<any>(`/providers/${id}`, { method: 'DELETE', auth: true }); },
    deleteDocument: (id: string, index: number) => { cacheDelete('providers:list'); return apiClient<any>(`/providers/${id}/document/${index}`, { method: 'DELETE', auth: true }); },
    getDocumentBlob: (id: string, index: number) => apiBlob(`/providers/${id}/document/${index}`, { auth: true }),
  },

  reports: {
    monthly: (month: string) => cachedApiCall(
      `reports:monthly:${month}`,
      () => apiClient<any>(`/reports/monthly-summary?month=${encodeURIComponent(month)}`, { auth: true })
    ),
    expensasPdf: (month: string) => apiBlob(`/reports/expensas-pdf?month=${encodeURIComponent(month)}`, { auth: true })
  },

  votes: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('votes:list', params),
      () => apiClient<any>(`/votes${qs(params)}`, { auth: true })
    ),
    create: (data: Payload) => { cacheDelete('votes:list'); return apiClient<any>('/votes', { method: 'POST', auth: true, body: body(data) }); },
    close: (id: string) => apiClient<any>(`/votes/${id}/close`, { method: 'PATCH', auth: true }),
    delete: (id: string) => { cacheDelete('votes:list'); return apiClient<any>(`/votes/${id}`, { method: 'DELETE', auth: true }); }
  },

  visits: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('visits:list', params),
      () => apiClient<any>(`/visits${qs(params)}`, { auth: true })
    ),
    status: (id: string, status: string) => {
      cacheDelete('visits:list');
      return apiClient<any>(`/visits/${id}/status`, { method: 'PATCH', auth: true, body: JSON.stringify({ status }) });
    },
    delete: (id: string) => { cacheDelete('visits:list'); return apiClient<any>(`/visits/${id}`, { method: 'DELETE', auth: true }); }
  },

  spaces: {
    list: () => cachedApiCall('spaces:list', () => apiClient<any>('/spaces', { auth: true })),
    create: (data: Payload) => { cacheDelete('spaces:list'); return apiClient<any>('/spaces', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => apiClient<any>(`/spaces/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => { cacheDelete('spaces:list'); return apiClient<any>(`/spaces/${id}`, { method: 'DELETE', auth: true }); }
  },

  reservations: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('reservations:list', params),
      () => apiClient<any>(`/reservations${qs(params)}`, { auth: true })
    ),
    status: (id: string, status: string) => {
      cacheDelete('reservations:list');
      return apiClient<any>(`/reservations/${id}/status`, { method: 'PATCH', auth: true, body: JSON.stringify({ status }) });
    },
    delete: (id: string) => { cacheDelete('reservations:list'); return apiClient<any>(`/reservations/${id}`, { method: 'DELETE', auth: true }); }
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
    )
  }
};

export const superAdminApi = {
  me: () => cachedApiCall('super-admin:me', () => apiClient<any>('/auth/me', { auth: true })),

  users: {
    updatePasswordByEmail: (data: { email: string; newPassword: string }) =>
      apiClient<any>('/super-admin/users/password', { method: 'PATCH', auth: true, body: JSON.stringify(data) })
  },

  support: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('support:list', params),
      () => apiClient<any>(`/support-tickets${qs(params)}`, { auth: true })
    ),
    update: (id: string, data: Payload) => apiClient<any>(`/support-tickets/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => { cacheDelete('support:list'); return apiClient<any>(`/support-tickets/${id}`, { method: 'DELETE', auth: true }); }
  },

  organizations: {
    list: () => cachedApiCall('organizations:list', () => apiClient<any>('/organizations', { auth: true })),
    create: (data: Payload) => { cacheDelete('organizations:list'); return apiClient<any>('/organizations', { method: 'POST', auth: true, body: body(data) }); },
    update: (id: string, data: Payload) => apiClient<any>(`/organizations/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => { cacheDelete('organizations:list'); return apiClient<any>(`/organizations/${id}`, { method: 'DELETE', auth: true }); },
    status: (id: string, data: Payload) =>
      apiClient<any>(`/super-admin/organizations/${id}/status`, { method: 'PATCH', auth: true, body: body(data) }),
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
