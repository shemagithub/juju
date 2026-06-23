import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import { createPoolFromEnv } from './lib/db.js'
import { registerBlogRoutes } from './routes/blog.js'
import { registerBookingRoutes } from './routes/bookings.js'
import {
  ensureTourBookingRequestsTable,
  registerBookingRequestRoutes,
} from './routes/bookingRequests.js'
import { DEFAULT_SITE_SETTINGS } from './lib/defaultSiteSettings.js'
import {
  ensureCarRentalVehiclesTable,
  registerCarRentalFleetRoutes,
} from './routes/carRentalFleet.js'
import {
  ensureCarRentalVehicleCategoriesTable,
  registerCarRentalVehicleCategoryRoutes,
} from './routes/carRentalVehicleCategories.js'
import { ensureCarRentalRequestsTable, registerCarRentalRoutes } from './routes/carRentals.js'
import { registerBootstrapRoute } from './routes/bootstrap.js'
import {
  backfillDestinationDefaults,
  ensureDestinationExtendedColumns,
  registerDestinationRoutes,
  seedDefaultDestinations,
} from './routes/destinations.js'
import { registerExtraRoutes } from './routes/extra.js'
import { registerGalleryRoutes } from './routes/gallery.js'
import { ensureHeroSlidesTable, registerHeroSlideRoutes } from './routes/heroSlides.js'
import { ensureTeamMembersTable, registerTeamMemberRoutes } from './routes/teamMembers.js'
import { registerGuideRoutes } from './routes/guides.js'
import { registerMessageRoutes } from './routes/messages.js'
import {
  ensureNewsletterSubscribersTable,
  registerSubscriberRoutes,
} from './routes/subscribers.js'
import { registerPackageCategoryRoutes } from './routes/packageCategories.js'
import { ensurePricingTables, registerPricingPlanRoutes } from './routes/pricingPlans.js'
import { registerPaymentRoutes } from './routes/payments.js'
import { ensureReviewsTable, registerReviewRoutes } from './routes/reviews.js'
import { registerAuthRoutes } from './routes/auth.js'
import { registerTourPackageRoutes } from './routes/tourPackages.js'
import { registerUploadRoutes } from './routes/uploads.js'
import { registerUserRoutes } from './routes/users.js'

const port = Number(process.env.PORT) || 4000
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://rwandaquesttours.com',
  'https://www.rwandaquesttours.com',
  'https://admin.rwandaquesttours.com',
]

function parseCorsOrigins(raw) {
  const s = (raw ?? DEFAULT_CORS_ORIGINS.join(',')).trim()
  const list = s
    .split(',')
    .map((x) => x.trim().replace(/\/$/, ''))
    .filter(Boolean)
  return list.length === 1 ? list[0] : [...new Set(list)]
}

const corsOrigin = parseCorsOrigins(process.env.CORS_ORIGIN)

const pool = createPoolFromEnv()
const app = express()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serveDashboard = String(process.env.SERVE_DASHBOARD ?? '').toLowerCase() === '1'
const dashboardDist =
  process.env.DASHBOARD_DIST ?? path.resolve(__dirname, '..', 'shadcn-admin', 'dist')

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/health', (_req, res) => res.json({ ok: true }))

async function ensureSingletonSettingsTables() {
  // Keep startup resilient if schema.sql hasn't been applied yet.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      singleton TINYINT(1) NOT NULL PRIMARY KEY DEFAULT 1,
      payload JSON NOT NULL,
      CONSTRAINT chk_singleton CHECK (singleton = 1)
    )
  `)
  await pool.query(
    `INSERT IGNORE INTO site_settings (singleton, payload) VALUES (1, ?)`,
    [JSON.stringify(DEFAULT_SITE_SETTINGS)],
  )
  const [siteRows] = await pool.query(
    'SELECT payload FROM site_settings WHERE singleton = 1 LIMIT 1',
  )
  const currentSite = JSON.parse(siteRows[0]?.payload ?? '{}')
  const { mergeSiteSettingsDefaults } = await import('./lib/defaultSiteSettings.js')
  const mergedSite = mergeSiteSettingsDefaults(currentSite)
  if (JSON.stringify(mergedSite) !== JSON.stringify(currentSite)) {
    await pool.query('UPDATE site_settings SET payload = ? WHERE singleton = 1', [
      JSON.stringify(mergedSite),
    ])
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      singleton TINYINT(1) NOT NULL PRIMARY KEY DEFAULT 1,
      payload JSON NOT NULL,
      CONSTRAINT chk_admin_singleton CHECK (singleton = 1)
    )
  `)
  await pool.query(`INSERT IGNORE INTO admin_settings (singleton, payload) VALUES (1, '{}')`)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'superadmin',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token VARCHAR(36) PRIMARY KEY,
      admin_user_id VARCHAR(36) NOT NULL,
      exp BIGINT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_admin_session_user FOREIGN KEY (admin_user_id) REFERENCES admin_users (id) ON DELETE CASCADE
    )
  `)

  const bcrypt = (await import('bcryptjs')).default
  const primaryEmail = String(process.env.SUPERADMIN_EMAIL ?? 'superadmin@tourism.local')
    .trim()
    .toLowerCase()
  const password = String(process.env.SUPERADMIN_PASSWORD ?? 'ChangeMe123!')
  // Sidebar / docs often say admin@…; bootstrap both so login does not fail with 401 due to typo.
  const bootstrapEmails = [...new Set([primaryEmail, 'admin@tourism.local'])]
  for (const addr of bootstrapEmails) {
    const [exists] = await pool.query('SELECT id FROM admin_users WHERE email = ? LIMIT 1', [addr])
    if (!exists?.[0]) {
      const hash = await bcrypt.hash(password, 10)
      await pool.query(
        'INSERT INTO admin_users (id, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [randomUUID(), addr, hash, 'superadmin'],
      )
    }
  }
}

registerUploadRoutes(app)
registerAuthRoutes(app, pool)
registerUserRoutes(app, pool)
registerPackageCategoryRoutes(app, pool)
registerDestinationRoutes(app, pool)
registerTourPackageRoutes(app, pool)
registerBookingRoutes(app, pool)
registerBookingRequestRoutes(app, pool)
registerCarRentalRoutes(app, pool)
registerCarRentalFleetRoutes(app, pool)
registerCarRentalVehicleCategoryRoutes(app, pool)
registerPaymentRoutes(app, pool)
registerPricingPlanRoutes(app, pool)
registerMessageRoutes(app, pool)
registerSubscriberRoutes(app, pool)
registerReviewRoutes(app, pool)
registerBlogRoutes(app, pool)
registerGalleryRoutes(app, pool)
registerGuideRoutes(app, pool)
registerHeroSlideRoutes(app, pool)
registerTeamMemberRoutes(app, pool)
registerExtraRoutes(app, pool)
registerBootstrapRoute(app, pool)

if (serveDashboard) {
  app.use(express.static(dashboardDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(dashboardDist, 'index.html'))
  })
}

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err)
  res.status(500).json({ error: err?.message ?? 'Internal Server Error' })
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Tourism API (Node + MySQL) http://localhost:${port}`)
})

// Fire-and-forget schema guard. Startup should not crash if DB is down; routes will report errors.
async function ensureSchemaGuards() {
  await ensureSingletonSettingsTables()
  await ensureCarRentalRequestsTable(pool)
  await ensureCarRentalVehiclesTable(pool)
  await ensureCarRentalVehicleCategoriesTable(pool)
  await ensureTourBookingRequestsTable(pool)
  await ensureDestinationExtendedColumns(pool)
  await seedDefaultDestinations(pool)
  await backfillDestinationDefaults(pool)
  await ensureHeroSlidesTable(pool)
  await ensureTeamMembersTable(pool)
  await ensureReviewsTable(pool)
  await ensurePricingTables(pool)
  await ensureNewsletterSubscribersTable(pool)
}

ensureSchemaGuards().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('DB init failed:', err?.message ?? err)
})
