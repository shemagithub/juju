import { randomUUID } from 'crypto'
import { parseJson, simpleGet } from '../lib/helpers.js'
import { sendMail, isMailConfigured } from '../lib/mail.js'
import {
  buildAdminNewBookingEmail,
  loadEmailContactInfo,
} from '../lib/emailTemplates.js'
import { queueStatusNotification, readCurrentStatus } from '../lib/statusNotify.js'

export function mapTourBookingRequest(r) {
  const td =
    r.travel_date == null
      ? null
      : typeof r.travel_date === 'string'
        ? r.travel_date.slice(0, 10)
        : new Date(r.travel_date).toISOString().slice(0, 10)
  const rd =
    r.return_date == null
      ? null
      : typeof r.return_date === 'string'
        ? r.return_date.slice(0, 10)
        : new Date(r.return_date).toISOString().slice(0, 10)
  return {
    id: r.id,
    reference: r.reference,
    name: r.name,
    email: r.email,
    phone: r.phone ?? '',
    serviceType: r.service_type,
    travelDate: td,
    returnDate: rd,
    adults: Number(r.adults ?? 1),
    children: Number(r.children ?? 0),
    packageId: r.package_id ?? null,
    details: parseJson(r.details_json, {}),
    status: r.status,
    adminNotes: r.admin_notes ?? '',
    read: !!r.read_flag,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export async function ensureTourBookingRequestsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tour_booking_requests (
      id VARCHAR(36) PRIMARY KEY,
      reference VARCHAR(32) NOT NULL,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL DEFAULT '',
      service_type VARCHAR(64) NOT NULL,
      travel_date DATE NULL,
      return_date DATE NULL,
      adults INT NOT NULL DEFAULT 1,
      children INT NOT NULL DEFAULT 0,
      package_id VARCHAR(36) NULL,
      details_json JSON NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      admin_notes TEXT NOT NULL DEFAULT '',
      read_flag TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export function registerBookingRequestRoutes(app, pool) {
  app.get('/api/tour-booking-requests/summary', async (_req, res, next) => {
    try {
      const [statusRows] = await pool.query(
        'SELECT status, COUNT(*) AS c FROM tour_booking_requests GROUP BY status',
      )
      const [[tot]] = await pool.query(
        'SELECT COUNT(*) AS total, SUM(CASE WHEN read_flag = 0 THEN 1 ELSE 0 END) AS unread FROM tour_booking_requests',
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

  app.get('/api/tour-booking-requests', async (req, res, next) => {
    try {
      const q = req.query
      let sql = 'SELECT * FROM tour_booking_requests WHERE 1=1'
      const vals = []
      if (q.status) {
        sql += ' AND status = ?'
        vals.push(String(q.status))
      }
      if (q.read === 'true' || q.read === '1') {
        sql += ' AND read_flag = 1'
      } else if (q.read === 'false' || q.read === '0') {
        sql += ' AND read_flag = 0'
      }
      if (q.q) {
        sql += ' AND (name LIKE ? OR email LIKE ? OR reference LIKE ?)'
        const like = `%${String(q.q).trim()}%`
        vals.push(like, like, like)
      }
      sql += ' ORDER BY created_at DESC LIMIT 500'
      const [rows] = await pool.query(sql, vals)
      res.json((rows ?? []).map(mapTourBookingRequest))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/tour-booking-requests', async (req, res, next) => {
    try {
      const b = req.body
      const name = String(b.name ?? '').trim()
      const email = String(b.email ?? '').trim()
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' })
      }
      const id = b.id ?? randomUUID()
      const reference =
        b.reference ??
        `RQ-${Date.now().toString().slice(-8).toUpperCase()}`
      await pool.query(
        `INSERT INTO tour_booking_requests
         (id, reference, name, email, phone, service_type, travel_date, return_date,
          adults, children, package_id, details_json, status, admin_notes, read_flag)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          reference,
          name,
          email,
          b.phone ?? '',
          b.serviceType ?? 'general',
          b.travelDate ? String(b.travelDate).slice(0, 10) : null,
          b.returnDate ? String(b.returnDate).slice(0, 10) : null,
          Number(b.adults ?? 1),
          Number(b.children ?? 0),
          b.packageId ?? null,
          JSON.stringify(b.details ?? {}),
          b.status ?? 'pending',
          b.adminNotes ?? '',
          b.read ? 1 : 0,
        ],
      )
      const [rows] = await pool.query('SELECT * FROM tour_booking_requests WHERE id = ?', [id])
      const created = mapTourBookingRequest(rows[0])

      if (isMailConfigured()) {
        const adminTo = process.env.SMTP_USER || process.env.SMTP_FROM
        void (async () => {
          try {
            const contact = await loadEmailContactInfo(pool)
            const { subject, html, text } = buildAdminNewBookingEmail({
              created,
              guestName: name,
              guestEmail: email,
              contact,
            })
            await sendMail({ to: adminTo, subject, html, text })
          } catch (err) {
            console.warn('[mail] admin booking alert failed', err?.message)
          }
        })()
      }

      res.status(201).json(created)
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/tour-booking-requests/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body
      const fields = []
      const vals = []
      let previousStatus = null
      if (b.status !== undefined) {
        previousStatus = await readCurrentStatus(pool, 'tour_booking_requests', id)
        fields.push('status = ?')
        vals.push(b.status)
      }
      if (b.adminNotes !== undefined) {
        fields.push('admin_notes = ?')
        vals.push(b.adminNotes)
      }
      if (b.read !== undefined) {
        fields.push('read_flag = ?')
        vals.push(b.read ? 1 : 0)
      }
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(
        `UPDATE tour_booking_requests SET ${fields.join(', ')} WHERE id = ?`,
        vals,
      )
      if (b.status !== undefined) {
        queueStatusNotification(pool, 'tour_booking_request', id, previousStatus, b.status)
      }
      await simpleGet(
        pool,
        res,
        'SELECT * FROM tour_booking_requests WHERE id = ?',
        id,
        mapTourBookingRequest,
      )
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/tour-booking-requests/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM tour_booking_requests WHERE id = ?', [
        req.params.id,
      ])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
