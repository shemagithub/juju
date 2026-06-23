import { randomUUID } from 'crypto'
import { simpleGet } from '../lib/helpers.js'
import {
  DEFAULT_CAR_RENTAL_CATEGORIES,
  slugifyCategoryName,
} from '../lib/defaultCarRentalCategories.js'

function mapCategoryRow(r) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    sortOrder: Number(r.sort_order ?? 0),
    active: Boolean(r.active_flag),
    vehicleCount: Number(r.vehicle_count ?? 0),
  }
}

const CATEGORY_LIST_SQL = `
  SELECT c.*,
    (SELECT COUNT(*) FROM car_rental_vehicles v
     WHERE LOWER(TRIM(v.category)) = c.slug) AS vehicle_count
  FROM car_rental_vehicle_categories c
`

export async function ensureCarRentalVehicleCategoriesTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_rental_vehicle_categories (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      slug VARCHAR(64) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      active_flag TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_car_rental_vehicle_cat_slug (slug)
    )
  `)

  const [countRows] = await pool.query('SELECT COUNT(*) AS n FROM car_rental_vehicle_categories')
  if (Number(countRows[0]?.n) > 0) return

  for (const row of DEFAULT_CAR_RENTAL_CATEGORIES) {
    await pool.query(
      `INSERT INTO car_rental_vehicle_categories (id, name, slug, sort_order, active_flag)
       VALUES (?, ?, ?, ?, 1)`,
      [randomUUID(), row.name, row.slug, row.sortOrder],
    )
  }
}

export async function listCarRentalVehicleCategories(pool, { activeOnly = false } = {}) {
  let sql = `${CATEGORY_LIST_SQL} WHERE 1=1`
  if (activeOnly) sql += ' AND c.active_flag = 1'
  sql += ' ORDER BY c.sort_order ASC, c.name ASC'
  const [rows] = await pool.query(sql)
  return rows.map(mapCategoryRow)
}

export function registerCarRentalVehicleCategoryRoutes(app, pool) {
  app.get('/api/car-rental-vehicle-categories', async (req, res, next) => {
    try {
      const activeOnly =
        req.query.active === 'true' || req.query.active === '1' || req.query.public === 'true'
      res.json(await listCarRentalVehicleCategories(pool, { activeOnly }))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/car-rental-vehicle-categories', async (req, res, next) => {
    try {
      const b = req.body ?? {}
      const name = String(b.name ?? '').trim()
      if (!name) return res.status(400).json({ error: 'Name is required' })
      const slug = String(b.slug ?? slugifyCategoryName(name)).trim().toLowerCase()
      if (!slug) return res.status(400).json({ error: 'Slug is required' })
      const sortOrder = Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0
      const active = b.active === false || b.active === 0 || b.active === 'false' ? 0 : 1
      const id = b.id ?? randomUUID()
      await pool.query(
        `INSERT INTO car_rental_vehicle_categories (id, name, slug, sort_order, active_flag)
         VALUES (?, ?, ?, ?, ?)`,
        [id, name, slug, sortOrder, active],
      )
      await simpleGet(
        pool,
        res,
        `${CATEGORY_LIST_SQL} WHERE c.id = ? LIMIT 1`,
        id,
        mapCategoryRow,
      )
    } catch (e) {
      if (e?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'A category with this slug already exists' })
      }
      next(e)
    }
  })

  app.patch('/api/car-rental-vehicle-categories/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id ?? '').trim()
      if (!id) return res.status(400).json({ error: 'ID required' })
      const b = req.body ?? {}
      const fields = []
      const vals = []

      if (b.name !== undefined) {
        fields.push('name = ?')
        vals.push(String(b.name).trim())
      }
      if (b.slug !== undefined) {
        fields.push('slug = ?')
        vals.push(String(b.slug).trim().toLowerCase())
      }
      if (b.sortOrder !== undefined) {
        fields.push('sort_order = ?')
        vals.push(Number(b.sortOrder) || 0)
      }
      if (b.active !== undefined) {
        fields.push('active_flag = ?')
        vals.push(b.active === false || b.active === 0 || b.active === 'false' ? 0 : 1)
      }

      if (!fields.length) return res.status(400).json({ error: 'No fields' })

      const [[existing]] = await pool.query(
        'SELECT slug FROM car_rental_vehicle_categories WHERE id = ? LIMIT 1',
        [id],
      )
      if (!existing) return res.status(404).json({ error: 'Not found' })

      if (b.slug !== undefined && String(b.slug).trim().toLowerCase() !== existing.slug) {
        const [[used]] = await pool.query(
          'SELECT COUNT(*) AS n FROM car_rental_vehicles WHERE LOWER(TRIM(category)) = ?',
          [existing.slug],
        )
        if (Number(used?.n) > 0) {
          return res.status(409).json({
            error: 'Cannot change slug while vehicles use this category. Reassign vehicles first.',
          })
        }
      }

      vals.push(id)
      await pool.query(
        `UPDATE car_rental_vehicle_categories SET ${fields.join(', ')} WHERE id = ?`,
        vals,
      )
      await simpleGet(
        pool,
        res,
        `${CATEGORY_LIST_SQL} WHERE c.id = ? LIMIT 1`,
        id,
        mapCategoryRow,
      )
    } catch (e) {
      if (e?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'A category with this slug already exists' })
      }
      next(e)
    }
  })

  app.delete('/api/car-rental-vehicle-categories/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id ?? '').trim()
      const [[row]] = await pool.query(
        'SELECT slug FROM car_rental_vehicle_categories WHERE id = ? LIMIT 1',
        [id],
      )
      if (!row) return res.status(404).json({ error: 'Not found' })

      const [[used]] = await pool.query(
        'SELECT COUNT(*) AS n FROM car_rental_vehicles WHERE LOWER(TRIM(category)) = ?',
        [row.slug],
      )
      if (Number(used?.n) > 0) {
        return res.status(409).json({
          error: `${used.n} vehicle(s) use this category. Reassign them before deleting.`,
        })
      }

      const [result] = await pool.query('DELETE FROM car_rental_vehicle_categories WHERE id = ?', [
        id,
      ])
      if (!result.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
