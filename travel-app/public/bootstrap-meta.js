/**
 * Runs before the React bundle to set SEO meta from GET /api/site-settings.
 */
(function bootstrapSiteMeta() {
  var DEFAULTS = {
    brandName: "RwandaQuestTours",
    heroSubtitle:
      "Gorilla trekking, wildlife safaris, and unforgettable East African adventures with local experts.",
    companyDescription:
      "Your trusted Rwanda tour operator for gorilla trekking, wildlife safaris, car hire, and unforgettable East African adventures.",
    metaTitle: "RwandaQuest Tours — Gorilla Trekking & Safari Rwanda",
    metaDescription:
      "Book gorilla trekking, wildlife safaris, car rental, and custom Rwanda tours with RwandaQuest.",
    contactPhone: "+250 799 608 178",
    contactEmail: "info@rwandaquesttours.com",
    address: "KG 123 St, Kigali, Rwanda",
    workingHours: "Monday – Sunday: 8:00 AM – 6:00 PM (Kigali Time)",
    publicSiteUrl: "",
  };

  function getApiBase() {
    if (typeof window.__API_BASE__ === "string" && window.__API_BASE__) {
      return window.__API_BASE__.replace(/\/$/, "");
    }
    var meta = document.querySelector('meta[name="api-base"]');
    return meta ? String(meta.getAttribute("content") || "").replace(/\/$/, "") : "";
  }

  function apiUrl(path) {
    var base = getApiBase();
    var p = path.charAt(0) === "/" ? path : "/" + path;
    return base ? base + p : p;
  }

  function resolveMediaUrl(url) {
    var u = String(url || "").trim();
    if (!u) return "";
    if (/^https?:\/\//i.test(u)) return u;
    var path = u.charAt(0) === "/" ? u : "/" + u;
    var base = getApiBase();
    if (path.indexOf("/uploads/") === 0) return base ? base + path : path;
    return base ? base + path : path;
  }

  function resolveSiteUrl(settings) {
    var configured = String(settings.publicSiteUrl || "").trim().replace(/\/$/, "");
    if (configured && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)) {
      return configured;
    }
    if (window.location && window.location.origin) {
      return window.location.origin.replace(/\/$/, "");
    }
    return configured || "https://rwandaquesttours.com";
  }

  /** Current route, normalised the same way src/utils/seo.js does. */
  function currentPath() {
    var p = String((window.location && window.location.pathname) || "/");
    p = p.split("?")[0].split("#")[0];
    if (p === "/") return "/";
    return p.replace(/\/+$/, "") || "/";
  }

  /**
   * Set by scripts/generate-seo.js on prerendered route HTML. When present the
   * page already carries route-specific title/description tags, so site-wide
   * values from the settings API must not overwrite them.
   */
  function isPrerendered() {
    return !!document.querySelector('meta[name="seo-prerendered"]');
  }

  function upsertMeta(attr, key, content) {
    if (!content) return;
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  function upsertLink(rel, href, id) {
    if (!href) return;
    var selector = id ? "link#" + id : 'link[rel="' + rel + '"]';
    var link = document.querySelector(selector);
    if (!link) {
      link = document.createElement("link");
      link.rel = rel;
      if (id) link.id = id;
      document.head.appendChild(link);
    }
    link.href = href;
  }

  function upsertJsonLd(data) {
    var script = document.getElementById("site-json-ld");
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "site-json-ld";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  function applyMeta(settings) {
    if (!settings || typeof settings !== "object") settings = {};

    var brandName = settings.brandName || DEFAULTS.brandName;
    var heroSubtitle = settings.heroSubtitle || DEFAULTS.heroSubtitle;
    var metaTitle = String(settings.metaTitle || "").trim();
    var metaDescription =
      String(settings.metaDescription || "").trim() ||
      settings.companyDescription ||
      settings.footerDescription ||
      DEFAULTS.metaDescription;
    var title = metaTitle || brandName + " — " + heroSubtitle.split(".")[0];
    var siteUrl = resolveSiteUrl(settings);
    var path = currentPath();
    var pageUrl = path === "/" ? siteUrl + "/" : siteUrl + path;
    var keepPageTags = isPrerendered();
    var logoUrl = resolveMediaUrl(settings.logoUrl || "");
    var imageUrl = siteUrl + "/og-cover.jpg";
    var keywords = [
      brandName,
      "Rwanda tours",
      "gorilla trekking Rwanda",
      "Rwanda safari",
      "Volcanoes National Park",
      "Akagera National Park",
      "Rwanda car rental",
    ].join(", ");

    if (!keepPageTags) {
      document.title = title;
      upsertMeta("name", "description", metaDescription);
      upsertMeta("property", "og:title", title);
      upsertMeta("property", "og:description", metaDescription);
      upsertMeta("name", "twitter:title", title);
      upsertMeta("name", "twitter:description", metaDescription);
      upsertMeta("property", "og:image", imageUrl);
      upsertMeta("name", "twitter:image", imageUrl);
    }

    upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "author", brandName);
    upsertMeta("name", "robots", "index, follow, max-image-preview:large");

    upsertLink("canonical", pageUrl, "site-canonical");

    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", brandName);
    upsertMeta("property", "og:url", pageUrl);
    upsertMeta("property", "og:locale", "en_RW");

    upsertMeta("name", "twitter:card", "summary_large_image");

    if (logoUrl) {
      upsertLink("icon", logoUrl);
      upsertLink("apple-touch-icon", logoUrl);
    }

    var sameAs = [settings.facebook, settings.instagram, settings.twitter, settings.youtube]
      .map(function (u) {
        return String(u || "").trim();
      })
      .filter(function (u) {
        return u && /^https?:\/\//i.test(u);
      });

    upsertJsonLd({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "TravelAgency",
          "@id": siteUrl + "/#organization",
          name: brandName,
          description: metaDescription,
          url: siteUrl,
          logo: logoUrl || undefined,
          image: imageUrl,
          telephone: settings.contactPhone || DEFAULTS.contactPhone,
          email: settings.contactEmail || DEFAULTS.contactEmail,
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address || DEFAULTS.address,
            addressLocality: "Kigali",
            addressCountry: "RW",
          },
          openingHours: settings.workingHours || DEFAULTS.workingHours,
          areaServed: { "@type": "Country", name: "Rwanda" },
          sameAs: sameAs.length ? sameAs : undefined,
        },
        {
          "@type": "WebSite",
          "@id": siteUrl + "/#website",
          url: siteUrl,
          name: brandName,
          description: metaDescription,
          publisher: { "@id": siteUrl + "/#organization" },
          inLanguage: "en",
        },
      ],
    });
  }

  fetch(apiUrl("/api/site-settings"), { headers: { Accept: "application/json" } })
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(applyMeta)
    .catch(function () {
      applyMeta(DEFAULTS);
    });
})();
