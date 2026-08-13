export function buildGoogleMapsUrl(origin, destination) {
  const o = origin && origin.lat != null ? `${origin.lat},${origin.lng}` : ''
  const d = destination && destination.lat != null ? `${destination.lat},${destination.lng}` : ''
  if (!d) return ''
  const params = new URLSearchParams()
  if (o) params.set('origin', o)
  params.set('destination', d)
  params.set('travelmode', 'driving')
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

export function buildWazeUrl(origin, destination) {
  const d = destination && destination.lat != null ? `${destination.lat},${destination.lng}` : ''
  if (!d) return ''
  const o = origin && origin.lat != null ? `${origin.lat},${origin.lng}` : ''
  const params = new URLSearchParams()
  if (o) params.set('from', o)
  params.set('to', d)
  params.set('navigate', 'yes')
  return `https://waze.com/ul?${params.toString()}`
}

export async function getDrivingRoute(originLat, originLng, destLat, destLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`
  try {
    const res = await fetch(url)
    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) {
      throw new Error('No route found')
    }
    const route = data.routes[0]
    return {
      coordinates: route.geometry.coordinates,
      distance: route.distance,
      duration: route.duration,
      steps: route.legs[0].steps.map((s) => ({
        instruction: s.maneuver?.type || '',
        name: s.name || '',
        distance: s.distance,
        duration: s.duration,
        coordinates: s.geometry?.coordinates || [],
      })),
    }
  } catch (err) {
    console.error('Routing error:', err)
    throw err
  }
}
