import { randomUUID } from 'crypto'
import { simpleGet, simpleList } from '../lib/helpers.js'
import { queueStatusNotification, readCurrentStatus } from '../lib/statusNotify.js'

function mapPayment(r) {
  return {
    id: r.id,
    bookingId: r.booking_id,
    amountRwf: Number(r.amount_rwf),
    status: r.status,
    method: r.method,
    reference: r.reference,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

export function registerPaymentRoutes(app, pool) {
  app.get('/api/payments', async (_req, res, next) => {
    try {
      await simpleList(pool, res, 'SELECT * FROM payments ORDER BY created_at DESC', mapPayment)
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/payments', async (req, res, next) => {
    try {
      const b = req.body
      const id = b.id ?? randomUUID()
      await pool.query(
        `INSERT INTO payments (id, booking_id, amount_rwf, status, method, reference)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          id,
          b.bookingId,
          b.amountRwf,
          b.status ?? 'unpaid',
          b.method ?? 'flutterwave',
          b.reference ?? `RW-${id.slice(0, 8)}`,
        ],
      )
      await simpleGet(pool, res, 'SELECT * FROM payments WHERE id = ?', id, mapPayment)
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/payments/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body
      const fields = []
      const vals = []
      if (b.amountRwf !== undefined) {
        fields.push('amount_rwf = ?')
        vals.push(b.amountRwf)
      }
      let previousStatus = null
      if (b.status !== undefined) {
        previousStatus = await readCurrentStatus(pool, 'payments', id)
        fields.push('status = ?')
        vals.push(b.status)
      }
      if (b.method !== undefined) {
        fields.push('method = ?')
        vals.push(b.method)
      }
      if (b.reference !== undefined) {
        fields.push('reference = ?')
        vals.push(b.reference)
      }
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(`UPDATE payments SET ${fields.join(', ')} WHERE id = ?`, vals)
      if (b.status !== undefined) {
        queueStatusNotification(pool, 'payment', id, previousStatus, b.status)
      }
      await simpleGet(pool, res, 'SELECT * FROM payments WHERE id = ?', id, mapPayment)
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/payments/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM payments WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
