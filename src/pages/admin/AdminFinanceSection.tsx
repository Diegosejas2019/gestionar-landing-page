import { AlertTriangle, Bell, CheckCircle2, ChevronDown, CreditCard, Download, FileText, Landmark, Search, ShieldCheck, TrendingUp, X } from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { Table } from '../../components/Table';
import { Actions, Empty, Field, Metric, Panel, PaymentChannel, SelectField, Status } from './adminComponents';
import { CobroStrip, ExpenseBreakdown, PeriodTable, PeriodTabs, YearMonth } from './adminWidgets';
import { adminInitials, dateLabel, filteredMonthlyByPeriod, fmtK, idOf, money, pick, person } from './adminFormat';

type AdminFinanceSectionProps = { ctx: any };

export function AdminFinanceSection({ ctx }: AdminFinanceSectionProps) {
  const {
    config, year, setYear, month, setMonth, busy, downloadReport, exportDashboardCSV,
    dashboard, yearPayments, run, totalIncome, ownerStats, payments, finSubTab, dashPeriod, setDashPeriod,
    setFinSubTab, expenses, unidentifiedPaymentsSummary, fetchUnidentifiedPayments,
    loading, units, statusFilter, monthFilter, downloadPaymentReceipt, resendPaymentReceipt,
    loadRenditionPreview, generateRenditionPdf, exportRenditionCsv, renditionPreview,
    renditionHistory, categoryFilter, submitExpense, unidentifiedPaymentsLoading,
    unidentifiedPaymentsFilters, setUnidentifiedPaymentsFilters, unidentifiedPayments,
    openUnidentifiedDetail, openUnidentifiedAssociate, handleUnidentifiedReject,
    handleUnidentifiedArchive, showUnidentifiedDetailModal, selectedUnidentified,
    setShowUnidentifiedDetailModal, setSelectedUnidentified, showUnidentifiedAssociateModal,
    setShowUnidentifiedAssociateModal, owners, yearExpenses, AssociateUnidentifiedModal
  } = ctx;

  return (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Finanzas</div>
                <h1 className="admin-page-title">Pagos y gastos</h1>
                <div className="admin-page-sub">Cobranza de expensas, egresos y conciliación · {config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <YearMonth year={year} setYear={setYear} month={month} setMonth={setMonth} />
                <button className="btn btn-ghost" onClick={downloadReport} disabled={busy === 'pdf'}><FileText size={14} />PDF expensas</button>
                <button className="btn btn-ghost" onClick={() => exportDashboardCSV(dashboard?.monthly || [], yearPayments, year)}><TrendingUp size={14} />Exportar CSV</button>
                <button className="btn btn-primary" onClick={() => run('reminders', adminApi.payments.reminders, 'Recordatorios enviados.')}><Bell size={14} />Recordatorios</button>
              </div>
            </div>

            <div className="metric-grid finance-metric-grid">
              {(() => {
                const bal = totalIncome - (dashboard?.totalExpenses || 0);
                return <Metric row loading={loading} label={`Balance ${year}`} value={money(bal)} hint="Ingresos − egresos anuales" icon={Landmark}
                  delta={{ text: bal >= 0 ? '↑ ingresos superan gastos' : '↓ gastos superan ingresos', trend: bal >= 0 ? 'pos' : 'neg' }} />;
              })()}
              <Metric row loading={loading} label="Ingresos" value={money(totalIncome)} hint={`Recaudado ${year}`} icon={CreditCard}
                delta={payments?.filter((p: any) => p.status === 'approved').length > 0 ? { text: `${payments.filter((p: any) => p.status === 'approved').length} pagos aprobados`, trend: 'pos' } : undefined} />
              <Metric row loading={loading} label="Egresos" value={money(dashboard?.totalExpenses || 0)} hint={`Gastos ${year}`} icon={FileText} />
              <Metric row loading={loading} label="Cumplimiento" value={`${ownerStats?.complianceRate || 0}%`} hint={`${ownerStats?.upToDate || 0} de ${ownerStats?.totalOwners || 0} propietarios`} icon={ShieldCheck}
                delta={(ownerStats?.complianceRate ?? 0) >= 80 ? { text: 'Buen nivel de pago', trend: 'pos' } : { text: 'Requiere atención', trend: 'neg' }} />
              <Metric row loading={loading} label="Morosos" value={ownerStats?.debtors || 0} hint={`${ownerStats?.pendingPayments || 0} pagos pendientes`} icon={Bell}
                delta={(ownerStats?.debtors || 0) === 0 ? { text: 'Sin morosos', trend: 'pos' } : { text: `${ownerStats.debtors} con deuda`, trend: 'neg' }} />
            </div>

            {/* Sub-tab bar */}
            <div className="fin-tabs-bar">
              <div className="fin-tabs">
                <button className={`fin-tab${finSubTab === 'cobranza' ? ' is-active' : ''}`} onClick={() => setFinSubTab('cobranza')}>
                  Cobranza <span className="fin-tab-count">{payments?.length || 0}</span>
                </button>
                <button className={`fin-tab${finSubTab === 'egresos' ? ' is-active' : ''}`} onClick={() => setFinSubTab('egresos')}>
                  Egresos <span className="fin-tab-count">{expenses?.length || 0}</span>
                </button>
                <button className={`fin-tab${finSubTab === 'noIdentificados' ? ' is-active' : ''}`} onClick={() => { setFinSubTab('noIdentificados'); fetchUnidentifiedPayments(); }}>
                  No Identificados <span className="fin-tab-count">{unidentifiedPaymentsSummary?.pendingCount || 0}</span>
                </button>
              </div>
              {finSubTab === 'cobranza' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <span className="chip is-active">{month} <ChevronDown size={12} /></span>
                  <span className="chip">Estado <ChevronDown size={12} /></span>
                </div>
              )}
            </div>

            {finSubTab === 'cobranza' && (
              <>
                <PeriodTabs value={dashPeriod} onChange={setDashPeriod} />
                <CobroStrip payments={payments} loading={loading} />
                <div className="admin-panel">
                  <div className="panel-head"><h2><CreditCard size={14} />Pagos</h2></div>
                  <Table loading={loading} searchPlaceholder="Buscar propietario, unidad o comprobante" filters={[
                    statusFilter(['pending', 'approved', 'rejected']),
                    monthFilter((p: any) => p.month || String(p.createdAt || '').slice(0, 7), month)
                  ]} rows={payments} columns={[
                    ['Unidad', (p: any) => {
                      const ownerId = idOf(p.owner);
                      const ownerUnits = (units || []).filter((u: any) => {
                        const uid = typeof u.owner === 'string' ? u.owner : idOf(u.owner);
                        return ownerId && uid === ownerId;
                      });
                      const names = ownerUnits.map((u: any) => u.name).filter(Boolean);
                      return <span className="fin-lote">{names.join(', ') || '—'}</span>;
                    }],
                    ['Propietario', (p: any) => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="owner-avatar sm">{adminInitials(person(p))}</div>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-bright)' }}>{person(p)}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.owner?.email || ''}</div>
                        </div>
                      </div>
                    )],
                    ['Período', (p: any) => <span className="fin-mono">{p.month || dateLabel(p.createdAt)}</span>],
                    ['Estado', (p: any) => <Status value={p.status} />],
                    ['Canal', (p: any) => <PaymentChannel payment={p} />],
                    ['Monto', (p: any) => <span className="fin-mono fin-strong">{money(p.amount)}</span>],
                    ['Acciones', (p: any) => <Actions>
                      {p.status === 'pending' && <button onClick={() => run(idOf(p), () => adminApi.payments.approve(idOf(p)), 'Pago aprobado.')}>Aprobar</button>}
                      {p.status === 'pending' && <button onClick={() => run(idOf(p), () => adminApi.payments.reject(idOf(p), window.prompt('Motivo de rechazo') || 'Rechazado'), 'Pago rechazado.')}>Rechazar</button>}
                      {(p.receipt?.url || p.hasReceipt) && <button onClick={() => downloadPaymentReceipt(p, 'uploaded')}>Comprobante</button>}
                      {p.status === 'approved' && <button onClick={() => downloadPaymentReceipt(p, 'system')}>Recibo</button>}
                      {p.status === 'approved' && <button onClick={() => resendPaymentReceipt(p)}>Reenviar</button>}
                    </Actions>]
                  ]} />
                </div>
                <PeriodTable
                  monthly={filteredMonthlyByPeriod(dashboard?.monthly || [], dashPeriod)}
                  loading={loading}
                />
                <div className="admin-panel">
                  <div className="panel-head">
                    <h2><FileText size={14} />Liquidación mensual</h2>
                    <span>{month}</span>
                  </div>
                  <div className="admin-page-actions" style={{ justifyContent: 'flex-start', marginBottom: 12 }}>
                    <button className="btn btn-ghost" onClick={loadRenditionPreview}>Vista previa</button>
                    <button className="btn btn-primary" onClick={generateRenditionPdf}>Generar PDF</button>
                    <button className="btn btn-ghost" onClick={() => exportRenditionCsv('resumen')}>CSV resumen</button>
                    <button className="btn btn-ghost" onClick={() => exportRenditionCsv('gastos')}>CSV gastos</button>
                    <button className="btn btn-ghost" onClick={() => exportRenditionCsv('pagos')}>CSV pagos</button>
                    <button className="btn btn-ghost" onClick={() => exportRenditionCsv('morosidad')}>CSV morosidad</button>
                  </div>
                  {renditionPreview ? (
                    <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                      <Metric row label="Ingresos" value={money(renditionPreview.totalIncome || renditionPreview.income || 0)} hint="Período" icon={CreditCard} />
                      <Metric row label="Gastos" value={money(renditionPreview.totalExpenses || renditionPreview.expenses || 0)} hint="Período" icon={FileText} />
                      <Metric row label="Saldo" value={money(renditionPreview.balance || 0)} hint="Resultado" icon={Landmark} />
                      <Metric row label="Morosidad" value={money(renditionPreview.totalDebt || 0)} hint="A cobrar" icon={AlertTriangle} />
                    </div>
                  ) : <Empty text="Usá Vista previa para consultar la rendición del período." />}
                  {renditionHistory.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Table loading={false} searchPlaceholder="Buscar rendición" rows={renditionHistory.slice(0, 8)} columns={[
                        ['Período', (r: any) => r.period || r.month || '-'],
                        ['Estado', (r: any) => <Status value={r.status || 'closed'} />],
                        ['Generada', (r: any) => dateLabel(r.generatedAt || r.createdAt)],
                        ['Observaciones', (r: any) => r.observations || '-']
                      ]} />
                    </div>
                  )}
                </div>

              </>
            )}

            {finSubTab === 'egresos' && (
              <div className="com-layout">
                <div className="com-main">
                  <ExpenseBreakdown yearExpenses={yearExpenses} loading={loading} />
                  <div className="admin-panel">
                    <Table loading={loading} searchPlaceholder="Buscar descripción, categoría o proveedor" filters={[
                      statusFilter(['paid', 'pending']),
                      categoryFilter()
                    ]} rows={expenses} columns={[
                      ['Descripción', (e: any) => <span style={{ fontWeight: 500, color: 'var(--text-bright)', fontSize: 13 }}>{e.description}</span>],
                      ['Categoría', (e: any) => {
                        const catLabels: Record<string, string> = { cleaning: 'Limpieza', security: 'Seguridad', maintenance: 'Mantenimiento', utilities: 'Servicios', administration: 'Administración', other: 'Otros' };
                        return <span className="fin-cat">{catLabels[e.category] || e.category}</span>;
                      }],
                      ['Fecha', (e: any) => <span className="fin-mono">{dateLabel(e.date)}</span>],
                      ['Monto', (e: any) => <span className="fin-mono fin-strong">{money(e.amount)}</span>],
                      ['Estado', (e: any) => <Status value={e.status} />],
                      ['Acciones', (e: any) => e.status === 'pending' ? <Actions>
                        <button onClick={() => run(idOf(e), () => adminApi.expenses.paid(idOf(e)), 'Gasto marcado como pagado.')}>Pagar</button>
                        <button onClick={() => run(idOf(e), () => adminApi.expenses.delete(idOf(e)), 'Gasto eliminado.')}>Eliminar</button>
                      </Actions> : null]
                    ]} />
                  </div>
                </div>
                <div className="com-side">
                  <Panel title="Registrar gasto" icon={FileText}>
                    <form className="admin-form" onSubmit={submitExpense}>
                      <Field label="Descripcion" name="description" required />
                      <Field label="Monto" name="amount" type="number" required />
                      <Field label="Fecha" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                      <SelectField label="Categoria" name="category" defaultValue="maintenance">
                        <option value="cleaning">Limpieza</option><option value="security">Seguridad</option><option value="maintenance">Mantenimiento</option><option value="utilities">Servicios</option><option value="administration">Administracion</option><option value="other">Otros</option>
                      </SelectField>
                      <button className="btn btn-primary" disabled={busy === 'expense'}>Guardar gasto</button>
                    </form>
                  </Panel>
                </div>
              </div>
            )}

            {finSubTab === 'noIdentificados' && (
              <>
                <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 16 }}>
                  <Metric row loading={unidentifiedPaymentsLoading} label="Pendientes" value={unidentifiedPaymentsSummary?.pendingCount || 0} hint={money(unidentifiedPaymentsSummary?.pendingTotal || 0)} icon={CreditCard} />
                  <Metric row loading={unidentifiedPaymentsLoading} label="Asociados este mes" value={unidentifiedPaymentsSummary?.associatedThisMonthCount || 0} hint={money(unidentifiedPaymentsSummary?.associatedThisMonthTotal || 0)} icon={CheckCircle2} />
                  <Metric row loading={unidentifiedPaymentsLoading} label="Rechazados/Archivados" value={unidentifiedPaymentsSummary?.rejectedArchivedCount || 0} hint="Sin acción requerida" icon={X} />
                </div>
                <div className="admin-panel">
                  <div className="panel-head"><h2><CreditCard size={14} />Pagos No Identificados</h2></div>
                  <div className="admin-form" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', marginBottom: 12 }}>
                    <label className="admin-field"><span>Estado</span>
                      <select value={unidentifiedPaymentsFilters.status} onChange={(e) => setUnidentifiedPaymentsFilters((f: any) => ({ ...f, status: e.target.value }))}>
                        <option value="all">Todos</option>
                        <option value="pending">Pendiente</option>
                        <option value="partially_matched">Parcialmente asociado</option>
                        <option value="associated">Asociado</option>
                        <option value="rejected">Rechazado</option>
                        <option value="archived">Archivado</option>
                      </select>
                    </label>
                    <label className="admin-field"><span>Método</span>
                      <select value={unidentifiedPaymentsFilters.method} onChange={(e) => setUnidentifiedPaymentsFilters((f: any) => ({ ...f, method: e.target.value }))}>
                        <option value="all">Todos</option>
                        <option value="transferencia">Transferencia</option>
                        <option value="deposito">Depósito</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="mercadopago">MercadoPago</option>
                        <option value="otro">Otro</option>
                      </select>
                    </label>
                    <Field label="Desde" type="date" value={unidentifiedPaymentsFilters.dateFrom} onChange={(e: any) => setUnidentifiedPaymentsFilters((f: any) => ({ ...f, dateFrom: e.target.value }))} />
                    <Field label="Hasta" type="date" value={unidentifiedPaymentsFilters.dateTo} onChange={(e: any) => setUnidentifiedPaymentsFilters((f: any) => ({ ...f, dateTo: e.target.value }))} />
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                      <button className="btn btn-primary" style={{ flex: 1 }} onClick={fetchUnidentifiedPayments}><Search size={14} />Filtrar</button>
                    </div>
                  </div>
                  <Table loading={unidentifiedPaymentsLoading} searchPlaceholder="Buscar por referencia o remitente" filters={[]} rows={unidentifiedPayments} columns={[
                    ['Fecha', (p: any) => <span>{dateLabel(p.paymentDate)}</span>],
                    ['Importe', (p: any) => <span className="fin-mono">{money(p.amount)}</span>],
                    ['Método', (p: any) => <span>{p.paymentMethodLabel || p.paymentMethod || '—'}</span>],
                    ['Referencia', (p: any) => <span>{p.reference || '—'}</span>],
                    ['Remitente', (p: any) => <span>{p.senderName || '—'}</span>],
                    ['Estado', (p: any) => {
                      const tone = p.status === 'pending' ? 'warn' : p.status === 'partially_matched' ? 'info' : p.status === 'associated' ? 'pos' : p.status === 'rejected' ? 'neg' : 'muted';
                      const labels: Record<string, string> = { pending: 'Pendiente', partially_matched: 'Parc. asociado', associated: 'Asociado', rejected: 'Rechazado', archived: 'Archivado' };
                      return <span className={`pill ${tone}`}><span className="d" />{labels[p.status] || p.status}</span>;
                    }],
                    ['Acciones', (p: any) => <Actions>
                      <button onClick={() => openUnidentifiedDetail(p)}>Ver</button>
                      {p.status !== 'associated' && p.status !== 'archived' && <button onClick={() => openUnidentifiedAssociate(p)}>Asociar</button>}
                      {p.status !== 'archived' && <button onClick={() => handleUnidentifiedReject(p)}>Rechazar</button>}
                      {p.status !== 'archived' && <button onClick={() => handleUnidentifiedArchive(p)}>Archivar</button>}
                    </Actions>]
                  ]} />
                </div>

                {showUnidentifiedDetailModal && selectedUnidentified && (
                  <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) { setShowUnidentifiedDetailModal(false); setSelectedUnidentified(null); } }}>
                    <div className="form-modal form-modal--wide">
                      <div className="form-modal-head">
                        <div className="form-modal-title"><CreditCard size={16} />Detalle de Pago No Identificado</div>
                        <button className="icon-btn" onClick={() => { setShowUnidentifiedDetailModal(false); setSelectedUnidentified(null); }}><X size={16} /></button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', padding: '0.75rem 0' }}>
                        <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Fecha</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{dateLabel(selectedUnidentified.paymentDate)}</div></div>
                        <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Monto</span><div style={{ fontWeight: 600, color: 'var(--accent)' }}>{money(selectedUnidentified.amount)}</div></div>
                        <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Método</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{selectedUnidentified.paymentMethodLabel || selectedUnidentified.paymentMethod || '-'}</div></div>
                        <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Referencia</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{selectedUnidentified.reference || '-'}</div></div>
                        <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Remitente</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{selectedUnidentified.senderName || '-'}</div></div>
                        <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Estado</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{selectedUnidentified.status}</div></div>
                      </div>
                      {selectedUnidentified.attachment && (
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Comprobante</span>
                          <div><button className="btn btn-ghost btn-sm" onClick={() => { const a = document.createElement('a'); a.href = selectedUnidentified.attachment; a.download = 'comprobante'; a.click(); }}><Download size={12} />Ver comprobante</button></div>
                        </div>
                      )}
                      {selectedUnidentified.auditLog && selectedUnidentified.auditLog.length > 0 && (
                        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Historial</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                            {selectedUnidentified.auditLog.map((log: any, i: number) => (
                              <div key={i} style={{ fontSize: 12, color: 'var(--text)' }}>
                                <span style={{ color: 'var(--muted)' }}>{dateLabel(log.createdAt)}</span> — {log.action} {log.by ? `por ${log.by}` : ''}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="form-modal-foot">
                        <button type="button" className="btn btn-ghost" onClick={() => { setShowUnidentifiedDetailModal(false); setSelectedUnidentified(null); }}>Cerrar</button>
                        {selectedUnidentified.status !== 'associated' && selectedUnidentified.status !== 'archived' && (
                          <button className="btn btn-primary" onClick={() => { setShowUnidentifiedDetailModal(false); openUnidentifiedAssociate(selectedUnidentified); }}>Asociar</button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {showUnidentifiedAssociateModal && selectedUnidentified && (
                  <AssociateUnidentifiedModal payment={selectedUnidentified} owners={owners} units={units} onClose={() => { setShowUnidentifiedAssociateModal(false); setSelectedUnidentified(null); }} onSuccess={() => { fetchUnidentifiedPayments(); setShowUnidentifiedAssociateModal(false); setSelectedUnidentified(null); }} />
                )}
              </>
            )}
          </>
  );
}
