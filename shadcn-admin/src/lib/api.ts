import axios from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { resolveApiBase } from '@/lib/api-base'

/**
 * Tourism API. Defaults to https://backend.rwandaquesttours.com.
 * Override with VITE_API_URL (e.g. http://localhost:4000 for a local backend).
 */
export const api = axios.create({
  baseURL: resolveApiBase(),
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().auth.accessToken
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
