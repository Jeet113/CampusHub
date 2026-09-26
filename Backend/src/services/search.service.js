import Club from '../models/Club.js'
import Event from '../models/Event.js'
import Notice from '../models/Notice.js'

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export async function globalSearch(term) {
  const query = new RegExp(escapeRegex(term), 'i')
  const now = new Date()
  const [events, clubs, notices] = await Promise.all([
    Event.find({ status: { $in: ['published', 'ended'] }, $or: [{ title: query }, { organizer: query }, { description: query }] })
      .select('title slug organizer category date location banner')
      .limit(10),
    Club.find({ status: 'approved', $or: [{ name: query }, { category: query }, { description: query }] })
      .select('name slug initials category description logo accent')
      .limit(10),
    Notice.find({
      status: 'published',
      $and: [
        { $or: [{ title: query }, { description: query }, { category: query }] },
        { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] },
      ],
    })
      .select('title description category important publishedAt')
      .limit(10),
  ])
  return { events, clubs, notices }
}
