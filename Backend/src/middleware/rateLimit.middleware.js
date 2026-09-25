import rateLimit from 'express-rate-limit'

const handler = (_request, response) => {
  response.status(429).json({ success: false, message: 'Too many requests. Please try again later.', errors: [] })
}

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler,
})

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
})
