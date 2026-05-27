export type ApiEnvelope<T = any> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type ApiRecord = Record<string, any> & {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiList<T = ApiRecord> = T[];

export type AccessType = 'admin' | 'owner' | 'super_admin';

export type SessionUser = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  organization?: string | { _id?: string; id?: string; name?: string };
};

export type Membership = {
  _id?: string;
  id?: string;
  organization: string | { _id?: string; id?: string; name?: string };
  role: string;
  balance?: number;
  debt?: number;
};

export type AvailableContext = {
  membershipId?: string;
  id?: string;
  organizationId?: string;
  organizationName?: string;
  name?: string;
  role?: string;
  accessType?: string;
};

export type AuthMeData = {
  user?: SessionUser;
  membership?: Membership;
  accessType?: AccessType;
  availableContexts?: AvailableContext[];
};

export type OrganizationConfig = {
  orgId?: string;
  consortiumName?: string;
  consortiumAddress?: string;
  monthlyFee?: number;
  expenseAmount?: number;
  dueDayOfMonth?: number;
  lateFeePercent?: number;
  lateFeeFixed?: number;
  bankAccount?: string;
  bankName?: string;
  [key: string]: unknown;
};

export type FeatureFlags = Record<string, boolean>;

export type AdminPermissionsData = {
  role?: string | null;
  permissions?: string[];
  roles?: Array<{ role: string; label?: string; permissions?: string[] }>;
};
