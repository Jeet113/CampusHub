import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { getEnv } from '../config/env.js'
import Club from '../models/Club.js'
import Event from '../models/Event.js'
import EventRegistration from '../models/EventRegistration.js'
import Membership from '../models/Membership.js'
import Notice from '../models/Notice.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'
import { makeSlug } from '../utils/slug.js'

const env = getEnv()

if (env.NODE_ENV === 'production') throw new Error('Database seeding is disabled in production')
if (!env.SEED_PASSWORD || env.SEED_PASSWORD.length < 8) {
  throw new Error('Set SEED_PASSWORD in the root .env to at least 8 characters before seeding')
}

const studentProfiles = [
  ['Jeet Saha', 'student@campushub.local', '2104012', 'Computer Science & Engineering', '2023-24'],
  ['Nafisa Rahman', 'nafisa@campushub.local', '2103024', 'Electrical & Electronic Engineering', '2023-24'],
  ['Arif Hasan', 'arif@campushub.local', '2005017', 'Civil Engineering', '2022-23'],
  ['Tasnim Chowdhury', 'tasnim@campushub.local', '2202018', 'Mechanical Engineering', '2024-25'],
  ['Rafi Ahmed', 'rafi@campushub.local', '2003032', 'Electrical & Electronic Engineering', '2022-23'],
  ['Mehnaz Karim', 'mehnaz@campushub.local', '2106011', 'Architecture', '2023-24'],
]

const clubProfiles = [
  ['IEEE CS CUET', 'club@campushub.local', 'ORG-012'],
  ['CUET Robotics', 'robotics@campushub.local', 'ORG-017'],
]

const clubSeeds = [
  ['IEEE Computer Society CUET', 'CS', 'Technology', 'A community for computing, research, and practical technology learning.', 2012, '#F59E0B'],
  ['CUET Robotics Society', 'RS', 'Robotics', 'Designing intelligent machines through collaboration, curiosity, and craft.', 2014, '#34D399'],
  ['CUET Career Club', 'CC', 'Career', 'Helping students build the skills and connections for meaningful careers.', 2011, '#A78BFA'],
  ['CUET Debating Society', 'DS', 'Debate', 'A forum for reasoned discourse, public speaking, and competitive debate.', 2005, '#FB7185'],
  ['CUET Programming Club', 'PC', 'Technology', 'Growing confident problem solvers through contests and peer learning.', 2009, '#60A5FA'],
  ['CUET Cultural Club', 'CU', 'Cultural', 'Celebrating music, theatre, dance, and the creative spirit of campus.', 2003, '#F472B6'],
]

const eventSeeds = [
  ['AI & Machine Learning Workshop', 'Technology', '2026-09-05', '14:00', '17:00', 'Academic Building, Room 501', 200],
  ['Campus Innovation Challenge', 'Competition', '2026-09-12', '10:00', '18:00', 'TSC Auditorium', 150],
  ['Inter Department Programming Contest', 'Competition', '2026-09-19', '09:00', '15:00', 'CSE Lab Complex', 180],
  ['Frames of Campus Exhibition', 'Cultural', '2026-09-26', '11:00', '17:00', 'Central Library Gallery', 300],
  ['Career Development Seminar', 'Career', '2026-10-03', '15:30', '18:00', 'Council Building', 250],
  ['Robotics Systems Bootcamp', 'Workshop', '2026-10-10', '13:00', '17:00', 'ME Workshop', 80],
  ['CUET Open Debate 2026', 'Competition', '2026-10-17', '09:30', '18:00', 'TSC Seminar Hall', 120],
  ['World Cinema Night', 'Cultural', '2026-10-24', '18:00', '21:00', 'TSC Auditorium', 220],
  ['Cyber Security Essentials', 'Seminar', '2026-10-31', '14:30', '17:00', 'IT Business Incubator', 160],
  ['Student Startup Circle', 'Career', '2026-11-07', '17:00', '19:00', 'Innovation Hub', 100],
]

const noticeSeeds = [
  ['Revised academic calendar for Term 2026-27', 'Academic', true],
  ['Campus network maintenance on Friday', 'General', false],
  ['Registration opens for Fall club recruitment', 'Club', false],
  ['Scholarship application deadline extended', 'Important', true],
  ['AI workshop venue updated', 'Event', false],
  ['Library hours during examination period', 'Academic', false],
  ['Student ID card collection schedule', 'General', false],
  ['Call for innovation challenge mentors', 'Event', false],
  ['Debate society novice sessions', 'Club', false],
  ['Emergency contact information update', 'Important', true],
]

async function seed() {
  await connectDatabase()
  await Promise.all([
    Notification.deleteMany({}),
    EventRegistration.deleteMany({}),
    Membership.deleteMany({}),
    Notice.deleteMany({}),
    Event.deleteMany({}),
    Club.deleteMany({}),
    User.deleteMany({}),
  ])

  const admin = await User.create({
    name: 'CampusHub Administrator',
    email: 'admin@campushub.com',
    password: 'admincampushub',
    role: 'admin',
    studentId: 'ADM-001',
    department: 'Student Affairs',
    profileImage: {
      url: '/admin-avatar.png',
    },
  })
  const clubUsers = []
  for (const [name, email, studentId] of clubProfiles) {
    clubUsers.push(
      await User.create({ name, email, studentId, password: env.SEED_PASSWORD, role: 'club', department: 'Registered Organization' }),
    )
  }
  const students = []
  for (const [name, email, studentId, department, batch] of studentProfiles) {
    students.push(await User.create({ name, email, studentId, department, batch, password: env.SEED_PASSWORD, role: 'student' }))
  }

  const clubs = []
  for (let index = 0; index < clubSeeds.length; index += 1) {
    const [name, initials, category, description, established, accent] = clubSeeds[index]
    clubs.push(
      await Club.create({
        name,
        slug: makeSlug(name),
        initials,
        category,
        description,
        mission: `Create accessible opportunities in ${category.toLowerCase()} for the whole campus community.`,
        established,
        accent,
        status: 'approved',
        createdBy: clubUsers[index] || admin,
        verifiedBy: admin,
        verifiedAt: new Date(),
      }),
    )
  }
  for (let index = 0; index < clubUsers.length; index += 1) {
    clubUsers[index].club = clubs[index]._id
    await clubUsers[index].save()
  }

  const events = []
  for (let index = 0; index < eventSeeds.length; index += 1) {
    const [title, category, date, startTime, endTime, location, capacity] = eventSeeds[index]
    const club = clubs[index % clubs.length]
    events.push(
      await Event.create({
        title,
        slug: makeSlug(title),
        organizer: club.name,
        club: club._id,
        description: `${title} is a development seed event for demonstrating the CampusHub event workflow.`,
        category,
        date: new Date(`${date}T00:00:00.000Z`),
        startTime,
        endTime,
        location,
        capacity,
        status: index < 8 ? 'published' : 'pending',
        createdBy: club.createdBy,
        ...(index < 8 ? { approvedBy: admin._id, approvedAt: new Date() } : {}),
      }),
    )
  }

  for (const [title, category, important] of noticeSeeds) {
    await Notice.create({
      title,
      description: `${title}. This development seed notice can be replaced with university-provided content.`,
      category,
      important,
      author: admin._id,
      status: 'published',
      publishedAt: new Date(),
    })
  }

  for (let index = 0; index < students.length; index += 1) {
    await Membership.create({
      club: clubs[index % clubs.length]._id,
      user: students[index]._id,
      status: 'approved',
      role: index === 0 ? 'president' : index === 1 ? 'executive' : 'member',
      requestedAt: new Date(),
      approvedAt: new Date(),
      joinedAt: new Date(),
    })
  }

  await EventRegistration.create({ event: events[0]._id, student: students[0]._id, status: 'registered' })
  await Event.updateOne({ _id: events[0]._id }, { $set: { registrationCount: 1 } })
  await Notification.create({
    recipient: students[0]._id,
    type: 'event_registration',
    title: 'Registration confirmed',
    message: `You are registered for ${events[0].title}`,
    link: `/student/events/${events[0].slug}`,
  })

  console.log('Development database seeded successfully.')
  console.log('Seed accounts: admin@campushub.com, club@campushub.local, student@campushub.local')
  console.log('All seed accounts use the SEED_PASSWORD value from the root .env.')
}

seed()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`)
    process.exitCode = 1
  })
  .finally(disconnectDatabase)
