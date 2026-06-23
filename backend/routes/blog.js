import { randomUUID } from 'crypto'
import { simpleGet, simpleList } from '../lib/helpers.js'
import {
  queueSubscriberContentUpdate,
  shouldNotifyBlogPost,
} from '../lib/subscriberNotify.js'

function mapBlogPost(r) {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    body: r.body,
    categoryId: r.category_id,
    coverImageUrl: r.cover_image_url,
    published: !!r.published,
    updatedAt: new Date(r.updated_at).toISOString(),
  }
}

function notifyBlogSubscribers(pool, post, updateType = 'updated') {
  if (!shouldNotifyBlogPost(post)) return
  const summary =
    String(post.excerpt || post.body || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220) || 'New article on our travel blog.'
  queueSubscriberContentUpdate(pool, {
    kind: 'blog',
    title: post.title,
    summary,
    slug: post.slug,
    updateType,
  })
}

export function registerBlogRoutes(app, pool) {
  app.get('/api/blog/categories', async (_req, res, next) => {
    try {
      await simpleList(pool, res, 'SELECT * FROM blog_categories ORDER BY name', (r) => r)
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/blog/categories', async (req, res, next) => {
    try {
      const b = req.body
      const id = b.id ?? randomUUID()
      const slug =
        b.slug ??
        String(b.name)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
      await pool.query('INSERT INTO blog_categories (id, name, slug) VALUES (?, ?, ?)', [
        id,
        b.name,
        slug,
      ])
      await simpleGet(pool, res, 'SELECT * FROM blog_categories WHERE id = ?', id, (r) => r)
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/blog/categories/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body
      const fields = []
      const vals = []
      if (b.name !== undefined) {
        fields.push('name = ?')
        vals.push(b.name)
      }
      if (b.slug !== undefined) {
        fields.push('slug = ?')
        vals.push(b.slug)
      }
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(`UPDATE blog_categories SET ${fields.join(', ')} WHERE id = ?`, vals)
      await simpleGet(pool, res, 'SELECT * FROM blog_categories WHERE id = ?', id, (r) => r)
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/blog/categories/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM blog_categories WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/blog/posts', async (_req, res, next) => {
    try {
      await simpleList(
        pool,
        res,
        'SELECT * FROM blog_posts ORDER BY updated_at DESC',
        (r) => ({
          id: r.id,
          title: r.title,
          slug: r.slug,
          excerpt: r.excerpt,
          body: r.body,
          categoryId: r.category_id,
          coverImageUrl: r.cover_image_url,
          published: !!r.published,
          updatedAt: new Date(r.updated_at).toISOString(),
        }),
      )
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/blog/posts', async (req, res, next) => {
    try {
      const b = req.body
      const id = b.id ?? randomUUID()
      const slug =
        b.slug ??
        String(b.title)
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
      await pool.query(
        `INSERT INTO blog_posts (id, title, slug, excerpt, body, category_id, cover_image_url, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          b.title,
          slug,
          b.excerpt ?? '',
          b.body ?? '',
          b.categoryId,
          b.coverImageUrl ?? '',
          b.published ? 1 : 0,
        ],
      )
      const [rows] = await pool.query('SELECT * FROM blog_posts WHERE id = ?', [id])
      const post = mapBlogPost(rows[0])
      notifyBlogSubscribers(pool, post, 'new')
      res.status(201).json(post)
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/blog/posts/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body
      const fields = []
      const vals = []
      const m = {
        title: 'title',
        slug: 'slug',
        excerpt: 'excerpt',
        body: 'body',
        categoryId: 'category_id',
        coverImageUrl: 'cover_image_url',
      }
      for (const k of Object.keys(m)) {
        if (b[k] !== undefined) {
          fields.push(`${m[k]} = ?`)
          vals.push(b[k])
        }
      }
      if (b.published !== undefined) {
        fields.push('published = ?')
        vals.push(b.published ? 1 : 0)
      }
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(`UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`, vals)
      const [rows] = await pool.query('SELECT * FROM blog_posts WHERE id = ?', [id])
      const r = rows[0]
      if (!r) return res.status(404).json({ error: 'Not found' })
      const post = mapBlogPost(r)
      notifyBlogSubscribers(pool, post, 'updated')
      res.json(post)
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/blog/posts/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM blog_posts WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
