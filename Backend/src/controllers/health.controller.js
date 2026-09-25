import { databaseStatus } from '../config/database.js'

export function health(_request, response) {
  const database = databaseStatus()
  return response.status(database === 'connected' ? 200 : 503).json({
    success: database === 'connected',
    message: 'CampusHub API is running',
    database,
  })
}
