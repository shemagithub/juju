import { randomUUID } from 'crypto'
import { simpleGet, simpleList } from '../lib/helpers.js'
import { queueStatusNotification, readCurrentStatus } from '../lib/statusNotify.js'

export function registerUserRoutes(app, pool) {
  app.get('/api/users', async (_req, res, next) => {
    try {
      await simpleList(pool, res, 'SELECT * FROM tourism_users ORDER BY created_at DESC', (r) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        phone: r.phone,
        role: r.role,
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
      }))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/users', async (req, res, next) => {
    try {
      const b = req.body
      const id = b.id ?? randomUUID()
      await pool.query(
        `INSERT INTO tourism_users (id, first_name, last_name, email, phone, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          b.firstName,
          b.lastName,
          b.email,
          b.phone ?? '',
          b.role ?? 'customer',
          b.status ?? 'active',
        ],
      )
      await simpleGet(pool, res, 'SELECT * FROM tourism_users WHERE id = ?', id, (r) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        phone: r.phone,
        role: r.role,
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
      }))
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/users/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body
      const map = {
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email',
        phone: 'phone',
        role: 'role',
        status: 'status',
      }
      const fields = []
      const vals = []
      for (const k of Object.keys(map)) {
        if (b[k] !== undefined) {
          fields.push(`${map[k]} = ?`)
          vals.push(b[k])
        }
      }
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      let previousStatus = null
      if (b.status !== undefined) {
        previousStatus = await readCurrentStatus(pool, 'tourism_users', id)
      }
      vals.push(id)
      await pool.query(`UPDATE tourism_users SET ${fields.join(', ')} WHERE id = ?`, vals)
      if (b.status !== undefined) {
        queueStatusNotification(pool, 'user', id, previousStatus, b.status)
      }
      await simpleGet(pool, res, 'SELECT * FROM tourism_users WHERE id = ?', id, (r) => ({
        id: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        phone: r.phone,
        role: r.role,
        status: r.status,
        createdAt: new Date(r.created_at).toISOString(),
      }))
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/users/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM tourism_users WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
