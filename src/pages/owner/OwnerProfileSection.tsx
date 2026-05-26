import { FormEvent, useState } from 'react';
import { KeyRound, Save, User } from 'lucide-react';
import { ownerApi } from '../../services/ownerService';
import type { Membership, SessionUser } from '../../types/api';

type Props = {
  user: SessionUser | null;
  membership: Membership | null;
  onUserUpdate: (u: SessionUser) => void;
};

export function OwnerProfileSection({ user, membership, onUserUpdate }: Props) {
  const [profileNotice, setProfileNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwdNotice, setPwdNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  const ownerId = user?._id || user?.id;
  const orgName = (typeof membership?.organization === 'string'
    ? null
    : (membership?.organization as any)?.name) ?? '';

  async function handleProfileSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!ownerId) return;
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    if (!name) {
      setProfileNotice({ type: 'error', text: 'El nombre no puede estar vacío.' });
      return;
    }
    setSavingProfile(true);
    setProfileNotice(null);
    try {
      const res = await ownerApi.profile.update(ownerId, { name, phone });
      const updated = res?.data?.owner || res?.data?.user;
      if (updated) onUserUpdate({ ...user!, name: updated.name });
      setProfileNotice({ type: 'ok', text: 'Datos actualizados correctamente.' });
    } catch (err) {
      setProfileNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo guardar.' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const currentPassword = String(fd.get('currentPassword') || '');
    const newPassword = String(fd.get('newPassword') || '');
    const confirmPassword = String(fd.get('confirmPassword') || '');
    if (!currentPassword || !newPassword) {
      setPwdNotice({ type: 'error', text: 'Completá todos los campos.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdNotice({ type: 'error', text: 'Las contraseñas nuevas no coinciden.' });
      return;
    }
    if (newPassword.length < 6) {
      setPwdNotice({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setSavingPwd(true);
    setPwdNotice(null);
    try {
      await ownerApi.profile.updatePassword({ currentPassword, newPassword });
      setPwdNotice({ type: 'ok', text: 'Contraseña actualizada correctamente.' });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setPwdNotice({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.' });
    } finally {
      setSavingPwd(false);
    }
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700 }}>Mi perfil</h2>

      <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

        {/* Profile data */}
        <section className="card">
          <div className="card-h">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <User size={17} color="var(--green)" />
              <h3 style={{ margin: 0 }}>Datos personales</h3>
            </div>
          </div>
          <div className="card-body">
            {profileNotice && (
              <div className={`admin-notice ${profileNotice.type}`} style={{ marginBottom: 14 }}>{profileNotice.text}</div>
            )}
            <form onSubmit={handleProfileSave} style={{ display: 'grid', gap: 14 }}>
              <label className="admin-field">
                <span>Nombre completo</span>
                <input name="name" defaultValue={user?.name || ''} required placeholder="Tu nombre" />
              </label>
              <label className="admin-field">
                <span>Correo electrónico</span>
                <input value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
              </label>
              {orgName && (
                <label className="admin-field">
                  <span>Organización</span>
                  <input value={orgName} disabled style={{ opacity: 0.6 }} />
                </label>
              )}
              <button type="submit" disabled={savingProfile} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <Save size={14} />
                {savingProfile ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          </div>
        </section>

        {/* Password */}
        <section className="card">
          <div className="card-h">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <KeyRound size={17} color="var(--green)" />
              <h3 style={{ margin: 0 }}>Cambiar contraseña</h3>
            </div>
          </div>
          <div className="card-body">
            {pwdNotice && (
              <div className={`admin-notice ${pwdNotice.type}`} style={{ marginBottom: 14 }}>{pwdNotice.text}</div>
            )}
            <form onSubmit={handlePasswordSave} style={{ display: 'grid', gap: 14 }}>
              <label className="admin-field">
                <span>Contraseña actual</span>
                <input name="currentPassword" type="password" required placeholder="••••••••" />
              </label>
              <label className="admin-field">
                <span>Nueva contraseña</span>
                <input name="newPassword" type="password" required placeholder="••••••••" minLength={6} />
              </label>
              <label className="admin-field">
                <span>Confirmar nueva contraseña</span>
                <input name="confirmPassword" type="password" required placeholder="••••••••" />
              </label>
              <button type="submit" disabled={savingPwd} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                <KeyRound size={14} />
                {savingPwd ? 'Actualizando…' : 'Actualizar contraseña'}
              </button>
            </form>
          </div>
        </section>

      </div>
    </div>
  );
}
