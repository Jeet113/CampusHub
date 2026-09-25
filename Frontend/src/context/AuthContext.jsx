import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { api, setAccessToken } from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // On mount, attempt to restore the session via the refresh-token cookie
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await api.post('/auth/refresh', {})
        if (cancelled) return
        setAccessToken(res.data.accessToken)
        setUser(res.data.user)
      } catch {
        // No valid session — user will need to log in
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    try {
      const res = await api.post('/auth/login', { email, password })
      setAccessToken(res.data.accessToken)
      setUser(res.data.user)
      return { ok: true, user: res.data.user }
    } catch (err) {
      return { ok: false, error: err.message || 'Login failed' }
    }
  }, [])

  const register = useCallback(async (data) => {
    try {
      const res = await api.post('/auth/register', data)
      setAccessToken(res.data.accessToken)
      setUser(res.data.user)
      return { ok: true, user: res.data.user }
    } catch (err) {
      return { ok: false, error: err.message || 'Registration failed' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {})
    } catch {
      // Logout is best-effort
    }
    setAccessToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData))
  }, [])

  const value = useMemo(
    () => ({ user, ready, login, register, logout, updateUser }),
    [user, ready, login, register, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
