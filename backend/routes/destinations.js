import { randomUUID } from 'crypto'
import { destinationsWithLinks } from '../lib/services.js'
import { DEFAULT_DESTINATION_SEEDS } from '../lib/destinationDefaults.js'

const EXTENDED_COLS = [
  ['category', "VARCHAR(64) NOT NULL DEFAULT 'parks'"],
  ['location', "VARCHAR(255) NOT NULL DEFAULT ''"],
  ['distance', "VARCHAR(255) NOT NULL DEFAULT ''"],
  ['permit_required', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['permit_price', 'DECIMAL(12, 2) NOT NULL DEFAULT 0'],
  ['highlights_json', 'JSON NULL'],
  ['activities_json', 'JSON NULL'],
  ['best_time', "VARCHAR(255) NOT NULL DEFAULT ''"],
  ['weather', "VARCHAR(255) NOT NULL DEFAULT ''"],
  ['reviews_json', 'JSON NULL'],
  ['faqs_json', 'JSON NULL'],
]

export async function ensureDestinationExtendedColumns(pool) {
  for (const [name, def] of EXTENDED_COLS) {
    try {
      await pool.query(`ALTER TABLE destinations ADD COLUMN ${name} ${def}`)
    } catch (e) {
      const code = e?.code ?? ''
      const msg = String(e?.message ?? '')
      if (code !== 'ER_DUP_FIELDNAME' && !/Duplicate column/i.test(msg)) throw e
    }
  }
}

export async function backfillDestinationDefaults(pool) {
  const { parseJson } = await import('../lib/helpers.js')
  for (const s of DEFAULT_DESTINATION_SEEDS) {
    const [rows] = await pool.query(
      'SELECT id, highlights_json FROM destinations WHERE slug = ? LIMIT 1',
      [s.slug],
    )
    const row = rows[0]
    if (!row) continue
    const highlights = parseJson(row.highlights_json, [])
    if (highlights.length > 0) continue
    await pool.query(
      `UPDATE destinations SET
         category = ?, location = ?, distance = ?, permit_required = ?, permit_price = ?,
         highlights_json = ?, activities_json = ?, best_time = ?, weather = ?,
         reviews_json = ?, faqs_json = ?
       WHERE id = ?`,
      [
        s.category,
        s.location,
        s.distance,
        s.permitRequired ? 1 : 0,
        s.permitPrice ?? 0,
        JSON.stringify(s.highlights ?? []),
        JSON.stringify(s.activities ?? []),
        s.bestTime ?? '',
        s.weather ?? '',
        JSON.stringify(s.reviews ?? []),
        JSON.stringify(s.faqs ?? []),
        row.id,
      ],
    )
  }
}

export async function seedDefaultDestinations(pool) {
  const [[row]] = await pool.query('SELECT COUNT(*) AS c FROM destinations')
  if (Number(row?.c ?? 0) > 0) return
  for (const s of DEFAULT_DESTINATION_SEEDS) {
    const id = randomUUID()
    await pool.query(
      `INSERT INTO destinations
       (id, name, slug, description, image_urls, lat, lng, category, location, distance,
        permit_required, permit_price, highlights_json, activities_json, best_time, weather,
        reviews_json, faqs_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        s.name,
        s.slug,
        s.description,
        JSON.stringify([]),
        s.lat,
        s.lng,
        s.category,
        s.location,
        s.distance,
        s.permitRequired ? 1 : 0,
        s.permitPrice ?? 0,
        JSON.stringify(s.highlights ?? []),
        JSON.stringify(s.activities ?? []),
        s.bestTime ?? '',
        s.weather ?? '',
        JSON.stringify(s.reviews ?? []),
        JSON.stringify(s.faqs ?? []),
      ],
    )
  }
}

function pickDestinationPayload(b) {
  return {
    name: b.name,
    slug:
      b.slug ??
      String(b.name ?? '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-'),
    description: b.description ?? '',
    imageUrls: b.imageUrls ?? [],
    lat: b.lat ?? 0,
    lng: b.lng ?? 0,
    category: b.category ?? 'parks',
    location: b.location ?? '',
    distance: b.distance ?? '',
    permitRequired: !!b.permitRequired,
    permitPrice: Number(b.permitPrice ?? 0),
    highlights: Array.isArray(b.highlights) ? b.highlights : [],
    activities: Array.isArray(b.activities) ? b.activities : [],
    bestTime: b.bestTime ?? '',
    weather: b.weather ?? '',
    reviews: Array.isArray(b.reviews) ? b.reviews : [],
    faqs: Array.isArray(b.faqs) ? b.faqs : [],
    linkedPackageIds: b.linkedPackageIds,
  }
}

async function insertDestination(pool, b) {
  const p = pickDestinationPayload(b)
  const id = b.id ?? randomUUID()
  await pool.query(
    `INSERT INTO destinations
     (id, name, slug, description, image_urls, lat, lng, category, location, distance,
      permit_required, permit_price, highlights_json, activities_json, best_time, weather,
      reviews_json, faqs_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      p.name,
      p.slug,
      p.description,
      JSON.stringify(p.imageUrls),
      p.lat,
      p.lng,
      p.category,
      p.location,
      p.distance,
      p.permitRequired ? 1 : 0,
      p.permitPrice,
      JSON.stringify(p.highlights),
      JSON.stringify(p.activities),
      p.bestTime,
      p.weather,
      JSON.stringify(p.reviews),
      JSON.stringify(p.faqs),
    ],
  )
  if (Array.isArray(p.linkedPackageIds)) {
    if (p.linkedPackageIds.length) {
      const vals = []
      const sql = p.linkedPackageIds
        .map((pid) => {
          vals.push(id, pid)
          return '(?, ?)'
        })
        .join(',')
      await pool.query(
        `INSERT INTO destination_package_links (destination_id, package_id) VALUES ${sql}`,
        vals,
      )
    }
  }
  return id
}

function buildPatchFields(b) {
  const fields = []
  const vals = []
  const set = (col, val) => {
    fields.push(`${col} = ?`)
    vals.push(val)
  }
  if (b.name !== undefined) set('name', b.name)
  if (b.slug !== undefined) set('slug', b.slug)
  if (b.description !== undefined) set('description', b.description)
  if (b.imageUrls !== undefined) set('image_urls', JSON.stringify(b.imageUrls ?? []))
  if (b.lat !== undefined) set('lat', b.lat)
  if (b.lng !== undefined) set('lng', b.lng)
  if (b.category !== undefined) set('category', b.category)
  if (b.location !== undefined) set('location', b.location)
  if (b.distance !== undefined) set('distance', b.distance)
  if (b.permitRequired !== undefined) set('permit_required', b.permitRequired ? 1 : 0)
  if (b.permitPrice !== undefined) set('permit_price', b.permitPrice)
  if (b.highlights !== undefined) set('highlights_json', JSON.stringify(b.highlights ?? []))
  if (b.activities !== undefined) set('activities_json', JSON.stringify(b.activities ?? []))
  if (b.bestTime !== undefined) set('best_time', b.bestTime)
  if (b.weather !== undefined) set('weather', b.weather)
  if (b.reviews !== undefined) set('reviews_json', JSON.stringify(b.reviews ?? []))
  if (b.faqs !== undefined) set('faqs_json', JSON.stringify(b.faqs ?? []))
  return { fields, vals }
}

export function registerDestinationRoutes(app, pool) {
  app.get('/api/destinations', async (_req, res, next) => {
    try {
      res.json(await destinationsWithLinks(pool))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/destinations', async (req, res, next) => {
    try {
      const id = await insertDestination(pool, req.body)
      const all = await destinationsWithLinks(pool)
      res.status(201).json(all.find((d) => d.id === id))
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/destinations/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body
      const { fields, vals } = buildPatchFields(b)
      if (fields.length) {
        vals.push(id)
        await pool.query(`UPDATE destinations SET ${fields.join(', ')} WHERE id = ?`, vals)
      }
      if (b.linkedPackageIds !== undefined) {
        await pool.query('DELETE FROM destination_package_links WHERE destination_id = ?', [id])
        if (Array.isArray(b.linkedPackageIds) && b.linkedPackageIds.length) {
          const vals2 = []
          const sql = b.linkedPackageIds
            .map((pid) => {
              vals2.push(id, pid)
              return '(?, ?)'
            })
            .join(',')
          await pool.query(
            `INSERT INTO destination_package_links (destination_id, package_id) VALUES ${sql}`,
            vals2,
          )
        }
      }
      const all = await destinationsWithLinks(pool)
      const d = all.find((x) => x.id === id)
      if (!d) return res.status(404).json({ error: 'Not found' })
      res.json(d)
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/destinations/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM destinations WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
