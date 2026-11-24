const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function apiRequest(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers)

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error(`No se pudo conectar con el backend en ${API_URL}. Comprueba que esté iniciado.`)
  }

  let payload
  try {
    payload = await response.json()
  } catch {
    throw new Error(`El backend respondió con un formato inesperado (${response.status}).`)
  }

  if (!response.ok || payload.estado === 'error') {
    const validationErrors = payload.errores
      ?.map(({ campo, mensaje }) => `${campo}: ${mensaje}`)
      .join('. ')
    throw new Error(validationErrors || payload.mensaje || `Error del servidor (${response.status}).`)
  }

  return payload.datos
}

export const authApi = {
  login: (credentials) => apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  register: (credentials) => apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
}

export const profilesApi = {
  list: (token) => apiRequest('/api/profiles', { token }),
  create: (token, profile) => apiRequest('/api/profiles', {
    method: 'POST',
    token,
    body: JSON.stringify(profile),
  }),
  update: (token, id, updates) => apiRequest(`/api/profiles/${id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(updates),
  }),
  remove: (token, id) => apiRequest(`/api/profiles/${id}`, {
    method: 'DELETE',
    token,
  }),
  bootstrap: (token, profile) => apiRequest('/api/profiles/bootstrap', {
    method: 'POST',
    token,
    body: JSON.stringify(profile),
  }),
  activate: (token, id, pin) => apiRequest(`/api/profiles/${id}/activate`, {
    method: 'POST',
    token,
    body: JSON.stringify({ pin }),
  }),
}

export const catalogApi = {
  list: (token, page = 0) => apiRequest(`/api/catalog?page=${page}`, { token }),
  search: (token, query, year) => {
    const params = new URLSearchParams({ q: query })
    if (year) params.set('year', year)
    return apiRequest(`/api/catalog/search?${params}`, { token })
  },
  details: (token, id) => apiRequest(`/api/catalog/${id}`, { token }),
  cast: (token, id) => apiRequest(`/api/catalog/${id}/cast`, { token }),
  episodes: (token, id) => apiRequest(`/api/catalog/${id}/episodes`, { token }),
}

export const watchlistApi = {
  list: (token) => apiRequest('/api/watchlist', { token }),
  add: (token, show) => apiRequest('/api/watchlist', {
    method: 'POST',
    token,
    body: JSON.stringify({
      source: 'tvmaze',
      externalId: show.id,
      title: show.name,
      posterUrl: show.image?.original || show.image?.medium || '',
      overview: show.summary || '',
      releaseDate: show.premiered || '',
      genres: show.genres || [],
    }),
  }),
  remove: (token, itemId) => apiRequest(`/api/watchlist/${itemId}`, {
    method: 'DELETE',
    token,
  }),
}
