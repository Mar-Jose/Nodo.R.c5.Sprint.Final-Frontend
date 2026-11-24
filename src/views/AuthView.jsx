export default function AuthView({
  busy,
  email,
  error,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onToggleRegister,
  password,
  registering,
}) {
  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
      <form className="auth-card" onSubmit={onSubmit}>
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
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete={registering ? 'new-password' : 'current-password'}
            minLength="8"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            required
          />
          {registering && <span className="field-note">Mínimo 8 caracteres.</span>}
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
