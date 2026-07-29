import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import supabase from '../supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotErr, setForgotErr] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      await refreshUser()
      await new Promise(r => setTimeout(r, 0))

      const role = profile?.role || ''

      switch (role) {
        case 'super_admin':
          navigate('/super-admin')
          break
        case 'admin':
          navigate('/admin')
          break
        case 'doctor':
          navigate('/doctor')
          break
        case 'driver':
          navigate('/driver')
          break
        default:
          navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) throw error
    } catch {
      setError('Google sign-in is not configured.')
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setForgotErr('')
    setForgotMsg('')
    setForgotLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
      setForgotMsg('If an account exists with that email, a password reset link has been sent.')
    } catch {
      setForgotErr('Failed to send reset email. Please try again.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            Sign in to your Rodab Medical account
          </p>
        </div>

        {showForgot ? (
          <>
            {forgotMsg && (
              <div className="alert alert-success" style={{ marginBottom: 16 }}>
                {forgotMsg}
              </div>
            )}
            {forgotErr && (
              <div className="alert alert-error" style={{ marginBottom: 16 }}>
                {forgotErr}
              </div>
            )}
            <form onSubmit={handleForgotPassword}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="forgotEmail">Email</label>
                <input
                  id="forgotEmail"
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="form-input"
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 8 }}
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setForgotMsg(''); setForgotErr('') }}
                  style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                />
              </div>

              <div style={{ textAlign: 'right', marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => { setShowForgot(true); setForgotEmail(email) }}
                  style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px 0', fontSize: 16 }}
              >
                {loading && (
                  <span className="spinner spinner-sm" style={{ borderTopColor: 'transparent' }} />
                )}
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              {error && (
                <div className="alert alert-error" style={{ marginTop: 12, fontSize: 14 }}>
                  {error}
                </div>
              )}
            </form>

            <div style={{ position: 'relative', margin: '24px 0', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, backgroundColor: 'var(--outline-variant)' }} />
              <span style={{ position: 'relative', backgroundColor: 'var(--surface-card)', padding: '0 12px', fontSize: 13, color: 'var(--text-secondary)' }}>or continue with</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              className="btn btn-outline"
              style={{ width: '100%', padding: '11px 0', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
              </span>
              <Link
                to="/signup"
                style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
              >
                Sign Up
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
