import { useForm } from 'react-hook-form'
import { requiredPinValidationRules } from '../validations/profiles.js'

const PROFILE_TYPE_LABELS = {
  adult: 'Adulto',
  child: 'Infantil',
  family: 'Familiar',
}

export default function ProfileSelectionView({
  busy,
  error,
  loading,
  onActivate,
  onChooseProfile,
  onLogout,
  onRetry,
  profiles,
  profilesError,
  selectedProfile,
  getProfileId,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm()

  const pinField = register('pin', requiredPinValidationRules)

  return (
    <main className="profile-page">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
        <button className="text-button" type="button" onClick={onLogout}>Cerrar sesión</button>
      </header>
      <section className="profile-content">
        <p className="eyebrow">¿QUIÉN ESTÁ VIENDO?</p>
        <h1>Elige tu perfil</h1>
        <p className="muted">Cada perfil tiene su propia lista y recomendaciones.</p>
        <div className="profile-grid" aria-live="polite">
          {loading ? (
            <p className="profile-state">Cargando tus perfiles…</p>
          ) : profiles.map((profile) => (
            <button
              className={`profile-card ${getProfileId(selectedProfile) === getProfileId(profile) ? 'selected' : ''}`}
              key={getProfileId(profile)}
              type="button"
              aria-pressed={getProfileId(selectedProfile) === getProfileId(profile)}
              onClick={() => {
                reset({ pin: '' })
                onChooseProfile(profile)
              }}
            >
              <span className={`avatar avatar-${profile.type}`}>
                {profile.avatar
                  ? <img src={profile.avatar} alt="" />
                  : profile.name?.slice(0, 1).toUpperCase()}
              </span>
              <span>{profile.name}</span>
              <small>{PROFILE_TYPE_LABELS[profile.type] || 'Otro'}</small>
            </button>
          ))}
        </div>
        {selectedProfile && (
          <form className="pin-form" onSubmit={handleSubmit(onActivate)} noValidate>
            <label htmlFor="profile-pin">PIN de {selectedProfile.name}</label>
            <div className="pin-row">
              <input
                id="profile-pin"
                inputMode="numeric"
                maxLength="4"
                autoFocus
                aria-invalid={Boolean(errors.pin)}
                aria-describedby={errors.pin ? 'profile-pin-error' : undefined}
                {...pinField}
                onChange={(event) => {
                  event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4)
                  pinField.onChange(event)
                }}
              />
              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? 'Verificando…' : 'Entrar'}
              </button>
            </div>
            {errors.pin && (
              <span className="validation-error" id="profile-pin-error" role="alert">
                {errors.pin.message}
              </span>
            )}
          </form>
        )}
        {profilesError && (
          <div className="profile-load-error">
            <p className="error-message centered" role="alert">{profilesError}</p>
            <button type="button" className="text-button" onClick={onRetry}>
              Reintentar
            </button>
          </div>
        )}
        {error && <p className="error-message centered" role="alert">{error}</p>}
        <button type="button" className="text-button manage-link" onClick={onLogout}>
          Cambiar de cuenta
        </button>
      </section>
    </main>
  )
}
