/**
 * Prisma-compatible client backed by Node.js built-in node:sqlite.
 * Implements the subset of the Prisma API used in hw4.
 * In a real environment: npm run prisma:migrate replaces this.
 */
import 'dotenv/config'
import { DatabaseSync } from 'node:sqlite'
import { resolve } from 'node:path'

const rawUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const dbPath = rawUrl.startsWith('file:') ? resolve(process.cwd(), rawUrl.slice(5)) : rawUrl

const db = new DatabaseSync(dbPath)
db.exec('PRAGMA foreign_keys = ON')

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  username  TEXT    NOT NULL UNIQUE,
  password  TEXT    NOT NULL,
  name      TEXT    NOT NULL,
  createdAt TEXT    NOT NULL
)`)

db.exec(`CREATE TABLE IF NOT EXISTS refresh_tokens (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  token     TEXT    NOT NULL UNIQUE,
  userId    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TEXT    NOT NULL
)`)

db.exec(`CREATE TABLE IF NOT EXISTS announcements (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL,
  price       REAL    NOT NULL,
  category    TEXT    NOT NULL,
  contactInfo TEXT    NOT NULL,
  userId      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt   TEXT    NOT NULL,
  updatedAt   TEXT    NOT NULL
)`)

function notFound(model, id) {
  const err = new Error('No ' + model + ' record found' + (id !== undefined ? ' for id=' + id : ''))
  err.code = 'P2025'
  throw err
}
function uniqueErr(field) {
  const err = new Error('Unique constraint failed: ' + field)
  err.code = 'P2002'
  err.meta = { target: [field] }
  throw err
}
const toAnn = r => r ? { ...r, price: Number(r.price), createdAt: new Date(r.createdAt), updatedAt: new Date(r.updatedAt) } : null
const toUser = r => r ? { ...r, createdAt: new Date(r.createdAt) } : null
const toTok  = r => r ? { ...r, createdAt: new Date(r.createdAt) } : null

const prisma = {
  user: {
    async findUnique({ where }) {
      const [k, v] = Object.entries(where)[0]
      return toUser(db.prepare('SELECT * FROM users WHERE ' + k + ' = ?').get(v))
    },
    async findUniqueOrThrow({ where }) {
      const [k, v] = Object.entries(where)[0]
      const row = db.prepare('SELECT * FROM users WHERE ' + k + ' = ?').get(v)
      if (!row) notFound('User', v)
      return toUser(row)
    },
    async create({ data }) {
      if (db.prepare('SELECT id FROM users WHERE username = ?').get(data.username)) uniqueErr('username')
      const now = new Date().toISOString()
      const r = db.prepare('INSERT INTO users (username,password,name,createdAt) VALUES (?,?,?,?)').run(data.username, data.password, data.name, now)
      return toUser(db.prepare('SELECT * FROM users WHERE id = ?').get(r.lastInsertRowid))
    },
  },

  refreshToken: {
    async findUnique({ where }) {
      return toTok(db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(where.token))
    },
    async create({ data }) {
      const now = new Date().toISOString()
      const r = db.prepare('INSERT INTO refresh_tokens (token,userId,createdAt) VALUES (?,?,?)').run(data.token, data.userId, now)
      return toTok(db.prepare('SELECT * FROM refresh_tokens WHERE id = ?').get(r.lastInsertRowid))
    },
    async deleteMany({ where }) {
      if (where.userId !== undefined) db.prepare('DELETE FROM refresh_tokens WHERE userId = ?').run(where.userId)
      else if (where.token !== undefined) db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(where.token)
    },
    async delete({ where }) {
      db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(where.token)
    },
  },

  announcement: {
    async findMany({ where = {}, orderBy = { createdAt: 'desc' }, skip = 0, take = 10 } = {}) {
      let sql = 'SELECT * FROM announcements'
      const params = []
      if (where.title?.contains) { sql += ' WHERE title LIKE ? COLLATE NOCASE'; params.push('%' + where.title.contains + '%') }
      const dir = Object.values(orderBy)[0]?.toUpperCase?.() === 'ASC' ? 'ASC' : 'DESC'
      sql += ' ORDER BY createdAt ' + dir + ' LIMIT ? OFFSET ?'
      params.push(take, skip)
      return db.prepare(sql).all(...params).map(toAnn)
    },
    async count({ where = {} } = {}) {
      let sql = 'SELECT COUNT(*) as cnt FROM announcements'
      const params = []
      if (where.title?.contains) { sql += ' WHERE title LIKE ? COLLATE NOCASE'; params.push('%' + where.title.contains + '%') }
      return db.prepare(sql).get(...params).cnt
    },
    async findUnique({ where }) {
      return toAnn(db.prepare('SELECT * FROM announcements WHERE id = ?').get(where.id))
    },
    async findUniqueOrThrow({ where }) {
      const row = db.prepare('SELECT * FROM announcements WHERE id = ?').get(where.id)
      if (!row) notFound('Announcement', where.id)
      return toAnn(row)
    },
    async create({ data }) {
      const now = new Date().toISOString()
      const r = db.prepare('INSERT INTO announcements (title,description,price,category,contactInfo,userId,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)').run(data.title, data.description, data.price, data.category, data.contactInfo, data.userId, now, now)
      return toAnn(db.prepare('SELECT * FROM announcements WHERE id = ?').get(r.lastInsertRowid))
    },
    async update({ where, data }) {
      const existing = db.prepare('SELECT * FROM announcements WHERE id = ?').get(where.id)
      if (!existing) notFound('Announcement', where.id)
      const now = new Date().toISOString()
      const merged = { ...existing, ...data }
      db.prepare('UPDATE announcements SET title=?,description=?,price=?,category=?,contactInfo=?,updatedAt=? WHERE id=?').run(merged.title, merged.description, merged.price, merged.category, merged.contactInfo, now, where.id)
      return toAnn(db.prepare('SELECT * FROM announcements WHERE id = ?').get(where.id))
    },
    async delete({ where }) {
      const existing = db.prepare('SELECT id FROM announcements WHERE id = ?').get(where.id)
      if (!existing) notFound('Announcement', where.id)
      db.prepare('DELETE FROM announcements WHERE id = ?').run(where.id)
    },
  },
}

export default prisma