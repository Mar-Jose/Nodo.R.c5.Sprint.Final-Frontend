import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi, catalogApi, profilesApi, watchlistApi } from './api.js'
import ProfileManagement from './components/ProfileManagement.jsx'
import AppRoutes from './routes/AppRoutes.jsx'
import { getScreenFromPath, ROUTES } from './routes/routeConfig.js'

const SESSION_KEYS = {
  account: 'nodo.accountToken',
  profileToken: 'nodo.profileToken',
  profile: 'nodo.activeProfile',
}

const PROFILE_TYPE_LABELS = {
  adult: 'Adulto',
  child: 'Infantil',
  family: 'Familiar',
}

const getProfileId = (profile) => profile?._id || profile?.id

function readSession() {
  const accountToken = localStorage.getItem(SESSION_KEYS.account)
  const profileToken = localStorage.getItem(SESSION_KEYS.profileToken)
  let profile = null

  try {
    profile = JSON.parse(localStorage.getItem(SESSION_KEYS.profile) || 'null')
  } catch {
    localStorage.removeItem(SESSION_KEYS.profile)
  }

  return {
    accountToken,
    profileToken,
    profile,
  }
}

function plainText(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function App() {
  const [session, setSession] = useState(readSession)
  const navigate = useNavigate()
  const location = useLocation()
  const screen = getScreenFromPath(location.pathname)
  const navigateTo = useCallback(
    (destination, options) => navigate(ROUTES[destination], options),
    [navigate],
  )
  const [profiles, setProfiles] = useState([])
  const [loadingProfiles, setLoadingProfiles] = useState(
    () => Boolean(localStorage.getItem(SESSION_KEYS.account)),
  )
  const [profilesError, setProfilesError] = useState('')
  const [profileLoadAttempt, setProfileLoadAttempt] = useState(0)
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [profilePin, setProfilePin] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profileName, setProfileName] = useState('')
  const [bootstrapPin, setBootstrapPin] = useState('')
  const [registering, setRegistering] = useState(false)
  const [shows, setShows] = useState([])
  const [watchlists, setWatchlists] = useState({})
  const [loadingWatchlist, setLoadingWatchlist] = useState(
    () => Boolean(localStorage.getItem(SESSION_KEYS.profileToken)),
  )
  const [watchlistLoadAttempt, setWatchlistLoadAttempt] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [searchYear, setSearchYear] = useState('')
  const [page, setPage] = useState(0)
  const [details, setDetails] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadingShows, setLoadingShows] = useState(
    () => Boolean(localStorage.getItem(SESSION_KEYS.profileToken)),
  )
  const activeProfileId = getProfileId(session.profile)
  const activeProfileKey = activeProfileId ? String(activeProfileId) : ''
  const watchlist = activeProfileKey ? watchlists[activeProfileKey] || [] : []
  const watchlistReady = Boolean(
    activeProfileKey
    && Object.prototype.hasOwnProperty.call(watchlists, activeProfileKey),
  )

  const saveAccountToken = (token) => {
    localStorage.setItem(SESSION_KEYS.account, token)
    localStorage.removeItem(SESSION_KEYS.profileToken)
    localStorage.removeItem(SESSION_KEYS.profile)
    setProfiles([])
    setWatchlists({})
    setLoadingWatchlist(false)
    setSelectedProfile(null)
    setProfilePin('')
    setLoadingProfiles(true)
    setProfilesError('')
    setSession({ accountToken: token, profileToken: null, profile: null })
    navigateTo('profiles', { replace: true })
  }

  const saveActiveProfile = (token, profile) => {
    localStorage.setItem(SESSION_KEYS.profileToken, token)
    localStorage.setItem(SESSION_KEYS.profile, JSON.stringify(profile))
    setSession((current) => ({ ...current, profileToken: token, profile }))
    navigateTo('catalog', { replace: true })
    setPage(0)
    setSearchText('')
    setLoadingWatchlist(true)
    setLoadingShows(true)
    setError('')
  }

  const handleAuth = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const result = await (registering ? authApi.register : authApi.login)({ email, password })
      saveAccountToken(result.token)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const activateProfile = async (profile, pin, token = session.accountToken) => {
    const result = await profilesApi.activate(token, profile._id || profile.id, pin)
    saveActiveProfile(result.token, result.profile)
  }

  const handleActivateProfile = async (event) => {
    event.preventDefault()
    if (!selectedProfile) return
    setBusy(true)
    setError('')
    try {
      await activateProfile(selectedProfile, profilePin)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleBootstrap = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const profile = await profilesApi.bootstrap(session.accountToken, {
        name: profileName,
        type: 'adult',
        pin: bootstrapPin,
      })
      setProfiles([profile])
      await activateProfile(profile, bootstrapPin)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    if (!searchText.trim()) {
      setError('Escribe el nombre de una serie para buscar.')
      return
    }
    setLoadingShows(true)
    setError('')
    try {
      const result = await catalogApi.search(
        session.profileToken,
        searchText.trim(),
        searchYear,
      )
      setShows(result.results || [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoadingShows(false)
    }
  }

  const loadCatalog = async (nextPage) => {
    setSearchText('')
    setSearchYear('')
    setLoadingShows(true)
    setPage(nextPage)
  }

  useEffect(() => {
    const isProfileSelection = screen === 'profiles'
    const isProfileManagement = screen === 'manage-profiles'
    const isProfileCreation = screen === 'create-profile'
    if (!isProfileSelection && !isProfileManagement && !isProfileCreation) return undefined
    const token = isProfileManagement ? session.profileToken : session.accountToken
    if (!token) return undefined
    let active = true

    profilesApi.list(token)
      .then((data) => {
        if (!active) return
        const list = Array.isArray(data) ? data : []
        setProfiles(list)
        if (isProfileSelection && !list.length) {
          navigateTo('create-profile', { replace: true })
        } else if (isProfileCreation && list.length) {
          navigateTo('profiles', { replace: true })
        }
      })
      .catch((requestError) => {
        if (active) setProfilesError(requestError.message)
      })
      .finally(() => {
        if (active) setLoadingProfiles(false)
      })

    return () => { active = false }
  }, [session.accountToken, session.profileToken, screen, profileLoadAttempt, navigateTo])

  useEffect(() => {
    if (screen !== 'catalog' || !session.profileToken) return undefined
    let active = true
    catalogApi.list(session.profileToken, page)
      .then((data) => {
        if (active) setShows(Array.isArray(data) ? data : [])
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoadingShows(false)
      })
    return () => { active = false }
  }, [screen, session.profileToken, page])

  useEffect(() => {
    if (
      !['catalog', 'watchlist'].includes(screen)
      || !session.profileToken
      || !activeProfileKey
    ) return undefined
    let active = true
    watchlistApi.list(session.profileToken)
      .then((data) => {
        if (active) {
          setWatchlists((current) => ({
            ...current,
            [activeProfileKey]: Array.isArray(data) ? data : [],
          }))
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) {
          setLoadingWatchlist(false)
          setBusy(false)
        }
      })
    return () => { active = false }
  }, [screen, session.profileToken, activeProfileKey, watchlistLoadAttempt])

  const toggleWatchlist = async (show) => {
    if (!watchlistReady) {
      setError('Espera a que la Watchlist del perfil termine de sincronizarse.')
      return
    }

    const savedItem = watchlist.find(
      (item) => String(item.externalId) === String(show.id),
    )
    const profileKey = activeProfileKey
    const profileToken = session.profileToken
    setError('')
    try {
      if (savedItem) {
        await watchlistApi.remove(profileToken, savedItem._id || savedItem.id)
        setWatchlists((current) => ({
          ...current,
          [profileKey]: (current[profileKey] || []).filter(
            (item) => String(item._id || item.id) !== String(savedItem._id || savedItem.id),
          ),
        }))
      } else {
        const added = await watchlistApi.add(profileToken, show)
        setWatchlists((current) => ({
          ...current,
          [profileKey]: [...(current[profileKey] || []), added],
        }))
      }
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const openDetails = async (id) => {
    setDetails({ loading: true, show: null, cast: [], episodes: [], error: '' })
    try {
      const [show, cast, episodes] = await Promise.all([
        catalogApi.details(session.profileToken, id),
        catalogApi.cast(session.profileToken, id),
        catalogApi.episodes(session.profileToken, id),
      ])
      setDetails({ loading: false, show, cast, episodes, error: '' })
    } catch (requestError) {
      setDetails({ loading: false, show: null, cast: [], episodes: [], error: requestError.message })
    }
  }

  const logoutProfile = () => {
    localStorage.removeItem(SESSION_KEYS.profileToken)
    localStorage.removeItem(SESSION_KEYS.profile)
    setSession((current) => ({
      ...current,
      profileToken: null,
      profile: null,
    }))
    navigateTo('profiles', { replace: true })
    setSelectedProfile(null)
    setProfilePin('')
    setLoadingWatchlist(false)
    setError('')
    setProfilesError('')
    setLoadingProfiles(true)
  }

  const retryProfileLoad = () => {
    setLoadingProfiles(true)
    setProfilesError('')
    setProfileLoadAttempt((attempt) => attempt + 1)
  }

  const retryWatchlistLoad = () => {
    setLoadingWatchlist(true)
    setError('')
    setWatchlistLoadAttempt((attempt) => attempt + 1)
  }

  const createManagedProfile = async (profile) => {
    const created = await profilesApi.create(session.profileToken, profile)
    setProfiles((current) => [...current, created])
  }

  const updateManagedProfile = async (id, updates) => {
    const updated = await profilesApi.update(session.profileToken, id, updates)
    setProfiles((current) => current.map((profile) => (
      String(getProfileId(profile)) === String(id) ? updated : profile
    )))

    if (String(getProfileId(session.profile)) === String(id)) {
      localStorage.setItem(SESSION_KEYS.profile, JSON.stringify(updated))
      setSession((current) => ({
        ...current,
        profile: updated,
      }))
      if (updated.type !== 'adult' && screen === 'manage-profiles') {
        navigateTo('catalog', { replace: true })
      }
    }
  }

  const deleteManagedProfile = async (id) => {
    await profilesApi.remove(session.profileToken, id)
    setProfiles((current) => current.filter(
      (profile) => String(getProfileId(profile)) !== String(id),
    ))
  }

  const logout = () => {
    Object.values(SESSION_KEYS).forEach((key) => localStorage.removeItem(key))
    setSession({ accountToken: null, profileToken: null, profile: null })
    navigateTo('auth', { replace: true })
    setProfiles([])
    setWatchlists({})
    setLoadingWatchlist(false)
    setSelectedProfile(null)
    setProfilePin('')
    setShows([])
    setWatchlists({})
    setLoadingWatchlist(false)
    setError('')
    setProfilesError('')
    setLoadingProfiles(false)
  }

  const isSaved = (show) => watchlist.some(
    (item) => String(item.externalId) === String(show.id),
  )

  const authScreen = (
    <main className="auth-page">
        <a className="brand auth-brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
        <form className="auth-card" onSubmit={handleAuth}>
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
              onChange={(event) => setEmail(event.target.value)}
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
              onChange={(event) => setPassword(event.target.value)}
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
            <button type="button" className="text-button" onClick={() => {
              setRegistering((value) => !value)
              setError('')
            }}>
              {registering ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </form>
        <p className="auth-footer">Tu cine, a tu manera.</p>
    </main>
  )

  const createProfileScreen = (
    <main className="auth-page">
        <a className="brand auth-brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
        <form className="auth-card" onSubmit={handleBootstrap}>
          <p className="eyebrow">PRIMER PASO</p>
          <h1>Crea tu perfil</h1>
          <p className="muted">Elige un nombre y un PIN de 4 dígitos para protegerlo.</p>
          <label>
            Nombre del perfil
            <input
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
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
              onChange={(event) => setBootstrapPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button full-width" type="submit" disabled={busy}>
            {busy ? 'Creando perfil…' : 'Crear y continuar'}
          </button>
          <button type="button" className="text-button back-button" onClick={logout}>
            Cerrar sesión
          </button>
        </form>
    </main>
  )

  const profileSelectionScreen = (
    <main className="profile-page">
        <header className="topbar">
          <a className="brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
          <button className="text-button" type="button" onClick={logout}>Cerrar sesión</button>
        </header>
        <section className="profile-content">
          <p className="eyebrow">¿QUIÉN ESTÁ VIENDO?</p>
          <h1>Elige tu perfil</h1>
          <p className="muted">Cada perfil tiene su propia lista y recomendaciones.</p>
          <div className="profile-grid" aria-live="polite">
            {loadingProfiles ? (
              <p className="profile-state">Cargando tus perfiles…</p>
            ) : profiles.map((profile) => (
              <button
                className={`profile-card ${getProfileId(selectedProfile) === getProfileId(profile) ? 'selected' : ''}`}
                key={getProfileId(profile)}
                type="button"
                aria-pressed={getProfileId(selectedProfile) === getProfileId(profile)}
                onClick={() => {
                  setSelectedProfile(profile)
                  setProfilePin('')
                  setError('')
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
            <form className="pin-form" onSubmit={handleActivateProfile}>
              <label htmlFor="profile-pin">PIN de {selectedProfile.name}</label>
              <div className="pin-row">
                <input
                  id="profile-pin"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength="4"
                  value={profilePin}
                  onChange={(event) => setProfilePin(event.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoFocus
                  required
                />
                <button className="primary-button" type="submit" disabled={busy}>
                  {busy ? 'Verificando…' : 'Entrar'}
                </button>
              </div>
            </form>
          )}
          {profilesError && (
            <div className="profile-load-error">
              <p className="error-message centered" role="alert">{profilesError}</p>
              <button
                type="button"
                className="text-button"
                  onClick={retryProfileLoad}
              >
                Reintentar
              </button>
            </div>
          )}
          {error && <p className="error-message centered" role="alert">{error}</p>}
          <button type="button" className="text-button manage-link" onClick={logout}>
            Cambiar de cuenta
          </button>
        </section>
    </main>
  )

  const applicationShell = (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
        <nav className="main-nav" aria-label="Navegación principal">
          <button
            type="button"
            className={screen === 'catalog' ? 'active' : ''}
            onClick={() => {
              setLoadingShows(true)
              setError('')
              navigateTo('catalog')
            }}
          >
            Descubrir
          </button>
          <button
            type="button"
            className={screen === 'watchlist' ? 'active' : ''}
            onClick={() => {
              setBusy(true)
              setError('')
              navigateTo('watchlist')
            }}
          >
            Mi lista <span className="nav-count">{watchlist.length}</span>
          </button>
          {session.profile?.type === 'adult' && (
            <button
              type="button"
              className={screen === 'manage-profiles' ? 'active' : ''}
              onClick={() => {
                setLoadingProfiles(true)
                setProfilesError('')
                navigateTo('manage-profiles')
              }}
            >
              <span className="profile-management-full-label">Administrar perfiles</span>
              <span className="profile-management-short-label">Admin</span>
            </button>
          )}
        </nav>
        <div className="user-menu">
          <span className="user-avatar">
            {session.profile?.name?.slice(0, 1).toUpperCase() || 'N'}
          </span>
          <span className="user-name">{session.profile?.name}</span>
          <button type="button" className="text-button" onClick={logoutProfile}>Perfiles</button>
          <button type="button" className="text-button logout-button" onClick={logout}>Salir</button>
        </div>
      </header>

      <main>
        {screen === 'catalog' ? (
          <>
            <section className="welcome-banner">
              <div className="banner-copy">
                <p className="eyebrow">HECHO PARA {session.profile?.name?.toUpperCase()}</p>
                <h1>Tu próxima historia<br />empieza aquí.</h1>
                <p>Explora series, encuentra algo nuevo y guárdalo para después.</p>
                <a className="banner-link" href="#catalog">Explorar catálogo <span aria-hidden="true">↓</span></a>
              </div>
              <div className="banner-art" aria-hidden="true">
                <span className="art-orbit orbit-one" />
                <span className="art-orbit orbit-two" />
                <span className="art-star">✳</span>
                <span className="art-caption">PLAY<br /><b>YOUR</b><br />STORY</span>
              </div>
            </section>
            <SeriesCatalog
              error={error}
              isSaved={isSaved}
              loading={loadingShows}
              loadingWatchlist={loadingWatchlist}
              onChangePage={loadCatalog}
              onOpenDetails={openDetails}
              onRetryWatchlist={retryWatchlistLoad}
              onSearch={handleSearch}
              onSearchTextChange={setSearchText}
              onSearchYearChange={setSearchYear}
              onToggleWatchlist={toggleWatchlist}
              page={page}
              searchText={searchText}
              searchYear={searchYear}
              shows={shows}
              watchlistReady={watchlistReady}
            />
          </>
        ) : screen === 'manage-profiles' ? (
          <ProfileManagement
            activeProfileId={getProfileId(session.profile)}
            loading={loadingProfiles}
            loadError={profilesError}
            onBack={() => navigateTo('catalog')}
            onCreate={createManagedProfile}
            onDelete={deleteManagedProfile}
            onRetry={retryProfileLoad}
            onUpdate={updateManagedProfile}
            profiles={profiles}
          />
        ) : (
          <section className="watchlist-section">
            <p className="eyebrow">TU COLECCIÓN PERSONAL</p>
            <h1>Mi lista</h1>
            <p className="muted">Las series que guardaste para ver más tarde.</p>
            {error && <p className="error-message" role="alert">{error}</p>}
            {busy ? (
              <div className="loading-state"><span className="spinner" />Cargando tu lista…</div>
            ) : watchlist.length ? (
              <div className="media-grid">
                {watchlist.map((item) => (
                  <MediaCard
                    key={item._id || item.id}
                    show={{
                      id: item.externalId,
                      name: item.title,
                      image: { medium: item.posterUrl },
                      summary: item.overview,
                      premiered: item.releaseDate,
                      genres: item.genres || [],
                    }}
                    saved
                    onToggle={toggleWatchlist}
                    onDetails={openDetails}
                  />
                ))}
              </div>
            ) : !watchlistReady ? (
              <div className="empty-state">
                <h3>No se pudo sincronizar tu lista</h3>
                <p>Comprueba tu conexión e inténtalo de nuevo.</p>
                <button type="button" className="primary-button" onClick={retryWatchlistLoad}>
                  Reintentar
                </button>
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">＋</span>
                <h3>Tu lista está esperando</h3>
                <p>Guarda series desde el catálogo y aparecerán aquí.</p>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => navigateTo('catalog')}
                >
                  Explorar catálogo
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="site-footer">
        <a className="brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
        <span>Tu próxima historia te está esperando.</span>
        <span>Catálogo impulsado por TVMaze</span>
      </footer>

      {details && (
        <div className="modal-backdrop" role="presentation" onClick={() => setDetails(null)}>
          <section
            className="details-modal"
            role="dialog"
            aria-modal="true"
            aria-label={details.show?.name || 'Detalles de la serie'}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={() => setDetails(null)} aria-label="Cerrar">
              ×
            </button>
            {details.loading ? (
              <div className="loading-state"><span className="spinner" />Cargando detalles…</div>
            ) : details.error ? (
              <p className="error-message" role="alert">{details.error}</p>
            ) : details.show && (
              <div className="detail-content">
                <div className="detail-poster">
                  {details.show.image?.original || details.show.image?.medium
                    ? <img src={details.show.image.original || details.show.image.medium} alt="" />
                    : <span>✳</span>}
                </div>
                <div className="detail-copy">
                  <p className="eyebrow">{details.show.premiered?.slice(0, 4)} · {details.show.status}</p>
                  <h2>{details.show.name}</h2>
                  <div className="genre-list">
                    {details.show.genres?.map((genre) => <span key={genre}>{genre}</span>)}
                  </div>
                  <p className="detail-summary">{plainText(details.show.summary || 'Sin descripción disponible.')}</p>
                  <p className="detail-meta">
                    {details.show.language || 'Idioma no disponible'}
                    {details.show.rating?.average ? ` · ★ ${details.show.rating.average}` : ''}
                  </p>
                  <h3>Reparto</h3>
                  <p className="detail-meta">
                    {details.cast.slice(0, 5).map((person) => person.person?.name).filter(Boolean).join(' · ')
                      || 'Reparto no disponible'}
                  </p>
                  <h3>Episodios</h3>
                  <p className="detail-meta">
                    {details.episodes.length
                      ? `${details.episodes.length} episodios · ${details.episodes.slice(0, 3).map((episode) => episode.name).join(' · ')}`
                      : 'Episodios no disponibles'}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )

  return (
    <AppRoutes
      session={session}
      authScreen={authScreen}
      profileSelectionScreen={profileSelectionScreen}
      createProfileScreen={createProfileScreen}
      applicationShell={applicationShell}
      profiles={profiles}
      loadingProfiles={loadingProfiles}
      profilesError={profilesError}
      onRetryProfileLoad={retryProfileLoad}
    />
  )
}

function SeriesCatalog({
  error,
  isSaved,
  loading,
  loadingWatchlist,
  onChangePage,
  onOpenDetails,
  onRetryWatchlist,
  onSearch,
  onSearchTextChange,
  onSearchYearChange,
  onToggleWatchlist,
  page,
  searchText,
  searchYear,
  shows,
  watchlistReady,
}) {
  return (
    <section className="catalog-section" id="catalog">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CATÁLOGO</p>
          <h2>Descubre series</h2>
        </div>
        <form className="search-form" onSubmit={onSearch}>
          <label className="search-field">
            <span className="sr-only">Buscar serie</span>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Buscar una serie…"
              value={searchText}
              onChange={(event) => onSearchTextChange(event.target.value)}
            />
          </label>
          <input
            className="year-input"
            aria-label="Filtrar por año"
            type="number"
            min="1900"
            max="2100"
            placeholder="Año"
            value={searchYear}
            onChange={(event) => onSearchYearChange(event.target.value)}
          />
          <button className="primary-button search-button" type="submit">Buscar</button>
        </form>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      {!watchlistReady && (
        <p className="watchlist-sync-message" role="status">
          {loadingWatchlist
            ? 'Sincronizando tu lista personal…'
            : <>No se pudo sincronizar tu lista.{' '}
              <button type="button" className="text-button" onClick={onRetryWatchlist}>
                Reintentar
              </button>
            </>}
        </p>
      )}
      {loading ? (
        <div className="loading-state"><span className="spinner" />Cargando catálogo…</div>
      ) : shows.length ? (
        <>
          <div className="media-grid">
            {shows.map((show) => (
              <MediaCard
                key={show.id}
                show={show}
                saved={isSaved(show)}
                onToggle={onToggleWatchlist}
                onDetails={onOpenDetails}
                saveDisabled={!watchlistReady}
              />
            ))}
          </div>
          {!searchText && (
            <div className="pagination">
              <button type="button" disabled={page === 0 || loading} onClick={() => onChangePage(page - 1)}>
                Anterior
              </button>
              <span>Página {page + 1}</span>
              <button type="button" disabled={loading} onClick={() => onChangePage(page + 1)}>
                Siguiente
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <span className="empty-icon">✳</span>
          <h3>{searchText ? 'No encontramos resultados' : 'No hay series para mostrar'}</h3>
          <p>{searchText ? 'Prueba con otro título o cambia el año.' : 'Vuelve a intentarlo en un momento.'}</p>
        </div>
      )}
    </section>
  )
}

function MediaCard({ show, saved, onToggle, onDetails, saveDisabled = false }) {
  const image = show.image?.medium || show.posterUrl
  const description = plainText(show.summary || show.overview || 'Sin descripción disponible.')

  return (
    <article className="media-card">
      <button className="poster-button" type="button" onClick={() => onDetails(show.id)}>
        {image
          ? <img className="poster" src={image} alt={`Póster de ${show.name || show.title}`} loading="lazy" />
          : <span className="poster-placeholder">N<span>+</span></span>}
        <span className="poster-overlay">Ver detalles <span aria-hidden="true">↗</span></span>
      </button>
      <div className="media-info">
        <div className="media-title-row">
          <h3>{show.name || show.title}</h3>
          {show.rating?.average && <span className="rating">★ {show.rating.average}</span>}
        </div>
        <p className="media-meta">
          {show.premiered?.slice(0, 4) || 'Año no disponible'}
          {show.genres?.length ? ` · ${show.genres.slice(0, 2).join(' · ')}` : ''}
        </p>
        <p className="media-description">{description || 'Sin descripción disponible.'}</p>
        <button
          className={`save-button ${saved ? 'saved' : ''}`}
          type="button"
          onClick={() => onToggle(show)}
          disabled={saveDisabled}
        >
          <span aria-hidden="true">{saved ? '✓' : '+'}</span>
          {saveDisabled ? 'Sincronizando…' : saved ? 'En mi lista' : 'Agregar a mi lista'}
        </button>
      </div>
    </article>
  )
}

export default App
