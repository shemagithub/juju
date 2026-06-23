import { DEFAULT_ABOUT_PAGE } from "./defaultAboutContent";
import {
  DEFAULT_PRIVACY_POLICY,
  DEFAULT_TERMS_CONDITIONS,
} from "./defaultLegalContent";

export const DEFAULT_SITE_SETTINGS = {
  brandName: "RwandaQuest",
  logoUrl: "",
  companyDescription:
    "Your trusted Rwanda tour operator for gorilla trekking, wildlife safaris, car hire, and unforgettable East African adventures.",
  heroTitle: "Discover Rwanda",
  heroSubtitle:
    "Gorilla trekking, wildlife safaris, and unforgettable East African adventures with local experts.",
  contactEmail: "info@rwandaquest.com",
  contactPhone: "+250 788 123 456",
  emergencyPhone: "+250 788 123 499",
  workingHours: "Monday – Sunday: 8:00 AM – 6:00 PM (Kigali Time)",
  whatsapp: "250788123456",
  address: "KG 123 St, Kigali, Rwanda",
  footerDescription:
    "Your trusted Rwanda tour operator for gorilla trekking, wildlife safaris, car hire, and unforgettable East African adventures.",
  subscribeTitle: "Subscribe Now!",
  subscribeText: "Get Rwanda travel tips, deals & gorilla permit alerts",
  metaTitle: "RwandaQuest Tours — Gorilla Trekking & Safari Rwanda",
  metaDescription:
    "Book gorilla trekking, wildlife safaris, car rental, and custom Rwanda tours with RwandaQuest.",
  publicSiteUrl: "https://rwandaquesttours.com",
  facebook: "https://facebook.com/rwandaquest",
  instagram: "https://instagram.com/rwandaquest",
  twitter: "https://twitter.com/rwandaquest",
  youtube: "https://youtube.com",
  navLinks: [
    { to: "/", label: "Home", end: true },
    { to: "/car-rental", label: "Car Rental" },
    { to: "/packages", label: "Packages" },
    { to: "/about", label: "About Us" },
    { to: "/blog", label: "Blog" },
    { to: "/destinations", label: "Travel Guide" },
    { to: "/contact", label: "Contact Us" },
  ],
  ...DEFAULT_ABOUT_PAGE,
  ...DEFAULT_PRIVACY_POLICY,
  ...DEFAULT_TERMS_CONDITIONS,
};

const ABOUT_NAV_LINK = { to: "/about", label: "About Us" };

/** Ensure About Us appears in header/footer nav even on older DB payloads. */
export function mergeNavLinks(links) {
  const base = (
    Array.isArray(links) && links.length ? [...links] : [...DEFAULT_SITE_SETTINGS.navLinks]
  ).filter((l) => l.to !== "/pricing");
  if (!base.some((l) => l.to === "/about")) {
    const contactIdx = base.findIndex((l) => l.to === "/contact");
    if (contactIdx >= 0) base.splice(contactIdx, 0, ABOUT_NAV_LINK);
    else base.push(ABOUT_NAV_LINK);
  }
  return base;
}