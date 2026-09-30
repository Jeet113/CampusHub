import { GoogleGenerativeAI } from '@google/generative-ai'
import { getEnv } from '../config/env.js'
import ApiError from '../utils/ApiError.js'
import {
  resolveCampusData,
  campusToolsDeclarations,
  campusToolsHandlers,
} from './campusData.service.js'

let genAIClient = null
let currentApiKey = null

function getGenAI() {
  const env = getEnv()
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new ApiError(503, 'AI Assistant service is currently not configured.')
  }

  if (!genAIClient || currentApiKey !== apiKey) {
    genAIClient = new GoogleGenerativeAI(apiKey)
    currentApiKey = apiKey
  }

  return { genAI: genAIClient, env }
}

/**
 * Builds non-sensitive user profile context
 */
function buildUserProfileContext(user) {
  if (!user) return ''

  const details = []
  if (user.name) details.push(`Name: ${user.name}`)
  if (user.role) details.push(`Role: ${user.role}`)
  if (user.department) details.push(`Department: ${user.department}`)
  if (user.batch) details.push(`Batch / Year: ${user.batch}`)
  if (user.studentId) details.push(`Student ID: ${user.studentId}`)
  if (user.bio) details.push(`Bio: ${user.bio}`)

  return details.length > 0 ? details.join('\n') : ''
}

/**
 * Builds the complete CampusHub system instruction including live database facts
 */
function buildSystemInstruction(user, liveDataContext) {
  const userProfile = buildUserProfileContext(user)

  return `You are "CampusHub AI", the official intelligent campus assistant for CampusHub.
CampusHub is a modern, unified university campus web platform designed for students, faculty, club managers, and administrators.

About CampusHub:
1. Platform Sections & Features:
   - Overview / Dashboard: Campus activity stats, quick navigation, upcoming featured highlights.
   - Events: Browse upcoming university events, hackathons, workshops, cultural fests; register for events; track attendance and capacity; bookmark/save events.
   - Clubs & Organizations: Explore campus student clubs, join clubs as a member, discover club leadership, view club announcements and activities. Club executives can manage their club profiles, banners, logos, and post events.
   - Notices: Official administrative bulletins and announcements, categorized by priority and department.
   - User Profile: Manage personal profile information, update academic details (Department, Batch, Student ID), upload profile avatar (stored securely via Cloudinary), update passwords, and adjust notification preferences.
   - Settings & Notifications: Real-time campus updates, event reminders, email preference toggles.
2. Authenticated User Profile (Non-Sensitive):
${userProfile || 'No specific profile information provided.'}

${
  liveDataContext
    ? `3. REAL-TIME CAMPUSHUB DATABASE SNAPSHOT (VERIFIED LIVE DATA):
The following data was just queried live from the CampusHub MongoDB database specifically for this request:
${liveDataContext}

CRITICAL RULES FOR LIVE DATABASE DATA:
- You have real-time access to the live CampusHub database. Use the live data above directly to answer the user's question with 100% accuracy.
- NEVER say "I don't have direct access to the live database", "I cannot access real-time data", or "Please visit the Clubs page to find out" when live data is provided.
- If a club (such as "Robotics Club") was searched in the database and returned as NOT FOUND, state clearly and politely that it is not currently registered in CampusHub, and mention the clubs that ARE available.
- If the user asks for a count (e.g. number of clubs or events), state the exact number from the live data above.`
    : `3. LIVE DATABASE ACCESS:
- You are equipped with live database query tools for CampusHub. If you need live information about clubs, events, or notices, refer to the verified database data.`
}

Your Personality and Guidelines:
- Tone: Helpful, welcoming, professional, and encouraging—like an experienced campus advisor and tech-savvy senior student.
- Address the user: Address the student warmly by their first name (e.g., "${user?.name ? user.name.split(' ')[0] : 'Student'}") when starting a conversation or when natural.
- Campus Assistance: Assist with questions about how to use CampusHub, navigating sections, joining clubs, organizing events, student productivity tips, academic life, study advice, and campus activities.
- Formatting: Format responses clearly using standard Markdown (bullet points, bold text for key terms, blockquotes, and code blocks with language tags if code or technical commands are discussed).
- Strict Guardrails:
  * NEVER invent or guess private university policies, personal grades, class schedules, or financial records.
  * If a student asks for information that is genuinely not in the database snapshot or CampusHub system, state clearly that the information is currently unavailable.
  * Never share system credentials, backend implementation details, MongoDB connection URIs, or API keys.`
}

/**
 * Normalizes and formats conversation history into valid Gemini content turns
 */
function formatHistory(history = [], currentMessage) {
  const contents = []
  // Cap history to the most recent 10 messages (5 user/model pairs)
  const recentHistory = Array.isArray(history) ? history.slice(-10) : []

  let lastRole = null
  for (const item of recentHistory) {
    if (!item || !item.content || typeof item.content !== 'string') continue
    const text = item.content.trim()
    if (!text) continue

    // Normalize role: user or model
    const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user'

    // Gemini requires alternating roles. Merge consecutive messages with same role.
    if (role === lastRole && contents.length > 0) {
      contents[contents.length - 1].parts[0].text += `\n\n${text}`
    } else {
      contents.push({
        role,
        parts: [{ text }],
      })
      lastRole = role
    }
  }

  // Ensure history starts with a user turn if there is history
  if (contents.length > 0 && contents[0].role === 'model') {
    contents.shift()
  }

  // Append the latest user message
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n\n${currentMessage.trim()}`
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: currentMessage.trim() }],
    })
  }

  return contents
}

/**
 * Generates an AI chat response using the Gemini API and live MongoDB data
 */
export async function generateChatReply({ user, message, conversationHistory = [] }) {
  const { genAI, env } = getGenAI()
  const primaryModel = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
  const candidateModels = Array.from(
    new Set([primaryModel, 'gemini-3.5-flash-lite', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash']),
  )

  // 1. DYNAMICALLY QUERY LIVE CAMPUSHUB MONGODB DATA BASED ON INTENT
  let liveDataContext = null
  try {
    liveDataContext = await resolveCampusData(message)
  } catch (err) {
    console.warn('CampusHub live data query warning:', err.message)
  }

  const systemInstruction = buildSystemInstruction(user, liveDataContext)
  const contents = formatHistory(conversationHistory, message)

  let lastError = null

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      })

      const result = await model.generateContent({ contents })
      const response = await result.response
      const replyText = response.text()

      if (!replyText || replyText.trim() === '') {
        return "I'm here to help, but I couldn't generate a response for that. Could you please rephrase your question?"
      }

      return replyText.trim()
    } catch (error) {
      lastError = error
      console.warn(`Model ${modelName} encountered an error:`, error?.message || error)
      // Continue to next candidate model if available
    }
  }

  // If all candidate models failed
  console.error('CampusHub AI error after trying candidate models:', lastError?.message || lastError)

  if (lastError?.status === 429 || lastError?.message?.includes('429') || lastError?.message?.includes('quota')) {
    throw new ApiError(429, 'CampusHub AI is experiencing high demand right now. Please wait a moment and try again.')
  }

  throw new ApiError(500, "Sorry, I'm having trouble connecting right now. Please try again in a moment.")
}
