import { useEffect, useState } from 'react';
import {
  Bell, Building2, CreditCard, FileText, HelpCircle, Home, LogOut,
  MessageSquare, Receipt, Smartphone, User, WalletCards, AlertCircle, RefreshCw
} from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { clearAuthToken, getAuthToken, goAdmin, goLogin, goOwnerApp, goSuperAdmin } from '../../services/navigationService';
import { isSuperAdminRole } from '../../services/authService';
import type { SessionUser, Membership, FeatureFlags, AvailableContext } from '../../types/api';
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
  const [mustChangePwd, setMustChangePwd] = useState(false);
  const [availableContexts, setAvailableContexts] = useState<AvailableContext[]>([]);

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
        const contexts: AvailableContext[] = response?.data?.availableContexts || [];

        // Redirect superadmin
        if (isSuperAdminRole(u?.role)) {
          goSuperAdmin();
          return;
        }

        // Redirect non-owner (admin)
        if (access !== 'owner' && u?.role !== 'owner') {
          goAdmin();
          return;
        }

        setUser(u ?? null);
        setMembership(m ?? null);
        setAvailableContexts(contexts);
        setMustChangePwd(!!(u as any)?.mustChangePassword);
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

  // If mustChangePassword is active and user navigates away from perfil, redirect back
  useEffect(() => {
    if (!authChecked || !mustChangePwd) return;
    if (tab !== 'perfil') {
      navigateToTab('perfil');
    }
  }, [authChecked, mustChangePwd, tab]);

  function handleLogout() {
    clearAuthToken();
    goLogin();
  }

  function handleGoToPwa() {
    const token = getAuthToken();
    if (token) goOwnerApp(token);
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

  const otherContexts = availableContexts.filter(c =>
    (c.membershipId || c.id) !== (membership?._id || membership?.id)
  );

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

          {/* PWA button */}
          <button
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', marginBottom: 6 }}
            onClick={handleGoToPwa}
            title="Ir a la app mobile"
          >
            <Smartphone size={14} />
            Ir a la app mobile
          </button>

          {/* Org switcher: re-login */}
          {otherContexts.length > 0 && (
            <button
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 10, background: 'transparent', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer', marginBottom: 6 }}
              onClick={() => { clearAuthToken(); goLogin(); }}
              title="Cambiar organización"
            >
              <RefreshCw size={14} />
              Cambiar organización
            </button>
          )}

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

        {/* mustChangePassword banner */}
        {mustChangePwd && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.4)', borderRadius: 10, marginBottom: 16, color: '#FCD34D', fontSize: 13 }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>
              <strong>Debés cambiar tu contraseña temporal</strong> antes de continuar.
              Completá el formulario en la sección <strong>Mi perfil</strong>.
            </span>
          </div>
        )}

        {tab === 'inicio' && <OwnerHomeSection user={user} membership={membership} features={features} />}
        {tab === 'cuenta' && <OwnerAccountSection />}
        {tab === 'pagos' && <OwnerPaymentsSection features={features} />}
        {tab === 'historial' && <OwnerHistorySection />}
        {tab === 'avisos' && <OwnerNoticesSection />}
        {tab === 'documentos' && <OwnerDocumentsSection />}
        {tab === 'reclamos' && <OwnerClaimsSection />}
        {tab === 'soporte' && <OwnerSupportTab />}
        {tab === 'perfil' && <OwnerProfileSection user={user} membership={membership} onUserUpdate={(u) => { setUser(u); setMustChangePwd(false); }} />}
      </main>
    </div>
  );
}
