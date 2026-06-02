import { useState } from 'react';
import { AlertTriangle, Briefcase, Calculator, CheckCircle2, Download, FileText, Plus, X } from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { Table } from '../../components/Table';
import { Actions, Empty, Panel } from './adminComponents';
import { idOf, money } from './adminFormat';
import type { GridFilter } from '../../components/Table';

type PayrollTab = 'config' | 'perfiles' | 'liquidaciones';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  calculated: 'Calculado',
  approved: 'Aprobado',
  paid: 'Pagado',
  cancelled: 'Cancelado',
};

const TYPE_LABELS: Record<string, string> = {
  monthly: 'Mensual',
  sac_first: 'SAC 1er sem.',
  sac_second: 'SAC 2do sem.',
  vacation: 'Vacaciones',
  final: 'Liq. Final',
  adjustment: 'Ajuste',
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  remunerative: 'Remunerativo',
  non_remunerative: 'No Remunerativo',
  deduction: 'Descuento',
  employer_contribution: 'Contrib. Empleador',
};

function Lbl({ children }: { children: React.ReactNode }) {
  return <label className="admin-field"><span>{children}</span></label>;
}

function FRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function AdminPayrollSection({ ctx }: { ctx: any }) {
  const [payrollTab, setPayrollTab] = useState<PayrollTab>('liquidaciones');

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <div className="admin-page-kicker"><span className="dot" />Personal</div>
          <h1 className="admin-page-title">Liquidación de Haberes</h1>
          <div className="admin-page-sub" style={{ color: '#f59e0b', fontSize: 12 }}>
            ⚠ Módulo en desarrollo — Las liquidaciones son borradores y deben ser revisadas por un profesional habilitado.
          </div>
        </div>
      </div>

      <div className="admin-tabs" style={{ marginBottom: 24 }}>
        {(['liquidaciones', 'perfiles', 'config'] as PayrollTab[]).map(k => (
          <button key={k} className={`admin-tab-btn${payrollTab === k ? ' active' : ''}`} onClick={() => setPayrollTab(k)}>
            {k === 'liquidaciones' ? 'Liquidaciones' : k === 'perfiles' ? 'Perfiles laborales' : 'Configuración'}
          </button>
        ))}
      </div>

      {payrollTab === 'config'        && <PayrollSettingTab ctx={ctx} />}
      {payrollTab === 'perfiles'      && <ProfilesTab ctx={ctx} />}
      {payrollTab === 'liquidaciones' && <LiquidationsTab ctx={ctx} />}
    </div>
  );
}

// ── Configuración de empleador ────────────────────────────────

function PayrollSettingTab({ ctx }: { ctx: any }) {
  const { run } = ctx;
  const [form, setForm] = useState({ employerLegalName: '', employerCuit: '', employerAddress: '', employerActivity: '', defaultConvention: '', defaultPaymentMethod: 'transfer' });
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  async function load() {
    try {
      const res = await adminApi.payroll.getSettings();
      if (res.data?.payrollSetting) {
        const s = res.data.payrollSetting;
        setForm({ employerLegalName: s.employerLegalName || '', employerCuit: s.employerCuit || '', employerAddress: s.employerAddress || '', employerActivity: s.employerActivity || '', defaultConvention: s.defaultConvention || '', defaultPaymentMethod: s.defaultPaymentMethod || 'transfer' });
      }
    } catch { /* no settings yet */ }
    setLoaded(true);
  }

  if (!loaded) { load(); return <Panel title="Configuración" icon={Briefcase}><div className="skeleton-line" /></Panel>; }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    try {
      await run(() => adminApi.payroll.upsertSettings(form));
      setNotice({ type: 'ok', text: 'Configuración guardada.' });
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Error al guardar.' });
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <Panel title="Datos del empleador" icon={Briefcase}>
      {notice && <div className={`notice notice-${notice.type}`}>{notice.text}</div>}
      <form onSubmit={save} style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
        <FRow label="Razón social *"><input value={form.employerLegalName} onChange={set('employerLegalName')} required /></FRow>
        <FRow label="CUIT (11 dígitos, sin guiones) *"><input value={form.employerCuit} onChange={set('employerCuit')} pattern="\d{11}" title="11 dígitos sin guiones" required /></FRow>
        <FRow label="Domicilio"><input value={form.employerAddress} onChange={set('employerAddress')} /></FRow>
        <FRow label="Actividad"><input value={form.employerActivity} onChange={set('employerActivity')} /></FRow>
        <FRow label="Convenio colectivo por defecto"><input value={form.defaultConvention} onChange={set('defaultConvention')} placeholder="Ej: CCT 589/10" /></FRow>
        <FRow label="Método de pago por defecto">
          <select value={form.defaultPaymentMethod} onChange={set('defaultPaymentMethod')}>
            <option value="transfer">Transferencia</option>
            <option value="cash">Efectivo</option>
          </select>
        </FRow>
        <div><button type="submit" className="btn-primary">Guardar configuración</button></div>
      </form>
    </Panel>
  );
}

// ── Perfiles laborales ────────────────────────────────────────

function ProfilesTab({ ctx }: { ctx: any }) {
  const { run } = ctx;
  const [profiles, setProfiles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employeeId: '', cuil: '', hireDate: '', baseSalary: '', employmentType: 'permanent', workSchedule: 'full_time', category: '', convention: '' });
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  async function load() {
    const [pr, er] = await Promise.all([adminApi.payroll.listProfiles(), adminApi.employees.list()]);
    setProfiles(pr.data?.profiles || []);
    setEmployees(er.data?.employees || []);
    setLoaded(true);
  }

  if (!loaded) { load(); return <Panel title="Perfiles laborales" icon={Briefcase}><div className="skeleton-line" /></Panel>; }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    try {
      await run(() => adminApi.payroll.createProfile({ ...form, baseSalary: Number(form.baseSalary) }));
      setNotice({ type: 'ok', text: 'Perfil creado.' });
      setShowModal(false);
      setLoaded(false);
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Error al crear perfil.' });
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const columns: Array<[string, (r: Record<string, unknown>) => React.ReactNode]> = [
    ['Empleado', (r: any) => r.employee?.name || '—'],
    ['Ingreso', (r: any) => r.hireDate ? new Date(r.hireDate).toLocaleDateString('es-AR') : '—'],
    ['Contratación', (r: any) => ({ permanent: 'Permanente', temporary: 'Temporal', trainee: 'Pasante' })[r.employmentType as string] || r.employmentType],
    ['Básico', (r: any) => money(r.baseSalary)],
    ['Estado', (r: any) => <span className={`pill ${r.active ? 'pos' : 'muted'}`}><span className="d" />{r.active ? 'Activo' : 'Inactivo'}</span>],
  ];

  return (
    <Panel
      title="Perfiles laborales"
      icon={Briefcase}
      action={<button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> Nuevo perfil</button>}
    >
      {notice && <div className={`notice notice-${notice.type}`}>{notice.text}</div>}
      {profiles.length === 0
        ? <Empty text="Sin perfiles laborales. Creá el primero para poder liquidar haberes." />
        : <Table rows={profiles as any} columns={columns} />
      }

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header"><h2>Nuevo perfil laboral</h2><button onClick={() => setShowModal(false)}><X size={18} /></button></div>
            <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
              <FRow label="Empleado *">
                <select value={form.employeeId} onChange={set('employeeId')} required>
                  <option value="">Seleccioná un empleado</option>
                  {employees.filter((e: any) => e.isActive).map((e: any) => (
                    <option key={idOf(e)} value={idOf(e)}>{e.name}</option>
                  ))}
                </select>
              </FRow>
              <FRow label="CUIL * (11 dígitos sin guiones)"><input value={form.cuil} onChange={set('cuil')} pattern="\d{11}" title="11 dígitos" required /></FRow>
              <FRow label="Fecha de ingreso *"><input type="date" value={form.hireDate} onChange={set('hireDate')} required /></FRow>
              <FRow label="Sueldo básico * (ARS)"><input type="number" min="0" value={form.baseSalary} onChange={set('baseSalary')} required /></FRow>
              <FRow label="Tipo de contratación">
                <select value={form.employmentType} onChange={set('employmentType')}>
                  <option value="permanent">Permanente</option>
                  <option value="temporary">Temporal</option>
                  <option value="trainee">Pasante</option>
                </select>
              </FRow>
              <FRow label="Jornada">
                <select value={form.workSchedule} onChange={set('workSchedule')}>
                  <option value="full_time">Tiempo completo</option>
                  <option value="part_time">Tiempo parcial</option>
                  <option value="other">Otro</option>
                </select>
              </FRow>
              <FRow label="Categoría laboral"><input value={form.category} onChange={set('category')} placeholder="Ej: Empleado A" /></FRow>
              <FRow label="Convenio colectivo"><input value={form.convention} onChange={set('convention')} placeholder="Ej: CCT 589/10" /></FRow>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear perfil</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Panel>
  );
}

// ── Liquidaciones ─────────────────────────────────────────────

function LiquidationsTab({ ctx }: { ctx: any }) {
  const { run } = ctx;
  const [liquidations, setLiquidations] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [createForm, setCreateForm] = useState({ employeeId: '', period: '', liquidationType: 'monthly' });
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [approveConfirm, setApproveConfirm] = useState<any>(null);

  async function load() {
    const [lr, er] = await Promise.all([adminApi.payroll.listLiquidations(), adminApi.employees.list()]);
    setLiquidations(lr.data?.liquidations || []);
    setEmployees(er.data?.employees || []);
    setLoaded(true);
  }

  if (!loaded) { load(); return <Panel title="Liquidaciones" icon={FileText}><div className="skeleton-line" /></Panel>; }

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    try {
      await run(() => adminApi.payroll.createDraft(createForm));
      setNotice({ type: 'ok', text: 'Borrador creado.' });
      setShowCreate(false);
      setLoaded(false);
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Error al crear borrador.' });
    }
  }

  async function calculate(liq: any) {
    try {
      await run(() => adminApi.payroll.calculate(idOf(liq), { calculationProvider: 'internal' }));
      setLoaded(false);
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Error al calcular.' });
    }
  }

  async function confirmApprove() {
    if (!approveConfirm) return;
    try {
      await run(() => adminApi.payroll.approve(idOf(approveConfirm)));
      setApproveConfirm(null);
      setLoaded(false);
    } catch (err: any) {
      setNotice({ type: 'error', text: (err as any)?.code === 'DUPLICATE_EXPENSE_WARNING' ? 'Ya existe un gasto contable para este empleado/período. Revisá el módulo Sueldos antes de aprobar.' : err?.message || 'Error al aprobar.' });
      setApproveConfirm(null);
    }
  }

  async function generateReceipt(liq: any) {
    try {
      const res = await adminApi.payroll.generateReceiptPdf(idOf(liq));
      if (res.data?.receiptPdfUrl) window.open(res.data.receiptPdfUrl, '_blank');
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || 'Error al generar recibo.' });
    }
  }

  const setCreate = (k: keyof typeof createForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setCreateForm(f => ({ ...f, [k]: e.target.value }));

  const statusTone: Record<string, string> = { draft: '', calculated: 'warn', approved: 'pos', paid: 'pos', cancelled: 'neg' };

  const statusFilter: GridFilter = {
    key: 'status',
    label: 'Estado',
    allLabel: 'Todos',
    options: Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
    match: (row: any, value) => row.status === value,
  };

  const columns: Array<[string, (r: Record<string, unknown>) => React.ReactNode]> = [
    ['Empleado', (r: any) => r.employee?.name || '—'],
    ['Período', (r: any) => r.period],
    ['Tipo', (r: any) => TYPE_LABELS[r.liquidationType] || r.liquidationType],
    ['Neto', (r: any) => money(r.netPay)],
    ['Estado', (r: any) => <span className={`pill ${statusTone[r.status] || ''}`}><span className="d" />{STATUS_LABELS[r.status] || r.status}</span>],
    ['', (r: any) => (
      <Actions>
        {r.status === 'draft'      && <button onClick={() => calculate(r)} title="Calcular"><Calculator size={14} /></button>}
        {r.status === 'calculated' && <button onClick={() => setApproveConfirm(r)} title="Aprobar"><CheckCircle2 size={14} /></button>}
        {['approved', 'paid'].includes(r.status) && <button onClick={() => generateReceipt(r)} title="Recibo PDF"><Download size={14} /></button>}
        <button onClick={() => setSelected(r)} title="Ver detalle"><FileText size={14} /></button>
      </Actions>
    )],
  ];

  return (
    <Panel
      title="Liquidaciones"
      icon={FileText}
      action={<button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> Nueva liquidación</button>}
    >
      {notice && (
        <div className={`notice notice-${notice.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {notice.text}
          <button onClick={() => setNotice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={12} /></button>
        </div>
      )}

      {liquidations.length === 0
        ? <Empty text="Sin liquidaciones. Creá la primera para este período." />
        : <Table rows={liquidations as any} columns={columns} filters={[statusFilter]} />
      }

      {/* Modal crear borrador */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header"><h2>Nueva liquidación</h2><button onClick={() => setShowCreate(false)}><X size={18} /></button></div>
            <form onSubmit={createDraft} style={{ display: 'grid', gap: 14 }}>
              <FRow label="Empleado *">
                <select value={createForm.employeeId} onChange={setCreate('employeeId')} required>
                  <option value="">Seleccioná empleado</option>
                  {employees.filter((e: any) => e.isActive).map((e: any) => (
                    <option key={idOf(e)} value={idOf(e)}>{e.name}</option>
                  ))}
                </select>
              </FRow>
              <FRow label="Período * (YYYY-MM)"><input value={createForm.period} onChange={setCreate('period')} placeholder="2025-06" pattern="\d{4}-\d{2}" required /></FRow>
              <FRow label="Tipo">
                <select value={createForm.liquidationType} onChange={setCreate('liquidationType')}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </FRow>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Crear borrador</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmación aprobación con disclaimer */}
      {approveConfirm && (
        <div className="modal-overlay" onClick={() => setApproveConfirm(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header"><h2>Aprobar liquidación</h2><button onClick={() => setApproveConfirm(null)}><X size={18} /></button></div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: '12px 16px', fontSize: 13 }}>
                <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6, color: '#856404' }} />
                <strong>Atención:</strong> Esta liquidación es un borrador asistido. Debe ser revisada por un contador o liquidador habilitado antes de considerarse oficial. GestionAr no reemplaza el asesoramiento profesional.
              </div>
              <div style={{ fontSize: 14 }}>
                <strong>Empleado:</strong> {approveConfirm.employee?.name || '—'}<br />
                <strong>Período:</strong> {approveConfirm.period}<br />
                <strong>Neto calculado:</strong> {money(approveConfirm.netPay)}
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn-secondary" onClick={() => setApproveConfirm(null)}>Cancelar</button>
                <button className="btn-primary" onClick={confirmApprove}>Confirmar aprobación</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal detalle de liquidación */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <h2>Liquidación — {selected.employee?.name} — {selected.period}</h2>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>Tipo</div><div>{TYPE_LABELS[selected.liquidationType] || selected.liquidationType}</div></div>
                <div><div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>Estado</div><span className={`pill ${statusTone[selected.status] || ''}`}><span className="d" />{STATUS_LABELS[selected.status] || selected.status}</span></div>
                <div><div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase' }}>Versión reglas</div><div style={{ fontFamily: 'monospace', fontSize: 12 }}>{selected.ruleVersion || '—'}</div></div>
              </div>

              {selected.itemsSnapshot?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#9ca3af', textTransform: 'uppercase' }}>Ítems</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#1a1a2e', color: '#fff' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Concepto</th>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Tipo</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.itemsSnapshot.map((item: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '7px 10px' }}>{item.label}</td>
                          <td style={{ padding: '7px 10px', fontSize: 12, color: '#6b7280' }}>{ITEM_TYPE_LABELS[item.type] || item.type}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{money(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#f9fafb', borderRadius: 6, padding: '14px 16px' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Bruto remunerativo</div>
                  <div style={{ fontWeight: 600 }}>{money(selected.grossRemunerative)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Total descuentos</div>
                  <div style={{ fontWeight: 600, color: '#dc2626' }}>− {money(selected.deductionsTotal)}</div>
                </div>
                <div style={{ borderTop: '2px solid #1a1a2e', paddingTop: 10, gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Neto a cobrar</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{money(selected.netPay)}</div>
                </div>
              </div>

              {selected.warnings?.length > 0 && (
                <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 4, padding: '10px 14px', fontSize: 12 }}>
                  {selected.warnings.map((w: string, i: number) => <p key={i}>⚠ {w}</p>)}
                </div>
              )}

              {selected.receiptPdfUrl && (
                <a href={selected.receiptPdfUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                  <Download size={14} /> Descargar recibo PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
