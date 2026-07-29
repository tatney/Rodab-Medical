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
