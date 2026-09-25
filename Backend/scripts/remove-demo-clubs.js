import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import Club from '../src/models/Club.js'
import Event from '../src/models/Event.js'
import Membership from '../src/models/Membership.js'
import User from '../src/models/User.js'

async function removeDemoClubs() {
  await connectDatabase()
  try {
    const clubs = await Club.find({})
    const clubIds = clubs.map((c) => c._id)
    console.log(`Found ${clubs.length} clubs to remove.`)

    const resEvents = await Event.deleteMany({ club: { $in: clubIds } })
    const resMemberships = await Membership.deleteMany({ club: { $in: clubIds } })
    const resUsers = await User.updateMany({ club: { $in: clubIds } }, { $unset: { club: 1 } })
    const resClubs = await Club.deleteMany({})

    console.log(`Deleted ${resClubs.deletedCount} clubs.`)
    console.log(`Deleted ${resEvents.deletedCount} related events.`)
    console.log(`Deleted ${resMemberships.deletedCount} related memberships.`)
    console.log(`Updated ${resUsers.modifiedCount} user records.`)
  } finally {
    await disconnectDatabase()
  }
}

removeDemoClubs()
  .then(() => console.log('Successfully removed all demo clubs.'))
  .catch((err) => {
    console.error('Error removing demo clubs:', err)
    process.exitCode = 1
  })
