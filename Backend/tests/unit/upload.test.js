import { describe, expect, it, vi } from 'vitest'
import mongoose from 'mongoose'
import express from 'express'
import request from 'supertest'
import { assetSchema } from '../../src/models/shared.js'
import { singleImageUpload } from '../../src/middleware/upload.middleware.js'
import errorHandler from '../../src/middleware/error.middleware.js'
import * as cloudinaryConfig from '../../src/config/cloudinary.js'
import { uploadBuffer, deleteAsset, safelyDeleteAsset } from '../../src/services/cloudinary.service.js'
import ApiError from '../../src/utils/ApiError.js'

describe('assetSchema serialization and compatibility', () => {
  const TestModel = mongoose.models.TestAssetDoc || mongoose.model(
    'TestAssetDoc',
    new mongoose.Schema({ image: assetSchema }),
  )

  it('synchronizes url and imageUrl, publicId and cloudinaryPublicId from Cloudinary response', () => {
    const doc = new TestModel({
      image: {
        imageUrl: 'https://res.cloudinary.com/dtstj7kv3/image/upload/v12345/campushub/profiles/abc.png',
        cloudinaryPublicId: 'campushub/profiles/abc',
        resourceType: 'image',
      },
    })

    const json = doc.toJSON()
    expect(json.image.imageUrl).toBe('https://res.cloudinary.com/dtstj7kv3/image/upload/v12345/campushub/profiles/abc.png')
    expect(json.image.url).toBe('https://res.cloudinary.com/dtstj7kv3/image/upload/v12345/campushub/profiles/abc.png')
    expect(json.image.cloudinaryPublicId).toBe('campushub/profiles/abc')
    expect(json.image.publicId).toBe('campushub/profiles/abc')
  })

  it('provides backward compatibility for documents stored with legacy url/publicId', () => {
    const doc = new TestModel({
      image: {
        url: 'https://res.cloudinary.com/dtstj7kv3/image/upload/v12345/campushub/profiles/old.png',
        publicId: 'campushub/profiles/old',
        resourceType: 'image',
      },
    })

    const json = doc.toJSON()
    expect(json.image.imageUrl).toBe('https://res.cloudinary.com/dtstj7kv3/image/upload/v12345/campushub/profiles/old.png')
    expect(json.image.cloudinaryPublicId).toBe('campushub/profiles/old')
  })
})

describe('uploadBuffer and Cloudinary integration', () => {
  it('throws 400 ApiError if file buffer is missing', async () => {
    await expect(uploadBuffer(null, 'test')).rejects.toThrow(ApiError)
    await expect(uploadBuffer({}, 'test')).rejects.toThrow('No file buffer provided')
  })

  it('streams buffer to Cloudinary and returns secure_url and public_id', async () => {
    const mockUploadStream = vi.fn((options, callback) => {
      expect(options.folder).toBe('campushub/profiles')
      expect(options.resource_type).toBe('image')
      return {
        end: (buffer) => {
          expect(buffer).toEqual(Buffer.from('fake-image-bytes'))
          callback(null, {
            secure_url: 'https://res.cloudinary.com/dtstj7kv3/image/upload/v1/campushub/profiles/new-pic.png',
            public_id: 'campushub/profiles/new-pic',
            resource_type: 'image',
          })
        },
      }
    })

    vi.spyOn(cloudinaryConfig, 'getCloudinary').mockReturnValue({
      uploader: {
        upload_stream: mockUploadStream,
      },
    })

    const result = await uploadBuffer(
      { buffer: Buffer.from('fake-image-bytes'), mimetype: 'image/png' },
      'profiles',
    )

    expect(result).toEqual({
      imageUrl: 'https://res.cloudinary.com/dtstj7kv3/image/upload/v1/campushub/profiles/new-pic.png',
      url: 'https://res.cloudinary.com/dtstj7kv3/image/upload/v1/campushub/profiles/new-pic.png',
      cloudinaryPublicId: 'campushub/profiles/new-pic',
      publicId: 'campushub/profiles/new-pic',
      resourceType: 'image',
    })
  })

  it('rejects with 502 ApiError and does NOT fallback to local disk on upload failure', async () => {
    const mockUploadStream = vi.fn((_options, callback) => {
      return {
        end: () => {
          callback(new Error('Cloudinary server unavailable'), null)
        },
      }
    })

    vi.spyOn(cloudinaryConfig, 'getCloudinary').mockReturnValue({
      uploader: {
        upload_stream: mockUploadStream,
      },
    })

    await expect(
      uploadBuffer(
        { buffer: Buffer.from('bytes'), mimetype: 'image/jpeg' },
        'profiles',
      ),
    ).rejects.toThrow('Cloudinary upload failed')
  })

  it('destroys asset in Cloudinary using publicId', async () => {
    const mockDestroy = vi.fn().mockResolvedValue({ result: 'ok' })
    vi.spyOn(cloudinaryConfig, 'getCloudinary').mockReturnValue({
      uploader: {
        destroy: mockDestroy,
      },
    })

    await deleteAsset({
      cloudinaryPublicId: 'campushub/profiles/test_photo',
      resourceType: 'image',
    })

    expect(mockDestroy).toHaveBeenCalledWith(
      'campushub/profiles/test_photo',
      expect.objectContaining({ resource_type: 'image', invalidate: true }),
    )
  })

  it('safelyDeleteAsset catches and suppresses errors without throwing', async () => {
    vi.spyOn(cloudinaryConfig, 'getCloudinary').mockImplementation(() => {
      throw new Error('Cloudinary down')
    })
    await expect(safelyDeleteAsset({ publicId: 'test' })).resolves.toBeUndefined()
  })
})

describe('singleImageUpload middleware', () => {
  function makeApp(primaryField = 'avatar') {
    const app = express()
    app.post(
      '/upload',
      singleImageUpload(primaryField),
      (req, res) => {
        if (!req.file) return res.status(400).json({ error: 'No file received' })
        res.json({
          fieldname: req.file.fieldname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          isBuffer: Buffer.isBuffer(req.file.buffer),
        })
      },
    )
    app.use(errorHandler)
    return app
  }

  it('accepts file uploaded with specific field name (e.g. avatar) in memory', async () => {
    const app = makeApp('avatar')
    const response = await request(app)
      .post('/upload')
      .attach('avatar', Buffer.from('test-image-content'), 'avatar.png')

    expect(response.status).toBe(200)
    expect(response.body.mimetype).toBe('image/png')
    expect(response.body.isBuffer).toBe(true)
  })

  it('accepts file uploaded with generic field name (image) in memory', async () => {
    const app = makeApp('avatar')
    const response = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('test-image-content'), 'avatar.jpg')

    expect(response.status).toBe(200)
    expect(response.body.mimetype).toBe('image/jpeg')
    expect(response.body.isBuffer).toBe(true)
  })

  it('rejects unsupported MIME types with 400 error', async () => {
    const app = makeApp('avatar')
    const response = await request(app)
      .post('/upload')
      .attach('image', Buffer.from('console.log("hello")'), 'script.js')

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('Unsupported file type')
  })

  it('rejects files larger than 5MB limit with 400 error', async () => {
    const app = makeApp('avatar')
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024)
    const response = await request(app)
      .post('/upload')
      .attach('image', largeBuffer, 'large.png')

    expect(response.status).toBe(400)
    expect(response.body.message).toContain('too large')
  })
})
