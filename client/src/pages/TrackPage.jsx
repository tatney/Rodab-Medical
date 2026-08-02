import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { trackAmbulance, cancelAmbulanceRequest } from '../api'
import { getDrivingRoute } from '../utils/routing'
import { useI18n } from '../i18n/I18nContext'

const statusSteps = [
  { key: 'requested', icon: '📋' },
  { key: 'dispatched', icon: '🚑' },
  { key: 'in_transit', icon: '🛣️' },
  { key: 'arrived', icon: '🏥' },
  { key: 'completed', icon: '✅' },
  { key: 'cancelled', icon: '❌' },
]

const statusIndex = {}
statusSteps.forEach((s, i) => { statusIndex[s.key] = i })

export default function TrackPage() {
  const { t } = useI18n()
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
  const labelsRef = useRef({ patientLocation: '', ambulance: '' })

  useEffect(() => {
    labelsRef.current.patientLocation = t('track.patientLocation')
    labelsRef.current.ambulance = t('track.ambulance')
  }, [t])

  useEffect(() => {
    if (!id) { setLoading(false); return }
    async function fetchTracking() {
      try {
        const res = await trackAmbulance(id)
        setData(res.data?.tracking || res.data?.request || res.data)
      } catch (err) {
        setError(err.response?.data?.message || t('track.failedLoad'))
      } finally {
        setLoading(false)
      }
    }
    fetchTracking()
    const interval = setInterval(fetchTracking, 10000)
    return () => clearInterval(interval)
  }, [id, t])

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
      const pm = window.L.marker([pLat, pLng], { icon: patientIcon }).addTo(m).bindPopup(`<strong>${labelsRef.current.patientLocation}</strong>`)
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
      const dm = window.L.marker([dLat, dLng], { icon: driverIcon }).addTo(m).bindPopup(`<strong>${labelsRef.current.ambulance}</strong>`)
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
    if (!data?.id || !window.confirm(t('track.cancelConfirm'))) return
    setCancelling(true)
    try {
      await cancelAmbulanceRequest(data.id)
      setCancelled(true)
      setData((prev) => prev ? { ...prev, status: 'cancelled' } : prev)
    } catch (err) {
      setError(err.message || t('track.failedLoad'))
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = !cancelled && (data?.status === 'requested' || (data?.status === 'dispatched' && !data?.driver_id))

  if (loading) {
    return (
      <main style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
        <div role="status" aria-live="polite">
          <div className="spinner" style={{ margin: '0 auto 16px' }} aria-hidden="true" />
          {t('track.loading')}
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <p style={{ fontSize: 18, color: 'var(--error)', marginBottom: 8 }}>{t('track.failedLoad')}</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{error}</p>
      </div>
    )
  }

  const currentStatus = data?.status || 'pending'
  const currentStep = statusIndex[currentStatus] ?? 0
  const steps = t('track.statusSteps')

  return (
      <main style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>{t('track.heading')}</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 32 }}>{t('track.trackingId')} <strong>{id}</strong></p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 32, overflow: 'hidden' }}>
        {/* Left: Map */}
        <div>
          <div id="track-map" aria-label="Ambulance tracking map" style={{ width: '100%', height: 450, borderRadius: 12, backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--border)' }} />
        </div>

        {/* Right: Status + Info */}
        <div>
          {/* Status Timeline */}
          <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 20 }}>{t('track.status')}</h2>
            {statusSteps.map((step, idx) => {
              const isActive = idx <= currentStep
              const isCurrent = idx === currentStep
              return (
                <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: idx < statusSteps.length - 1 ? 0 : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      backgroundColor: isActive ? 'var(--status-success)' : 'var(--surface-container)',
                      color: '#ffffff', fontSize: 14,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, border: isCurrent ? '3px solid var(--primary)' : 'none',
                    }}>
                      {idx + 1}
                    </div>
                    {idx < statusSteps.length - 1 && (
                      <div style={{ width: 2, height: 24, backgroundColor: isActive && idx < currentStep ? 'var(--status-success)' : 'var(--surface-container)' }} />
                    )}
                  </div>
                  <div style={{ paddingBottom: idx < statusSteps.length - 1 ? 8 : 0 }}>
                    <span style={{ fontSize: 14, fontWeight: isCurrent ? 700 : 500, color: isActive ? 'var(--text-strong)' : 'var(--text-muted)' }}>
                      {step.icon} {steps[idx]}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Patient Info */}
          <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 12 }}>{t('track.patientDetails')}</h2>
            <div style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.8 }}>
              <p style={{ margin: 0 }}><strong>{t('track.name')}</strong> {data?.patient_name || t('common.notAvailable')}</p>
              <p style={{ margin: 0 }}><strong>{t('track.phone')}</strong> {data?.contact_phone || t('common.notAvailable')}</p>
              <p style={{ margin: 0 }}><strong>{t('track.location')}</strong> {data?.location || t('common.notAvailable')}</p>
              {data?.destination && <p style={{ margin: 0 }}><strong>{t('track.destination')}</strong> {data.destination}</p>}
              {data?.emergency_level && <p style={{ margin: 0 }}><strong>{t('track.priority')}</strong> {data.emergency_level}</p>}
            </div>
          </div>

          {/* Driver Info */}
          {(data?.driver_name || data?.driver?.name) && (
            <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 12 }}>{t('track.driverInformation')}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                  {(data.driver_name || data.driver?.name || '?')[0]}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-body)' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-strong)' }}>{data.driver_name || data.driver?.name}</p>
                  <p style={{ margin: 0 }}>{t('track.vehicle')} {data.vehicle_plate || data.driver?.vehicle_plate || t('common.notAvailable')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Cancel Button */}
          {canCancel && (
            <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 24, marginTop: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>{t('track.needToCancel')}</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>{t('track.cancelHint')}</p>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
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
                {cancelling ? t('common.cancelling') : t('track.cancelRequest')}
              </button>
            </div>
          )}
          {cancelled && (
            <div style={{ backgroundColor: 'var(--error-soft)', borderRadius: 12, border: '1px solid var(--error-border)', padding: 24, marginTop: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--error)', margin: 0 }}>{t('track.cancelledMsg')}</p>
            </div>
          )}
        </div>
      </div>
      </main>
  )
}
