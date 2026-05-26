import { AlertTriangle, Bell, CalendarDays, FileText, Mail, Megaphone, MessageSquare, Paperclip, Plus, RefreshCw, X } from 'lucide-react';
import { adminApi } from '../../services/adminService';
import { Table } from '../../components/Table';
import { Empty, Field, Metric, SelectField, Status } from './adminComponents';
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS, dateLabel, idOf, toLocalInput } from './adminFormat';

type AdminNoticesSectionProps = { ctx: any };

export function AdminNoticesSection({ ctx }: AdminNoticesSectionProps) {
  const {
    moduleEnabled, normalizedNotices, noticeTemplates, config, openNoticeComposer,
    filteredNotices, noticeFilters, setNoticeFilters, noticeStats,
    refresh, tab, noticeCounts, loading, showNoticeModal, editingNotice,
    setShowNoticeModal, setEditingNotice, setNoticeFiles, submitNotice, applyTemplateToForm,
    noticeTargetType, setNoticeTargetType, units, owners, noticeFiles, busy,
    showTemplateModal, setShowTemplateModal, editingTemplate, setEditingTemplate,
    submitTemplate, run, showNoticeStats, downloadNoticeAttachment
  } = ctx;

  return (
          <>
            <div className="admin-page-head">
              <div>
                <div className="admin-page-kicker"><span className="dot" />Comunidad</div>
                <h1 className="admin-page-title">Comunicados</h1>
                <div className="admin-page-sub">{normalizedNotices.length} comunicados · {noticeTemplates.length} plantillas · {config?.consortiumName || 'Tu organización'}</div>
              </div>
              <div className="admin-page-actions">
                <button className="btn btn-ghost" onClick={() => refresh(tab)}><RefreshCw size={14} />Actualizar</button>
                <button className="btn btn-ghost" onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }}><FileText size={14} />Plantilla</button>
                <button className="btn btn-primary" onClick={() => openNoticeComposer()}><Megaphone size={14} />Nuevo comunicado</button>
              </div>
            </div>
            {moduleEnabled('notices') ? (
              <div className="com-layout">
                <div className="com-main" style={{ gridColumn: '1 / -1' }}>
                  <div className="metric-grid" style={{ marginBottom: 14 }}>
                    <Metric label="Enviados" value={noticeCounts.sent || 0} icon={Megaphone} />
                    <Metric label="Programados" value={noticeCounts.scheduled || 0} icon={CalendarDays} />
                    <Metric label="Borradores" value={noticeCounts.draft || 0} icon={FileText} />
                    <Metric label="Urgentes" value={noticeCounts.urgent || 0} icon={AlertTriangle} />
                  </div>
                  <div className="admin-card" style={{ marginBottom: 14 }}>
                    <div className="admin-form" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
                      <label className="admin-field"><span>Estado</span><select value={noticeFilters.status} onChange={(e) => setNoticeFilters((f: any) => ({ ...f, status: e.target.value }))}>
                        <option value="all">Todos</option>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select></label>
                      <label className="admin-field"><span>Categoría</span><select value={noticeFilters.category} onChange={(e) => setNoticeFilters((f: any) => ({ ...f, category: e.target.value }))}>
                        <option value="all">Todas</option>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select></label>
                      <label className="admin-field"><span>Prioridad</span><select value={noticeFilters.priority} onChange={(e) => setNoticeFilters((f: any) => ({ ...f, priority: e.target.value }))}>
                        <option value="all">Todas</option>
                        {Object.entries(PRIORITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                      </select></label>
                      <label className="admin-field"><span>Buscar</span><input value={noticeFilters.search} onChange={(e) => setNoticeFilters((f: any) => ({ ...f, search: e.target.value }))} placeholder="Título, asunto o texto" /></label>
                    </div>
                  </div>
                  {loading ? (
                    <Empty text="Cargando comunicados…" />
                  ) : !filteredNotices.length ? (
                    <Empty text="No hay comunicados publicados." />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {filteredNotices.map((n: any) => (
                        <div key={idOf(n)} className="notice-card">
                          <div className="notice-card-head">
                            <Status value={n.status === 'sent' ? 'approved' : n.status === 'scheduled' ? 'pending' : n.status === 'cancelled' ? 'rejected' : 'neutral'} />
                            <span className="notice-card-tag">{STATUS_LABELS[n.status] || n.status}</span>
                            <span className="notice-card-tag">{CATEGORY_LABELS[n.category] || n.category}</span>
                            <span className="notice-card-tag">{PRIORITY_LABELS[n.priority] || n.priority}</span>
                            <span className="notice-card-date">{dateLabel(n.sentAt || n.scheduledAt || n.createdAt)}</span>
                          </div>
                          <h3 className="notice-card-title">{n.title}</h3>
                          <div className="notice-card-date">{n.subject}</div>
                          {n.body && <p className="notice-card-body">{n.body}</p>}
                          {n.attachments?.length > 0 && (
                            <div className="notice-card-attachments">
                              {n.attachments.map((a: any, i: number) => (
                                <button key={i} className="notice-attach-chip" type="button"
                                  onClick={() => downloadNoticeAttachment(idOf(n), i, a.filename || `adjunto-${i + 1}`)}>
                                  {a.mimetype?.startsWith('image/') ? <span>🖼️</span> : <Paperclip size={11} />}
                                  <span>{a.filename?.length > 28 ? a.filename.slice(0, 27) + '…' : a.filename || `Adjunto ${i + 1}`}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="notice-card-date">
                            Destinatarios: {n.targetType === 'non_debtors' ? 'Propietarios al día' : n.targetType === 'debtors' ? 'Morosos' : n.targetType === 'specific_units' ? 'Unidades específicas' : n.targetType === 'specific_users' ? 'Propietarios específicos' : 'Todos'} ·
                            Canales: App{n.channels?.email ? ' · Email' : ''}{n.channels?.push ? ' · Push' : ''}{n.channels?.whatsapp ? ' · WhatsApp futuro' : ''}
                          </div>
                          {noticeStats[idOf(n)] && (
                            <div className="notice-card-date">
                              {noticeStats[idOf(n)].loading ? 'Cargando métricas…' : noticeStats[idOf(n)].error ? 'No se pudieron cargar métricas.' : `Lectura: ${noticeStats[idOf(n)].readCount || 0}/${noticeStats[idOf(n)].totalRecipients || 0} (${noticeStats[idOf(n)].readPercentage || 0}%)`}
                            </div>
                          )}
                          <div className="notice-card-foot">
                            <button className="btn btn-ghost btn-sm" onClick={() => showNoticeStats(n)}>Métricas</button>
                            {['draft', 'scheduled'].includes(n.status) && <button className="btn btn-ghost btn-sm" onClick={() => openNoticeComposer(n)}>Editar</button>}
                            <button className="btn btn-ghost btn-sm" onClick={() => openNoticeComposer({ ...n, _id: undefined, id: undefined, title: `${n.title} (copia)`, status: 'draft', scheduledAt: '' })}>Duplicar</button>
                            {n.status !== 'sent' && n.status !== 'cancelled' && <button className="btn btn-primary btn-sm" onClick={() => run(idOf(n), () => adminApi.notices.sendNow(idOf(n)), 'Comunicado enviado.')}>Enviar ahora</button>}
                            {n.status === 'scheduled' && <button className="btn btn-ghost btn-sm" onClick={() => run(idOf(n), () => adminApi.notices.cancel(idOf(n)), 'Comunicado cancelado.')}>Cancelar</button>}
                            <button className="btn btn-ghost btn-sm" onClick={() => run(idOf(n), () => adminApi.notices.delete(idOf(n)), 'Comunicado eliminado.')}>Eliminar</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : <Empty text="El módulo de comunicados no está habilitado para esta organización." />}

            {showNoticeModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) { setShowNoticeModal(false); setNoticeFiles([]); } }}>
                  <div className="form-modal form-modal--wide">
                    <div className="form-modal-head">
                    <div className="form-modal-title"><Megaphone size={16} />{idOf(editingNotice) ? 'Editar comunicado' : 'Nuevo comunicado'}</div>
                    <button className="icon-btn" onClick={() => { setShowNoticeModal(false); setNoticeFiles([]); setEditingNotice(null); }}><X size={16} /></button>
                  </div>
                  <form className="admin-form" id="notice-form" onSubmit={submitNotice}>
                    {noticeTemplates.length > 0 && <label className="admin-field full"><span>Plantilla</span><select defaultValue="" onChange={(e) => applyTemplateToForm(e.target.value)}>
                      <option value="">Sin plantilla</option>
                      {noticeTemplates.map((tpl: any) => <option key={idOf(tpl)} value={idOf(tpl)}>{tpl.title}</option>)}
                    </select></label>}
                    <Field label="Título" name="title" required placeholder="Título del comunicado" defaultValue={editingNotice?.title || ''} />
                    <Field label="Asunto" name="subject" required placeholder="Asunto visible para canales" defaultValue={editingNotice?.subject || editingNotice?.title || ''} />
                    <SelectField label="Categoría" name="category" defaultValue={editingNotice?.category || 'general'}>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </SelectField>
                    <SelectField label="Prioridad" name="priority" defaultValue={editingNotice?.priority || 'normal'}>
                      {Object.entries(PRIORITY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </SelectField>
                    <label className="admin-field full"><span>Mensaje</span><textarea name="body" rows={5} required placeholder="Escribí el contenido del comunicado…" maxLength={5000} defaultValue={editingNotice?.body || ''} /></label>
                    <SelectField label="Destinatarios" name="targetType" defaultValue={editingNotice?.targetType || 'all'} onChange={(e: any) => setNoticeTargetType(e.target.value)}>
                      <option value="all">Todos los propietarios</option>
                      <option value="debtors">Morosos</option>
                      <option value="non_debtors">Propietarios al día</option>
                      <option value="specific_units">Unidades específicas</option>
                      <option value="specific_users">Propietarios específicos</option>
                    </SelectField>
                    <label className="admin-field"><span>Programar</span><input type="datetime-local" name="scheduledAt" defaultValue={toLocalInput(editingNotice?.scheduledAt)} /></label>
                    {noticeTargetType === 'specific_units' && (
                      <label className="admin-field full"><span>Unidades</span><select name="unitIds" multiple size={5} defaultValue={(editingNotice?.targetFilters?.unitIds || []).map(String)}>
                        {(units || []).map((unit: any) => <option key={idOf(unit)} value={idOf(unit)}>{unit.name}{unit.owner?.name ? ` · ${unit.owner.name}` : ''}</option>)}
                      </select></label>
                    )}
                    {noticeTargetType === 'specific_users' && (
                      <label className="admin-field full"><span>Propietarios</span><select name="userIds" multiple size={5} defaultValue={(editingNotice?.targetFilters?.userIds || []).map(String)}>
                        {(owners || []).map((owner: any) => <option key={idOf(owner)} value={idOf(owner)}>{owner.name} · {owner.email}</option>)}
                      </select></label>
                    )}
                    <div className="admin-field full">
                      <span>Adjuntos <small style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional · máx. 3 archivos · 10 MB c/u)</small></span>
                      <input type="file" id="n-files-input" accept="image/*,.pdf" multiple style={{ display: 'none' }}
                        onChange={(e) => {
                          const incoming = Array.from(e.target.files || []) as File[];
                          setNoticeFiles((prev: File[]) => {
                            const remaining = 3 - prev.length;
                            return [...prev, ...incoming.slice(0, remaining)];
                          });
                          e.target.value = '';
                        }}
                      />
                      {noticeFiles.length < 3 && (
                        <div className="notice-attach-zone" onClick={() => document.getElementById('n-files-input')?.click()}>
                          <Paperclip size={16} style={{ color: 'var(--muted)' }} />
                          <span style={{ fontSize: 13, color: 'var(--text)' }}>Adjuntar imágenes o PDF</span>
                          <small style={{ color: 'var(--muted)', fontSize: 11 }}>Clic para seleccionar</small>
                        </div>
                      )}
                      {noticeFiles.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                          {noticeFiles.map((f: File, i: number) => (
                            <div key={i} className="notice-attach-chip notice-attach-chip--local">
                              <span>{f.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                              <span>{f.name.length > 24 ? f.name.slice(0, 23) + '…' : f.name}</span>
                              <span style={{ color: 'var(--muted)', fontSize: 10 }}>({(f.size / 1024).toFixed(0)} KB)</span>
                              <button type="button" className="notice-attach-chip-remove"
                                onClick={() => setNoticeFiles((prev: File[]) => prev.filter((_: File, j: number) => j !== i))}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="admin-field full">
                      <span>Canales</span>
                      <div className="notice-checks-row">
                        <label className="notice-check-pill">
                          <input type="checkbox" checked readOnly />
                          <Megaphone size={13} />
                          <span>App</span>
                        </label>
                        <label className="notice-check-pill">
                          <input type="checkbox" name="email" defaultChecked={!!editingNotice?.channels?.email} />
                          <Mail size={13} />
                          <span>Email opcional</span>
                        </label>
                        <label className="notice-check-pill">
                          <input type="checkbox" name="push" defaultChecked={!!editingNotice?.channels?.push} />
                          <Bell size={13} />
                          <span>Push opcional</span>
                        </label>
                        <label className="notice-check-pill">
                          <input type="checkbox" name="whatsapp" defaultChecked={!!editingNotice?.channels?.whatsapp} />
                          <MessageSquare size={13} />
                          <span>WhatsApp <small style={{ color: 'var(--muted)', fontSize: 10 }}>(futuro)</small></span>
                        </label>
                      </div>
                    </div>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowNoticeModal(false); setNoticeFiles([]); setEditingNotice(null); }}>Cancelar</button>
                      <button className="btn btn-ghost" name="action" value="draft" disabled={busy === 'notice'}><FileText size={14} />Guardar borrador</button>
                      <button className="btn btn-ghost" name="action" value="schedule" disabled={busy === 'notice'}><CalendarDays size={14} />Programar</button>
                      <button className="btn btn-primary" name="action" value="send" disabled={busy === 'notice'}><Megaphone size={14} />Enviar ahora</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            {showTemplateModal && (
              <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) { setShowTemplateModal(false); setEditingTemplate(null); } }}>
                <div className="form-modal form-modal--wide">
                  <div className="form-modal-head">
                    <div className="form-modal-title"><FileText size={16} />{editingTemplate ? 'Editar plantilla' : 'Nueva plantilla'}</div>
                    <button className="icon-btn" onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); }}><X size={16} /></button>
                  </div>
                  <form className="admin-form" onSubmit={submitTemplate}>
                    <Field label="Título" name="title" required defaultValue={editingTemplate?.title || ''} />
                    <Field label="Asunto" name="subject" required defaultValue={editingTemplate?.subject || ''} />
                    <SelectField label="Categoría" name="category" defaultValue={editingTemplate?.category || 'general'}>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </SelectField>
                    <label className="admin-field full"><span>Mensaje</span><textarea name="body" rows={5} required defaultValue={editingTemplate?.body || ''} /></label>
                    <div className="form-modal-foot">
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); }}>Cancelar</button>
                      {editingTemplate && <button type="button" className="btn btn-ghost" onClick={() => run(idOf(editingTemplate), () => adminApi.noticeTemplates.delete(idOf(editingTemplate)), 'Plantilla eliminada.').then(() => { setShowTemplateModal(false); setEditingTemplate(null); })}>Eliminar</button>}
                      <button className="btn btn-primary" disabled={busy === 'notice-template'}>Guardar plantilla</button>
                    </div>
                  </form>
                  {!editingTemplate && noticeTemplates.length > 0 && <div className="notice-card-attachments" style={{ marginTop: 12 }}>
                    {noticeTemplates.map((tpl: any) => <button key={idOf(tpl)} className="notice-attach-chip" type="button" onClick={() => setEditingTemplate(tpl)}>{tpl.title}</button>)}
                  </div>}
                </div>
              </div>
            )}
          </>
  );
}
