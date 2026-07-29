import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { dispatchAmbulanceGuest, cancelAmbulanceRequest } from '../api'
import { getSmartLocation, reverseGeocode } from '../utils/geolocation'
import { useAuth } from '../context/AuthContext'

const colors = {
  red: '#dc2626',
  redDark: '#991b1b',
  gray50: '#f9fafb',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
  green: '#16a34a',
}

export default function SOSPage() {
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
      setError('Could not detect location. Please enter it manually.')
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
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to send SOS. Please try again.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!trackingId || !window.confirm('Are you sure you want to cancel this SOS request?')) return
    setCancelling(true)
    try {
      await cancelAmbulanceRequest(trackingId)
      setCancelled(true)
    } catch (err) {
      setError(err.message || 'Failed to cancel request.')
    } finally {
      setCancelling(false)
    }
  }

  if (success) {
    if (cancelled) {
      return (
        <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              backgroundColor: colors.white,
              borderRadius: 16,
              border: `1px solid ${colors.gray200}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              padding: 48,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                backgroundColor: '#fef2f2',
                color: colors.red,
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
            <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>
              SOS Cancelled
            </h2>
            <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 24, lineHeight: 1.6 }}>
              Your emergency request has been cancelled.
            </p>
            <Link
              to="/sos"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: colors.red,
                color: colors.white,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              New SOS Request
            </Link>
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
            backgroundColor: colors.white,
            borderRadius: 16,
            border: `1px solid ${colors.gray200}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            padding: 48,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              backgroundColor: '#dcfce7',
              color: colors.green,
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
          <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>
            Help is on the Way!
          </h2>
          <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 24, lineHeight: 1.6 }}>
            An ambulance has been dispatched to your location. Stay where you are and keep your phone nearby.
          </p>
          {trackingId && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: colors.gray500, marginBottom: 8 }}>Your Tracking ID:</p>
              <Link
                to={`/track/${trackingId}`}
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: colors.red,
                  color: colors.white,
                  borderRadius: 8,
                  fontSize: 18,
                  fontWeight: 700,
                  textDecoration: 'none',
                  letterSpacing: 1,
                }}
              >
                Track Ambulance
              </Link>
              <p style={{ fontSize: 13, color: colors.gray500, marginTop: 12 }}>
                Link: {window.location.origin}/track/{trackingId}
              </p>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  marginTop: 16,
                  padding: '10px 24px',
                  backgroundColor: 'transparent',
                  color: colors.red,
                  border: `1px solid ${colors.red}`,
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  opacity: cancelling ? 0.6 : 1,
                }}
              >
                {cancelling ? 'Cancelling...' : 'Cancel SOS Request'}
              </button>
            </div>
          )}
          {error && (
            <p style={{ fontSize: 14, color: colors.red, marginTop: 12 }}>{error}</p>
          )}
          <div
            style={{
              padding: 16,
              backgroundColor: '#fef2f2',
              borderRadius: 8,
              border: '1px solid #fecaca',
              marginTop: 16,
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 600, color: colors.red, marginBottom: 4 }}>
              Emergency Contacts
            </p>
            <p style={{ fontSize: 13, color: colors.gray700 }}>
              Ambulance: <strong>111</strong> &nbsp;|&nbsp; Hospital: <strong>+961 1 234 567</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div
          style={{
            maxWidth: 520,
            width: '100%',
            backgroundColor: colors.white,
            borderRadius: 16,
            border: `1px solid ${colors.gray200}`,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            padding: 48,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
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
          <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>
            Emergency SOS
          </h1>
          <p style={{ fontSize: 16, color: colors.gray500, lineHeight: 1.7, marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
            Sign up or log in to request an ambulance emergency service, track your request in real-time, and access your medical history.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/signup"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                backgroundColor: colors.red,
                color: colors.white,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              Sign Up Free
            </Link>
            <Link
              to="/login"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                backgroundColor: colors.white,
                color: colors.gray700,
                border: `1px solid ${colors.gray300}`,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background 0.15s',
              }}
            >
              Login
            </Link>
          </div>
          <p style={{ fontSize: 13, color: colors.gray500, marginTop: 24 }}>
            For immediate life-threatening emergencies, call <strong>111</strong>
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
          backgroundColor: colors.white,
          borderRadius: 16,
          border: `1px solid ${colors.gray200}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          padding: 40,
        }}
      >
        {/* Red header band */}
        <div
          style={{
            backgroundColor: colors.red,
            color: colors.white,
            padding: 24,
            borderRadius: 12,
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 8 }} aria-hidden="true">&#128680;</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Emergency SOS</h1>
          <p style={{ fontSize: 14, opacity: 0.9 }}>
            Request an ambulance immediately.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: colors.red,
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="patientName" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
            Patient Name
          </label>
          <input
            id="patientName"
            name="patientName"
            type="text"
            required
            value={form.patientName}
            onChange={handleChange}
            placeholder="Full name of the patient"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 8,
              border: `1px solid ${colors.gray300}`,
              fontSize: 15,
              marginBottom: 16,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <label htmlFor="contactPhone" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
            Contact Phone
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            required
            value={form.contactPhone}
            onChange={handleChange}
            placeholder="+961 XX XXX XXX"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 8,
              border: `1px solid ${colors.gray300}`,
              fontSize: 15,
              marginBottom: 16,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <label htmlFor="location" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
            Pickup Location
          </label>
          <div className="location-row">
            <input
              id="location"
              name="location"
              type="text"
              required
              value={form.location}
              onChange={handleChange}
              placeholder="Address or landmark"
              style={{
                flex: 1,
                padding: '12px 14px',
                borderRadius: 8,
                border: `1px solid ${colors.gray300}`,
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
                border: `1px solid ${colors.red}`,
                backgroundColor: '#fef2f2',
                color: colors.red,
                fontSize: 13,
                fontWeight: 600,
                cursor: locating ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {locating ? 'Locating...' : 'Use My Location'}
            </button>
          </div>

          <label htmlFor="destination" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
            Destination Hospital
          </label>
          <input
            id="destination"
            name="destination"
            type="text"
            value={form.destination}
            onChange={handleChange}
            placeholder="Preferred hospital"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 8,
              border: `1px solid ${colors.gray300}`,
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
              backgroundColor: submitting ? colors.gray300 : colors.red,
              color: colors.white,
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
            {submitting ? 'Sending SOS...' : 'Send Emergency SOS'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: colors.gray500, marginTop: 16 }}>
          For immediate life-threatening emergencies, also call <strong>111</strong>
        </p>
      </div>
    </div>
  )
}
