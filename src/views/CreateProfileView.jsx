import { useForm } from 'react-hook-form'
import {
  profileNameValidationRules,
  requiredPinValidationRules,
} from '../validations/profiles.js'

export default function CreateProfileView({
  busy,
  error,
  onLogout,
  onSubmit,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const pinField = register('bootstrapPin', requiredPinValidationRules)

  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="eyebrow">PRIMER PASO</p>
        <h1>Crea tu perfil</h1>
        <p className="muted">Elige un nombre y un PIN de 4 dígitos para protegerlo.</p>
        <label>
          Nombre del perfil
          <input
            maxLength="50"
            aria-invalid={Boolean(errors.profileName)}
            aria-describedby={errors.profileName ? 'create-profile-name-error' : undefined}
            {...register('profileName', profileNameValidationRules)}
          />
          {errors.profileName && (
            <span className="validation-error" id="create-profile-name-error" role="alert">
              {errors.profileName.message}
            </span>
          )}
        </label>
        <label>
          PIN
          <input
            inputMode="numeric"
            maxLength="4"
            aria-invalid={Boolean(errors.bootstrapPin)}
            aria-describedby={errors.bootstrapPin ? 'create-profile-pin-error' : undefined}
            {...pinField}
            onChange={(event) => {
              event.target.value = event.target.value.replace(/\D/g, '').slice(0, 4)
              pinField.onChange(event)
            }}
          />
          {errors.bootstrapPin && (
            <span className="validation-error" id="create-profile-pin-error" role="alert">
              {errors.bootstrapPin.message}
            </span>
          )}
        </label>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button full-width" type="submit" disabled={busy}>
          {busy ? 'Creando perfil…' : 'Crear y continuar'}
        </button>
        <button type="button" className="text-button back-button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </form>
    </main>
  )
}
