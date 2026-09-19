import { resolveApiBase } from '@/lib/api-base'

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '')
}

/**
 * Resolve a stored media URL into a browser-loadable URL.
 * - If the value is absolute (`http...`), return as-is.
 * - If the value is `/uploads/...`, prefix with the API origin.
 * - Otherwise return as-is (relative paths like `/images/...`).
 */
export function resolveAssetUrl(url: string): string {
  const u = String(url ?? '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  if (u.startsWith('/uploads/')) {
    return `${normalizeOrigin(resolveApiBase())}${u}`
  }
  return u
}
