import { useEffect, useState } from 'react'
import { profilesApi } from '../api.js'
import { getProfileId } from '../utils/profile.js'
import { SESSION_KEYS } from '../utils/session.js'

export default function useProfiles({ session, screen, navigateTo, setSession }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(() => Boolean(session.accountToken))
  const [error, setError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)

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
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [session.accountToken, session.profileToken, screen, loadAttempt, navigateTo])

  const startLoading = () => {
    setLoading(true)
    setError('')
  }

  const retry = () => {
    startLoading()
    setLoadAttempt((attempt) => attempt + 1)
  }

  const resetForAccount = () => {
    setProfiles([])
    startLoading()
  }

  const clear = () => {
    setProfiles([])
    setError('')
    setLoading(false)
  }

  const replace = (nextProfiles) => setProfiles(nextProfiles)

  const create = async (profile) => {
    const created = await profilesApi.create(session.profileToken, profile)
    setProfiles((current) => [...current, created])
  }

  const update = async (id, updates) => {
    const updated = await profilesApi.update(session.profileToken, id, updates)
    setProfiles((current) => current.map((profile) => (
      String(getProfileId(profile)) === String(id) ? updated : profile
    )))

    if (String(getProfileId(session.profile)) === String(id)) {
      localStorage.setItem(SESSION_KEYS.profile, JSON.stringify(updated))
      setSession((current) => ({ ...current, profile: updated }))
      if (updated.type !== 'adult' && screen === 'manage-profiles') {
        navigateTo('catalog', { replace: true })
      }
    }
  }

  const remove = async (id) => {
    await profilesApi.remove(session.profileToken, id)
    setProfiles((current) => current.filter(
      (profile) => String(getProfileId(profile)) !== String(id),
    ))
  }

  return {
    profiles,
    replace,
    loading,
    error,
    startLoading,
    retry,
    resetForAccount,
    clear,
    create,
    update,
    remove,
  }
}
