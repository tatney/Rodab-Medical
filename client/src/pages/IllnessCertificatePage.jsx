import React, { useState } from 'react'
import { requestIllnessCert } from '../api'
import colors from '../utils/colors'

export default function IllnessCertificatePage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    certificateStartDate: '',
    certificateEndDate: '',
    reason: '',
    isExtension: false,
    consent: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.firstName.trim()) errs.firstName = 'First name is required'
    if (!form.lastName.trim()) errs.lastName = 'Last name is required'
    if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.certificateStartDate) errs.certificateStartDate = 'Start date is required'
    if (!form.certificateEndDate) errs.certificateEndDate = 'End date is required'
    if (form.certificateStartDate && form.certificateEndDate && form.certificateEndDate < form.certificateStartDate) errs.certificateEndDate = 'End date must be after start date'
    if (!form.reason.trim()) errs.reason = 'Reason is required'
    if (!form.consent) errs.consent = 'You must provide consent'
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
      await requestIllnessCert({
        first_name: form.firstName,
        last_name: form.lastName,
        date_of_birth: form.dateOfBirth,
        email: form.email,
        phone: form.phone,
        address: form.address,
        certificate_start_date: form.certificateStartDate,
        certificate_end_date: form.certificateEndDate,
        reason: form.reason,
        is_extension: form.isExtension,
        consent: form.consent,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div style={{ padding: '64px 24px', maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#dcfce7', color: colors.green, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          &#10003;
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>Request Submitted!</h2>
        <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 24, lineHeight: 1.6 }}>
          Your illness certificate request has been received. You'll receive the certificate via email once approved by your doctor.
        </p>
        <a href="/" style={{ padding: '12px 24px', backgroundColor: colors.primary, color: colors.white, borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
          Back to Home
        </a>
      </div>
    )
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 8,
    border: `1px solid ${colors.gray300}`,
    fontSize: 15,
    boxSizing: 'border-box',
  }

  const labelStyle = { display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: colors.gray700 }
  const errorTextStyle = { fontSize: 12, color: colors.red, marginTop: 4 }
  const inputErrorStyle = { borderColor: colors.red }

  const renderFieldError = (field) => fieldErrors[field] ? <p style={errorTextStyle}>{fieldErrors[field]}</p> : null

  return (
    <div style={{ padding: '48px 24px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 8 }}>Illness Certificate Request</h1>
      <p style={{ fontSize: 15, color: colors.gray500, marginBottom: 32 }}>Request a medical illness/sick note certificate</p>

      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: colors.red, fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 32 }}>
        <form onSubmit={handleSubmit}>
          <div className="grid-form-fields" style={{ gap: 16, marginBottom: 16 }}>
            <div>
              <label htmlFor="illness-firstName" style={labelStyle}>First Name *</label>
              <input id="illness-firstName" name="firstName" type="text" value={form.firstName} onChange={handleChange} style={{ ...inputStyle, ...(fieldErrors.firstName ? inputErrorStyle : {}) }} />
              {renderFieldError('firstName')}
            </div>
            <div>
              <label htmlFor="illness-lastName" style={labelStyle}>Last Name *</label>
              <input id="illness-lastName" name="lastName" type="text" value={form.lastName} onChange={handleChange} style={{ ...inputStyle, ...(fieldErrors.lastName ? inputErrorStyle : {}) }} />
              {renderFieldError('lastName')}
            </div>
          </div>

          <div className="grid-form-fields" style={{ gap: 16, marginBottom: 16 }}>
            <div>
              <label htmlFor="illness-dateOfBirth" style={labelStyle}>Date of Birth *</label>
              <input id="illness-dateOfBirth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} style={{ ...inputStyle, ...(fieldErrors.dateOfBirth ? inputErrorStyle : {}) }} />
              {renderFieldError('dateOfBirth')}
            </div>
            <div>
              <label htmlFor="illness-email" style={labelStyle}>Email *</label>
              <input id="illness-email" name="email" type="email" value={form.email} onChange={handleChange} style={{ ...inputStyle, ...(fieldErrors.email ? inputErrorStyle : {}) }} />
              {renderFieldError('email')}
            </div>
          </div>

          <div className="grid-form-fields" style={{ gap: 16, marginBottom: 16 }}>
            <div>
              <label htmlFor="illness-phone" style={labelStyle}>Phone</label>
              <input id="illness-phone" name="phone" type="tel" value={form.phone} onChange={handleChange} style={inputStyle} />
            </div>
            <div />
          </div>

          <label htmlFor="illness-address" style={labelStyle}>Address *</label>
          <textarea id="illness-address" name="address" value={form.address} onChange={handleChange} rows={2} style={{ ...inputStyle, marginBottom: 4, resize: 'vertical', fontFamily: 'inherit', ...(fieldErrors.address ? inputErrorStyle : {}) }} />
          {renderFieldError('address')}
          <div style={{ height: 12 }} />

          <div className="grid-form-fields" style={{ gap: 16, marginBottom: 16 }}>
            <div>
              <label htmlFor="illness-certificateStartDate" style={labelStyle}>Certificate Start Date *</label>
              <input id="illness-certificateStartDate" name="certificateStartDate" type="date" value={form.certificateStartDate} onChange={handleChange} style={{ ...inputStyle, ...(fieldErrors.certificateStartDate ? inputErrorStyle : {}) }} />
              {renderFieldError('certificateStartDate')}
            </div>
            <div>
              <label htmlFor="illness-certificateEndDate" style={labelStyle}>Certificate End Date *</label>
              <input id="illness-certificateEndDate" name="certificateEndDate" type="date" value={form.certificateEndDate} onChange={handleChange} min={form.certificateStartDate} style={{ ...inputStyle, ...(fieldErrors.certificateEndDate ? inputErrorStyle : {}) }} />
              {renderFieldError('certificateEndDate')}
            </div>
          </div>

          <label htmlFor="illness-reason" style={labelStyle}>Reason for Absence *</label>
          <textarea id="illness-reason" name="reason" value={form.reason} onChange={handleChange} rows={3} placeholder="Describe your illness/reason for needing a certificate" style={{ ...inputStyle, marginBottom: 4, resize: 'vertical', fontFamily: 'inherit', ...(fieldErrors.reason ? inputErrorStyle : {}) }} />
          {renderFieldError('reason')}
          <div style={{ height: 12 }} />

          {/* Extension Checkbox */}
          <label htmlFor="illness-isExtension" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
            <input id="illness-isExtension" type="checkbox" name="isExtension" checked={form.isExtension} onChange={handleChange} style={{ width: 18, height: 18 }} />
            <span style={{ fontSize: 14, color: colors.gray700 }}>This is an extension of a previous illness certificate</span>
          </label>

          {/* Consent Checkbox */}
          <label htmlFor="illness-consent" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8, cursor: 'pointer' }}>
            <input id="illness-consent" type="checkbox" name="consent" checked={form.consent} onChange={handleChange} style={{ marginTop: 3, width: 18, height: 18 }} />
            <span style={{ fontSize: 14, color: colors.gray600, lineHeight: 1.5 }}>
              I confirm that the information provided is accurate and I consent to the processing of this illness certificate request.
            </span>
          </label>
          {renderFieldError('consent')}

          <div style={{ height: 16 }} />

          <button type="submit" disabled={submitting} style={{
            width: '100%', padding: '13px 0',
            backgroundColor: submitting ? colors.gray300 : colors.primary,
            color: colors.white, border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}>
            {submitting ? 'Submitting...' : 'Submit Certificate Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
