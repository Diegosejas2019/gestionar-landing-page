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

export type PaymentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentType = 'monthly' | 'extraordinary' | 'balance' | 'installment';

export type PaymentRecord = ApiRecord & {
  organization?: string;
  owner?: string | ApiRecord;
  membership?: string;
  month?: string;
  amount: number;
  status: PaymentStatus;
  type?: PaymentType;
  receipt?: {
    url?: string;
    filename?: string;
    mimetype?: string;
    size?: number;
  };
  systemReceipt?: {
    url?: string;
    publicId?: string;
  };
  receiptNumber?: string;
  receiptIssuedAt?: string;
};

export type OwnerRecord = ApiRecord & {
  organization?: string;
  membershipId?: string;
  units?: ApiRecord[];
  unitNames?: string[];
  balance?: number;
  balanceOwed?: number;
  totalOwed?: number;
  isDebtor?: boolean;
};

export type OrganizationDocumentRecord = ApiRecord & {
  organization?: string;
  title?: string;
  category?: string;
  visibility?: 'admin' | 'owners';
  fileType?: string;
  fileName?: string;
  size?: number;
};

export type ClaimRecord = ApiRecord & {
  organization?: string;
  owner?: string | ApiRecord;
  category?: string;
  description?: string;
  status?: 'open' | 'in_progress' | 'resolved';
};
