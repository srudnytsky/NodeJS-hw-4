/**
 * Prisma-compatible client backed by Node.js built-in node:sqlite.
 * Exposes the same prisma.announcement.* API used in the assignment
 * (findMany, findUniqueOrThrow, create, update, delete, count).
 *
 * NOTE: In a real environment run `npm run prisma:migrate` and this file
 * is replaced by the generated @prisma/client. See README for details.
 */
import 'dotenv/config'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Resolve DB path from DATABASE_URL env (strips "file:" prefix)
const rawUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'
const dbPath = rawUrl.startsWith('file:')
  ? resolve(process.cwd(), rawUrl.slice(5))
  : rawUrl

const db = new DatabaseSync(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS announcements (
    id          INTEGER  PRIMARY KEY AUTOINCREMENT,
    title       TEXT     NOT NULL,
    description TEXT     NOT NULL,
    price       REAL     NOT NULL,
    category    TEXT     NOT NULL,
    contactInfo TEXT     NOT NULL,
    createdAt   TEXT     NOT NULL,
    updatedAt   TEXT     NOT NULL
  )
`)

// seed demo data once
const existing = db.prepare('SELECT COUNT(*) as cnt FROM announcements').get().cnt
if (existing === 0) {
  const ins = db.prepare(`
    INSERT INTO announcements (title,description,price,category,contactInfo,createdAt,updatedAt)
    VALUES (?,?,?,?,?,?,?)
  `)
  const seeds = [
    ['MacBook Pro 14" M3 — відмінний стан', 'Apple M3, 16 ГБ RAM, SSD 512 ГБ. Куплений грудень 2023. Повна комплектація: зарядний пристрій MagSafe 3, коробка, документи. Акумулятор тримає цілий день.', 72000, 'sale', 'telegram: @macbook_seller або +38 067 411 2233', '2025-03-15T10:30:00.000Z'],
    ['Розробка сайтів та лендінгів під ключ', 'React / Next.js, Node.js, PostgreSQL. Лендінг — 3–5 днів, повноцінний сайт — від 2 тижнів. Технічна підтримка 30 днів безкоштовно після здачі.', 8500, 'service', 'dev.mykola@gmail.com', '2025-03-18T14:00:00.000Z'],
    ['Шукаю роботу Junior Frontend Developer', 'HTML, CSS, JavaScript ES6+, React, Git, TypeScript базовий. Три pet-проекти. Київ, готовий до гібридного або remote формату.', 25000, 'job', 'linkedin.com/in/oleksiy-dev або oleksiy.frontend@ukr.net', '2025-03-20T09:15:00.000Z'],
    ['iPhone 15 Pro 256 ГБ Natural Titanium', 'Ідеальний стан, завжди в чохлі зі склом. Акумулятор 98%. Повний комплект: коробка, кабель USB-C, чек із магазину.', 45000, 'sale', '+38 050 987 6543', '2025-03-22T11:00:00.000Z'],
    ['Репетитор з математики — ЗНО/ДПА підготовка', '7 років досвіду, 85% учнів склали ЗНО на 180+ балів. Онлайн або вдома. Перше пробне заняття безкоштовно.', 450, 'service', 'Вікторія, viber/telegram: +38 063 222 1100', '2025-03-25T16:45:00.000Z'],
    ['Trek Marlin 7 (2023) — велосипед 29"', 'Розмір M, проїжджено ~800 км, новий ланцюг вересень 2023. Крила, підніжка, замок у подарунок. Причина продажу — переїзд.', 18500, 'sale', 'Андрій, +38 097 333 4455 (після 17:00)', '2025-03-28T08:30:00.000Z'],
    ['SMM-менеджер / контент-маркетолог — фріланс', 'Ведення Instagram/Facebook, контент-план, пости, stories, reels, базова графіка Canva. Ціна за місяць ведення (2 пости/день).', 6000, 'service', 'Аліна, instagram: @alina.smm.ua або alina.smm@gmail.com', '2025-04-01T12:00:00.000Z'],
    ['Python Backend Developer (Middle) — SoftBridge', 'Python 3.10+, FastAPI або Django, PostgreSQL, Docker. Remote або офіс Львів. Зарплата $1500–2200, 20 днів відпустки, оплата навчання.', 60000, 'job', 'hr@softbridge.ua', '2025-04-03T10:00:00.000Z'],
    ['Оренда Toyota Camry 2022 — подобово', 'Автомат, 2.5 бензин, пробіг 28 000 км. КАСКО включено, необмежений пробіг по Україні. Застава 10 000 грн. Харків, вул. Сумська.', 1800, 'other', '+38 066 555 7788, Дмитро (viber/telegram)', '2025-04-05T09:00:00.000Z'],
    ['Диван-кутовий IKEA FRIHETEN, темно-сірий', '230×151 см, функція сну, ящик для зберігання. 2 роки, стан гарний. Матрац включений. Самовивіз Дніпро.', 9500, 'sale', 'Оксана, +38 095 111 2244', '2025-04-08T15:20:00.000Z'],
    ['Фотограф на весілля та сімейні фотосесії', 'Sony A7 IV. 400–600 оброблених фото, готові за 14 днів. Одеса та область. Ціна за повний день (8 год).', 12000, 'service', 'instagram: @photo.by.roman або roman.photo.odesa@gmail.com', '2025-04-10T11:30:00.000Z'],
    ['Загублено хаскі — Зевс, Оболонь Київ', 'Самець, 3 роки, чорно-білий, блакитні очі. Жовтий нашийник. Зник 12 квітня біля парку Наталка. Винагорода гарантована!', 0, 'other', 'Марина, +38 067 999 0011 (telegram/будь-який час)', '2025-04-12T07:00:00.000Z'],
  ]
  for (const [title, description, price, category, contactInfo, createdAt] of seeds) {
    ins.run(title, description, price, category, contactInfo, createdAt, createdAt)
  }
  console.log(`✅ Seeded ${seeds.length} demo announcements`)
}

// helpers
function toRecord(row) {
  if (!row) return null
  return {
    ...row,
    price: Number(row.price),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  }
}

function notFound(id) {
  const err = new Error(`No Announcement record(s) found for id=${id}`)
  err.code = 'P2025'
  throw err
}

// Prisma-compatible client 
const prisma = {
  announcement: {
    async findMany({ where = {}, orderBy = { createdAt: 'desc' }, skip = 0, take = 10 } = {}) {
      let sql = 'SELECT * FROM announcements'
      const params = []
      if (where.title?.contains) {
        sql += ' WHERE title LIKE ? COLLATE NOCASE'
        params.push(`%${where.title.contains}%`)
      }
      const dir = Object.values(orderBy)[0]?.toUpperCase?.() === 'ASC' ? 'ASC' : 'DESC'
      sql += ` ORDER BY createdAt ${dir} LIMIT ? OFFSET ?`
      params.push(take, skip)
      return db.prepare(sql).all(...params).map(toRecord)
    },

    async count({ where = {} } = {}) {
      let sql = 'SELECT COUNT(*) as cnt FROM announcements'
      const params = []
      if (where.title?.contains) {
        sql += ' WHERE title LIKE ? COLLATE NOCASE'
        params.push(`%${where.title.contains}%`)
      }
      return db.prepare(sql).get(...params).cnt
    },

    async findUniqueOrThrow({ where }) {
      const row = db.prepare('SELECT * FROM announcements WHERE id = ?').get(where.id)
      if (!row) notFound(where.id)
      return toRecord(row)
    },

    async create({ data }) {
      const now = new Date().toISOString()
      const stmt = db.prepare(`
        INSERT INTO announcements (title,description,price,category,contactInfo,createdAt,updatedAt)
        VALUES (?,?,?,?,?,?,?)
      `)
      const result = stmt.run(
        data.title, data.description, data.price,
        data.category, data.contactInfo, now, now
      )
      return toRecord(db.prepare('SELECT * FROM announcements WHERE id = ?').get(result.lastInsertRowid))
    },

    async update({ where, data }) {
      const existing = db.prepare('SELECT * FROM announcements WHERE id = ?').get(where.id)
      if (!existing) notFound(where.id)
      const now = new Date().toISOString()
      const merged = { ...existing, ...data, updatedAt: now }
      db.prepare(`
        UPDATE announcements
        SET title=?, description=?, price=?, category=?, contactInfo=?, updatedAt=?
        WHERE id=?
      `).run(
        merged.title, merged.description, merged.price,
        merged.category, merged.contactInfo, merged.updatedAt, where.id
      )
      return toRecord(db.prepare('SELECT * FROM announcements WHERE id = ?').get(where.id))
    },

    async delete({ where }) {
      const existing = db.prepare('SELECT id FROM announcements WHERE id = ?').get(where.id)
      if (!existing) notFound(where.id)
      db.prepare('DELETE FROM announcements WHERE id = ?').run(where.id)
    },
  },
}

export default prisma
