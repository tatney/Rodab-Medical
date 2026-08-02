import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { dispatchAmbulanceGuest, cancelAmbulanceRequest } from '../api'
import { getSmartLocation, reverseGeocode } from '../utils/geolocation'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'

const cardStyle = {
  maxWidth: 480,
  width: '100%',
  backgroundColor: 'var(--surface-card)',
  borderRadius: 16,
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-md)',
  padding: 48,
  textAlign: 'center',
}

export default function SOSPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [form, setForm] = useState({
    patientName: '',
    contactPhone: '',
    location: '',
    destination: '',
  })
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleUseLocation = async () => {
    setLocating(true)
    try {
      const pos = await getSmartLocation()
      setCoords({ lat: pos.lat, lng: pos.lng })
      const addr = await reverseGeocode(pos.lat, pos.lng)
      setForm((prev) => ({ ...prev, location: addr }))
    } catch {
      setError(t('sos.couldNotDetect'))
    } finally {
      setLocating(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        guest_name: form.patientName,
        guest_phone: form.contactPhone,
        pickup_address: form.location,
        destination_address: form.destination || 'Rodab Medical Hospital',
        latitude: coords?.lat,
        longitude: coords?.lng,
        emergency_level: 'urgent',
      }
      const res = await dispatchAmbulanceGuest(payload)
      const id = res.data?.id || res.data?.request?.id || res.data?.tracking_id || ''
      setTrackingId(id)
      setSuccess(true)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || t('sos.failedSos')
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!trackingId || !window.confirm(t('sos.cancelConfirm'))) return
    setCancelling(true)
    try {
      await cancelAmbulanceRequest(trackingId)
      setCancelled(true)
    } catch (err) {
      setError(err.message || t('sos.failedSos'))
    } finally {
      setCancelling(false)
    }
  }

  if (success) {
    if (cancelled) {
      return (
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div style={cardStyle}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: 'var(--error-soft)',
                color: 'var(--error)',
                fontSize: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
              }}
              aria-hidden="true"
            >
              &#10005;
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 12 }}>
              {t('sos.cancelledTitle')}
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              {t('sos.cancelledMsg')}
            </p>
            <Link
              to="/sos"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: 'var(--error)',
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              {t('sos.newSosRequest')}
            </Link>
          </div>
        </div>
      )
    }
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={cardStyle}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: 'var(--success-soft)',
              color: 'var(--status-success)',
              fontSize: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
            aria-hidden="true"
          >
            &#10003;
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 12 }}>
            {t('sos.helpOnTheWay')}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
            {t('sos.dispatchedMsg')}
          </p>
          {trackingId && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>{t('sos.trackingId')}</p>
              <Link
                to={`/track/${trackingId}`}
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: 'var(--error)',
                  color: '#ffffff',
                  borderRadius: 8,
                  fontSize: 18,
                  fontWeight: 700,
                  textDecoration: 'none',
                  letterSpacing: 1,
                }}
              >
                {t('sos.trackAmbulance')}
              </Link>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
                {t('sos.link')} {window.location.origin}/track/{trackingId}
              </p>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  marginTop: 16,
                  padding: '10px 24px',
                  backgroundColor: 'transparent',
                  color: 'var(--error)',
                  border: '1px solid var(--error)',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? t('common.cancelling') : t('sos.cancelSos')}
              </button>
            </div>
          )}
          {error && (
            <p style={{ fontSize: 14, color: 'var(--error)', marginTop: 12 }}>{error}</p>
          )}
          <div
            style={{
              padding: 16,
              backgroundColor: 'var(--error-soft)',
              borderRadius: 8,
              border: '1px solid var(--error-border)',
              marginTop: 16,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--error)', marginBottom: 4 }}>
              {t('sos.emergencyContacts')}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-body)' }}>
              {t('sos.ambulance')} <strong>111</strong> &nbsp;|&nbsp; {t('sos.hospital')} <strong>+256 706 560 730</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={cardStyle}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: 'var(--error-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 40,
            }}
            aria-hidden="true"
          >
            &#128680;
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 12 }}>
            {t('sos.emergencySos')}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
            {t('sos.signupOrLogin')}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/signup"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                backgroundColor: 'var(--error)',
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              {t('sos.signUpFree')}
            </Link>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-body)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              {t('sos.login')}
            </Link>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
            {t('sos.forEmergenciesCall').replace('{phone}', '111')}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          backgroundColor: 'var(--surface-card)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          padding: 40,
        }}
      >
        {/* Red header band */}
        <div
          style={{
            backgroundColor: 'var(--error)',
            color: '#ffffff',
            padding: 24,
            borderRadius: 12,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }} aria-hidden="true">&#128680;</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{t('sos.emergencySos')}</h1>
          <p style={{ fontSize: 14, opacity: 0.9 }}>
            {t('sos.requestAmbulance')}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              backgroundColor: 'var(--error-soft)',
              border: '1px solid var(--error-border)',
              color: 'var(--error)',
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="patientName" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>
            {t('sos.patientName')}
          </label>
          <input
            id="patientName"
            name="patientName"
            type="text"
            required
            value={form.patientName}
            onChange={handleChange}
            placeholder={t('sos.patientNamePlaceholder')}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-card)',
              color: 'var(--text-body)',
              fontSize: 15,
              marginBottom: 16,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <label htmlFor="contactPhone" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>
            {t('sos.contactPhone')}
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            required
            value={form.contactPhone}
            onChange={handleChange}
            placeholder={t('sos.contactPhonePlaceholder')}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-card)',
              color: 'var(--text-body)',
              fontSize: 15,
              marginBottom: 16,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <label htmlFor="location" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>
            {t('sos.pickupLocation')}
          </label>
          <div className="location-row">
            <input
              id="location"
              name="location"
              type="text"
              required
              value={form.location}
              onChange={handleChange}
              placeholder={t('sos.pickupPlaceholder')}
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-body)',
                fontSize: 15,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleUseLocation}
              disabled={locating}
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                border: '1px solid var(--error)',
                backgroundColor: 'var(--error-soft)',
                color: 'var(--error)',
                fontSize: 13,
                fontWeight: 600,
                cursor: locating ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {locating ? t('common.locating') : t('sos.useMyLocation')}
            </button>
          </div>

          <label htmlFor="destination" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>
            {t('sos.destinationHospital')}
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            value={form.destination}
            onChange={handleChange}
            placeholder={t('sos.destinationPlaceholder')}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-card)',
              color: 'var(--text-body)',
              fontSize: 15,
              marginBottom: 28,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '14px 0',
              backgroundColor: submitting ? 'var(--border)' : 'var(--error)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 17,
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {submitting && (
              <span
                style={{
                  width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid #fff', borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite', display: 'inline-block',
                }}
              />
            )}
            {submitting ? t('common.sending') : t('sos.sendSos')}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
          {t('sos.forEmergenciesCall').replace('{phone}', '111')}
        </p>
      </div>
    </div>
  )
}
