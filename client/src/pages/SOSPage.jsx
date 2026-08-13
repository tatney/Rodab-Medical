import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  dispatchAmbulance,
  cancelAmbulanceRequest,
  getLiveAmbulances,
  getActiveEmergencies,
  getAllHospitals,
} from '../api'
import { getAccurateLocation, reverseGeocode } from '../utils/geolocation'
import LocationSearch from '../components/LocationSearch'
import Map from '../components/Map'
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

const fullCardStyle = {
  width: '100%',
  backgroundColor: 'var(--surface-card)',
  borderRadius: 16,
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-md)',
  padding: 28,
  boxSizing: 'border-box',
}

const fieldStyle = {
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
}

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--text-body)',
}

const MAP_CENTER = [0.3476, 32.5825]
const MAP_ZOOM = 12
const MAX_HISTORY = 120

function haversineMeters(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return null
  const R = 6371000
  const toRad = (v) => (v * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * R * Math.asin(Math.sqrt(a))
}

export default function SOSPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [form, setForm] = useState({
    location: '',
    destination: '',
    emergencyLevel: 'critical',
    condition: '',
  })
  const [coords, setCoords] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locSource, setLocSource] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [trackingId, setTrackingId] = useState('')
  const [error, setError] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)

  // Live fleet map state
  const [emergencies, setEmergencies] = useState([])
  const [liveDrivers, setLiveDrivers] = useState([])
  const [liveStats, setLiveStats] = useState({})
  const [hospitals, setHospitals] = useState([])
  const [mapFailed, setMapFailed] = useState(false)
  const autoLocationDone = useRef(false)
  const historyRef = useRef({})

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Auto-detect the patient location on page load (no button press needed).
  useEffect(() => {
    if (autoLocationDone.current) return
    autoLocationDone.current = true
    setLocating(true)
    getAccurateLocation()
      .then(async (pos) => {
        setCoords({ lat: pos.lat, lng: pos.lng })
        setLocSource(pos.source === 'gps' ? 'gps' : 'cached')
        const addr = await reverseGeocode(pos.lat, pos.lng)
        setForm((prev) => ({ ...prev, location: addr }))
      })
      .catch(() => {
        setLocSource('')
      })
      .finally(() => setLocating(false))
  }, [])

  const handleUseMyLocation = async () => {
    setError('')
    setLocating(true)
    try {
      const pos = await getAccurateLocation()
      setCoords({ lat: pos.lat, lng: pos.lng })
      setLocSource(pos.source === 'gps' ? 'gps' : 'cached')
      const addr = await reverseGeocode(pos.lat, pos.lng)
      setForm((prev) => ({ ...prev, location: addr }))
    } catch {
      setLocSource('')
      setError(t('sos.couldNotDetect'))
    } finally {
      setLocating(false)
    }
  }

  const handlePickLocation = (item) => {
    if (!item || item.lat == null || item.lng == null) return
    setCoords({ lat: item.lat, lng: item.lng })
    setLocSource('search')
    setForm((prev) => ({ ...prev, location: item.label }))
  }

  const fetchLive = useCallback(async () => {
    const [emRes, drRes, hospRes] = await Promise.allSettled([
      getActiveEmergencies(),
      getLiveAmbulances(),
      getAllHospitals(),
    ])

    if (emRes.status === 'fulfilled') {
      const data = emRes.value?.data || {}
      setEmergencies(data.active || data.emergencies || data.rides || [])
    }

    if (drRes.status === 'fulfilled') {
      const data = drRes.value?.data || {}
      const raw = data.drivers || []
      const now = Date.now()
      const nextStats = {}

      raw.forEach((d) => {
        const lat = d.latitude
        const lng = d.longitude
        if (lat == null || lng == null || d.id == null) return

        const hist = historyRef.current[d.id] || []
        hist.push({ lat, lng, ts: now })
        if (hist.length > MAX_HISTORY) hist.splice(0, hist.length - MAX_HISTORY)
        historyRef.current[d.id] = hist

        let moving = null
        const prev = hist[hist.length - 2]
        if (prev) {
          const dtSec = (now - prev.ts) / 1000
          const distM = haversineMeters(prev.lat, prev.lng, lat, lng) || 0
          if (dtSec > 0) moving = (distM / dtSec) * 3.6 >= 2
        }

        nextStats[d.id] = {
          moving,
          lastUpdate: d.last_location_update,
        }
      })

      setLiveDrivers(raw)
      setLiveStats(nextStats)
      setMapFailed(false)
    } else {
      setMapFailed(true)
    }

    if (hospRes.status === 'fulfilled') {
      const data = hospRes.value?.data || {}
      setHospitals(data.hospitals || [])
    }
  }, [])

  useEffect(() => {
    if (!user) return
    fetchLive()
    const iv = setInterval(fetchLive, 5000)
    return () => clearInterval(iv)
  }, [fetchLive, user])

  const activeDriverIds = useMemo(() => {
    const s = new Set()
    emergencies.forEach((e) => {
      if (e.driver_id) s.add(e.driver_id)
    })
    return s
  }, [emergencies])

  const hospitalMarkers = useMemo(
    () =>
      hospitals
        .filter((h) => h.latitude && h.longitude)
        .map((h) => ({
          id: h.id || h._id,
          lat: h.latitude,
          lng: h.longitude,
          name: h.name,
          address: h.address,
        })),
    [hospitals]
  )

  const driverMarkers = useMemo(
    () =>
      liveDrivers
        .map((d) => {
          const lat = d.latitude
          const lng = d.longitude
          if (lat == null || lng == null || d.id == null) return null

          const isOnRide = activeDriverIds.has(d.id)
          const available = d.is_available
          const color = isOnRide ? '#dc2626' : available ? '#16a34a' : '#6b7280'
          const st = liveStats[d.id]

          let lastUpdateLabel = '—'
          if (st?.lastUpdate) {
            const ageMin = (Date.now() - new Date(st.lastUpdate).getTime()) / 60000
            lastUpdateLabel = ageMin < 1 ? t('sos.justNow') : t('sos.minAgo').replace('{count}', Math.round(ageMin))
          }

          let statusLabel
          if (isOnRide) statusLabel = t('sos.onRide')
          else if (!available) statusLabel = t('sos.offDuty')
          else if (st?.moving === true) statusLabel = t('sos.moving')
          else statusLabel = t('sos.static')

          return {
            id: d.id,
            name: d.plate ? `Ambulance ${d.plate}` : t('sos.emergencySos'),
            lat,
            lng,
            color,
            iconLabel: isOnRide ? 'R' : 'A',
            pulse: isOnRide,
            statusLabel,
            lastUpdate: lastUpdateLabel,
            plate: d.plate,
          }
        })
        .filter(Boolean),
    [liveDrivers, activeDriverIds, liveStats, t]
  )

  const fleet = liveDrivers.filter((d) => d.latitude != null && d.longitude != null)
  const movingCount = fleet.filter((d) => liveStats[d.id]?.moving === true).length

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        pickup_address: form.location,
        destination_address: form.destination || 'Rodab Medical Hospital',
        latitude: coords?.lat,
        longitude: coords?.lng,
        emergency_level: form.emergencyLevel,
        notes: form.condition,
      }
      const res = await dispatchAmbulance(payload)
      const id = res.data?.tracking_id || res.data?.request?.tracking_id || res.data?.id || res.data?.request?.id || ''
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
    <div style={{ minHeight: '70vh', padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--error)', textAlign: 'center', marginBottom: 4 }}>
          {t('sos.emergencySos')}
        </h1>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28 }}>
          {t('sos.requestAmbulance')}
        </p>

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

        {/* ── Live ambulance map ─────────────────────────────────────── */}
        <div style={{ ...fullCardStyle, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-strong)' }}>
              {t('sos.liveAmbulanceMap')}
            </h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {t('sos.ambulancesOnline').replace('{count}', fleet.length)}
              {movingCount > 0 ? ` · ${t('sos.moving')}: ${movingCount}` : ''}
            </span>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '8px 0 14px' }}>
            {[
              { color: '#dc2626', label: t('sos.onRide') },
              { color: '#16a34a', label: t('sos.moving') },
              { color: '#16a34a', label: t('sos.static') },
              { color: '#6b7280', label: t('sos.offDuty') },
            ].map((item, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-body)' }}>
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    display: 'inline-block',
                  }}
                />
                {item.label}
              </span>
            ))}
          </div>

          {mapFailed && !fleet.length ? (
            <p style={{ fontSize: 14, color: 'var(--error)', padding: '16px 0' }}>{t('sos.mapFailed')}</p>
          ) : (
            <Map
              center={MAP_CENTER}
              zoom={MAP_ZOOM}
              hospitals={hospitalMarkers}
              drivers={driverMarkers}
              height="320px"
            />
          )}
        </div>

        {/* ── Dispatch form ──────────────────────────────────────────── */}
        <div style={fullCardStyle}>
          <form onSubmit={handleSubmit}>
            <label htmlFor="location" style={labelStyle}>
              {t('sos.pickupLocation')}
            </label>
            <div className="location-row" style={{ marginBottom: 16 }}>
              <LocationSearch
                id="location"
                name="location"
                value={form.location}
                onChange={handleChange}
                onPick={handlePickLocation}
                near={coords}
                placeholder={locating ? t('common.locating') : t('sos.searchPlaceholder')}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-card)',
                  color: 'var(--text-body)',
                  fontSize: 15,
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--error)',
                  backgroundColor: 'var(--error-soft)',
                  color: 'var(--error)',
                  fontSize: 14,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: locating ? 'not-allowed' : 'pointer',
                  opacity: locating ? 0.6 : 1,
                }}
              >
                {locating ? t('common.locating') : t('sos.useMyLocation')}
              </button>
            </div>
            {locSource && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                {locSource === 'gps' ? t('sos.usingCurrentLocation') :
                 locSource === 'cached' ? t('sos.usingLastKnown') :
                 t('sos.pickedFromSearch')}
              </p>
            )}

            <label htmlFor="destination" style={labelStyle}>
              {t('sos.destinationHospital')}
            </label>
            <input
              id="destination"
              name="destination"
              type="text"
              value={form.destination}
              onChange={handleChange}
              placeholder={t('sos.destinationPlaceholder')}
              style={fieldStyle}
            />

            <label htmlFor="emergencyLevel" style={labelStyle}>
              {t('sos.emergencyLevel')}
            </label>
            <select
              id="emergencyLevel"
              name="emergencyLevel"
              value={form.emergencyLevel}
              onChange={handleChange}
              style={{ ...fieldStyle, cursor: 'pointer' }}
            >
              <option value="critical">{t('sos.levelCritical')}</option>
              <option value="urgent">{t('sos.levelUrgent')}</option>
              <option value="normal">{t('sos.levelNormal')}</option>
            </select>

            <label htmlFor="condition" style={labelStyle}>
              {t('sos.describeEmergency')}
            </label>
            <textarea
              id="condition"
              name="condition"
              value={form.condition}
              onChange={handleChange}
              placeholder={t('sos.describeEmergencyPlaceholder')}
              rows={3}
              style={{ ...fieldStyle, marginBottom: 28, resize: 'vertical', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  backgroundColor: submitting ? 'var(--border)' : 'var(--emergency-red)',
                  backgroundImage: submitting ? 'none' : 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
                  color: '#ffffff',
                  border: '5px solid rgba(255,255,255,0.85)',
                  fontSize: 16,
                  fontWeight: 800,
                  lineHeight: 1.35,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: submitting ? 'none' : '0 10px 34px rgba(229, 57, 53, 0.5), 0 0 0 0 rgba(229, 57, 53, 0.4)',
                  position: 'relative',
                  zIndex: 1,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  animation: 'sos-pulse-ring 2.2s ease-out infinite',
                }}
                onMouseEnter={(e) => {
                  if (!submitting) e.currentTarget.style.transform = 'scale(1.06)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                {submitting && (
                  <span
                    style={{
                      width: 20, height: 20, border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid #fff', borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite', display: 'inline-block',
                    }}
                  />
                )}
                <span style={{ fontSize: 34, lineHeight: 1 }} aria-hidden="true">&#128680;</span>
                <span style={{ padding: '0 18px' }}>{submitting ? t('common.sending') : t('sos.sendSos')}</span>
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 16 }}>
            {t('sos.forEmergenciesCall').replace('{phone}', '111')}
          </p>
        </div>
      </div>
    </div>
  )
}
