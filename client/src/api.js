import supabase from './supabaseClient'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function invokeEdge(path, method = 'GET', body = null) {
  const { data: { session } } = await supabase.auth.getSession()
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${path}`, opts)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || `Edge function error (${res.status})`)
  return json
}

function ok(data) {
  return { data, error: null }
}

function fail(error) {
  return { data: null, error }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()
  if (profileError) throw profileError

  return ok({
    token: data.session.access_token,
    user: profile,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
    },
  })
}

export const signup = async ({ full_name, email, password, phone, role, age, gender, blood_group, chronic_disease }) => {
  const data = await invokeEdge('auth-signup', 'POST', {
    email,
    password,
    full_name: full_name || '',
    phone: phone || '',
    role: role || 'user',
    age,
    gender,
    blood_group,
    chronic_disease,
  })

  if (data && data.session) {
    const { error: setError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    })
    if (setError) console.error('setSession error:', setError)
  }

  return ok(data)
}

export const getProfile = async () => {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw authError || new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  if (error) throw error

  return ok({ user: data })
}

export const updateProfile = async (updates) => {
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw authError || new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single()
  if (error) throw error

  return ok({ user: data })
}

// ─── Doctors ──────────────────────────────────────────────────────────────────

export const getDoctors = async (params) => {
  let query = supabase
    .from('doctors')
    .select('*, profiles(*)')

  if (params) {
    if (params.department) query = query.eq('department_id', params.department)
  }

  const { data, error } = await query
  if (error) throw error

  const doctors = (data || []).map((doc) => ({
    ...doc,
    full_name: doc.profiles?.full_name || doc.name,
    email: doc.profiles?.email || doc.email,
    avatar_url: doc.profiles?.avatar_url || doc.avatar_url,
    is_available: doc.is_available ?? doc.available,
  }))

  return ok({ doctors })
}

export const getDoctorsDepartments = async () => {
  const { data: departments, error: deptError } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
  if (deptError) throw deptError

  const { data: doctors, error: docError } = await supabase
    .from('doctors')
    .select('*, profiles(*)')
  if (docError) throw docError

  const deptMap = (departments || []).map(d => ({
    ...d,
    doctors: (doctors || []).filter(doc => doc.department_id === d.id),
  }))

  return ok({ departments: deptMap })
}

export const deleteDoctor = async (id) => {
  const { error: docError } = await supabase.from('doctors').delete().eq('id', id)
  if (docError) throw docError
  const { error: profileError } = await supabase.from('profiles').update({ role: 'user' }).eq('id', id)
  if (profileError) throw profileError
  return ok({ message: 'Doctor removed successfully' })
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export const getAppointments = async (params) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role

  let query = supabase.from('appointments').select('*, profiles(*), doctors(*, profiles!user_id(*))')

  if (role === 'user') {
    query = query.eq('patient_id', user.id)
  } else if (role === 'doctor') {
    const { data: doc } = await supabase.from('doctors').select('id').eq('user_id', user.id).single()
    if (doc) query = query.eq('doctor_id', doc.id)
  }

  query = query.order('appointment_date', { ascending: false })

  if (params?.limit) query = query.limit(params.limit)

  const { data, error } = await query
  if (error) throw error
  return ok({ appointments: data || [] })
}

export const createAppointment = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: result, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: user.id,
      doctor_id: data.doctor_id,
      appointment_date: data.appointment_date || data.date,
      appointment_time: data.appointment_time || data.time,
      reason: data.reason,
      department_id: data.department_id,
      hospital_id: data.hospital_id,
      status: 'pending',
    })
    .select('*, doctor:doctors!doctor_id(*)')
    .single()
  if (error) throw error

  if (result?.doctor?.user_id) {
    try {
      await createNotification({
        targetUserId: result.doctor.user_id,
        title: 'New appointment request',
        message: `A patient booked ${result.appointment_date} at ${String(result.appointment_time).slice(0, 5)}. Please confirm.`,
        type: 'appointment',
      })
    } catch {
      // Notification is best-effort; never block the booking itself.
    }
  }

  return ok({ appointment: result })
}

export const updateAppointment = async (id, updates) => {
  const { data: result, error } = await supabase
    .from('appointments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ appointment: result })
}

export const deleteAppointment = async (id) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  // Prefer a soft cancel so the appointment stays visible in history.
  const { data: updated, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
  if (!error && updated && updated.length > 0) {
    return ok({ message: 'Appointment cancelled successfully', status: 'cancelled' })
  }

  // Fallback for environments where the patient can't UPDATE yet: hard delete.
  let query = supabase.from('appointments').delete().eq('id', id)
  if (profile?.role === 'user') query = query.eq('patient_id', user.id)

  const { error: deleteError } = await query
  if (deleteError) throw deleteError
  return ok({ message: 'Appointment cancelled successfully' })
}

// ─── Consultations ────────────────────────────────────────────────────────────

export const getConsultations = async (params) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role

  let query = supabase.from('consultations').select('*, profiles(*), doctors(*, profiles!user_id(*))')

  if (role === 'user') {
    query = query.eq('patient_id', user.id)
  } else if (role === 'doctor') {
    const { data: doc } = await supabase.from('doctors').select('specialty').eq('user_id', user.id).single()
    if (doc) query = query.eq('specialty', doc.specialty)
  }

  query = query.order('created_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error
  return ok({ consultations: data || [] })
}

export const createConsultation = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: result, error } = await supabase
    .from('consultations')
    .insert({
      patient_id: user.id,
      doctor_id: data.doctor_id,
      subject: data.subject || data.specialty,
      message: data.message,
      specialty: data.specialty,
      department_id: data.department_id,
      status: 'open',
    })
    .select()
    .single()
  if (error) throw error
  return ok({ consultation: result })
}

export const updateConsultation = async (id, data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updates = {}
  if (data.response !== undefined) updates.response = data.response
  if (data.status !== undefined) updates.status = data.status
  updates.responder_id = user.id
  updates.responded_at = new Date().toISOString()

  const { data: result, error } = await supabase
    .from('consultations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ consultation: result })
}

// ─── Ambulance ────────────────────────────────────────────────────────────────

const isTrackingId = (id) => typeof id === 'string' && /^RDB/i.test(id)

export const dispatchAmbulance = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).single()

  const pickup = data.pickup_address || data.location || ''
  const dest = data.destination_address || data.destination || 'Rodab Medical Hospital'

  const { data: result, error } = await supabase
    .from('ambulance_requests')
    .insert({
      patient_id: user.id,
      patient_name: profile?.full_name || data.patient_name || '',
      contact_phone: profile?.phone || data.contact_phone || '',
      location: pickup,
      pickup_address: pickup,
      destination: dest,
      destination_address: dest,
      latitude: data.latitude,
      longitude: data.longitude,
      emergency_level: data.emergency_level || data.priority || 'normal',
      condition: data.notes || '',
      notes: data.notes,
      status: 'requested',
      is_guest: false,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ id: result.tracking_id || result.id, tracking_id: result.tracking_id || null, request: result })
}

export const dispatchAmbulanceGuest = async (data) => {
  const pickup = data.pickup_address || data.location || ''
  const dest = data.destination_address || data.destination || 'Rodab Medical Hospital'

  let patientId = null
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) patientId = user.id
  } catch { /* guest */ }

  const { data: result, error } = await supabase
    .from('ambulance_requests')
    .insert({
      patient_id: patientId,
      guest_name: data.guest_name || data.patient_name || '',
      guest_phone: data.guest_phone || data.patient_phone || '',
      patient_name: data.guest_name || data.patient_name || '',
      contact_phone: data.guest_phone || data.patient_phone || '',
      location: pickup,
      pickup_address: pickup,
      destination: dest,
      destination_address: dest,
      latitude: data.latitude,
      longitude: data.longitude,
      emergency_level: data.emergency_level || 'normal',
      condition: data.notes || '',
      notes: data.notes,
      status: 'dispatched',
      is_guest: true,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ id: result.tracking_id || result.id, tracking_id: result.tracking_id || null, request: result })
}

export const cancelAmbulanceRequest = async (id) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const matchKey = isTrackingId(id) ? 'tracking_id' : 'id'
  const { data, error } = await supabase
    .from('ambulance_requests')
    .update({ status: 'cancelled' })
    .eq(matchKey, id)
    .select()
    .single()
  if (error) throw error
  return ok({ request: data })
}

export const getAmbulanceHistory = async (params) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('ambulance_requests')
    .select('*')
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ history: data || [], rides: data || [] })
}

export const getActiveEmergencies = async () => {
  const { data, error } = await supabase
    .from('ambulance_requests')
    .select('*')
    .not('status', 'in', '(completed,cancelled)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ active: data || [], emergencies: data || [], rides: data || [] })
}

// Lightweight fleet snapshot for the patient-facing live map. Works for any
// authenticated user because the `drivers` and `vehicles` tables have open
// SELECT policies.
export const getLiveAmbulances = async () => {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, profile_id, vehicle_id, is_available, status, current_latitude, current_longitude, last_location_update')
    .order('last_location_update', { ascending: false })
  if (error) throw error

  const vehicleIds = [...new Set((data || []).map((d) => d.vehicle_id).filter(Boolean))]
  let vehicleMap = {}
  if (vehicleIds.length) {
    const { data: vehicles, error: vehErr } = await supabase
      .from('vehicles')
      .select('id, plate_number, model, vehicle_type, status')
      .in('id', vehicleIds)
    if (!vehErr) {
      vehicleMap = Object.fromEntries((vehicles || []).map((v) => [v.id, v]))
    }
  }

  const drivers = (data || []).map((d) => ({
    id: d.id,
    profile_id: d.profile_id,
    vehicle_id: d.vehicle_id,
    is_available: d.is_available !== false && d.status !== 'off_duty',
    status: d.status,
    latitude: d.current_latitude,
    longitude: d.current_longitude,
    last_location_update: d.last_location_update,
    plate: vehicleMap[d.vehicle_id]?.plate_number || '',
    vehicle: vehicleMap[d.vehicle_id] || null,
  }))

  return ok({ drivers })
}

export const getDriverActiveRides = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: driver, error: driverErr } = await supabase.from('drivers').select('id').eq('profile_id', user.id).maybeSingle()
  if (driverErr) console.error('[getDriverActiveRides] driver lookup error:', driverErr)
  if (!driver) return ok({ active: [] })

  const { data, error } = await supabase
    .from('ambulance_requests')
    .select('*')
    .eq('driver_id', driver.id)
    .not('status', 'in', '(completed,cancelled)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ active: data || [], rides: data || [] })
}

export const getDriverRides = async (userId) => {
  const { data: { user } } = await supabase.auth.getUser()
  const uid = userId || user?.id
  if (!uid) return ok({ rides: [] })

  const { data: driver } = await supabase.from('drivers').select('id').eq('profile_id', uid).maybeSingle()
  if (!driver) return ok({ rides: [] })

  const { data, error } = await supabase
    .from('ambulance_requests')
    .select('*')
    .eq('driver_id', driver.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ rides: data || [] })
}

export const trackAmbulance = async (id) => {
  const matchKey = isTrackingId(id) ? 'tracking_id' : 'id'
  const { data, error } = await supabase
    .from('ambulance_requests')
    .select('*')
    .eq(matchKey, id)
    .single()
  if (error) throw error

  const tracking = { ...data }

  if (data?.driver_id) {
    const { data: driver, error: driverErr } = await supabase
      .from('drivers')
      .select('id, full_name, phone, current_latitude, current_longitude, last_location_update, vehicle_id')
      .eq('id', data.driver_id)
      .maybeSingle()

    if (!driverErr && driver) {
      tracking.driver_name = driver.full_name
      tracking.driver_phone = driver.phone
      tracking.driver_latitude = driver.current_latitude
      tracking.driver_longitude = driver.current_longitude
      tracking.driver_last_update = driver.last_location_update
      tracking.vehicle_plate = driver.vehicle_id || data.vehicle_plate || null
    }
  }

  return ok({ tracking, request: tracking })
}

export const assignDriver = async (rideId, driverId) => {
  const { data, error } = await supabase
    .from('ambulance_requests')
    .update({
      driver_id: driverId,
      status: 'dispatched',
      assigned_at: new Date().toISOString(),
    })
    .eq('id', rideId)
    .select()
    .single()
  if (error) throw error
  return ok({ request: data })
}

export const updateRideStatus = async (id, data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updates = { status: data.status }
  if (data.status === 'completed') updates.completed_at = new Date().toISOString()
  if (data.status === 'in_transit') updates.started_at = new Date().toISOString()

  const { data: result, error } = await supabase
    .from('ambulance_requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ request: result })
}

// ─── Drivers ──────────────────────────────────────────────────────────────────

export const getDrivers = async (params) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, drivers(*)')
    .eq('role', 'driver')
  if (error) throw error
  return ok({ drivers: data || [] })
}

export const createDriverWithAccount = async (data) => {
  const json = await invokeEdge('drivers/create', 'POST', {
    email: data.email,
    password: data.password,
    full_name: data.fullName || data.full_name,
    phone: data.phone,
    license_number: data.licenseNumber || data.license_number,
    vehicle_id: data.vehicleId || data.vehicle_id,
  })
  return ok({ driver: json })
}

export const updateDriver = async (id, data) => {
  const payload = {}
  if (data.full_name !== undefined) payload.full_name = data.full_name
  if (data.phone !== undefined) payload.phone = data.phone
  if (data.email !== undefined) payload.email = data.email
  if (data.password !== undefined) payload.password = data.password
  if (data.license_number !== undefined) payload.license_number = data.license_number
  if (data.vehicle_id !== undefined) payload.vehicle_id = data.vehicle_id
  if (data.is_available !== undefined) payload.is_available = data.is_available

  const json = await invokeEdge(`drivers/${id}`, 'PUT', payload)
  return ok({ driver: json })
}

export const deleteDriver = async (id) => {
  const json = await invokeEdge(`drivers/${id}`, 'DELETE')
  return ok(json)
}

export const updateDriverLocation = async (id, data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('drivers')
    .update({
      current_latitude: data.lat || data.latitude,
      current_longitude: data.lng || data.longitude,
      last_location_update: new Date().toISOString(),
    })
    .eq('profile_id', user.id)
  if (error) throw error
  return ok({ driver: null })
}

export const getAvailableDrivers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, drivers(*)')
    .eq('role', 'driver')
  if (error) throw error

  const drivers = (data || [])
    .filter((p) => {
      const dr = p.drivers?.[0]
      return !dr || dr.is_available !== false
    })
    .map((p) => {
      const dr = p.drivers?.[0] || {}
      return {
        id: dr.id || p.id,
        profile_id: dr.profile_id || p.id,
        full_name: dr.full_name || p.full_name,
        phone: dr.phone || p.phone,
        license_number: dr.license_number,
        vehicle_id: dr.vehicle_id,
        is_available: dr.is_available !== false,
        status: dr.status,
        email: p.email,
      }
    })

  return ok({ drivers, data: drivers })
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export const getVehicles = async (params) => {
  const { data, error } = await supabase.from('vehicles').select('*')
  if (error) throw error
  return ok({ vehicles: data || [] })
}

export const createVehicle = async (data) => {
  const { data: result, error } = await supabase
    .from('vehicles')
    .insert({
      plate_number: data.plateNumber || data.plate_number,
      vehicle_type: data.vehicle_type || data.type,
      model: data.model,
      year: data.year,
      type: data.type,
      capacity: data.capacity,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ vehicle: result })
}

export const updateVehicle = async (id, data) => {
  const updates = {}
  if (data.plate_number !== undefined || data.plateNumber !== undefined) updates.plate_number = data.plate_number || data.plateNumber
  if (data.vehicle_type !== undefined) updates.vehicle_type = data.vehicle_type
  if (data.model !== undefined) updates.model = data.model
  if (data.year !== undefined) updates.year = data.year
  if (data.type !== undefined) updates.type = data.type
  if (data.capacity !== undefined) updates.capacity = data.capacity
  if (data.status !== undefined) updates.status = data.status
  updates.updated_at = new Date().toISOString()

  const { data: result, error } = await supabase.from('vehicles').update(updates).eq('id', id).select().single()
  if (error) throw error
  return ok({ vehicle: result })
}

export const deleteVehicle = async (id) => {
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw error
  return ok({ message: 'Vehicle deleted successfully' })
}

// ─── Departments ──────────────────────────────────────────────────────────────

export const getDepartments = async (params) => {
  const { data, error } = await supabase.from('departments').select('*')
  if (error) throw error
  return ok({ departments: data || [] })
}

export const getDepartmentsWithDoctors = async () => {
  const { data: departments, error: deptError } = await supabase.from('departments').select('*')
  if (deptError) throw deptError

  const { data: doctors, error: docError } = await supabase.from('doctors').select('*, profiles!user_id(*)')
  if (docError) throw docError

  const result = (departments || []).map(d => ({
    ...d,
    doctors: (doctors || []).filter(doc => doc.department_id === d.id),
  }))

  return ok({ departments: result })
}

export const createDepartment = async (data) => {
  const { data: result, error } = await supabase
    .from('departments')
    .insert({ name: data.name, description: data.description, icon: data.icon })
    .select()
    .single()
  if (error) throw error
  return ok({ department: result })
}

export const updateDepartment = async (id, data) => {
  const { data: result, error } = await supabase
    .from('departments')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ department: result })
}

export const deleteDepartment = async (id) => {
  const { error } = await supabase.from('departments').delete().eq('id', id)
  if (error) throw error
  return ok({ message: 'Department deleted successfully' })
}

// ─── Availability ─────────────────────────────────────────────────────────────

export const getAvailability = async (params) => {
  let query = supabase.from('availability').select('*, doctors(*, profiles!user_id(*))')
  if (params?.doctor_id) query = query.eq('doctor_id', params.doctor_id)
  query = query.order('date').order('start_time')

  const { data, error } = await query
  if (error) throw error
  return ok({ slots: data || [], availability: data || [] })
}

export const createAvailabilitySlot = async (data) => {
  const { data: result, error } = await supabase
    .from('availability')
    .insert({
      doctor_id: data.doctor_id || data.doctorId,
      day_of_week: data.day_of_week,
      date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      max_appointments: data.max_appointments || 10,
      department: data.department,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ slot: result, availability: result })
}

export const deleteAvailabilitySlot = async (id) => {
  const { error } = await supabase.from('availability').delete().eq('id', id)
  if (error) throw error
  return ok({ message: 'Availability slot deleted' })
}

export const getDeptAvailability = async (deptId) => {
  const { data: doctors, error: docError } = await supabase
    .from('doctors')
    .select('id')
    .eq('department_id', deptId)
  if (docError) throw docError

  const doctorIds = (doctors || []).map(d => d.id)
  if (doctorIds.length === 0) return ok({ slots: [] })

  const { data, error } = await supabase
    .from('availability')
    .select('*, doctors(*, profiles!user_id(*))')
    .in('doctor_id', doctorIds)
    .order('date')
    .order('start_time')
  if (error) throw error
  return ok({ slots: data || [] })
}

// ─── Hospitals ────────────────────────────────────────────────────────────────

export const getHospitals = async (params) => {
  const { data, error } = await supabase
    .from('hospitals')
    .select('*')
    .eq('is_active', true)
  if (error) throw error
  return ok({ hospitals: data || [] })
}

export const getAllHospitals = async () => {
  const { data, error } = await supabase.from('hospitals').select('*').order('name')
  if (error) throw error
  return ok({ hospitals: data || [] })
}

export const createHospital = async (data) => {
  const { data: result, error } = await supabase
    .from('hospitals')
    .insert({
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      latitude: data.latitude,
      longitude: data.longitude,
      is_active: data.is_active !== false,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ hospital: result })
}

export const updateHospital = async (id, data) => {
  const { data: result, error } = await supabase
    .from('hospitals')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ hospital: result })
}

export const deleteHospital = async (id) => {
  const { error } = await supabase.from('hospitals').delete().eq('id', id)
  if (error) throw error
  return ok({ message: 'Hospital deleted successfully' })
}

// ─── Notifications ────────────────────────────────────────────────────────────

export const getNotifications = async (params) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(params?.limit || 50)

  const { data, error } = await query
  if (error) throw error
  return ok({ notifications: data || [] })
}

export const getUnreadCount = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ok({ count: 0 })

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)
  if (error) throw error
  return ok({ count: count || 0 })
}

export const createNotification = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: result, error } = await supabase
    .from('notifications')
    .insert({
      user_id: data.targetUserId || data.user_id,
      title: data.title,
      message: data.message,
      type: data.type,
      sender_id: user.id,
      is_read: false,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ notification: result })
}

export const markNotificationRead = async (id) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: result, error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw error
  return ok({ notification: result })
}

// ─── Fees ─────────────────────────────────────────────────────────────────────

export const getFees = async (params) => {
  const { data, error } = await supabase
    .from('fees')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ fees: data || [] })
}

export const getFeesAdmin = async (params) => {
  const { data, error } = await supabase
    .from('fees')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ fees: data || [] })
}

export const createFee = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: result, error } = await supabase
    .from('fees')
    .insert({
      name: data.name,
      title: data.title,
      description: data.description,
      amount: data.amount,
      category: data.category || 'general',
      status: data.status || 'draft',
      department_id: data.department_id,
      created_by: user?.id,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ fee: result })
}

export const updateFee = async (id, data) => {
  const { data: result, error } = await supabase
    .from('fees')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ fee: result })
}

export const deleteFee = async (id) => {
  const { error } = await supabase.from('fees').delete().eq('id', id)
  if (error) throw error
  return ok({ message: 'Fee deleted successfully' })
}

// ─── Prescriptions ────────────────────────────────────────────────────────────

export const getPrescriptions = async (params) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('repeat_prescriptions')
    .select('*, doctors(*, profiles!user_id(*))')
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ prescriptions: data || [] })
}

export const requestPrescription = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: result, error } = await supabase
    .from('repeat_prescriptions')
    .insert({
      patient_id: user.id,
      medication_name: data.medication || data.medication_name,
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      email: data.email,
      phone: data.phone,
      address: data.address,
      doctor_name: data.name_of_gp || data.doctor_name,
      pharmacy: data.pharmacy,
      additional_info: data.additional_info,
      is_private_patient: data.is_private_patient,
      consent: data.consent,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return ok({ prescription: result })
}

export const getPrescriptionsAdmin = async (params) => {
  let query = supabase
    .from('repeat_prescriptions')
    .select('*, profiles(*), doctors(*, profiles!user_id(*))')
    .order('created_at', { ascending: false })

  if (params?.status) query = query.eq('status', params.status)

  const { data, error } = await query
  if (error) throw error
  return ok({ prescriptions: data || [] })
}

export const approvePrescription = async (id, data) => {
  const { data: result, error } = await supabase
    .from('repeat_prescriptions')
    .update({
      status: data.status,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ prescription: result })
}

// ─── Illness Certificates ─────────────────────────────────────────────────────

export const requestIllnessCert = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: result, error } = await supabase
    .from('illness_certificates')
    .insert({
      patient_id: user.id,
      reason: data.reason,
      start_date: data.certificate_start_date || data.start_date,
      end_date: data.certificate_end_date || data.end_date,
      doctor_name: '',
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      email: data.email,
      phone: data.phone,
      address: data.address,
      status: 'pending',
    })
    .select()
    .single()
  if (error) throw error
  return ok({ certificate: result })
}

export const getIllnessCertsAdmin = async (params) => {
  let query = supabase
    .from('illness_certificates')
    .select('*, profiles(*), doctors(*, profiles!user_id(*))')
    .order('created_at', { ascending: false })

  if (params?.status) query = query.eq('status', params.status)

  const { data, error } = await query
  if (error) throw error
  return ok({ certificates: data || [] })
}

export const approveIllnessCert = async (id, data) => {
  const { data: result, error } = await supabase
    .from('illness_certificates')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ certificate: result })
}

// ─── Contact / Messages ───────────────────────────────────────────────────────

export const sendContact = async (data) => {
  const { data: result, error } = await supabase
    .from('contact_messages')
    .insert({
      name: data.full_name || data.name,
      email: data.email,
      phone: data.phone,
      subject: data.subject,
      message: data.message,
      status: 'unread',
    })
    .select()
    .single()
  if (error) throw error
  return ok({ message: result })
}

export const getMyContacts = async (params) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase.from('profiles').select('email').eq('id', user.id).single()

  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .eq('email', profile?.email || '')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ messages: data || [] })
}

export const updateContact = async (id, data) => {
  const { data: result, error } = await supabase
    .from('contact_messages')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ message: result })
}

export const getAdminMessages = async (params) => {
  let query = supabase.from('contact_messages').select('*')
  if (params?.status) query = query.eq('status', params.status)
  const { data, error } = await query
  if (error) throw error
  return ok({ messages: data || [] })
}

// ─── Admin Users ──────────────────────────────────────────────────────────────

export const getAdminUsers = async (params) => {
  let query = supabase.from('profiles').select('*, doctors(*), drivers(*)')
  if (params?.role) query = query.eq('role', params.role)
  const { data, error } = await query
  if (error) throw error
  return ok({ users: data || [] })
}

export const createAdminUser = async (data) => {
  const json = await invokeEdge('admin/users', 'POST', {
    email: data.email,
    password: data.password,
    full_name: data.fullName || data.full_name,
    phone: data.phone,
    role: data.role,
  })
  return ok({ user: json.user })
}

export const createDoctorAccount = async (data) => {
  const json = await invokeEdge('admin/doctors', 'POST', {
    email: data.email,
    password: data.password,
    full_name: data.fullName || data.full_name,
    phone: data.phone,
    department_id: data.departmentId || data.department_id,
    specialty: data.specialty,
  })
  return ok({ doctor: json.doctor })
}

export const updateAdminUser = async (id, data) => {
  const json = await invokeEdge(`admin/users/${id}`, 'PUT', data)
  return ok({ user: json.user })
}

export const updateDoctorAccount = async (id, data) => {
  const json = await invokeEdge(`admin/doctors/${id}`, 'PUT', data)
  return ok({ user: json.user })
}

export const deleteUser = async (id) => {
  const json = await invokeEdge(`admin/users/${id}`, 'DELETE')
  return ok(json)
}

export const flagUser = async (id, reason) => {
  const json = await invokeEdge(`admin/users/${id}/flag`, 'POST', { reason })
  return ok(json)
}

export const unflagUser = async (id) => {
  const json = await invokeEdge(`admin/users/${id}/unflag`, 'POST')
  return ok(json)
}

export const rewardUser = async (id, amount, reason) => {
  const json = await invokeEdge(`admin/users/${id}/reward`, 'POST', { amount, reason })
  return ok(json)
}

export const deleteMyAccount = async () => {
  const json = await invokeEdge('delete-account', 'DELETE')
  return ok(json)
}

export const requestPasswordReset = async (email) => {
  const json = await invokeEdge('forgot-password', 'POST', {
    email,
    redirectTo: `${window.location.origin}/reset-password`,
  })
  return ok(json)
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export const getAnalytics = async (params) => {
  const [
    usersResult,
    doctorsResult,
    appointmentsResult,
    consultationsResult,
    emergencyResult,
    deptsResult,
    hospitalsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'doctor'),
    supabase.from('appointments').select('id, status', { count: 'exact' }),
    supabase.from('consultations').select('id, status', { count: 'exact' }),
    supabase.from('ambulance_requests').select('id, status', { count: 'exact' }).not('status', 'in', '(completed,cancelled)'),
    supabase.from('departments').select('id', { count: 'exact', head: true }),
    supabase.from('hospitals').select('id', { count: 'exact', head: true }),
  ])

  const aptData = appointmentsResult.data || []
  const conData = consultationsResult.data || []
  const emgData = emergencyResult.data || []

  return ok({
    totalUsers: usersResult.count || 0,
    totalDoctors: doctorsResult.count || 0,
    totalDepartments: deptsResult.count || 0,
    totalHospitals: hospitalsResult.count || 0,
    appointments: {
      total: appointmentsResult.count || 0,
      pending: aptData.filter(a => a.status === 'pending').length,
      completed: aptData.filter(a => a.status === 'completed').length,
    },
    consultations: {
      total: consultationsResult.count || 0,
      open: conData.filter(c => c.status === 'open').length,
      resolved: conData.filter(c => c.status === 'resolved').length,
    },
    ambulanceRequests: {
      total: (emergencyResult.count || 0) + emgData.length,
      active: emergencyResult.count || 0,
      completed: emgData.filter(e => e.status === 'completed').length,
    },
  })
}

// ─── Form Templates & Submissions ─────────────────────────────────────────────

export const getFormTemplates = async () => {
  const { data, error } = await supabase
    .from('form_templates')
    .select('*')
    .eq('is_active', true)
    .order('title')
  if (error) throw error
  return ok({ forms: data || [] })
}

export const getFormTemplatesAdmin = async () => {
  const { data, error } = await supabase
    .from('form_templates')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ forms: data || [] })
}

export const createFormTemplate = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: result, error } = await supabase
    .from('form_templates')
    .insert({
      title: data.title,
      description: data.description || '',
      icon: data.icon || '📋',
      category: data.category || 'general',
      form_code: data.form_code || '',
      revision: data.revision || 'Rev. 1.0',
      fields: data.fields || [],
      header_extra: data.header_extra || {},
      is_active: data.is_active !== false,
      created_by: user?.id,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ form: result })
}

export const updateFormTemplate = async (id, data) => {
  const { data: result, error } = await supabase
    .from('form_templates')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ form: result })
}

export const deleteFormTemplate = async (id) => {
  const { error } = await supabase.from('form_templates').delete().eq('id', id)
  if (error) throw error
  return ok({ message: 'Form template deleted successfully' })
}

export const getMyFormSubmissions = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return ok({ submissions: [] })

  const { data, error } = await supabase
    .from('form_submissions')
    .select('*, form_templates(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ submissions: data || [] })
}

export const createFormSubmission = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: result, error } = await supabase
    .from('form_submissions')
    .insert({
      template_id: data.template_id,
      user_id: user?.id || null,
      data: data.data || {},
      reference_no: data.reference_no || '',
      source: data.source || 'manual',
    })
    .select()
    .single()
  if (error) throw error
  return ok({ submission: result })
}

// Complete onboarding: persist the digital medical profile and save a
// form_submission per completed onboarding form (source = 'onboarding').
export const saveOnboarding = async ({ medical_profile, forms }) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      medical_profile: medical_profile || {},
      onboarding_status: 'complete',
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
  if (profileError) throw profileError

  const submissions = []
  for (const f of forms || []) {
    const { data: sub, error } = await supabase
      .from('form_submissions')
      .insert({
        template_id: f.template_id,
        user_id: user.id,
        data: f.data || {},
        reference_no: f.reference_no || '',
        source: 'onboarding',
      })
      .select()
      .single()
    if (error) throw error
    submissions.push(sub)
  }

  return ok({ message: 'Onboarding completed successfully', submissions })
}

// Patients + their digital medical records for the admin dashboard.
export const getPatientsWithRecords = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, address, gender, date_of_birth, onboarding_status, onboarding_completed_at, medical_profile, created_at, updated_at')
    .eq('role', 'user')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ patients: data || [] })
}

// ─── Events (public announcements, up to 4 images + caption) ──────────────────

export const getEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ events: data || [] })
}

export const getEventsAdmin = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ events: data || [] })
}

export const createEvent = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: result, error } = await supabase
    .from('events')
    .insert({
      title: data.title || '',
      description: data.description || '',
      images: data.images || [],
      category: data.category || '',
      is_active: data.is_active !== false,
      created_by: user?.id,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ event: result })
}

export const updateEvent = async (id, data) => {
  const { data: result, error } = await supabase
    .from('events')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ event: result })
}

export const deleteEvent = async (id) => {
  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) throw error
  return ok({ message: 'Event deleted successfully' })
}

// Upload an image to the public 'images' bucket for an event.
export const uploadEventImage = async (file) => {
  const ext = (file.name || 'jpg').split('.').pop().toLowerCase()
  const path = `events/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { contentType: file.type || 'image/jpeg', cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}

// Delete uploaded event images from storage (used on event delete / replace).
export const deleteEventImages = async (urls = []) => {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/images/`
  const paths = urls
    .filter((u) => typeof u === 'string' && u.startsWith(prefix))
    .map((u) => decodeURIComponent(u.slice(prefix.length)))
  if (!paths.length) return
  const { error } = await supabase.storage.from('images').remove(paths)
  if (error) throw error
  return ok({ message: 'Event images deleted' })
}

// ─── Programmes (behaves like events) ──────────────────────────────────────────

export const getProgrammes = async () => {
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ programmes: data || [] })
}

export const getProgrammesAdmin = async () => {
  const { data, error } = await supabase
    .from('programmes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ programmes: data || [] })
}

export const createProgramme = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: result, error } = await supabase
    .from('programmes')
    .insert({
      title: data.title || '',
      description: data.description || '',
      images: data.images || [],
      category: data.category || '',
      is_active: data.is_active !== false,
      created_by: user?.id,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ programme: result })
}

export const updateProgramme = async (id, data) => {
  const { data: result, error } = await supabase
    .from('programmes')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ programme: result })
}

export const deleteProgramme = async (id) => {
  const { error } = await supabase.from('programmes').delete().eq('id', id)
  if (error) throw error
  return ok({ message: 'Programme deleted successfully' })
}

// Upload an image to the public 'images' bucket under a folder prefix.
export const uploadImage = async (file, folder = 'programmes') => {
  const ext = (file.name || 'jpg').split('.').pop().toLowerCase()
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { contentType: file.type || 'image/jpeg', cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('images').getPublicUrl(path)
  return data.publicUrl
}

export const uploadProgrammeImage = async (file) => uploadImage(file, 'programmes')

// Delete uploaded programme images from storage.
export const deleteProgrammeImages = async (urls = []) => {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/images/`
  const paths = urls
    .filter((u) => typeof u === 'string' && u.startsWith(prefix))
    .map((u) => decodeURIComponent(u.slice(prefix.length)))
  if (!paths.length) return
  const { error } = await supabase.storage.from('images').remove(paths)
  if (error) throw error
  return ok({ message: 'Programme images deleted' })
}

// ─── Partners (org name + logo) ─────────────────────────────────────────────────

export const getPartners = async () => {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ partners: data || [] })
}

export const getPartnersAdmin = async () => {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return ok({ partners: data || [] })
}

export const createPartner = async (data) => {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: result, error } = await supabase
    .from('partners')
    .insert({
      name: data.name || '',
      logo_url: data.logo_url || null,
      is_active: data.is_active !== false,
      created_by: user?.id,
    })
    .select()
    .single()
  if (error) throw error
  return ok({ partner: result })
}

export const updatePartner = async (id, data) => {
  const { data: result, error } = await supabase
    .from('partners')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return ok({ partner: result })
}

export const deletePartner = async (id) => {
  const { error } = await supabase.from('partners').delete().eq('id', id)
  if (error) throw error
  return ok({ message: 'Partner deleted successfully' })
}

export const uploadPartnerLogo = async (file) => uploadImage(file, 'partners')

// Delete a partner logo from storage.
export const deletePartnerLogo = async (url) => {
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/images/`
  if (typeof url !== 'string' || !url.startsWith(prefix)) return
  const path = decodeURIComponent(url.slice(prefix.length))
  const { error } = await supabase.storage.from('images').remove([path])
  if (error) throw error
  return ok({ message: 'Partner logo deleted' })
}

// ─── Default export (for backward compat) ─────────────────────────────────────

const api = {
  login,
  signup,
  getProfile,
  updateProfile,
  getDoctors,
  getDoctorsDepartments,
  deleteDoctor,
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getConsultations,
  createConsultation,
  updateConsultation,
  dispatchAmbulance,
  dispatchAmbulanceGuest,
  getAmbulanceHistory,
  getActiveEmergencies,
  getLiveAmbulances,
  getDriverActiveRides,
  getDriverRides,
  trackAmbulance,
  assignDriver,
  cancelAmbulanceRequest,
  updateRideStatus,
  getDrivers,
  createDriverWithAccount,
  updateDriver,
  deleteDriver,
  updateDriverLocation,
  getAvailableDrivers,
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getDepartments,
  getDepartmentsWithDoctors,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getAvailability,
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getDeptAvailability,
  getHospitals,
  getAllHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
  getNotifications,
  getUnreadCount,
  createNotification,
  markNotificationRead,
  getFees,
  getFeesAdmin,
  createFee,
  updateFee,
  deleteFee,
  getPrescriptions,
  requestPrescription,
  getPrescriptionsAdmin,
  approvePrescription,
  requestIllnessCert,
  getIllnessCertsAdmin,
  approveIllnessCert,
  sendContact,
  getMyContacts,
  updateContact,
  getAdminMessages,
  getAdminUsers,
  createAdminUser,
  createDoctorAccount,
  updateAdminUser,
  updateDoctorAccount,
  deleteUser,
  flagUser,
  unflagUser,
  rewardUser,
  deleteMyAccount,
  requestPasswordReset,
  getAnalytics,
  getFormTemplates,
  getFormTemplatesAdmin,
  createFormTemplate,
  updateFormTemplate,
  deleteFormTemplate,
  getMyFormSubmissions,
  createFormSubmission,
  saveOnboarding,
  getPatientsWithRecords,
  getEvents,
  getEventsAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadEventImage,
  deleteEventImages,
  getProgrammes,
  getProgrammesAdmin,
  createProgramme,
  updateProgramme,
  deleteProgramme,
  uploadImage,
  uploadProgrammeImage,
  deleteProgrammeImages,
  getPartners,
  getPartnersAdmin,
  createPartner,
  updatePartner,
  deletePartner,
  uploadPartnerLogo,
  deletePartnerLogo,
}

export default api
