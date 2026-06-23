import { sendMail } from './mail.js'
import {
  buildStatusNotificationEmail,
  loadEmailContactInfo,
} from './emailTemplates.js'

async function resolveRecipient(pool, entityType, id) {
  switch (entityType) {
    case 'tour_booking_request': {
      const [rows] = await pool.query(
        'SELECT name, email, reference FROM tour_booking_requests WHERE id = ? LIMIT 1',
        [id],
      )
      const r = rows[0]
      return r?.email ? { email: r.email, name: r.name, reference: r.reference } : null
    }
    case 'car_rental_request': {
      const [rows] = await pool.query(
        'SELECT name, email FROM car_rental_requests WHERE id = ? LIMIT 1',
        [id],
      )
      const r = rows[0]
      return r?.email ? { email: r.email, name: r.name, reference: id.slice(0, 8).toUpperCase() } : null
    }
    case 'booking': {
      const [rows] = await pool.query(
        `SELECT b.id, u.email, u.first_name, u.last_name
         FROM bookings b
         LEFT JOIN tourism_users u ON u.id = b.user_id
         WHERE b.id = ? LIMIT 1`,
        [id],
      )
      const r = rows[0]
      if (!r?.email) return null
      return {
        email: r.email,
        name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        reference: id.slice(0, 8).toUpperCase(),
      }
    }
    case 'payment': {
      const [rows] = await pool.query(
        `SELECT p.reference, u.email, u.first_name, u.last_name
         FROM payments p
         LEFT JOIN bookings b ON b.id = p.booking_id
         LEFT JOIN tourism_users u ON u.id = b.user_id
         WHERE p.id = ? LIMIT 1`,
        [id],
      )
      const r = rows[0]
      if (!r?.email) return null
      return {
        email: r.email,
        name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        reference: r.reference,
      }
    }
    case 'review': {
      const [rows] = await pool.query(
        `SELECT r.id, r.author_name, u.email, u.first_name, u.last_name
         FROM reviews r
         LEFT JOIN tourism_users u ON u.id = r.user_id
         WHERE r.id = ? LIMIT 1`,
        [id],
      )
      const r = rows[0]
      const email = r?.email
      if (!email) return null
      return {
        email,
        name: r.author_name?.trim() || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        reference: id.slice(0, 8).toUpperCase(),
      }
    }
    case 'user': {
      const [rows] = await pool.query(
        'SELECT email, first_name, last_name FROM tourism_users WHERE id = ? LIMIT 1',
        [id],
      )
      const r = rows[0]
      return r?.email
        ? {
            email: r.email,
            name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
            reference: null,
          }
        : null
    }
    default:
      return null
  }
}

const ENTITY_LABELS = {
  tour_booking_request: 'booking request',
  car_rental_request: 'car rental request',
  booking: 'tour booking',
  payment: 'payment',
  review: 'review',
  user: 'account',
}

export function queueStatusNotification(pool, entityType, id, fromStatus, toStatus) {
  if (!toStatus || fromStatus === toStatus) return
  void notifyStatusChange(pool, entityType, id, fromStatus, toStatus).catch((err) => {
    console.error('[statusNotify]', entityType, id, err?.message || err)
  })
}

export async function notifyStatusChange(pool, entityType, id, fromStatus, toStatus) {
  if (!toStatus || fromStatus === toStatus) return

  const recipient = await resolveRecipient(pool, entityType, id)
  if (!recipient?.email) return

  const contact = await loadEmailContactInfo(pool)
  const entityLabel = ENTITY_LABELS[entityType] || 'request'
  const { subject, html, text } = buildStatusNotificationEmail({
    name: recipient.name,
    entityLabel,
    reference: recipient.reference,
    fromStatus,
    toStatus,
    contact,
  })

  await sendMail({ to: recipient.email, subject, html, text })
}

export async function readCurrentStatus(pool, table, id, column = 'status') {
  const allowed = new Set([
    'tour_booking_requests',
    'car_rental_requests',
    'bookings',
    'payments',
    'reviews',
    'tourism_users',
    'tour_packages',
  ])
  if (!allowed.has(table)) return null
  const [rows] = await pool.query(`SELECT \`${column}\` AS s FROM \`${table}\` WHERE id = ? LIMIT 1`, [
    id,
  ])
  return rows[0]?.s ?? null
}
