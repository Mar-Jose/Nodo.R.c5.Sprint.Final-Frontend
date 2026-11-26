import { useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  avatarUrlValidationRules,
  optionalPinValidationRules,
  profileNameValidationRules,
  profileTypeValidationRules,
  requiredPinValidationRules,
} from '../validations/profiles.js'

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

export default function ProfileManagementView({
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyForm })

  const pinField = register(
    'pin',
    editingId ? optionalPinValidationRules : requiredPinValidationRules,
  )

  const resetForm = () => {
    setEditingId(null)
    reset(emptyForm)
    setError('')
  }

  const editProfile = (profile) => {
    setEditingId(profileId(profile))
    reset({
      name: profile.name || '',
      type: profile.type || 'adult',
      avatar: profile.avatar || '',
      pin: '',
    })
    setError('')
  }

  const submitProfile = async (formValues) => {
    setSaving(true)
    setError('')

    const data = {
      name: formValues.name,
      type: formValues.type,
      avatar: formValues.avatar.trim(),
    }
    if (formValues.pin) data.pin = formValues.pin

    try {
      if (editingId) {
        await onUpdate(editingId, data)
      } else {
        await onCreate({ ...data, pin: formValues.pin })
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
        <form className="profile-management-form" onSubmit={handleSubmit(submitProfile)} noValidate>
          <h2>{editingId ? 'Editar perfil' : 'Crear perfil'}</h2>
          <label>
            Nombre
            <input
              maxLength="50"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'managed-profile-name-error' : undefined}
              {...register('name', profileNameValidationRules)}
            />
            {errors.name && (
              <span className="validation-error" id="managed-profile-name-error" role="alert">
                {errors.name.message}
              </span>
            )}
          </label>
          <label>
            Tipo de perfil
            <select
              {...register('type', profileTypeValidationRules)}
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
              aria-invalid={Boolean(errors.avatar)}
              aria-describedby={errors.avatar ? 'managed-profile-avatar-error' : undefined}
              {...register('avatar', avatarUrlValidationRules)}
            />
            {errors.avatar && (
              <span className="validation-error" id="managed-profile-avatar-error" role="alert">
                {errors.avatar.message}
              </span>
            )}
          </label>
          <label>
            PIN {editingId ? '(déjalo vacío para conservarlo)' : ''}
            <input
              inputMode="numeric"
              maxLength="4"
              aria-invalid={Boolean(errors.pin)}
              aria-describedby={errors.pin ? 'managed-profile-pin-error' : undefined}
              {...pinField}
              onChange={(event) => {
                event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4)
                pinField.onChange(event)
              }}
            />
            {errors.pin && (
              <span className="validation-error" id="managed-profile-pin-error" role="alert">
                {errors.pin.message}
              </span>
            )}
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
