import React, { useEffect, useRef, useState } from 'react'

const CITIES = [
  { name: 'Kampala', lat: 0.3476, lng: 32.5825, r: 22000 },
  { name: 'Entebbe', lat: 0.0512, lng: 32.4635, r: 12000 },
  { name: 'Jinja', lat: 0.4244, lng: 33.2042, r: 14000 },
  { name: 'Masaka', lat: -0.3367, lng: 31.7129, r: 13000 },
  { name: 'Mbarara', lat: -0.6047, lng: 30.6544, r: 14000 },
  { name: 'Fort Portal', lat: 0.671, lng: 30.2755, r: 12000 },
  { name: 'Gulu', lat: 2.7749, lng: 32.299, r: 14000 },
  { name: 'Lira', lat: 2.2499, lng: 32.8999, r: 11000 },
  { name: 'Mbale', lat: 1.0784, lng: 34.175, r: 12000 },
  { name: 'Arua', lat: 3.0151, lng: 30.9111, r: 12000 },
  { name: 'Soroti', lat: 1.713, lng: 33.6111, r: 10000 },
  { name: 'Kabale', lat: -1.2465, lng: 29.989, r: 10000 },
]

const UGANDA_BOUNDS = [
  [-1.7, 29.3],
  [4.3, 35.3],
]

function loadLeaflet() {
  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }
  return import('leaflet').then((m) => m.default || m).catch(() => window.L)
}

const UgandaMap = ({ height = '440px' }) => {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let map = null
    let L = null
    let disposed = false

    const init = async () => {
      if (disposed) return
      L = await loadLeaflet()
      if (disposed || !L || !el) return
      if (!el.offsetHeight && !el.offsetWidth) return

      map = L.map(el, {
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
        minZoom: 5,
        maxZoom: 9,
      })
      map.fitBounds(UGANDA_BOUNDS)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      }).addTo(map)

      const glowGroup = L.layerGroup().addTo(map)

      CITIES.forEach((city) => {
        const pos = [city.lat, city.lng]

        L.circle(pos, {
          radius: city.r,
          color: 'rgba(34,197,94,0.9)',
          weight: 2,
          fillColor: '#22c55e',
          fillOpacity: 0.18,
        }).addTo(glowGroup)

        L.circle(pos, {
          radius: city.r * 0.28,
          color: 'rgba(34,197,94,0.4)',
          weight: 1,
          fillColor: '#4ade80',
          fillOpacity: 0.85,
        }).addTo(glowGroup)

        L.marker(pos, {
          icon: L.divIcon({
            className: 'uganda-city-label',
            html: `<span>${city.name}</span>`,
          }),
        }).addTo(glowGroup)
      })

      setReady(true)
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            init()
            io.disconnect()
          }
        },
        { rootMargin: '200px' }
      )
      io.observe(el)
      return () => {
        disposed = true
        io.disconnect()
        if (map) map.remove()
      }
    }

    init()
    return () => {
      disposed = true
      if (map) map.remove()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="where-we-work-map"
      style={{ height, width: '100%', borderRadius: 16, overflow: 'hidden', position: 'relative', background: '#0b1220' }}
      role="region"
      aria-label="Active operations map of Uganda"
    >
      {!ready && (
        <div className="where-we-work-map-placeholder">
          <span className="spinner spinner-sm" />
        </div>
      )}
    </div>
  )
}

export default UgandaMap
