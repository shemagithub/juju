/**
 * Post-build SEO step.
 *
 * Writes crawlable HTML (headings, copy, images, internal links) into each
 * route file so search engines see real content without running JavaScript.
 * Also sets Open Graph images, JSON-LD, and sitemap.xml.
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

const DEFAULT_LINKS = [
  ['/', 'Home'],
  ['/gorilla-trekking', 'Gorilla Trekking'],
  ['/akagera-safari', 'Akagera Safari'],
  ['/nyungwe-forest', 'Nyungwe Forest'],
  ['/car-rental', 'Car Rental'],
  ['/packages', 'Tour Packages'],
  ['/blog', 'Blog'],
  ['/contact', 'Contact'],
]

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
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function upsertCanonical(html, href) {
  const tag = `<link rel="canonical" href="${escapeHtml(href)}"/>`
  const re = /<link[^>]*rel=["']canonical["'][^>]*>/i
  return re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`)
}

function upsertJsonLd(html, data) {
  const tag = `<script type="application/ld+json" id="site-json-ld">${JSON.stringify(data)}</script>`
  if (/id="site-json-ld"/.test(html)) {
    return html.replace(/<script[^>]*id="site-json-ld"[^>]*>[\s\S]*?<\/script>/i, tag)
  }
  return html.replace('</head>', `    ${tag}\n  </head>`)
}

function absoluteUrl(src) {
  if (!src) return `${SITE_URL}/og-cover.jpg`
  if (/^https?:\/\//i.test(src)) return src
  return `${SITE_URL}${src.startsWith('/') ? src : `/${src}`}`
}

function buildCrawlerInner(route, page, title) {
  const heading = page.heading || title || BRAND_NAME
  const paragraphs = Array.isArray(page.paragraphs) && page.paragraphs.length
    ? page.paragraphs
    : page.description
      ? [page.description]
      : []
  const image = absoluteUrl(page.image || '/og-cover.jpg')
  const imageAlt = page.imageAlt || heading
  const highlights = Array.isArray(page.highlights) ? page.highlights : []
  const nav = DEFAULT_LINKS.map(
    ([href, label]) => `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`,
  ).join(' · ')

  return [
    '<article class="seo-crawler">',
    `<nav>${nav}</nav>`,
    `<h1>${escapeHtml(heading)}</h1>`,
    `<p><img src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}" width="1200" height="630"/></p>`,
    ...paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`),
    highlights.length
      ? `<ul>${highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`
      : '',
    `<p><a href="/book">Book a tour</a> · <a href="/contact">Contact us</a></p>`,
    '</article>',
  ].join('')
}

function buildJsonLd(route, page, title, description, pageUrl, imageUrl) {
  const graph = [
    {
      '@type': 'TravelAgency',
      '@id': `${SITE_URL}/#organization`,
      name: BRAND_NAME,
      url: SITE_URL,
      image: imageUrl,
      telephone: '+250 799 608 178',
      email: 'info@rwandaquesttours.com',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kigali',
        addressCountry: 'RW',
      },
      areaServed: { '@type': 'Country', name: 'Rwanda' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BRAND_NAME,
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'WebPage',
      '@id': `${pageUrl}#webpage`,
      url: pageUrl,
      name: title,
      description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      primaryImageOfPage: imageUrl,
    },
  ]
  if (page.schemaType === 'TouristAttraction') {
    graph.push({
      '@type': 'TouristAttraction',
      name: page.heading || title,
      description,
      image: imageUrl,
      url: pageUrl,
      touristType: 'International visitors',
      isAccessibleForFree: false,
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

function injectRootAndNoscript(html, inner) {
  let out = html
  if (/<div id="root"><\/div>/i.test(out)) {
    out = out.replace(/<div id="root"><\/div>/i, `<div id="root">${inner}</div>`)
  } else {
    out = out.replace(/<div id="root">[\s\S]*?<\/div>/i, `<div id="root">${inner}</div>`)
  }
  if (/<noscript>[\s\S]*?<\/noscript>/i.test(out)) {
    out = out.replace(/<noscript>[\s\S]*?<\/noscript>/i, `<noscript>${inner}</noscript>`)
  } else {
    out = out.replace('<div id="root">', `<noscript>${inner}</noscript>\n    <div id="root">`)
  }
  return out
}

function buildPageHtml(shell, route, page) {
  const pageTitle = page.title ? `${page.title} | ${BRAND_NAME}` : `${BRAND_NAME} Tours — Gorilla Trekking & Safari Rwanda`
  const description =
    page.description ||
    'Book gorilla trekking, wildlife safaris, car rental, and custom Rwanda tours with RwandaQuest.'
  const pageUrl = route === '/' ? `${SITE_URL}/` : `${SITE_URL}${route}`
  const imageUrl = absoluteUrl(page.image || '/og-cover.jpg')
  const titleForHead = route === '/' && !page.title
    ? 'RwandaQuest Tours — Gorilla Trekking &amp; Safari Rwanda'.replace(/&amp;/g, '&')
    : pageTitle

  let html = shell
  html = replaceTitle(html, titleForHead)
  html = upsertMeta(html, 'name', 'description', description)
  html = upsertMeta(html, 'property', 'og:title', titleForHead)
  html = upsertMeta(html, 'name', 'twitter:title', titleForHead)
  html = upsertMeta(html, 'property', 'og:description', description)
  html = upsertMeta(html, 'name', 'twitter:description', description)
  html = upsertCanonical(html, pageUrl)
  html = upsertMeta(html, 'property', 'og:url', pageUrl)
  html = upsertMeta(html, 'property', 'og:image', imageUrl)
  html = upsertMeta(html, 'name', 'twitter:image', imageUrl)
  html = upsertMeta(html, 'property', 'og:image:alt', page.imageAlt || titleForHead)
  html = upsertMeta(html, 'property', 'og:image:width', '1200')
  html = upsertMeta(html, 'property', 'og:image:height', '630')
  html = upsertMeta(html, 'name', 'seo-prerendered', route)
  html = upsertJsonLd(
    html,
    buildJsonLd(route, page, titleForHead, description, pageUrl, imageUrl),
  )
  html = injectRootAndNoscript(html, buildCrawlerInner(route, page, titleForHead))
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
    const html = buildPageHtml(shell, route, page)
    if (route === '/') {
      fs.writeFileSync(indexPath, html, 'utf8')
    } else {
      const outDir = path.join(buildDir, route.replace(/^\//, ''))
      fs.mkdirSync(outDir, { recursive: true })
      fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8')
    }
    written += 1
  }

  const lastmod = writeSitemap(routes)
  console.log(
    `[seo] prerendered ${written} crawlable HTML pages and sitemap.xml (lastmod ${lastmod}) for ${SITE_URL}`,
  )
}

main()
