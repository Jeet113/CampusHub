import ApiError from '../utils/ApiError.js'

export default function notFound(request, _response, next) {
  next(new ApiError(404, `Route not found: ${request.method} ${request.originalUrl}`))
}
