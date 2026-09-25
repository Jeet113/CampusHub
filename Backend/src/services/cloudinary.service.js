import fs from 'node:fs'
import path from 'node:path'
import { getCloudinary } from '../config/cloudinary.js'
import ApiError from '../utils/ApiError.js'

export async function uploadBuffer(file, folder) {
  if (!file || !file.buffer) {
    throw new ApiError(400, 'No file buffer provided for upload')
  }

  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image'
  const client = getCloudinary()

  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: `campushub/${folder}`,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          return reject(
            new ApiError(502, `Cloudinary upload failed: ${error.message || 'unknown error'}`),
          )
        }
        return resolve({
          imageUrl: result.secure_url,
          url: result.secure_url,
          cloudinaryPublicId: result.public_id,
          publicId: result.public_id,
          resourceType: result.resource_type || resourceType,
        })
      },
    )

    stream.end(file.buffer)
  })
}

export async function deleteAsset(asset) {
  if (!asset) return
  const publicId = typeof asset === 'string' ? asset : (asset.cloudinaryPublicId || asset.publicId)
  if (!publicId) return

  // Backward compatibility: clean up legacy local files if encountered
  if (publicId.startsWith('local:')) {
    const rel = publicId.replace('local:', '')
    const localPaths = [
      path.join(process.cwd(), 'uploads', rel),
      path.join(process.cwd(), 'src', 'uploads', rel),
    ]
    for (const filePath of localPaths) {
      try {
        if (fs.existsSync(filePath)) await fs.promises.unlink(filePath)
      } catch (err) {
        console.error('Failed to remove legacy local asset:', err.message)
      }
    }
    return
  }

  try {
    const client = getCloudinary()
    const resourceType = asset.resourceType || (publicId.endsWith('.pdf') ? 'raw' : 'image')
    await client.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true })
  } catch (err) {
    console.warn('Cloudinary delete notice:', err.message)
  }
}

export async function safelyDeleteAsset(asset) {
  try {
    await deleteAsset(asset)
  } catch (error) {
    console.error(
      `Unable to delete asset ${asset?.cloudinaryPublicId || asset?.publicId || 'unknown'}:`,
      error.message,
    )
  }
}
