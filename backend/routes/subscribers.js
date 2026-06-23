import { randomUUID } from 'crypto'
import { sendMail, isMailConfigured } from '../lib/mail.js'
import {
  buildSubscriberWelcomeEmail,
  loadEmailContactInfo,
} from '../lib/emailTemplates.js'

function mapSubscriber(r) {
  return {
    id: r.id,
    email: r.email,
    name: r.name ?? '',
    source: r.source ?? 'website',
    active: !!r.active_flag,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

function normalizeEmail(email) {
  return String(email ?? '')
    .trim()
    .toLowerCase()
}

export async function ensureNewsletterSubscribersTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL DEFAULT '',
      source VARCHAR(64) NOT NULL DEFAULT 'website',
      active_flag TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      unsubscribed_at TIMESTAMP NULL,
      UNIQUE KEY uq_newsletter_email (email)
    )
  `)

  try {
    await pool.query(`
      INSERT IGNORE INTO newsletter_subscribers (id, email, name, source, active_flag, created_at)
      SELECT
        UUID(),
        LOWER(TRIM(email)),
        COALESCE(NULLIF(TRIM(name), ''), 'Subscriber'),
        'newsletter',
        1,
        created_at
      FROM message_threads
      WHERE source = 'newsletter'
        AND TRIM(email) != ''
        AND email LIKE '%@%'
    `)
  } catch {
    /* backfill optional */
  }
}

export function registerSubscriberRoutes(app, pool) {
  app.get('/api/subscribers', async (_req, res, next) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM newsletter_subscribers WHERE active_flag = 1 ORDER BY created_at DESC LIMIT 2000',
      )
      res.json((rows ?? []).map(mapSubscriber))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/subscribers', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body?.email)
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' })
      }
      const name = String(req.body?.name ?? 'Subscriber').trim() || 'Subscriber'
      const source = String(req.body?.source ?? 'website').trim() || 'website'
      const id = randomUUID()

      const [existing] = await pool.query(
        'SELECT id, active_flag FROM newsletter_subscribers WHERE email = ? LIMIT 1',
        [email],
      )

      if (existing[0]) {
        if (!existing[0].active_flag) {
          await pool.query(
            `UPDATE newsletter_subscribers
             SET active_flag = 1, unsubscribed_at = NULL, name = ?, source = ?
             WHERE id = ?`,
            [name, source, existing[0].id],
          )
        }
        const [rows] = await pool.query('SELECT * FROM newsletter_subscribers WHERE email = ?', [
          email,
        ])
        const sub = mapSubscriber(rows[0])

        if (isMailConfigured()) {
          void (async () => {
            try {
              const contact = await loadEmailContactInfo(pool)
              const { subject, html, text } = buildSubscriberWelcomeEmail({
                email,
                contact,
                resubscribed: !!existing[0].active_flag,
              })
              await sendMail({ to: email, subject, html, text })
            } catch (err) {
              console.warn('[subscribers] welcome email failed', err?.message)
            }
          })()
        }

        return res.status(200).json(sub)
      }

      await pool.query(
        `INSERT INTO newsletter_subscribers (id, email, name, source, active_flag)
         VALUES (?, ?, ?, ?, 1)`,
        [id, email, name, source],
      )
      const [rows] = await pool.query('SELECT * FROM newsletter_subscribers WHERE id = ?', [id])
      const sub = mapSubscriber(rows[0])

      if (isMailConfigured()) {
        void (async () => {
          try {
            const contact = await loadEmailContactInfo(pool)
            const { subject, html, text } = buildSubscriberWelcomeEmail({ email, contact })
            await sendMail({ to: email, subject, html, text })
          } catch (err) {
            console.warn('[subscribers] welcome email failed', err?.message)
          }
        })()
      }

      res.status(201).json(sub)
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/subscribers/unsubscribe', async (req, res, next) => {
    try {
      const email = normalizeEmail(req.query?.email)
      if (!email) {
        return res.status(400).send('Missing email parameter.')
      }
      const [r] = await pool.query(
        `UPDATE newsletter_subscribers
         SET active_flag = 0, unsubscribed_at = CURRENT_TIMESTAMP
         WHERE email = ?`,
        [email],
      )
      const msg =
        r.affectedRows > 0
          ? `You have been unsubscribed from ${process.env.MAIL_FROM_NAME || 'RwandaQuest Tours'} updates.`
          : 'This email was not on our subscriber list.'
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.send(`<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:40px;text-align:center"><h1>Unsubscribed</h1><p>${msg}</p></body></html>`)
    } catch (e) {
      next(e)
    }
  })
}
