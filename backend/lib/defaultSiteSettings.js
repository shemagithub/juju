import { DEFAULT_ABOUT_PAGE } from './defaultAboutContent.js'
import { DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_CONDITIONS } from './defaultLegalContent.js'

/** Default public site settings merged into site_settings on first boot. */
export const DEFAULT_SITE_SETTINGS = {
  brandName: 'RwandaQuest',
  heroTitle: 'Discover Rwanda',
  heroSubtitle:
    'Gorilla trekking, wildlife safaris, and unforgettable East African adventures with local experts.',
  logoUrl: '',
  contactEmail: 'info@rwandaquest.com',
  contactPhone: '+250 788 123 456',
  emergencyPhone: '+250 788 123 499',
  whatsapp: '250788123456',
  address: 'KG 123 St, Kigali, Rwanda',
  workingHours: 'Monday – Sunday: 8:00 AM – 6:00 PM (Kigali Time)',
  companyDescription:
    'Your trusted Rwanda tour operator for gorilla trekking, wildlife safaris, car hire, and unforgettable East African adventures.',
  footerDescription:
    'Your trusted Rwanda tour operator for gorilla trekking, wildlife safaris, car hire, and unforgettable East African adventures.',
  subscribeTitle: 'Subscribe Now!',
  subscribeText: 'Get Rwanda travel tips, deals & gorilla permit alerts',
  metaTitle: 'RwandaQuest Tours — Gorilla Trekking & Safari Rwanda',
  metaDescription:
    'Book gorilla trekking, wildlife safaris, car rental, and custom Rwanda tours with RwandaQuest.',
  facebook: 'https://facebook.com/rwandaquest',
  instagram: 'https://instagram.com/rwandaquest',
  twitter: 'https://twitter.com/rwandaquest',
  youtube: 'https://youtube.com',
  publicSiteUrl: 'http://localhost:3000',
  navLinks: [
    { to: '/', label: 'Home', end: true },
    { to: '/car-rental', label: 'Car Rental' },
    { to: '/packages', label: 'Packages' },
    { to: '/about', label: 'About Us' },
    { to: '/blog', label: 'Blog' },
    { to: '/destinations', label: 'Travel Guide' },
    { to: '/contact', label: 'Contact Us' },
  ],
  ...DEFAULT_ABOUT_PAGE,
  ...DEFAULT_PRIVACY_POLICY,
  ...DEFAULT_TERMS_CONDITIONS,
}

/** Fill missing keys from defaults without overwriting admin-edited values. */
export function mergeSiteSettingsDefaults(current = {}) {
  const merged = { ...current }
  for (const [key, value] of Object.entries(DEFAULT_SITE_SETTINGS)) {
    if (merged[key] === undefined || merged[key] === null || merged[key] === '') {
      merged[key] = value
    }
  }
  return merged
}
