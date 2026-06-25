import createHttpError from 'http-errors'
import prisma from '../../prisma/client.js'

const PER_PAGE = 10

// GET /announcements
export async function getAnnouncements(req, res) {
  const { search = '', sort = 'newest', page = 1 } = req.query
  const pageNum = Number(page)

  const where = {}
  if (search) where.title = { contains: search }

  const orderBy = { createdAt: sort === 'oldest' ? 'asc' : 'desc' }
  const skip = (pageNum - 1) * PER_PAGE

  const [data, total] = await Promise.all([
    prisma.announcement.findMany({ where, orderBy, skip, take: PER_PAGE }),
    prisma.announcement.count({ where }),
  ])

  res.json({
    data,
    pagination: {
      total,
      page: pageNum,
      totalPages: Math.ceil(total / PER_PAGE),
      perPage: PER_PAGE,
    },
  })
}

// GET /announcements/:id
export async function getAnnouncementById(req, res) {
  const announcement = await prisma.announcement.findUniqueOrThrow({
    where: { id: Number(req.params.id) },
  })
  res.json(announcement)
}

// POST /announcements  (protected)
export async function createAnnouncement(req, res) {
  const announcement = await prisma.announcement.create({
    data: { ...req.body, userId: req.user.id },
  })
  res.status(201).json(announcement)
}

// PATCH /announcements/:id  (protected + ownership)
export async function updateAnnouncement(req, res) {
  const id = Number(req.params.id)
  const announcement = await prisma.announcement.findUnique({ where: { id } })

  if (!announcement) throw createHttpError(404, 'Announcement not found')
  if (announcement.userId !== req.user.id) throw createHttpError(403, 'Access denied')

  const updated = await prisma.announcement.update({ where: { id }, data: req.body })
  res.json(updated)
}

// DELETE /announcements/:id  (protected + ownership)
export async function deleteAnnouncement(req, res) {
  const id = Number(req.params.id)
  const announcement = await prisma.announcement.findUnique({ where: { id } })

  if (!announcement) throw createHttpError(404, 'Announcement not found')
  if (announcement.userId !== req.user.id) throw createHttpError(403, 'Access denied')

  await prisma.announcement.delete({ where: { id } })
  res.status(204).end()
}