import { apiBlob, apiClient } from './apiClient';
import { cacheDeletePrefix, cacheKey, cachedApiCall } from './cache';
import type { ApiEnvelope } from '../types/api';

type Params = Record<string, string | number | boolean | undefined | null>;

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

const invalidate = (prefix: string) => cacheDeletePrefix(prefix);

export const ownerApi = {
  summary: () => cachedApiCall(
    'owner:summary',
    () => apiClient<ApiEnvelope>('/owners/me/summary?paymentsLimit=50&noticesLimit=5', { auth: true })
  ),

  payments: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('owner:payments:list', params),
      () => apiClient<ApiEnvelope>(`/payments${qs(params)}`, { auth: true })
    ),
    availableItems: (params?: Params) =>
      apiClient<ApiEnvelope>(`/payments/available-items${qs(params)}`, { auth: true }),
    create: (data: FormData) => {
      invalidate('owner:payments:list');
      invalidate('owner:summary');
      return apiClient<ApiEnvelope>('/payments', { method: 'POST', auth: true, body: data });
    },
    receipt: (id: string) => apiBlob(`/payments/${id}/receipt`, { auth: true }),
    systemReceipt: (id: string) => apiBlob(`/payments/${id}/system-receipt?download=1`, { auth: true })
  },

  debtItems: {
    mine: () => cachedApiCall(
      'owner:debt-items',
      () => apiClient<ApiEnvelope>('/debt-items/mine', { auth: true })
    )
  },

  paymentPlans: {
    my: () => cachedApiCall(
      'owner:payment-plans',
      () => apiClient<ApiEnvelope>('/payment-plans/my', { auth: true })
    ),
    request: (data: Record<string, unknown>) => {
      invalidate('owner:payment-plans');
      return apiClient<ApiEnvelope>('/payment-plans/request', { method: 'POST', auth: true, body: JSON.stringify(data) });
    },
    payInstallment: (installmentId: string, data: FormData) => {
      invalidate('owner:payment-plans');
      invalidate('owner:payments:list');
      return apiClient<ApiEnvelope>(`/payment-plans/installments/${installmentId}/pay`, { method: 'POST', auth: true, body: data });
    }
  },

  notices: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('owner:notices:list', params),
      () => apiClient<ApiEnvelope>(`/notices${qs(params)}`, { auth: true })
    ),
    markRead: (id: string) => {
      invalidate('owner:notices:list');
      return apiClient<ApiEnvelope>(`/notices/${id}/read`, { method: 'PATCH', auth: true });
    },
    markUnread: (id: string) => {
      invalidate('owner:notices:list');
      return apiClient<ApiEnvelope>(`/notices/${id}/unread`, { method: 'PATCH', auth: true });
    },
    attachment: (id: string, index: number) => apiBlob(`/notices/${id}/attachment/${index}`, { auth: true })
  },

  claims: {
    list: (params?: Params) => cachedApiCall(
      cacheKey('owner:claims:list', params),
      () => apiClient<ApiEnvelope>(`/claims${qs(params)}`, { auth: true })
    ),
    create: (data: FormData) => {
      invalidate('owner:claims:list');
      return apiClient<ApiEnvelope>('/claims', { method: 'POST', auth: true, body: data });
    },
    attachment: (id: string, index: number) => apiBlob(`/claims/${id}/attachment/${index}`, { auth: true })
  },

  documents: {
    list: () => cachedApiCall(
      'owner:documents:list',
      () => apiClient<ApiEnvelope>('/organization-documents', { auth: true })
    ),
    download: (id: string) => apiBlob(`/organization-documents/${id}/download`, { auth: true })
  },

  profile: {
    updatePassword: (data: { currentPassword: string; newPassword: string }) =>
      apiClient<ApiEnvelope>('/auth/update-password', { method: 'PATCH', auth: true, body: JSON.stringify(data) }),
    update: (ownerId: string, data: Record<string, unknown>) =>
      apiClient<ApiEnvelope>(`/owners/${ownerId}`, { method: 'PATCH', auth: true, body: JSON.stringify(data) })
  },

  supportTickets: {
    list: () => cachedApiCall(
      'owner:support-tickets',
      () => apiClient<ApiEnvelope>('/support-tickets/my', { auth: true })
    ),
    create: (data: Record<string, unknown>) => {
      invalidate('owner:support-tickets');
      return apiClient<ApiEnvelope>('/support-tickets', { method: 'POST', auth: true, body: JSON.stringify(data) });
    }
  }
};
