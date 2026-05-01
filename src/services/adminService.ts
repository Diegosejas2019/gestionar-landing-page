import { apiBlob, apiClient } from './apiClient';

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

export const adminApi = {
  me: () => apiClient<any>('/auth/me', { auth: true }),

  owners: {
    stats: () => apiClient<any>('/owners/stats', { auth: true }),
    list: (params?: Params) => apiClient<any>(`/owners${qs(params)}`, { auth: true }),
    create: (data: Payload) => apiClient<any>('/owners', { method: 'POST', auth: true, body: body(data) }),
    update: (id: string, data: Payload) => apiClient<any>(`/owners/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => apiClient<any>(`/owners/${id}`, { method: 'DELETE', auth: true })
  },

  units: {
    list: (params?: Params) => apiClient<any>(`/units${qs(params)}`, { auth: true }),
    create: (data: Payload) => apiClient<any>('/units', { method: 'POST', auth: true, body: body(data) }),
    update: (id: string, data: Payload) => apiClient<any>(`/units/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => apiClient<any>(`/units/${id}`, { method: 'DELETE', auth: true })
  },

  payments: {
    dashboard: (year: number) => apiClient<any>(`/payments/dashboard?year=${year}`, { auth: true }),
    list: (params?: Params) => apiClient<any>(`/payments${qs(params)}`, { auth: true }),
    approve: (id: string) => apiClient<any>(`/payments/${id}/approve`, { method: 'PATCH', auth: true }),
    reject: (id: string, rejectionNote: string) =>
      apiClient<any>(`/payments/${id}/reject`, { method: 'PATCH', auth: true, body: JSON.stringify({ rejectionNote }) }),
    delete: (id: string) => apiClient<any>(`/payments/${id}`, { method: 'DELETE', auth: true }),
    reminders: () => apiClient<any>('/payments/send-reminders', { method: 'POST', auth: true })
  },

  notices: {
    list: (params?: Params) => apiClient<any>(`/notices${qs(params)}`, { auth: true }),
    create: (data: Payload) => apiClient<any>('/notices', { method: 'POST', auth: true, body: body(data) }),
    update: (id: string, data: Payload) => apiClient<any>(`/notices/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => apiClient<any>(`/notices/${id}`, { method: 'DELETE', auth: true })
  },

  claims: {
    list: (params?: Params) => apiClient<any>(`/claims${qs(params)}`, { auth: true }),
    status: (id: string, status: string, adminNote?: string) =>
      apiClient<any>(`/claims/${id}/status`, { method: 'PATCH', auth: true, body: JSON.stringify({ status, adminNote }) }),
    delete: (id: string) => apiClient<any>(`/claims/${id}`, { method: 'DELETE', auth: true })
  },

  expenses: {
    list: (params?: Params) => apiClient<any>(`/expenses${qs(params)}`, { auth: true }),
    create: (data: Payload) => apiClient<any>('/expenses', { method: 'POST', auth: true, body: body(data) }),
    update: (id: string, data: Payload) => apiClient<any>(`/expenses/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    paid: (id: string) => apiClient<any>(`/expenses/${id}/paid`, { method: 'PATCH', auth: true, body: JSON.stringify({}) }),
    delete: (id: string) => apiClient<any>(`/expenses/${id}`, { method: 'DELETE', auth: true })
  },

  employees: {
    list: (params?: Params) => apiClient<any>(`/employees${qs(params)}`, { auth: true }),
    create: (data: Payload) => apiClient<any>('/employees', { method: 'POST', auth: true, body: body(data) }),
    update: (id: string, data: Payload) => apiClient<any>(`/employees/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => apiClient<any>(`/employees/${id}`, { method: 'DELETE', auth: true })
  },

  salaries: {
    list: (params?: Params) => apiClient<any>(`/salaries${qs(params)}`, { auth: true }),
    create: (data: Payload) => apiClient<any>('/salaries', { method: 'POST', auth: true, body: body(data) }),
    update: (id: string, data: Payload) => apiClient<any>(`/salaries/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => apiClient<any>(`/salaries/${id}`, { method: 'DELETE', auth: true })
  },

  providers: {
    list: (params?: Params) => apiClient<any>(`/providers${qs(params)}`, { auth: true }),
    create: (data: Payload) => apiClient<any>('/providers', { method: 'POST', auth: true, body: body(data) }),
    update: (id: string, data: Payload) => apiClient<any>(`/providers/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => apiClient<any>(`/providers/${id}`, { method: 'DELETE', auth: true })
  },

  reports: {
    monthly: (month: string) => apiClient<any>(`/reports/monthly-summary?month=${encodeURIComponent(month)}`, { auth: true }),
    expensasPdf: (month: string) => apiBlob(`/reports/expensas-pdf?month=${encodeURIComponent(month)}`, { auth: true })
  },

  votes: {
    list: (params?: Params) => apiClient<any>(`/votes${qs(params)}`, { auth: true }),
    create: (data: Payload) => apiClient<any>('/votes', { method: 'POST', auth: true, body: body(data) }),
    close: (id: string) => apiClient<any>(`/votes/${id}/close`, { method: 'PATCH', auth: true }),
    delete: (id: string) => apiClient<any>(`/votes/${id}`, { method: 'DELETE', auth: true })
  },

  visits: {
    list: (params?: Params) => apiClient<any>(`/visits${qs(params)}`, { auth: true }),
    status: (id: string, status: string) =>
      apiClient<any>(`/visits/${id}/status`, { method: 'PATCH', auth: true, body: JSON.stringify({ status }) }),
    delete: (id: string) => apiClient<any>(`/visits/${id}`, { method: 'DELETE', auth: true })
  },

  spaces: {
    list: () => apiClient<any>('/spaces', { auth: true }),
    create: (data: Payload) => apiClient<any>('/spaces', { method: 'POST', auth: true, body: body(data) }),
    update: (id: string, data: Payload) => apiClient<any>(`/spaces/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => apiClient<any>(`/spaces/${id}`, { method: 'DELETE', auth: true })
  },

  reservations: {
    list: (params?: Params) => apiClient<any>(`/reservations${qs(params)}`, { auth: true }),
    status: (id: string, status: string) =>
      apiClient<any>(`/reservations/${id}/status`, { method: 'PATCH', auth: true, body: JSON.stringify({ status }) }),
    delete: (id: string) => apiClient<any>(`/reservations/${id}`, { method: 'DELETE', auth: true })
  },

  config: {
    get: () => apiClient<any>('/config', { auth: true }),
    update: (data: Payload) => apiClient<any>('/config', { method: 'PATCH', auth: true, body: body(data) })
  },

  organizations: {
    features: (id: string) => apiClient<any>(`/organizations/${id}/features`, { auth: true })
  }
};

export const superAdminApi = {
  me: () => apiClient<any>('/auth/me', { auth: true }),

  support: {
    list: (params?: Params) => apiClient<any>(`/support-tickets${qs(params)}`, { auth: true }),
    update: (id: string, data: Payload) => apiClient<any>(`/support-tickets/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => apiClient<any>(`/support-tickets/${id}`, { method: 'DELETE', auth: true })
  },

  organizations: {
    list: () => apiClient<any>('/organizations', { auth: true }),
    create: (data: Payload) => apiClient<any>('/organizations', { method: 'POST', auth: true, body: body(data) }),
    update: (id: string, data: Payload) => apiClient<any>(`/organizations/${id}`, { method: 'PATCH', auth: true, body: body(data) }),
    delete: (id: string) => apiClient<any>(`/organizations/${id}`, { method: 'DELETE', auth: true }),
    status: (id: string, data: Payload) =>
      apiClient<any>(`/super-admin/organizations/${id}/status`, { method: 'PATCH', auth: true, body: body(data) }),
    members: (id: string, params?: Params) => apiClient<any>(`/organizations/${id}/members${qs(params)}`, { auth: true }),
    features: (id: string) => apiClient<any>(`/organizations/${id}/features`, { auth: true }),
    updateFeatures: (id: string, data: Payload) =>
      apiClient<any>(`/organizations/${id}/features`, { method: 'PUT', auth: true, body: body(data) })
  }
};
