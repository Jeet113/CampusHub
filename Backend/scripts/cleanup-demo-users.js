import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import User from '../src/models/User.js'

async function cleanup() {
  await connectDatabase()
  const demoEmails = ['club@campushub.local', 'robotics@campushub.local', 'testrobotics@campushub.local']
  const res = await User.deleteMany({ email: { $in: demoEmails } })
  console.log(`Deleted ${res.deletedCount} demo club accounts.`)

  const remaining = await User.find({ role: 'club' }).lean()
  console.log('Active verified clubs in database:', remaining.map((u) => ({ name: u.name, email: u.email })))
  await disconnectDatabase()
}

cleanup().catch(console.error)
