import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import Club from '../src/models/Club.js'

const clubEnrichments = {
  'IEEE Computer Society': {
    interests: ['Programming & Technology', 'Robotics', 'Research', 'Career Development'],
    activities: ['Workshops', 'Coding Competitions', 'Technical Projects', 'Hackathons'],
    skills: ['Programming', 'Problem Solving', 'Software Engineering', 'Web Development'],
    goals: ['Learn new skills', 'Work on projects', 'Career development', 'Participate in competitions'],
    experienceLevel: ['Beginner', 'Intermediate', 'Experienced'],
    timeCommitment: '3–5 hours/week',
    tags: ['Programming', 'Technology', 'Coding', 'Software', 'AI', 'Algorithms'],
  },
  'CUET Carrer Club': {
    interests: ['Career Development', 'Leadership', 'Business', 'Entrepreneurship', 'Debate & Public Speaking'],
    activities: ['Career Seminars', 'Networking Sessions', 'Mentorship Programs', 'Workshops'],
    skills: ['Resume Building', 'Interview Preparation', 'Communication', 'Leadership', 'Public Speaking'],
    goals: ['Career development', 'Improve communication', 'Develop leadership', 'Meet new people'],
    experienceLevel: ['Beginner', 'Intermediate', 'Experienced'],
    timeCommitment: '1–2 hours/week',
    tags: ['Career', 'Jobs', 'Internships', 'Leadership', 'Networking', 'Professional Skills'],
  },
  'Green For Peace': {
    interests: ['Volunteering', 'Social Work', 'Cultural Activities', 'Leadership'],
    activities: ['Community Cleanups', 'Tree Plantation', 'Awareness Campaigns', 'Volunteering Drives'],
    skills: ['Community Outreach', 'Event Organizing', 'Teamwork', 'Social Impact'],
    goals: ['Volunteer', 'Socialize', 'Meet new people', 'Develop leadership'],
    experienceLevel: ['Beginner', 'Intermediate', 'Experienced'],
    timeCommitment: '1–2 hours/week',
    tags: ['Social Work', 'Environment', 'Volunteering', 'Community', 'Sustainability'],
  },
}

async function run() {
  await connectDatabase()
  console.log('Connected to MongoDB. Enriching club recommendation data...')

  const clubs = await Club.find({})
  for (const club of clubs) {
    const enrichment = clubEnrichments[club.name]
    if (enrichment) {
      club.interests = club.interests?.length ? club.interests : enrichment.interests
      club.activities = club.activities?.length ? club.activities : enrichment.activities
      club.skills = club.skills?.length ? club.skills : enrichment.skills
      club.goals = club.goals?.length ? club.goals : enrichment.goals
      club.experienceLevel = club.experienceLevel?.length ? club.experienceLevel : enrichment.experienceLevel
      club.timeCommitment = club.timeCommitment || enrichment.timeCommitment
      club.tags = club.tags?.length ? club.tags : enrichment.tags
      await club.save()
      console.log(`Updated club "${club.name}" with recommendation metadata.`)
    }
  }

  await disconnectDatabase()
  console.log('Done enriching clubs.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Enrichment failed:', err)
  process.exit(1)
})
