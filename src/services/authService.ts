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
    accessType?: 'admin' | 'owner';
    adminRole?: string | null;
    ownerId?: string | null;
  }>;
  data?: {
    token?: string;
    accessType?: 'admin' | 'owner' | 'super_admin';
    organizationId?: string;
    ownerId?: string | null;
    adminRole?: string | null;
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

export function isSuperAdminRole(role?: string) {
  return role === 'super_admin' || role === 'superadmin';
}
