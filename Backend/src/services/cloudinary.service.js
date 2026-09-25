import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { getCloudinary } from '../config/cloudinary.js'

function getExtension(mimetype) {
  if (mimetype === 'image/png') return 'png'
  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') return 'jpg'
  if (mimetype === 'image/webp') return 'webp'
  if (mimetype === 'image/gif') return 'gif'
  if (mimetype === 'application/pdf') return 'pdf'
  return 'png'
}

async function saveLocalFallback(file, folder) {
  const uploadsBase = path.join(process.cwd(), 'uploads', folder)
  await fs.promises.mkdir(uploadsBase, { recursive: true })
  const ext = getExtension(file.mimetype)
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`
  const filePath = path.join(uploadsBase, filename)
  await fs.promises.writeFile(filePath, file.buffer)
  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image'
  return {
    url: `/uploads/${folder}/${filename}`,
    publicId: `local:${folder}/${filename}`,
    resourceType,
  }
}

export async function uploadBuffer(file, folder) {
  const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image'

  try {
    const client = getCloudinary()
    const result = await new Promise((resolve, reject) => {
      const stream = client.uploader.upload_stream(
        { folder: `campushub/${folder}`, resource_type: resourceType, use_filename: false, unique_filename: true },
        (error, res) => {
          if (error) return reject(error)
          return resolve(res)
        },
      )
      stream.end(file.buffer)
    })
    return { url: result.secure_url, publicId: result.public_id, resourceType }
  } catch (error) {
    console.warn(`[Asset Upload] Cloudinary upload notice (${error.message || 'error'}), using storage fallback.`)
    return saveLocalFallback(file, folder)
  }
}

export async function deleteAsset(asset) {
  if (!asset?.publicId) return
  if (asset.publicId.startsWith('local:')) {
    const rel = asset.publicId.replace('local:', '')
    const filePath = path.join(process.cwd(), 'uploads', rel)
    try {
      if (fs.existsSync(filePath)) await fs.promises.unlink(filePath)
    } catch (err) {
      console.error('Failed to remove local asset:', err.message)
    }
    return
  }
  try {
    const client = getCloudinary()
    await client.uploader.destroy(asset.publicId, { resource_type: asset.resourceType || 'image', invalidate: true })
  } catch (err) {
    console.warn('Cloudinary delete notice:', err.message)
  }
}

export async function safelyDeleteAsset(asset) {
  try {
    await deleteAsset(asset)
  } catch (error) {
    console.error(`Unable to delete asset ${asset?.publicId || 'unknown'}:`, error.message)
  }
}
