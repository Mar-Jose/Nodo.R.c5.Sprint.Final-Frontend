import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi, profilesApi } from './api.js'
import useCatalog from './hooks/useCatalog.js'
import useProfiles from './hooks/useProfiles.js'
import useWatchlist from './hooks/useWatchlist.js'
import AppRoutes from './routes/AppRoutes.jsx'
import { getScreenFromPath, ROUTES } from './routes/routeConfig.js'
import plainText from './utils/plainText.js'
import { getProfileId } from './utils/profile.js'
import { readSession, SESSION_KEYS } from './utils/session.js'
import useUI from './hooks/useUI.js'
import AuthView from './views/AuthView.jsx'
import CatalogView from './views/CatalogView.jsx'
import CreateProfileView from './views/CreateProfileView.jsx'
import ProfileManagementView from './views/ProfileManagementView.jsx'
import ProfileSelectionView from './views/ProfileSelectionView.jsx'
import WatchlistView from './views/WatchlistView.jsx'
import Footer from './views/partials/Footer.jsx'

function App() {
  const { error, setError, busy, setBusy, theme, toggleTheme } = useUI()
  const [session, setSession] = useState(readSession)
  const modalRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const screen = getScreenFromPath(location.pathname)
  const navigateTo = useCallback(
    (destination, options) => navigate(ROUTES[destination], options),
    [navigate],
  )
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [registering, setRegistering] = useState(false)
  const profileState = useProfiles({ session, screen, navigateTo, setSession })
  const {
    profiles,
    replace: replaceProfiles,
    loading: loadingProfiles,
    error: profilesError,
    startLoading: startProfileLoading,
    retry: retryProfileLoad,
    resetForAccount: resetProfilesForAccount,
    clear: clearProfiles,
    create: createManagedProfile,
    update: updateManagedProfile,
    remove: deleteManagedProfile,
  } = profileState
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
  const detailsOpen = Boolean(details)

  useEffect(() => {
    if (!detailsOpen) return undefined

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    modalRef.current?.querySelector('.modal-close')?.focus()
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus()
      }
    }
  }, [detailsOpen])

  const handleDetailsKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeDetails()
      return
    }
    if (event.key !== 'Tab') return

    const focusable = modalRef.current?.querySelectorAll(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable?.length) {
      event.preventDefault()
      modalRef.current?.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }
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
    resetProfilesForAccount()
    resetWatchlists()
    setSelectedProfile(null)
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

  const handleAuth = async ({ email, password }) => {
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

  const handleActivateProfile = async ({ pin }) => {
    if (!selectedProfile) return
    setBusy(true)
    setError('')
    try {
      await activateProfile(selectedProfile, pin)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const handleBootstrap = async ({ profileName, bootstrapPin }) => {
    setBusy(true)
    setError('')
    try {
      const profile = await profilesApi.bootstrap(session.accountToken, {
        name: profileName,
        type: 'adult',
        pin: bootstrapPin,
      })
      replaceProfiles([profile])
      await activateProfile(profile, bootstrapPin)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
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
    stopWatchlistLoading()
    setError('')
    startProfileLoading()
  }

  const logout = () => {
    Object.values(SESSION_KEYS).forEach((key) => localStorage.removeItem(key))
    setSession({ accountToken: null, profileToken: null, profile: null })
    navigateTo('auth', { replace: true })
    clearProfiles()
    resetWatchlists()
    setSelectedProfile(null)
    clearShows()
    setError('')
  }

  const authView = (
    <AuthView
      busy={busy}
      error={error}
      onSubmit={handleAuth}
      onToggleRegister={() => {
        setRegistering((value) => !value)
        setError('')
      }}
      registering={registering}
    />
  )

  const createProfileView = (
    <CreateProfileView
      busy={busy}
      error={error}
      onLogout={logout}
      onSubmit={handleBootstrap}
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
        setError('')
      }}
      onLogout={logout}
      onRetry={retryProfileLoad}
      profiles={profiles}
      profilesError={profilesError}
      selectedProfile={selectedProfile}
    />
  )

  const applicationShell = (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
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
                startProfileLoading()
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

      <main id="main-content">
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

      <Footer />

      {details && (
        <div className="modal-backdrop" role="presentation" onClick={closeDetails}>
          <section
            ref={modalRef}
            className="details-modal"
            role="dialog"
            aria-modal="true"
            aria-label={details.show?.name || 'Detalles de la serie'}
            tabIndex="-1"
            onKeyDown={handleDetailsKeyDown}
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
    <>
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
      <button
        className="theme-toggle"
        type="button"
        onClick={toggleTheme}
        aria-label={`Cambiar a tema ${theme === 'dark' ? 'claro' : 'oscuro'}`}
        aria-pressed={theme === 'dark'}
      >
        <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
        {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      </button>
    </>
  )
}

export default App
