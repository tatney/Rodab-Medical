import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { trackAmbulance, cancelAmbulanceRequest } from '../api'
import { getDrivingRoute } from '../utils/routing'

const colors = {
  primary: '#1e40af',
  red: '#dc2626',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
  green: '#16a34a',
  yellow: '#f59e0b',
  purple: '#7c3aed',
}

const statusSteps = [
  { key: 'requested', label: 'Request Received', icon: '📋' },
  { key: 'dispatched', label: 'Ambulance Dispatched', icon: '🚑' },
  { key: 'in_transit', label: 'En Route', icon: '🛣️' },
  { key: 'arrived', label: 'Arrived', icon: '🏥' },
  { key: 'completed', label: 'Completed', icon: '✅' },
  { key: 'cancelled', label: 'Cancelled', icon: '❌' },
]

const statusIndex = {}
statusSteps.forEach((s, i) => { statusIndex[s.key] = i })

export default function TrackPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const routeLineRef = useRef(null)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    async function fetchTracking() {
      try {
        const res = await trackAmbulance(id)
        setData(res.data?.tracking || res.data?.request || res.data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tracking data.')
      } finally {
        setLoading(false)
      }
    }
    fetchTracking()
    const interval = setInterval(fetchTracking, 10000)
    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    if (mapReady || !data) return
    loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js').then(() => {
      loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css')
      setTimeout(initMap, 400)
    })
  }, [data, mapReady])

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
    if (mapRef.current || !window.L) return
    const container = document.getElementById('track-map')
    if (!container) return
    const lat = data?.latitude || data?.lat || 33.8938
    const lng = data?.longitude || data?.lng || 35.5018
    const m = window.L.map(container).setView([lat, lng], 13)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(m)
    mapRef.current = m
    setMapReady(true)
    updateMap()
  }

  useEffect(() => {
    if (mapReady) updateMap()
  }, [data, mapReady])

  async function updateMap() {
    const m = mapRef.current
    if (!m || !data) return

    markersRef.current.forEach((mk) => m.removeLayer(mk))
    markersRef.current = []
    if (routeLineRef.current) { m.removeLayer(routeLineRef.current); routeLineRef.current = null }

    const pLat = data?.latitude || data?.lat
    const pLng = data?.longitude || data?.lng

    if (pLat && pLng) {
      const patientIcon = window.L.divIcon({
        html: '<div style="background:#dc2626;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
        className: '',
        iconSize: [18, 18],
      })
      const pm = window.L.marker([pLat, pLng], { icon: patientIcon }).addTo(m).bindPopup('<strong>Patient Location</strong>')
      markersRef.current.push(pm)
    }

    const dLat = data?.driver_latitude || data?.driver_lat
    const dLng = data?.driver_longitude || data?.driver_lng

    if (dLat && dLng) {
      const driverIcon = window.L.divIcon({
        html: '<div style="background:#1e40af;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
        className: '',
        iconSize: [18, 18],
      })
      const dm = window.L.marker([dLat, dLng], { icon: driverIcon }).addTo(m).bindPopup('<strong>Ambulance</strong>')
      markersRef.current.push(dm)

      if (pLat && pLng) {
        try {
          const route = await getDrivingRoute(dLat, dLng, pLat, pLng)
          if (route?.coordinates?.length) {
            const latlngs = route.coordinates.map((c) => [c[1], c[0]])
            routeLineRef.current = window.L.polyline(latlngs, { color: '#1e40af', weight: 4, opacity: 0.7 }).addTo(m)
          }
        } catch { /* ignore routing errors */ }
      }

      m.fitBounds(markersRef.current.map((mk) => mk.getLatLng()), { padding: [50, 50] })
    }
  }

  const handleCancel = async () => {
    if (!data?.id || !window.confirm('Are you sure you want to cancel this ambulance request?')) return
    setCancelling(true)
    try {
      await cancelAmbulanceRequest(data.id)
      setCancelled(true)
      setData((prev) => prev ? { ...prev, status: 'cancelled' } : prev)
    } catch (err) {
      setError(err.message || 'Failed to cancel request.')
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = !cancelled && (data?.status === 'requested' || (data?.status === 'dispatched' && !data?.driver_id))

  if (loading) {
    return (
      <main style={{ textAlign: 'center', padding: 80, color: colors.gray500 }}>
        <div role="status" aria-live="polite">
          <div className="spinner" style={{ margin: '0 auto 16px' }} aria-hidden="true" />
          Loading tracking data...
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <p style={{ fontSize: 18, color: colors.red, marginBottom: 8 }}>Unable to load tracking</p>
        <p style={{ fontSize: 14, color: colors.gray500 }}>{error}</p>
      </div>
    )
  }

  const currentStatus = data?.status || 'pending'
  const currentStep = statusIndex[currentStatus] ?? 0

  return (
      <main style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 8 }}>Ambulance Tracking</h1>
      <p style={{ fontSize: 15, color: colors.gray500, marginBottom: 32 }}>Tracking ID: <strong>{id}</strong></p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 32, overflow: 'hidden' }}>
        {/* Left: Map */}
        <div>
          <div id="track-map" aria-label="Ambulance tracking map" style={{ width: '100%', height: 450, borderRadius: 12, backgroundColor: colors.gray100, border: `1px solid ${colors.gray200}` }} />
        </div>

        {/* Right: Status + Info */}
        <div>
          {/* Status Timeline */}
          <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: colors.gray900, marginBottom: 20 }}>Status</h2>
            {statusSteps.map((step, idx) => {
              const isActive = idx <= currentStep
              const isCurrent = idx === currentStep
              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: idx < statusSteps.length - 1 ? 0 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      backgroundColor: isActive ? colors.green : colors.gray200,
                      color: colors.white, fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, border: isCurrent ? `3px solid ${colors.primary}` : 'none',
                    }}>
                      {idx + 1}
                    </div>
                    {idx < statusSteps.length - 1 && (
                      <div style={{ width: 2, height: 24, backgroundColor: isActive && idx < currentStep ? colors.green : colors.gray200 }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: idx < statusSteps.length - 1 ? 8 : 0 }}>
                    <span style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 500, color: isActive ? colors.gray900 : colors.gray500 }}>
                      {step.icon} {step.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Patient Info */}
          <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: colors.gray900, marginBottom: 12 }}>Patient Details</h2>
            <div style={{ fontSize: 14, color: colors.gray600, lineHeight: 1.8 }}>
              <p style={{ margin: 0 }}><strong>Name:</strong> {data?.patient_name || 'N/A'}</p>
              <p style={{ margin: 0 }}><strong>Phone:</strong> {data?.contact_phone || 'N/A'}</p>
              <p style={{ margin: 0 }}><strong>Location:</strong> {data?.location || 'N/A'}</p>
              {data?.destination && <p style={{ margin: 0 }}><strong>Destination:</strong> {data.destination}</p>}
              {data?.emergency_level && <p style={{ margin: 0 }}><strong>Priority:</strong> {data.emergency_level}</p>}
            </div>
          </div>

          {/* Driver Info */}
          {(data?.driver_name || data?.driver?.name) && (
            <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: colors.gray900, marginBottom: 12 }}>Driver Information</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: colors.primary, color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                  {(data.driver_name || data.driver?.name || '?')[0]}
                </div>
                <div style={{ fontSize: 14, color: colors.gray600 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: colors.gray900 }}>{data.driver_name || data.driver?.name}</p>
                  <p style={{ margin: 0 }}>Vehicle: {data.vehicle_plate || data.driver?.vehicle_plate || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 24, marginTop: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: colors.gray900, marginBottom: 8 }}>Need to Cancel?</h2>
              <p style={{ fontSize: 14, color: colors.gray500, marginBottom: 16 }}>You can cancel this request if the ambulance has not been dispatched yet.</p>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
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
                {cancelling ? 'Cancelling...' : 'Cancel Request'}
              </button>
            </div>
          )}
          {cancelled && (
            <div style={{ backgroundColor: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', padding: 24, marginTop: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: colors.red, margin: 0 }}>This request has been cancelled.</p>
            </div>
          )}
        </div>
      </div>
      </main>
  )
}
