import multer from 'multer'
import ApiError from '../utils/ApiError.js'

const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const attachmentTypes = new Set([...imageTypes, 'application/pdf'])

function createUpload(allowedTypes, maxSize) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize, files: 5 },
    fileFilter(_request, file, callback) {
      if (!allowedTypes.has(file.mimetype)) {
        return callback(new ApiError(400, `Unsupported file type: ${file.mimetype}`))
      }
      return callback(null, true)
    },
  })
}

export const imageUpload = createUpload(imageTypes, 5 * 1024 * 1024)
export const attachmentUpload = createUpload(attachmentTypes, 10 * 1024 * 1024)
