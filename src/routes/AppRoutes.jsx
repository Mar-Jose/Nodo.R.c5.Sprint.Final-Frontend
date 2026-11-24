import { Navigate, Route, Routes } from 'react-router-dom'
import { getHomePath, ROUTES } from './routeConfig.js'

function ProtectedRoute({ session, needsProfile = false, adultOnly = false, children }) {
  if (!session.accountToken) return <Navigate to={ROUTES.auth} replace />
  if (needsProfile && (!session.profileToken || !session.profile)) {
    return <Navigate to={ROUTES.profiles} replace />
  }
  if (adultOnly && session.profile?.type !== 'adult') {
    return <Navigate to={ROUTES.catalog} replace />
  }
  return children
}

export default function AppRoutes({
  session,
  authScreen,
  profileSelectionScreen,
  createProfileScreen,
  applicationShell,
  profiles,
  loadingProfiles,
  profilesError,
  onRetryProfileLoad,
}) {
  const createProfileRoute = loadingProfiles ? (
    <main className="profile-page">
      <p className="profile-state">Cargando tus perfiles…</p>
    </main>
  ) : profilesError ? (
    <main className="profile-page">
      <p className="error-message centered" role="alert">{profilesError}</p>
      <button type="button" className="text-button" onClick={onRetryProfileLoad}>
        Reintentar
      </button>
    </main>
  ) : profiles.length ? (
    <Navigate to={ROUTES.profiles} replace />
  ) : createProfileScreen

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getHomePath(session)} replace />} />
      <Route
        path={ROUTES.auth}
        element={session.accountToken
          ? <Navigate to={getHomePath(session)} replace />
          : authScreen}
      />
      <Route
        path={ROUTES.profiles}
        element={<ProtectedRoute session={session}>{profileSelectionScreen}</ProtectedRoute>}
      />
      <Route
        path={ROUTES['create-profile']}
        element={(
          <ProtectedRoute session={session}>
            {createProfileRoute}
          </ProtectedRoute>
        )}
      />
      <Route
        path={ROUTES.catalog}
        element={(
          <ProtectedRoute session={session} needsProfile>
            {applicationShell}
          </ProtectedRoute>
        )}
      />
      <Route
        path={ROUTES.watchlist}
        element={(
          <ProtectedRoute session={session} needsProfile>
            {applicationShell}
          </ProtectedRoute>
        )}
      />
      <Route
        path={ROUTES['manage-profiles']}
        element={(
          <ProtectedRoute session={session} needsProfile adultOnly>
            {applicationShell}
          </ProtectedRoute>
        )}
      />
      <Route path="*" element={<Navigate to={getHomePath(session)} replace />} />
    </Routes>
  )
}
