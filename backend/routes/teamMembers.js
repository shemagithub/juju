import { randomUUID } from 'crypto'
import { simpleGet } from '../lib/helpers.js'
import { DEFAULT_TEAM_MEMBERS } from '../lib/defaultTeamMembers.js'

function toIsoTs(v) {
  if (v == null || v === '') return new Date().toISOString()
  const t = new Date(v).getTime()
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString()
}

export function mapTeamMember(r) {
  return {
    id: r.id,
    name: r.name ?? '',
    title: r.title ?? '',
    bio: r.bio ?? '',
    photoUrl: r.photo_url ?? '',
    active: !!r.active_flag,
    sortOrder: Number(r.sort_order ?? 0),
    createdAt: toIsoTs(r.created_at),
    updatedAt: toIsoTs(r.updated_at),
  }
}

export async function ensureTeamMembersTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS team_members (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL DEFAULT '',
      bio TEXT NOT NULL,
      photo_url VARCHAR(2048) NOT NULL DEFAULT '',
      active_flag TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  const [countRows] = await pool.query('SELECT COUNT(*) AS n FROM team_members')
  if (Number(countRows[0]?.n) > 0) return

  for (const row of DEFAULT_TEAM_MEMBERS) {
    await pool.query(
      `INSERT INTO team_members (id, name, title, bio, photo_url, active_flag, sort_order)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [randomUUID(), row.name, row.title, row.bio, row.photo_url, row.sort_order],
    )
  }
}

export function registerTeamMemberRoutes(app, pool) {
  app.get('/api/team-members', async (req, res, next) => {
    try {
      const publicOnly = req.query.public === 'true' || req.query.public === '1'
      let sql = 'SELECT * FROM team_members WHERE 1=1'
      if (publicOnly) sql += ' AND active_flag = 1'
      sql += ' ORDER BY sort_order ASC, name ASC'
      const [rows] = await pool.query(sql)
      res.json(rows.map(mapTeamMember))
    } catch (e) {
      next(e)
    }
  })

  app.get('/api/team-members/:id', async (req, res, next) => {
    try {
      await simpleGet(pool, res, 'SELECT * FROM team_members WHERE id = ?', req.params.id, mapTeamMember)
    } catch (e) {
      next(e)
    }
  })

  app.post('/api/team-members', async (req, res, next) => {
    try {
      const b = req.body ?? {}
      const name = String(b.name ?? '').trim()
      const title = String(b.title ?? '').trim()
      const bio = String(b.bio ?? '').trim()
      if (!name) return res.status(400).json({ error: 'Name is required' })
      if (!title) return res.status(400).json({ error: 'Title is required' })
      if (!bio) return res.status(400).json({ error: 'Bio is required' })

      const id = b.id ?? randomUUID()
      await pool.query(
        `INSERT INTO team_members (id, name, title, bio, photo_url, active_flag, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name,
          title,
          bio,
          String(b.photoUrl ?? '').trim().slice(0, 2048),
          b.active === false ? 0 : 1,
          Number.isFinite(Number(b.sortOrder)) ? Number(b.sortOrder) : 0,
        ],
      )
      await simpleGet(pool, res, 'SELECT * FROM team_members WHERE id = ?', id, mapTeamMember)
    } catch (e) {
      next(e)
    }
  })

  app.patch('/api/team-members/:id', async (req, res, next) => {
    try {
      const id = String(req.params.id)
      const b = req.body ?? {}
      const fields = []
      const vals = []
      const push = (col, val) => {
        fields.push(`${col} = ?`)
        vals.push(val)
      }
      if (b.name !== undefined) push('name', String(b.name).trim())
      if (b.title !== undefined) push('title', String(b.title).trim())
      if (b.bio !== undefined) push('bio', String(b.bio ?? '').trim())
      if (b.photoUrl !== undefined) push('photo_url', String(b.photoUrl ?? '').trim().slice(0, 2048))
      if (b.active !== undefined) push('active_flag', b.active ? 1 : 0)
      if (b.sortOrder !== undefined) push('sort_order', Number(b.sortOrder) || 0)
      if (!fields.length) return res.status(400).json({ error: 'No fields' })
      vals.push(id)
      await pool.query(`UPDATE team_members SET ${fields.join(', ')} WHERE id = ?`, vals)
      await simpleGet(pool, res, 'SELECT * FROM team_members WHERE id = ?', id, mapTeamMember)
    } catch (e) {
      next(e)
    }
  })

  app.delete('/api/team-members/:id', async (req, res, next) => {
    try {
      const [r] = await pool.query('DELETE FROM team_members WHERE id = ?', [req.params.id])
      if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
      res.status(204).send()
    } catch (e) {
      next(e)
    }
  })
}
