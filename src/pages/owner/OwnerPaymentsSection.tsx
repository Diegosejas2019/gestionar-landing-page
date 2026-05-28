import { FormEvent, useEffect, useRef, useState } from 'react';
import { CreditCard, Paperclip, Upload, X } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import { money } from '../admin/adminFormat';
import { Empty } from '../admin/adminComponents';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function formatPeriod(ym: string): string {
  if (!ym) return ym;
  const [year, month] = ym.split('-');
  return `${MESES[parseInt(month, 10) - 1] || month} ${year}`;
}

type Period = { period: string; label: string; amount?: number; units?: Array<{id: string; name: string; amount: number}> };

export function OwnerPaymentsSection() {
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([ownerApi.payments.availableItems(), ownerApi.summary()])
      .then(([availRes, summaryRes]) => {
        const summaryData = summaryRes?.data ?? summaryRes;
        setConfig(summaryData?.config ?? null);
        const periodItems = availRes?.data?.periodItems || [];
        const items: Period[] = periodItems.map((p: any) => ({
          period: p.month,
          label: formatPeriod(p.month),
          amount: p.amount,
          units: p.units || [],
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
            <>
            {config?.dueDayOfMonth && (
              <div className="admin-notice" style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-dim)' }}>
                Vence el día {config.dueDayOfMonth} de cada mes.
              </div>
            )}
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
                <div className="list-item">
                  <CreditCard size={16} color="var(--green)" />
                  <span style={{ fontSize: 14 }}>Importe del período: <strong>{money(selectedInfo.amount)}</strong></span>
                </div>
              )}

              {(selectedInfo?.units?.length ?? 0) > 1 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>Detalle por unidad</div>
                  {selectedInfo!.units!.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                      <span>{u.name}</span>
                      <strong>{money(u.amount)}</strong>
                    </div>
                  ))}
                </div>
              )}

              {/* File upload */}
              <label className="admin-field">
                <span>Comprobante de pago</span>
                <div className="attach-zone" onClick={() => fileRef.current?.click()}>
                  {file ? (
                    <>
                      <Paperclip size={15} color="var(--acc-1)" />
                      <span className="attach-zone-text">{file.name}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                        className="attach-chip-remove"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload size={15} color="var(--ink-3)" />
                      <span>Hacer clic para seleccionar archivo (PDF, JPG, PNG)</span>
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
            </>
          )}
        </div>
      </section>
    </div>
  );
}
