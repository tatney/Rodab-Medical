import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { trackAmbulance, cancelAmbulanceRequest } from '../api'
import { getDrivingRoute } from '../utils/routing'
import { KAMPALA_DEFAULT, haversineKm } from '../utils/geolocation'
import { useI18n } from '../i18n/I18nContext'

const statusSteps = [
  { key: 'requested' },
  { key: 'dispatched' },
  { key: 'in_transit' },
  { key: 'arrived' },
  { key: 'completed' },
  { key: 'cancelled' },
]

const statusIndex = {}
statusSteps.forEach((s, i) => { statusIndex[s.key] = i })

const POLL_MS = 5000
const MOVE_ANIM_MS = 4500

export default function TrackPage() {
  const { t, tr } = useI18n()
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [followMode, setFollowMode] = useState('both') // 'both' | 'driver'
  const [live, setLive] = useState({
    etaMin: null,
    distanceKm: null,
    speedKmh: null,
    moving: false,
    stale: false,
  })

  const mapRef = useRef(null)
  const patientMarkerRef = useRef(null)
  const driverMarkerRef = useRef(null)
  const routeLineRef = useRef(null)
  const labelsRef = useRef({ patientLocation: '', ambulance: '' })

  const prevDriverRef = useRef(null)
  const prevFixRef = useRef(null)
  const animIdRef = useRef(null)
  const userMovedRef = useRef(false)
  const programmaticRef = useRef(false)
  const routeCacheRef = useRef(null)
  const followRef = useRef('both')

  useEffect(() => {
    labelsRef.current.patientLocation = t('track.patientLocation')
    labelsRef.current.ambulance = t('track.ambulance')
  }, [t])

  useEffect(() => {
    followRef.current = followMode
  }, [followMode])

  const handleFetch = useCallback(async () => {
    if (!id) { setLoading(false); return }
    try {
      const res = await trackAmbulance(id)
      const next = res.data?.tracking || res.data?.request || res.data
      setData(next)
    } catch (err) {
      setError(err.response?.data?.message || t('track.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    handleFetch()
    const interval = setInterval(handleFetch, POLL_MS)
    return () => clearInterval(interval)
  }, [handleFetch])

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
    const lat = data?.latitude || data?.lat || KAMPALA_DEFAULT.lat
    const lng = data?.longitude || data?.lng || KAMPALA_DEFAULT.lng
    const m = window.L.map(container, { zoomControl: false }).setView([lat, lng], 14)
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(m)
    window.L.control.zoom({ position: 'bottomright' }).addTo(m)

    const onUserAction = () => { if (!programmaticRef.current) userMovedRef.current = true }
    m.on('dragstart', onUserAction)
    m.on('zoomstart', onUserAction)

    mapRef.current = m
    setMapReady(true)
    updateMap()
  }

  function addPatientMarker(pLat, pLng) {
    const m = mapRef.current
    if (!m || !window.L) return
    if (patientMarkerRef.current) return
    const icon = window.L.divIcon({
      html: '<div style="background:#dc2626;width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>',
      className: '',
      iconSize: [18, 18],
    })
    patientMarkerRef.current = window.L.marker([pLat, pLng], { icon })
      .addTo(m)
      .bindPopup(`<strong>${labelsRef.current.patientLocation}</strong>`)
  }

  function addDriverMarker(dLat, dLng) {
    const m = mapRef.current
    if (!m || !window.L) return
    if (!driverMarkerRef.current) {
      const icon = window.L.divIcon({
        html: '<div style="background:#1e40af;color:#fff;width:36px;height:36px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:18px;">🚑</div>',
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })
      driverMarkerRef.current = window.L.marker([dLat, dLng], { icon })
        .addTo(m)
        .bindPopup(`<strong>${labelsRef.current.ambulance}</strong>`)
      prevDriverRef.current = { lat: dLat, lng: dLng }
      return
    }
    const prev = prevDriverRef.current
    if (!prev) { driverMarkerRef.current.setLatLng([dLat, dLng]); return }
    if (Math.abs(prev.lat - dLat) < 0.000001 && Math.abs(prev.lng - dLng) < 0.000001) return
    // Glide the marker to the new fix.
    cancelAnimationFrame(animIdRef.current)
    const start = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - start) / MOVE_ANIM_MS)
      const lat = prev.lat + (dLat - prev.lat) * t
      const lng = prev.lng + (dLng - prev.lng) * t
      driverMarkerRef.current.setLatLng([lat, lng])
      if (t < 1) {
        animIdRef.current = requestAnimationFrame(step)
      } else {
        prevDriverRef.current = { lat: dLat, lng: dLng }
      }
    }
    animIdRef.current = requestAnimationFrame(step)
  }

  function drawRoute(dLat, dLng, pLat, pLng) {
    const m = mapRef.current
    if (!m || !window.L) return
    const cache = routeCacheRef.current
    const nearCache =
      cache &&
      haversineKm(cache.dLat, cache.dLng, dLat, dLng) < 0.15 // within ~150m

    if (!nearCache) {
      getDrivingRoute(dLat, dLng, pLat, pLng)
        .then((route) => {
          if (!mapRef.current) return
          routeCacheRef.current = {
            dLat,
            dLng,
            distance: route.distance,
            duration: route.duration,
          }
          if (route.coordinates?.length) {
            if (routeLineRef.current) m.removeLayer(routeLineRef.current)
            const latlngs = route.coordinates.map((c) => [c[1], c[0]])
            routeLineRef.current = window.L.polyline(latlngs, { color: '#1e40af', weight: 4, opacity: 0.7 }).addTo(m)
          }
          setLive((prev) => ({
            ...prev,
            etaMin: Math.max(1, Math.round(route.duration / 60)),
            distanceKm: Number((route.distance / 1000).toFixed(1)),
          }))
        })
        .catch(() => {
          // Fallback: straight-line estimate.
          const dist = haversineKm(dLat, dLng, pLat, pLng)
          setLive((prev) => ({
            ...prev,
            distanceKm: Number(dist.toFixed(1)),
            etaMin: Math.max(1, Math.round((dist / 30) * 60)),
          }))
        })
      return
    }

    // Use cached route; refresh the polyline geometry from the cache's raw data is
    // unnecessary — the ambulance glides along while the route stays valid nearby.
    setLive((prev) => ({
      ...prev,
      etaMin: Math.max(1, Math.round(cache.duration / 60)),
      distanceKm: Number((cache.distance / 1000).toFixed(1)),
    }))
  }

  function computeSpeed(dLat, dLng, fixTs) {
    const prev = prevFixRef.current
    if (!prev || !dLat || !dLng || !fixTs) return
    const dt = (fixTs - prev.ts) / 1000
    if (dt < 2 || dt > 90) return
    const distM = haversineKm(prev.lat, prev.lng, dLat, dLng) * 1000
    prevFixRef.current = { lat: dLat, lng: dLng, ts: fixTs }
    if (distM < 5) {
      setLive((prev2) => ({ ...prev2, speedKmh: 0, moving: false }))
      return
    }
    setLive((prev2) => ({
      ...prev2,
      speedKmh: Math.max(1, Math.round((distM / dt) * 3.6)),
      moving: true,
    }))
  }

  function followView(dLat, dLng, pLat, pLng) {
    const m = mapRef.current
    if (!m || userMovedRef.current || !followRef.current) return
    const bounds = []
    if (pLat && pLng) bounds.push([pLat, pLng])
    if (dLat && dLng) bounds.push([dLat, dLng])
    if (bounds.length === 0) return
    programmaticRef.current = true
    try {
      if (followRef.current === 'driver' && dLat && dLng) {
        m.panTo([dLat, dLng], { animate: true, duration: 0.5 })
      } else if (bounds.length > 1) {
        m.fitBounds(bounds, { padding: [60, 60], animate: true })
      } else {
        m.panTo(bounds[0], { animate: true, duration: 0.5 })
      }
    } finally {
      requestAnimationFrame(() => { programmaticRef.current = false })
    }
  }

  async function updateMap() {
    const m = mapRef.current
    if (!m || !data) return

    const pLat = data?.latitude || data?.lat
    const pLng = data?.longitude || data?.lng
    const dLat = data?.driver_latitude || data?.driver_lat
    const dLng = data?.driver_longitude || data?.driver_lng

    if (pLat && pLng) addPatientMarker(pLat, pLng)
    if (dLat && dLng) {
      const fixTs = data.driver_last_update ? Date.parse(data.driver_last_update) : null
      if (!prevFixRef.current && fixTs) prevFixRef.current = { lat: dLat, lng: dLng, ts: fixTs }
      addDriverMarker(dLat, dLng)
      computeSpeed(dLat, dLng, fixTs)
    }
    if (dLat && dLng && pLat && pLng) drawRoute(dLat, dLng, pLat, pLng)
    followView(dLat, dLng, pLat, pLng)

    const stale = Boolean(dLat && dLng) &&
      Boolean(data.driver_last_update) &&
      (Date.now() - new Date(data.driver_last_update).getTime() > 60000)
    setLive((prev) => ({
      ...prev,
      stale,
      driverAssigned: Boolean(dLat && dLng),
    }))
  }

  useEffect(() => {
    if (mapReady) updateMap()
  }, [data, mapReady]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleRecenter = () => {
    userMovedRef.current = false
    const dLat = data?.driver_latitude || data?.driver_lat
    const dLng = data?.driver_longitude || data?.driver_lng
    const pLat = data?.latitude || data?.lat
    const pLng = data?.longitude || data?.lng
    followView(dLat, dLng, pLat, pLng)
  }

  const lastUpdateAgo = useMemoNow(data?.driver_last_update)

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

  if (error && !data) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <p style={{ fontSize: 18, color: 'var(--error)', marginBottom: 8 }}>{t('track.failedLoad')}</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{error}</p>
      </div>
    )
  }

  const currentStatus = data?.status || 'pending'
  const currentStep = statusIndex[currentStatus] ?? 0
  const steps = tr('track.statusSteps')

  return (
    <main style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>{t('track.heading')}</h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 32 }}>{t('track.trackingId')} <strong>{id}</strong></p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: 32, overflow: 'hidden' }}>
        {/* Left: Map */}
        <div>
          <div id="track-map" aria-label="Ambulance tracking map" style={{ width: '100%', height: 450, borderRadius: 12, backgroundColor: 'var(--surface-container-low)', border: '1px solid var(--border)', position: 'relative' }}>
            {/* Live status window */}
            <div style={{
              position: 'absolute', top: 12, right: 12, zIndex: 1000,
              width: 200, maxWidth: 'calc(100% - 24px)',
              backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10,
              border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('track.status')}</span>
                <span style={{ fontSize: 9, fontWeight: 600, color: live.stale ? 'var(--error)' : 'var(--status-success)' }}>
                  {live.driverAssigned ? (live.stale ? t('track.stationary') : t('track.moving')) : '—'}
                </span>
              </div>

              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1, textAlign: 'center', padding: '5px 2px' }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('track.eta')}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-strong)', marginTop: 1 }}>
                    {live.driverAssigned ? (live.etaMin != null ? `${live.etaMin}${t('track.min')}` : '—') : '—'}
                  </div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '5px 2px', borderLeft: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('track.distance')}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-strong)', marginTop: 1 }}>
                    {live.driverAssigned ? (live.distanceKm != null ? `${live.distanceKm}km` : '—') : '—'}
                  </div>
                </div>
                <div style={{ flex: 1, textAlign: 'center', padding: '5px 2px', borderLeft: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{t('track.speed')}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-strong)', marginTop: 1 }}>
                    {live.driverAssigned ? (live.speedKmh != null ? `${live.speedKmh}${t('track.kmh')}` : '—') : '—'}
                  </div>
                </div>
              </div>

              {live.driverAssigned ? (
                <div style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: live.stale ? 'var(--error)' : (live.moving ? 'var(--status-success)' : 'var(--text-muted)'), flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-strong)', flex: 1 }}>
                    {live.moving ? t('track.moving') : t('track.stationary')}
                  </span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                    {t('track.lastUpdate').replace('{s}', String(lastUpdateAgo))}
                  </span>
                </div>
              ) : (
                <div style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
                  {t('track.waitingDriver')}
                </div>
              )}

              <div style={{ padding: 5, display: 'flex', gap: 4 }}>
                <button
                  onClick={() => setFollowMode((m) => (m === 'both' ? 'driver' : 'both'))}
                  style={{
                    flex: 1, padding: '4px 4px', borderRadius: 6, border: '1px solid var(--border)',
                    backgroundColor: followMode === 'driver' ? 'var(--primary)' : '#ffffff',
                    color: followMode === 'driver' ? '#ffffff' : 'var(--text-strong)',
                    fontSize: 10, fontWeight: 600, cursor: 'pointer',
                  }}
                  title={followMode === 'both' ? t('track.followAmbulance') : t('track.showBoth')}
                >
                  {followMode === 'both' ? '🧭 ' + t('track.showBoth') : '🚑 ' + t('track.followAmbulance')}
                </button>
                <button
                  onClick={handleRecenter}
                  style={{
                    padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)',
                    backgroundColor: '#ffffff', color: 'var(--text-strong)', fontSize: 10,
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {t('track.recenter')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Status + Info */}
        <div>
          {/* Status Timeline */}
          <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 20 }}>{t('track.status')}</h2>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              {statusSteps.map((step, idx) => {
                const isActive = idx <= currentStep
                const isCurrent = idx === currentStep
                return (
                  <div key={step.key} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {idx > 0 && (
                        <div style={{ flex: 1, height: 2, backgroundColor: isActive ? 'var(--status-success)' : 'var(--surface-container)' }} />
                      )}
                      <div style={{
                        width: isCurrent ? 16 : 12, height: isCurrent ? 16 : 12, borderRadius: '50%',
                        backgroundColor: isActive ? 'var(--status-success)' : 'var(--surface-container)',
                        border: isCurrent ? '3px solid var(--primary)' : 'none',
                        boxSizing: 'border-box', flexShrink: 0,
                      }} />
                      {idx < statusSteps.length - 1 && (
                        <div style={{ flex: 1, height: 2, backgroundColor: isActive && idx < currentStep ? 'var(--status-success)' : 'var(--surface-container)' }} />
                      )}
                    </div>
                    <span style={{
                      fontSize: isCurrent ? 13 : 12, fontWeight: isCurrent ? 700 : 500,
                      color: isActive ? 'var(--text-strong)' : 'var(--text-muted)',
                      textAlign: 'center', marginTop: 8, lineHeight: 1.3, padding: '0 2px',
                    }}>
                      {steps[idx]}
                    </span>
                  </div>
                )
              })}
            </div>
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
            <div style={{ backgroundColor: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border)', padding: 24, marginBottom: 24 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 12 }}>{t('track.driverInformation')}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>
                  {(data.driver_name || data.driver?.name || '?')[0]}
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-body)', flex: 1, minWidth: 150 }}>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-strong)' }}>{data.driver_name || data.driver?.name}</p>
                  <p style={{ margin: 0 }}>{t('track.vehicle')} {data.vehicle_plate || data.driver?.vehicle_plate || t('common.notAvailable')}</p>
                </div>
                {(data.driver_phone || data.driver?.phone) && (
                  <a
                    href={`tel:${data.driver_phone || data.driver?.phone}`}
                    style={{
                      padding: '10px 18px', borderRadius: 8, textDecoration: 'none',
                      backgroundColor: 'var(--primary)', color: '#ffffff', fontSize: 13, fontWeight: 700,
                    }}
                  >
                    📞 {t('track.callDriver')}
                  </a>
                )}
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

function useMemoNow(timestamp) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(iv)
  }, [])
  if (!timestamp) return '—'
  const diff = Date.now() - new Date(timestamp).getTime()
  return Math.max(0, Math.round(diff / 1000))
}
