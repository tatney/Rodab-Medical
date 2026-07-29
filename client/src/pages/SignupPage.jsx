import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../supabaseClient'

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

function validatePassword(pw) {
  return {
    minLength: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  }
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    age: '', gender: '', bloodGroup: '', chronicDisease: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [pwChecks, setPwChecks] = useState({
    minLength: false, uppercase: false, lowercase: false, number: false, symbol: false,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === 'password') setPwChecks(validatePassword(value))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    const checks = validatePassword(form.password)
    if (!Object.values(checks).every(Boolean)) {
      setError('Password does not meet all requirements.')
      return
    }

    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: '',
            role: 'user',
          },
        },
      })
      if (authError) throw authError

      if (data.user && data.session) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: form.email,
          full_name: form.fullName,
          role: 'user',
        })
      }

      setVerified(true)
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (verified) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#dcfce7', color: '#16a34a', fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            &#10003;
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>Check Your Email</h2>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
            We've sent a verification link to <strong>{form.email}</strong>. Please check your inbox and click the link to verify your account.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
            Create Account
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            Join Rodab Medical for quality healthcare
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input id="fullName" name="fullName" type="text" required value={form.fullName} onChange={handleChange} placeholder="John Doe" className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@example.com" className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required value={form.password} onChange={handleChange} placeholder="Create a strong password" className="form-input" />
          </div>

          {form.password && (
            <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: 'var(--surface)', borderRadius: 8 }} role="status" aria-live="polite">
              {[
                { key: 'minLength', text: 'At least 8 characters' },
                { key: 'uppercase', text: 'One uppercase letter' },
                { key: 'lowercase', text: 'One lowercase letter' },
                { key: 'number', text: 'One number' },
                { key: 'symbol', text: 'One symbol (!@#$...)' },
              ].map(({ key, text }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: pwChecks[key] ? '#16a34a' : 'var(--outline-variant)' }}>
                    {pwChecks[key] ? '\u2713' : '\u2717'}
                  </span>
                  <span style={{ color: pwChecks[key] ? '#16a34a' : 'var(--text-secondary)' }}>{text}</span>
                </div>
              ))}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" required value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter password" className="form-input" />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="age">Age</label>
              <input id="age" name="age" type="number" min="0" max="150" value={form.age} onChange={handleChange} placeholder="30" className="form-input" />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" htmlFor="gender">Gender</label>
              <select id="gender" name="gender" value={form.gender} onChange={handleChange} className="form-select">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bloodGroup">Blood Group</label>
            <select id="bloodGroup" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="form-select">
              <option value="">Select Blood Group</option>
              {bloodGroups.map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="chronicDisease">Chronic Disease (optional)</label>
            <input id="chronicDisease" name="chronicDisease" type="text" value={form.chronicDisease} onChange={handleChange} placeholder="e.g. Diabetes, Hypertension" className="form-input" />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '13px 0', fontSize: 16, marginTop: 8 }}>
            {loading && <span className="spinner spinner-sm" style={{ borderTopColor: 'transparent' }} />}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          {error && (
            <div className="alert alert-error" style={{ marginTop: 12, fontSize: 14 }}>
              {error}
            </div>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
          </span>
          <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
