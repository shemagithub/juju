import { randomUUID } from 'crypto'
import { simpleGet } from '../lib/helpers.js'

export function registerPackageCategoryRoutes(app, pool) {
  const mapCategory = (r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    packageCount: Number(r.package_count ?? 0),
  })

  const singleSql = `
    SELECT c.*,
      (SELECT COUNT(*) FROM tour_packages p WHERE p.category_id = c.id) AS package_count
    FROM package_categories c
    WHERE c.id = ? LIMIT 1
  `

  const listSql = `
    SELECT c.*,
      (SELECT COUNT(*) FROM tour_packages p WHERE p.category_id = c.id) AS package_count
    FROM package_categories c
    ORDER BY c.name ASC
  `

  app.get('/api/package-categories', async (_req, res, next) => {
    try {
      const [rows] = await pool.query(listSql)
      res.json(rows.map(mapCategory))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/package-categories', async (req, res, next) => {
    try {
      const b = req.body
      const name = String(b.name ?? '').trim()
      if (!name) return res.status(400).json({ error: 'Name is required' })
      const id = b.id ?? randomUUID()
      const slug =
        b.slug ??
        String(name)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
      await pool.query('INSERT INTO package_categories (id, name, slug) VALUES (?, ?, ?)', [
        id,
        name,
        slug,
      ])
      await simpleGet(pool, res, singleSql, id, mapCategory)
    } catch (e) {
      if (e?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'A category with this slug already exists' })
      }
      next(e)
    }
  })

  app.patch('/api/package-categories/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body
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
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(`UPDATE package_categories SET ${fields.join(', ')} WHERE id = ?`, vals)
      await simpleGet(pool, res, singleSql, id, mapCategory)
    } catch (e) {
      if (e?.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'A category with this slug already exists' })
      }
      next(e)
    }
  })

  app.delete('/api/package-categories/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const [[row]] = await pool.query(
        'SELECT id FROM package_categories WHERE id = ? LIMIT 1',
        [id],
      )
      if (!row) return res.status(404).json({ error: 'Not found' })

      const [[used]] = await pool.query(
        'SELECT COUNT(*) AS n FROM tour_packages WHERE category_id = ?',
        [id],
      )
      if (Number(used?.n) > 0) {
        return res.status(409).json({
          error: `${used.n} package(s) use this category. Reassign them before deleting.`,
        })
      }

      const [r] = await pool.query('DELETE FROM package_categories WHERE id = ?', [id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
