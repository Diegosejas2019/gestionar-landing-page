import { FormEvent, useEffect, useRef, useState } from 'react';
import { CreditCard, Paperclip, Upload, X } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import { money } from '../admin/adminFormat';
import { Empty } from '../admin/adminComponents';

type Period = { period: string; label: string; amount?: number };

export function OwnerPaymentsSection() {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ownerApi.payments.availableItems()
      .then((r) => {
        const items: Period[] = (r?.data?.periods || []).map((p: any) => ({
          period: p.period || p.value || p,
          label: p.label || p.period || p,
          amount: p.amount,
        }));
        setPeriods(items);
        if (items.length > 0) setSelectedPeriod(items[0].period);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar períodos.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedPeriod || !file) {
      setNotice({ type: 'error', text: 'Seleccioná un período y adjuntá el comprobante.' });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.append('period', selectedPeriod);
      fd.append('receipt', file);
      await ownerApi.payments.create(fd);
      setNotice({ type: 'ok', text: 'Comprobante enviado. Queda pendiente de aprobación por el administrador.' });
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo enviar el comprobante.' });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedInfo = periods.find(p => p.period === selectedPeriod);

  return (
    <div>
      <div className="admin-page-head">
        <div><h1 className="admin-page-title">Pagar expensas</h1></div>
      </div>

      {error && <div className="admin-notice error" style={{ marginBottom: 16 }}>{error}</div>}

      <section className="card" style={{ maxWidth: 540 }}>
        <div className="card-h">
          <div>
            <h3>Subir comprobante de pago</h3>
            <div className="card-sub">Adjuntá tu comprobante de transferencia o depósito</div>
          </div>
        </div>
        <div className="card-body">
          {notice && (
            <div className={`admin-notice ${notice.type}`} style={{ marginBottom: 16 }}>{notice.text}</div>
          )}

          {loading ? (
            <div className="skeleton-box" style={{ height: 200, borderRadius: 10 }} />
          ) : periods.length === 0 ? (
            <Empty text="No hay períodos disponibles para pagar en este momento." />
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              {/* Period selector */}
              <label className="admin-field">
                <span>Período a pagar</span>
                <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
                  {periods.map(p => (
                    <option key={p.period} value={p.period}>
                      {p.label}{p.amount ? ` — ${money(p.amount)}` : ''}
                    </option>
                  ))}
                </select>
              </label>

              {selectedInfo?.amount && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <CreditCard size={16} color="var(--green)" />
                  <span style={{ fontSize: 14 }}>Importe del período: <strong>{money(selectedInfo.amount)}</strong></span>
                </div>
              )}

              {/* File upload */}
              <label className="admin-field">
                <span>Comprobante de pago</span>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px dashed var(--border)', borderRadius: 10, cursor: 'pointer', background: 'var(--bg)' }}
                  onClick={() => fileRef.current?.click()}
                >
                  {file ? (
                    <>
                      <Paperclip size={15} color="var(--green)" />
                      <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                        style={{ border: 0, background: 'transparent', color: 'var(--text-faint)', cursor: 'pointer', padding: 2 }}
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload size={15} color="var(--text-faint)" />
                      <span style={{ fontSize: 13, color: 'var(--text-faint)' }}>Hacer clic para seleccionar archivo (PDF, JPG, PNG)</span>
                    </>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={e => setFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <button
                type="submit"
                disabled={submitting || !file || !selectedPeriod}
                className="btn-primary"
                style={{ width: '100%' }}
              >
                {submitting ? 'Enviando…' : 'Enviar comprobante'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
