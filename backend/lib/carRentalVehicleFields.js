import { parseJson } from './helpers.js'

/** Matches shadcn-admin car rental category select options */
export const VEHICLE_CATEGORY_LABELS = {
  economy: 'Economy',
  suv: 'SUV',
  safari: 'Safari 4×4',
  luxury: 'Luxury',
  van: 'Van / Minibus',
  pickup: 'Pickup',
}

export const VEHICLE_CATEGORY_ORDER = ['economy', 'suv', 'safari', 'luxury', 'van', 'pickup']

export function normalizeVehicleCategoryKey(raw) {
  const k = String(raw ?? '').trim().toLowerCase()
  return k || 'other'
}

export function vehicleCategoryLabel(key) {
  const k = normalizeVehicleCategoryKey(key)
  if (VEHICLE_CATEGORY_LABELS[k]) return VEHICLE_CATEGORY_LABELS[k]
  if (k === 'other') return 'Other'
  return k
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function sortVehicleCategories(rows) {
  return [...rows].sort((a, b) => {
    const ai = VEHICLE_CATEGORY_ORDER.indexOf(a.key)
    const bi = VEHICLE_CATEGORY_ORDER.indexOf(b.key)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.label.localeCompare(b.label)
  })
}

export const VEHICLE_EXTENDED_COLS = [
  ['vehicle_name', "VARCHAR(255) NOT NULL DEFAULT ''"],
  ['brand', "VARCHAR(128) NOT NULL DEFAULT ''"],
  ['model', "VARCHAR(128) NOT NULL DEFAULT ''"],
  ['year', 'INT NULL'],
  ['category', "VARCHAR(64) NOT NULL DEFAULT ''"],
  ['description', "TEXT NOT NULL DEFAULT ''"],
  ['transmission', "VARCHAR(64) NOT NULL DEFAULT ''"],
  ['fuel_type', "VARCHAR(64) NOT NULL DEFAULT ''"],
  ['engine_capacity', "VARCHAR(64) NOT NULL DEFAULT ''"],
  ['seats', 'INT NULL'],
  ['doors', 'INT NULL'],
  ['air_conditioning', 'TINYINT(1) NOT NULL DEFAULT 1'],
  ['luggage_capacity', "VARCHAR(64) NOT NULL DEFAULT ''"],
  ['weekly_rate', 'DECIMAL(12, 2) NOT NULL DEFAULT 0'],
  ['monthly_rate', 'DECIMAL(12, 2) NOT NULL DEFAULT 0'],
  ['driver_fee', 'DECIMAL(12, 2) NOT NULL DEFAULT 0'],
  ['deposit', 'DECIMAL(12, 2) NOT NULL DEFAULT 0'],
  ['status', "VARCHAR(32) NOT NULL DEFAULT 'available'"],
  ['plate_number', "VARCHAR(64) NOT NULL DEFAULT ''"],
  ['registration_expiry', 'DATE NULL'],
  ['insurance_expiry', 'DATE NULL'],
  ['pickup_locations_json', 'JSON NULL'],
  ['delivery_available', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['delivery_fee', 'DECIMAL(12, 2) NOT NULL DEFAULT 0'],
  ['featured', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['created_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'],
  ['driver_included', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['driver_languages_json', 'JSON NULL'],
  ['airport_transfer_vehicle', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['tourist_safari_vehicle', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['self_drive_available', 'TINYINT(1) NOT NULL DEFAULT 1'],
  ['unlimited_mileage_option', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['gps_installed', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['popular_badge', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['gallery_urls_json', 'JSON NULL'],
]

function toIsoTs(v) {
  if (v == null || v === '') return new Date().toISOString()
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString()
}

function toDateOnly(v) {
  if (v == null || v === '') return null
  const d = new Date(v)
  if (!Number.isFinite(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function toMoney(v) {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 999999999.99) : 0
}

function toIntOrNull(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

function toBool(v, fallback = false) {
  if (v === true || v === 1 || v === '1' || v === 'true') return true
  if (v === false || v === 0 || v === '0' || v === 'false') return false
  return fallback
}

function normalizeSlug(v) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

function normalizeGallery(body, existingImageUrl = '') {
  const raw = body.galleryUrls ?? body.gallery_urls
  let urls = []
  if (Array.isArray(raw)) {
    urls = raw.map((u) => String(u ?? '').trim()).filter(Boolean)
  } else if (typeof raw === 'string' && raw.trim()) {
    urls = [raw.trim()]
  }
  if (!urls.length && body.imageUrl) urls = [String(body.imageUrl).trim()]
  if (!urls.length && existingImageUrl) urls = [String(existingImageUrl).trim()]
  return urls.slice(0, 20).map((u) => u.slice(0, 2048))
}

export function mapCarRentalVehicle(r) {
  const gallery = parseJson(r.gallery_urls_json, [])
  const galleryUrls = Array.isArray(gallery)
    ? gallery.map((u) => String(u ?? '').trim()).filter(Boolean)
    : []
  const primaryImage = String(r.image_url ?? '').trim() || galleryUrls[0] || ''
  const dailyRate = Number(r.daily_price_usd ?? 0)

  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    vehicleName: String(r.vehicle_name ?? r.title ?? '').trim(),
    brand: String(r.brand ?? '').trim(),
    model: String(r.model ?? '').trim(),
    year: r.year == null ? null : Number(r.year),
    category: normalizeVehicleCategoryKey(r.category),
    badge: r.badge ?? '',
    blurb: r.blurb ?? '',
    description: String(r.description ?? r.blurb ?? '').trim(),
    transmission: String(r.transmission ?? '').trim(),
    fuelType: String(r.fuel_type ?? '').trim(),
    engineCapacity: String(r.engine_capacity ?? '').trim(),
    seats: r.seats == null ? null : Number(r.seats),
    doors: r.doors == null ? null : Number(r.doors),
    airConditioning: !!r.air_conditioning,
    luggageCapacity: String(r.luggage_capacity ?? '').trim(),
    dailyRate,
    dailyPriceUsd: dailyRate,
    weeklyRate: Number(r.weekly_rate ?? 0),
    monthlyRate: Number(r.monthly_rate ?? 0),
    driverFee: Number(r.driver_fee ?? 0),
    deposit: Number(r.deposit ?? 0),
    status: String(r.status ?? 'available').trim() || 'available',
    plateNumber: String(r.plate_number ?? '').trim(),
    registrationExpiry: toDateOnly(r.registration_expiry),
    insuranceExpiry: toDateOnly(r.insurance_expiry),
    pickupLocations: parseJson(r.pickup_locations_json, []),
    deliveryAvailable: !!r.delivery_available,
    deliveryFee: Number(r.delivery_fee ?? 0),
    featured: !!r.featured,
    driverIncluded: !!r.driver_included,
    driverLanguages: parseJson(r.driver_languages_json, []),
    airportTransferVehicle: !!r.airport_transfer_vehicle,
    touristSafariVehicle: !!r.tourist_safari_vehicle,
    selfDriveAvailable: r.self_drive_available == null ? true : !!r.self_drive_available,
    unlimitedMileageOption: !!r.unlimited_mileage_option,
    gpsInstalled: !!r.gps_installed,
    popularBadge: !!r.popular_badge,
    imageUrl: primaryImage,
    galleryUrls: galleryUrls.length ? galleryUrls : primaryImage ? [primaryImage] : [],
    specs: parseJson(r.specs_json, []),
    active: !!r.active_flag,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: toIsoTs(r.created_at),
    updatedAt: toIsoTs(r.updated_at),
  }
}

export function buildVehiclePatchFields(body) {
  const fields = []
  const vals = []

  const push = (col, val) => {
    fields.push(`${col} = ?`)
    vals.push(val)
  }

  if (body.slug !== undefined) {
    const slug = normalizeSlug(body.slug)
    if (!/^[a-z0-9-]{1,64}$/.test(slug)) throw new Error('INVALID_SLUG')
    push('slug', slug)
  }
  if (body.title !== undefined) push('title', String(body.title).trim())
  if (body.vehicleName !== undefined) push('vehicle_name', String(body.vehicleName).trim())
  if (body.brand !== undefined) push('brand', String(body.brand ?? '').trim())
  if (body.model !== undefined) push('model', String(body.model ?? '').trim())
  if (body.year !== undefined) push('year', toIntOrNull(body.year))
  if (body.category !== undefined) push('category', String(body.category ?? '').trim())
  if (body.badge !== undefined) push('badge', String(body.badge ?? '').trim())
  if (body.blurb !== undefined) push('blurb', String(body.blurb ?? '').trim())
  if (body.description !== undefined) push('description', String(body.description ?? '').trim())
  if (body.transmission !== undefined) push('transmission', String(body.transmission ?? '').trim())
  if (body.fuelType !== undefined) push('fuel_type', String(body.fuelType ?? '').trim())
  if (body.engineCapacity !== undefined) push('engine_capacity', String(body.engineCapacity ?? '').trim())
  if (body.seats !== undefined) push('seats', toIntOrNull(body.seats))
  if (body.doors !== undefined) push('doors', toIntOrNull(body.doors))
  if (body.airConditioning !== undefined) push('air_conditioning', toBool(body.airConditioning, true) ? 1 : 0)
  if (body.luggageCapacity !== undefined) push('luggage_capacity', String(body.luggageCapacity ?? '').trim())
  if (body.dailyRate !== undefined || body.dailyPriceUsd !== undefined) {
    push('daily_price_usd', toMoney(body.dailyRate ?? body.dailyPriceUsd))
  }
  if (body.weeklyRate !== undefined) push('weekly_rate', toMoney(body.weeklyRate))
  if (body.monthlyRate !== undefined) push('monthly_rate', toMoney(body.monthlyRate))
  if (body.driverFee !== undefined) push('driver_fee', toMoney(body.driverFee))
  if (body.deposit !== undefined) push('deposit', toMoney(body.deposit))
  if (body.status !== undefined) push('status', String(body.status ?? 'available').trim() || 'available')
  if (body.plateNumber !== undefined) push('plate_number', String(body.plateNumber ?? '').trim())
  if (body.registrationExpiry !== undefined) push('registration_expiry', toDateOnly(body.registrationExpiry))
  if (body.insuranceExpiry !== undefined) push('insurance_expiry', toDateOnly(body.insuranceExpiry))
  if (body.pickupLocations !== undefined) {
    const locs = Array.isArray(body.pickupLocations)
      ? body.pickupLocations.map((x) => String(x ?? '').trim()).filter(Boolean)
      : []
    push('pickup_locations_json', JSON.stringify(locs))
  }
  if (body.deliveryAvailable !== undefined) push('delivery_available', toBool(body.deliveryAvailable) ? 1 : 0)
  if (body.deliveryFee !== undefined) push('delivery_fee', toMoney(body.deliveryFee))
  if (body.featured !== undefined) push('featured', toBool(body.featured) ? 1 : 0)
  if (body.driverIncluded !== undefined) push('driver_included', toBool(body.driverIncluded) ? 1 : 0)
  if (body.driverLanguages !== undefined) {
    const langs = Array.isArray(body.driverLanguages)
      ? body.driverLanguages.map((x) => String(x ?? '').trim()).filter(Boolean)
      : []
    push('driver_languages_json', JSON.stringify(langs))
  }
  if (body.airportTransferVehicle !== undefined) {
    push('airport_transfer_vehicle', toBool(body.airportTransferVehicle) ? 1 : 0)
  }
  if (body.touristSafariVehicle !== undefined) {
    push('tourist_safari_vehicle', toBool(body.touristSafariVehicle) ? 1 : 0)
  }
  if (body.selfDriveAvailable !== undefined) {
    push('self_drive_available', toBool(body.selfDriveAvailable, true) ? 1 : 0)
  }
  if (body.unlimitedMileageOption !== undefined) {
    push('unlimited_mileage_option', toBool(body.unlimitedMileageOption) ? 1 : 0)
  }
  if (body.gpsInstalled !== undefined) push('gps_installed', toBool(body.gpsInstalled) ? 1 : 0)
  if (body.popularBadge !== undefined) push('popular_badge', toBool(body.popularBadge) ? 1 : 0)
  if (body.specs !== undefined) {
    push('specs_json', JSON.stringify(Array.isArray(body.specs) ? body.specs : []))
  }
  if (body.active !== undefined) push('active_flag', toBool(body.active) ? 1 : 0)
  if (body.sortOrder !== undefined) push('sort_order', Number(body.sortOrder) || 0)

  if (body.galleryUrls !== undefined || body.imageUrl !== undefined) {
    const galleryUrls = normalizeGallery(body)
    push('gallery_urls_json', JSON.stringify(galleryUrls))
    push('image_url', galleryUrls[0] ?? String(body.imageUrl ?? '').trim().slice(0, 2048))
  }

  return { fields, vals }
}

export function buildVehicleInsertRow(body, id) {
  const slug = normalizeSlug(body.slug)
  if (!slug || !/^[a-z0-9-]{1,64}$/.test(slug)) throw new Error('INVALID_SLUG')
  const title = String(body.title ?? '').trim()
  if (!title) throw new Error('TITLE_REQUIRED')

  const galleryUrls = normalizeGallery(body)
  const specs =
    Array.isArray(body.specs) && body.specs.length
      ? body.specs
      : [{ icon: 'bi-info-circle', text: 'See description' }]
  const pickupLocations = Array.isArray(body.pickupLocations)
    ? body.pickupLocations.map((x) => String(x ?? '').trim()).filter(Boolean)
    : []
  const driverLanguages = Array.isArray(body.driverLanguages)
    ? body.driverLanguages.map((x) => String(x ?? '').trim()).filter(Boolean)
    : []

  return {
    id,
    slug,
    title,
    vehicle_name: String(body.vehicleName ?? title).trim(),
    brand: String(body.brand ?? '').trim(),
    model: String(body.model ?? '').trim(),
    year: toIntOrNull(body.year),
    category: String(body.category ?? '').trim(),
    badge: String(body.badge ?? '').trim(),
    blurb: String(body.blurb ?? '').trim(),
    description: String(body.description ?? body.blurb ?? '').trim(),
    transmission: String(body.transmission ?? '').trim(),
    fuel_type: String(body.fuelType ?? '').trim(),
    engine_capacity: String(body.engineCapacity ?? '').trim(),
    seats: toIntOrNull(body.seats),
    doors: toIntOrNull(body.doors),
    air_conditioning: toBool(body.airConditioning, true) ? 1 : 0,
    luggage_capacity: String(body.luggageCapacity ?? '').trim(),
    daily_price_usd: toMoney(body.dailyRate ?? body.dailyPriceUsd ?? 0),
    weekly_rate: toMoney(body.weeklyRate ?? 0),
    monthly_rate: toMoney(body.monthlyRate ?? 0),
    driver_fee: toMoney(body.driverFee ?? 0),
    deposit: toMoney(body.deposit ?? 0),
    status: String(body.status ?? 'available').trim() || 'available',
    plate_number: String(body.plateNumber ?? '').trim(),
    registration_expiry: toDateOnly(body.registrationExpiry),
    insurance_expiry: toDateOnly(body.insuranceExpiry),
    pickup_locations_json: JSON.stringify(pickupLocations),
    delivery_available: toBool(body.deliveryAvailable) ? 1 : 0,
    delivery_fee: toMoney(body.deliveryFee ?? 0),
    featured: toBool(body.featured) ? 1 : 0,
    driver_included: toBool(body.driverIncluded) ? 1 : 0,
    driver_languages_json: JSON.stringify(driverLanguages),
    airport_transfer_vehicle: toBool(body.airportTransferVehicle) ? 1 : 0,
    tourist_safari_vehicle: toBool(body.touristSafariVehicle) ? 1 : 0,
    self_drive_available: toBool(body.selfDriveAvailable, true) ? 1 : 0,
    unlimited_mileage_option: toBool(body.unlimitedMileageOption) ? 1 : 0,
    gps_installed: toBool(body.gpsInstalled) ? 1 : 0,
    popular_badge: toBool(body.popularBadge) ? 1 : 0,
    specs_json: JSON.stringify(specs),
    image_url: galleryUrls[0] ?? String(body.imageUrl ?? '').trim().slice(0, 2048),
    gallery_urls_json: JSON.stringify(galleryUrls),
    active_flag: body.active === false ? 0 : 1,
    sort_order: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
  }
}

export const VEHICLE_INSERT_COLS = [
  'id', 'slug', 'title', 'vehicle_name', 'brand', 'model', 'year', 'category', 'badge', 'blurb',
  'description', 'transmission', 'fuel_type', 'engine_capacity', 'seats', 'doors', 'air_conditioning',
  'luggage_capacity', 'daily_price_usd', 'weekly_rate', 'monthly_rate', 'driver_fee', 'deposit',
  'status', 'plate_number', 'registration_expiry', 'insurance_expiry', 'pickup_locations_json',
  'delivery_available', 'delivery_fee', 'featured', 'driver_included', 'driver_languages_json',
  'airport_transfer_vehicle', 'tourist_safari_vehicle', 'self_drive_available',
  'unlimited_mileage_option', 'gps_installed', 'popular_badge', 'specs_json', 'image_url',
  'gallery_urls_json', 'active_flag', 'sort_order',
]
