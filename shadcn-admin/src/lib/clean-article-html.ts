const KEEP = new Set([
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'IMG',
  'A',
  'STRONG',
  'EM',
  'B',
  'I',
  'U',
  'UL',
  'OL',
  'LI',
  'BR',
  'BLOCKQUOTE',
  'FIGURE',
  'FIGCAPTION',
  'TABLE',
  'THEAD',
  'TBODY',
  'TR',
  'TD',
  'TH',
])

function extractFragment(html: string) {
  const start = html.indexOf('<!--StartFragment-->')
  const end = html.indexOf('<!--EndFragment-->')
  if (start !== -1 && end !== -1) return html.slice(start + 20, end)
  return html
}

function stripJunk(html: string) {
  return extractFragment(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?o:p[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
}

function styleOf(el: Element) {
  return `${el.getAttribute('style') || ''} ${el.getAttribute('class') || ''}`.toLowerCase()
}

function isBold(el: Element) {
  const s = styleOf(el)
  return (
    /font-weight\s*:\s*(bold|[7-9]00)/.test(s) ||
    el.tagName === 'STRONG' ||
    el.tagName === 'B'
  )
}

function isItalic(el: Element) {
  const s = styleOf(el)
  return /font-style\s*:\s*italic/.test(s) || el.tagName === 'EM' || el.tagName === 'I'
}

function isUnderline(el: Element) {
  return /text-decoration[^;]*underline/.test(styleOf(el)) || el.tagName === 'U'
}

function textAlign(el: Element) {
  const m = styleOf(el).match(/text-align\s*:\s*(center|right|left|justify)/)
  return m?.[1] || ''
}

function looksLikeHeading(el: Element) {
  const s = styleOf(el)
  const size = s.match(/font-size\s*:\s*([\d.]+)\s*(pt|px)/)
  if (!size) return false
  const n = Number(size[1])
  const px = size[2] === 'pt' ? n * (96 / 72) : n
  return px >= 20 && isBold(el)
}

function wrap(tag: string, node: Node) {
  const el = document.createElement(tag)
  el.appendChild(node)
  return el
}

function cleanNode(node: Node): Node | DocumentFragment | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent || '')
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return null

  const el = node as Element
  const tag = el.tagName

  if (tag === 'IMG') {
    const src = String(el.getAttribute('src') || '').trim()
    if (!src || /^(file:|blob:)/i.test(src)) return null
    if (!/^(https?:|data:image\/|\/)/i.test(src)) return null
    const img = document.createElement('img')
    img.setAttribute('src', src.replace(/^https?:\/\/(localhost|127\.0\.0\.1):\d+/i, ''))
    img.setAttribute('alt', el.getAttribute('alt') || '')
    return img
  }

  const frag = document.createDocumentFragment()
  Array.from(el.childNodes).forEach((child) => {
    const cleaned = cleanNode(child)
    if (cleaned) frag.appendChild(cleaned)
  })

  if (tag === 'BR') return document.createElement('br')

  if (tag === 'SPAN' || tag === 'FONT' || tag === 'LABEL') {
    let inner: Node = frag
    if (isUnderline(el)) inner = wrap('u', inner)
    if (isItalic(el) && tag !== 'I' && tag !== 'EM') inner = wrap('em', inner)
    if (isBold(el) && tag !== 'B' && tag !== 'STRONG') inner = wrap('strong', inner)
    return inner
  }

  if (!KEEP.has(tag) && tag !== 'DIV' && tag !== 'SECTION' && tag !== 'ARTICLE') {
    return frag
  }

  if (tag === 'DIV' || tag === 'SECTION' || tag === 'ARTICLE') {
    const hasBlock = Array.from(el.children).some((child) =>
      /^(P|H1|H2|H3|H4|UL|OL|TABLE|BLOCKQUOTE|FIGURE|DIV)$/i.test(child.tagName),
    )
    if (hasBlock) return frag
    const p = document.createElement(looksLikeHeading(el) ? 'h2' : 'p')
    const align = textAlign(el)
    if (align) p.setAttribute('style', `text-align:${align}`)
    p.appendChild(frag)
    return p
  }

  let outTag = tag.toLowerCase()
  if (tag === 'H1' || (tag === 'P' && looksLikeHeading(el))) outTag = 'h2'
  const out = document.createElement(outTag)
  const align = textAlign(el)
  if (align && /^(p|h2|h3|h4|td|th)$/.test(outTag)) {
    out.setAttribute('style', `text-align:${align}`)
  }
  if (tag === 'A') {
    const href = el.getAttribute('href') || ''
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(href)) out.setAttribute('href', href)
  }
  out.appendChild(frag)
  return out
}

export function cleanArticleHtml(html: string) {
  const source = stripJunk(String(html || ''))
  if (!source.trim()) return ''
  const template = document.createElement('template')
  template.innerHTML = source
  const out = document.createElement('div')
  Array.from(template.content.childNodes).forEach((child) => {
    const cleaned = cleanNode(child)
    if (cleaned) out.appendChild(cleaned)
  })
  return out.innerHTML.replace(/<p>\s*<\/p>/gi, '').trim()
}

export function plainTextToHtml(text: string) {
  const blocks = String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
  return blocks.join('') || '<p><br></p>'
}
