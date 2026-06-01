import { useState } from 'react';
import { Building2, CreditCard, RefreshCw, ShieldCheck, Users, WalletCards, X } from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { Table } from '../../components/Table';
import { Actions, Empty, Field, Metric, Panel, Status } from './adminComponents';
import { adminInitials, debtAmount, hasDebt, idOf, money, unitLabel } from './adminFormat';

export function AdminOwnersUnitsSection({ ctx }: { ctx: any }) {
  const {
    owners, units, config, refresh, tab, setShowUnitModal, setShowOwnerModal, loading, ownerStats,
    openDelinquencyDetail, notifyOwner, openWhatsApp, run, showOwnerModal, setOwnerEmailError,
    setOwnerEmailHint, setOwnerEmailResult, setOwnerLastCheckedEmail, ownerEmailResult, submitOwner,
    ownerEmailChecking, ownerEmailError, ownerEmailHint, checkOwnerEmail, ownerUnitFilter,
    setOwnerUnitFilter, selectedOwnerUnits, toggleOwnerUnit, filteredOwnerUnits, ownerSelectedUnitIds,
    availableOwnerUnits, busy, showUnitModal, submitUnitBulk
  } = ctx;
  const [editingOwner, setEditingOwner] = useState<any>(null);
  const [paymentOwner, setPaymentOwner] = useState<any>(null);
  const [paymentAvailable, setPaymentAvailable] = useState<any>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);

  const ownerUnitIds = (owner: any) => new Set(
    (owner?.units || [])
      .map((unit: any) => idOf(unit) || String(unit?.unitId || unit?.id || ''))
      .filter(Boolean)
  );

  const ownerAssignableUnits = editingOwner
    ? [
        ...(units || []).filter((unit: any) => idOf(unit.owner) === idOf(editingOwner)),
        ...(availableOwnerUnits || [])
      ].filter((unit: any, index: number, arr: any[]) => arr.findIndex((item) => idOf(item) === idOf(unit)) === index)
    : [];

  const closePaymentModal = () => {
    setPaymentOwner(null);
    setPaymentAvailable(null);
    setPaymentFile(null);
  };

  async function openRegisterPayment(owner: any) {
    setPaymentOwner(owner);
    setPaymentAvailable(null);
    setPaymentFile(null);
    setPaymentLoading(true);
    try {
      const response = await adminApi.payments.availableItems({ ownerId: idOf(owner) });
      setPaymentAvailable(response?.data || {});
    } catch {
      setPaymentAvailable({ periods: [], extraordinary: [], debtItems: [] });
    } finally {
      setPaymentLoading(false);
    }
  }

  function submitOwnerEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingOwner) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, any>;
    const unitIds = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="unitIds"]:checked')).map((input) => input.value);
    const payload: Record<string, unknown> = {
      name: String(data.name || '').trim(),
      phone: String(data.phone || '').trim(),
      startBillingPeriod: data.startBillingPeriod || undefined,
      unitIds
    };
    if (data.percentage !== '') payload.percentage = Number(data.percentage);
    if (data.balance !== '') payload.balance = Number(data.balance);
    run(`owner-edit-${idOf(editingOwner)}`, () => adminApi.owners.update(idOf(editingOwner), payload), 'Propietario actualizado.')
      .then((ok: boolean) => { if (ok) setEditingOwner(null); });
  }

  function submitRegisterPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentOwner) return;
    const form = event.currentTarget;
    const selectedConcepts = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="concepts"]:checked'));
    const selectedPeriods = selectedConcepts.filter((input) => input.dataset.type === 'period').map((input) => input.value);
    const selectedExtras = selectedConcepts.filter((input) => input.dataset.type === 'extra').map((input) => input.value);
    const selectedDebtItems = selectedConcepts.filter((input) => input.dataset.type === 'debtItem').map((input) => input.value);
    const selectedBalance = selectedConcepts.find((input) => input.dataset.type === 'balance');
    const note = (form.elements.namedItem('ownerNote') as HTMLTextAreaElement | null)?.value?.trim();

    if (!selectedConcepts.length) {
      window.alert('Selecciona al menos un concepto para registrar.');
      return;
    }
    if (selectedBalance && selectedConcepts.length > 1) {
      window.alert('El saldo anterior debe registrarse en un pago separado.');
      return;
    }

    const formData = new FormData();
    formData.append('ownerId', idOf(paymentOwner));
    if (selectedBalance) {
      formData.append('balanceAmount', selectedBalance.dataset.amount || selectedBalance.value);
    } else {
      selectedPeriods.forEach((period) => formData.append('periods', period));
      if (selectedPeriods.length === 1) formData.append('month', selectedPeriods[0]);
      selectedExtras.forEach((extraId) => formData.append('extraordinaryIds', extraId));
      selectedDebtItems.forEach((itemId) => formData.append('debtItemIds', itemId));
    }
    if (note) formData.append('ownerNote', note);
    if (paymentFile) formData.append('receipt', paymentFile);

    run(`owner-payment-${idOf(paymentOwner)}`, () => adminApi.payments.create(formData), 'Pago registrado correctamente.')
      .then((ok: boolean) => { if (ok) closePaymentModal(); });
  }

  return (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Comunidad</div>
                <h1 className="admin-page-title">Propietarios</h1>
                <div className="admin-page-sub">{owners?.length || 0} propietarios · {units?.length || 0} unidades · {config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-secondary" onClick={() => setShowUnitModal(true)}><Building2 size={14} />Nueva unidad</button>
                <button className="btn btn-primary" onClick={() => setShowOwnerModal(true)}><Users size={14} />Nuevo propietario</button>
              </div>
            </div>
            <div className="metric-grid">
              <Metric row loading={loading} label="Total propietarios" value={owners?.length || 0} hint="Registrados" icon={Users} />
              <Metric row loading={loading} label="Al día" value={ownerStats?.upToDate || 0} hint="Sin deuda activa" icon={ShieldCheck}
                delta={(ownerStats?.upToDate ?? 0) > 0 ? { text: `${Math.round(((ownerStats?.upToDate || 0) / Math.max(owners?.length || 1, 1)) * 100)}% de la comunidad`, trend: 'pos' } : undefined} />
              <Metric row loading={loading} label="Con deuda" value={(owners?.filter((o: any) => hasDebt(o)).length) || 0} hint="Deudores activos" icon={CreditCard}
                delta={owners?.filter((o: any) => o.isDebtor).length > 0 ? { text: `${owners.filter((o: any) => o.isDebtor).length} morosos`, trend: 'neg' } : undefined} />
              <Metric row loading={loading} label="Unidades" value={units?.length || 0} hint={`${units?.filter((u: any) => u.owner).length || 0} asignadas`} icon={Building2} />
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <Table loading={loading} searchPlaceholder="Buscar nombre, email o unidad" filters={[
                {
                  key: 'debt',
                  label: 'Estado',
                  allLabel: 'Todos',
                  options: [{ value: 'debtor', label: 'Con deuda' }, { value: 'clear', label: 'Al día' }],
                  match: (row, value) => value === 'debtor' ? hasDebt(row) : !hasDebt(row)
                }
              ]} rows={owners} columns={[
                ['Propietario', (o: any) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="owner-avatar">{adminInitials(o.name)}</div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-bright)' }}>{o.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{o.email}</div>
                    </div>
                  </div>
                )],
                ['Unidades', (o: any) => <span style={{ fontSize: 12 }}>{unitLabel(o)}</span>],
                ['Teléfono', (o: any) => <span style={{ fontSize: 11.5, color: 'var(--muted)', fontFamily: 'monospace' }}>{o.phone || '—'}</span>],
                ['Estado', (o: any) => <Status value={hasDebt(o) ? 'pending' : 'approved'} />],
                ['Saldo', (o: any) => (
                  <span style={{ fontFamily: 'monospace', fontSize: 12.5, color: debtAmount(o) > 0 ? 'var(--neg)' : 'var(--muted)' }}>
                    {debtAmount(o) > 0 ? money(debtAmount(o)) : '—'}
                  </span>
                )],
                ['', (o: any) => <Actions>
                  <button onClick={() => openDelinquencyDetail(idOf(o))}>Detalle</button>
                  <button onClick={() => notifyOwner(o)}>Avisar</button>
                  <button onClick={() => openWhatsApp(o.phone, `Hola ${o.name || ''}, te contactamos desde la administración de ${config?.consortiumName || 'GestionAr'}.`)}>WhatsApp</button>
                  <button onClick={() => run(idOf(o), () => adminApi.owners.delete(idOf(o)), 'Propietario eliminado.')}>Eliminar</button>
                </Actions>]
              ]} />
            </div>
            <Panel title="Unidades" icon={Building2}>
              <Table loading={loading} searchPlaceholder="Buscar unidad o propietario" filters={[
                {
                  key: 'assigned',
                  label: 'Asignacion',
                  allLabel: 'Todas',
                  options: [{ value: 'yes', label: 'Asignadas' }, { value: 'no', label: 'Sin asignar' }],
                  match: (row, value) => value === 'yes' ? !!row.owner : !row.owner
                }
              ]} rows={units} columns={[
                ['Nombre', (u: any) => u.name],
                ['Propietario', (u: any) => u.owner?.name || '—'],
                ['Coef.', (u: any) => u.coefficient || '1'],
                ['Cuota', (u: any) => money(u.finalFee || u.customFee)],
                ['Deuda', (u: any) => debtAmount(u) > 0 ? money(debtAmount(u)) : '—'],
                ['', (u: any) => <Actions>
                  {u.owner && <button onClick={() => run(idOf(u), () => adminApi.units.releaseOwner(idOf(u)), 'Unidad liberada.')}>Liberar</button>}
                  <button onClick={() => run(idOf(u), () => adminApi.units.delete(idOf(u)), 'Unidad eliminada.')}>Eliminar</button>
                </Actions>]
              ]} />
            </Panel>

            {showOwnerModal && (() => {
              const closeOwnerModal = () => {
                setShowOwnerModal(false);
                setOwnerEmailError('');
                setOwnerEmailHint(null);
                setOwnerEmailResult(null);
                setOwnerLastCheckedEmail('');
              };
              const userExists = ownerEmailResult?.exists && ownerEmailResult?.canAddToCurrentOrganization;
              const cantAdd = ownerEmailResult && !ownerEmailResult.canAddToCurrentOrganization;
              return (
              <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) closeOwnerModal(); }}>
                <div className="form-modal form-modal--wide">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><Users size={16} />Nuevo propietario</div>
                    <button className="icon-btn" onClick={closeOwnerModal}><X size={16} /></button>
                  </div>
                  <form className="admin-form" onSubmit={submitOwner}>
                    <p className="form-section-label">Datos personales</p>
                    <Field label="Nombre completo" name="name" required />
                    <label className="admin-field">
                      <span>Email</span>
                      <input
                        name="email"
                        type="email"
                        required
                        disabled={ownerEmailChecking}
                        style={ownerEmailError || cantAdd ? { borderColor: 'var(--danger)' } : ownerEmailHint?.tone === 'success' ? { borderColor: 'var(--success,#16a34a)' } : {}}
                        onChange={() => { if (ownerEmailError) setOwnerEmailError(''); if (ownerEmailHint) setOwnerEmailHint(null); if (ownerEmailResult) { setOwnerEmailResult(null); setOwnerLastCheckedEmail(''); } }}
                        onBlur={(e) => checkOwnerEmail(e.target.value.trim())}
                      />
                      {ownerEmailChecking && <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Verificando…</small>}
                      {!ownerEmailChecking && ownerEmailHint && (
                        <small style={{ fontSize: 11, marginTop: 2, color: ownerEmailHint.tone === 'danger' ? 'var(--danger)' : ownerEmailHint.tone === 'success' ? 'var(--success,#16a34a)' : 'var(--text-muted)' }}>
                          {ownerEmailHint.text}
                        </small>
                      )}
                      {ownerEmailError && <small style={{ color: 'var(--danger)', fontSize: 11, marginTop: 2 }}>{ownerEmailError}</small>}
                    </label>
                    {!userExists && (
                      <Field label="Contraseña temporal" name="password" type="password" placeholder="Mín. 6 caracteres" required={!userExists} />
                    )}
                    <Field label="Teléfono" name="phone" />
                    <p className="form-section-label">Configuración de cuenta</p>
                    <label className="admin-field">
                      <span>Deuda inicial / Saldo anterior ($)</span>
                      <input className="input" type="number" name="initialDebtAmount" defaultValue={0} min={0} />
                      <small style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>Usá este campo si el propietario ingresa con deuda previa.</small>
                    </label>
                    <div className="admin-field full owner-check-row">
                      <input type="checkbox" name="chargeCurrentMonth" id="chargeCurrentMonth" defaultChecked />
                      <div>
                        <label htmlFor="chargeCurrentMonth" style={{ cursor: 'pointer' }}>¿Cobrar mes en curso?</label>
                        <div className="owner-check-hint">Si se desactiva, el cobro comenzará el mes siguiente.</div>
                      </div>
                    </div>
                    <p className="form-section-label">Unidades asignadas</p>
                    <div className="admin-field full">
                      <div className="unit-picker">
                        <input
                          type="search"
                          placeholder="Buscar unidad disponible"
                          value={ownerUnitFilter}
                          onChange={(event) => setOwnerUnitFilter(event.target.value)}
                        />
                        {selectedOwnerUnits.length > 0 && (
                          <div className="unit-picker-chips">
                            {selectedOwnerUnits.map((unit: any) => (
                              <button type="button" key={idOf(unit)} onClick={() => toggleOwnerUnit(idOf(unit))}>
                                {unit.name} ×
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="unit-picker-list">
                          {filteredOwnerUnits.length ? filteredOwnerUnits.slice(0, 24).map((unit: any) => {
                            const unitId = idOf(unit);
                            const selected = ownerSelectedUnitIds.has(unitId);
                            return (
                              <button
                                type="button"
                                key={unitId}
                                className={selected ? 'selected' : ''}
                                onClick={() => toggleOwnerUnit(unitId)}
                              >
                                <input type="checkbox" tabIndex={-1} checked={selected} readOnly />
                                <span>{unit.name}</span>
                              </button>
                            );
                          }) : <Empty text="No hay unidades disponibles con ese filtro." />}
                        </div>
                        <small>{availableOwnerUnits.length} disponibles · {units.length - availableOwnerUnits.length} ocupadas.</small>
                      </div>
                    </div>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={closeOwnerModal}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'owner' || cantAdd || ownerEmailChecking}>Crear propietario</button>
                    </div>
                  </form>
                </div>
              </div>
              );
            })()}

            {showUnitModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) setShowUnitModal(false); }}>
                <div className="form-modal">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><Building2 size={16} />Nueva unidad</div>
                    <button className="icon-btn" onClick={() => setShowUnitModal(false)}><X size={16} /></button>
                  </div>
                  <form className="admin-form" onSubmit={submitUnitBulk}>
                    <Field label="Cantidad" name="count" type="number" required />
                    <Field label="Desde" name="start" type="number" defaultValue="1" required />
                    <Field label="Prefijo" name="prefix" defaultValue="Lote" required />
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => setShowUnitModal(false)}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'unit'}>Crear unidades</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
  );
}
