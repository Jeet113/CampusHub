import dns from 'node:dns'
import mongoose from 'mongoose'
import { getEnv } from './env.js'

// Use reliable public DNS resolvers for MongoDB SRV query lookup
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1'])
} catch (err) {
  console.warn('Could not set custom DNS servers:', err.message)
}

export async function connectDatabase(uri = getEnv().MONGODB_URI) {
  if (mongoose.connection.readyState === 1) return mongoose.connection
  if (mongoose.connection.readyState === 2) return mongoose.connection.asPromise()

  mongoose.set('strictQuery', true)
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: getEnv().NODE_ENV !== 'production',
  })
  return mongoose.connection
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect()
}

export function databaseStatus() {
  return ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown'
}
