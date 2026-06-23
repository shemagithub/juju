import { randomUUID } from 'crypto'
import { simpleGet } from '../lib/helpers.js'
import { queueStatusNotification, readCurrentStatus } from '../lib/statusNotify.js'
import { DEFAULT_REVIEWS, GUEST_REVIEW_USER_ID } from '../lib/defaultReviews.js'

const REVIEW_LIST_SQL = `
  SELECT r.*, u.first_name, u.last_name
  FROM reviews r
  LEFT JOIN tourism_users u ON u.id = r.user_id
`

function mapReview(r) {
  const userFullName = [r.first_name, r.last_name].filter(Boolean).join(' ').trim()
  const authorName = String(r.author_name ?? '').trim() || userFullName || 'Verified Traveler'
  return {
    id: r.id,
    userId: r.user_id,
    packageId: r.package_id,
    authorName,
    authorCountry: r.author_country ?? '',
    photoUrl: r.photo_url ?? '',
    rating: r.rating,
    comment: r.comment,
    status: r.status,
    featured: !!r.featured,
    createdAt: new Date(r.created_at).toISOString(),
  }
}

async function listReviews(pool, { publicOnly = false } = {}) {
  let sql = REVIEW_LIST_SQL
  const params = []
  if (publicOnly) {
    sql += " WHERE r.status = 'approved'"
  }
  sql += ' ORDER BY r.featured DESC, r.created_at DESC'
  const [rows] = await pool.query(sql, params)
  return rows.map(mapReview)
}

export async function ensureGuestReviewUser(pool) {
  const [exists] = await pool.query('SELECT id FROM tourism_users WHERE id = ? LIMIT 1', [
    GUEST_REVIEW_USER_ID,
  ])
  if (exists?.[0]) return
  await pool.query(
    `INSERT INTO tourism_users (id, first_name, last_name, email, phone, role, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      GUEST_REVIEW_USER_ID,
      'Guest',
      'Reviewer',
      'guest-reviews@internal.local',
      '',
      'customer',
      'active',
    ],
  )
}

export async function ensureReviewsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      package_id VARCHAR(36) NOT NULL,
      rating INT NOT NULL,
      comment TEXT NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      featured TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  for (const [name, def] of [
    ['author_name', 'VARCHAR(255) NOT NULL DEFAULT ""'],
    ['author_country', 'VARCHAR(128) NOT NULL DEFAULT ""'],
    ['photo_url', 'VARCHAR(2048) NOT NULL DEFAULT ""'],
  ]) {
    try {
      await pool.query(`ALTER TABLE reviews ADD COLUMN ${name} ${def}`)
    } catch (e) {
      const code = e?.code ?? ''
      const msg = String(e?.message ?? '')
      if (code !== 'ER_DUP_FIELDNAME' && !/Duplicate column/i.test(msg)) throw e
    }
  }

  await ensureGuestReviewUser(pool)

  const [countRows] = await pool.query('SELECT COUNT(*) AS n FROM reviews')
  if (Number(countRows[0]?.n) > 0) return

  const [pkgRows] = await pool.query('SELECT id FROM tour_packages ORDER BY title LIMIT 1')
  const packageId = pkgRows[0]?.id
  if (!packageId) return

  for (const row of DEFAULT_REVIEWS) {
    await pool.query(
      `INSERT INTO reviews (id, user_id, package_id, rating, comment, status, featured, author_name, author_country, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        GUEST_REVIEW_USER_ID,
        packageId,
        row.rating,
        row.comment,
        row.status,
        row.featured ? 1 : 0,
        row.authorName,
        row.authorCountry,
        row.photoUrl ?? '',
      ],
    )
  }
}

export function registerReviewRoutes(app, pool) {
  app.get('/api/reviews', async (req, res, next) => {
    try {
      const publicOnly = req.query.public === 'true' || req.query.public === '1'
      res.json(await listReviews(pool, { publicOnly }))
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/reviews', async (req, res, next) => {
    try {
      const b = req.body ?? {}
      const comment = String(b.comment ?? '').trim()
      const packageId = String(b.packageId ?? '').trim()
      const rating = Math.min(5, Math.max(1, Number(b.rating) || 0))
      const authorName = String(b.authorName ?? '').trim()
      const authorCountry = String(b.authorCountry ?? '').trim()
      const photoUrl = String(b.photoUrl ?? '').trim()
      const userId = String(b.userId ?? '').trim()

      if (!comment) return res.status(400).json({ error: 'Comment is required' })
      if (!packageId) return res.status(400).json({ error: 'Tour package is required' })
      if (!rating) return res.status(400).json({ error: 'Rating must be between 1 and 5' })
      if (!userId && !authorName) {
        return res.status(400).json({ error: 'Guest name or linked user is required' })
      }

      await ensureGuestReviewUser(pool)

      const [pkg] = await pool.query('SELECT id FROM tour_packages WHERE id = ? LIMIT 1', [packageId])
      if (!pkg[0]) return res.status(400).json({ error: 'Tour package not found' })

      let resolvedUserId = userId || GUEST_REVIEW_USER_ID
      if (userId) {
        const [user] = await pool.query('SELECT id FROM tourism_users WHERE id = ? LIMIT 1', [userId])
        if (!user[0]) return res.status(400).json({ error: 'User not found' })
      }

      const id = b.id ?? randomUUID()
      const status = b.status ?? 'approved'
      const featured = !!b.featured

      await pool.query(
        `INSERT INTO reviews (id, user_id, package_id, rating, comment, status, featured, author_name, author_country, photo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          resolvedUserId,
          packageId,
          rating,
          comment,
          status,
          featured ? 1 : 0,
          authorName,
          authorCountry,
          photoUrl,
        ],
      )

      const [rows] = await pool.query(`${REVIEW_LIST_SQL} WHERE r.id = ?`, [id])
      res.status(201).json(mapReview(rows[0]))
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/reviews/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body
      const fields = []
      const vals = []
      if (b.rating !== undefined) {
        fields.push('rating = ?')
        vals.push(Math.min(5, Math.max(1, Number(b.rating) || 1)))
      }
      if (b.comment !== undefined) {
        fields.push('comment = ?')
        vals.push(b.comment)
      }
      let previousStatus = null
      if (b.status !== undefined) {
        previousStatus = await readCurrentStatus(pool, 'reviews', id)
        fields.push('status = ?')
        vals.push(b.status)
      }
      if (b.featured !== undefined) {
        fields.push('featured = ?')
        vals.push(b.featured ? 1 : 0)
      }
      if (b.authorName !== undefined) {
        fields.push('author_name = ?')
        vals.push(String(b.authorName ?? '').trim())
      }
      if (b.authorCountry !== undefined) {
        fields.push('author_country = ?')
        vals.push(String(b.authorCountry ?? '').trim())
      }
      if (b.photoUrl !== undefined) {
        fields.push('photo_url = ?')
        vals.push(String(b.photoUrl ?? '').trim())
      }
      if (b.packageId !== undefined) {
        const packageId = String(b.packageId ?? '').trim()
        if (!packageId) return res.status(400).json({ error: 'packageId cannot be empty' })
        const [pkg] = await pool.query('SELECT id FROM tour_packages WHERE id = ? LIMIT 1', [packageId])
        if (!pkg[0]) return res.status(400).json({ error: 'Tour package not found' })
        fields.push('package_id = ?')
        vals.push(packageId)
      }
      if (b.userId !== undefined) {
        const userId = String(b.userId ?? '').trim()
        if (userId) {
          const [user] = await pool.query('SELECT id FROM tourism_users WHERE id = ? LIMIT 1', [userId])
          if (!user[0]) return res.status(400).json({ error: 'User not found' })
        }
        fields.push('user_id = ?')
        vals.push(userId || GUEST_REVIEW_USER_ID)
      }
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(`UPDATE reviews SET ${fields.join(', ')} WHERE id = ?`, vals)
      if (b.status !== undefined) {
        queueStatusNotification(pool, 'review', id, previousStatus, b.status)
      }
      const [rows] = await pool.query(`${REVIEW_LIST_SQL} WHERE r.id = ?`, [id])
      if (!rows[0]) return res.status(404).json({ error: 'Not found' })
      res.json(mapReview(rows[0]))
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/reviews/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM reviews WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
