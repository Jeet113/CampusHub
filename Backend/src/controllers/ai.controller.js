import asyncHandler from '../utils/asyncHandler.js'
import ApiResponse from '../utils/ApiResponse.js'
import { generateChatReply } from '../services/ai.service.js'

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
