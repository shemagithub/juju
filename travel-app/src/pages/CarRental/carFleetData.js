import { resolveMediaUrl as resolveApiMediaUrl } from "../../utils/backendApi";
import economyImg from "../../assets/images/car-rental/economy.jpg";
import compactSuvImg from "../../assets/images/car-rental/compact-suv.jpg";
import safari4x4Img from "../../assets/images/car-rental/safari-4x4.jpg";
import luxurySuvImg from "../../assets/images/car-rental/luxury-suv.jpg";
import slider1 from "../../assets/images/slider/1.jpg";
import slider2 from "../../assets/images/slider/2.png";
import gallery1 from "../../assets/images/gallery/g1.jpg";
import gallery2 from "../../assets/images/gallery/g2.jpg";
import gallery3 from "../../assets/images/gallery/g3.jpg";

/** Matches admin panel + backend VEHICLE_CATEGORY_LABELS */
export const VEHICLE_CATEGORY_LABELS = {
  economy: "Economy",
  suv: "SUV",
  safari: "Safari 4×4",
  luxury: "Luxury",
  van: "Van / Minibus",
  pickup: "Pickup",
  other: "Other",
};

const SLUG_CATEGORY_FALLBACK = {
  economy: "economy",
  suv: "suv",
  fourbyfour: "safari",
  luxury: "luxury",
  hiace: "van",
  prado: "safari",
};

export function normalizeVehicleCategory(raw, slug = "") {
  const key = String(raw ?? "").trim().toLowerCase();
  if (key) return key;
  return SLUG_CATEGORY_FALLBACK[slug] || "other";
}

export function getVehicleCategoryLabel(key) {
  const k = normalizeVehicleCategory(key);
  return VEHICLE_CATEGORY_LABELS[k] || k.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function buildCategoryPillsFromFleet(fleet) {
  const counts = {};
  fleet.forEach((v) => {
    const key = normalizeVehicleCategory(v.category, v.slug);
    counts[key] = (counts[key] || 0) + 1;
  });
  const order = ["economy", "suv", "safari", "luxury", "van", "pickup"];
  const keys = Object.keys(counts).sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return getVehicleCategoryLabel(a).localeCompare(getVehicleCategoryLabel(b));
  });
  return {
    total: fleet.length,
    categories: keys.map((key) => ({
      key,
      label: getVehicleCategoryLabel(key),
      count: counts[key],
    })),
  };
}

export const FALLBACK_IMAGE_BY_SLUG = {
  economy: economyImg,
  suv: compactSuvImg,
  fourbyfour: safari4x4Img,
  luxury: luxurySuvImg,
  hiace: safari4x4Img,
  prado: compactSuvImg,
};

const GALLERY_BY_SLUG = {
  economy: [economyImg, slider1, gallery1, gallery2],
  suv: [compactSuvImg, slider2, gallery2, gallery3],
  fourbyfour: [safari4x4Img, slider1, gallery1, gallery3],
  luxury: [luxurySuvImg, slider2, gallery2, gallery1],
  hiace: [safari4x4Img, slider1, gallery2, gallery3],
  prado: [compactSuvImg, gallery1, slider2, gallery3],
};

export const FALLBACK_FLEET = [
  {
    id: "economy",
    slug: "economy",
    fullTitle: "Toyota Yaris 1.5 Hybrid",
    badge: "City & airport",
    title: "Economy",
    category: "economy",
    blurb: "Ideal for Kigali city runs, meetings, and short transfers.",
    description:
      "The Toyota Yaris 1.5 Hybrid is our most efficient city car — perfect for airport pickups, hotel transfers, and navigating Kigali's streets. Low fuel consumption, easy parking, and a smooth automatic transmission make it the smart choice for business travellers and couples exploring the capital.",
    priceFrom: 35,
    location: "Kigali, Rwanda",
    rating: 4.92,
    reviewCount: 348,
    mileage: "15,200 km",
    transmission: "Automatic",
    fuel: "Petrol",
    seats: "4 seats",
    imageSrc: economyImg,
    gallery: GALLERY_BY_SLUG.economy,
    features: [
      "Bluetooth & USB charging",
      "Air conditioning",
      "Comprehensive insurance",
      "24/7 roadside assistance",
      "Unlimited Kigali mileage",
    ],
    included: [
      "Vehicle registration & insurance papers",
      "Spare tyre and jack",
      "First aid kit",
      "Airport meet & greet (optional)",
    ],
    goodToKnow: [
      "Minimum driver age 23 with 2+ years licence",
      "Security deposit held on card at pickup",
      "Not suitable for national park gravel tracks",
    ],
    specs: [
      { icon: "bi-speedometer2", text: "15,200 km" },
      { icon: "bi-gear-wide-connected", text: "Automatic" },
      { icon: "bi-fuel-pump", text: "Petrol" },
      { icon: "bi-people", text: "4 seats" },
      { icon: "bi-suitcase2", text: "2 large bags" },
      { icon: "bi-shield-check", text: "Full insurance" },
    ],
  },
  {
    id: "suv",
    slug: "suv",
    fullTitle: "Toyota RAV4 2.5 AWD",
    badge: "Family & comfort",
    title: "Compact SUV",
    category: "suv",
    blurb: "Room for family luggage and lake or park drives in comfort.",
    description:
      "The Toyota RAV4 offers elevated seating, generous boot space, and all-wheel drive confidence for family trips around Rwanda. Comfortable for long drives to Lake Kivu, Musanze, or Akagera's tarmac approaches — with modern safety features and climate control throughout.",
    priceFrom: 75,
    location: "Kigali, Rwanda",
    rating: 4.96,
    reviewCount: 512,
    mileage: "22,400 km",
    transmission: "Automatic",
    fuel: "Petrol",
    seats: "5 seats",
    imageSrc: compactSuvImg,
    gallery: GALLERY_BY_SLUG.suv,
    features: [
      "All-wheel drive",
      "Rear climate vents",
      "Reverse camera & parking sensors",
      "Roof rails for gear",
      "Child seat anchors (ISOFIX)",
    ],
    included: [
      "Comprehensive insurance",
      "GPS navigation on request",
      "Roadside assistance nationwide",
      "Free Kigali airport delivery",
    ],
    goodToKnow: [
      "Suitable for paved and light gravel roads",
      "Child seats available as an extra",
      "Cross-border permits arranged on request",
    ],
    specs: [
      { icon: "bi-speedometer2", text: "22,400 km" },
      { icon: "bi-gear-wide-connected", text: "Automatic" },
      { icon: "bi-fuel-pump", text: "Petrol" },
      { icon: "bi-people", text: "5 seats" },
      { icon: "bi-suitcase2", text: "4 large bags" },
      { icon: "bi-snow", text: "Dual-zone A/C" },
    ],
  },
  {
    id: "fourbyfour",
    slug: "fourbyfour",
    fullTitle: "Toyota Land Cruiser 4×4",
    badge: "Safari & parks",
    title: "4×4 Safari",
    category: "safari",
    blurb: "Built for Volcanoes, Akagera, and Nyungwe access roads.",
    description:
      "Our Toyota Land Cruiser is the definitive Rwanda safari vehicle — high ground clearance, diesel torque, and seating for up to seven. Approved for Volcanoes National Park gorilla trekking access roads, Akagera wildlife tracks, and the winding routes to Nyungwe Forest.",
    priceFrom: 120,
    location: "Musanze, Rwanda",
    rating: 4.98,
    reviewCount: 672,
    mileage: "18,900 km",
    transmission: "Automatic",
    fuel: "Diesel",
    seats: "7 seats",
    imageSrc: safari4x4Img,
    gallery: GALLERY_BY_SLUG.fourbyfour,
    features: [
      "High/low range 4×4",
      "Bull bar & snorkel-ready",
      "Long-range fuel tank",
      "Cool box for park picnics",
      "Pop-up roof option on select units",
    ],
    included: [
      "Park-access approved vehicle papers",
      "Spare tyre, tools & recovery kit",
      "Experienced driver available",
      "Satellite phone on multi-day hires",
    ],
    goodToKnow: [
      "Recommended for all national park visits",
      "Driver/guide strongly advised for Akagera",
      "Fuel not included on safari rates",
    ],
    specs: [
      { icon: "bi-speedometer2", text: "18,900 km" },
      { icon: "bi-gear-wide-connected", text: "Automatic" },
      { icon: "bi-fuel-pump", text: "Diesel" },
      { icon: "bi-people", text: "7 seats" },
      { icon: "bi-tree", text: "Safari-ready" },
      { icon: "bi-wrench-adjustable", text: "Recovery kit" },
    ],
  },
  {
    id: "luxury",
    slug: "luxury",
    fullTitle: "Range Rover Sport 3.0 SDV6",
    badge: "Executive",
    title: "Luxury SUV",
    category: "luxury",
    blurb: "Business delegations, VIP airport pickups, and bespoke itineraries.",
    description:
      "The Range Rover Sport delivers executive comfort for VIP airport transfers, diplomatic visits, and premium private tours. Leather interior, Meridian sound, and a professional chauffeur option ensure every journey across Rwanda is refined and effortless.",
    priceFrom: 180,
    location: "Kigali, Rwanda",
    rating: 4.94,
    reviewCount: 189,
    mileage: "12,100 km",
    transmission: "Automatic",
    fuel: "Diesel",
    seats: "5 seats",
    imageSrc: luxurySuvImg,
    gallery: GALLERY_BY_SLUG.luxury,
    features: [
      "Premium leather interior",
      "Panoramic sunroof",
      "Meridian surround sound",
      "Heated & ventilated seats",
      "Privacy glass",
    ],
    included: [
      "Professional chauffeur on request",
      "VIP airport meet & greet",
      "Bottled water & amenities",
      "Premium insurance cover",
    ],
    goodToKnow: [
      "Chauffeur service quoted separately",
      "Minimum 3-day hire for out-of-town",
      "Advance booking recommended",
    ],
    specs: [
      { icon: "bi-speedometer2", text: "12,100 km" },
      { icon: "bi-gear-wide-connected", text: "Automatic" },
      { icon: "bi-fuel-pump", text: "Diesel" },
      { icon: "bi-people", text: "5 seats" },
      { icon: "bi-star", text: "Executive trim" },
      { icon: "bi-person-badge", text: "Chauffeur option" },
    ],
  },
  {
    id: "hiace",
    slug: "hiace",
    fullTitle: "Toyota Hiace 2.8 Diesel",
    badge: "Group travel",
    title: "Passenger Van",
    category: "van",
    blurb: "Ideal for church groups, conferences, and team transfers.",
    description:
      "The Toyota Hiace seats up to 14 passengers comfortably — the go-to choice for group airport transfers, conference shuttles, and community tours across Rwanda. Reliable diesel engine, ample luggage space, and experienced drivers available for multi-day charters.",
    priceFrom: 95,
    location: "Kigali, Rwanda",
    rating: 4.88,
    reviewCount: 241,
    mileage: "28,600 km",
    transmission: "Manual",
    fuel: "Diesel",
    seats: "14 seats",
    imageSrc: safari4x4Img,
    gallery: GALLERY_BY_SLUG.hiace,
    features: [
      "14-seat configuration",
      "Overhead luggage racks",
      "PA system for guides",
      "Tinted windows",
      "Multiple USB ports",
    ],
    included: [
      "Driver included on all hires",
      "Fuel estimate provided upfront",
      "Group insurance cover",
      "Itinerary planning support",
    ],
    goodToKnow: [
      "Driver mandatory for this vehicle class",
      "Book 7+ days ahead for peak season",
      "Custom branding available for events",
    ],
    specs: [
      { icon: "bi-speedometer2", text: "28,600 km" },
      { icon: "bi-gear-wide-connected", text: "Manual" },
      { icon: "bi-fuel-pump", text: "Diesel" },
      { icon: "bi-people", text: "14 seats" },
      { icon: "bi-bus-front", text: "Group shuttle" },
      { icon: "bi-person-badge", text: "Driver included" },
    ],
  },
  {
    id: "prado",
    slug: "prado",
    fullTitle: "Toyota Prado TX 2.7",
    badge: "Safari ready",
    title: "Safari Prado",
    category: "safari",
    blurb: "Premium 4×4 for gorilla trekking and multi-park itineraries.",
    description:
      "The Toyota Prado TX balances safari capability with passenger comfort — the preferred 4×4 for gorilla trekking in Volcanoes, golden monkey tracking, and multi-day circuits linking Akagera, Kigali, and the lakes region. Powerful yet refined for long driving days.",
    priceFrom: 140,
    location: "Akagera, Rwanda",
    rating: 4.97,
    reviewCount: 423,
    mileage: "20,300 km",
    transmission: "Automatic",
    fuel: "Diesel",
    seats: "7 seats",
    imageSrc: compactSuvImg,
    gallery: GALLERY_BY_SLUG.prado,
    features: [
      "Full-time 4×4 with diff lock",
      "7-seat flexible layout",
      "Cool box & picnic kit",
      "Roof rack for trekking gear",
      "Enhanced suspension",
    ],
    included: [
      "Park permit vehicle documentation",
      "Experienced safari driver option",
      "First aid & emergency kit",
      "Unlimited mileage on 5+ day hires",
    ],
    goodToKnow: [
      "Most popular for gorilla trek days",
      "Early starts recommended for park gates",
      "Fuel surcharge may apply on long safaris",
    ],
    specs: [
      { icon: "bi-speedometer2", text: "20,300 km" },
      { icon: "bi-gear-wide-connected", text: "Automatic" },
      { icon: "bi-fuel-pump", text: "Diesel" },
      { icon: "bi-people", text: "7 seats" },
      { icon: "bi-tree", text: "Gorilla trek ready" },
      { icon: "bi-shield-check", text: "Premium cover" },
    ],
  },
];

export function parseSpecField(specs, icon, fallback) {
  const hit = Array.isArray(specs) ? specs.find((s) => s.icon === icon) : null;
  return hit?.text || fallback;
}

function buildGallery(slug, imageSrc, apiGallery = []) {
  const fromApi = apiGallery.map((u) => resolveApiMediaUrl(u)).filter(Boolean);
  if (fromApi.length) return [...new Set(fromApi)];
  const base = GALLERY_BY_SLUG[slug] || [imageSrc, slider1, gallery1];
  return [...new Set([imageSrc, ...base])];
}

function buildFeatureList(v, specs, fallback) {
  const fromSpecs = specs.map((s) => s.text).filter(Boolean);
  const flags = [];
  if (v.driverIncluded) flags.push("Professional driver included");
  if (v.selfDriveAvailable) flags.push("Self-drive available");
  if (v.airportTransferVehicle) flags.push("Airport transfer ready");
  if (v.touristSafariVehicle) flags.push("Tourist safari vehicle");
  if (v.unlimitedMileageOption) flags.push("Unlimited mileage option");
  if (v.gpsInstalled) flags.push("GPS vehicle tracking");
  if (v.airConditioning) flags.push("Air conditioning");
  if (v.deliveryAvailable) flags.push("Delivery available");
  const merged = [...flags, ...fromSpecs];
  if (merged.length) return merged;
  return fallback?.features || [];
}

function buildIncludedList(v, fallback) {
  const items = [];
  if (v.pickupLocations?.length) {
    items.push(`Pickup: ${v.pickupLocations.join(", ")}`);
  }
  if (v.driverLanguages?.length) {
    items.push(`Driver languages: ${v.driverLanguages.join(", ")}`);
  }
  if (v.weeklyRate > 0) items.push(`Weekly rate from $${Number(v.weeklyRate).toFixed(0)}`);
  if (v.monthlyRate > 0) items.push(`Monthly rate from $${Number(v.monthlyRate).toFixed(0)}`);
  if (v.deposit > 0) items.push(`Security deposit: $${Number(v.deposit).toFixed(0)}`);
  if (items.length) return items;
  return fallback?.included || [];
}

export function normalizeCatalogVehicle(v) {
  const slug = String(v.slug || "").trim();
  const rawImg = String(v.imageUrl || "").trim();
  let imageSrc = FALLBACK_IMAGE_BY_SLUG[slug] || economyImg;
  if (rawImg) {
    const resolved = resolveApiMediaUrl(rawImg);
    if (resolved) imageSrc = resolved;
  }
  const specs = Array.isArray(v.specs) ? v.specs : [];
  const fallback = FALLBACK_FLEET.find((f) => f.slug === slug);
  const blurb = String(v.blurb || fallback?.blurb || "");
  const apiGallery = Array.isArray(v.galleryUrls) ? v.galleryUrls : [];
  const gallery = buildGallery(slug, imageSrc, apiGallery);
  const seatsText =
    v.seats != null && v.seats !== ""
      ? `${v.seats} seats`
      : parseSpecField(specs, "bi-people", fallback?.seats || "5 seats");
  const pickup = Array.isArray(v.pickupLocations) ? v.pickupLocations.filter(Boolean) : [];

  return {
    id: String(v.id || slug),
    slug,
    fullTitle: String(v.vehicleName || v.title || fallback?.fullTitle || slug),
    badge: String(v.badge || fallback?.badge || ""),
    title: String(v.title || slug),
    blurb,
    description: String(v.description || blurb || fallback?.description || ""),
    priceFrom: Number(v.dailyRate ?? v.dailyPriceUsd ?? fallback?.priceFrom ?? 0),
    weeklyRate: Number(v.weeklyRate ?? 0),
    monthlyRate: Number(v.monthlyRate ?? 0),
    location: pickup[0] || fallback?.location || "Kigali, Rwanda",
    rating: fallback?.rating ?? 4.9,
    reviewCount: fallback?.reviewCount ?? 200,
    mileage: parseSpecField(specs, "bi-speedometer2", fallback?.mileage || "Low mileage fleet"),
    transmission: String(v.transmission || parseSpecField(specs, "bi-gear", fallback?.transmission || "Automatic")),
    fuel: String(v.fuelType || parseSpecField(specs, "bi-fuel-pump", fallback?.fuel || "Petrol")),
    seats: seatsText,
    brand: String(v.brand || ""),
    model: String(v.model || ""),
    category: normalizeVehicleCategory(v.category || fallback?.category, slug),
    categoryLabel: getVehicleCategoryLabel(
      normalizeVehicleCategory(v.category || fallback?.category, slug),
    ),
    featured: !!v.featured,
    popularBadge: !!v.popularBadge,
    imageSrc: gallery[0] || imageSrc,
    gallery,
    specs: specs.length ? specs : fallback?.specs || [],
    features: buildFeatureList(v, specs, fallback),
    included: buildIncludedList(v, fallback),
    goodToKnow:
      Array.isArray(v.goodToKnow) && v.goodToKnow.length ? v.goodToKnow : fallback?.goodToKnow || [],
  };
}

export function normalizeCatalogToFleet(apiRows) {
  if (!Array.isArray(apiRows) || apiRows.length === 0) return null;
  return apiRows.map(normalizeCatalogVehicle);
}

export function findVehicleBySlug(fleet, slug) {
  const key = String(slug || "").trim().toLowerCase();
  return fleet.find((v) => v.slug === key) || FALLBACK_FLEET.find((v) => v.slug === key) || null;
}
