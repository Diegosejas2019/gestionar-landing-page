import { create } from 'zustand';
import type { ApiList, ApiRecord, FeatureFlags, Membership, OrganizationConfig, SessionUser } from '../types/api';

interface OwnerStats {
  totalOwners?: number;
  upToDate?: number;
  debtors?: number;
  pendingPayments?: number;
  complianceRate?: number;
}

interface DashboardData {
  monthly?: Array<{ _id: string; total: number; count: number; pending: number; rejected: number }>;
  totalExpenses?: number;
  approved?: number;
  pending?: number;
}

interface Expense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  date: string;
  createdAt: string;
  [key: string]: unknown;
}

type AdminRows = ApiList<ApiRecord>;

interface AdminStore {
  // Auth
  me: SessionUser | null;
  membership: Membership | null;
  // Config & features
  config: OrganizationConfig;
  features: FeatureFlags;
  // Dashboard
  ownerStats: OwnerStats;
  dashboard: DashboardData;
  report: ApiRecord;
  // Data slices
  owners: AdminRows;
  units: AdminRows;
  payments: AdminRows;
  notices: AdminRows;
  claims: AdminRows;
  expenses: Expense[];
  employees: AdminRows;
  salaries: AdminRows;
  providers: AdminRows;
  votes: AdminRows;
  visits: AdminRows;
  spaces: AdminRows;
  reservations: AdminRows;
  orgDocuments: AdminRows;
  yearExpenses: Expense[];
  yearPayments: AdminRows;
  // Actions
  setMe: (me: SessionUser | null, membership: Membership | null) => void;
  setConfig: (config: OrganizationConfig) => void;
  setFeatures: (features: FeatureFlags) => void;
  setOwnerStats: (stats: OwnerStats) => void;
  setDashboard: (dashboard: DashboardData) => void;
  setReport: (report: ApiRecord) => void;
  setOwners: (owners: AdminRows) => void;
  setUnits: (units: AdminRows) => void;
  setPayments: (payments: AdminRows) => void;
  setNotices: (notices: AdminRows) => void;
  setClaims: (claims: AdminRows) => void;
  setExpenses: (expenses: Expense[]) => void;
  setEmployees: (employees: AdminRows) => void;
  setSalaries: (salaries: AdminRows) => void;
  setProviders: (providers: AdminRows) => void;
  setVotes: (votes: AdminRows) => void;
  setVisits: (visits: AdminRows) => void;
  setSpaces: (spaces: AdminRows) => void;
  setReservations: (reservations: AdminRows) => void;
  setOrgDocuments: (docs: AdminRows) => void;
  setYearExpenses: (expenses: Expense[]) => void;
  setYearPayments: (payments: AdminRows) => void;
  reset: () => void;
}

const defaultFeatures: Record<string, boolean> = {
  visits: false,
  reservations: false,
  votes: true,
  claims: true,
  notices: true,
  expenses: true,
  providers: true,
  documents: true
};

const initialState = {
  me: null,
  membership: null,
  config: {} as OrganizationConfig,
  features: defaultFeatures,
  ownerStats: {} as OwnerStats,
  dashboard: {} as DashboardData,
  report: {},
  owners: [],
  units: [],
  payments: [],
  notices: [],
  claims: [],
  expenses: [] as Expense[],
  employees: [],
  salaries: [],
  providers: [],
  votes: [],
  visits: [],
  spaces: [],
  reservations: [],
  orgDocuments: [],
  yearExpenses: [] as Expense[],
  yearPayments: []
};

export const useAdminStore = create<AdminStore>((set) => ({
  ...initialState,

  setMe: (me, membership) => set({ me, membership }),

  setConfig: (config) => set({ config }),

  setFeatures: (features) => set({ features }),

  setOwnerStats: (ownerStats) => set({ ownerStats }),

  setDashboard: (dashboard) => set({ dashboard }),

  setReport: (report) => set({ report }),

  setOwners: (owners) => set({ owners }),

  setUnits: (units) => set({ units }),

  setPayments: (payments) => set({ payments }),

  setNotices: (notices) => set({ notices }),

  setClaims: (claims) => set({ claims }),

  setExpenses: (expenses) => set({ expenses }),

  setEmployees: (employees) => set({ employees }),

  setSalaries: (salaries) => set({ salaries }),

  setProviders: (providers) => set({ providers }),

  setVotes: (votes) => set({ votes }),

  setVisits: (visits) => set({ visits }),

  setSpaces: (spaces) => set({ spaces }),

  setReservations: (reservations) => set({ reservations }),

  setOrgDocuments: (orgDocuments) => set({ orgDocuments }),

  setYearExpenses: (yearExpenses) => set({ yearExpenses }),

  setYearPayments: (yearPayments) => set({ yearPayments }),

  reset: () => set(initialState)
}));
