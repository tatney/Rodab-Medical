export const KAMPALA_DEFAULT = { lat: 0.3476, lng: 32.5825, source: 'default', city: 'Kampala' };

const LAST_KNOWN_KEY = 'rodabmed_last_known_location';

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        })
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  })
}

export async function getIPLocation() {
  try {
    const res = await fetch('https://ipapi.co/json/')
    const data = await res.json()
    if (data.latitude && data.longitude) {
      return { lat: data.latitude, lng: data.longitude, city: data.city }
    }
    throw new Error('IP location unavailable')
  } catch {
    try {
      const res2 = await fetch('https://ipwho.is/')
      const data2 = await res2.json()
      if (data2.success) {
        return { lat: data2.latitude, lng: data2.longitude, city: data2.city }
      }
      throw new Error('Backup IP location failed')
    } catch {
      throw new Error('Could not determine location from IP')
    }
  }
}

export function getLastKnownPosition() {
  try {
    const raw = localStorage.getItem(LAST_KNOWN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
      return { lat: parsed.lat, lng: parsed.lng, accuracy: parsed.accuracy ?? null, source: 'cached' }
    }
  } catch { /* ignore */ }
  return null
}

export function saveLastKnownPosition(loc) {
  try {
    if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
      localStorage.setItem(LAST_KNOWN_KEY, JSON.stringify({
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy ?? null,
        ts: Date.now(),
      }))
    }
  } catch { /* ignore */ }
}

/**
 * Best-effort location resolution.
 * - GPS is always tried first (high accuracy).
 * - When GPS fails:
 *    * allowFallback=true (default): falls back to the cached last-known-good
 *      GPS fix first, then to IP location (marked source:'ip' so callers can
 *      flag it as approximate). If IP also fails it returns the Kampala
 *      default marked source:'default'.
 *    * allowFallback=false: rejects so callers can surface a real
 *      "enable location" state instead of silently showing a wrong pin.
 */
export async function getSmartLocation({ allowFallback = true } = {}) {
  try {
    const pos = await getPosition()
    const result = { ...pos, source: 'gps' }
    saveLastKnownPosition(pos)
    return result
  } catch (err) {
    if (!allowFallback) throw err
    const cached = getLastKnownPosition()
    if (cached) return cached
    try {
      const ip = await getIPLocation()
      return { ...ip, source: 'ip', accuracy: null }
    } catch {
      return { ...KAMPALA_DEFAULT }
    }
  }
}

/**
 * Driver/operator-grade location resolution. Never silently returns the
 * Kampala default (a wrong pin on the dispatch map is worse than no pin).
 * Tries live GPS, then the cached last-known-good fix, then IP flagged as
 * approximate. Throws only when every source fails.
 */
export async function getAccurateLocation() {
  try {
    const pos = await getPosition()
    const result = { ...pos, source: 'gps' }
    saveLastKnownPosition(pos)
    return result
  } catch {
    const cached = getLastKnownPosition()
    if (cached) return cached
    try {
      const ip = await getIPLocation()
      return { ...ip, source: 'ip', accuracy: null }
    } catch {
      throw new Error('Could not determine your location. Please enable GPS.')
    }
  }
}

/**
 * Continuous GPS tracking for drivers/vehicles.
 * Returns the watch id (pass to clearWatch) or null when unsupported.
 */
export function watchLocation({ onUpdate, onError, options = {} } = {}) {
  if (!navigator.geolocation) {
    if (onError) onError(new Error('Geolocation is not supported by this browser.'))
    return null
  }
  return navigator.geolocation.watchPosition(
    (pos) => {
      const loc = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        source: 'gps',
      }
      saveLastKnownPosition(loc)
      if (onUpdate) onUpdate(loc)
    },
    (err) => {
      if (onError) onError(err)
    },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 30000, ...options }
  )
}

export function clearWatch(id) {
  if (id != null && navigator.geolocation) {
    navigator.geolocation.clearWatch(id)
  }
}

export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    )
    const data = await res.json()
    return data.display_name || 'Unknown location'
  } catch {
    return 'Unknown location'
  }
}
