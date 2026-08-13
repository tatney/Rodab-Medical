import supabase from '../supabaseClient'

// Live ambulance tracking over Supabase Realtime.
//
// All helpers return a function that removes the channel (safe to use as the
// cleanup of a useEffect). RLS permits public SELECT on `drivers` and
// `ambulance_requests`, so these channels work for any viewer.

function isTrackingId(id) {
  return typeof id === 'string' && /^RDB/i.test(id)
}

// Push updates for one drivers row (current_latitude/longitude,
// last_location_update, is_available, status, ...).
export function subscribeDriverLocation(driverId, cb) {
  if (!driverId) return () => {}
  const channel = supabase
    .channel(`driver-loc-${driverId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'drivers', filter: `id=eq.${driverId}` },
      (payload) => cb(payload.new)
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

// Push updates for one ambulance request (status changes, assignment, ...).
export function subscribeAmbulanceRequest(id, cb) {
  if (!id) return () => {}
  const filter = isTrackingId(id) ? `tracking_id=eq.${id}` : `id=eq.${id}`
  const channel = supabase
    .channel(`amb-req-${id}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'ambulance_requests', filter },
      (payload) => cb(payload.new)
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}

// Push updates for any drivers row. Used by the fleet/dispatch maps.
export function subscribeAllDrivers(cb) {
  const channel = supabase
    .channel('all-drivers')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'drivers' },
      (payload) => cb(payload.new)
    )
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}
