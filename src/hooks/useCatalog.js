import { useEffect, useState } from 'react'
import { catalogApi } from '../api.js'

export default function useCatalog({ profileToken, screen, setError }) {
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(Boolean(profileToken))
  const [searchText, setSearchText] = useState('')
  const [searchYear, setSearchYear] = useState('')
  const [page, setPage] = useState(0)
  const [details, setDetails] = useState(null)

  useEffect(() => {
    if (screen !== 'catalog' || !profileToken) return undefined
    let active = true
    catalogApi.list(profileToken, page)
      .then((data) => {
        if (active) setShows(Array.isArray(data) ? data : [])
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [screen, profileToken, page, setError])

  const handleSearch = async (event) => {
    event.preventDefault()
    if (!searchText.trim()) {
      setError('Escribe el nombre de una serie para buscar.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await catalogApi.search(
        profileToken,
        searchText.trim(),
        searchYear,
      )
      setShows(result.results || [])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  const loadCatalog = (nextPage) => {
    setSearchText('')
    setSearchYear('')
    setLoading(true)
    setPage(nextPage)
  }

  const openDetails = async (id) => {
    setDetails({ loading: true, show: null, cast: [], episodes: [], error: '' })
    try {
      const [show, cast, episodes] = await Promise.all([
        catalogApi.details(profileToken, id),
        catalogApi.cast(profileToken, id),
        catalogApi.episodes(profileToken, id),
      ])
      setDetails({ loading: false, show, cast, episodes, error: '' })
    } catch (requestError) {
      setDetails({ loading: false, show: null, cast: [], episodes: [], error: requestError.message })
    }
  }

  const resetForProfile = () => {
    setPage(0)
    setSearchText('')
    setSearchYear('')
    setLoading(true)
    setError('')
  }

  const clearShows = () => setShows([])
  const closeDetails = () => setDetails(null)

  return {
    shows,
    loading,
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
    startLoading: () => setLoading(true),
  }
}
