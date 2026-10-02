import mongoose from 'mongoose'
import Club from '../models/Club.js'
import Event from '../models/Event.js'
import Notice from '../models/Notice.js'
import Membership from '../models/Membership.js'

const escapeRegex = (str) => String(str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * ----------------------------------------------------------------------
 * CLUB DATA ACCESS SERVICES
 * ----------------------------------------------------------------------
 */

/**
 * Returns the live count of active clubs
 */
export async function getClubCount() {
  const count = await Club.countDocuments({ status: { $ne: 'suspended' } })
  return { totalClubs: count }
}

/**
 * Retrieves all registered clubs with key details
 */
export async function getAllClubs(limit = 50) {
  const clubs = await Club.find({ status: { $ne: 'suspended' } })
    .select('name initials slug category description established createdAt createdBy')
    .populate('createdBy', 'name email')
    .sort({ name: 1 })
    .limit(Number(limit) || 50)
    .lean()

  return clubs.map((c) => ({
    name: c.name,
    initials: c.initials,
    slug: c.slug,
    category: c.category,
    established: c.established,
    description: c.description,
    leader: c.createdBy?.name || 'Not specified',
    leaderEmail: c.createdBy?.email || null,
    createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : null,
  }))
}

/**
 * Retrieves a specific club by ID
 */
export async function getClubById(id) {
  if (!mongoose.isValidObjectId(id)) return null
  const club = await Club.findOne({ _id: id, status: { $ne: 'suspended' } })
    .populate('createdBy', 'name email')
    .lean()

  if (!club) return null
  const memberCount = await Membership.countDocuments({ club: club._id, status: 'approved' })

  return {
    name: club.name,
    initials: club.initials,
    slug: club.slug,
    category: club.category,
    established: club.established,
    description: club.description,
    mission: club.mission || null,
    leader: club.createdBy?.name || 'Not specified',
    memberCount,
  }
}

/**
 * Retrieves a specific club by name, slug, or initials
 */
export async function getClubByName(nameOrSlug) {
  if (!nameOrSlug || typeof nameOrSlug !== 'string') return null
  const query = nameOrSlug.trim()
  const regex = new RegExp(escapeRegex(query), 'i')

  const club = await Club.findOne({
    status: { $ne: 'suspended' },
    $or: [{ name: regex }, { slug: regex }, { initials: regex }],
  })
    .populate('createdBy', 'name email')
    .lean()

  if (!club) return null
  const memberCount = await Membership.countDocuments({ club: club._id, status: 'approved' })

  return {
    found: true,
    name: club.name,
    initials: club.initials,
    slug: club.slug,
    category: club.category,
    established: club.established,
    description: club.description,
    mission: club.mission || null,
    leader: club.createdBy?.name || 'Not specified',
    memberCount,
    createdAt: club.createdAt ? new Date(club.createdAt).toLocaleDateString() : null,
  }
}

/**
 * Searches clubs by keyword or category
 */
export async function searchClubs({ query = '', category = '', limit = 20 } = {}) {
  const filter = { status: { $ne: 'suspended' } }

  if (category) {
    filter.category = new RegExp(escapeRegex(category.trim()), 'i')
  }

  if (query) {
    const reg = new RegExp(escapeRegex(query.trim()), 'i')
    filter.$or = [{ name: reg }, { initials: reg }, { description: reg }, { category: reg }]
  }

  const clubs = await Club.find(filter)
    .select('name initials slug category description established')
    .populate('createdBy', 'name')
    .sort({ name: 1 })
    .limit(Number(limit) || 20)
    .lean()

  return {
    query,
    category,
    count: clubs.length,
    results: clubs.map((c) => ({
      name: c.name,
      initials: c.initials,
      slug: c.slug,
      category: c.category,
      established: c.established,
      description: c.description,
      leader: c.createdBy?.name || 'Not specified',
    })),
  }
}

/**
 * Returns distinct club categories existing in the database
 */
export async function getClubCategories() {
  const categories = await Club.distinct('category', { status: { $ne: 'suspended' } })
  return { categories }
}

/**
 * Returns recently created clubs
 */
export async function getRecentlyCreatedClubs(limit = 5) {
  const clubs = await Club.find({ status: { $ne: 'suspended' } })
    .select('name category established createdAt')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 5)
    .lean()

  return clubs.map((c) => ({
    name: c.name,
    category: c.category,
    createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : null,
    leader: c.createdBy?.name || 'Not specified',
  }))
}

/**
 * ----------------------------------------------------------------------
 * EVENT DATA ACCESS SERVICES
 * ----------------------------------------------------------------------
 */

/**
 * Returns total count of events and upcoming events
 */
export async function getEventCount() {
  const now = new Date(new Date().setHours(0, 0, 0, 0))
  const [total, upcoming] = await Promise.all([
    Event.countDocuments({ status: { $ne: 'cancelled' } }),
    Event.countDocuments({ status: { $ne: 'cancelled' }, date: { $gte: now } }),
  ])

  return { totalEvents: total, upcomingEvents: upcoming }
}

/**
 * Retrieves upcoming events
 */
export async function getUpcomingEvents(limit = 10) {
  const now = new Date(new Date().setHours(0, 0, 0, 0))
  const events = await Event.find({ status: { $ne: 'cancelled' }, date: { $gte: now } })
    .populate('club', 'name initials slug')
    .sort({ date: 1, startTime: 1 })
    .limit(Number(limit) || 10)
    .lean()

  // If no future events, return recent events so the user is informed
  if (events.length === 0) {
    const recent = await Event.find({ status: { $ne: 'cancelled' } })
      .populate('club', 'name initials')
      .sort({ date: -1 })
      .limit(5)
      .lean()

    return {
      upcomingCount: 0,
      note: 'No future events currently scheduled; showing recent campus events.',
      events: recent.map((e) => ({
        title: e.title,
        date: e.date ? new Date(e.date).toLocaleDateString() : 'TBA',
        time: `${e.startTime || ''} - ${e.endTime || ''}`.trim(),
        location: e.location,
        organizer: e.organizer || e.club?.name || 'Campus',
        category: e.category,
        capacity: e.capacity,
        registrations: e.registrationCount || 0,
      })),
    }
  }

  return {
    upcomingCount: events.length,
    events: events.map((e) => ({
      title: e.title,
      date: e.date ? new Date(e.date).toLocaleDateString() : 'TBA',
      time: `${e.startTime || ''} - ${e.endTime || ''}`.trim(),
      location: e.location,
      organizer: e.organizer || e.club?.name || 'Campus',
      category: e.category,
      capacity: e.capacity,
      registrations: e.registrationCount || 0,
    })),
  }
}

/**
 * Retrieves details for a specific event
 */
export async function getEventDetails(titleOrSlug) {
  if (!titleOrSlug) return null
  const query = titleOrSlug.trim()
  const regex = new RegExp(escapeRegex(query), 'i')

  const event = await Event.findOne({
    status: { $ne: 'cancelled' },
    $or: [{ title: regex }, { slug: regex }],
  })
    .populate('club', 'name initials')
    .lean()

  if (!event) return null

  return {
    found: true,
    title: event.title,
    organizer: event.organizer || event.club?.name || 'Campus',
    category: event.category,
    date: event.date ? new Date(event.date).toLocaleDateString() : 'TBA',
    time: `${event.startTime || ''} - ${event.endTime || ''}`.trim(),
    location: event.location,
    description: event.description,
    capacity: event.capacity,
    registrations: event.registrationCount || 0,
  }
}

/**
 * ----------------------------------------------------------------------
 * NOTICE DATA ACCESS SERVICES
 * ----------------------------------------------------------------------
 */

/**
 * Returns total published notice count
 */
export async function getNoticeCount() {
  const count = await Notice.countDocuments({ status: 'published' })
  return { totalNotices: count }
}

/**
 * Retrieves latest notices
 */
export async function getLatestNotices(limit = 5, category = null) {
  const filter = { status: 'published' }
  if (category) {
    filter.category = new RegExp(escapeRegex(category.trim()), 'i')
  }

  const notices = await Notice.find(filter)
    .populate('author', 'name role')
    .populate('club', 'name')
    .sort({ important: -1, publishedAt: -1, createdAt: -1 })
    .limit(Number(limit) || 5)
    .lean()

  return notices.map((n) => ({
    title: n.title,
    category: n.category,
    important: Boolean(n.important),
    publishedDate: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : 'Recent',
    author: n.author?.name || 'Administration',
    club: n.club?.name || null,
    summary: n.description?.slice(0, 200) || '',
  }))
}

/**
 * Retrieves specific notice details
 */
export async function getNoticeDetails(title) {
  if (!title) return null
  const regex = new RegExp(escapeRegex(title.trim()), 'i')

  const notice = await Notice.findOne({
    status: 'published',
    $or: [{ title: regex }],
  })
    .populate('author', 'name role')
    .populate('club', 'name')
    .lean()

  if (!notice) return null

  return {
    found: true,
    title: notice.title,
    category: notice.category,
    important: Boolean(notice.important),
    publishedDate: notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString() : 'Recent',
    author: notice.author?.name || 'Administration',
    club: notice.club?.name || null,
    description: notice.description,
  }
}

/**
 * Tool definitions for Gemini Function Calling
 */
export const campusToolsDeclarations = [
  {
    name: 'get_club_count',
    description: 'Get the exact live count of all registered clubs in CampusHub.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_clubs',
    description: 'List all available clubs registered in CampusHub with their categories and descriptions.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: { type: 'NUMBER', description: 'Maximum number of clubs to return (default 50)' },
      },
    },
  },
  {
    name: 'get_club_details',
    description: 'Get detailed information about a specific club by name, abbreviation, or slug (e.g. "Robotics Club", "Career Club").',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'The name or abbreviation of the club' },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_clubs',
    description: 'Search clubs by category (e.g. Technology, Career, Social, Cultural, Debate) or keyword.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING', description: 'Category to filter by' },
        query: { type: 'STRING', description: 'Search term or keyword' },
      },
    },
  },
  {
    name: 'get_club_categories',
    description: 'Get all distinct club categories currently active in CampusHub.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_event_count',
    description: 'Get the total number of events and upcoming events in CampusHub.',
    parameters: {
      type: 'OBJECT',
      properties: {},
    },
  },
  {
    name: 'get_upcoming_events',
    description: 'Get a list of upcoming campus events scheduled in CampusHub.',
    parameters: {
      type: 'OBJECT',
      properties: {
        limit: { type: 'NUMBER', description: 'Number of upcoming events to retrieve' },
      },
    },
  },
  {
    name: 'get_event_details',
    description: 'Get detailed information about a specific campus event by title or topic.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'The title of the event' },
      },
      required: ['title'],
    },
  },
  {
    name: 'get_latest_notices',
    description: 'Get the latest official notices and announcements published in CampusHub.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: { type: 'STRING', description: 'Notice category (Academic, General, Club, Important, Event)' },
        limit: { type: 'NUMBER', description: 'Number of notices to fetch' },
      },
    },
  },
  {
    name: 'get_notice_details',
    description: 'Get the full text and details of an official notice by title or keyword.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'The title of the notice' },
      },
      required: ['title'],
    },
  },
]

/**
 * Map of tool names to backend implementations
 */
export const campusToolsHandlers = {
  get_club_count: async () => await getClubCount(),
  get_clubs: async (args) => {
    const clubs = await getAllClubs(args?.limit)
    return { clubs, count: clubs.length }
  },
  get_club_details: async (args) => {
    const club = await getClubByName(args?.name)
    return club || { found: false, message: `Club "${args?.name}" was not found in the CampusHub database.` }
  },
  search_clubs: async (args) => await searchClubs(args),
  get_club_categories: async () => await getClubCategories(),
  get_event_count: async () => await getEventCount(),
  get_upcoming_events: async (args) => await getUpcomingEvents(args?.limit),
  get_event_details: async (args) => {
    const event = await getEventDetails(args?.title)
    return event || { found: false, message: `Event "${args?.title}" was not found in the CampusHub database.` }
  },
  get_latest_notices: async (args) => {
    const notices = await getLatestNotices(args?.limit, args?.category)
    return { notices, count: notices.length }
  },
  get_notice_details: async (args) => {
    const notice = await getNoticeDetails(args?.title)
    return notice || { found: false, message: `Notice "${args?.title}" was not found in the CampusHub database.` }
  },
}

/**
 * Automatically inspects the user message and dynamically queries the real MongoDB
 * database for clubs, events, and notices data. Returns formatted live database facts.
 */
export async function resolveCampusData(message) {
  if (!message || typeof message !== 'string') return null
  const text = message.trim().toLowerCase()
  const liveFacts = []

  // 1. CLUBS DOMAIN
  if (text.includes('club') || text.includes('organization') || text.includes('society')) {
    // Specific club check (e.g., "tell me about Robotics Club", "who leads CUET Carrer Club")
    const specificClubMatch = message.match(/(?:tell me about|info on|details of|who leads|who is the (?:leader|president|head) of|about the|about)\s+([^?.!,]+?)(?:\s+club|\s+organization)?(?:[?.!,]|$)/i)
    
    const isRobotics = /robotics/i.test(message)
    const isClubCount = /(how many|number of|count of|total).*club/i.test(text)
    const isClubList = /(list|all|what|which|show|available).*club/i.test(text) || text.includes('clubs are there')
    const isClubCategories = /(category|categories|types) of club/i.test(text)
    const isRecentClubs = /(recent|recently|newest|latest).*club/i.test(text)

    // Handle specific club inquiry
    if (isRobotics || specificClubMatch) {
      let clubCandidate = isRobotics ? 'Robotics Club' : specificClubMatch[1].trim()
      clubCandidate = clubCandidate.replace(/^(the|a|an)\s+/i, '').trim()
      const blockedWords = ['many', 'all', 'what', 'which', 'any', 'these', 'every', 'other', 'some', 'our']
      if (clubCandidate.length > 2 && !blockedWords.includes(clubCandidate.toLowerCase())) {
        const clubDetails = await getClubByName(clubCandidate)
        if (clubDetails) {
          liveFacts.push(`[LIVE DATABASE - SPECIFIC CLUB "${clubDetails.name}"]:
- Name: ${clubDetails.name} (${clubDetails.initials || 'N/A'})
- Category: ${clubDetails.category || 'General'}
- Established: ${clubDetails.established || 'N/A'}
- Leader: ${clubDetails.leader}
- Active Members: ${clubDetails.memberCount}
- Description: ${clubDetails.description}
${clubDetails.mission ? `- Mission: ${clubDetails.mission}` : ''}`)
        } else {
          liveFacts.push(`[LIVE DATABASE - CLUB SEARCH RESULT]:
- Queried Club: "${clubCandidate}"
- Status: NOT FOUND in CampusHub database. There is currently NO club named "${clubCandidate}" registered in CampusHub.`)
        }
      }
    }

    // Handle club count
    if (isClubCount || text === 'how many clubs are there?' || text === 'how many clubs?') {
      const countRes = await getClubCount()
      liveFacts.push(`[LIVE DATABASE - CLUB COUNT]: Exactly ${countRes.totalClubs} registered active clubs exist in CampusHub.`)
    }

    // Handle club list or available clubs
    if (isClubList && !isClubCount) {
      const clubs = await getAllClubs(20)
      const countRes = await getClubCount()
      const clubSummaries = clubs.map((c, i) => `${i + 1}. **${c.name}** (${c.category || 'General'}) - Led by: ${c.leader}. Description: ${c.description}`).join('\n')
      liveFacts.push(`[LIVE DATABASE - CLUBS LIST]:
- Total registered clubs: ${countRes.totalClubs}
- Clubs:
${clubSummaries}`)
    }

    // Handle club categories
    if (isClubCategories) {
      const { categories } = await getClubCategories()
      liveFacts.push(`[LIVE DATABASE - CLUB CATEGORIES]:
Active club categories in CampusHub: ${categories.length > 0 ? categories.join(', ') : 'None'}`)
    }

    // Handle recent clubs
    if (isRecentClubs) {
      const recent = await getRecentlyCreatedClubs(5)
      liveFacts.push(`[LIVE DATABASE - RECENT CLUBS]:
${recent.map((c) => `- ${c.name} (${c.category}) created on ${c.createdAt}`).join('\n')}`)
    }
  }

  // 2. EVENTS DOMAIN
  if (text.includes('event') || text.includes('workshop') || text.includes('fest') || text.includes('competition') || text.includes('hackathon')) {
    const isEventCount = /(how many|number of|count of|total).*event/i.test(text)
    const isUpcomingEvents = /(upcoming|next|future|what|list|show|any|available).*event/i.test(text)

    if (isEventCount) {
      const count = await getEventCount()
      liveFacts.push(`[LIVE DATABASE - EVENT COUNT]:
- Total events in database: ${count.totalEvents}
- Upcoming scheduled events: ${count.upcomingEvents}`)
    }

    if (isUpcomingEvents && !isEventCount) {
      const upcoming = await getUpcomingEvents(10)
      if (upcoming.events && upcoming.events.length > 0) {
        const eventsList = upcoming.events.map((e, i) => `${i + 1}. **${e.title}** (${e.category}) - Date: ${e.date}, Time: ${e.time}, Location: ${e.location}, Organizer: ${e.organizer}`).join('\n')
        liveFacts.push(`[LIVE DATABASE - UPCOMING / CAMPUS EVENTS]:
${upcoming.note ? `Note: ${upcoming.note}\n` : ''}${eventsList}`)
      } else {
        liveFacts.push(`[LIVE DATABASE - UPCOMING EVENTS]: There are currently no upcoming events scheduled.`)
      }
    }
  }

  // 3. NOTICES DOMAIN
  if (text.includes('notice') || text.includes('announcement') || text.includes('bulletin') || text.includes('circular')) {
    const isNoticeCount = /(how many|number of|count of|total).*notice/i.test(text)
    if (isNoticeCount) {
      const count = await getNoticeCount()
      liveFacts.push(`[LIVE DATABASE - NOTICE COUNT]: Total published official notices: ${count.totalNotices}`)
    } else {
      const notices = await getLatestNotices(5)
      if (notices.length > 0) {
        const noticeList = notices.map((n, i) => `${i + 1}. **${n.title}** [${n.category}] - Published: ${n.publishedDate} by ${n.author}${n.important ? ' (IMPORTANT)' : ''}: ${n.summary}`).join('\n')
        liveFacts.push(`[LIVE DATABASE - LATEST OFFICIAL NOTICES]:
${noticeList}`)
      } else {
        liveFacts.push(`[LIVE DATABASE - NOTICES]: No published notices currently found.`)
      }
    }
  }

  return liveFacts.length > 0 ? liveFacts.join('\n\n') : null
}
