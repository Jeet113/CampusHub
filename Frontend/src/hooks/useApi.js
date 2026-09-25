import { useCallback, useEffect, useRef, useState } from 'react'
import { api, apiRequest } from '../services/api'

/**
 * Generic data-fetching hook that wraps the existing api.js client.
 *
 * @param {string|null} path  - API path (e.g. '/events'). Pass null to skip.
 * @param {object}      opts  - { params, immediate, transform }
 * @returns {{ data, loading, error, refetch, setData }}
 */
export function useApi(path, opts = {}) {
  const { params, immediate = true, transform } = opts
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!!path && immediate)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const fetcher = useCallback(async (overridePath) => {
    const target = overridePath || path
    if (!target) return
    setLoading(true)
    setError(null)
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const result = await api.get(`${target}${query}`)
      if (!mountedRef.current) return
      const resolved = transform ? transform(result) : result?.data ?? result
      setData(resolved)
      return resolved
    } catch (err) {
      if (!mountedRef.current) return
      setError(err)
      return null
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [path, JSON.stringify(params)])

  useEffect(() => {
    if (path && immediate) fetcher()
  }, [fetcher, immediate])

  return { data, loading, error, refetch: fetcher, setData }
}

/**
 * Hook for mutation operations (POST, PUT, PATCH, DELETE).
 * Returns a `mutate` function and loading/error state.
 */
export function useMutation(method = 'post') {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mutate = useCallback(async (path, body, options) => {
    setLoading(true)
    setError(null)
    try {
      const fn = api[method] || api.post
      const result = method === 'delete'
        ? await fn(path, options)
        : await fn(path, body, options)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [method])

  return { mutate, loading, error }
}
