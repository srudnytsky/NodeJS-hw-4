import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import createHttpError from 'http-errors'
import prisma from '../../prisma/client.js'

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
}

function generateTokens(userId) {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  )
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  return { accessToken, refreshToken }
}

function safeUser(user) {
  const { password, ...rest } = user
  return rest
}

// POST /auth/register
export async function register(req, res) {
  const { username, password, name } = req.body

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    throw createHttpError(409, 'User with this username already exists')
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { username, password: hashedPassword, name },
  })

  const { accessToken, refreshToken } = generateTokens(user.id)
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } })

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

  res.status(201).json({
    user: safeUser(user),
    accessToken,
    refreshToken,
  })
}

// POST /auth/login
export async function login(req, res) {
  const { username, password } = req.body

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) throw createHttpError(401, 'Invalid credentials')

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) throw createHttpError(401, 'Invalid credentials')

  // rotate: delete old token, issue new one
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } })

  const { accessToken, refreshToken } = generateTokens(user.id)
  await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id } })

  res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)

  res.json({
    user: safeUser(user),
    accessToken,
    refreshToken,
  })
}

// POST /auth/refresh
export async function refresh(req, res) {
  const token = req.cookies?.refreshToken || req.body?.refreshToken

  if (!token) throw createHttpError(401, 'Refresh token required')

  // verify signature
  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  } catch {
    throw createHttpError(401, 'Invalid or expired refresh token')
  }

  // check token exists in DB
  const stored = await prisma.refreshToken.findUnique({ where: { token } })
  if (!stored) throw createHttpError(401, 'Refresh token not found')

  // token rotation
  await prisma.refreshToken.delete({ where: { token } })

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload.id)
  await prisma.refreshToken.create({ data: { token: newRefreshToken, userId: payload.id } })

  res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS)

  res.json({ accessToken, refreshToken: newRefreshToken })
}

// POST /auth/logout  (protected)
export async function logout(req, res) {
  await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } })
  res.clearCookie('refreshToken')
  res.json({ message: 'Logged out successfully' })
}

// GET /auth/me  (protected)
export async function me(req, res) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user.id } })
  res.json(safeUser(user))
}