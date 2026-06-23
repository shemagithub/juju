import { resolveAssetUrl } from '@/lib/asset-url'

const DEFAULT_BRAND = 'RwandaQuest'
const DEFAULT_DESCRIPTION =
  'Tourism operations admin — manage bookings, packages, content, and site settings.'

function upsertLink(rel: string, href: string) {
  if (!href) return
  let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!link) {
    link = document.createElement('link')
    link.rel = rel
    document.head.appendChild(link)
  }
  link.href = href
}

function upsertMeta(
  attr: 'name' | 'property',
  key: string,
  content: string,
) {
  if (!content) return
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/** Apply document title, description, favicon, and social meta from site settings. */
export function applyAdminSiteMeta(settings: Record<string, unknown> = {}) {
  if (typeof document === 'undefined') return

  const brandName = String(settings.brandName ?? DEFAULT_BRAND).trim() || DEFAULT_BRAND
  const companyDescription =
    String(settings.companyDescription ?? settings.footerDescription ?? '').trim() ||
    DEFAULT_DESCRIPTION
  const adminTitle = `${brandName} Admin`
  const pageUrl =
    String(settings.publicSiteUrl ?? '').trim() ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  document.title = adminTitle
  upsertMeta('name', 'title', adminTitle)
  upsertMeta('name', 'description', companyDescription)
  upsertMeta('property', 'og:title', adminTitle)
  upsertMeta('property', 'og:description', companyDescription)
  upsertMeta('property', 'twitter:title', adminTitle)
  upsertMeta('property', 'twitter:description', companyDescription)
  if (pageUrl) {
    upsertMeta('property', 'og:url', pageUrl)
    upsertMeta('property', 'twitter:url', pageUrl)
  }

  const logoUrl = resolveAssetUrl(String(settings.logoUrl ?? ''))
  if (logoUrl) {
    upsertLink('icon', logoUrl)
    upsertLink('apple-touch-icon', logoUrl)
    upsertMeta('property', 'og:image', logoUrl)
    upsertMeta('property', 'twitter:image', logoUrl)
  }
}
