import { FileText, MessageSquare, RefreshCw, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../../services/adminService';
import { Metric, Empty } from '../adminComponents';
import { ClaimKanban } from '../adminWidgets';

export function AdminClaimsSection({ ctx }: { ctx: any }) {
  const { claims, config, loading, run, refresh, tab, claimsEnabled } = ctx;
  return (
    <>
      <div className="admin-page-head">
        <div>
          <div className="admin-page-kicker"><span className="dot" />Comunidad</div>
          <h1 className="admin-page-title">Reclamos</h1>
          <div className="admin-page-sub">
            {(claims || []).filter((c: any) => c.status === 'open').length} abiertos · {(claims || []).filter((c: any) => c.status === 'in_progress').length} en progreso · {config?.consortiumName || 'Tu organización'}
          </div>
        </div>
        <div className="admin-page-actions">
          <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
        </div>
      </div>
      <div className="metric-grid">
        <Metric row loading={loading} label="Abiertos" value={(claims || []).filter((c: any) => c.status === 'open').length} hint="Sin asignar" icon={MessageSquare}
          delta={(claims || []).filter((c: any) => c.status === 'open').length > 0 ? { text: 'Requieren atención', trend: 'neg' } : undefined} />
        <Metric row loading={loading} label="En progreso" value={(claims || []).filter((c: any) => c.status === 'in_progress').length} hint="En gestión" icon={RefreshCw} />
        <Metric row loading={loading} label="Resueltos" value={(claims || []).filter((c: any) => c.status === 'resolved').length} hint="Cerrados" icon={ShieldCheck}
          delta={(claims || []).filter((c: any) => c.status === 'resolved').length > 0 ? { text: 'Resueltos', trend: 'pos' } : undefined} />
        <Metric row loading={loading} label="Total" value={(claims || []).length} hint="Histórico" icon={FileText} />
      </div>
      {claimsEnabled ? (
        <ClaimKanban
          claims={claims || []}
          loading={loading}
          onInProgress={(id: string) => run(id, () => adminApi.claims.status(id, 'in_progress'), 'Reclamo en progreso.')}
          onResolve={(id: string) => run(id, () => adminApi.claims.status(id, 'resolved', window.prompt('Nota para el propietario') || ''), 'Reclamo resuelto.')}
          onDelete={(id: string) => run(id, () => adminApi.claims.delete(id), 'Reclamo eliminado.')}
        />
      ) : <Empty text="El módulo de reclamos no está habilitado para esta organización." />}
    </>
  );
}
