import Club from '../models/Club.js'
import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import { getEnv } from '../config/env.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

let genAIClient = null
let currentApiKey = null

function getGenAI() {
  const env = getEnv()
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

  if (!apiKey) {
    return null
  }

  if (!genAIClient || currentApiKey !== apiKey) {
    genAIClient = new GoogleGenerativeAI(apiKey)
    currentApiKey = apiKey
  }

  return { genAI: genAIClient, env }
}

/**
 * Domain-specific keywords for semantic matching
 */
const DOMAIN_KEYWORDS = {
  'programming & technology': [
    'programming', 'coding', 'software', 'technology', 'computer', 'developer',
    'web', 'algorithm', 'data', 'ai', 'tech', 'it', 'hackathon', 'contest',
  ],
  'robotics': [
    'robotics', 'robot', 'hardware', 'circuit', 'embedded', 'iot', 'automation',
    'microcontroller', 'arduino', 'sensors', 'mechatronics', 'electronics',
  ],
  'business': [
    'business', 'finance', 'consulting', 'management', 'market', 'commerce',
    'strategy', 'operations', 'corporate',
  ],
  'entrepreneurship': [
    'entrepreneurship', 'startup', 'innovation', 'venture', 'founder', 'pitch',
    'business model', 'incubation', 'investor',
  ],
  'career development': [
    'career', 'professional', 'interview', 'resume', 'cv', 'internship',
    'job', 'networking', 'industry', 'mentorship', 'corporate',
  ],
  'debate & public speaking': [
    'debate', 'debating', 'public speaking', 'speech', 'argumentation', 'mun',
    'rhetoric', 'oratory', 'discourse', 'parliamentary',
  ],
  'photography': [
    'photography', 'photo', 'camera', 'videography', 'media', 'cinematography',
    'visual', 'lens', 'exhibition',
  ],
  'cultural activities': [
    'cultural', 'music', 'theatre', 'drama', 'dance', 'arts', 'fest',
    'creative', 'performance', 'singing', 'band', 'stage',
  ],
  'sports': [
    'sports', 'football', 'cricket', 'basketball', 'badminton', 'athletics',
    'fitness', 'tournament', 'championship', 'games',
  ],
  'volunteering': [
    'volunteering', 'volunteer', 'community', 'service', 'charity', 'help',
    'outreach', 'humanitarian', 'blood donation', 'relief',
  ],
  'social work': [
    'social work', 'social', 'peace', 'environment', 'green', 'sustainability',
    'welfare', 'community', 'conservation',
  ],
  'research': [
    'research', 'paper', 'publication', 'science', 'academic', 'study',
    'investigation', 'lab', 'thesis', 'innovation',
  ],
  'design & creativity': [
    'design', 'ui', 'ux', 'graphic', 'visual', 'art', 'creative', 'illustration',
    'branding', 'typography', 'multimedia',
  ],
  'leadership': [
    'leadership', 'leader', 'management', 'teamwork', 'executive', 'initiative',
    'organizing', 'coordination', 'governance',
  ],
}

/**
 * Goal to activity/benefit mapping
 */
const GOAL_ASSOCIATIONS = {
  'learn new skills': ['workshops', 'training', 'bootcamps', 'seminars', 'hands-on projects', 'learning'],
  'career development': ['internships', 'corporate networking', 'mock interviews', 'cv clinics', 'career seminars'],
  'improve communication': ['debate', 'presentations', 'public speaking', 'networking', 'discussions'],
  'develop leadership': ['event organizing', 'team management', 'executive roles', 'coordination'],
  'meet new people': ['social events', 'team projects', 'networking', 'club gatherings', 'campus fests'],
  'participate in competitions': ['contests', 'hackathons', 'tournaments', 'challenges', 'championships'],
  'work on projects': ['technical projects', 'hardware building', 'software development', 'collaborations'],
  'socialize': ['gatherings', 'cultural nights', 'recreational activities', 'festivals'],
  'volunteer': ['community service', 'cleanups', 'awareness campaigns', 'charity drives'],
}

/**
 * Clean and normalize a string
 */
function cleanText(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Inferred fallback profile if a club document has empty metadata
 */
function inferClubMetadata(club) {
  const text = cleanText(`${club.name} ${club.category} ${club.description} ${club.mission}`)
  const inferred = {
    interests: [...(club.interests || [])],
    activities: [...(club.activities || [])],
    skills: [...(club.skills || [])],
    goals: [...(club.goals || [])],
    experienceLevel: club.experienceLevel?.length ? club.experienceLevel : ['Beginner', 'Intermediate', 'Experienced'],
    timeCommitment: club.timeCommitment || '3–5 hours/week',
    tags: [...(club.tags || [])],
  }

  // If interests are empty, infer from category and text
  if (inferred.interests.length === 0) {
    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      if (keywords.some((kw) => text.includes(kw))) {
        inferred.interests.push(domain.charAt(0).toUpperCase() + domain.slice(1))
      }
    }
  }

  // If activities are empty, infer common activities
  if (inferred.activities.length === 0) {
    if (text.includes('tech') || text.includes('comput') || text.includes('code') || text.includes('program')) {
      inferred.activities = ['Workshops', 'Coding Competitions', 'Projects', 'Hackathons']
      inferred.skills = inferred.skills.length ? inferred.skills : ['Programming', 'Problem Solving', 'Software Engineering']
      inferred.goals = inferred.goals.length ? inferred.goals : ['Learn new skills', 'Work on projects', 'Career development', 'Participate in competitions']
    } else if (text.includes('career') || text.includes('job') || text.includes('profess')) {
      inferred.activities = ['Career Seminars', 'Networking Sessions', 'Mentorship', 'Workshops']
      inferred.skills = inferred.skills.length ? inferred.skills : ['Resume Building', 'Interviewing', 'Communication', 'Leadership']
      inferred.goals = inferred.goals.length ? inferred.goals : ['Career development', 'Improve communication', 'Develop leadership', 'Meet new people']
      inferred.timeCommitment = '1–2 hours/week'
    } else if (text.includes('social') || text.includes('peace') || text.includes('volunteer') || text.includes('green')) {
      inferred.activities = ['Community Cleanups', 'Awareness Campaigns', 'Volunteering Drives']
      inferred.skills = inferred.skills.length ? inferred.skills : ['Community Outreach', 'Event Organizing', 'Teamwork', 'Social Impact']
      inferred.goals = inferred.goals.length ? inferred.goals : ['Volunteer', 'Socialize', 'Meet new people', 'Develop leadership']
      inferred.timeCommitment = '1–2 hours/week'
    } else if (text.includes('robot')) {
      inferred.activities = ['Robotics Bootcamps', 'Hardware Projects', 'Competitions']
      inferred.skills = inferred.skills.length ? inferred.skills : ['Circuit Design', 'Microcontrollers', 'Embedded Systems']
      inferred.goals = inferred.goals.length ? inferred.goals : ['Learn new skills', 'Work on projects', 'Participate in competitions']
    } else if (text.includes('debate')) {
      inferred.activities = ['Parliamentary Debates', 'Speech Sessions', 'Tournaments']
      inferred.skills = inferred.skills.length ? inferred.skills : ['Public Speaking', 'Critical Thinking', 'Debating']
      inferred.goals = inferred.goals.length ? inferred.goals : ['Improve communication', 'Participate in competitions', 'Develop leadership']
    } else if (text.includes('cultur') || text.includes('music') || text.includes('art')) {
      inferred.activities = ['Cultural Nights', 'Music Shows', 'Rehearsals', 'Festivals']
      inferred.skills = inferred.skills.length ? inferred.skills : ['Stage Performance', 'Creative Arts', 'Event Planning']
      inferred.goals = inferred.goals.length ? inferred.goals : ['Socialize', 'Meet new people', 'Learn new skills']
    } else {
      inferred.activities = ['Workshops', 'Seminars', 'Networking']
      inferred.skills = inferred.skills.length ? inferred.skills : ['Teamwork', 'Communication', 'Organization']
      inferred.goals = inferred.goals.length ? inferred.goals : ['Learn new skills', 'Meet new people', 'Career development']
    }
  }

  return inferred
}

/**
 * Calculates a club match score dynamically
 *
 * Scoring breakdown (Total = 100%):
 * - Interest Match       = 35%
 * - Goal Match           = 25%
 * - Skill Match          = 15%
 * - Activity Match       = 10%
 * - Experience Match     = 10%
 * - Time Compatibility   = 5%
 */
export function calculateMatchScore({ club, userProfile, preferences }) {
  const clubMeta = inferClubMetadata(club)
  const clubText = cleanText(`${club.name} ${club.category} ${club.description} ${club.mission} ${(club.tags || []).join(' ')}`)
  const matchingFactors = []

  // 1. INTEREST MATCH (35%)
  const userInterests = Array.isArray(preferences.interests) ? preferences.interests : []
  let interestPoints = 0

  if (userInterests.length > 0) {
    let matchedCount = 0

    for (const interest of userInterests) {
      const normInterest = cleanText(interest)
      const domainKeywords = DOMAIN_KEYWORDS[normInterest] || [normInterest]

      // Check against explicit club interests
      const hasExplicitInterest = clubMeta.interests.some((ci) => {
        const normCi = cleanText(ci)
        return normCi.includes(normInterest) || normInterest.includes(normCi)
      })

      // Check category and name
      const hasCategoryMatch = cleanText(club.category).includes(normInterest) || normInterest.includes(cleanText(club.category))
      const hasNameMatch = cleanText(club.name).includes(normInterest)

      // Check keyword presence in description/tags
      const keywordHit = domainKeywords.some((kw) => clubText.includes(kw))

      if (hasExplicitInterest || hasCategoryMatch || hasNameMatch) {
        matchedCount += 1.0
        matchingFactors.push(interest)
      } else if (keywordHit) {
        matchedCount += 0.8
        matchingFactors.push(interest)
      }
    }

    const interestRatio = Math.min(1.0, matchedCount / Math.max(1, Math.min(userInterests.length, 3)))
    interestPoints = interestRatio * 32

    // Academic department synergy bonus (up to 3 points within interest weight)
    const userDept = cleanText(userProfile?.department || '')
    if (userDept) {
      if ((userDept.includes('computer') || userDept.includes('cse') || userDept.includes('software')) &&
          (clubText.includes('technology') || clubText.includes('computer') || clubText.includes('software'))) {
        interestPoints += 3
      } else if ((userDept.includes('electrical') || userDept.includes('eee') || userDept.includes('mechanical')) &&
                 (clubText.includes('robotics') || clubText.includes('hardware'))) {
        interestPoints += 3
      } else if (userDept.includes('civil') && (clubText.includes('environment') || clubText.includes('peace') || clubText.includes('social'))) {
        interestPoints += 2
      }
    }

    interestPoints = Math.min(35, interestPoints)
  }

  // 2. GOAL MATCH (25%)
  const userGoal = cleanText(preferences.goal || '')
  let goalPoints = 0

  if (userGoal) {
    const goalKeywords = GOAL_ASSOCIATIONS[userGoal] || [userGoal]
    const hasExplicitGoal = clubMeta.goals.some((cg) => {
      const normCg = cleanText(cg)
      return normCg.includes(userGoal) || userGoal.includes(normCg)
    })

    if (hasExplicitGoal) {
      goalPoints = 25
      matchingFactors.push(preferences.goal)
    } else {
      const goalHitCount = goalKeywords.filter((kw) => clubText.includes(kw) || clubMeta.activities.some((a) => cleanText(a).includes(kw))).length
      if (goalHitCount >= 2) {
        goalPoints = 22
        matchingFactors.push(preferences.goal)
      } else if (goalHitCount === 1) {
        goalPoints = 17
        matchingFactors.push(preferences.goal)
      } else {
        goalPoints = 5 // Baseline fallback
      }
    }
  }

  // 3. SKILL MATCH (15%)
  let skillPoints = 0
  const clubSkills = clubMeta.skills || []
  let skillHits = 0

  for (const skill of clubSkills) {
    const normSkill = cleanText(skill)
    // Check if skill aligns with user's selected interests or profile skills
    const interestHit = userInterests.some((int) => {
      const kwList = DOMAIN_KEYWORDS[cleanText(int)] || []
      return kwList.some((kw) => normSkill.includes(kw) || kw.includes(normSkill))
    })
    const userProfileSkillHit = (userProfile?.skills || []).some((ps) => cleanText(ps).includes(normSkill))

    if (interestHit || userProfileSkillHit) {
      skillHits += 1
    }
  }

  if (clubSkills.length > 0) {
    const skillRatio = Math.min(1.0, skillHits / Math.min(clubSkills.length, 3))
    skillPoints = Math.round(skillRatio * 15)
  } else {
    skillPoints = 8
  }

  // 4. ACTIVITY MATCH (10%)
  let activityPoints = 0
  const clubActivities = clubMeta.activities || []
  let activityHits = 0

  for (const act of clubActivities) {
    const normAct = cleanText(act)
    // Check if activity aligns with user goals or interests
    const matchesGoal = GOAL_ASSOCIATIONS[userGoal]?.some((kw) => normAct.includes(kw))
    const matchesInterest = userInterests.some((int) => {
      const kwList = DOMAIN_KEYWORDS[cleanText(int)] || []
      return kwList.some((kw) => normAct.includes(kw))
    })

    if (matchesGoal || matchesInterest) {
      activityHits += 1
    }
  }

  if (clubActivities.length > 0) {
    const actRatio = Math.min(1.0, activityHits / Math.min(clubActivities.length, 2))
    activityPoints = Math.round(actRatio * 10)
  } else {
    activityPoints = 5
  }

  // 5. EXPERIENCE LEVEL MATCH (10%)
  let experiencePoints = 0
  const userExp = (preferences.experienceLevel || 'Beginner').trim()
  const clubExpLevels = clubMeta.experienceLevel || ['Beginner', 'Intermediate', 'Experienced']

  if (clubExpLevels.includes(userExp)) {
    experiencePoints = 10
  } else if (clubExpLevels.includes('All Levels') || clubExpLevels.length >= 2) {
    experiencePoints = 9
  } else {
    experiencePoints = 6
  }

  // 6. TIME COMPATIBILITY (5%)
  let timePoints = 0
  const userTime = (preferences.availableTime || '3–5 hours/week').trim()
  const clubTime = clubMeta.timeCommitment || '3–5 hours/week'

  if (userTime === '10+ hours/week' || userTime === '5–10 hours/week' || userTime === '5-10 hours/week') {
    timePoints = 5
  } else if (userTime === '3–5 hours/week' || userTime === '3-5 hours/week') {
    timePoints = clubTime.includes('10+') ? 3.5 : 5
  } else {
    // 1–2 hours/week
    timePoints = (clubTime.includes('1–2') || clubTime.includes('1-2')) ? 5 : 3.5
  }

  // Total calculated score
  const rawTotal = interestPoints + goalPoints + skillPoints + activityPoints + experiencePoints + timePoints
  const matchScore = Math.min(98, Math.max(10, Math.round(rawTotal)))

  // Deduplicate matching factors
  const uniqueFactors = Array.from(new Set(matchingFactors)).slice(0, 4)

  return {
    matchScore,
    interestPoints: Math.round(interestPoints),
    goalPoints: Math.round(goalPoints),
    skillPoints: Math.round(skillPoints),
    activityPoints: Math.round(activityPoints),
    experiencePoints: Math.round(experiencePoints),
    timePoints: Math.round(timePoints),
    matchingFactors: uniqueFactors.length > 0 ? uniqueFactors : [club.category, preferences.goal || 'Skill Building'],
    clubMeta,
  }
}

/**
 * Generates explanations and benefits using Gemini AI with fallback
 */
async function generateGeminiExplanations({ user, preferences, matchingClubs }) {
  const genAiData = getGenAI()

  // High-quality deterministic fallback generator
  const createFallbackExplanation = (clubItem) => {
    const { club, matchScore, matchingFactors } = clubItem
    const clubMeta = clubItem.clubMeta || inferClubMetadata(club)
    const goal = preferences.goal || 'career & skill growth'
    const topInterest = preferences.interests?.[0] || club.category

    const personalizedReason =
      `Strong ${matchScore}% match for your interest in ${topInterest.toLowerCase()} and your goal of ${goal.toLowerCase()}. ${club.name} offers active ${clubMeta.activities.slice(0, 2).join(' and ').toLowerCase()} tailored for your experience level.`

    const potentialBenefits = [
      ...(clubMeta.skills.slice(0, 2).map((s) => `${s} mastery`)),
      'Hands-on project experience',
      'Campus networking & mentorship',
    ].slice(0, 3)

    return {
      clubId: String(club._id),
      personalizedReason,
      matchingFactors: matchingFactors.length ? matchingFactors : [topInterest, goal, club.category],
      potentialBenefits,
    }
  }

  if (!genAiData) {
    return matchingClubs.map(createFallbackExplanation)
  }

  const { genAI, env } = genAiData
  const primaryModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
  const candidateModels = Array.from(
    new Set([primaryModel, 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.1-flash-lite']),
  )

  // Non-sensitive user context
  const userContext = {
    name: user?.name ? user.name.split(' ')[0] : 'Student',
    department: user?.department || 'Not specified',
    batch: user?.batch || 'Not specified',
    interests: preferences.interests,
    goal: preferences.goal,
    experienceLevel: preferences.experienceLevel,
    availableTime: preferences.availableTime,
  }

  // Prepared verified clubs data ONLY
  const verifiedClubsPayload = matchingClubs.map((item) => ({
    clubId: String(item.club._id),
    name: item.club.name,
    category: item.club.category,
    description: item.club.description,
    mission: item.club.mission || '',
    activities: item.clubMeta.activities,
    skills: item.clubMeta.skills,
    goals: item.clubMeta.goals,
    matchScore: `${item.matchScore}%`,
  }))

  const prompt = `You are the CampusHub Club Recommender AI assistant.
A university student is looking for student clubs to join. We have already matched and calculated the compatibility score for the following verified clubs from our MongoDB database.

STUDENT PROFILE (NON-SENSITIVE):
- First Name: ${userContext.name}
- Academic Department: ${userContext.department}
- Batch: ${userContext.batch}
- Selected Interests: ${userContext.interests.join(', ')}
- Primary Goal: ${userContext.goal}
- Experience Level: ${userContext.experienceLevel}
- Available Time: ${userContext.availableTime}

VERIFIED MONGODB CLUBS (ONLY EXPLAIN THESE REAL CLUBS):
${JSON.stringify(verifiedClubsPayload, null, 2)}

STRICT GUARDRAILS:
1. You must ONLY reference the clubs provided above. DO NOT invent or mention clubs that are not in the list.
2. DO NOT invent club leaders, external events, false statistics, or false platform features.
3. For each club, write:
   - "personalizedReason": 1-2 concise, encouraging sentences explaining directly why this club fits the student's department, interests, and stated goal.
   - "matchingFactors": Array of 2 to 4 concise matching points (e.g., ["Programming", "Technical Projects", "Career Development"]).
   - "potentialBenefits": Array of 2 to 3 tangible benefits they will gain (e.g., ["Project experience", "Technical skills", "Networking"]).

RESPONSE FORMAT:
Return ONLY a valid JSON array of objects with the exact schema:
[
  {
    "clubId": "string (matching the exact clubId)",
    "personalizedReason": "string",
    "matchingFactors": ["string"],
    "potentialBenefits": ["string"]
  }
]
`

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      })

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      if (text) {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleaned)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (err) {
      console.warn(`Gemini model ${modelName} recommendation explanation warning:`, err?.message || err)
    }
  }

  // Graceful fallback if Gemini encountered error
  return matchingClubs.map(createFallbackExplanation)
}

/**
 * Main function: Generates club recommendations based on user profile and preferences
 */
export async function getClubRecommendations({ user, preferences }) {
  if (!user) {
    throw new ApiError(401, 'Authentication required')
  }

  // 1. Fetch user's current profile from MongoDB to ensure latest academic details
  const userProfile = await User.findById(user._id).lean()
  if (!userProfile) {
    throw new ApiError(404, 'User profile not found')
  }

  // 2. Fetch all active approved clubs from MongoDB (source of truth)
  // Clubs must not be suspended or rejected
  const activeClubs = await Club.find({
    status: { $in: ['approved', 'active'] },
  }).lean()

  if (!activeClubs || activeClubs.length === 0) {
    return {
      recommendations: [],
      message: 'No active campus clubs are currently available.',
      userPreferences: preferences,
    }
  }

  // 3. Score every club dynamically against user preferences and profile
  const scoredClubs = activeClubs.map((club) => {
    const scoreResult = calculateMatchScore({
      club,
      userProfile,
      preferences,
    })
    return {
      club,
      ...scoreResult,
    }
  })

  // 4. Filter by minimum suitability threshold:
  // A genuine match requires positive interest alignment (interestPoints > 0) and at least 50% score
  const MIN_MATCH_THRESHOLD = 50
  const suitableClubs = scoredClubs.filter(
    (item) => item.matchScore >= MIN_MATCH_THRESHOLD && item.interestPoints > 0,
  )

  if (suitableClubs.length === 0) {
    return {
      recommendations: [],
      message: "We couldn't find a strong match based on your current preferences. Try selecting more interests or goals.",
      userPreferences: preferences,
    }
  }

  // 5. Sort descending by match score and pick top 3 to 5
  suitableClubs.sort((a, b) => b.matchScore - a.matchScore)
  const topClubs = suitableClubs.slice(0, 5)

  // 6. Generate personalized explanation with Gemini (with rock-solid fallback)
  let explanations = []
  try {
    explanations = await generateGeminiExplanations({
      user: userProfile,
      preferences,
      matchingClubs: topClubs,
    })
  } catch (err) {
    console.warn('Gemini explanation error, using fallback:', err.message)
    explanations = []
  }

  const explanationsMap = new Map(
    explanations.map((exp) => [String(exp.clubId), exp]),
  )

  // 7. Format structured recommendations
  const recommendations = topClubs.map((item, index) => {
    const club = item.club
    const explanation = explanationsMap.get(String(club._id))

    return {
      _id: club._id,
      id: club._id,
      rank: index + 1,
      name: club.name,
      slug: club.slug,
      initials: club.initials,
      category: club.category,
      description: club.description,
      mission: club.mission || '',
      logo: club.logo,
      banner: club.banner,
      accent: club.accent || '#F59E0B',
      matchScore: item.matchScore,
      personalizedReason:
        explanation?.personalizedReason ||
        `Strong ${item.matchScore}% match for your interest in ${(preferences.interests || [club.category])[0]} and goal of ${preferences.goal || 'growth'}.`,
      matchingFactors:
        explanation?.matchingFactors?.length
          ? explanation.matchingFactors
          : item.matchingFactors,
      potentialBenefits:
        explanation?.potentialBenefits?.length
          ? explanation.potentialBenefits
          : [
              ...(item.clubMeta?.skills?.slice(0, 2) || ['Skill growth']),
              'Hands-on experience',
              'Networking & community',
            ].slice(0, 3),
    }
  })

  return {
    recommendations,
    totalMatches: recommendations.length,
    userPreferences: preferences,
  }
}
