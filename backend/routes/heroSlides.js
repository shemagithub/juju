import { randomUUID } from 'crypto'
import { simpleGet, simpleList } from '../lib/helpers.js'
import { DEFAULT_HERO_SLIDES } from '../lib/defaultHeroSlides.js'

function toIsoTs(v) {
  if (v == null || v === '') return new Date().toISOString()
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString()
}

export function mapHeroSlide(r) {
  return {
    id: r.id,
    slug: r.slug ?? '',
    region: r.region ?? '',
    title: r.title ?? '',
    description: r.description ?? '',
    imageUrl: r.image_url ?? '',
    cardTitle: r.card_title ?? '',
    cardSubtitle: r.card_subtitle ?? '',
    link: r.link ?? '/destinations',
    active: !!r.active_flag,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: toIsoTs(r.created_at),
    updatedAt: toIsoTs(r.updated_at),
  }
}

export async function ensureHeroSlidesTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      id VARCHAR(36) PRIMARY KEY,
      slug VARCHAR(64) NOT NULL DEFAULT '',
      region VARCHAR(255) NOT NULL DEFAULT '',
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      image_url VARCHAR(2048) NOT NULL DEFAULT '',
      card_title VARCHAR(128) NOT NULL DEFAULT '',
      card_subtitle VARCHAR(255) NOT NULL DEFAULT '',
      link VARCHAR(512) NOT NULL DEFAULT '/destinations',
      active_flag TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_hero_slides_slug (slug)
    )
  `)

  const [countRows] = await pool.query('SELECT COUNT(*) AS n FROM hero_slides')
  if (Number(countRows[0]?.n) > 0) return

  for (const row of DEFAULT_HERO_SLIDES) {
    await pool.query(
      `INSERT INTO hero_slides (
        id, slug, region, title, description, image_url, card_title, card_subtitle, link, active_flag, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        randomUUID(),
        row.slug,
        row.region,
        row.title,
        row.description,
        row.image_url,
        row.card_title,
        row.card_subtitle,
        row.link,
        row.sort_order,
      ],
    )
  }
}

export function registerHeroSlideRoutes(app, pool) {
  app.get('/api/hero-slides', async (req, res, next) => {
    try {
      const publicOnly = req.query.public === 'true' || req.query.public === '1'
      let sql = 'SELECT * FROM hero_slides WHERE 1=1'
      if (publicOnly) sql += ' AND active_flag = 1'
      sql += ' ORDER BY sort_order ASC, title ASC'
      const [rows] = await pool.query(sql)
      res.json(rows.map(mapHeroSlide))
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/hero-slides/:id', async (req, res, next) => {
    try {
      await simpleGet(pool, res, 'SELECT * FROM hero_slides WHERE id = ?', req.params.id, mapHeroSlide)
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/hero-slides', async (req, res, next) => {
    try {
      const b = req.body ?? {}
      const title = String(b.title ?? '').trim()
      if (!title) return res.status(400).json({ error: 'Title is required' })
      const id = b.id ?? randomUUID()
      const slug = String(b.slug ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .slice(0, 64)
      await pool.query(
        `INSERT INTO hero_slides (
          id, slug, region, title, description, image_url, card_title, card_subtitle, link, active_flag, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          slug || `slide-${id.slice(0, 8)}`,
          String(b.region ?? '').trim(),
          title,
          String(b.description ?? '').trim(),
          String(b.imageUrl ?? '').trim().slice(0, 2048),
          String(b.cardTitle ?? title).trim().slice(0, 128),
          String(b.cardSubtitle ?? '').trim(),
          String(b.link ?? '/destinations').trim().slice(0, 512) || '/destinations',
          b.active === false ? 0 : 1,
          Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0,
        ],
      )
      await simpleGet(pool, res, 'SELECT * FROM hero_slides WHERE id = ?', id, mapHeroSlide)
    } catch (e) {
      if (String(e?.code) === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Slug already exists' })
      }
      next(e)
    }
  })

  app.patch('/api/hero-slides/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body ?? {}
      const fields = []
      const vals = []
      const push = (col, val) => {
        fields.push(`${col} = ?`)
        vals.push(val)
      }
      if (b.slug !== undefined) {
        push('slug', String(b.slug).trim().toLowerCase().replace(/\s+/g, '-').slice(0, 64))
      }
      if (b.region !== undefined) push('region', String(b.region ?? '').trim())
      if (b.title !== undefined) push('title', String(b.title).trim())
      if (b.description !== undefined) push('description', String(b.description ?? '').trim())
      if (b.imageUrl !== undefined) push('image_url', String(b.imageUrl ?? '').trim().slice(0, 2048))
      if (b.cardTitle !== undefined) push('card_title', String(b.cardTitle ?? '').trim().slice(0, 128))
      if (b.cardSubtitle !== undefined) push('card_subtitle', String(b.cardSubtitle ?? '').trim())
      if (b.link !== undefined) {
        push('link', String(b.link ?? '/destinations').trim().slice(0, 512) || '/destinations')
      }
      if (b.active !== undefined) push('active_flag', b.active ? 1 : 0)
      if (b.sortOrder !== undefined) push('sort_order', Number(b.sortOrder) || 0)
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(`UPDATE hero_slides SET ${fields.join(', ')} WHERE id = ?`, vals)
      await simpleGet(pool, res, 'SELECT * FROM hero_slides WHERE id = ?', id, mapHeroSlide)
    } catch (e) {
      if (String(e?.code) === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Slug already exists' })
      }
      next(e)
    }
  })

  app.delete('/api/hero-slides/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM hero_slides WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
