import { randomUUID } from 'crypto'
import { parseJson, simpleGet, simpleList } from '../lib/helpers.js'
import { queueStatusNotification, readCurrentStatus } from '../lib/statusNotify.js'

function mapCarRentalRequest(r) {
  const pd =
    typeof r.pickup_date === 'string'
      ? r.pickup_date.slice(0, 10)
      : new Date(r.pickup_date).toISOString().slice(0, 10)
  const rd =
    typeof r.return_date === 'string'
      ? r.return_date.slice(0, 10)
      : new Date(r.return_date).toISOString().slice(0, 10)
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    vehicleClass: r.vehicle_class,
    pickupDate: pd,
    returnDate: rd,
    pickupLocation: r.pickup_location ?? '',
    returnLocation: r.return_location ?? '',
    driverOption: r.driver_option,
    extras: parseJson(r.extras_json, {}),
    message: r.message ?? '',
    status: r.status,
    adminNotes: r.admin_notes ?? '',
    read: !!r.read_flag,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function ensureCarRentalRequestsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS car_rental_requests (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL DEFAULT '',
      vehicle_class VARCHAR(64) NOT NULL,
      pickup_date DATE NOT NULL,
      return_date DATE NOT NULL,
      pickup_location VARCHAR(512) NOT NULL DEFAULT '',
      return_location VARCHAR(512) NOT NULL DEFAULT '',
      driver_option VARCHAR(64) NOT NULL DEFAULT 'self-drive',
      extras_json JSON NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      admin_notes TEXT NOT NULL DEFAULT '',
      read_flag TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export function registerCarRentalRoutes(app, pool) {
  app.get('/api/car-rental-requests/summary', async (_req, res, next) => {
    try {
      const [statusRows] = await pool.query(
        'SELECT status, COUNT(*) AS c FROM car_rental_requests GROUP BY status',
      )
      const [[tot]] = await pool.query(
        'SELECT COUNT(*) AS total, SUM(CASE WHEN read_flag = 0 THEN 1 ELSE 0 END) AS unread FROM car_rental_requests',
      )
      const byStatus = {}
      for (const row of statusRows ?? []) {
        byStatus[row.status] = Number(row.c)
      }
      res.json({
        total: Number(tot?.total ?? 0),
        unread: Number(tot?.unread ?? 0),
        byStatus,
      })
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/car-rental-requests', async (req, res, next) => {
    try {
      const q = req.query
      let sql = 'SELECT * FROM car_rental_requests WHERE 1=1'
      const vals = []
      if (q.status) {
        sql += ' AND status = ?'
        vals.push(String(q.status))
      }
      if (q.vehicleClass) {
        sql += ' AND vehicle_class = ?'
        vals.push(String(q.vehicleClass))
      }
      if (q.read === 'true' || q.read === '1') {
        sql += ' AND read_flag = 1'
      } else if (q.read === 'false' || q.read === '0') {
        sql += ' AND read_flag = 0'
      }
      if (q.fromDate) {
        sql += ' AND pickup_date >= ?'
        vals.push(String(q.fromDate).slice(0, 10))
      }
      if (q.toDate) {
        sql += ' AND pickup_date <= ?'
        vals.push(String(q.toDate).slice(0, 10))
      }
      if (q.q && String(q.q).trim()) {
        const qq = `%${String(q.q).trim()}%`
        sql += ` AND (
          name LIKE ? OR email LIKE ? OR phone LIKE ? OR vehicle_class LIKE ?
          OR pickup_location LIKE ? OR return_location LIKE ?
          OR COALESCE(message, '') LIKE ? OR COALESCE(admin_notes, '') LIKE ?
        )`
        vals.push(qq, qq, qq, qq, qq, qq, qq, qq)
      }
      sql += ' ORDER BY created_at DESC'
      const limit = Math.min(Math.max(Number(q.limit) || 500, 1), 500)
      const offset = Math.max(Number(q.offset) || 0, 0)
      sql += ' LIMIT ? OFFSET ?'
      vals.push(limit, offset)
      const [rows] = await pool.query(sql, vals)
      res.json(rows.map(mapCarRentalRequest))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/car-rental-requests/bulk-read', async (req, res, next) => {
    try {
      const { ids, read } = req.body ?? {}
      if (!Array.isArray(ids) || !ids.length) {
        return res.status(400).json({ error: 'ids array required' })
      }
      const uniq = [...new Set(ids.map((x) => String(x)))].filter(Boolean)
      if (!uniq.length) return res.status(400).json({ error: 'ids array required' })
      const flag = read === false ? 0 : 1
      const ph = uniq.map(() => '?').join(',')
      await pool.query(
        `UPDATE car_rental_requests SET read_flag = ? WHERE id IN (${ph})`,
        [flag, ...uniq],
      )
      res.json({ ok: true, count: uniq.length })
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/car-rental-requests', async (req, res, next) => {
    try {
      const b = req.body ?? {}
      if (!String(b.name ?? '').trim() || !String(b.email ?? '').trim()) {
        return res.status(400).json({ error: 'Name and email are required' })
      }
      const pd = String(b.pickupDate ?? '').slice(0, 10)
      const rd = String(b.returnDate ?? '').slice(0, 10)
      if (!pd || !rd) {
        return res.status(400).json({ error: 'Pickup and return dates are required' })
      }
      if (rd < pd) {
        return res.status(400).json({ error: 'Return date must be on or after pickup date' })
      }
      const id = b.id ?? randomUUID()
      const extras = typeof b.extras === 'object' && b.extras != null ? b.extras : {}

      await pool.query(
        `INSERT INTO car_rental_requests (
           id, name, email, phone, vehicle_class, pickup_date, return_date,
           pickup_location, return_location, driver_option, extras_json, message,
           status, admin_notes, read_flag
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', '', 0)`,
        [
          id,
          String(b.name ?? '').trim(),
          String(b.email ?? '').trim().toLowerCase(),
          String(b.phone ?? '').trim(),
          String(b.vehicleClass ?? '').trim(),
          pd,
          rd,
          String(b.pickupLocation ?? '').trim(),
          String(b.returnLocation ?? '').trim(),
          String(b.driverOption ?? 'self-drive').trim(),
          JSON.stringify(extras),
          String(b.message ?? '').trim(),
        ],
      )

      const [rows] = await pool.query('SELECT * FROM car_rental_requests WHERE id = ?', [id])
      res.status(201).json(mapCarRentalRequest(rows[0]))
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/car-rental-requests/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const body = req.body ?? {}
      const fields = []
      const vals = []
      let previousStatus = null
      if (body.status !== undefined) {
        previousStatus = await readCurrentStatus(pool, 'car_rental_requests', id)
        fields.push('status = ?')
        vals.push(String(body.status))
      }
      if (body.adminNotes !== undefined) {
        fields.push('admin_notes = ?')
        vals.push(String(body.adminNotes))
      }
      if (body.read !== undefined) {
        fields.push('read_flag = ?')
        vals.push(body.read ? 1 : 0)
      }
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(
        `UPDATE car_rental_requests SET ${fields.join(', ')} WHERE id = ?`,
        vals,
      )
      if (body.status !== undefined) {
        queueStatusNotification(pool, 'car_rental_request', id, previousStatus, body.status)
      }
      await simpleGet(
        pool,
        res,
        'SELECT * FROM car_rental_requests WHERE id = ?',
        id,
        mapCarRentalRequest,
      )
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/car-rental-requests/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM car_rental_requests WHERE id = ?', [
        req.params.id,
      ])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
