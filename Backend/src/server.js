import { createApp } from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import { getEnv } from './config/env.js'

let server
let shuttingDown = false

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`${signal} received; shutting down gracefully.`)
  if (server) await new Promise((resolve) => server.close(resolve))
  await disconnectDatabase()
  process.exit(exitCode)
}

async function start() {
  const env = getEnv()
  await connectDatabase()
  const app = createApp()
  server = app.listen(env.PORT, () => console.log(`CampusHub API listening on port ${env.PORT}`))
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error)
  shutdown('unhandledRejection', 1)
})
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error)
  shutdown('uncaughtException', 1)
})

start().catch((error) => {
  console.error(`Unable to start CampusHub API: ${error.message}`)
  shutdown('startup failure', 1)
})
