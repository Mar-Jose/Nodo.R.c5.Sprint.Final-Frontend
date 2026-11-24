import { useEffect, useState } from 'react'
import { watchlistApi } from '../api.js'

export default function useWatchlist({ profileToken, profileId, screen, setError }) {
  const [watchlists, setWatchlists] = useState({})
  const [loadState, setLoadState] = useState(() => ({
    profileKey: profileId ? String(profileId) : '',
    profileToken,
    loading: Boolean(profileToken && profileId),
  }))
  const [loadAttempt, setLoadAttempt] = useState(0)
  const profileKey = profileId ? String(profileId) : ''
  const watchlist = profileKey ? watchlists[profileKey] || [] : []
  const loading = Boolean(
    profileToken
    && profileKey
    && (
      loadState.profileKey !== profileKey
      || loadState.profileToken !== profileToken
      || loadState.loading
    ),
  )
  const ready = Boolean(
    profileKey
    && Object.prototype.hasOwnProperty.call(watchlists, profileKey),
  )

  useEffect(() => {
    if (
      !['catalog', 'watchlist'].includes(screen)
      || !profileToken
      || !profileKey
    ) return undefined

    let active = true
    watchlistApi.list(profileToken)
      .then((data) => {
        if (active) {
          setWatchlists((current) => ({
            ...current,
            [profileKey]: Array.isArray(data) ? data : [],
          }))
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) {
          setLoadState({ profileKey, profileToken, loading: false })
        }
      })
    return () => { active = false }
  }, [screen, profileToken, profileKey, loadAttempt, setError])

  const toggleWatchlist = async (show) => {
    if (!ready) {
      setError('Espera a que la Watchlist del perfil termine de sincronizarse.')
      return
    }

    const savedItem = watchlist.find(
      (item) => String(item.externalId) === String(show.id),
    )
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

  const reload = () => {
    setLoadState({ profileKey, profileToken, loading: true })
    setError('')
    setLoadAttempt((attempt) => attempt + 1)
  }

  const reset = () => {
    setWatchlists({})
    setLoadState({ profileKey: '', profileToken: null, loading: false })
  }

  return {
    watchlist,
    ready,
    loading,
    toggleWatchlist,
    isSaved: (show) => watchlist.some(
      (item) => String(item.externalId) === String(show.id),
    ),
    reload,
    startLoading: () => setLoadState({ profileKey, profileToken, loading: true }),
    stopLoading: () => setLoadState({ profileKey, profileToken, loading: false }),
    reset,
  }
}
