import { useState } from 'react';
import { Download, FileText, List, Paperclip, RefreshCw, ShieldCheck, UserRoundCog, Users, WalletCards, X } from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { Table } from '../../components/Table';
import { Actions, Field, Metric, Panel, Status } from './adminComponents';
import { idOf, money, roleLabels, salaryPaidAmount, salaryRemainingAmount } from './adminFormat';

type SectionMode = 'empleados' | 'sueldos';

export function AdminEmployeesSalariesSection({ mode, ctx }: { mode: SectionMode; ctx: any }) {
  if (mode === 'empleados') return <EmployeesSection ctx={ctx} />;
  return <SalariesSection ctx={ctx} />;
}

function EmployeesSection({ ctx }: { ctx: any }) {
  const {
    employees, config, refresh, tab, setEditingEmployee, setEmpModalRole, setEmpIsOnLeave,
    setEmployeeFiles, setShowEmployeeModal, loading, editEmployee, run, showEmployeeModal,
    editingEmployee, empModalRole, empIsOnLeave, submitEmployee,
    employeeFiles, downloadEmployeeDocument, deleteEmployeeDocument, busy
  } = ctx;

  const [accessTarget, setAccessTarget] = useState<any>(null);
  const [accessError, setAccessError] = useState('');
  const [accessBusy, setAccessBusy] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<any>(null);

  async function doCreateAccess() {
    if (!accessTarget) return;
    setAccessBusy(true);
    setAccessError('');
    try {
      await adminApi.employees.createAccess(idOf(accessTarget));
      setAccessTarget(null);
      refresh(tab);
    } catch (err: any) {
      setAccessError(err?.message || 'No se pudo crear el acceso.');
    }
    setAccessBusy(false);
  }

  async function doDeactivate(employee: any, revokeAccess: boolean) {
    setDeactivateTarget(null);
    await adminApi.employees.delete(idOf(employee), revokeAccess ? { revokeAccess: true } : undefined);
    refresh(tab);
  }

  return (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Administración</div>
                <h1 className="admin-page-title">Personal</h1>
                <div className="admin-page-sub">
                  {employees?.filter((e: any) => e.isActive && !e.isOnLeave).length || 0} colaboradores activos
                  {(employees?.filter((e: any) => e.isOnLeave).length || 0) > 0 && ` · ${employees.filter((e: any) => e.isOnLeave).length} en licencia`}
                  {' · '}{config?.consortiumName || 'Tu organización'}
                </div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-primary" onClick={() => { setEditingEmployee(null); setEmpModalRole('maintenance'); setEmpIsOnLeave(false); setEmployeeFiles([]); setShowEmployeeModal(true); }}><UserRoundCog size={14} />Alta</button>
              </div>
            </div>
            <div className="metric-grid">
              <Metric row loading={loading} label="Activos" value={employees?.filter((e: any) => e.isActive && !e.isOnLeave).length || 0} hint="Colaboradores" icon={UserRoundCog} />
              <Metric row loading={loading} label="En licencia" value={employees?.filter((e: any) => e.isOnLeave).length || 0} hint="Con cobertura activa" icon={Users} />
              <Metric row loading={loading} label="Total personal" value={employees?.filter((e: any) => e.isActive).length || 0} hint="Activos + licencia" icon={Users} />
              <Metric row loading={loading} label="Dados de baja" value={employees?.filter((e: any) => !e.isActive).length || 0} hint="Histórico" icon={UserRoundCog} />
            </div>
            <div className="admin-grid full">
            <Panel title="Personal" icon={UserRoundCog}>
              <Table loading={loading} searchPlaceholder="Buscar por nombre o DNI" filters={[
                {
                  key: 'dept',
                  label: 'Departamento',
                  allLabel: 'Todos los departamentos',
                  options: Object.entries(roleLabels).map(([value, label]) => ({ value, label })),
                  match: (row: any, value: string) => row.role === value
                },
                {
                  key: 'empstatus',
                  label: 'Estado',
                  allLabel: 'Todos',
                  options: [
                    { value: 'active', label: 'Activos' },
                    { value: 'leave', label: 'En licencia' },
                    { value: 'inactive', label: 'Dados de baja' }
                  ],
                  match: (row: any, value: string) => {
                    if (value === 'active') return !!row.isActive && !row.isOnLeave;
                    if (value === 'leave') return !!row.isOnLeave;
                    return !row.isActive;
                  }
                }
              ]} rows={employees} columns={[
                ['Persona', (e: any) => {
                  const initials = (e.name || '').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();
                  const subtitle = e.customRole || roleLabels[e.role] || e.role || '-';
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="emp-avatar">{initials}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{e.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{subtitle}</div>
                      </div>
                    </div>
                  );
                }],
                ['Departamento', (e: any) => <span className="badge">{roleLabels[e.role] || e.role || '-'}</span>],
                ['Turno', (e: any) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.schedule || '—'}</span>],
                ['Antigüedad', (e: any) => e.startDate ? `desde ${new Date(e.startDate).getFullYear()}` : '—'],
                ['Estado', (e: any) => {
                  if (e.isOnLeave) return <Status value="leave" label={e.leaveNote || 'En licencia'} />;
                  const statusEl = <Status value={e.isActive ? 'active' : 'cancelled'} />;
                  if (e.role === 'security') {
                    const portalEl = e.userId
                      ? <span style={{ fontSize: 10, color: 'var(--pos)' }}>● Portal activo</span>
                      : <span style={{ fontSize: 10, color: 'var(--ink-3, var(--muted))' }}>○ Sin acceso</span>;
                    return <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{statusEl}{portalEl}</div>;
                  }
                  return statusEl;
                }],
                ['Acciones', (e: any) => <Actions>
                  <button onClick={() => editEmployee(e)}>Editar</button>
                  {e.role === 'security' && e.isActive && !e.userId && (
                    <button onClick={() => { setAccessError(''); setAccessTarget(e); }}><ShieldCheck size={11} />Portal</button>
                  )}
                  {e.role === 'security' && e.userId && (
                    <button className="danger-action" onClick={() => run(idOf(e), () => adminApi.employees.unlinkUser(idOf(e)), 'Vínculo removido.')}>Desvincular</button>
                  )}
                  {e.isActive
                    ? <button className="danger-action" onClick={() => { if (e.userId) { setDeactivateTarget(e); } else { run(idOf(e), () => adminApi.employees.delete(idOf(e)), 'Empleado dado de baja.'); } }}>Baja</button>
                    : <button onClick={() => run(idOf(e), () => adminApi.employees.update(idOf(e), { isActive: true, endDate: null }), 'Empleado reactivado.')}>Reactivar</button>}
                </Actions>]
              ]} />
            </Panel>
            </div>

            {accessTarget && (
              <div className="modal-backdrop" role="dialog" aria-modal="true"
                onClick={(ev) => { if (ev.target === ev.currentTarget) setAccessTarget(null); }}>
                <div className="form-modal">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><ShieldCheck size={16} />Acceso al portal de portería</div>
                    <button className="icon-btn" onClick={() => setAccessTarget(null)}><X size={16} /></button>
                  </div>
                  <div style={{ padding: '0.75rem 0' }}>
                    <p style={{ fontSize: 13, marginBottom: '0.75rem' }}>
                      Crear acceso al portal de portería para <strong>{accessTarget.name}</strong>.
                    </p>
                    {accessTarget.email
                      ? <p style={{ fontSize: 13, color: 'var(--muted)' }}>Email: <strong>{accessTarget.email}</strong>. Se enviará una contraseña temporal si el usuario es nuevo.</p>
                      : <p style={{ fontSize: 13, color: 'var(--neg)' }}>El empleado no tiene email registrado. Editá el empleado y agregá un email primero.</p>}
                    {accessError && <p style={{ fontSize: 13, color: 'var(--neg)', marginTop: '0.5rem' }}>{accessError}</p>}
                  </div>
                  <div className="form-modal-foot">
                    <button type="button" className="btn btn-ghost" onClick={() => setAccessTarget(null)}>Cancelar</button>
                    <button className="btn btn-primary" disabled={!accessTarget.email || accessBusy} onClick={doCreateAccess}>
                      <ShieldCheck size={14} />{accessBusy ? 'Creando…' : 'Crear acceso'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {deactivateTarget && (
              <div className="modal-backdrop" role="dialog" aria-modal="true"
                onClick={(ev) => { if (ev.target === ev.currentTarget) setDeactivateTarget(null); }}>
                <div className="form-modal">
                  <div className="form-modal-head">
                    <div className="form-modal-title">Dar de baja a {deactivateTarget.name}</div>
                    <button className="icon-btn" onClick={() => setDeactivateTarget(null)}><X size={16} /></button>
                  </div>
                  <div style={{ padding: '0.75rem 0' }}>
                    <p style={{ fontSize: 13, marginBottom: '0.5rem' }}>Este empleado tiene acceso activo al portal de portería.</p>
                    <p style={{ fontSize: 13, color: 'var(--muted)' }}>¿Querés también revocar su acceso al portal?</p>
                  </div>
                  <div className="form-modal-foot" style={{ flexDirection: 'column', gap: '0.5rem' }}>
                    <button className="btn btn-primary danger-action" style={{ width: '100%' }} onClick={() => doDeactivate(deactivateTarget, true)}>
                      Dar de baja y revocar acceso al portal
                    </button>
                    <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => doDeactivate(deactivateTarget, false)}>
                      Solo dar de baja al empleado
                    </button>
                    <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => setDeactivateTarget(null)}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {showEmployeeModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true"
                onClick={(e) => { if (e.target === e.currentTarget) { setShowEmployeeModal(false); setEditingEmployee(null); setEmpIsOnLeave(false); setEmployeeFiles([]); } }}>
                <div className="form-modal form-modal--wide">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><UserRoundCog size={16} />{editingEmployee ? 'Editar empleado' : 'Nuevo empleado'}</div>
                    <button className="icon-btn" onClick={() => { setShowEmployeeModal(false); setEditingEmployee(null); setEmpIsOnLeave(false); setEmployeeFiles([]); }}><X size={16} /></button>
                  </div>
                  <form key={editingEmployee ? idOf(editingEmployee) : 'new'} className="admin-form" onSubmit={submitEmployee}>
                    <Field label="Nombre" name="name" required defaultValue={editingEmployee?.name} />
                    <label className="admin-field">
                      <span>Departamento</span>
                      <select name="role" value={empModalRole} onChange={(e) => setEmpModalRole(e.target.value)}>
                        {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>
                    <Field label="Cargo / rol específico" name="customRole" placeholder="Ej: Jardinero, Recepción, Seguridad nocturna" defaultValue={editingEmployee?.customRole} />
                    <Field label="Turno horario" name="schedule" placeholder="Ej: L-V 8-17" defaultValue={editingEmployee?.schedule} />
                    <Field label="DNI" name="documentNumber" defaultValue={editingEmployee?.documentNumber} />
                    <Field label="Telefono" name="phone" defaultValue={editingEmployee?.phone} />
                    <Field label="Email" name="email" type="email" defaultValue={editingEmployee?.email} />
                    <Field label="Fecha de inicio" name="startDate" type="date" defaultValue={editingEmployee?.startDate ? String(editingEmployee.startDate).slice(0, 10) : undefined} />
                    <label className="admin-field full" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <input type="checkbox" checked={empIsOnLeave} onChange={(e) => setEmpIsOnLeave(e.target.checked)} style={{ width: 16, height: 16 }} />
                      <span>En licencia</span>
                    </label>
                    {empIsOnLeave && (
                      <Field label="Nota de licencia" name="leaveNote" placeholder="Ej: Vacaciones · vuelve 18/03" defaultValue={editingEmployee?.leaveNote} />
                    )}
                    <label className="admin-field full"><span>Notas</span><textarea name="notes" rows={2} defaultValue={editingEmployee?.notes} /></label>

                    {editingEmployee?.documents?.length > 0 && (
                      <div className="admin-field full">
                        <span>Archivos cargados</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                          {editingEmployee.documents.map((d: any, i: number) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', borderRadius: 8, padding: '0.5rem 0.75rem' }}>
                              <span style={{ flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                📄 {d.filename || `archivo-${i + 1}`}
                              </span>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
                                onClick={() => downloadEmployeeDocument(idOf(editingEmployee), i, d.filename || 'archivo')}>
                                <Download size={12} />Descargar
                              </button>
                              <button type="button" className="btn btn-sm danger-action" style={{ flexShrink: 0 }}
                                disabled={busy === 'emp-doc'}
                                onClick={() => deleteEmployeeDocument(i)}>
                                Eliminar
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="admin-field full">
                      <span>
                        {editingEmployee ? 'Agregar archivos' : 'Archivos relacionados'}
                        {' '}<small style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional · máx. 5 · PDF o imagen)</small>
                      </span>
                      <input type="file" id="emp-files-input" accept=".pdf,image/*" multiple style={{ display: 'none' }}
                        onChange={(e) => {
                          const incoming = Array.from(e.target.files || []) as File[];
                          setEmployeeFiles((prev: File[]) => {
                            const remaining = 5 - prev.length;
                            return [...prev, ...incoming.slice(0, remaining)];
                          });
                          e.target.value = '';
                        }}
                      />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {employeeFiles.map((f: File, i: number) => (
                            <span key={i} className="attach-chip">
                              <Paperclip size={12} />{f.name.length > 24 ? f.name.slice(0, 23) + '…' : f.name}
                              <button type="button" className="attach-chip-remove" onClick={() => setEmployeeFiles((prev: File[]) => prev.filter((_: File, j: number) => j !== i))}><X size={11} /></button>
                            </span>
                          ))}
                          {employeeFiles.length < 5 && (
                            <button type="button" className="attach-add" onClick={() => document.getElementById('emp-files-input')?.click()}>
                              <Paperclip size={12} /> Agregar archivo
                            </button>
                          )}
                        </div>
                    </div>

                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowEmployeeModal(false); setEditingEmployee(null); setEmpIsOnLeave(false); setEmployeeFiles([]); }}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'employee' || (!!editingEmployee && busy === idOf(editingEmployee)) || busy === 'emp-doc'}>
                        <UserRoundCog size={14} />{editingEmployee ? 'Guardar cambios' : 'Crear empleado'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
  );
}

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  advance: 'Adelanto',
  salary_payment: 'Pago de sueldo',
  adjustment: 'Ajuste',
};
const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
};

function SalariesSection({ ctx }: { ctx: any }) {
  const {
    salaries, config, refresh, tab, setEditingSalary, setShowSalaryModal, loading, month,
    setMonth, statusFilter, monthFilter, roleLabel, openEditSalary, setSalaryForPayment,
    setSalaryPaymentType, setShowSalaryPaymentModal, run, showSalaryModal, editingSalary,
    submitSalaryModal, employees, busy, showSalaryPaymentModal, salaryForPayment,
    salaryPaymentType, submitSalaryPayment
  } = ctx;

  const [movementsTarget, setMovementsTarget] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  async function openMovements(salary: any) {
    setMovementsTarget(salary);
    setMovements([]);
    setLoadingMovements(true);
    try {
      const res = await adminApi.salaryPayments.list({ salary: idOf(salary) } as any);
      setMovements((res as any)?.data?.salaryPayments || []);
    } catch (_) {}
    setLoadingMovements(false);
  }

  function closeMovements() { setMovementsTarget(null); setMovements([]); }

  return (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Administración</div>
                <h1 className="admin-page-title">Sueldos</h1>
                <div className="admin-page-sub">{salaries.length || 0} liquidaciones · {config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-primary" onClick={() => { setEditingSalary(null); setShowSalaryModal(true); }}><WalletCards size={14} />Nueva liquidacion</button>
              </div>
            </div>
            <div className="metric-grid">
              <Metric row loading={loading} label="Sueldos pendientes" value={money(salaries.filter((s: any) => ['pending', 'partially_paid'].includes(s.status)).reduce((sum: number, s: any) => sum + salaryRemainingAmount(s), 0))} hint={month} icon={WalletCards} />
              <Metric row loading={loading} label="Sueldos pagados" value={money(salaries.reduce((sum: number, s: any) => sum + salaryPaidAmount(s), 0))} hint="Período visible" icon={ShieldCheck} />
              <Metric row loading={loading} label="Liquidaciones" value={salaries.length || 0} hint="Período visible" icon={FileText} />
            </div>
            <div className="admin-grid full">
            <Panel
              title="Sueldos"
              icon={WalletCards}
              action={<div className="period-controls"><input type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></div>}
            >
              <Table loading={loading} searchPlaceholder="Buscar empleado o periodo" filters={[
                statusFilter(['pending', 'partially_paid', 'paid', 'cancelled']),
                monthFilter((s: any) => s.period || '', month)
              ]} rows={salaries} columns={[
                ['Periodo', (s: any) => s.period],
                ['Empleado', (s: any) => s.employee?.name || '-'],
                ['Rol', (s: any) => roleLabel(s.employee)],
                ['Total', (s: any) => money(s.totalAmount)],
                ['Pagado', (s: any) => money(salaryPaidAmount(s))],
                ['Pendiente', (s: any) => money(salaryRemainingAmount(s))],
                ['Estado', (s: any) => <Status value={s.status} />],
                ['Acciones', (s: any) => {
                  const canPay = s.status !== 'paid' && s.status !== 'cancelled' && salaryRemainingAmount(s) > 0;
                  const canEdit = s.status !== 'paid' && s.status !== 'cancelled';
                  return <Actions>
                    {canEdit && <button onClick={() => openEditSalary(s)}>Editar</button>}
                    {canPay && <button onClick={() => { setSalaryForPayment(s); setSalaryPaymentType('advance'); setShowSalaryPaymentModal(true); }}>Adelanto</button>}
                    {canPay && <button onClick={() => { setSalaryForPayment(s); setSalaryPaymentType('salary_payment'); setShowSalaryPaymentModal(true); }}>Registrar pago</button>}
                    <button onClick={() => openMovements(s)}>Movimientos</button>
                    {s.status !== 'cancelled' && <button className="danger-action" onClick={() => run(idOf(s), () => adminApi.salaries.delete(idOf(s)), 'Liquidacion cancelada.')}>Cancelar</button>}
                  </Actions>;
                }]
              ]} />
            </Panel>
            </div>

            {showSalaryModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true"
                onClick={(e) => { if (e.target === e.currentTarget) { setShowSalaryModal(false); setEditingSalary(null); } }}>
                <div className="form-modal form-modal--wide">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><WalletCards size={16} />{editingSalary ? 'Editar liquidacion' : 'Nueva liquidacion'}</div>
                    <button className="icon-btn" onClick={() => { setShowSalaryModal(false); setEditingSalary(null); }}><X size={16} /></button>
                  </div>
                  <form key={editingSalary ? idOf(editingSalary) : 'new-salary'} className="admin-form" onSubmit={submitSalaryModal}>
                    <label className="admin-field">
                      <span>Empleado *</span>
                      <select name="employeeId" defaultValue={editingSalary?.employee?._id || editingSalary?.employeeId || ''} disabled={!!editingSalary} required={!editingSalary}>
                        <option value="">Seleccionar</option>
                        {employees.filter((e: any) => e.isActive || (editingSalary && idOf(e) === idOf(editingSalary?.employee))).map((e: any) => (
                          <option key={idOf(e)} value={idOf(e)}>{e.name} ({roleLabel(e)})</option>
                        ))}
                      </select>
                    </label>
                    <Field label="Periodo *" name="period" type="month" required defaultValue={editingSalary?.period || month} />
                    <Field label="Monto base *" name="baseAmount" type="number" required defaultValue={editingSalary?.baseAmount ?? ''} />
                    <Field label="Extras" name="extraAmount" type="number" defaultValue={editingSalary?.extraAmount ?? 0} />
                    <Field label="Descuentos" name="deductions" type="number" defaultValue={editingSalary?.deductions ?? 0} />
                    <label className="admin-field">
                      <span>Metodo de pago</span>
                      <select name="paymentMethod" defaultValue={editingSalary?.paymentMethod || ''}>
                        <option value="">Sin especificar</option>
                        <option value="cash">Efectivo</option>
                        <option value="transfer">Transferencia</option>
                      </select>
                    </label>
                    <label className="admin-field full"><span>Notas</span><textarea name="notes" rows={2} defaultValue={editingSalary?.notes || ''} /></label>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowSalaryModal(false); setEditingSalary(null); }}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'salary' || (!!editingSalary && busy === idOf(editingSalary))}>
                        <WalletCards size={14} />{editingSalary ? 'Guardar cambios' : 'Crear liquidacion'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showSalaryPaymentModal && salaryForPayment && (
              <div className="modal-backdrop" role="dialog" aria-modal="true"
                onClick={(e) => { if (e.target === e.currentTarget) { setShowSalaryPaymentModal(false); setSalaryForPayment(null); } }}>
                <div className="form-modal">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><WalletCards size={16} />Registrar pago de sueldo</div>
                    <button className="icon-btn" onClick={() => { setShowSalaryPaymentModal(false); setSalaryForPayment(null); }}><X size={16} /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1.5rem', padding: '0.75rem 0', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Empleado</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{salaryForPayment.employee?.name || '-'}</div></div>
                    <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Periodo</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{salaryForPayment.period}</div></div>
                    <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Total</span><div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{money(salaryForPayment.totalAmount)}</div></div>
                    <div><span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Pendiente</span><div style={{ fontWeight: 600, color: 'var(--accent)' }}>{money(salaryRemainingAmount(salaryForPayment))}</div></div>
                  </div>
                  <form className="admin-form" onSubmit={submitSalaryPayment}>
                    <label className="admin-field">
                      <span>Tipo *</span>
                      <select name="type" defaultValue={salaryPaymentType}>
                        <option value="advance">Adelanto</option>
                        <option value="salary_payment">Pago de sueldo</option>
                      </select>
                    </label>
                    <Field label="Monto *" name="amount" type="number" required
                      defaultValue={salaryPaymentType === 'salary_payment' ? String(salaryRemainingAmount(salaryForPayment)) : ''} />
                    <Field label="Fecha de pago" name="paymentDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                    <label className="admin-field">
                      <span>Metodo *</span>
                      <select name="paymentMethod">
                        <option value="">Seleccionar</option>
                        <option value="cash">Efectivo</option>
                        <option value="transfer">Transferencia</option>
                      </select>
                    </label>
                    <label className="admin-field full"><span>Nota</span><textarea name="note" rows={2} /></label>
                    <p style={{ fontSize: 12, color: 'var(--muted)', gridColumn: '1 / -1' }}>El adelanto se descuenta del saldo pendiente del sueldo del periodo.</p>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowSalaryPaymentModal(false); setSalaryForPayment(null); }}>Cancelar</button>
                      <button className="btn btn-primary" disabled={busy === 'sal-payment'}>
                        <WalletCards size={14} />Guardar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {movementsTarget && (
              <div className="modal-backdrop" role="dialog" aria-modal="true"
                onClick={(e) => { if (e.target === e.currentTarget) closeMovements(); }}>
                <div className="form-modal form-modal--wide">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><List size={16} />Movimientos — {movementsTarget.employee?.name || '-'} · {movementsTarget.period}</div>
                    <button className="icon-btn" onClick={closeMovements}><X size={16} /></button>
                  </div>
                  <div style={{ padding: '0.75rem 0' }}>
                    {loadingMovements && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '1.5rem' }}>Cargando movimientos…</div>}
                    {!loadingMovements && movements.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '1.5rem' }}>Sin movimientos registrados.</div>}
                    {!loadingMovements && movements.length > 0 && (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', textTransform: 'uppercase', fontSize: 11 }}>
                            <th style={{ textAlign: 'left', padding: '0.4rem 0.75rem' }}>Tipo</th>
                            <th style={{ textAlign: 'right', padding: '0.4rem 0.75rem' }}>Monto</th>
                            <th style={{ textAlign: 'left', padding: '0.4rem 0.75rem' }}>Fecha</th>
                            <th style={{ textAlign: 'left', padding: '0.4rem 0.75rem' }}>Metodo</th>
                            <th style={{ textAlign: 'left', padding: '0.4rem 0.75rem' }}>Nota</th>
                          </tr>
                        </thead>
                        <tbody>
                          {movements.map((m: any, i: number) => (
                            <tr key={m._id || i} style={{ borderBottom: '1px solid var(--border-subtle, var(--border))' }}>
                              <td style={{ padding: '0.5rem 0.75rem' }}>{PAYMENT_TYPE_LABELS[m.type] || m.type}</td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>{money(m.amount)}</td>
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>{m.paymentDate ? String(m.paymentDate).slice(0, 10) : '-'}</td>
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)' }}>{PAYMENT_METHOD_LABELS[m.paymentMethod] || m.paymentMethod || '-'}</td>
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.note || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div className="form-modal-foot">
                    <button type="button" className="btn btn-ghost" onClick={closeMovements}>Cerrar</button>
                  </div>
                </div>
              </div>
            )}
          </>
  );
}
