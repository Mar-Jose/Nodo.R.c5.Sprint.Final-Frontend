import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi, profilesApi } from './api.js'
import useCatalog from './hooks/useCatalog.js'
import useWatchlist from './hooks/useWatchlist.js'
import AppRoutes from './routes/AppRoutes.jsx'
import { getScreenFromPath, ROUTES } from './routes/routeConfig.js'
import plainText from './utils/plainText.js'
import { getProfileId } from './utils/profile.js'
import AuthView from './views/AuthView.jsx'
import CatalogView from './views/CatalogView.jsx'
import CreateProfileView from './views/CreateProfileView.jsx'
import ProfileManagementView from './views/ProfileManagementView.jsx'
import ProfileSelectionView from './views/ProfileSelectionView.jsx'
import WatchlistView from './views/WatchlistView.jsx'

const SESSION_KEYS = {
  account: 'nodo.accountToken',
  profileToken: 'nodo.profileToken',
  profile: 'nodo.activeProfile',
}

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
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const activeProfileId = getProfileId(session.profile)
  const catalog = useCatalog({
    profileToken: session.profileToken,
    screen,
    setError,
  })
  const {
    shows,
    loading: loadingShows,
    searchText,
    setSearchText,
    searchYear,
    setSearchYear,
    page,
    details,
    handleSearch,
    loadCatalog,
    openDetails,
    closeDetails,
    resetForProfile,
    clearShows,
  } = catalog
  const watchlistState = useWatchlist({
    profileToken: session.profileToken,
    profileId: activeProfileId,
    screen,
    setError,
  })
  const {
    watchlist,
    ready: watchlistReady,
    loading: loadingWatchlist,
    toggleWatchlist,
    isSaved,
    reload: retryWatchlistLoad,
    startLoading: startWatchlistLoading,
    stopLoading: stopWatchlistLoading,
    reset: resetWatchlists,
  } = watchlistState

  const saveAccountToken = (token) => {
    localStorage.setItem(SESSION_KEYS.account, token)
    localStorage.removeItem(SESSION_KEYS.profileToken)
    localStorage.removeItem(SESSION_KEYS.profile)
    setProfiles([])
    resetWatchlists()
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
    resetForProfile()
    startWatchlistLoading()
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
    stopWatchlistLoading()
    setError('')
    setProfilesError('')
    setLoadingProfiles(true)
  }

  const retryProfileLoad = () => {
    setLoadingProfiles(true)
    setProfilesError('')
    setProfileLoadAttempt((attempt) => attempt + 1)
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
    resetWatchlists()
    setSelectedProfile(null)
    setProfilePin('')
    clearShows()
    setError('')
    setProfilesError('')
    setLoadingProfiles(false)
  }

  const authView = (
    <AuthView
      busy={busy}
      email={email}
      error={error}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleAuth}
      onToggleRegister={() => {
        setRegistering((value) => !value)
        setError('')
      }}
      password={password}
      registering={registering}
    />
  )

  const createProfileView = (
    <CreateProfileView
      bootstrapPin={bootstrapPin}
      busy={busy}
      error={error}
      onBootstrapPinChange={setBootstrapPin}
      onLogout={logout}
      onProfileNameChange={setProfileName}
      onSubmit={handleBootstrap}
      profileName={profileName}
    />
  )

  const profileSelectionView = (
    <ProfileSelectionView
      busy={busy}
      error={error}
      getProfileId={getProfileId}
      loading={loadingProfiles}
      onActivate={handleActivateProfile}
      onChooseProfile={(profile) => {
        setSelectedProfile(profile)
        setProfilePin('')
        setError('')
      }}
      onLogout={logout}
      onPinChange={setProfilePin}
      onRetry={retryProfileLoad}
      profilePin={profilePin}
      profiles={profiles}
      profilesError={profilesError}
      selectedProfile={selectedProfile}
    />
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
              catalog.startLoading()
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
              retryWatchlistLoad()
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
          <CatalogView
            profileName={session.profile?.name}
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
        ) : screen === 'manage-profiles' ? (
          <ProfileManagementView
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
          <WatchlistView
            error={error}
            loading={loadingWatchlist}
            onBrowseCatalog={() => navigateTo('catalog')}
            onDetails={openDetails}
            onRetry={retryWatchlistLoad}
            onToggle={toggleWatchlist}
            watchlist={watchlist}
            watchlistReady={watchlistReady}
          />
        )}
      </main>

      <footer className="site-footer">
        <a className="brand" href="/" aria-label="Nodo, inicio">NODO<span>+</span></a>
        <span>Tu próxima historia te está esperando.</span>
        <span>Catálogo impulsado por TVMaze</span>
      </footer>

      {details && (
        <div className="modal-backdrop" role="presentation" onClick={closeDetails}>
          <section
            className="details-modal"
            role="dialog"
            aria-modal="true"
            aria-label={details.show?.name || 'Detalles de la serie'}
            onClick={(event) => event.stopPropagation()}
          >
            <button className="modal-close" type="button" onClick={closeDetails} aria-label="Cerrar">
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
      authView={authView}
      profileSelectionView={profileSelectionView}
      createProfileView={createProfileView}
      applicationShell={applicationShell}
      profiles={profiles}
      loadingProfiles={loadingProfiles}
      profilesError={profilesError}
      onRetryProfileLoad={retryProfileLoad}
    />
  )
}

export default App
