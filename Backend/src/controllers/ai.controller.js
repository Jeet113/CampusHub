import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/ApiResponse.js'
import { generateChatReply } from '../services/ai.service.js'
import { getClubRecommendations as recommendClubs } from '../services/clubRecommender.service.js'

export const chatWithAi = asyncHandler(async (request, response) => {
  const { message, conversationHistory } = request.validated.body

  const reply = await generateChatReply({
    user: request.user,
    message,
    conversationHistory,
  })

  return response.status(200).json(
    new ApiResponse(
      { reply },
      'AI response generated successfully',
      { reply },
    ),
  )
})

export const getClubRecommendations = asyncHandler(async (request, response) => {
  const preferences = request.validated.body

  const result = await recommendClubs({
    user: request.user,
    preferences,
  })

  return response.status(200).json(
    new ApiResponse(
      result,
      result.recommendations?.length
        ? 'Club recommendations generated successfully'
        : result.message || 'No matching clubs found',
    ),
  )
})

