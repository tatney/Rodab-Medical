import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { dispatchAmbulance, cancelAmbulanceRequest, getAmbulanceHistory, getActiveEmergencies } from '../api'
import { getSmartLocation, reverseGeocode } from '../utils/geolocation'
import { useAuth } from '../context/AuthContext'
import SEO from '../components/SEO'

const colors = {
  primary: '#1e40af',
  red: '#dc2626',
  redDark: '#991b1b',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
  green: '#16a34a',
  yellow: '#f59e0b',
}

const emergencyLevels = [
  { value: 'critical', label: 'Critical - Life Threatening', color: colors.red },
  { value: 'urgent', label: 'Urgent - Serious Condition', color: colors.yellow },
  { value: 'standard', label: 'Standard - Non-Urgent', color: colors.green },
]

const statusColors = {
  pending: colors.yellow,
  dispatched: colors.primary,
  en_route: '#7c3aed',
  arrived: colors.green,
  completed: colors.gray500,
  cancelled: colors.red,
}

export default function AmbulancePage() {
  const { user } = useAuth()
  const [activeRequests, setActiveRequests] = useState([])
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])
  const [form, setForm] = useState({
    patientName: '',
    contactPhone: '',
    location: '',
    destination: '',
    emergencyLevel: 'urgent',
    condition: '',
    latitude: '',
    longitude: '',
  })
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const autoLocationDone = useRef(false)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        patientName: prev.patientName || user.full_name || '',
        contactPhone: prev.contactPhone || user.phone || '',
      }))
    }
  }, [user])

  useEffect(() => {
    if (autoLocationDone.current || !user) return
    autoLocationDone.current = true
    setLocating(true)
    getSmartLocation()
      .then(async (pos) => {
        setCoords({ lat: pos.lat, lng: pos.lng })
        setForm((prev) => ({
          ...prev,
          latitude: String(pos.lat),
          longitude: String(pos.lng),
        }))
        const addr = await reverseGeocode(pos.lat, pos.lng)
        setForm((prev) => ({ ...prev, location: addr }))
      })
      .catch(() => {})
      .finally(() => setLocating(false))
  }, [user])

  const handleUseLocation = async () => {
    setLocating(true)
    try {
      const pos = await getSmartLocation()
      setCoords({ lat: pos.lat, lng: pos.lng })
      setForm((prev) => ({
        ...prev,
        latitude: String(pos.lat),
        longitude: String(pos.lng),
      }))
      const addr = await reverseGeocode(pos.lat, pos.lng)
      setForm((prev) => ({ ...prev, location: addr }))
    } catch {
      setError('Could not detect location. Please enter coordinates manually.')
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
        pickup_address: form.location,
        destination_address: form.destination,
        emergency_level: form.emergencyLevel,
        notes: form.condition,
        latitude: form.latitude ? Number(form.latitude) : coords?.lat,
        longitude: form.longitude ? Number(form.longitude) : coords?.lng,
        patient_name: form.patientName || user?.full_name || '',
        contact_phone: form.contactPhone || user?.phone || '',
      }
      const res = await dispatchAmbulance(payload)
      const id = res.data?.id || res.data?.request?.id || ''
      setTrackingId(id)
      setSuccess(true)
      loadActive()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Dispatch failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const loadActive = async () => {
    try {
      const res = await getActiveEmergencies()
      setActiveRequests(res.data?.emergencies || res.data || [])
    } catch { /* ignore */ }
  }

  const loadHistory = async () => {
    try {
      const res = await getAmbulanceHistory()
      setHistory(res.data?.history || res.data || [])
    } catch { /* ignore */ }
  }

  const handleCancel = async () => {
    if (!trackingId || !window.confirm('Are you sure you want to cancel this ambulance request?')) return
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

  useEffect(() => {
    loadActive()
    loadHistory()
  }, [])

  useEffect(() => {
    if (mapReady || activeRequests.length === 0) return
    loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js').then(() => {
      loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')
      const tryInit = (attempts) => {
        if (attempts <= 0) return
        if (window.L && document.getElementById('ambulance-map')) {
          initMap()
        } else {
          setTimeout(() => tryInit(attempts - 1), 500)
        }
      }
      setTimeout(() => tryInit(5), 300)
    })
  }, [activeRequests, mapReady])

  function loadScript(src) {
    return new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
      const s = document.createElement('script')
      s.src = src
      s.onload = resolve
      document.head.appendChild(s)
    })
  }

  function loadCSS(href) {
    if (document.querySelector(`link[href="${href}"]`)) return
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = href
    document.head.appendChild(l)
  }

  function initMap() {
    if (map || !window.L) return
    const container = document.getElementById('ambulance-map')
    if (!container) return
    const m = window.L.map(container).setView([33.8938, 35.5018], 11)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(m)
    setMap(m)
    setMapReady(true)
  }

  useEffect(() => {
    if (!map) return
    markers.forEach((mk) => map.removeLayer(mk))
    const newMarkers = []
    activeRequests.forEach((req) => {
      const lat = req.latitude || req.lat
      const lng = req.longitude || req.lng
      if (lat && lng) {
        const color = statusColors[req.status] || colors.gray500
        const icon = window.L.divIcon({
          html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
          className: '',
          iconSize: [14, 14],
        })
        const mk = window.L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${req.patient_name || 'Patient'}</strong><br/>Status: ${req.status || 'unknown'}`)
        newMarkers.push(mk)
      }
    })
    setMarkers(newMarkers)
  }, [map, activeRequests])

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

  if (!user) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <SEO title="Ambulance Services" description="24/7 emergency ambulance services with GPS tracking and rapid response teams at Rodab Medical." url="/ambulance" />
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
            &#128657;
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>
            Sign Up to Request an Ambulance
          </h1>
          <p style={{ fontSize: 16, color: colors.gray500, lineHeight: 1.7, marginBottom: 32, maxWidth: 420, margin: '0 auto 32px' }}>
            Create a free account to dispatch emergency ambulance services, track your request in real-time, and access your medical history.
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
            For immediate life-threatening emergencies, also call <strong>111</strong>
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    if (cancelled) {
      return (
        <div style={{ padding: '64px 24px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#fef2f2', color: colors.red, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }} aria-hidden="true">
            &#10005;
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>Request Cancelled</h2>
          <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 24 }}>Your ambulance request has been cancelled successfully.</p>
          <Link to="/ambulance" style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: colors.primary, color: colors.white, borderRadius: 8, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
            New Request
          </Link>
        </div>
      )
    }
    return (
      <div style={{ padding: '64px 24px', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#dcfce7', color: colors.green, fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }} aria-hidden="true">
          &#10003;
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.gray900, marginBottom: 12 }}>Ambulance Dispatched!</h2>
        <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 24 }}>Help is on the way. Keep your phone close.</p>
        {trackingId && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Link to={`/track/${trackingId}`} style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: colors.red, color: colors.white, borderRadius: 8, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>
              Track Ambulance
            </Link>
            <button onClick={handleCancel} disabled={cancelling} style={{ padding: '10px 24px', backgroundColor: 'transparent', color: colors.red, border: `1px solid ${colors.red}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.6 : 1 }}>
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </button>
          </div>
        )}
        {error && (
          <p style={{ fontSize: 14, color: colors.red, marginTop: 12 }}>{error}</p>
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '48px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <SEO title="Ambulance Services" description="24/7 emergency ambulance services with GPS tracking and rapid response teams at Rodab Medical." url="/ambulance" />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 32 }}>Ambulance Dispatch</h1>

      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: colors.red, fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="grid-2-col" style={{ gap: 40 }}>
        {/* Form */}
        <form onSubmit={handleSubmit} style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 32 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.gray900, marginBottom: 20 }}>Patient Information</h3>

          <label htmlFor="ambulance-patient-name" style={labelStyle}>Patient Name</label>
          <input id="ambulance-patient-name" name="patientName" type="text" required value={form.patientName} onChange={handleChange} placeholder="Full name" style={{ ...inputStyle, marginBottom: 16 }} />

          <label htmlFor="ambulance-contact-phone" style={labelStyle}>Contact Phone</label>
          <input id="ambulance-contact-phone" name="contactPhone" type="tel" required value={form.contactPhone} onChange={handleChange} placeholder="+256 7XX XXX XXX" style={{ ...inputStyle, marginBottom: 16 }} />

          <label htmlFor="ambulance-location" style={labelStyle}>Location</label>
          <div className="location-row">
              <input id="ambulance-location" name="location" type="text" required value={form.location} onChange={handleChange} placeholder="Pickup address" style={{ ...inputStyle, flex: 1 }} />
            <button type="button" onClick={handleUseLocation} disabled={locating} style={{ padding: '12px 14px', borderRadius: 8, border: `1px solid ${colors.primary}`, backgroundColor: '#dbeafe', color: colors.primary, fontSize: 12, fontWeight: 600, cursor: locating ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {locating ? '...' : 'Use My Location'}
            </button>
          </div>

          <label htmlFor="ambulance-destination" style={labelStyle}>Destination Hospital</label>
          <input id="ambulance-destination" name="destination" type="text" value={form.destination} onChange={handleChange} placeholder="Preferred hospital" style={{ ...inputStyle, marginBottom: 16 }} />

          <label htmlFor="ambulance-emergency-level" style={labelStyle}>Emergency Level</label>
          <select id="ambulance-emergency-level" name="emergencyLevel" value={form.emergencyLevel} onChange={handleChange} style={{ ...inputStyle, marginBottom: 16, cursor: 'pointer' }}>
            {emergencyLevels.map((lv) => (
              <option key={lv.value} value={lv.value}>{lv.label}</option>
            ))}
          </select>

          <label htmlFor="ambulance-condition" style={labelStyle}>Patient Condition</label>
          <textarea id="ambulance-condition" name="condition" value={form.condition} onChange={handleChange} placeholder="Describe the patient's condition..." rows={3} style={{ ...inputStyle, marginBottom: 16, resize: 'vertical', fontFamily: 'inherit' }} />

          <div className="grid-form-fields" style={{ gap: 12, marginBottom: 24 }}>
            <div>
              <label htmlFor="ambulance-latitude" style={labelStyle}>Latitude</label>
              <input id="ambulance-latitude" name="latitude" type="number" step="any" value={form.latitude} onChange={handleChange} placeholder="33.8938" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="ambulance-longitude" style={labelStyle}>Longitude</label>
              <input id="ambulance-longitude" name="longitude" type="number" step="any" value={form.longitude} onChange={handleChange} placeholder="35.5018" style={inputStyle} />
            </div>
          </div>

          <button type="submit" disabled={submitting} style={{ width: '100%', padding: '13px 0', backgroundColor: submitting ? colors.gray300 : colors.red, color: colors.white, border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {submitting && <span style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            {submitting ? 'Dispatching...' : 'Dispatch Ambulance'}
          </button>
        </form>

        {/* Right column: Map + History */}
        <div>
          {/* Map */}
        <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, overflow: 'hidden', marginBottom: 24 }}>
            <div id="ambulance-map" aria-label="Ambulance tracking map" style={{ width: '100%', height: 300, backgroundColor: colors.gray100 }} />
          </div>

          {/* Emergency Instructions */}
          <div style={{ backgroundColor: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', padding: 24, marginBottom: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: colors.red, marginBottom: 12 }}>Emergency Instructions</h4>
            <ul style={{ fontSize: 14, color: colors.gray700, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>Stay calm and keep the patient comfortable</li>
              <li>Do not move the patient unless they are in immediate danger</li>
              <li>Keep the airway clear and monitor breathing</li>
              <li>Have someone guide the ambulance to your location</li>
              <li>Gather the patient's medications list if available</li>
            </ul>
            <div style={{ marginTop: 16, padding: 12, backgroundColor: colors.white, borderRadius: 8 }}>
              <p style={{ fontSize: 14, color: colors.gray700, margin: 0 }}>
                <strong>Emergency Numbers:</strong> Ambulance: <strong>111</strong> &nbsp;|&nbsp; Fire: <strong>175</strong> &nbsp;|&nbsp; Police: <strong>112</strong>
              </p>
            </div>
          </div>

          {/* Active Requests */}
          <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 24 }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: colors.gray900, marginBottom: 12 }}>Active Requests ({activeRequests.length})</h4>
            {activeRequests.length === 0 ? (
              <p style={{ fontSize: 14, color: colors.gray500 }}>No active emergency requests.</p>
            ) : (
              activeRequests.slice(0, 5).map((req) => (
                <div key={req.id} style={{ padding: '10px 0', borderBottom: `1px solid ${colors.gray100}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.gray900 }}>{req.patient_name || 'Patient'}</div>
                    <div style={{ fontSize: 12, color: colors.gray500 }}>{req.location || 'Location pending'}</div>
                  </div>
                  <span style={{ padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: colors.white, backgroundColor: statusColors[req.status] || colors.gray500 }}>
                    {req.status || 'pending'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* History Toggle */}
          <button
            aria-expanded={showHistory}
            aria-controls="ambulance-history-panel"
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) loadHistory() }}
            style={{ marginTop: 16, padding: '10px 20px', backgroundColor: colors.white, border: `1px solid ${colors.gray300}`, borderRadius: 8, fontSize: 14, fontWeight: 600, color: colors.gray700, cursor: 'pointer', width: '100%' }}
          >
            {showHistory ? 'Hide History' : 'Show Request History'}
          </button>
          {showHistory && (
            <div id="ambulance-history-panel" role="region" aria-labelledby="ambulance-history-heading" style={{ marginTop: 12, backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 24 }}>
              <h4 id="ambulance-history-heading" style={{ fontSize: 16, fontWeight: 700, color: colors.gray900, marginBottom: 12 }}>Request History</h4>
              {history.length === 0 ? (
                <p style={{ fontSize: 14, color: colors.gray500 }}>No past requests.</p>
              ) : (
                history.map((req) => (
                  <div key={req.id} style={{ padding: '10px 0', borderBottom: `1px solid ${colors.gray100}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: colors.gray900 }}>{req.patient_name}</span>
                      <span style={{ fontSize: 12, color: colors.gray500 }}>{new Date(req.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style={{ fontSize: 13, color: colors.gray500 }}>{req.location}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
