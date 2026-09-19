import { resolveMediaUrl } from "../../utils/backendApi";

export function inferBlogCategory(slugAndName) {
  const s = String(slugAndName || "").toLowerCase();
  if (s.includes("gorilla")) return "gorilla";
  if (s.includes("safari") || s.includes("wildlife")) return "safari";
  if (s.includes("culture") || s.includes("history")) return "culture";
  if (s.includes("news")) return "news";
  if (s.includes("hotel") || s.includes("lodge") || s.includes("review")) return "reviews";
  if (s.includes("car") || s.includes("rental") || s.includes("hire")) return "car-rental";
  return "guide";
}

function decodeEntities(value) {
  const raw = String(value || "");
  if (typeof document === "undefined") {
    return raw
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');
  }
  const box = document.createElement("textarea");
  box.innerHTML = raw;
  return box.value;
}

function prepareBlogHtml(html) {
  let raw = String(html || "").trim();
  if (!raw) return "";
  if (!/<[a-z][\s\S]*>/i.test(raw) && /&lt;[a-z]/i.test(raw)) {
    raw = decodeEntities(raw);
  }
  return raw.replace(/&nbsp;/gi, " ");
}

function stripHtml(value) {
  let text = prepareBlogHtml(value);
  text = text.replace(/<[^>]+>/g, " ");
  text = decodeEntities(text);
  return text.replace(/\s+/g, " ").trim();
}

export function isHtmlBody(body) {
  const raw = prepareBlogHtml(body);
  return /<(p|h[1-6]|img|ul|ol|blockquote|figure|div|br|strong|em|b|table)\b/i.test(raw);
}

const KEEP_TAGS = new Set([
  "P",
  "H1",
  "H2",
  "H3",
  "H4",
  "IMG",
  "A",
  "STRONG",
  "EM",
  "B",
  "I",
  "U",
  "UL",
  "OL",
  "LI",
  "BR",
  "BLOCKQUOTE",
  "FIGURE",
  "FIGCAPTION",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TD",
  "TH",
]);

function styleBag(el) {
  return `${el.getAttribute("style") || ""} ${el.getAttribute("class") || ""}`.toLowerCase();
}

function hasBold(el) {
  return /font-weight\s*:\s*(bold|[7-9]00)/.test(styleBag(el)) || el.tagName === "STRONG" || el.tagName === "B";
}

function hasItalic(el) {
  return /font-style\s*:\s*italic/.test(styleBag(el)) || el.tagName === "EM" || el.tagName === "I";
}

function hasUnderline(el) {
  return /text-decoration[^;]*underline/.test(styleBag(el)) || el.tagName === "U";
}

function alignOf(el) {
  const match = styleBag(el).match(/text-align\s*:\s*(center|right|left|justify)/);
  return match ? match[1] : "";
}

function wrapTag(tag, node) {
  const el = document.createElement(tag);
  el.appendChild(node);
  return el;
}

function rewriteImageSrc(src, resolveUrl) {
  let u = String(src || "").trim();
  u = u.replace(/^https?:\/\/(localhost|127\.0\.0\.1):\d+/i, "");
  return resolveUrl(u);
}

function appendCleanChildren(source, target, resolveUrl) {
  Array.from(source.childNodes).forEach((child) => {
    const cleaned = sanitizeNode(child, resolveUrl);
    if (cleaned) target.appendChild(cleaned);
  });
}

function sanitizeNode(node, resolveUrl) {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent || "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return document.createDocumentFragment();

  const tag = node.tagName;

  if (tag === "BR") return document.createElement("br");

  if (tag === "IMG") {
    const src = rewriteImageSrc(node.getAttribute("src") || "", resolveUrl);
    if (!src || !/^(https?:|\/)/i.test(src)) return document.createDocumentFragment();
    const img = document.createElement("img");
    img.setAttribute("src", src);
    img.setAttribute("alt", node.getAttribute("alt") || "");
    img.setAttribute("loading", "lazy");
    return img;
  }

  if (tag === "SPAN" || tag === "FONT") {
    const frag = document.createDocumentFragment();
    appendCleanChildren(node, frag, resolveUrl);
    let inner = frag;
    if (hasUnderline(node)) inner = wrapTag("u", inner);
    if (hasItalic(node) && tag !== "I") inner = wrapTag("em", inner);
    if (hasBold(node) && tag !== "B") inner = wrapTag("strong", inner);
    return inner;
  }

  if (tag === "DIV" || tag === "ARTICLE" || tag === "SECTION" || tag === "MAIN") {
    const hasBlock = Array.from(node.children || []).some((child) =>
      /^(P|H1|H2|H3|H4|UL|OL|TABLE|BLOCKQUOTE|FIGURE|DIV)$/i.test(child.tagName),
    );
    if (hasBlock) {
      const frag = document.createDocumentFragment();
      appendCleanChildren(node, frag, resolveUrl);
      return frag;
    }
    const p = document.createElement("p");
    const align = alignOf(node);
    if (align) p.setAttribute("style", `text-align:${align}`);
    appendCleanChildren(node, p, resolveUrl);
    return p;
  }

  if (!KEEP_TAGS.has(tag)) {
    const frag = document.createDocumentFragment();
    appendCleanChildren(node, frag, resolveUrl);
    return frag;
  }

  const outTag = tag === "H1" ? "h2" : tag.toLowerCase();
  const el = document.createElement(outTag);
  const align = alignOf(node);
  if (align && /^(p|h2|h3|h4|td|th)$/.test(outTag)) {
    el.setAttribute("style", `text-align:${align}`);
  }
  if (tag === "A") {
    const href = node.getAttribute("href") || "";
    if (/^(https?:|mailto:|tel:|\/|#)/i.test(href)) {
      el.setAttribute("href", href);
      if (/^https?:/i.test(href)) {
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
    }
  }
  appendCleanChildren(node, el, resolveUrl);
  return el;
}

export function sanitizeBlogHtml(html, resolveUrl = resolveMediaUrl) {
  const source = prepareBlogHtml(html);
  if (!source) return "";
  if (typeof document === "undefined") return source;
  const template = document.createElement("template");
  template.innerHTML = source
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "");
  const out = document.createElement("div");
  appendCleanChildren(template.content, out, resolveUrl);
  return out.innerHTML;
}

export function mapCmsBlogPost(p, catById, defaultAuthor, defaultImg) {
  const cat = catById[p.categoryId] || {};
  const slugKey = (cat.slug || cat.name || "").toLowerCase();
  const category = inferBlogCategory(`${slugKey} ${cat.name || ""} ${p.title || ""}`);
  const iso = p.updatedAt ? new Date(p.updatedAt) : new Date();
  const publishedDate = Number.isFinite(iso.getTime())
    ? iso.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "";
  const publishedShort = Number.isFinite(iso.getTime())
    ? iso.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  const img = resolveMediaUrl(p.coverImageUrl) || defaultImg;
  const textLen = stripHtml(`${p.excerpt || ""} ${p.body || ""}`).length;
  const readingMins = Math.min(99, Math.max(3, Math.ceil(textLen / 900) || 8));
  const cmsId = String(p.id);
  const slug = (p.slug || "").trim() || `cms-${cmsId}`;
  const excerpt =
    stripHtml(p.excerpt || "").slice(0, 220) ||
    stripHtml(p.body || "").slice(0, 220) ||
    p.title;

  return {
    id: `cms-${cmsId}`,
    cmsId,
    slug,
    title: p.title,
    excerpt,
    body: p.body || "",
    author: defaultAuthor,
    category,
    categoryName: cat.name || category,
    tags: ["#Rwanda", "#Travel"],
    destination: "Rwanda",
    season: "Year-round",
    readingTime: `${readingMins} min read`,
    readingMins,
    publishedDate,
    publishedShort,
    updatedAt: p.updatedAt,
    featuredImage: img,
    featured: true,
    evergreen: false,
    trending: false,
    views: 100,
    likes: 10,
    package: "Ask our team",
  };
}

export function postPath(post) {
  return `/blog/${encodeURIComponent(post.slug || post.id)}`;
}

export function findPostByParam(posts, param) {
  if (!param || !Array.isArray(posts)) return null;
  const decoded = decodeURIComponent(param);
  return (
    posts.find((p) => p.slug === decoded) ||
    posts.find((p) => p.id === decoded) ||
    posts.find((p) => p.cmsId === decoded) ||
    posts.find((p) => p.id === `cms-${decoded}`) ||
    null
  );
}

export function formatBodyParagraphs(body) {
  const text = String(body || "").trim();
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}
