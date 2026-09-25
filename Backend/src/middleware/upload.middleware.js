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
        return callback(
          new ApiError(
            400,
            `Unsupported file type: ${file.mimetype}. Allowed types: ${[...allowedTypes].join(', ')}`,
          ),
        )
      }
      return callback(null, true)
    },
  })
}

export const imageUpload = createUpload(imageTypes, 5 * 1024 * 1024)
export const attachmentUpload = createUpload(attachmentTypes, 10 * 1024 * 1024)

export function singleImageUpload(primaryField = 'image') {
  const fieldList = [{ name: primaryField, maxCount: 1 }]
  if (primaryField !== 'image') fieldList.push({ name: 'image', maxCount: 1 })
  if (primaryField !== 'file') fieldList.push({ name: 'file', maxCount: 1 })
  if (primaryField !== 'photo') fieldList.push({ name: 'photo', maxCount: 1 })

  const upload = imageUpload.fields(fieldList)

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) return next(err)
      if (req.files) {
        req.file =
          req.files[primaryField]?.[0] ||
          req.files.image?.[0] ||
          req.files.file?.[0] ||
          req.files.photo?.[0] ||
          undefined
      }
      next()
    })
  }
}

export function arrayAttachmentUpload(primaryField = 'attachments', maxCount = 5) {
  const fieldList = [
    { name: primaryField, maxCount },
    { name: 'files', maxCount },
    { name: 'attachments', maxCount },
    { name: 'images', maxCount },
  ]
  const upload = attachmentUpload.fields(fieldList)

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) return next(err)
      if (req.files) {
        req.files =
          req.files[primaryField] ||
          req.files.attachments ||
          req.files.files ||
          req.files.images ||
          []
      } else {
        req.files = []
      }
      next()
    })
  }
}
