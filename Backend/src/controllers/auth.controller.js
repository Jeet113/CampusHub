import jwt from 'jsonwebtoken'
import ApiResponse from '../utils/ApiResponse.js'
import { getEnv } from '../config/env.js'
import { input } from '../utils/request.js'
import {
  beginPasswordReset,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  rotateRefreshToken,
} from '../services/auth.service.js'
import { sendSignupOtp } from '../services/otp.service.js'

function cookieOptions(token) {
  const env = getEnv()
  const decoded = jwt.decode(token)
  const maxAge = decoded?.exp ? Math.max(decoded.exp * 1000 - Date.now(), 0) : 7 * 24 * 60 * 60 * 1000
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge,
  }
}

function tokenFrom(request) {
  return request.cookies?.refreshToken || input(request, 'body').refreshToken
}

function sendAuth(response, status, result, message) {
  response.cookie('refreshToken', result.refreshToken, cookieOptions(result.refreshToken))
  return response.status(status).json(
    new ApiResponse(
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        ...(result.club ? { club: result.club } : {}),
      },
      message,
    ),
  )
}

export async function sendOtp(request, response) {
  const result = await sendSignupOtp(input(request, 'body').email)
  return response.status(200).json(new ApiResponse(result, 'Verification code sent successfully'))
}

export async function register(request, response) {
  return sendAuth(response, 201, await registerUser(input(request, 'body')), 'Account registered successfully')
}

export async function login(request, response) {
  return sendAuth(response, 200, await loginUser(input(request, 'body')), 'Signed in successfully')
}

export async function refresh(request, response) {
  return sendAuth(response, 200, await rotateRefreshToken(tokenFrom(request)), 'Access token refreshed')
}

export async function logout(request, response) {
  await logoutUser(tokenFrom(request))
  const env = getEnv()
  response.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/api/v1/auth',
  })
  return response.json(new ApiResponse(null, 'Signed out successfully'))
}

export async function me(request, response) {
  return response.json(new ApiResponse(request.user, 'Current user retrieved'))
}

export async function forgotPassword(request, response) {
  const resetToken = await beginPasswordReset(input(request, 'body').email)
  return response.json(
    new ApiResponse(
      resetToken ? { resetToken } : null,
      'If the account exists, password reset instructions have been generated',
    ),
  )
}

export async function completePasswordReset(request, response) {
  const { token, password } = input(request, 'body')
  await resetPassword(token, password)
  return response.json(new ApiResponse(null, 'Password reset successfully'))
}
