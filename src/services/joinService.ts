import { apiClient } from './apiClient';

export type JoinOrganizationInfo = {
  organizationName: string;
  businessType?: string;
  memberLabel?: string;
  unitLabel?: string;
};

export type JoinRequestPayload = {
  name: string;
  email: string;
  phone?: string;
  requestedUnitLabel?: string;
  message?: string;
};

export function getJoinOrganization(code: string) {
  return apiClient<{ success: boolean; data: JoinOrganizationInfo }>(`/join/${encodeURIComponent(code)}`);
}

export function submitJoinRequest(code: string, payload: JoinRequestPayload) {
  return apiClient<{ success: boolean; message: string }>(`/join/${encodeURIComponent(code)}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
