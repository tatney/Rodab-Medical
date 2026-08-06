import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setChecking(false)
      if (data.session?.user) {
        setReady(true)
      } else {
        setError('This reset link is invalid or has expired.')
      }
    })
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const { error: upError } = await supabase.auth.updateUser({ password })
      if (upError) throw upError
      setDone(true)
    } catch (err) {
      setError(err.message || 'Failed to update password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            {done ? 'Password Updated' : 'Reset Password'}
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            {done
              ? 'Your password has been changed successfully.'
              : ready
                ? 'Choose a new password for your account.'
                : 'Verifying your reset link…'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ textDecoration: 'none', display: 'inline-block', padding: '13px 32px', fontSize: 16 }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          !checking && ready && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-password">New Password</label>
                <input
                  id="reset-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reset-confirm">Confirm New Password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="form-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '13px 0', fontSize: 16, marginTop: 8 }}
              >
                {loading ? 'Updating…' : 'Update Password'}
              </button>
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Link
                  to="/login"
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
                >
                  &larr; Back to Sign In
                </Link>
              </div>
            </form>
          )
        )}

        {!checking && !ready && !done && (
          <div style={{ textAlign: 'center' }}>
            <Link
              to="/login"
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
            >
              &larr; Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
