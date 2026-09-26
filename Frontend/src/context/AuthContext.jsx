import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { api, clearTokens, getStoredRefreshToken, setAccessToken, setRefreshToken } from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  // On mount, restore session via localStorage token or refresh-token
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('campushub_access_token') : null
        if (storedToken) {
          setAccessToken(storedToken)
          try {
            const meRes = await api.get('/auth/me')
            if (cancelled) return
            if (meRes?.data) {
              setUser(meRes.data)
              setReady(true)
              return
            }
          } catch {
            // Token expired or invalid, will attempt refresh below
          }
        }

        const storedRefresh = getStoredRefreshToken()
        const res = await api.post('/auth/refresh', storedRefresh ? { refreshToken: storedRefresh } : {})
        if (cancelled) return
        if (res?.data?.accessToken) {
          setAccessToken(res.data.accessToken)
          if (res.data.refreshToken) setRefreshToken(res.data.refreshToken)
          setUser(res.data.user)
        }
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
      if (res.data.refreshToken) setRefreshToken(res.data.refreshToken)
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
      if (res.data.refreshToken) setRefreshToken(res.data.refreshToken)
      setUser(res.data.user)
      return { ok: true, user: res.data.user }
    } catch (err) {
      return { ok: false, error: err.message || 'Registration failed' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const storedRefresh = getStoredRefreshToken()
      await api.post('/auth/logout', storedRefresh ? { refreshToken: storedRefresh } : {})
    } catch {
      // Logout is best-effort
    }
    clearTokens()
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
