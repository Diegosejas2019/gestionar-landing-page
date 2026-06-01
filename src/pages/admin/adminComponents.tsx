import { memo, ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { paymentMethodLabels, statusText } from './adminFormat';

export const Metric = memo(function Metric({ loading, label, value, hint, icon: Icon, delta, row }: {
  loading?: boolean; label: string; value: string | number; hint?: string; icon: any; delta?: { text: string; trend: string }; row?: boolean
}) {
  if (row) {
    return (
      <div className={`metric-card metric-card-row ${loading ? 'skeleton' : ''}`}>
        <div className="metric-icon"><Icon size={16} /></div>
        <div className="metric-row-copy">
          <span className="metric-label" title={label}>{label}</span>
          {hint && !loading && <span className="metric-hint" title={hint}>{hint}</span>}
        </div>
        {loading ? <div className="skeleton-val" /> : <span className="metric-value">{value}</span>}
      </div>
    );
  }
  return (
    <div className={`metric-card ${loading ? 'skeleton' : ''}`}>
      <div className="metric-icon"><Icon size={18} /></div>
      <div className="metric-body">
        <div className="metric-label" title={label}>{label}</div>
        {loading ? <div className="skeleton-val" /> : <div className="metric-value">{value}</div>}
        {hint && !loading && <div className="metric-hint" title={hint}>{hint}</div>}
        {delta && !loading && <div className={`metric-delta ${delta.trend}`}>{delta.text}</div>}
      </div>
    </div>
  );
});

export const Status = memo(function Status({ value, label }: { value?: string; label?: string }) {
  const tone = (value === 'approved' || value === 'paid' || value === 'resolved' || value === 'exited' || value === 'active') ? 'pos'
    : (value === 'rejected' || value === 'cancelled' || value === 'overdue') ? 'neg'
    : (value === 'pending' || value === 'partially_paid' || value === 'open' || value === 'in_progress' || value === 'inside' || value === 'leave') ? 'warn'
    : (value === 'closed') ? 'muted'
    : '';
  return (
    <span className={`pill ${tone}`}>
      <span className="d" />
      {label || statusText[value || ''] || value || '-'}
    </span>
  );
});

export const Empty = memo(function Empty({ text = 'Sin datos para mostrar.' }: { text?: string }) {
  return (
    <div className="admin-empty">
      <Inbox size={20} />
      <span>{text}</span>
    </div>
  );
});

export const PaymentChannel = memo(function PaymentChannel({ payment }: { payment: any }) {
  const label = paymentMethodLabels[payment?.paymentMethod] || payment?.paymentMethod || '-';
  const isMpPending = payment?.paymentMethod === 'mercadopago' && payment?.mpStatus === 'approved' && payment?.status === 'pending';
  return (
    <span className={`channel-pill ${isMpPending ? 'mp-pending' : ''}`}>
      {label}{isMpPending ? ' acreditado' : ''}
    </span>
  );
});

export const Field = memo(function Field(props: { label: string; name?: string; type?: string; placeholder?: string; defaultValue?: unknown; value?: unknown; required?: boolean; onChange?: (event: any) => void }) {
  return (
    <label className="admin-field">
      <span>{props.label}</span>
      <input name={props.name} type={props.type || 'text'} placeholder={props.placeholder} defaultValue={props.value === undefined ? String(props.defaultValue ?? '') : undefined} value={props.value === undefined ? undefined : String(props.value ?? '')} required={props.required} onChange={props.onChange} />
    </label>
  );
});

export const SelectField = memo(function SelectField(props: { label: string; name: string; defaultValue?: unknown; children: ReactNode; onChange?: (event: any) => void }) {
  return (
    <label className="admin-field">
      <span>{props.label}</span>
      <select name={props.name} defaultValue={String(props.defaultValue ?? '')} onChange={props.onChange}>{props.children}</select>
    </label>
  );
});

export function Panel({ title, sub, action, children }: { title: string; sub?: string; icon: any; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      <div className="card-h">
        <div>
          <h3>{title}</h3>
          {sub && <div className="card-sub">{sub}</div>}
        </div>
        {action && <div style={{ flexShrink: 0 }}>{action}</div>}
      </div>
      <div className="card-body">
        {children}
      </div>
    </section>
  );
}

export function Actions({ children }: { children: ReactNode }) {
  return <div className="row-actions">{children}</div>;
}

export function BusyBanner() {
  return (
    <div className="admin-busy" role="status" aria-live="polite">
      <span className="action-spinner" />
      Ejecutando acción...
    </div>
  );
}
