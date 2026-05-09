import { create } from 'zustand';

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

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
}

interface Membership {
  _id: string;
  organization: string;
  role: string;
  balance?: number;
  debt?: number;
}

interface Config {
  orgId?: string;
  consortiumName?: string;
  monthlyFee?: number;
  dueDayOfMonth?: number;
  lateFeePercent?: number;
  lateFeeFixed?: number;
  bankAccount?: string;
  bankName?: string;
  [key: string]: unknown;
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

interface AdminStore {
  // Auth
  me: User | null;
  membership: Membership | null;
  // Config & features
  config: Config;
  features: Record<string, boolean>;
  // Dashboard
  ownerStats: OwnerStats;
  dashboard: DashboardData;
  report: Record<string, unknown>;
  // Data slices
  owners: Array<Record<string, unknown>>;
  units: Array<Record<string, unknown>>;
  payments: Array<Record<string, unknown>>;
  notices: Array<Record<string, unknown>>;
  claims: Array<Record<string, unknown>>;
  expenses: Expense[];
  employees: Array<Record<string, unknown>>;
  salaries: Array<Record<string, unknown>>;
  providers: Array<Record<string, unknown>>;
  votes: Array<Record<string, unknown>>;
  visits: Array<Record<string, unknown>>;
  spaces: Array<Record<string, unknown>>;
  reservations: Array<Record<string, unknown>>;
  orgDocuments: Array<Record<string, unknown>>;
  yearExpenses: Expense[];
  yearPayments: Array<Record<string, unknown>>;
  // Actions
  setMe: (me: User | null, membership: Membership | null) => void;
  setConfig: (config: Config) => void;
  setFeatures: (features: Record<string, boolean>) => void;
  setOwnerStats: (stats: OwnerStats) => void;
  setDashboard: (dashboard: DashboardData) => void;
  setReport: (report: Record<string, unknown>) => void;
  setOwners: (owners: Array<Record<string, unknown>>) => void;
  setUnits: (units: Array<Record<string, unknown>>) => void;
  setPayments: (payments: Array<Record<string, unknown>>) => void;
  setNotices: (notices: Array<Record<string, unknown>>) => void;
  setClaims: (claims: Array<Record<string, unknown>>) => void;
  setExpenses: (expenses: Expense[]) => void;
  setEmployees: (employees: Array<Record<string, unknown>>) => void;
  setSalaries: (salaries: Array<Record<string, unknown>>) => void;
  setProviders: (providers: Array<Record<string, unknown>>) => void;
  setVotes: (votes: Array<Record<string, unknown>>) => void;
  setVisits: (visits: Array<Record<string, unknown>>) => void;
  setSpaces: (spaces: Array<Record<string, unknown>>) => void;
  setReservations: (reservations: Array<Record<string, unknown>>) => void;
  setOrgDocuments: (docs: Array<Record<string, unknown>>) => void;
  setYearExpenses: (expenses: Expense[]) => void;
  setYearPayments: (payments: Array<Record<string, unknown>>) => void;
  reset: () => void;
}

const defaultFeatures: Record<string, boolean> = {
  visits: false,
  reservations: false,
  votes: true,
  claims: true,
  notices: true,
  expenses: true,
  providers: true
};

const initialState = {
  me: null,
  membership: null,
  config: {} as Config,
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