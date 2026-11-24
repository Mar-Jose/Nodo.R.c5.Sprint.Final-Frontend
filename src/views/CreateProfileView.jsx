export default function CreateProfileView({
  bootstrapPin,
  busy,
  error,
  onBootstrapPinChange,
  onLogout,
  onProfileNameChange,
  onSubmit,
  profileName,
}) {
  return (
    <main className="auth-page">
      <a className="brand auth-brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
      <form className="auth-card" onSubmit={onSubmit}>
        <p className="eyebrow">PRIMER PASO</p>
        <h1>Crea tu perfil</h1>
        <p className="muted">Elige un nombre y un PIN de 4 dígitos para protegerlo.</p>
        <label>
          Nombre del perfil
          <input
            value={profileName}
            onChange={(event) => onProfileNameChange(event.target.value)}
            minLength="2"
            maxLength="50"
            required
          />
        </label>
        <label>
          PIN
          <input
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength="4"
            value={bootstrapPin}
            onChange={(event) => onBootstrapPinChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
            required
          />
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
