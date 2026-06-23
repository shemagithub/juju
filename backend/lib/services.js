import { parseJson } from './helpers.js'

export function mapDestinationRow(r) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? '',
    imageUrls: parseJson(r.image_urls, []),
    lat: Number(r.lat),
    lng: Number(r.lng),
    category: r.category ?? 'parks',
    location: r.location ?? '',
    distance: r.distance ?? '',
    permitRequired: !!r.permit_required,
    permitPrice: Number(r.permit_price ?? 0),
    highlights: parseJson(r.highlights_json, []),
    activities: parseJson(r.activities_json, []),
    bestTime: r.best_time ?? '',
    weather: r.weather ?? '',
    reviews: parseJson(r.reviews_json, []),
    faqs: parseJson(r.faqs_json, []),
    updatedAt: new Date(r.updated_at).toISOString(),
    linkedPackageIds: [],
  }
}

export async function destinationsWithLinks(pool) {
  const [rows] = await pool.query('SELECT * FROM destinations ORDER BY name')
  const dests = rows.map(mapDestinationRow)
  if (!dests.length) return dests
  const ids = dests.map((d) => d.id)
  const ph = ids.map(() => '?').join(',')
  const [links] = await pool.query(
    `SELECT destination_id, package_id FROM destination_package_links WHERE destination_id IN (${ph})`,
    ids,
  )
  const by = {}
  for (const l of links) {
    by[l.destination_id] = by[l.destination_id] ?? []
    by[l.destination_id].push(l.package_id)
  }
  for (const d of dests) d.linkedPackageIds = by[d.id] ?? []
  return dests
}

export async function packagesFull(pool) {
  const [rows] = await pool.query('SELECT * FROM tour_packages ORDER BY title')
  if (!rows.length) return []
  const ids = rows.map((p) => p.id)
  const ph = ids.map(() => '?').join(',')
  const [days] = await pool.query(
    `SELECT package_id, day_number, title, description FROM itinerary_days WHERE package_id IN (${ph}) ORDER BY day_number`,
    ids,
  )
  const [links] = await pool.query(
    `SELECT package_id, destination_id FROM destination_package_links WHERE package_id IN (${ph})`,
    ids,
  )
  const dayBy = {}
  for (const d of days) {
    dayBy[d.package_id] = dayBy[d.package_id] ?? []
    dayBy[d.package_id].push({
      day: d.day_number,
      title: d.title,
      description: d.description,
    })
  }
  const destBy = {}
  for (const l of links) {
    destBy[l.package_id] = destBy[l.package_id] ?? []
    destBy[l.package_id].push(l.destination_id)
  }
  return rows.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    priceRwf: Number(p.price_rwf),
    durationDays: p.duration_days,
    description: p.description,
    imageUrls: parseJson(p.image_urls, []),
    itinerary: dayBy[p.id] ?? [],
    status: p.status,
    destinationIds: destBy[p.id] ?? [],
    categoryId: p.category_id ?? '',
    updatedAt: new Date(p.updated_at).toISOString(),
  }))
}
