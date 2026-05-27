import { useEffect, useState } from 'react';
import {
  Bell, Building2, CreditCard, FileText, HelpCircle, Home, LogOut,
  MessageSquare, Receipt, User, WalletCards
} from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { clearAuthToken, getAuthToken, goAdmin, goLogin } from '../../services/navigationService';
import type { SessionUser, Membership, FeatureFlags } from '../../types/api';
import { OwnerHomeSection } from './OwnerHomeSection';
import { OwnerAccountSection } from './OwnerAccountSection';
import { OwnerPaymentsSection } from './OwnerPaymentsSection';
import { OwnerHistorySection } from './OwnerHistorySection';
import { OwnerNoticesSection } from './OwnerNoticesSection';
import { OwnerDocumentsSection } from './OwnerDocumentsSection';
import { OwnerClaimsSection } from './OwnerClaimsSection';
import { OwnerProfileSection } from './OwnerProfileSection';
import { OwnerSupportTab } from './OwnerSupportTab';

type OwnerTab = 'inicio' | 'cuenta' | 'pagos' | 'historial' | 'avisos' | 'documentos' | 'reclamos' | 'soporte' | 'perfil';

const VALID_TABS: OwnerTab[] = ['inicio', 'cuenta', 'pagos', 'historial', 'avisos', 'documentos', 'reclamos', 'soporte', 'perfil'];

const getInitialTab = (): OwnerTab => {
  const hash = window.location.hash.replace('#', '') as OwnerTab;
  return VALID_TABS.includes(hash) ? hash : 'inicio';
};

function navigateToTab(key: OwnerTab) {
  window.location.hash = key;
}

const NAV: Array<{ key: OwnerTab; label: string; icon: React.ElementType; feature?: string }> = [
  { key: 'inicio', label: 'Inicio', icon: Home },
  { key: 'cuenta', label: 'Mi cuenta', icon: WalletCards },
  { key: 'pagos', label: 'Pagar expensas', icon: CreditCard },
  { key: 'historial', label: 'Historial de pagos', icon: Receipt },
  { key: 'avisos', label: 'Avisos', icon: Bell },
  { key: 'documentos', label: 'Documentos', icon: FileText, feature: 'documents' },
  { key: 'reclamos', label: 'Reclamos', icon: MessageSquare },
  { key: 'soporte', label: 'Soporte técnico', icon: HelpCircle },
  { key: 'perfil', label: 'Mi perfil', icon: User },
];

const TAB_LABELS: Record<OwnerTab, string> = {
  inicio: 'Inicio',
  cuenta: 'Mi cuenta',
  pagos: 'Pagar expensas',
  historial: 'Historial de pagos',
  avisos: 'Avisos',
  documentos: 'Documentos',
  reclamos: 'Reclamos',
  soporte: 'Soporte técnico',
  perfil: 'Mi perfil',
};

export function OwnerPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [features, setFeatures] = useState<FeatureFlags>({});
  const [tab, setTab] = useState<OwnerTab>(getInitialTab);

  // Sync tab from hash changes
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as OwnerTab;
      if (VALID_TABS.includes(hash)) setTab(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Auth guard
  useEffect(() => {
    if (!getAuthToken()) {
      goLogin();
      return;
    }
    adminApi.me()
      .then((response) => {
        const u = response?.data?.user;
        const m = response?.data?.membership;
        const access = response?.data?.accessType;

        // Redirect non-owner users
        if (access !== 'owner' && u?.role !== 'owner') {
          goAdmin();
          return;
        }

        setUser(u ?? null);
        setMembership(m ?? null);
        setAuthChecked(true);

        // Load feature flags
        const orgId = typeof m?.organization === 'string'
          ? m.organization
          : (m?.organization as any)?._id;
        if (orgId) {
          adminApi.organizations.features(orgId)
            .then((r) => setFeatures(r?.data?.features ?? {}))
            .catch(() => {});
        }
      })
      .catch(() => {
        clearAuthToken();
        goLogin();
      });
  }, []);

  const visibleNav = NAV.filter(item => !item.feature || features[item.feature] !== false);
  const ActiveIcon = visibleNav.find(n => n.key === tab)?.icon ?? Home;

  // If hidden tab is active, redirect to inicio
  useEffect(() => {
    if (!authChecked) return;
    if (!visibleNav.find(n => n.key === tab)) {
      navigateToTab('inicio');
    }
  }, [authChecked, tab, features]);

  function handleLogout() {
    clearAuthToken();
    goLogin();
  }

  if (!authChecked) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0e1512', color: '#9cf27b',
        fontFamily: 'Inter, sans-serif', fontSize: '14px'
      }}>
        Cargando…
      </div>
    );
  }

  const orgName = (typeof membership?.organization === 'string'
    ? null
    : (membership?.organization as any)?.name) ?? 'Mi organización';

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <Building2 size={22} color="var(--green)" />
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>GestionAr</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4, marginLeft: 31 }}>
            {orgName}
          </div>
        </div>

        <nav>
          {visibleNav.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={tab === key ? 'active' : ''}
              onClick={() => navigateToTab(key)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-foot">
          <div style={{ padding: '0 4px 8px', fontSize: 12, color: 'var(--text-faint)' }}>
            {user?.name && <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{user.name}</div>}
            {user?.email}
          </div>
          <button
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '10px 12px', border: 0, borderRadius: 10, background: 'transparent', color: 'var(--text-faint)', fontSize: 13, cursor: 'pointer' }}
            onClick={handleLogout}
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main workspace */}
      <main className="admin-workspace">
        <div className="admin-topbar">
          <div className="admin-topbar-crumbs">
            <ActiveIcon size={14} />
            <span className="sep">/</span>
            <span className="cur">{TAB_LABELS[tab]}</span>
          </div>
          <button className="admin-topbar-logout" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 0, color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13 }}>
            <LogOut size={14} /> Salir
          </button>
        </div>

        {tab === 'inicio' && <OwnerHomeSection user={user} membership={membership} features={features} />}
        {tab === 'cuenta' && <OwnerAccountSection />}
        {tab === 'pagos' && <OwnerPaymentsSection />}
        {tab === 'historial' && <OwnerHistorySection />}
        {tab === 'avisos' && <OwnerNoticesSection />}
        {tab === 'documentos' && <OwnerDocumentsSection />}
        {tab === 'reclamos' && <OwnerClaimsSection />}
        {tab === 'soporte' && <OwnerSupportTab />}
        {tab === 'perfil' && <OwnerProfileSection user={user} membership={membership} onUserUpdate={setUser} />}
      </main>
    </div>
  );
}
