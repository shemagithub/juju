/**
 * Post-build SEO step.
 *
 * The app is a client-side SPA, so the HTML crawlers download is an empty
 * shell — every route returns the same homepage meta until JavaScript runs.
 * Google renders JS eventually, but on a delayed queue, which is why stale
 * titles, descriptions and contact details can linger in search results for
 * weeks after a change.
 *
 * This writes a real HTML file per route with that route's title,
 * description, Open Graph tags and canonical URL already in the markup, plus
 * a sitemap carrying <lastmod> dates so Google knows pages changed.
 *
 * Route copy is shared with the running app via src/config/pageSeo.json.
 */
const fs = require('fs')
const path = require('path')

const PAGE_SEO = require('../src/config/pageSeo.json')

const root = path.join(__dirname, '..')
const buildDir = path.join(root, 'build')

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const out = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const env = {
  ...loadEnvFile(path.join(root, '.env')),
  ...loadEnvFile(path.join(root, '.env.local')),
  ...process.env,
}

const SITE_URL = String(
  env.REACT_APP_PUBLIC_SITE_URL || 'https://rwandaquesttours.com',
).replace(/\/$/, '')
const BRAND_NAME = String(env.REACT_APP_BRAND_NAME || 'RwandaQuest')

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceTitle(html, title) {
  const tag = `<title>${escapeHtml(title)}</title>`
  return /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, tag)
    : html.replace('</head>', `${tag}</head>`)
}

function upsertMeta(html, attr, key, value) {
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(value)}"/>`
  const re = new RegExp(`<meta[^>]*${attr}=["']${escapeRegex(key)}["'][^>]*>`, 'i')
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `${tag}</head>`)
}

function upsertCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtml(href)}"/>`
  const re = /<link[^>]*rel=["']canonical["'][^>]*>/i
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `${tag}</head>`)
}

function buildPageHtml(shell, route, page) {
  const title = page.title ? `${page.title} | ${BRAND_NAME}` : null
  const pageUrl = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`

  let html = shell
  if (title) {
    html = replaceTitle(html, title)
    html = upsertMeta(html, 'property', 'og:title', title)
    html = upsertMeta(html, 'name', 'twitter:title', title)
  }
  if (page.description) {
    html = upsertMeta(html, 'name', 'description', page.description)
    html = upsertMeta(html, 'property', 'og:description', page.description)
    html = upsertMeta(html, 'name', 'twitter:description', page.description)
  }
  html = upsertCanonical(html, pageUrl)
  html = upsertMeta(html, 'property', 'og:url', pageUrl)
  // Tells bootstrap-meta.js this page already has route-specific tags, so it
  // does not overwrite them with site-wide values from the settings API.
  html = upsertMeta(html, 'name', 'seo-prerendered', route)
  return html
}

function writeSitemap(routes) {
  const lastmod = new Date().toISOString().slice(0, 10)
  const urls = routes
    .map(([route, page]) => {
      const loc = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`
      return [
        '  <url>',
        `<loc>${escapeHtml(loc)}</loc>`,
        `<lastmod>${lastmod}</lastmod>`,
        `<changefreq>${page.changefreq || 'monthly'}</changefreq>`,
        `<priority>${page.priority || '0.5'}</priority>`,
        '</url>',
      ].join('')
    })
    .join('\n')

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n')

  fs.writeFileSync(path.join(buildDir, 'sitemap.xml'), xml, 'utf8')
  return lastmod
}

function main() {
  const indexPath = path.join(buildDir, 'index.html')
  if (!fs.existsSync(indexPath)) {
    console.error('[seo] build/index.html not found — run the build first')
    process.exitCode = 1
    return
  }

  const shell = fs.readFileSync(indexPath, 'utf8')
  const routes = Object.entries(PAGE_SEO.pages)

  let written = 0
  for (const [route, page] of routes) {
    if (route === '/') continue
    const outDir = path.join(buildDir, route.replace(/^\//, ''))
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(path.join(outDir, 'index.html'), buildPageHtml(shell, route, page), 'utf8')
    written += 1
  }

  const lastmod = writeSitemap(routes)
  console.log(
    `[seo] prerendered ${written} route HTML files and wrote sitemap.xml (lastmod ${lastmod}) for ${SITE_URL}`,
  )
}

main()
