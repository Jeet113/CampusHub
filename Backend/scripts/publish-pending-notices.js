import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import Notice from '../src/models/Notice.js'

async function publishNotices() {
  await connectDatabase()
  const notices = await Notice.find({}).lean()
  console.log('Notices before:', notices.map((n) => ({ id: n._id, title: n.title, status: n.status })))

  const updated = await Notice.updateMany({ status: 'pending' }, { $set: { status: 'published', publishedAt: new Date() } })
  console.log(`Updated ${updated.modifiedCount} pending notices to published.`)

  const after = await Notice.find({}).lean()
  console.log('Notices after:', after.map((n) => ({ id: n._id, title: n.title, status: n.status })))
  await disconnectDatabase()
}

publishNotices().catch(console.error)
