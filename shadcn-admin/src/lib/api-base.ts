/** Live tourism API. Used when VITE_API_URL is not set (local admin included). */
export const DEFAULT_API_URL = 'https://backend.rwandaquesttours.com'

export function resolveApiBase(): string {
  return String(import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
}
