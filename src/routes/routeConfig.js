export const ROUTES = {
  auth: '/login',
  profiles: '/profiles',
  'create-profile': '/profiles/create',
  catalog: '/catalog',
  watchlist: '/watchlist',
  'manage-profiles': '/profiles/manage',
}

const SCREEN_BY_PATH = Object.fromEntries(
  Object.entries(ROUTES).map(([screen, path]) => [path, screen]),
)

export function getScreenFromPath(pathname) {
  const routePath = pathname.replace(/\/+$/, '').toLowerCase() || '/'
  return SCREEN_BY_PATH[routePath]
}

export function getHomePath(session) {
  if (!session.accountToken) return ROUTES.auth
  if (session.profileToken && session.profile) return ROUTES.catalog
  return ROUTES.profiles
}
