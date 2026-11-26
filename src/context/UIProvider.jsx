import { useCallback, useEffect, useMemo, useState } from 'react'
import { UIContext } from './UIContext.js'

const THEME_STORAGE_KEY = 'nodo.theme'

export default function UIProvider({ children }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [theme, setTheme] = useState(() => (
    localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  ))

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ error, setError, busy, setBusy, theme, toggleTheme }),
    [error, busy, theme, toggleTheme],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}
