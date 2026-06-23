import { randomUUID } from 'crypto'
import { packagesFull } from '../lib/services.js'
import {
  queueSubscriberContentUpdate,
  shouldNotifyPackage,
} from '../lib/subscriberNotify.js'

function notifyPackageSubscribers(pool, pkg, updateType = 'updated') {
  if (!shouldNotifyPackage(pkg)) return
  const summary = String(pkg.description || '').replace(/\s+/g, ' ').trim().slice(0, 220)
  queueSubscriberContentUpdate(pool, {
    kind: 'package',
    title: pkg.title,
    summary: summary || `Duration: ${pkg.durationDays ?? '—'} days`,
    slug: pkg.slug,
    updateType,
  })
}

export function registerTourPackageRoutes(app, pool) {
  app.get('/api/tour-packages', async (_req, res, next) => {
    try {
      res.json(await packagesFull(pool))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/tour-packages', async (req, res, next) => {
    const b = req.body
    const id = b.id ?? randomUUID()
    const slug =
      b.slug ??
      String(b.title)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      await conn.query(
        `INSERT INTO tour_packages (id, title, slug, price_rwf, duration_days, description, image_urls, status, category_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          b.title,
          slug,
          b.priceRwf ?? 0,
          b.durationDays,
          b.description ?? '',
          JSON.stringify(b.imageUrls ?? []),
          b.status ?? 'active',
          b.categoryId || null,
        ],
      )
      await conn.query('DELETE FROM itinerary_days WHERE package_id = ?', [id])
      for (const it of b.itinerary ?? []) {
        await conn.query(
          `INSERT INTO itinerary_days (id, package_id, day_number, title, description) VALUES (?, ?, ?, ?, ?)`,
          [randomUUID(), id, it.day, it.title, it.description],
        )
      }
      await conn.query('DELETE FROM destination_package_links WHERE package_id = ?', [id])
      for (const did of b.destinationIds ?? []) {
        await conn.query(
          `INSERT INTO destination_package_links (destination_id, package_id) VALUES (?, ?)`,
          [did, id],
        )
      }
      await conn.commit()
      const all = await packagesFull(pool)
      const created = all.find((p) => p.id === id)
      if (created) notifyPackageSubscribers(pool, created, 'new')
      res.status(201).json(created)
    } catch (e) {
      await conn.rollback()
      next(e)
    } finally {
      conn.release()
    }
  })

  app.patch('/api/tour-packages/:id', async (req, res, next) => {
    const id = String(req.params.id)
    const b = req.body
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      const fields = []
      const vals = []
      if (b.title !== undefined) {
        fields.push('title = ?')
        vals.push(b.title)
      }
      if (b.slug !== undefined) {
        fields.push('slug = ?')
        vals.push(b.slug)
      }
      if (b.priceRwf !== undefined) {
        fields.push('price_rwf = ?')
        vals.push(b.priceRwf)
      }
      if (b.durationDays !== undefined) {
        fields.push('duration_days = ?')
        vals.push(b.durationDays)
      }
      if (b.description !== undefined) {
        fields.push('description = ?')
        vals.push(b.description)
      }
      if (b.imageUrls !== undefined) {
        fields.push('image_urls = ?')
        vals.push(JSON.stringify(b.imageUrls ?? []))
      }
      if (b.status !== undefined) {
        fields.push('status = ?')
        vals.push(b.status)
      }
      if (b.categoryId !== undefined) {
        fields.push('category_id = ?')
        vals.push(b.categoryId || null)
      }
      if (fields.length) {
        vals.push(id)
        await conn.query(`UPDATE tour_packages SET ${fields.join(', ')} WHERE id = ?`, vals)
      }
      if (b.itinerary !== undefined) {
        await conn.query('DELETE FROM itinerary_days WHERE package_id = ?', [id])
        for (const it of b.itinerary ?? []) {
          await conn.query(
            `INSERT INTO itinerary_days (id, package_id, day_number, title, description) VALUES (?, ?, ?, ?, ?)`,
            [randomUUID(), id, it.day, it.title, it.description],
          )
        }
      }
      if (b.destinationIds !== undefined) {
        await conn.query('DELETE FROM destination_package_links WHERE package_id = ?', [id])
        for (const did of b.destinationIds ?? []) {
          await conn.query(
            `INSERT INTO destination_package_links (destination_id, package_id) VALUES (?, ?)`,
            [did, id],
          )
        }
      }
      await conn.commit()
      const all = await packagesFull(pool)
      const one = all.find((p) => p.id === id)
      if (!one) return res.status(404).json({ error: 'Not found' })
      notifyPackageSubscribers(pool, one, 'updated')
      res.json(one)
    } catch (e) {
      await conn.rollback()
      next(e)
    } finally {
      conn.release()
    }
  })

  app.delete('/api/tour-packages/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM tour_packages WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
