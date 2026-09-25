import ApiError from '../utils/ApiError.js'

export function validate(schemas) {
  return function validationMiddleware(request, _response, next) {
    const validated = {}
    const errors = []

    for (const [section, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(request[section])
      if (result.success) validated[section] = result.data
      else {
        errors.push(
          ...result.error.issues.map((issue) => ({
            field: [section, ...issue.path].join('.'),
            message: issue.message,
          })),
        )
      }
    }

    if (errors.length) return next(new ApiError(400, 'Validation failed', errors))
    request.validated = { ...request.validated, ...validated }
    return next()
  }
}
