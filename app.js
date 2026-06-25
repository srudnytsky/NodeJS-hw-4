import express from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJsdoc from 'swagger-jsdoc'
import { errors as celebrateErrors } from 'celebrate'
import announcementsRouter from './src/routes/announcements.routes.js'

const app = express()

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Announcement Board REST API',
      version: '1.0.0',
      description: 'RESTful API for a classified ads board. Supports listing, searching, creating, updating and deleting announcements.',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      schemas: {
        Announcement: {
          type: 'object',
          properties: {
            id:          { type: 'integer', example: 1 },
            title:       { type: 'string',  example: 'Selling MacBook Pro M3' },
            description: { type: 'string',  example: 'Great condition, full kit included' },
            price:       { type: 'number',  example: 72000 },
            category:    { type: 'string',  enum: ['sale','service','job','other'], example: 'sale' },
            contactInfo: { type: 'string',  example: '+38 067 411 2233' },
            createdAt:   { type: 'string',  format: 'date-time' },
            updatedAt:   { type: 'string',  format: 'date-time' },
          },
        },
        AnnouncementInput: {
          type: 'object',
          required: ['title','description','price','category','contactInfo'],
          properties: {
            title:       { type: 'string', minLength: 5,  maxLength: 100, example: 'Selling MacBook Pro M3' },
            description: { type: 'string', minLength: 10, example: 'Great condition, 16GB RAM, full kit' },
            price:       { type: 'number', minimum: 0.01, example: 72000 },
            category:    { type: 'string', enum: ['sale','service','job','other'], example: 'sale' },
            contactInfo: { type: 'string', minLength: 5, example: '+38 067 411 2233' },
          },
        },
        AnnouncementPatch: {
          type: 'object',
          minProperties: 1,
          properties: {
            title:       { type: 'string', minLength: 5,  maxLength: 100 },
            description: { type: 'string', minLength: 10 },
            price:       { type: 'number', minimum: 0.01 },
            category:    { type: 'string', enum: ['sale','service','job','other'] },
            contactInfo: { type: 'string', minLength: 5 },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total:      { type: 'integer', example: 23 },
            page:       { type: 'integer', example: 2 },
            totalPages: { type: 'integer', example: 3 },
            perPage:    { type: 'integer', example: 10 },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
}

const swaggerSpec = swaggerJsdoc(swaggerOptions)

app.use(express.json())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

//  Routes
app.use('/announcements', announcementsRouter)

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

//  Error handler
app.use(celebrateErrors())

app.use((err, req, res, next) => {
  console.error(err)

  if (err.type === 'entity.parse.failed' && err.status === 400) {
    return res.status(400).json({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Invalid JSON format in request body',
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Resource not found' })
  }

  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Unique constraint violation' })
  }

  res.status(500).json({ error: 'Internal server error' })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
  console.log(`API docs: http://localhost:${PORT}/api-docs`)
})
