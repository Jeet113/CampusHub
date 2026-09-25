import multer from 'multer'
import mongoose from 'mongoose'
import { ZodError } from 'zod'
import jwt from 'jsonwebtoken'
import { getEnv } from '../config/env.js'
import ApiError from '../utils/ApiError.js'

const { JsonWebTokenError, TokenExpiredError } = jwt

export default function errorHandler(error, _request, response, _next) {
  let normalized = error

  if (error instanceof ZodError) {
    normalized = new ApiError(
      400,
      'Validation failed',
      error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    )
  } else if (error instanceof mongoose.Error.ValidationError) {
    normalized = new ApiError(
      400,
      'Database validation failed',
      Object.values(error.errors).map((item) => ({ field: item.path, message: item.message })),
    )
  } else if (error instanceof mongoose.Error.CastError) {
    normalized = new ApiError(400, `Invalid ${error.path}`)
  } else if (error?.code === 11000) {
    const fields = Object.keys(error.keyPattern || error.keyValue || {})
    normalized = new ApiError(409, `${fields.join(', ') || 'Resource'} already exists`)
  } else if (error instanceof TokenExpiredError) {
    normalized = new ApiError(401, 'Token has expired')
  } else if (error instanceof JsonWebTokenError) {
    normalized = new ApiError(401, 'Invalid token')
  } else if (error instanceof multer.MulterError) {
    normalized = new ApiError(400, error.code === 'LIMIT_FILE_SIZE' ? 'Uploaded file is too large' : error.message)
  }

  const statusCode = normalized.statusCode || 500
  const production = (() => {
    try {
      return getEnv().NODE_ENV === 'production'
    } catch {
      return process.env.NODE_ENV === 'production'
    }
  })()

  if (statusCode >= 500 && !production) console.error(normalized)

  response.status(statusCode).json({
    success: false,
    message: statusCode === 500 && production ? 'Internal server error' : normalized.message || 'Something went wrong',
    errors: normalized.errors || [],
    ...(!production && normalized.stack ? { stack: normalized.stack } : {}),
  })
}
