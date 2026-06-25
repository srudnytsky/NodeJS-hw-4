import { celebrate, Joi, Segments } from 'celebrate'

export const registerValidator = celebrate({
  [Segments.BODY]: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
    name:     Joi.string().min(2).required(),
  }),
})

export const loginValidator = celebrate({
  [Segments.BODY]: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
})

export const refreshValidator = celebrate({
  [Segments.BODY]: Joi.object({
    refreshToken: Joi.string().optional(),
  }).optional(),
})