/** Default fleet categories — slug matches vehicle.category values. */
export const DEFAULT_CAR_RENTAL_CATEGORIES = [
  { slug: 'economy', name: 'Economy', sortOrder: 10 },
  { slug: 'suv', name: 'SUV', sortOrder: 20 },
  { slug: 'safari', name: 'Safari 4×4', sortOrder: 30 },
  { slug: 'luxury', name: 'Luxury', sortOrder: 40 },
  { slug: 'van', name: 'Van / Minibus', sortOrder: 50 },
  { slug: 'pickup', name: 'Pickup', sortOrder: 60 },
]

export function slugifyCategoryName(name) {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
