import jwt from 'jsonwebtoken'
import createHttpError from 'http-errors'

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(createHttpError(401, 'No token provided'))
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    next()
  } catch {
    next(createHttpError(401, 'Invalid or expired token'))
  }
}