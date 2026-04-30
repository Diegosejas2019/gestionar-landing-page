import { apiClient } from './apiClient';

export type LoginResponse = {
  success: boolean;
  token?: string;
  requiresOrganizationSelection?: boolean;
  selectionToken?: string;
  organizations?: Array<{
    id?: string;
    name?: string;
    membershipId?: string;
    organizationId?: string;
    organizationName?: string;
    role?: string;
  }>;
  data?: {
    token?: string;
    user?: {
      name: string;
      email: string;
      role: string;
    };
  };
};

export function login(email: string, password: string) {
  return apiClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function selectOrganization(membershipId: string, selectionToken: string) {
  return apiClient<LoginResponse>('/auth/select-organization', {
    method: 'POST',
    headers: { Authorization: `Bearer ${selectionToken}` },
    body: JSON.stringify({ membershipId })
  });
}
