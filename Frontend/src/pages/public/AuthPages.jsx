import { useState, useRef, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, GraduationCap, Building2, Mail, ShieldCheck, RefreshCw, Edit2 } from 'lucide-react'
import Logo from '../../components/layout/Logo'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/common/Toast'
import { api } from '../../services/api'
import { credentials } from '../../data/mockData'

function AuthShell({ children, asideTitle = 'Campus life, in focus.', asideText = 'One calm place to discover, participate, and stay connected.' }) { return <div className="auth-page"><aside><Link to="/" className="auth-back"><ArrowLeft size={18} /> Back home</Link><div><span className="auth-emblem"><GraduationCap /></span><h2>{asideTitle}</h2><p>{asideText}</p><blockquote>"CampusHub made it much easier to find the communities and events that made university feel like home."</blockquote><small>— Nafisa Rahman, EEE '27</small></div></aside><main><div className="auth-mobile-logo"><Logo /></div>{children}</main></div> }

export function Login() { const { user, login } = useAuth(); const nav = useNavigate(); const [role, setRole] = useState('student'); const [email, setEmail] = useState(credentials.student?.email || ''); const [password, setPassword] = useState(credentials.student?.password || ''); const [show, setShow] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); if (user) return <Navigate to={`/${user.role}/dashboard`} replace />; const pick = r => { setRole(r); setEmail(credentials[r]?.email || ''); setPassword(credentials[r]?.password || ''); setError('') }; const submit = async e => { e.preventDefault(); setLoading(true); setError(''); const res = await login({ email, password }); setLoading(false); if (res.ok) nav(`/${res.user.role}/dashboard`); else setError(res.error) }; return <AuthShell><div className="auth-form-wrap"><p className="eyebrow">Welcome back</p><h1>Sign in to CampusHub</h1><p className="auth-intro">Choose a role to use its ready-made demo account.</p><div className="role-tabs">{['student', 'club', 'admin'].map(r => <button key={r} className={role === r ? 'active' : ''} onClick={() => pick(r)}>{r === 'club' ? 'Organization' : r}</button>)}</div><form onSubmit={submit}><Input label="Email address" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required /><label className="field"><span>Password</span><div className="password-field"><input name="password" type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" onClick={() => setShow(v => !v)} aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff /> : <Eye />}</button></div></label><div className="form-row"><label className="check"><input type="checkbox" defaultChecked /><span>Remember me</span></label><Link to="/forgot-password">Forgot password?</Link></div>{error && <div className="form-error" role="alert">{error}</div>}<Button type="submit" className="full" disabled={loading}>{loading ? 'Signing in…' : <>Sign in <ArrowRight size={18} /></>}</Button></form><p className="auth-switch">New to CampusHub? <Link to="/register">Create an account</Link></p><div className="demo-note"><Check size={16} /><span>Demo credentials are filled automatically when you switch roles.</span></div></div></AuthShell> }

export function Register() {
  const { register } = useAuth()
  const nav = useNavigate()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [pendingData, setPendingData] = useState(null)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])
  const { toast } = useToast()

  // Countdown timer for resending OTP
  useEffect(() => {
    let timer
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [countdown])

  // Focus first OTP input on step 2 transition
  useEffect(() => {
    if (step === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [step])

  // Step 1: Submit info and request OTP
  const handleInitiateRegister = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const name = form.get('name')?.toString().trim()
    const studentId = form.get('studentId')?.toString().trim().toUpperCase()
    const email = form.get('email')?.toString().trim().toLowerCase()
    const password = form.get('password')?.toString()
    const confirm = form.get('confirm')?.toString()
    const department = form.get('department')?.toString().trim()
    const batch = form.get('batch')?.toString().trim() || undefined

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must contain at least one letter and one number')
      setLoading(false)
      return
    }

    if (password !== confirm) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const data = {
      name,
      studentId,
      email,
      password,
      department,
      batch,
      role: 'student',
    }

    try {
      await api.post('/auth/send-otp', { email: data.email })
      setPendingData(data)
      setStep(2)
      setCountdown(60)
      setOtpDigits(['', '', '', '', '', ''])
      toast('Verification code sent to your email')
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please check your email and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2: Handle OTP input changes
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1)
    const newDigits = [...otpDigits]
    newDigits[index] = cleanVal
    setOtpDigits(newDigits)
    setError('')

    if (cleanVal && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const newDigits = [...otpDigits]
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || ''
    }
    setOtpDigits(newDigits)
    setError('')

    const nextIndex = Math.min(pasted.length, 5)
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus()
    }
  }

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resending || !pendingData?.email) return
    setResending(true)
    setError('')

    try {
      await api.post('/auth/send-otp', { email: pendingData.email })
      setCountdown(60)
      toast('A new verification code has been sent.')
    } catch (err) {
      setError(err.message || 'Failed to resend verification code.')
    } finally {
      setResending(false)
    }
  }

  // Step 2: Final submit with OTP
  const handleCompleteRegister = async (e) => {
    e.preventDefault()
    const code = otpDigits.join('')
    if (code.length < 6) {
      setError('Please enter the full 6-digit verification code')
      return
    }

    setLoading(true)
    setError('')

    const res = await register({
      ...pendingData,
      otp: code,
    })

    setLoading(false)
    if (res.ok) {
      toast('Account verified and created successfully!')
      nav(`/${res.user.role}/dashboard`)
    } else {
      setError(res.error)
    }
  }

  return (
    <AuthShell
      asideTitle="Join your campus community."
      asideText="Discover new opportunities and keep university life beautifully organized."
    >
      <div className="auth-form-wrap register-wrap">
        {step === 1 ? (
          <>
            <div className="step-badge">
              <span>Step 1 of 2</span> &bull; Student registration
            </div>
            <h1>Create student account</h1>
            <p className="auth-intro">
              Register with your student ID to discover events, connect with clubs, and stay informed.
            </p>

            <form onSubmit={handleInitiateRegister} className="form-grid">
              <Input
                label="Full name"
                name="name"
                defaultValue={pendingData?.name || ''}
                required
              />
              <Input
                label="Student ID"
                name="studentId"
                placeholder="e.g. 2204113"
                defaultValue={pendingData?.studentId || ''}
                required
              />
              <Input
                className="span-2"
                label="University email"
                name="email"
                type="email"
                placeholder="uxxxxx@student.cuet.ac.bd"
                defaultValue={pendingData?.email || ''}
                required
              />
              <label className="field">
                <span>Department</span>
                <select
                  name="department"
                  defaultValue={pendingData?.department || ''}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="CSE">Computer Science & Engineering</option>
                  <option value="EEE">Electrical & Electronic Engineering</option>
                  <option value="ME">Mechanical Engineering</option>
                  <option value="CE">Civil Engineering</option>
                  <option value="ARCH">Architecture</option>
                  <option value="URP">Urban & Regional Planning</option>
                  <option value="PME">Petroleum & Mining Engineering</option>
                  <option value="BME">Biomedical Engineering</option>
                  <option value="MIE">Mechatronics and Industrial Engineering</option>
                  <option value="MME">Materials and Metallurgical Engineering</option>
                  <option value="WRE">Water Resources and Engineering</option>
                  <option value="ETE">Electronics & Telecommunication Engineering</option>
                </select>
              </label>
              <Input
                label="Batch / Year (Optional)"
                name="batch"
                placeholder="e.g. 2022"
                defaultValue={pendingData?.batch || ''}
              />
              <Input
                label="Password"
                name="password"
                type="password"
                minLength={8}
                defaultValue={pendingData?.password || ''}
                required
              />
              <Input
                label="Confirm password"
                name="confirm"
                type="password"
                minLength={8}
                defaultValue={pendingData?.password || ''}
                required
              />
              <label className="checkbox span-2">
                <input type="checkbox" required />
                <span>I agree to university code of conduct and community guidelines</span>
              </label>

              {error && (
                <div className="form-error span-2" role="alert">
                  {error}
                </div>
              )}

              <Button className="span-2" type="submit" disabled={loading}>
                {loading ? 'Sending code…' : 'Continue to verification'} <ArrowRight size={17} />
              </Button>
            </form>
          </>
        ) : (
          <>
            <div className="step-badge">
              <span>Step 2 of 2</span> &bull; Email verification
            </div>
            <h1>Verify your email</h1>
            <p className="auth-intro">
              We sent a 6-digit verification code to <strong>{pendingData?.email}</strong>.
            </p>

            <form onSubmit={handleCompleteRegister} className="otp-form">
              <div className="otp-inputs-row" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="otp-digit-input"
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>

              {error && (
                <div className="form-error" role="alert">
                  {error}
                </div>
              )}


              <div className="otp-actions-row">
                <button
                  type="button"
                  className="link-back-btn"
                  onClick={() => {
                    setStep(1)
                    setError('')
                  }}
                >
                  Edit registration info
                </button>

                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResendOtp}
                  disabled={countdown > 0 || resending}
                >
                  <RefreshCw size={13} className={resending ? 'animate-spin' : ''} />
                  {resending ? 'Sending…' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                </button>
              </div>

              <Button
                type="submit"
                className="full"
                disabled={loading || otpDigits.join('').length !== 6}
              >
                {loading ? 'Creating account…' : <>Verify & Complete Registration <ArrowRight size={18} /></>}
              </Button>
            </form>
          </>
        )}

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </AuthShell>
  )
}

export function ForgotPassword() { const [sent, setSent] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const submit = async e => { e.preventDefault(); setLoading(true); setError(''); try { const form = new FormData(e.currentTarget); await api.post('/auth/forgot-password', { email: form.get('email') }); setSent(true) } catch (err) { setError(err.message || 'Something went wrong') } finally { setLoading(false) } }; return <AuthShell asideTitle="We'll help you get back in." asideText="Account recovery is quick, secure, and straightforward."><div className="auth-form-wrap"><p className="eyebrow">Account recovery</p><h1>{sent ? 'Check your inbox' : 'Forgot your password?'}</h1>{sent ? <><p className="auth-intro">If an account exists for that address, a reset link is on its way.</p><Link to="/login"><Button>Return to sign in</Button></Link></> : <form onSubmit={submit}><p className="auth-intro">Enter your university email and we'll send you a secure reset link.</p><Input label="University email" name="email" type="email" required />{error && <div className="form-error" role="alert">{error}</div>}<Button className="full" type="submit" disabled={loading}>{loading ? 'Sending…' : <>Send reset link <ArrowRight size={18} /></>}</Button></form>}</div></AuthShell> }
