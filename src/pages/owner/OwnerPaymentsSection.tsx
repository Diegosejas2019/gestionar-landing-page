import { FormEvent, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CreditCard, Download, Paperclip, Upload, X } from 'lucide-react';
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
  const [invoice, setInvoice] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
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

  useEffect(() => {
    if (!selectedPeriod) { setInvoice(null); return; }
    setInvoiceLoading(true);
    setInvoice(null);
    ownerApi.invoice(selectedPeriod)
      .then(res => setInvoice((res as any)?.data ?? null))
      .catch(() => setInvoice(null))
      .finally(() => setInvoiceLoading(false));
  }, [selectedPeriod]);

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

              {/* Invoice detail */}
              {invoiceLoading && (
                <div className="skeleton-box" style={{ height: 80, borderRadius: 8 }} />
              )}

              {!invoiceLoading && invoice && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'grid', gap: 8 }}>
                  {/* Monthly fee summary */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <CreditCard size={14} color="var(--green)" />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Cuota {invoice.periodLabel}</span>
                    </div>
                    <strong style={{ fontSize: 14 }}>{money(invoice.totals.expected)}</strong>
                  </div>

                  {/* Unit breakdown (only if >1 unit) */}
                  {invoice.monthlyItems?.length > 1 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      {invoice.monthlyItems.map((u: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: 'var(--text-dim)' }}>
                          <span>{u.unitName}</span>
                          <span>{money(u.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Extraordinary items */}
                  {invoice.extraordinaryItems?.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>Extraordinarios</div>
                      {invoice.extraordinaryItems.map((e: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                          <span>{e.expense?.description || 'Gasto extraordinario'}</span>
                          <span>{money(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pending debt items */}
                  {invoice.debtItems?.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>Deudas pendientes</div>
                      {invoice.debtItems.map((d: any, i: number) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: 'var(--neg)' }}>
                          <span>{d.description || 'Ajuste'}</span>
                          <span>+{money(d.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {invoice.warnings?.filter((w: any) => w.severity !== 'info')?.map((w: any, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', fontSize: 12, color: 'var(--warn)', paddingTop: 4 }}>
                      <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{w.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {!invoiceLoading && !invoice && selectedInfo?.amount && (
                <div className="list-item">
                  <CreditCard size={16} color="var(--green)" />
                  <span style={{ fontSize: 14 }}>Importe del período: <strong>{money(selectedInfo.amount)}</strong></span>
                </div>
              )}

              {/* Download invoice PDF */}
              {selectedPeriod && (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 13 }}
                  disabled={pdfLoading}
                  onClick={async () => {
                    setPdfLoading(true);
                    try {
                      const blob = await ownerApi.downloadInvoicePdf(selectedPeriod);
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `liquidacion_${selectedPeriod}.pdf`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo descargar la liquidación.' });
                    } finally {
                      setPdfLoading(false);
                    }
                  }}
                >
                  <Download size={14} />
                  {pdfLoading ? 'Generando PDF…' : 'Descargar liquidación'}
                </button>
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
