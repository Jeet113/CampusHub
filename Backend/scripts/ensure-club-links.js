import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import User from '../src/models/User.js'
import Club from '../src/models/Club.js'

async function run() {
  await connectDatabase()
  const clubUsers = await User.find({ role: 'club' })
  for (const u of clubUsers) {
    let club = await Club.findOne({ $or: [{ createdBy: u._id }, { _id: u.club }] })
    if (!club) {
      const slug = u.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      club = await Club.create({
        name: u.name,
        slug,
        initials: u.name.split(' ').map((w) => w[0]).join('').slice(0, 10).toUpperCase() || 'CLUB',
        category: 'Technology',
        description: `${u.name} official campus organization.`,
        status: 'approved',
        createdBy: u._id,
      })
      console.log('Created club for user:', u.name, club._id)
    }
    u.club = club._id
    if (club.logo && !u.profileImage?.url) {
      u.profileImage = club.logo
    }
    await u.save()
  }

  const updated = await User.find({ role: 'club' }).lean()
  console.log('All club users now:', updated.map((u) => ({ name: u.name, email: u.email, club: u.club })))
  await disconnectDatabase()
}

run().catch(console.error)
