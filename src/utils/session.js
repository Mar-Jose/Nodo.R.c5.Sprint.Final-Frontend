export const SESSION_KEYS = {
  account: 'nodo.accountToken',
  profileToken: 'nodo.profileToken',
  profile: 'nodo.activeProfile',
}

export function readSession() {
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
