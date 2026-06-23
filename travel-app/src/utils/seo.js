import { resolveMediaUrl } from "./backendApi";
import { DEFAULT_SITE_SETTINGS } from "../config/defaultSiteSettings";

const PAGE_SEO = {
  "/": {},
  "/about": {
    title: "About Us",
    description:
      "Learn about our Rwanda tour team, mission, and why travelers trust us for gorilla trekking, safaris, and custom East Africa adventures.",
  },
  "/packages": {
    title: "Tour Packages",
    description:
      "Browse gorilla trekking, wildlife safari, and custom Rwanda tour packages with expert local guides and transparent pricing.",
  },
  "/car-rental": {
    title: "Car Rental",
    description:
      "Rent safari 4x4s, SUVs, and economy cars in Rwanda for self-drive or chauffeur trips across Kigali and national parks.",
  },
  "/destinations": {
    title: "Travel Guide",
    description:
      "Explore Rwanda destinations — Volcanoes National Park, Akagera, Nyungwe, Lake Kivu, and Kigali travel tips from local experts.",
  },
  "/blog": {
    title: "Travel Blog",
    description:
      "Rwanda travel tips, gorilla permit updates, safari guides, and destination stories from our local tour experts.",
  },
  "/contact": {
    title: "Contact Us",
    description:
      "Contact our Rwanda travel team for tour quotes, gorilla permits, car hire, and custom itinerary planning.",
  },
  "/gallery": {
    title: "Photo Gallery",
    description:
      "See photos from gorilla trekking, wildlife safaris, and Rwanda landscapes captured on our tours.",
  },
  "/book": {
    title: "Book a Tour",
    description:
      "Book gorilla trekking, safaris, and Rwanda tours online — secure requests with flexible payment options.",
  },
  "/services": {
    title: "Our Services",
    description:
      "Tour packages, car rental, airport transfers, and bespoke Rwanda travel services from a licensed local operator.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "How we collect, use, and protect your personal information when you book Rwanda tours with us.",
  },
  "/terms": {
    title: "Terms & Conditions",
    description: "Booking terms, cancellation policy, and conditions for Rwanda tour and car rental services.",
  },
};

function normalizePath(pathname = "/") {
  const p = String(pathname || "/").split("?")[0].split("#")[0];
  if (p === "/") return "/";
  return p.replace(/\/+$/, "") || "/";
}

export function resolvePublicSiteUrl(settings = {}, originFallback = "") {
  const configured = String(settings.publicSiteUrl || "").trim().replace(/\/$/, "");
  if (configured && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)) {
    return configured;
  }
  if (originFallback) return String(originFallback).replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/$/, "");
  }
  return configured || "https://rwandaquesttours.com";
}

export function getPageSeo(pathname) {
  const path = normalizePath(pathname);
  if (PAGE_SEO[path]) return { path, ...PAGE_SEO[path] };

  if (path.startsWith("/car-rental/")) {
    return {
      path,
      title: "Car Rental Details",
      description:
        "Vehicle details, daily rates, and booking for Rwanda car rental — safari 4x4s, SUVs, and more.",
    };
  }

  return { path };
}

function buildKeywords(settings, pageTitle) {
  const brand = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;
  const base = [
    brand,
    "Rwanda tours",
    "gorilla trekking Rwanda",
    "Rwanda safari",
    "Volcanoes National Park",
    "Akagera National Park",
    "Nyungwe Forest",
    "Lake Kivu",
    "Kigali tours",
    "Rwanda car rental",
    "East Africa travel",
  ];
  if (pageTitle) base.unshift(pageTitle);
  return [...new Set(base.filter(Boolean))].join(", ");
}

export function buildSeoPayload(settings = {}, pageOverride = {}, originFallback = "") {
  const brandName = settings.brandName || DEFAULT_SITE_SETTINGS.brandName;
  const heroSubtitle = settings.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle;
  const defaultTitle =
    String(settings.metaTitle ?? "").trim() ||
    `${brandName} — ${heroSubtitle.split(".")[0]}`;
  const defaultDescription =
    String(settings.metaDescription ?? "").trim() ||
    settings.companyDescription ||
    settings.footerDescription ||
    DEFAULT_SITE_SETTINGS.metaDescription;

  const pageTitle = String(pageOverride.title ?? "").trim();
  const pageDescription = String(pageOverride.description ?? "").trim();
  const path = normalizePath(pageOverride.path || "/");

  const title = pageTitle
    ? `${pageTitle} | ${brandName}`
    : path === "/"
      ? defaultTitle
      : `${brandName} — ${defaultTitle.split("—")[0].trim()}`;

  const description = pageDescription || defaultDescription;
  const siteUrl = resolvePublicSiteUrl(settings, originFallback);
  const pageUrl = `${siteUrl}${path === "/" ? "" : path}`;
  const logoUrl = resolveMediaUrl(settings.logoUrl || "");
  const imageUrl = logoUrl || `${siteUrl}/logo512.png`;
  const keywords = buildKeywords(settings, pageTitle);

  const sameAs = [settings.facebook, settings.instagram, settings.twitter, settings.youtube]
    .map((u) => String(u || "").trim())
    .filter((u) => u && /^https?:\/\//i.test(u));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TravelAgency",
        "@id": `${siteUrl}/#organization`,
        name: brandName,
        description,
        url: siteUrl,
        logo: logoUrl || undefined,
        image: imageUrl,
        telephone: settings.contactPhone || DEFAULT_SITE_SETTINGS.contactPhone,
        email: settings.contactEmail || DEFAULT_SITE_SETTINGS.contactEmail,
        address: {
          "@type": "PostalAddress",
          streetAddress: settings.address || DEFAULT_SITE_SETTINGS.address,
          addressLocality: "Kigali",
          addressCountry: "RW",
        },
        openingHours: settings.workingHours || DEFAULT_SITE_SETTINGS.workingHours,
        areaServed: { "@type": "Country", name: "Rwanda" },
        sameAs: sameAs.length ? sameAs : undefined,
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: brandName,
        description: defaultDescription,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#organization` },
        inLanguage: "en",
      },
    ],
  };

  return {
    title,
    description,
    keywords,
    siteUrl,
    pageUrl,
    imageUrl,
    brandName,
    jsonLd,
  };
}

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel, href, extra = {}) {
  if (!href) return;
  const selector = extra.id
    ? `link#${extra.id}`
    : `link[rel="${rel}"]${extra.hreflang ? `[hreflang="${extra.hreflang}"]` : ""}`;
  let link = document.querySelector(selector);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    if (extra.id) link.id = extra.id;
    if (extra.hreflang) link.hreflang = extra.hreflang;
    document.head.appendChild(link);
  }
  link.href = href;
}

function upsertJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

/** Apply document title, meta, Open Graph, Twitter, canonical, and JSON-LD. */
export function applySeoMeta(seo) {
  if (typeof document === "undefined" || !seo) return;

  document.title = seo.title;

  upsertMeta("name", "description", seo.description);
  upsertMeta("name", "keywords", seo.keywords);
  upsertMeta("name", "author", seo.brandName);
  upsertMeta("name", "robots", "index, follow, max-image-preview:large");
  upsertMeta("name", "googlebot", "index, follow");

  upsertLink("canonical", seo.pageUrl, { id: "site-canonical" });

  upsertMeta("property", "og:type", "website");
  upsertMeta("property", "og:site_name", seo.brandName);
  upsertMeta("property", "og:title", seo.title);
  upsertMeta("property", "og:description", seo.description);
  upsertMeta("property", "og:url", seo.pageUrl);
  upsertMeta("property", "og:image", seo.imageUrl);
  upsertMeta("property", "og:locale", "en_RW");

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", seo.title);
  upsertMeta("name", "twitter:description", seo.description);
  upsertMeta("name", "twitter:image", seo.imageUrl);

  if (seo.imageUrl && seo.imageUrl.includes("/uploads/")) {
    upsertLink("icon", seo.imageUrl);
    upsertLink("apple-touch-icon", seo.imageUrl);
  }

  upsertJsonLd("site-json-ld", seo.jsonLd);
}

/** Apply site-wide default SEO from settings (home page). */
export function applySiteMeta(settings = {}) {
  const seo = buildSeoPayload(settings, getPageSeo("/"));
  applySeoMeta(seo);
}

export function applyPageSeo(settings = {}, pathname = "/") {
  const page = getPageSeo(pathname);
  const seo = buildSeoPayload(settings, page);
  applySeoMeta(seo);
}
