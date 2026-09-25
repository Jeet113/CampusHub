import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import User from '../src/models/User.js'
import Club from '../src/models/Club.js'

async function sync() {
  await connectDatabase()
  const clubs = await Club.find()
  for (const c of clubs) {
    if (c.logo && c.createdBy) {
      await User.updateOne({ _id: c.createdBy }, { profileImage: c.logo })
    }
  }
  const clubUsers = await User.find({ role: 'club' })
  console.log('Synchronized club users:', clubUsers.map(u => ({ name: u.name, profileImage: u.profileImage })))
  await disconnectDatabase()
}

sync().catch(console.error)
