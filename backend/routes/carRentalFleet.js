import { randomUUID } from 'crypto'
import { parseJson, simpleGet, simpleList } from '../lib/helpers.js'
import {
  queueSubscriberContentUpdate,
  shouldNotifyCarVehicle,
} from '../lib/subscriberNotify.js'

function notifyCarSubscribers(pool, vehicle, updateType = 'updated') {
  if (!shouldNotifyCarVehicle(vehicle)) return
  const title = vehicle.vehicleName || vehicle.title || 'Car rental vehicle'
  const summary =
    String(vehicle.blurb || vehicle.description || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220) ||
    (vehicle.dailyPriceUsd ? `From $${vehicle.dailyPriceUsd}/day` : 'Updated on our car rental fleet.')
  queueSubscriberContentUpdate(pool, {
    kind: 'car-rental',
    title,
    summary,
    slug: vehicle.slug,
    updateType,
  })
}
import {
  VEHICLE_EXTENDED_COLS,
  VEHICLE_INSERT_COLS,
  buildVehicleInsertRow,
  buildVehiclePatchFields,
  mapCarRentalVehicle,
  normalizeVehicleCategoryKey,
  sortVehicleCategories,
  vehicleCategoryLabel,
} from '../lib/carRentalVehicleFields.js'
import { listCarRentalVehicleCategories } from './carRentalVehicleCategories.js'

const DEFAULT_SEED_ROWS = [
  {
    slug: 'economy',
    title: 'Economy',
    vehicle_name: 'Toyota Yaris 1.5 Hybrid',
    brand: 'Toyota',
    model: 'Yaris',
    year: 2022,
    category: 'economy',
    badge: 'City & airport',
    blurb: 'Ideal for Kigali city runs, meetings, and short transfers.',
    description:
      'Efficient hybrid city car for airport transfers, meetings, and short Kigali itineraries.',
    daily_price_usd: 35,
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    engine_capacity: '1.5L Hybrid',
    seats: 4,
    doors: 4,
    luggage_capacity: '2 large bags',
    specs_json: [
      { icon: 'bi-people', text: '4 seats' },
      { icon: 'bi-suitcase2', text: '2 bags' },
      { icon: 'bi-fuel-pump', text: 'Petrol, efficient' },
      { icon: 'bi-gear', text: 'Automatic' },
    ],
    image_url: '',
    sort_order: 10,
    airport_transfer_vehicle: 1,
    self_drive_available: 1,
  },
  {
    slug: 'suv',
    title: 'Compact SUV',
    vehicle_name: 'Toyota RAV4 2.5 AWD',
    brand: 'Toyota',
    model: 'RAV4',
    year: 2021,
    category: 'suv',
    badge: 'Family & comfort',
    blurb: 'Room for family luggage and lake or park drives in comfort.',
    description: 'Comfortable AWD SUV for families exploring Rwanda beyond Kigali.',
    daily_price_usd: 75,
    transmission: 'Automatic',
    fuel_type: 'Petrol',
    engine_capacity: '2.5L',
    seats: 5,
    doors: 5,
    luggage_capacity: '4 large bags',
    specs_json: [
      { icon: 'bi-people', text: '5 seats' },
      { icon: 'bi-suitcase2', text: '4 bags' },
      { icon: 'bi-moon-stars', text: 'A/C, elevated ride' },
      { icon: 'bi-shield-check', text: 'Full safety kit' },
    ],
    image_url: '',
    sort_order: 20,
    self_drive_available: 1,
  },
  {
    slug: 'fourbyfour',
    title: '4×4 Safari',
    vehicle_name: 'Toyota Land Cruiser 4×4',
    brand: 'Toyota',
    model: 'Land Cruiser',
    year: 2020,
    category: 'safari',
    badge: 'Safari & parks',
    blurb: 'Built for Volcanoes, Akagera, and Nyungwe access roads.',
    description: 'Rugged safari 4×4 approved for national park access roads across Rwanda.',
    daily_price_usd: 120,
    transmission: 'Automatic',
    fuel_type: 'Diesel',
    engine_capacity: '4.0L',
    seats: 7,
    doors: 5,
    luggage_capacity: '6 large bags',
    specs_json: [
      { icon: 'bi-people', text: '5–7 seats' },
      { icon: 'bi-tree', text: 'Wildlife & unpaved roads' },
      { icon: 'bi-cloud-rain', text: 'All-weather capable' },
      { icon: 'bi-wrench-adjustable', text: 'Spare & tools included' },
    ],
    image_url: '',
    sort_order: 30,
    tourist_safari_vehicle: 1,
    gps_installed: 1,
    driver_included: 1,
  },
  {
    slug: 'luxury',
    title: 'Luxury SUV',
    vehicle_name: 'Range Rover Sport 3.0 SDV6',
    brand: 'Land Rover',
    model: 'Range Rover Sport',
    year: 2023,
    category: 'luxury',
    badge: 'Executive',
    blurb: 'Business delegations, VIP airport pickups, and bespoke itineraries.',
    description: 'Executive luxury SUV with chauffeur option for VIP travel in Rwanda.',
    daily_price_usd: 180,
    transmission: 'Automatic',
    fuel_type: 'Diesel',
    engine_capacity: '3.0L',
    seats: 5,
    doors: 5,
    luggage_capacity: '4 large bags',
    specs_json: [
      { icon: 'bi-people', text: '4–5 seats' },
      { icon: 'bi-star', text: 'Leather, premium sound' },
      { icon: 'bi-person-badge', text: 'Chauffeur available' },
      { icon: 'bi-airplane', text: 'VIP airport meet' },
    ],
    image_url: '',
    sort_order: 40,
    featured: 1,
    airport_transfer_vehicle: 1,
    driver_included: 1,
  },
]

export { mapCarRentalVehicle }

export async function ensureCarRentalVehiclesExtendedColumns(pool) {
  for (const [name, def] of VEHICLE_EXTENDED_COLS) {
    try {
      await pool.query(`ALTER TABLE car_rental_vehicles ADD COLUMN ${name} ${def}`)
    } catch (e) {
      const code = e?.code ?? ''
      const msg = String(e?.message ?? '')
      if (code !== 'ER_DUP_FIELDNAME' && !/Duplicate column/i.test(msg)) throw e
    }
  }
}

export async function backfillCarRentalVehicleDefaults(pool) {
  const [rows] = await pool.query(
    'SELECT id, title, blurb, vehicle_name, description, category, slug FROM car_rental_vehicles',
  )
  for (const row of rows) {
    const patches = []
    const vals = []
    if (!String(row.vehicle_name ?? '').trim()) {
      patches.push('vehicle_name = ?')
      vals.push(String(row.title ?? '').trim())
    }
    if (!String(row.description ?? '').trim()) {
      patches.push('description = ?')
      vals.push(String(row.blurb ?? row.title ?? '').trim())
    }
    if (!String(row.category ?? '').trim() && row.slug) {
      patches.push('category = ?')
      vals.push(String(row.slug).trim())
    }
    if (!patches.length) continue
    vals.push(row.id)
    await pool.query(`UPDATE car_rental_vehicles SET ${patches.join(', ')} WHERE id = ?`, vals)
  }
}

export async function ensureCarRentalVehiclesTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_rental_vehicles (
      id VARCHAR(36) PRIMARY KEY,
      slug VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      badge VARCHAR(255) NOT NULL DEFAULT '',
      blurb TEXT NOT NULL DEFAULT '',
      daily_price_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
      specs_json JSON NOT NULL,
      image_url VARCHAR(2048) NOT NULL DEFAULT '',
      active_flag TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_car_rental_vehicles_slug (slug)
    )
  `)

  try {
    await pool.query(`
      ALTER TABLE car_rental_vehicles
      ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    `)
  } catch (e) {
    const code = String(e?.code ?? '')
    const dupCol =
      code === 'ER_DUP_FIELDNAME' ||
      e?.errno === 1060 ||
      String(e?.sqlMessage ?? '').toLowerCase().includes('duplicate column')
    if (!dupCol) console.warn('[car-rental-vehicles] alter updated_at skipped:', code || e?.message)
  }

  await ensureCarRentalVehiclesExtendedColumns(pool)
  await backfillCarRentalVehicleDefaults(pool)

  const [countRows] = await pool.query('SELECT COUNT(*) AS n FROM car_rental_vehicles')
  if (Number(countRows[0]?.n) > 0) return

  for (const row of DEFAULT_SEED_ROWS) {
    const id = randomUUID()
    const insertRow = buildVehicleInsertRow(
      {
        ...row,
        dailyRate: row.daily_price_usd,
        fuelType: row.fuel_type,
        engineCapacity: row.engine_capacity,
        luggageCapacity: row.luggage_capacity,
        specs: row.specs_json,
        airportTransferVehicle: !!row.airport_transfer_vehicle,
        touristSafariVehicle: !!row.tourist_safari_vehicle,
        selfDriveAvailable: row.self_drive_available !== 0,
        driverIncluded: !!row.driver_included,
        gpsInstalled: !!row.gps_installed,
        featured: !!row.featured,
        active: true,
      },
      id,
    )
    const placeholders = VEHICLE_INSERT_COLS.map(() => '?').join(', ')
    await pool.query(
      `INSERT INTO car_rental_vehicles (${VEHICLE_INSERT_COLS.join(', ')}) VALUES (${placeholders})`,
      VEHICLE_INSERT_COLS.map((c) => insertRow[c]),
    )
  }
}

function duplicateRowToInsert(row, newId, newSlug, newTitle) {
  const gallery = parseJson(row.gallery_urls_json, [])
  const galleryUrls = Array.isArray(gallery) ? gallery : []
  return buildVehicleInsertRow(
    {
      slug: newSlug,
      title: newTitle,
      vehicleName: `${String(row.vehicle_name || row.title).trim()} (copy)`,
      brand: row.brand,
      model: row.model,
      year: row.year,
      category: row.category,
      badge: row.badge,
      blurb: row.blurb,
      description: row.description,
      transmission: row.transmission,
      fuelType: row.fuel_type,
      engineCapacity: row.engine_capacity,
      seats: row.seats,
      doors: row.doors,
      airConditioning: !!row.air_conditioning,
      luggageCapacity: row.luggage_capacity,
      dailyRate: row.daily_price_usd,
      weeklyRate: row.weekly_rate,
      monthlyRate: row.monthly_rate,
      driverFee: row.driver_fee,
      deposit: row.deposit,
      status: row.status,
      plateNumber: '',
      registrationExpiry: null,
      insuranceExpiry: null,
      pickupLocations: parseJson(row.pickup_locations_json, []),
      deliveryAvailable: !!row.delivery_available,
      deliveryFee: row.delivery_fee,
      featured: false,
      driverIncluded: !!row.driver_included,
      driverLanguages: parseJson(row.driver_languages_json, []),
      airportTransferVehicle: !!row.airport_transfer_vehicle,
      touristSafariVehicle: !!row.tourist_safari_vehicle,
      selfDriveAvailable: row.self_drive_available == null ? true : !!row.self_drive_available,
      unlimitedMileageOption: !!row.unlimited_mileage_option,
      gpsInstalled: !!row.gps_installed,
      popularBadge: false,
      specs: parseJson(row.specs_json, []),
      galleryUrls,
      imageUrl: row.image_url,
      active: false,
      sortOrder: Number(row.sort_order ?? 0) + 5,
    },
    newId,
  )
}

const SEARCH_COLS =
  'title, slug, badge, blurb, vehicle_name, brand, model, category, plate_number, COALESCE(image_url, "")'

export function registerCarRentalFleetRoutes(app, pool) {
  app.get('/api/car-rental-vehicles/summary', async (_req, res, next) => {
    try {
      const [[tot]] = await pool.query(
        `SELECT COUNT(*) AS total,
         SUM(CASE WHEN active_flag = 1 THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN active_flag = 0 THEN 1 ELSE 0 END) AS inactive
         FROM car_rental_vehicles`,
      )
      res.json({
        total: Number(tot?.total ?? 0),
        active: Number(tot?.active ?? 0),
        inactive: Number(tot?.inactive ?? 0),
      })
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/car-rental-vehicles/categories', async (_req, res, next) => {
    try {
      const managed = await listCarRentalVehicleCategories(pool, { activeOnly: true })
      const [vehicleRows] = await pool.query(
        `SELECT LOWER(TRIM(category)) AS cat_key, COUNT(*) AS cnt
         FROM car_rental_vehicles
         WHERE active_flag = 1
         GROUP BY LOWER(TRIM(category))`,
      )
      const countByKey = Object.fromEntries(
        vehicleRows.map((r) => [normalizeVehicleCategoryKey(r.cat_key), Number(r.cnt ?? 0)]),
      )
      const managedSlugs = new Set(managed.map((c) => c.slug))
      const categories = managed.map((c) => ({
        key: c.slug,
        label: c.name,
        count: countByKey[c.slug] ?? 0,
      }))
      let otherCount = 0
      for (const [key, count] of Object.entries(countByKey)) {
        if (!managedSlugs.has(key)) otherCount += count
      }
      if (otherCount > 0) {
        categories.push({
          key: 'other',
          label: vehicleCategoryLabel('other'),
          count: otherCount,
        })
      }
      const total = categories.reduce((sum, c) => sum + c.count, 0)
      res.json({ total, categories: sortVehicleCategories(categories) })
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/car-rental-vehicles/catalog', async (req, res, next) => {
    try {
      const category = normalizeVehicleCategoryKey(req.query.category)
      let sql = 'SELECT * FROM car_rental_vehicles WHERE active_flag = 1'
      const vals = []
      if (req.query.category && String(req.query.category).trim() && category !== 'other') {
        sql += ' AND LOWER(TRIM(category)) = ?'
        vals.push(category)
      } else if (req.query.category && String(req.query.category).trim() && category === 'other') {
        sql += " AND (category IS NULL OR TRIM(category) = '')"
      }
      sql += ' ORDER BY sort_order ASC, title ASC'
      const [rows] = await pool.query(sql, vals)
      res.json(rows.map(mapCarRentalVehicle))
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/car-rental-vehicles/catalog/:slug', async (req, res, next) => {
    try {
      const slug = String(req.params.slug ?? '').trim().toLowerCase()
      if (!slug) return res.status(400).json({ error: 'Slug required' })
      await simpleGet(
        pool,
        res,
        'SELECT * FROM car_rental_vehicles WHERE active_flag = 1 AND slug = ? LIMIT 1',
        slug,
        mapCarRentalVehicle,
      )
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/car-rental-vehicles/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id ?? '').trim()
      if (!id) return res.status(400).json({ error: 'ID required' })
      await simpleGet(pool, res, 'SELECT * FROM car_rental_vehicles WHERE id = ? LIMIT 1', id, mapCarRentalVehicle)
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/car-rental-vehicles', async (req, res, next) => {
    try {
      const q = req.query
      let sql = 'SELECT * FROM car_rental_vehicles WHERE 1=1'
      const vals = []
      if (q.active === 'true' || q.active === '1') {
        sql += ' AND active_flag = 1'
      } else if (q.active === 'false' || q.active === '0') {
        sql += ' AND active_flag = 0'
      }
      if (q.q && String(q.q).trim()) {
        const qq = `%${String(q.q).trim()}%`
        sql += ` AND (${SEARCH_COLS.split(', ').map((c) => `${c} LIKE ?`).join(' OR ')})`
        for (let i = 0; i < SEARCH_COLS.split(', ').length; i += 1) vals.push(qq)
      }
      sql += ' ORDER BY sort_order ASC, title ASC'
      const limit = Math.min(Math.max(Number(q.limit) || 500, 1), 500)
      sql += ' LIMIT ?'
      vals.push(limit)
      const [rows] = await pool.query(sql, vals)
      res.json(rows.map(mapCarRentalVehicle))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/car-rental-vehicles/:id/duplicate', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const [existing] = await pool.query('SELECT * FROM car_rental_vehicles WHERE id = ?', [id])
      const row = existing[0]
      if (!row) return res.status(404).json({ error: 'Not found' })

      let slug = `${String(row.slug).slice(0, 40)}-copy-${randomUUID().slice(0, 6)}`.toLowerCase()
      slug = slug.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
      if (!/^[a-z0-9-]{1,64}$/.test(slug)) slug = `copy-${randomUUID().slice(0, 13)}`

      const nid = randomUUID()
      const insertRow = duplicateRowToInsert(row, nid, slug, `${String(row.title).trim()} (copy)`)
      const placeholders = VEHICLE_INSERT_COLS.map(() => '?').join(', ')
      await pool.query(
        `INSERT INTO car_rental_vehicles (${VEHICLE_INSERT_COLS.join(', ')}) VALUES (${placeholders})`,
        VEHICLE_INSERT_COLS.map((c) => insertRow[c]),
      )
      const [ins] = await pool.query('SELECT * FROM car_rental_vehicles WHERE id = ?', [nid])
      res.status(201).json(mapCarRentalVehicle(ins[0]))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/car-rental-vehicles', async (req, res, next) => {
    try {
      const b = req.body ?? {}
      const id = b.id ?? randomUUID()
      let insertRow
      try {
        insertRow = buildVehicleInsertRow(b, id)
      } catch (err) {
        if (err?.message === 'INVALID_SLUG') {
          return res.status(400).json({ error: 'Valid slug required (lowercase letters, numbers, hyphen)' })
        }
        if (err?.message === 'TITLE_REQUIRED') {
          return res.status(400).json({ error: 'Title is required' })
        }
        throw err
      }
      const placeholders = VEHICLE_INSERT_COLS.map(() => '?').join(', ')
      await pool.query(
        `INSERT INTO car_rental_vehicles (${VEHICLE_INSERT_COLS.join(', ')}) VALUES (${placeholders})`,
        VEHICLE_INSERT_COLS.map((c) => insertRow[c]),
      )
      const [rows] = await pool.query('SELECT * FROM car_rental_vehicles WHERE id = ?', [id])
      const vehicle = mapCarRentalVehicle(rows[0])
      notifyCarSubscribers(pool, vehicle, 'new')
      res.status(201).json(vehicle)
    } catch (e) {
      if (String(e?.code) === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Slug already exists' })
      }
      next(e)
    }
  })

  app.patch('/api/car-rental-vehicles/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      let patch
      try {
        patch = buildVehiclePatchFields(req.body ?? {})
      } catch (err) {
        if (err?.message === 'INVALID_SLUG') {
          return res.status(400).json({ error: 'Invalid slug format' })
        }
        throw err
      }
      const { fields, vals } = patch
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(`UPDATE car_rental_vehicles SET ${fields.join(', ')} WHERE id = ?`, vals)
      const [rows] = await pool.query('SELECT * FROM car_rental_vehicles WHERE id = ?', [id])
      if (!rows[0]) return res.status(404).json({ error: 'Not found' })
      const vehicle = mapCarRentalVehicle(rows[0])
      notifyCarSubscribers(pool, vehicle, 'updated')
      res.json(vehicle)
    } catch (e) {
      if (String(e?.code) === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Slug already exists' })
      }
      next(e)
    }
  })

  app.delete('/api/car-rental-vehicles/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM car_rental_vehicles WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
