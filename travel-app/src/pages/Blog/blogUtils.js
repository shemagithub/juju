import { resolveMediaUrl } from "../../utils/backendApi";

export function inferBlogCategory(slugAndName) {
  const s = String(slugAndName || "").toLowerCase();
  if (s.includes("gorilla")) return "gorilla";
  if (s.includes("safari") || s.includes("wildlife")) return "safari";
  if (s.includes("culture") || s.includes("history")) return "culture";
  if (s.includes("news")) return "news";
  if (s.includes("hotel") || s.includes("lodge") || s.includes("review")) return "reviews";
  return "guide";
}

export function mapCmsBlogPost(p, catById, defaultAuthor, defaultImg) {
  const cat = catById[p.categoryId] || {};
  const slugKey = (cat.slug || cat.name || "").toLowerCase();
  const category = inferBlogCategory(`${slugKey} ${cat.name || ""}`);
  const iso = p.updatedAt ? new Date(p.updatedAt) : new Date();
  const publishedDate = Number.isFinite(iso.getTime())
    ? iso.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
    : "";
  const publishedShort = Number.isFinite(iso.getTime())
    ? iso.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "";
  const img = resolveMediaUrl(p.coverImageUrl) || defaultImg;
  const textLen = (p.excerpt || p.body || "").length;
  const readingMins = Math.min(99, Math.max(3, Math.ceil(textLen / 1200) || 8));
  const cmsId = String(p.id);
  const slug = (p.slug || "").trim() || `cms-${cmsId}`;

  return {
    id: `cms-${cmsId}`,
    cmsId,
    slug,
    title: p.title,
    excerpt: (p.excerpt || "").slice(0, 400) || p.title,
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
