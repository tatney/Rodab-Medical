import React, { useState } from 'react'
import { sendContact } from '../api'
import colors from '../utils/colors'

const formTypes = [
  { id: 'referral', title: 'Referral Request', icon: '📋', desc: 'Request a specialist referral from your primary physician.' },
  { id: 'records', title: 'Medical Records Request', icon: '📁', desc: 'Request copies of your medical records and test results.' },
  { id: 'prescription', title: 'Prescription Refill', icon: '💊', desc: 'Request a refill for an existing prescription.' },
  { id: 'feedback', title: 'Patient Feedback', icon: '⭐', desc: 'Share your experience and help us improve our services.' },
]

export default function FormsPage() {
  const [selectedType, setSelectedType] = useState(null)
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (fieldErrors[e.target.name]) setFieldErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.fullName.trim()) errs.fullName = 'Full name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.subject.trim()) errs.subject = 'Subject is required'
    if (!form.message.trim()) errs.message = 'Message is required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      setError('Please fix the errors below.')
      return
    }
    setSubmitting(true)
    try {
      await sendContact({
        type: selectedType,
        full_name: form.fullName,
        email: form.email,
        phone: form.phone,
        subject: form.subject,
        message: form.message,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setSelectedType(null)
    setForm({ fullName: '', email: '', phone: '', subject: '', message: '' })
    setSuccess(false)
    setError('')
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: `1px solid ${colors.gray300}`,
    fontSize: 15,
    boxSizing: 'border-box',
  }

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 600,
    color: colors.gray700,
  }

  const errorTextStyle = { fontSize: 12, color: colors.red, marginTop: 4 }
  const inputErrorStyle = { borderColor: colors.red }
  const renderFieldError = (field) => fieldErrors[field] ? <p style={errorTextStyle}>{fieldErrors[field]}</p> : null

  // Success state
  if (success) {
    return (
      <div style={{ padding: '64px 24px', maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#dcfce7', color: colors.green, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          &#10003;
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>Form Submitted!</h2>
        <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 24, lineHeight: 1.6 }}>
          Your {formTypes.find((f) => f.id === selectedType)?.title || 'form'} has been submitted successfully. We will review it and get back to you soon.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={handleReset} style={{ padding: '12px 24px', backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
            Submit Another Form
          </button>
          <a href="/form-history" style={{ padding: '12px 24px', backgroundColor: colors.gray100, color: colors.gray700, border: `1px solid ${colors.gray300}`, borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            View Form History
          </a>
        </div>
      </div>
    )
  }

  // Form type selection
  if (!selectedType) {
    return (
      <div style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 8 }}>Medical Forms</h1>
        <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 40 }}>Select the type of form you'd like to submit</p>
        <div className="grid-forms-select">
          {formTypes.map((ft) => (
            <button
              key={ft.id}
              onClick={() => setSelectedType(ft.id)}
              style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                border: `1px solid ${colors.gray200}`,
                padding: 28,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden="true">{ft.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.gray900, marginBottom: 6 }}>{ft.title}</h3>
              <p style={{ fontSize: 14, color: colors.gray500, lineHeight: 1.5 }}>{ft.desc}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const currentType = formTypes.find((f) => f.id === selectedType)

  return (
    <div style={{ padding: '48px 24px', maxWidth: 700, margin: '0 auto' }}>
      <button onClick={handleReset} style={{ background: 'none', border: 'none', fontSize: 14, color: colors.primary, cursor: 'pointer', marginBottom: 16, fontWeight: 600 }}>
        &larr; Back to form types
      </button>
      <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 32 }} aria-hidden="true">{currentType?.icon}</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: colors.gray900 }}>{currentType?.title}</h2>
        </div>

        {error && (
          <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="fullName" style={labelStyle}>Full Name</label>
          <input id="fullName" name="fullName" type="text" value={form.fullName} onChange={handleChange} placeholder="Your full name" style={{ ...inputStyle, marginBottom: 4, ...(fieldErrors.fullName ? inputErrorStyle : {}) }} />
          {renderFieldError('fullName')}
          <div style={{ height: 12 }} />

          <div className="grid-form-fields" style={{ gap: 12, marginBottom: 16 }}>
            <div>
              <label htmlFor="email" style={labelStyle}>Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" style={{ ...inputStyle, ...(fieldErrors.email ? inputErrorStyle : {}) }} />
              {renderFieldError('email')}
            </div>
            <div>
              <label htmlFor="phone" style={labelStyle}>Phone</label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+961 XX XXX XXX" style={inputStyle} />
            </div>
          </div>

          <label htmlFor="subject" style={labelStyle}>Subject</label>
          <input id="subject" name="subject" type="text" value={form.subject} onChange={handleChange} placeholder="Brief subject line" style={{ ...inputStyle, marginBottom: 4, ...(fieldErrors.subject ? inputErrorStyle : {}) }} />
          {renderFieldError('subject')}
          <div style={{ height: 12 }} />

          <label htmlFor="message" style={labelStyle}>Message</label>
          <textarea id="message" name="message" value={form.message} onChange={handleChange} placeholder="Provide details..." rows={5} style={{ ...inputStyle, marginBottom: 4, resize: 'vertical', fontFamily: 'inherit', ...(fieldErrors.message ? inputErrorStyle : {}) }} />
          {renderFieldError('message')}
          <div style={{ height: 16 }} />

          <button type="submit" disabled={submitting} style={{
            padding: '13px 32px', backgroundColor: submitting ? colors.gray300 : colors.primary,
            color: colors.white, border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}>
            {submitting ? 'Submitting...' : 'Submit Form'}
          </button>
        </form>
      </div>
    </div>
  )
}
