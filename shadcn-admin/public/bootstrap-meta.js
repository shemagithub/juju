/**
 * Runs before the React bundle to set admin title, description, and favicon
 * from GET /api/site-settings.
 */
(function bootstrapAdminMeta() {
  function getApiBase() {
    if (typeof window.__API_BASE__ === 'string' && window.__API_BASE__) {
      return window.__API_BASE__.replace(/\/$/, '')
    }
    var meta = document.querySelector('meta[name="api-base"]')
    return meta ? String(meta.getAttribute('content') || '').replace(/\/$/, '') : ''
  }

  function apiUrl(path) {
    var base = getApiBase()
    var p = path.charAt(0) === '/' ? path : '/' + path
    return base ? base + p : p
  }

  function resolveMediaUrl(url) {
    var u = String(url || '').trim()
    if (!u) return ''
    if (/^https?:\/\//i.test(u)) return u
    var path = u.charAt(0) === '/' ? u : '/' + u
    var base = getApiBase()
    if (path.indexOf('/uploads/') === 0) return base ? base + path : path
    return base ? base + path : path
  }

  function upsertLink(rel, href) {
    if (!href) return
    var link = document.querySelector('link[rel="' + rel + '"]')
    if (!link) {
      link = document.createElement('link')
      link.rel = rel
      document.head.appendChild(link)
    }
    link.href = href
  }

  function upsertMeta(attr, key, content) {
    if (!content) return
    var el = document.querySelector('meta[' + attr + '="' + key + '"]')
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(attr, key)
      document.head.appendChild(el)
    }
    el.setAttribute('content', content)
  }

  function applyMeta(settings) {
    if (!settings || typeof settings !== 'object') return

    var brandName = String(settings.brandName || 'RwandaQuest').trim() || 'RwandaQuest'
    var companyDescription =
      String(settings.companyDescription || settings.footerDescription || '').trim() ||
      'Tourism operations admin — manage bookings, packages, content, and site settings.'
    var adminTitle = brandName + ' Admin'
    var pageUrl = String(settings.publicSiteUrl || window.location.origin || '').replace(/\/$/, '')

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

    var logoUrl = resolveMediaUrl(settings.logoUrl || '')
    if (logoUrl) {
      upsertLink('icon', logoUrl)
      upsertLink('apple-touch-icon', logoUrl)
      upsertMeta('property', 'og:image', logoUrl)
      upsertMeta('property', 'twitter:image', logoUrl)
    }
  }

  fetch(apiUrl('/api/site-settings'), { headers: { Accept: 'application/json' } })
    .then(function (res) {
      return res.ok ? res.json() : null
    })
    .then(applyMeta)
    .catch(function () {
      /* keep index.html fallbacks */
    })
})()
