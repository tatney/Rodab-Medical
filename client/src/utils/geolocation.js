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

export async function getSmartLocation() {
  try {
    const pos = await getPosition()
    return { ...pos, source: 'gps' }
  } catch {
    try {
      const ip = await getIPLocation()
      return { ...ip, source: 'ip' }
    } catch {
      return { lat: 0.0561, lng: 32.4556, source: 'default', city: 'Entebbe' }
    }
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
