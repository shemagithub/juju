/**
 * Backend base URL:
 * - Development: omit REACT_APP_API_URL to use CRA proxy (`package.json` "proxy") → same-origin `/api`.
 * - Production: set REACT_APP_API_URL=https://your-api.example.com
 */
export function getApiBase() {
  return String(process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
}

/** Absolute URL for API (or relative path when using dev proxy). */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBase();
  return base ? `${base}${p}` : p;
}

/** Images stored as `/uploads/...` need the API origin when the SPA is on another host. */
export function resolveMediaUrl(url) {
  const u = String(url ?? "").trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const path = u.startsWith("/") ? u : `/${u}`;
  const base = getApiBase();
  if (path.startsWith("/uploads/")) return base ? `${base}${path}` : path;
  return base ? `${base}${path}` : path;
}

const GET_CACHE = new Map();
const GET_CACHE_TTL_MS = 30_000;

function readGetCache(path) {
  const hit = GET_CACHE.get(path);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    GET_CACHE.delete(path);
    return null;
  }
  return hit.data;
}

function writeGetCache(path, data) {
  GET_CACHE.set(path, { data, expiresAt: Date.now() + GET_CACHE_TTL_MS });
}

export function clearFetchJsonCache(path) {
  if (path) GET_CACHE.delete(path);
  else GET_CACHE.clear();
}

export async function fetchJson(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const isGet = method === "GET";
  if (isGet) {
    const cached = readGetCache(path);
    if (cached !== null) return cached;
  }

  const res = await fetch(apiUrl(path), {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || res.statusText || `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (isGet) writeGetCache(path, data);
  return data;
}

/** Rough display conversion when UI shows USD (packages are stored in RWF). */
export { rwfToUsdEstimate } from "./currency";
