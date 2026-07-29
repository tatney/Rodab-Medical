import React, { useState } from 'react'
import { requestPrescription } from '../api'
import colors from '../utils/colors'

export default function RepeatPrescriptionPage() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    address: '',
    medication: '',
    nameOfGp: '',
    pharmacy: '',
    additionalInfo: '',
    isPrivatePatient: 'no',
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
    if (!form.nameOfGp.trim()) errs.nameOfGp = 'GP name is required'
    if (!form.address.trim()) errs.address = 'Address is required'
    if (!form.medication.trim()) errs.medication = 'Medication details are required'
    if (!form.pharmacy.trim()) errs.pharmacy = 'Preferred pharmacy is required'
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
      await requestPrescription({
        first_name: form.firstName,
        last_name: form.lastName,
        date_of_birth: form.dateOfBirth,
        email: form.email,
        phone: form.phone,
        address: form.address,
        medication: form.medication,
        name_of_gp: form.nameOfGp,
        pharmacy: form.pharmacy,
        additional_info: form.additionalInfo,
        is_private_patient: form.isPrivatePatient === 'yes',
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
      <div style={{
        padding: '80px 24px',
        maxWidth: 500,
        margin: '0 auto',
        textAlign: 'center',
      }}>
        <div style={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          backgroundColor: '#d1fae5',
          color: '#059669',
          fontSize: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 28px',
          border: '3px solid #a7f3d0',
        }}>
          &#10003;
        </div>
        <h2 style={{
          fontFamily: "'Barlow', sans-serif",
          fontSize: 28,
          fontWeight: 700,
          color: colors.gray900,
          marginBottom: 12,
        }}>Request Submitted Successfully</h2>
        <p style={{
          fontFamily: "'Barlow', sans-serif",
          fontSize: 16,
          color: colors.gray500,
          marginBottom: 32,
          lineHeight: 1.7,
        }}>
          Your repeat prescription request has been received. Your GP will review it and you'll be notified when it's ready for collection.
        </p>
        <a href="/" style={{
          padding: '14px 32px',
          backgroundColor: colors.accent,
          color: colors.white,
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          textDecoration: 'none',
          display: 'inline-block',
          fontFamily: "'Barlow', sans-serif",
          transition: 'background-color 0.2s',
        }}>
          Back to Home
        </a>
      </div>
    )
  }

  const pageStyle = {
    padding: '48px 24px',
    maxWidth: 700,
    margin: '0 auto',
    fontFamily: "'Barlow', sans-serif",
    backgroundColor: colors.gray50,
    minHeight: '100vh',
  }

  const cardStyle = {
    backgroundColor: colors.white,
    borderRadius: 12,
    border: `1px solid ${colors.gray200}`,
    padding: 40,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 8,
    border: `1px solid ${colors.gray300}`,
    fontSize: 15,
    boxSizing: 'border-box',
    fontFamily: "'Barlow', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  }

  const inputFocusHandler = (e) => {
    e.target.style.borderColor = colors.primary
    e.target.style.boxShadow = `0 0 0 3px rgba(18, 23, 92, 0.12)`
  }

  const inputBlurHandler = (e) => {
    if (!e.target.style.borderColor || e.target.style.borderColor === colors.primary) {
      e.target.style.borderColor = colors.gray300
      e.target.style.boxShadow = 'none'
    }
  }

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 600,
    color: colors.gray700,
    fontFamily: "'Barlow', sans-serif",
  }

  const errorTextStyle = {
    fontSize: 12,
    color: colors.red,
    marginTop: 4,
    fontFamily: "'Barlow', sans-serif",
  }

  const inputErrorStyle = {
    borderColor: colors.red,
  }

  const renderFieldError = (field) =>
    fieldErrors[field] ? <p style={errorTextStyle}>{fieldErrors[field]}</p> : null

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
    fontFamily: "'Barlow', sans-serif",
  }

  return (
    <div style={pageStyle}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: "'Barlow', sans-serif",
          fontSize: 32,
          fontWeight: 800,
          color: colors.primary,
          marginBottom: 8,
        }}>Repeat Prescription Request</h1>
        <p style={{
          fontFamily: "'Barlow', sans-serif",
          fontSize: 15,
          color: colors.gray500,
        }}>Complete the form below to request a repeat of your current medication</p>
      </div>

      <div style={{
        padding: '16px 20px',
        backgroundColor: colors.accent + '12',
        borderRadius: 8,
        border: `1px solid ${colors.accent}40`,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: 22 }}>&#128176;</span>
        <div>
          <p style={{
            fontSize: 14,
            fontWeight: 600,
            color: colors.primary,
            margin: 0,
            fontFamily: "'Barlow', sans-serif",
          }}>Prescription Fee: $15.00</p>
          <p style={{
            fontSize: 13,
            color: colors.gray600,
            margin: 0,
            fontFamily: "'Barlow', sans-serif",
          }}>Payable upon collection at the pharmacy</p>
        </div>
      </div>

      {error && (
        <div role="alert" style={{
          padding: '12px 16px',
          borderRadius: 8,
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          color: colors.red,
          fontSize: 14,
          marginBottom: 20,
          fontFamily: "'Barlow', sans-serif",
        }}>
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <form onSubmit={handleSubmit}>
          <div className="grid-form-fields" style={{ gap: 16, marginBottom: 20 }}>
            <div>
              <label htmlFor="repeat-firstName" style={labelStyle}>First Name *</label>
              <input
                id="repeat-firstName"
                name="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
                style={{ ...inputStyle, ...(fieldErrors.firstName ? inputErrorStyle : {}) }}
              />
              {renderFieldError('firstName')}
            </div>
            <div>
              <label htmlFor="repeat-lastName" style={labelStyle}>Last Name *</label>
              <input
                id="repeat-lastName"
                name="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
                style={{ ...inputStyle, ...(fieldErrors.lastName ? inputErrorStyle : {}) }}
              />
              {renderFieldError('lastName')}
            </div>
          </div>

          <div className="grid-form-fields" style={{ gap: 16, marginBottom: 20 }}>
            <div>
              <label htmlFor="repeat-dateOfBirth" style={labelStyle}>Date of Birth *</label>
              <input
                id="repeat-dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={form.dateOfBirth}
                onChange={handleChange}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
                style={{ ...inputStyle, ...(fieldErrors.dateOfBirth ? inputErrorStyle : {}) }}
              />
              {renderFieldError('dateOfBirth')}
            </div>
            <div>
              <label htmlFor="repeat-email" style={labelStyle}>Email *</label>
              <input
                id="repeat-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
                style={{ ...inputStyle, ...(fieldErrors.email ? inputErrorStyle : {}) }}
              />
              {renderFieldError('email')}
            </div>
          </div>

          <div className="grid-form-fields" style={{ gap: 16, marginBottom: 20 }}>
            <div>
              <label htmlFor="repeat-phone" style={labelStyle}>Phone</label>
              <input
                id="repeat-phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="repeat-nameOfGp" style={labelStyle}>Name of GP *</label>
              <input
                id="repeat-nameOfGp"
                name="nameOfGp"
                type="text"
                value={form.nameOfGp}
                onChange={handleChange}
                placeholder="Your GP's name"
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
                style={{ ...inputStyle, ...(fieldErrors.nameOfGp ? inputErrorStyle : {}) }}
              />
              {renderFieldError('nameOfGp')}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="repeat-address" style={{ ...labelStyle, marginBottom: 6 }}>Address *</label>
            <textarea
              id="repeat-address"
              name="address"
              value={form.address}
              onChange={handleChange}
              rows={2}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
              style={{ ...textareaStyle, marginBottom: 4, ...(fieldErrors.address ? inputErrorStyle : {}) }}
            />
            {renderFieldError('address')}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="repeat-medication" style={{ ...labelStyle, marginBottom: 6 }}>Medication *</label>
            <textarea
              id="repeat-medication"
              name="medication"
              value={form.medication}
              onChange={handleChange}
              placeholder="List all medications with dosages"
              rows={3}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
              style={{ ...textareaStyle, marginBottom: 4, ...(fieldErrors.medication ? inputErrorStyle : {}) }}
            />
            {renderFieldError('medication')}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label htmlFor="repeat-pharmacy" style={{ ...labelStyle, marginBottom: 6 }}>Preferred Pharmacy *</label>
            <input
              id="repeat-pharmacy"
              name="pharmacy"
              type="text"
              value={form.pharmacy}
              onChange={handleChange}
              placeholder="Pharmacy name and address"
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
              style={{ ...inputStyle, marginBottom: 4, ...(fieldErrors.pharmacy ? inputErrorStyle : {}) }}
            />
            {renderFieldError('pharmacy')}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="repeat-additionalInfo" style={{ ...labelStyle, marginBottom: 6 }}>Additional Information</label>
            <textarea
              id="repeat-additionalInfo"
              name="additionalInfo"
              value={form.additionalInfo}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes for your GP"
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
              style={{ ...textareaStyle, marginBottom: 0 }}
            />
          </div>

          <fieldset style={{ border: 'none', padding: 0, marginBottom: 24 }}>
            <legend style={{ ...labelStyle, marginBottom: 10 }}>Are you a private patient?</legend>
            <div style={{ display: 'flex', gap: 28 }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                color: colors.gray700,
                cursor: 'pointer',
                fontFamily: "'Barlow', sans-serif",
              }}>
                <input
                  type="radio"
                  id="repeat-isPrivatePatient-no"
                  name="isPrivatePatient"
                  value="no"
                  checked={form.isPrivatePatient === 'no'}
                  onChange={handleChange}
                  style={{ accentColor: colors.primary, width: 16, height: 16 }}
                />
                No (NHS Patient)
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 14,
                color: colors.gray700,
                cursor: 'pointer',
                fontFamily: "'Barlow', sans-serif",
              }}>
                <input
                  type="radio"
                  id="repeat-isPrivatePatient-yes"
                  name="isPrivatePatient"
                  value="yes"
                  checked={form.isPrivatePatient === 'yes'}
                  onChange={handleChange}
                  style={{ accentColor: colors.primary, width: 16, height: 16 }}
                />
                Yes (Private Patient)
              </label>
            </div>
          </fieldset>

          <label htmlFor="repeat-consent" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginBottom: 8,
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              id="repeat-consent"
              name="consent"
              checked={form.consent}
              onChange={handleChange}
              style={{ marginTop: 3, width: 18, height: 18, accentColor: colors.primary }}
            />
            <span style={{
              fontSize: 14,
              color: colors.gray600,
              lineHeight: 1.5,
              fontFamily: "'Barlow', sans-serif",
            }}>
              I confirm that the information provided is accurate and I consent to the processing of this repeat prescription request.
            </span>
          </label>
          {renderFieldError('consent')}

          <div style={{ height: 20 }} />

          <button type="submit" disabled={submitting} style={{
            width: '100%',
            padding: '14px 0',
            backgroundColor: submitting ? colors.gray300 : colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: "'Barlow', sans-serif",
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => { if (!submitting) e.target.style.backgroundColor = '#0d1147' }}
          onMouseOut={(e) => { if (!submitting) e.target.style.backgroundColor = colors.primary }}
          >
            {submitting ? 'Submitting...' : 'Submit Prescription Request'}
          </button>
        </form>
      </div>
    </div>
  )
}
