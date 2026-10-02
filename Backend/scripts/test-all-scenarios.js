import { connectDatabase, disconnectDatabase } from '../src/config/database.js'
import { createApp } from '../src/app.js'
import { signAccessToken } from '../src/utils/jwt.js'
import User from '../src/models/User.js'
import Club from '../src/models/Club.js'
import request from 'supertest'
import { getClubRecommendations } from '../src/services/clubRecommender.service.js'

async function runTests() {
  console.log('========================================================')
  console.log('RUNNING COMPREHENSIVE CLUB RECOMMENDER AI TEST SUITE')
  console.log('========================================================\n')

  await connectDatabase()
  const app = createApp()

  const student = await User.findOne({ role: 'student' })
  if (!student) throw new Error('No student found for tests')
  const token = signAccessToken(student)

  console.log(`Test user: ${student.name} (${student.department || 'General'})\n`)

  // 1. User interested in Programming + Technology
  console.log('--------------------------------------------------------')
  console.log('TEST 1: User interested in Programming + Technology')
  console.log('--------------------------------------------------------')
  const res1 = await getClubRecommendations({
    user: student,
    preferences: {
      interests: ['Programming & Technology'],
      goal: 'Work on projects',
      experienceLevel: 'Intermediate',
      availableTime: '3–5 hours/week',
    },
  })
  console.log(`Matches: ${res1.recommendations.length}`)
  res1.recommendations.forEach((r) => {
    console.log(` -> [${r.matchScore}% Match] ${r.name}`)
    console.log(`    Reason: ${r.personalizedReason}`)
    console.log(`    Factors: ${r.matchingFactors.join(', ')}`)
    console.log(`    Benefits: ${r.potentialBenefits.join(', ')}`)
  })
  if (res1.recommendations.length === 0 || !res1.recommendations.some((c) => c.name.includes('IEEE') || c.category === 'Technology')) {
    throw new Error('Test 1 failed: Expected technology club match')
  }
  console.log('✓ TEST 1 PASSED\n')

  // 2. User interested in Sports
  console.log('--------------------------------------------------------')
  console.log('TEST 2: User interested in Sports (No sports club in DB)')
  console.log('--------------------------------------------------------')
  const res2 = await getClubRecommendations({
    user: student,
    preferences: {
      interests: ['Sports'],
      goal: 'Participate in competitions',
      experienceLevel: 'Beginner',
      availableTime: '1–2 hours/week',
    },
  })
  console.log(`Matches: ${res2.recommendations.length}`)
  console.log(`Message: "${res2.message}"`)
  if (res2.recommendations.length !== 0 || !res2.message) {
    throw new Error('Test 2 failed: Expected 0 matches and not-found message')
  }
  console.log('✓ TEST 2 PASSED\n')

  // 3. User interested in Photography + Creativity
  console.log('--------------------------------------------------------')
  console.log('TEST 3: User interested in Photography + Creativity (No photo club in DB)')
  console.log('--------------------------------------------------------')
  const res3 = await getClubRecommendations({
    user: student,
    preferences: {
      interests: ['Photography', 'Design & Creativity'],
      goal: 'Learn new skills',
      experienceLevel: 'Beginner',
      availableTime: '1–2 hours/week',
    },
  })
  console.log(`Matches: ${res3.recommendations.length}`)
  console.log(`Message: "${res3.message}"`)
  if (res3.recommendations.length !== 0) {
    throw new Error('Test 3 failed: Expected 0 matches')
  }
  console.log('✓ TEST 3 PASSED\n')

  // 4. User interested in Leadership + Communication
  console.log('--------------------------------------------------------')
  console.log('TEST 4: User interested in Leadership + Communication')
  console.log('--------------------------------------------------------')
  const res4 = await getClubRecommendations({
    user: student,
    preferences: {
      interests: ['Career Development', 'Leadership'],
      goal: 'Improve communication',
      experienceLevel: 'Beginner',
      availableTime: '1–2 hours/week',
    },
  })
  console.log(`Matches: ${res4.recommendations.length}`)
  res4.recommendations.forEach((r) => {
    console.log(` -> [${r.matchScore}% Match] ${r.name}`)
  })
  if (res4.recommendations.length === 0 || !res4.recommendations.some((c) => c.name.includes('Carrer') || c.category === 'Career')) {
    throw new Error('Test 4 failed: Expected Career club match')
  }
  console.log('✓ TEST 4 PASSED\n')

  // 5. Beginner with limited time
  console.log('--------------------------------------------------------')
  console.log('TEST 5: Beginner with limited time (Volunteering, 1-2h/wk)')
  console.log('--------------------------------------------------------')
  const res5 = await getClubRecommendations({
    user: student,
    preferences: {
      interests: ['Volunteering', 'Social Work'],
      goal: 'Volunteer',
      experienceLevel: 'Beginner',
      availableTime: '1–2 hours/week',
    },
  })
  console.log(`Matches: ${res5.recommendations.length}`)
  res5.recommendations.forEach((r) => {
    console.log(` -> [${r.matchScore}% Match] ${r.name}`)
    console.log(`    Reason: ${r.personalizedReason}`)
  })
  if (res5.recommendations.length === 0 || !res5.recommendations.some((c) => c.name.includes('Peace') || c.category === 'Social')) {
    throw new Error('Test 5 failed: Expected Green For Peace match')
  }
  console.log('✓ TEST 5 PASSED\n')

  // 6. User changes preferences
  console.log('--------------------------------------------------------')
  console.log('TEST 6: User changes preferences dynamically')
  console.log('--------------------------------------------------------')
  const prefTech = {
    interests: ['Programming & Technology'],
    goal: 'Work on projects',
    experienceLevel: 'Intermediate',
    availableTime: '3–5 hours/week',
  }
  const prefSocial = {
    interests: ['Volunteering'],
    goal: 'Volunteer',
    experienceLevel: 'Beginner',
    availableTime: '1–2 hours/week',
  }
  const runA = await getClubRecommendations({ user: student, preferences: prefTech })
  const runB = await getClubRecommendations({ user: student, preferences: prefSocial })
  console.log(`Preference A top match: ${runA.recommendations[0]?.name} (${runA.recommendations[0]?.matchScore}%)`)
  console.log(`Preference B top match: ${runB.recommendations[0]?.name} (${runB.recommendations[0]?.matchScore}%)`)
  if (runA.recommendations[0]?.name === runB.recommendations[0]?.name) {
    throw new Error('Test 6 failed: Recommendations should differ when preferences change')
  }
  console.log('✓ TEST 6 PASSED\n')

  // 7. New club added to MongoDB
  console.log('--------------------------------------------------------')
  console.log('TEST 7: New club added to MongoDB (CUET Photography Society)')
  console.log('--------------------------------------------------------')
  const tempPhotoClub = await Club.create({
    name: 'CUET Photography Society',
    slug: 'cuet-photography-society-test',
    initials: 'CPS',
    category: 'Photography',
    description: 'A platform for visual artists, photographers, and creatives.',
    mission: 'Capturing moments, inspiring perspectives, and nurturing visual storytellers.',
    interests: ['Photography', 'Design & Creativity'],
    activities: ['Photo Walks', 'Exhibitions', 'Editing Workshops'],
    skills: ['Photography', 'Photo Editing', 'Visual Composition'],
    goals: ['Learn new skills', 'Work on projects', 'Meet new people'],
    experienceLevel: ['Beginner', 'Intermediate', 'Experienced'],
    timeCommitment: '1–2 hours/week',
    tags: ['Photography', 'Creative', 'Arts', 'Media'],
    status: 'approved',
    createdBy: student._id,
  })
  console.log(`Created club: ${tempPhotoClub.name} in MongoDB`)

  const res7 = await getClubRecommendations({
    user: student,
    preferences: {
      interests: ['Photography', 'Design & Creativity'],
      goal: 'Learn new skills',
      experienceLevel: 'Beginner',
      availableTime: '1–2 hours/week',
    },
  })
  console.log(`Matches found after adding club: ${res7.recommendations.length}`)
  res7.recommendations.forEach((r) => console.log(` -> [${r.matchScore}% Match] ${r.name}`))
  if (!res7.recommendations.some((c) => c.name === 'CUET Photography Society')) {
    throw new Error('Test 7 failed: New club was not picked up by recommender')
  }
  console.log('✓ TEST 7 PASSED\n')

  // 8. Club becomes inactive
  console.log('--------------------------------------------------------')
  console.log('TEST 8: Club becomes inactive (status = suspended)')
  console.log('--------------------------------------------------------')
  tempPhotoClub.status = 'suspended'
  await tempPhotoClub.save()
  console.log(`Updated club ${tempPhotoClub.name} status to "suspended"`)

  const res8 = await getClubRecommendations({
    user: student,
    preferences: {
      interests: ['Photography', 'Design & Creativity'],
      goal: 'Learn new skills',
      experienceLevel: 'Beginner',
      availableTime: '1–2 hours/week',
    },
  })
  console.log(`Matches found after suspension: ${res8.recommendations.length}`)
  if (res8.recommendations.length !== 0) {
    throw new Error('Test 8 failed: Suspended club should not be recommended')
  }
  // Delete the temp club
  await Club.deleteOne({ _id: tempPhotoClub._id })
  console.log('Cleaned up temporary test club.')
  console.log('✓ TEST 8 PASSED\n')

  // 9. No suitable clubs
  console.log('--------------------------------------------------------')
  console.log('TEST 9: No suitable clubs (Empty result with friendly message)')
  console.log('--------------------------------------------------------')
  const res9 = await getClubRecommendations({
    user: student,
    preferences: {
      interests: ['Sports'],
      goal: 'Participate in competitions',
      experienceLevel: 'Experienced',
      availableTime: '10+ hours/week',
    },
  })
  console.log(`Result message: "${res9.message}"`)
  if (!res9.message?.includes("couldn't find a strong match")) {
    throw new Error('Test 9 failed: Missing standard not-found message')
  }
  console.log('✓ TEST 9 PASSED\n')

  // 10. Gemini API failure handling (Simulating fallback)
  console.log('--------------------------------------------------------')
  console.log('TEST 10: Gemini API failure / fallback handling')
  console.log('--------------------------------------------------------')
  // We can temporarily simulate Gemini failure by temporarily unsetting GEMINI_API_KEY
  const origKey = process.env.GEMINI_API_KEY
  process.env.GEMINI_API_KEY = ''
  try {
    const res10 = await getClubRecommendations({
      user: student,
      preferences: {
        interests: ['Programming & Technology'],
        goal: 'Work on projects',
        experienceLevel: 'Intermediate',
        availableTime: '3–5 hours/week',
      },
    })
    console.log(`Fallback recommendations: ${res10.recommendations.length}`)
    console.log(`First recommendation reason: "${res10.recommendations[0]?.personalizedReason}"`)
    if (res10.recommendations.length === 0 || !res10.recommendations[0]?.personalizedReason) {
      throw new Error('Test 10 failed: Fallback did not produce valid recommendation')
    }
    console.log('✓ TEST 10 PASSED (Graceful fallback succeeded)\n')
  } finally {
    process.env.GEMINI_API_KEY = origKey
  }

  // 11. Unauthorized API request
  console.log('--------------------------------------------------------')
  console.log('TEST 11: Unauthorized API request via Express endpoint')
  console.log('--------------------------------------------------------')
  const unauthRes = await request(app)
    .post('/api/ai/club-recommendations')
    .send({
      interests: ['Programming & Technology'],
      goal: 'Work on projects',
      experienceLevel: 'Intermediate',
      availableTime: '3–5 hours/week',
    })
  console.log(`Response status: ${unauthRes.status}`)
  if (unauthRes.status !== 401) {
    throw new Error(`Test 11 failed: Expected 401, got ${unauthRes.status}`)
  }
  console.log('✓ TEST 11 PASSED\n')

  // Authenticated Express HTTP call verification
  console.log('--------------------------------------------------------')
  console.log('AUTHENTICATED HTTP ENDPOINT VERIFICATION')
  console.log('--------------------------------------------------------')
  const authRes = await request(app)
    .post('/api/ai/club-recommendations')
    .set('Authorization', `Bearer ${token}`)
    .send({
      interests: ['Programming & Technology'],
      goal: 'Work on projects',
      experienceLevel: 'Intermediate',
      availableTime: '3–5 hours/week',
    })
  console.log(`Status: ${authRes.status}, Success: ${authRes.body.success}`)
  console.log(`Recommended club: ${authRes.body.data.recommendations[0]?.name} (${authRes.body.data.recommendations[0]?.matchScore}%)`)
  if (authRes.status !== 200 || !authRes.body.data.recommendations.length) {
    throw new Error('Authenticated endpoint call failed')
  }
  console.log('✓ AUTHENTICATED ENDPOINT VERIFIED\n')

  await disconnectDatabase()
  console.log('========================================================')
  console.log('ALL 11 TEST SCENARIOS PASSED SUCCESSFULLY!')
  console.log('========================================================\n')
  process.exit(0)
}

runTests().catch((err) => {
  console.error('Test suite failed:', err)
  process.exit(1)
})
