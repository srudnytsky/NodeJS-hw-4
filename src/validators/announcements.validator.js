import { celebrate, Joi, Segments } from 'celebrate'

export const getAnnouncementsValidator = celebrate({
  [Segments.QUERY]: Joi.object({
    search: Joi.string().optional(),
    sort:   Joi.string().valid('newest', 'oldest').optional(),
    page:   Joi.number().integer().min(1).optional(),
  }),
})

export const idParamValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.number().integer().required(),
  }),
})

export const createAnnouncementValidator = celebrate({
  [Segments.BODY]: Joi.object({
    title:       Joi.string().min(5).max(100).required(),
    description: Joi.string().min(10).required(),
    price:       Joi.number().greater(0).required(),
    category:    Joi.string().valid('sale', 'service', 'job', 'other').required(),
    contactInfo: Joi.string().min(5).required(),
  }),
})

export const updateAnnouncementValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    id: Joi.number().integer().required(),
  }),
  [Segments.BODY]: Joi.object({
    title:       Joi.string().min(5).max(100).optional(),
    description: Joi.string().min(10).optional(),
    price:       Joi.number().greater(0).optional(),
    category:    Joi.string().valid('sale', 'service', 'job', 'other').optional(),
    contactInfo: Joi.string().min(5).optional(),
  }).min(1),
})