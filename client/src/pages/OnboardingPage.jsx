import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getFormTemplates, saveOnboarding, updateProfile, uploadAvatar, deleteAvatar } from '../api'
import { extractArray } from '../utils/api-helpers'
import { buildInitialValues, validateFields, flattenMedicalProfile } from '../utils/form-utils'
import { renderField } from '../utils/form-renderer'
import { useAuth } from '../context/AuthContext'
import colors from '../utils/colors'

const ONBOARDING_CODES = ['FM-001', 'FM-002', 'FM-007']

const STEP_SUMMARIES = {
  'FM-001': 'Your basic details, emergency contact and insurance provider.',
  'FM-002': 'Allergies, medications, chronic conditions and lifestyle — so your doctor sees your full picture.',
  'FM-007': 'Your insurance provider, policy and coverage information.',
}

function statusBadge(status) {
  return {
    pending: { label: 'Pending', color: colors.warning, bg: colors.warningLight },
    in_progress: { label: 'In progress', color: colors.warning, bg: colors.warningLight },
    complete: { label: 'Complete', color: colors.green, bg: colors.successLight },
    skipped: { label: 'Skipped', color: colors.gray600, bg: colors.gray100 },
  }[status] || { label: status || 'Unknown', color: colors.gray600, bg: colors.gray100 }
}

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [started, setStarted] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [entries, setEntries] = useState([])
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const photoInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await getFormTemplates()
        const all = extractArray(res.data, 'forms')
        const picked = ONBOARDING_CODES
          .map((code) => all.find((t) => t.form_code === code))
          .filter(Boolean)
        if (picked.length === 0) throw new Error('No onboarding forms are configured. Please contact the administrator.')
        if (cancelled) return
        setEntries(picked.map((tpl) => ({ tpl, values: buildInitialValues(tpl, user), errors: {} })))
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load onboarding forms.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totalSteps = entries.length + 1
  const isPhotoStep = stepIndex === 0
  const current = isPhotoStep ? null : entries[stepIndex - 1]

  const handleChange = (key, val) => {
    setEntries((prev) => prev.map((entry, i) => {
      if (i !== stepIndex) return entry
      const errors = { ...entry.errors }
      if (errors[key]) delete errors[key]
      return { ...entry, values: { ...entry.values, [key]: val }, errors }
    }))
  }

  const validateStep = () => {
    if (!current) return false
    const errs = validateFields(current.tpl.fields, current.values)
    setEntries((prev) => prev.map((entry, i) => (i === stepIndex ? { ...entry, errors: errs } : entry)))
    if (Object.keys(errs).length > 0) {
      setError('Please complete the required fields highlighted below.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return false
    }
    setError('')
    return true
  }

  const handleNext = () => {
    if (isPhotoStep) {
      setError('')
      setStepIndex((i) => Math.min(i + 1, totalSteps - 1))
      return
    }
    if (!validateStep()) return
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1))
  }

  const handleBack = () => {
    setError('')
    setStepIndex((i) => Math.max(i - 1, 0))
  }

  const handleSkip = async () => {
    try {
      await updateProfile({ onboarding_status: 'skipped' })
      await refreshUser()
    } catch (err) {
      console.error('Failed to skip onboarding:', err)
    }
    navigate('/dashboard', { replace: true })
  }

  const handleAvatarPick = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file (JPG or PNG).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Photo must be 5 MB or smaller.')
      return
    }
    setAvatarError('')
    setAvatarUploading(true)
    try {
      const url = await uploadAvatar(file)
      await updateProfile({ avatar_url: url })
      setAvatarPreview(url)
    } catch (err) {
      console.error('Avatar upload failed:', err)
      setAvatarError(err.message || 'Failed to upload photo. Please try again.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleAvatarRemove = async () => {
    setAvatarError('')
    setAvatarUploading(true)
    try {
      await deleteAvatar()
      await updateProfile({ avatar_url: null })
      setAvatarPreview(null)
    } catch (err) {
      console.error('Avatar remove failed:', err)
      setAvatarError(err.message || 'Failed to remove photo. Please try again.')
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleFinish = async () => {
    if (!validateStep()) return
    setSaving(true)
    try {
      const medical_profile = flattenMedicalProfile(entries)
      await saveOnboarding({
        medical_profile,
        forms: entries.map((e) => ({ template_id: e.tpl.id, data: e.values })),
      })
      await refreshUser()
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error('Failed to save onboarding:', err)
      setError(err.message || 'Failed to save your medical profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '96px 24px', textAlign: 'center', color: colors.gray500 }} role="status" aria-live="polite">
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        Loading your medical profile...
      </div>
    )
  }

  if (done) {
    const { label, color, bg } = statusBadge('complete')
    return (
      <div style={{ padding: '64px 24px', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: colors.successLight, color: colors.green, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          &#10003;
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>Medical Profile Complete</h1>
        <p style={{ fontSize: 15, color: colors.gray500, lineHeight: 1.6, marginBottom: 8 }}>
          Your details have been saved to your digital medical record. All downloadable forms will now be auto-filled from this profile.
        </p>
        <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, color, backgroundColor: bg, marginBottom: 28 }}>
          {label}
        </span>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" style={{ padding: '12px 24px', backgroundColor: colors.primary, color: colors.white, borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Go to Dashboard
          </Link>
          <Link to="/forms" style={{ padding: '12px 24px', backgroundColor: colors.gray100, color: colors.gray700, border: `1px solid ${colors.gray300}`, borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Browse Forms
          </Link>
        </div>
      </div>
    )
  }

  /* ── Welcome screen ── */
  if (!started) {
    return (
      <div style={{ padding: '56px 24px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ backgroundColor: colors.white, borderRadius: 16, border: `1px solid ${colors.gray200}`, padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🩺</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>Complete Your Medical Profile</h1>
          <p style={{ fontSize: 15, color: colors.gray500, lineHeight: 1.7, marginBottom: 28 }}>
            Fill in your health details once — it takes about 3 minutes. Your answers are stored in your secure digital
            medical record, so every form is auto-filled and ready to submit or download whenever you need it.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', marginBottom: 32 }}>
            {entries.map((entry, i) => (
              <div key={entry.tpl.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 16, borderRadius: 12, border: `1px solid ${colors.gray200}`, backgroundColor: colors.gray50 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: colors.primary, color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: colors.gray900, margin: '0 0 4px' }}>
                    {entry.tpl.icon || ''} {entry.tpl.title}
                  </h3>
                  <p style={{ fontSize: 13, color: colors.gray500, margin: 0, lineHeight: 1.5 }}>
                    {STEP_SUMMARIES[entry.tpl.form_code] || entry.tpl.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: colors.dangerLight, border: `1px solid ${colors.dangerBorder}`, color: colors.danger, fontSize: 14, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setStarted(true)} className="btn btn-primary" style={{ padding: '13px 32px', fontSize: 15, fontWeight: 700 }}>
              Start Now
            </button>
            <button onClick={handleSkip} style={{ padding: '13px 24px', backgroundColor: colors.gray100, color: colors.gray700, border: `1px solid ${colors.gray300}`, borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Complete Later
            </button>
          </div>
          <p style={{ fontSize: 12, color: colors.gray400, marginTop: 16 }}>
            Your information is private and only shared with the hospital staff who treat you.
          </p>
        </div>
      </div>
    )
  }

  /* ── Wizard ── */
  const progress = ((stepIndex + 1) / totalSteps) * 100
  const isLast = stepIndex === totalSteps - 1
  const stepTitle = isPhotoStep ? 'Profile Photo' : current?.tpl.title

  return (
    <div style={{ padding: '40px 24px', maxWidth: 820, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: colors.gray900, margin: 0 }}>Medical Profile</h1>
          <p style={{ fontSize: 14, color: colors.gray500, margin: '4px 0 0' }}>
            Step {stepIndex + 1} of {totalSteps} · {stepTitle}
          </p>
        </div>
        <button onClick={handleSkip} style={{ background: 'none', border: 'none', fontSize: 14, color: colors.gray500, cursor: 'pointer', textDecoration: 'underline' }}>
          Complete later
        </button>
      </div>

      {/* Progress bar */}
      <div role="progressbar" aria-valuenow={stepIndex + 1} aria-valuemin={1} aria-valuemax={totalSteps} style={{ height: 8, borderRadius: 999, backgroundColor: colors.gray200, marginBottom: 28, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, backgroundColor: colors.primary, transition: 'width 0.3s ease' }} />
      </div>

      {error && (
        <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: colors.dangerLight, border: `1px solid ${colors.dangerBorder}`, color: colors.danger, fontSize: 14, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div style={{ backgroundColor: colors.white, borderRadius: 14, border: `1px solid ${colors.gray200}`, padding: 32 }}>
        {isPhotoStep ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                backgroundColor: colors.gray100,
                border: `3px solid ${colors.gray200}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: 20,
              }}
            >
              {avatarUploading ? (
                <div className="spinner" style={{ width: 30, height: 30 }} aria-label="Uploading" />
              ) : avatarPreview ? (
                <img src={avatarPreview} alt="Profile photo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 48, color: colors.gray400 }} aria-hidden="true">👤</span>
              )}
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.gray900, margin: '0 0 6px' }}>Add a profile photo</h3>
            <p style={{ fontSize: 14, color: colors.gray500, margin: '0 0 24px', maxWidth: 430, lineHeight: 1.6 }}>
              Optional — add a clear photo so our staff can recognize you. You can skip this or change it later from your profile.
            </p>

            {avatarError && (
              <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: colors.dangerLight, border: `1px solid ${colors.dangerBorder}`, color: colors.danger, fontSize: 14, marginBottom: 20, maxWidth: 430 }}>
                {avatarError}
              </div>
            )}

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => { handleAvatarPick(e.target.files?.[0]); e.target.value = '' }}
            />

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => photoInputRef.current?.click()}
                disabled={avatarUploading}
                style={{
                  padding: '12px 24px',
                  backgroundColor: avatarUploading ? colors.gray300 : colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: avatarUploading ? 'not-allowed' : 'pointer',
                }}
              >
                {avatarUploading ? 'Uploading...' : avatarPreview ? 'Change Photo' : 'Upload Photo'}
              </button>
              {avatarPreview && (
                <button
                  onClick={handleAvatarRemove}
                  disabled={avatarUploading}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: colors.gray100,
                    color: colors.gray700,
                    border: `1px solid ${colors.gray300}`,
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: avatarUploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <span style={{ fontSize: 28 }} aria-hidden="true">{current?.tpl.icon}</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.gray900, margin: 0 }}>{current?.tpl.title}</h2>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: colors.gray500, marginBottom: 20 }}>
              {current?.tpl.form_code && <span>Form Code: <strong>{current?.tpl.form_code}</strong></span>}
              {current?.tpl.revision && <span>Revision: <strong>{current?.tpl.revision}</strong></span>}
            </div>
            <p style={{ fontSize: 14, color: colors.gray600, lineHeight: 1.6, marginBottom: 24 }}>
              {current?.tpl.description}
            </p>

            <div className="grid-form-fields" style={{ gap: 16 }}>
              {(current?.tpl.fields || []).map((field) => (
                <div key={field.key} style={field.full ? { gridColumn: '1 / -1' } : {}}>
                  {renderField(field, current.values[field.key], handleChange, current.errors)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, flexWrap: 'wrap', gap: 12 }}>
        <button
          onClick={handleBack}
          disabled={stepIndex === 0}
          style={{
            padding: '12px 24px',
            backgroundColor: stepIndex === 0 ? colors.gray200 : colors.gray100,
            color: stepIndex === 0 ? colors.gray400 : colors.gray700,
            border: `1px solid ${colors.gray300}`,
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: stepIndex === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          &larr; Back
        </button>
        {isLast ? (
          <button
            onClick={handleFinish}
            disabled={saving}
            style={{
              padding: '13px 32px',
              backgroundColor: saving ? colors.gray300 : colors.green,
              color: colors.white,
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : '✓ Save & Finish'}
          </button>
        ) : (
          <button onClick={handleNext} style={{ padding: '13px 32px', backgroundColor: colors.primary, color: colors.white, border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            Continue &rarr;
          </button>
        )}
      </div>
    </div>
  )
}
