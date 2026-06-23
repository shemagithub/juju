import { randomUUID } from 'crypto'
import { parseJson } from '../lib/helpers.js'
import {
  DEFAULT_PRICING_PLANS,
  DEFAULT_PRICING_SECTION,
} from '../lib/defaultPricingPlans.js'

function mapSection(r) {
  return {
    eyebrow: r.eyebrow ?? DEFAULT_PRICING_SECTION.eyebrow,
    title: r.title ?? DEFAULT_PRICING_SECTION.title,
    backgroundUrl: r.background_url ?? '',
    currency: r.currency ?? DEFAULT_PRICING_SECTION.currency,
    priceUnit: r.price_unit ?? DEFAULT_PRICING_SECTION.priceUnit,
    ctaLabel: r.cta_label ?? DEFAULT_PRICING_SECTION.ctaLabel,
    ctaLink: r.cta_link ?? DEFAULT_PRICING_SECTION.ctaLink,
  }
}

function mapPlan(r) {
  return {
    id: r.id,
    name: r.name,
    priceUsd: Number(r.price_usd ?? 0),
    features: parseJson(r.features_json, []),
    popular: !!r.popular_flag,
    active: !!r.active_flag,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: new Date(r.created_at).toISOString(),
    updatedAt: new Date(r.updated_at).toISOString(),
  }
}

export async function ensurePricingTables(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pricing_section (
      singleton TINYINT(1) NOT NULL PRIMARY KEY DEFAULT 1,
      eyebrow VARCHAR(64) NOT NULL DEFAULT 'Packages',
      title VARCHAR(255) NOT NULL DEFAULT 'Prices For Rwanda Adventures',
      background_url VARCHAR(2048) NOT NULL DEFAULT '',
      currency VARCHAR(16) NOT NULL DEFAULT '$',
      price_unit VARCHAR(64) NOT NULL DEFAULT '/person',
      cta_label VARCHAR(64) NOT NULL DEFAULT 'Book Now',
      cta_link VARCHAR(512) NOT NULL DEFAULT '/book',
      CONSTRAINT chk_pricing_singleton CHECK (singleton = 1)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pricing_plans (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price_usd DECIMAL(12, 2) NOT NULL DEFAULT 0,
      features_json JSON NOT NULL,
      popular_flag TINYINT(1) NOT NULL DEFAULT 0,
      active_flag TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await pool.query(
    `INSERT IGNORE INTO pricing_section (singleton, eyebrow, title, background_url, currency, price_unit, cta_label, cta_link)
     VALUES (1, ?, ?, '', ?, ?, ?, ?)`,
    [
      DEFAULT_PRICING_SECTION.eyebrow,
      DEFAULT_PRICING_SECTION.title,
      DEFAULT_PRICING_SECTION.currency,
      DEFAULT_PRICING_SECTION.priceUnit,
      DEFAULT_PRICING_SECTION.ctaLabel,
      DEFAULT_PRICING_SECTION.ctaLink,
    ],
  )

  const [countRows] = await pool.query('SELECT COUNT(*) AS n FROM pricing_plans')
  if (Number(countRows[0]?.n) > 0) return

  for (const row of DEFAULT_PRICING_PLANS) {
    await pool.query(
      `INSERT INTO pricing_plans (id, name, price_usd, features_json, popular_flag, active_flag, sort_order)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [
        randomUUID(),
        row.name,
        row.priceUsd,
        JSON.stringify(row.features),
        row.popular ? 1 : 0,
        row.sortOrder,
      ],
    )
  }
}

async function loadPublicPricing(pool) {
  const [sectionRows] = await pool.query('SELECT * FROM pricing_section WHERE singleton = 1 LIMIT 1')
  let sql = 'SELECT * FROM pricing_plans WHERE 1=1'
  sql += ' AND active_flag = 1'
  sql += ' ORDER BY sort_order ASC, name ASC'
  const [planRows] = await pool.query(sql)
  return {
    section: mapSection(sectionRows[0] ?? {}),
    plans: planRows.map(mapPlan),
  }
}

export function registerPricingPlanRoutes(app, pool) {
  app.get('/api/pricing', async (req, res, next) => {
    try {
      const publicOnly = req.query.public === 'true' || req.query.public === '1'
      if (publicOnly) {
        return res.json(await loadPublicPricing(pool))
      }
      const [sectionRows] = await pool.query('SELECT * FROM pricing_section WHERE singleton = 1 LIMIT 1')
      const [planRows] = await pool.query(
        'SELECT * FROM pricing_plans ORDER BY sort_order ASC, name ASC',
      )
      res.json({
        section: mapSection(sectionRows[0] ?? {}),
        plans: planRows.map(mapPlan),
      })
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/pricing/section', async (req, res, next) => {
    try {
      const b = req.body ?? {}
      const fields = []
      const vals = []
      if (b.eyebrow !== undefined) {
        fields.push('eyebrow = ?')
        vals.push(String(b.eyebrow).trim())
      }
      if (b.title !== undefined) {
        fields.push('title = ?')
        vals.push(String(b.title).trim())
      }
      if (b.backgroundUrl !== undefined) {
        fields.push('background_url = ?')
        vals.push(String(b.backgroundUrl).trim())
      }
      if (b.currency !== undefined) {
        fields.push('currency = ?')
        vals.push(String(b.currency).trim())
      }
      if (b.priceUnit !== undefined) {
        fields.push('price_unit = ?')
        vals.push(String(b.priceUnit).trim())
      }
      if (b.ctaLabel !== undefined) {
        fields.push('cta_label = ?')
        vals.push(String(b.ctaLabel).trim())
      }
      if (b.ctaLink !== undefined) {
        fields.push('cta_link = ?')
        vals.push(String(b.ctaLink).trim())
      }
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      await pool.query(`UPDATE pricing_section SET ${fields.join(', ')} WHERE singleton = 1`, vals)
      const [sectionRows] = await pool.query('SELECT * FROM pricing_section WHERE singleton = 1 LIMIT 1')
      res.json(mapSection(sectionRows[0] ?? {}))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/pricing-plans', async (req, res, next) => {
    try {
      const b = req.body ?? {}
      const name = String(b.name ?? '').trim()
      const priceUsd = Number(b.priceUsd)
      const features = Array.isArray(b.features)
        ? b.features.map((f) => String(f).trim()).filter(Boolean)
        : []
      if (!name) return res.status(400).json({ error: 'Name is required' })
      if (!Number.isFinite(priceUsd) || priceUsd < 0) {
        return res.status(400).json({ error: 'Valid price is required' })
      }
      if (!features.length) return res.status(400).json({ error: 'Add at least one feature' })

      const id = b.id ?? randomUUID()
      const popular = !!b.popular
      const active = b.active !== false
      const sortOrder = Number(b.sortOrder) || 0

      if (popular) {
        await pool.query('UPDATE pricing_plans SET popular_flag = 0')
      }

      await pool.query(
        `INSERT INTO pricing_plans (id, name, price_usd, features_json, popular_flag, active_flag, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, priceUsd, JSON.stringify(features), popular ? 1 : 0, active ? 1 : 0, sortOrder],
      )

      const [rows] = await pool.query('SELECT * FROM pricing_plans WHERE id = ?', [id])
      res.status(201).json(mapPlan(rows[0]))
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/pricing-plans/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body ?? {}
      const fields = []
      const vals = []

      if (b.name !== undefined) {
        fields.push('name = ?')
        vals.push(String(b.name).trim())
      }
      if (b.priceUsd !== undefined) {
        fields.push('price_usd = ?')
        vals.push(Number(b.priceUsd) || 0)
      }
      if (b.features !== undefined) {
        const features = Array.isArray(b.features)
          ? b.features.map((f) => String(f).trim()).filter(Boolean)
          : []
        fields.push('features_json = ?')
        vals.push(JSON.stringify(features))
      }
      if (b.popular !== undefined) {
        if (b.popular) await pool.query('UPDATE pricing_plans SET popular_flag = 0')
        fields.push('popular_flag = ?')
        vals.push(b.popular ? 1 : 0)
      }
      if (b.active !== undefined) {
        fields.push('active_flag = ?')
        vals.push(b.active ? 1 : 0)
      }
      if (b.sortOrder !== undefined) {
        fields.push('sort_order = ?')
        vals.push(Number(b.sortOrder) || 0)
      }
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(`UPDATE pricing_plans SET ${fields.join(', ')} WHERE id = ?`, vals)
      const [rows] = await pool.query('SELECT * FROM pricing_plans WHERE id = ?', [id])
      if (!rows[0]) return res.status(404).json({ error: 'Not found' })
      res.json(mapPlan(rows[0]))
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/pricing-plans/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM pricing_plans WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
