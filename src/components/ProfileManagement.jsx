import { useState } from 'react'

const PROFILE_TYPE_LABELS = {
  adult: 'Adulto',
  child: 'Infantil',
  family: 'Familiar',
}

const profileId = (profile) => profile?._id || profile?.id

const emptyForm = {
  name: '',
  type: 'adult',
  avatar: '',
  pin: '',
}

export default function ProfileManagement({
  activeProfileId,
  loading,
  loadError,
  onBack,
  onCreate,
  onDelete,
  onRetry,
  onUpdate,
  profiles,
}) {
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const editProfile = (profile) => {
    setEditingId(profileId(profile))
    setForm({
      name: profile.name || '',
      type: profile.type || 'adult',
      avatar: profile.avatar || '',
      pin: '',
    })
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const data = {
      name: form.name.trim(),
      type: form.type,
      avatar: form.avatar.trim(),
    }
    if (form.pin) data.pin = form.pin

    try {
      if (editingId) {
        await onUpdate(editingId, data)
      } else {
        await onCreate({ ...data, pin: form.pin })
      }
      resetForm()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteProfile = async (profile) => {
    if (!window.confirm(`¿Eliminar el perfil de ${profile.name}?`)) return
    setSaving(true)
    setError('')
    try {
      await onDelete(profileId(profile))
      if (String(editingId) === String(profileId(profile))) resetForm()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="profile-management">
      <header className="profile-management-heading">
        <div>
          <p className="eyebrow">CUENTA</p>
          <h1>Administrar perfiles</h1>
          <p className="muted">Crea, edita o elimina perfiles de esta cuenta.</p>
        </div>
        <button className="secondary-button" type="button" onClick={onBack}>
          Volver a descubrir
        </button>
      </header>

      {loadError && (
        <div className="profile-management-error">
          <p className="error-message" role="alert">{loadError}</p>
          <button className="text-button" type="button" onClick={onRetry}>Reintentar</button>
        </div>
      )}

      <div className="profile-management-layout">
        <form className="profile-management-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Editar perfil' : 'Crear perfil'}</h2>
          <label>
            Nombre
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              minLength="2"
              maxLength="50"
              required
            />
          </label>
          <label>
            Tipo de perfil
            <select
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            >
              {Object.entries(PROFILE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Avatar (URL, opcional)
            <input
              type="url"
              value={form.avatar}
              onChange={(event) => setForm((current) => ({ ...current, avatar: event.target.value }))}
            />
          </label>
          <label>
            PIN {editingId ? '(déjalo vacío para conservarlo)' : ''}
            <input
              inputMode="numeric"
              pattern="[0-9]{4}"
              maxLength="4"
              value={form.pin}
              onChange={(event) => setForm((current) => ({
                ...current,
                pin: event.target.value.replace(/\D/g, '').slice(0, 4),
              }))}
              required={!editingId}
            />
          </label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="profile-form-actions">
            <button className="primary-button" type="submit" disabled={saving}>
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear perfil'}
            </button>
            {editingId && (
              <button className="text-button" type="button" onClick={resetForm} disabled={saving}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        <section className="managed-profiles" aria-label="Perfiles de la cuenta">
          <h2>Perfiles existentes</h2>
          {loading ? (
            <p className="profile-management-empty">Cargando perfiles…</p>
          ) : profiles.length ? (
            <ul>
              {profiles.map((profile) => {
                const id = profileId(profile)
                const isActive = String(id) === String(activeProfileId)
                return (
                  <li className="managed-profile" key={id}>
                    <span className={`avatar avatar-${profile.type}`}>
                      {profile.avatar
                        ? <img src={profile.avatar} alt="" />
                        : profile.name?.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="managed-profile-info">
                      <strong>{profile.name}</strong>
                      <small>{PROFILE_TYPE_LABELS[profile.type] || 'Otro'}{isActive ? ' · Activo' : ''}</small>
                    </span>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => editProfile(profile)}
                      disabled={saving}
                    >
                      Editar
                    </button>
                    <button
                      className="text-button danger-button"
                      type="button"
                      onClick={() => deleteProfile(profile)}
                      disabled={saving || isActive}
                      aria-label={`Eliminar perfil de ${profile.name}`}
                      title={isActive ? 'No puedes eliminar el perfil activo' : undefined}
                    >
                      Eliminar
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : !loadError ? (
            <p className="profile-management-empty">No hay perfiles para mostrar.</p>
          ) : null}
        </section>
      </div>
    </section>
  )
}
