import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import { errors as celebrateErrors } from 'celebrate'
import announcementsRouter from './src/routes/announcements.routes.js'
import authRouter from './src/routes/auth.routes.js'

const app = express()

//  Swagger 
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Announcement Board API — with Auth',
      version: '2.0.0',
      description: 'JWT-authenticated REST API. Register/login to get a Bearer token, then use it on protected routes.',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the accessToken from /auth/register or /auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id:        { type: 'integer', example: 1 },
            username:  { type: 'string',  example: 'ivan_petrenko' },
            name:      { type: 'string',  example: 'Іван' },
            createdAt: { type: 'string',  format: 'date-time' },
          },
        },
        TokenPair: {
          type: 'object',
          properties: {
            accessToken:  { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user:         { $ref: '#/components/schemas/User' },
            accessToken:  { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        Announcement: {
          type: 'object',
          properties: {
            id:          { type: 'integer', example: 1 },
            title:       { type: 'string',  example: 'MacBook Pro M3' },
            description: { type: 'string',  example: 'Great condition' },
            price:       { type: 'number',  example: 72000 },
            category:    { type: 'string',  enum: ['sale','service','job','other'] },
            contactInfo: { type: 'string',  example: '+38 067 411 2233' },
            userId:      { type: 'integer', example: 1 },
            createdAt:   { type: 'string',  format: 'date-time' },
            updatedAt:   { type: 'string',  format: 'date-time' },
          },
        },
        AnnouncementInput: {
          type: 'object',
          required: ['title','description','price','category','contactInfo'],
          properties: {
            title:       { type: 'string', minLength: 5, maxLength: 100 },
            description: { type: 'string', minLength: 10 },
            price:       { type: 'number', minimum: 0.01 },
            category:    { type: 'string', enum: ['sale','service','job','other'] },
            contactInfo: { type: 'string', minLength: 5 },
          },
        },
        AnnouncementPatch: {
          type: 'object',
          minProperties: 1,
          properties: {
            title:       { type: 'string', minLength: 5, maxLength: 100 },
            description: { type: 'string', minLength: 10 },
            price:       { type: 'number', minimum: 0.01 },
            category:    { type: 'string', enum: ['sale','service','job','other'] },
            contactInfo: { type: 'string', minLength: 5 },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total:      { type: 'integer' },
            page:       { type: 'integer' },
            totalPages: { type: 'integer' },
            perPage:    { type: 'integer' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
})

//  Middleware 
app.use(express.json())
app.use(cookieParser())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

//  Routes 
app.use('/auth', authRouter)
app.use('/announcements', announcementsRouter)

//  404 
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

//  Error handler 
// celebrate validation errors must come before generic handler
app.use(celebrateErrors())

app.use((err, req, res, next) => {
  console.error(err?.message || err)

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON' })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' })
  }
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Unique constraint violation' })
  }
  if (err.status) {
    return res.status(err.status).json({ error: err.message })
  }

  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Swagger UI:  http://localhost:${PORT}/api-docs`)
})