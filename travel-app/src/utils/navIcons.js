/** Bootstrap icon class for primary site nav routes (mobile bottom bar). */
const NAV_ICON_BY_PATH = {
  "/": "bi-house-door",
  "/car-rental": "bi-car-front",
  "/packages": "bi-suitcase2",
  "/about": "bi-info-circle",
  "/blog": "bi-journal-text",
  "/destinations": "bi-map",
  "/contact": "bi-envelope",
  "/gallery": "bi-images",
  "/book": "bi-calendar-check",
  "/services": "bi-compass",
};

function normalizeNavPath(to) {
  const raw = String(to || "/").trim();
  if (!raw || raw === "/") return "/";
  return raw.replace(/\/+$/, "") || "/";
}

export function getNavLinkIcon(to) {
  const path = normalizeNavPath(to);
  if (NAV_ICON_BY_PATH[path]) return NAV_ICON_BY_PATH[path];

  if (path.includes("car-rental")) return "bi-car-front";
  if (path.includes("package")) return "bi-suitcase2";
  if (path.includes("blog")) return "bi-journal-text";
  if (path.includes("destination")) return "bi-map";
  if (path.includes("contact")) return "bi-envelope";
  if (path.includes("about")) return "bi-info-circle";

  return "bi-link-45deg";
}
