import { useForm } from 'react-hook-form'
import { emailValidationRules, passwordValidationRules } from '../validations/auth.js'

export default function AuthView({
  busy,
  error,
  onSubmit,
  onToggleRegister,
  registering,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
      <form className="auth-card" onSubmit={handleSubmit(onSubmit)} noValidate>
        <p className="eyebrow">TU PRÓXIMA HISTORIA</p>
        <h1>{registering ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
        <p className="muted">
          {registering ? 'Un lugar para guardar lo que quieres ver.' : 'Inicia sesión para continuar.'}
        </p>
        <label>
          Correo electrónico
          <input
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'auth-email-error' : undefined}
            {...register('email', emailValidationRules)}
          />
          {errors.email && (
            <span className="validation-error" id="auth-email-error" role="alert">
              {errors.email.message}
            </span>
          )}
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete={registering ? 'new-password' : 'current-password'}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'auth-password-error' : undefined}
            {...register('password', passwordValidationRules)}
          />
          {registering && <span className="field-note">Mínimo 8 caracteres.</span>}
          {errors.password && (
            <span className="validation-error" id="auth-password-error" role="alert">
              {errors.password.message}
            </span>
          )}
        </label>
        {error && <p className="error-message" role="alert">{error}</p>}
        <button className="primary-button full-width" type="submit" disabled={busy}>
          {busy ? 'Un momento…' : registering ? 'Crear cuenta' : 'Iniciar sesión'}
        </button>
        <p className="switch-auth">
          {registering ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}
          {' '}
          <button type="button" className="text-button" onClick={onToggleRegister}>
            {registering ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </form>
      <p className="auth-footer">Tu cine, a tu manera.</p>
    </main>
  )
}
