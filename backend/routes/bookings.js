import { randomUUID } from 'crypto'
import { simpleGet, simpleList } from '../lib/helpers.js'
import { queueStatusNotification, readCurrentStatus } from '../lib/statusNotify.js'

function mapBooking(r) {
  const sd =
    typeof r.start_date === 'string'
      ? r.start_date
      : new Date(r.start_date).toISOString().slice(0, 10)
  return {
    id: r.id,
    userId: r.user_id,
    packageId: r.package_id,
    startDate: sd,
    status: r.status,
    totalRwf: Number(r.total_rwf),
    guideId: r.guide_id,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export function registerBookingRoutes(app, pool) {
  app.get('/api/bookings', async (_req, res, next) => {
    try {
      await simpleList(
        pool,
        res,
        'SELECT * FROM bookings ORDER BY created_at DESC',
        mapBooking,
      )
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/bookings', async (req, res, next) => {
    try {
      const b = req.body
      const id = b.id ?? randomUUID()
      await pool.query(
        `INSERT INTO bookings (id, user_id, package_id, start_date, status, total_rwf, guide_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          b.userId,
          b.packageId,
          String(b.startDate).slice(0, 10),
          b.status ?? 'pending',
          b.totalRwf,
          b.guideId ?? null,
        ],
      )
      const [rows] = await pool.query('SELECT * FROM bookings WHERE id = ?', [id])
      res.status(201).json(mapBooking(rows[0]))
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/bookings/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body
      const fields = []
      const vals = []
      if (b.userId !== undefined) {
        fields.push('user_id = ?')
        vals.push(b.userId)
      }
      if (b.packageId !== undefined) {
        fields.push('package_id = ?')
        vals.push(b.packageId)
      }
      if (b.startDate !== undefined) {
        fields.push('start_date = ?')
        vals.push(String(b.startDate).slice(0, 10))
      }
      let previousStatus = null
      if (b.status !== undefined) {
        previousStatus = await readCurrentStatus(pool, 'bookings', id)
        fields.push('status = ?')
        vals.push(b.status)
      }
      if (b.totalRwf !== undefined) {
        fields.push('total_rwf = ?')
        vals.push(b.totalRwf)
      }
      if (b.guideId !== undefined) {
        fields.push('guide_id = ?')
        vals.push(b.guideId)
      }
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(`UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`, vals)
      if (b.status !== undefined) {
        queueStatusNotification(pool, 'booking', id, previousStatus, b.status)
      }
      await simpleGet(pool, res, 'SELECT * FROM bookings WHERE id = ?', id, mapBooking)
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/bookings/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM bookings WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
