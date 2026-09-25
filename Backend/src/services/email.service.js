import nodemailer from 'nodemailer'
import { getEnv } from '../config/env.js'
import ApiError from '../utils/ApiError.js'

let transporterInstance = null

function getTransporter() {
  if (transporterInstance) return transporterInstance

  const env = getEnv()
  if (!env.EMAIL_USER || !env.EMAIL_PASS) {
    return null
  }

  transporterInstance = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASS.replace(/\s+/g, ''),
    },
  })

  return transporterInstance
}

export async function sendOtpEmail({ email, otp, purpose = 'Account Verification' }) {
  const env = getEnv()
  const transporter = getTransporter()

  if (!transporter) {
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      console.warn(`[EMAIL SERVICE] EMAIL_USER / EMAIL_PASS not configured. Mock OTP for ${email}: ${otp}`)
      return { sent: false, mock: true, otp }
    }
    throw new ApiError(500, 'Email service is not configured on the server')
  }

  const subject = `CampusHub — ${otp} is your verification code`

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CampusHub Verification Code</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #0f172a;
          color: #f8fafc;
          margin: 0;
          padding: 30px 15px;
        }
        .container {
          max-width: 520px;
          margin: 0 auto;
          background: #1e293b;
          border-radius: 16px;
          border: 1px solid #334155;
          padding: 36px 32px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        }
        .header {
          text-align: center;
          margin-bottom: 28px;
        }
        .logo-badge {
          display: inline-block;
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(135deg, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }
        .subtitle {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 4px;
        }
        h1 {
          font-size: 20px;
          font-weight: 600;
          color: #f1f5f9;
          margin-bottom: 12px;
          text-align: center;
        }
        p {
          color: #cbd5e1;
          font-size: 15px;
          line-height: 1.6;
          margin: 0 0 16px 0;
        }
        .otp-box {
          background: #0f172a;
          border: 2px dashed #38bdf8;
          border-radius: 12px;
          text-align: center;
          padding: 20px 10px;
          margin: 24px 0;
        }
        .otp-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 8px;
          color: #38bdf8;
        }
        .note {
          font-size: 13px;
          color: #94a3b8;
          text-align: center;
          margin-top: 8px;
        }
        .footer {
          border-top: 1px solid #334155;
          margin-top: 32px;
          padding-top: 20px;
          font-size: 12px;
          color: #64748b;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo-badge">🎓 CampusHub</div>
          <div class="subtitle">Campus life, in focus.</div>
        </div>
        <h1>${purpose}</h1>
        <p>Hello,</p>
        <p>Use the 6-digit verification code below to complete your sign-up process on <strong>CampusHub</strong>:</p>
        
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
          <div class="note">This code will expire in <strong>10 minutes</strong>.</div>
        </div>

        <p>If you did not request this verification code, you can safely ignore this email. Someone may have entered your email address by mistake.</p>

        <div class="footer">
          &copy; ${new Date().getFullYear()} CampusHub. All rights reserved.<br>
          This is an automated security message, please do not reply.
        </div>
      </div>
    </body>
    </html>
  `

  const text = `CampusHub — ${purpose}\n\nYour 6-digit verification code is: ${otp}\n\nThis code expires in 10 minutes.\nIf you did not request this code, please ignore this message.`

  const info = await transporter.sendMail({
    from: `"CampusHub" <${env.EMAIL_USER}>`,
    to: email,
    subject,
    text,
    html,
  })

  return { sent: true, messageId: info.messageId }
}
