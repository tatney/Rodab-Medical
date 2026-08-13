import React, { useState, useEffect } from 'react'
import { getAppointments, getDepartments, getDeptAvailability, createAppointment, deleteAppointment } from '../api'
import SEO from '../components/SEO'
import colors from '../utils/colors'

const statusStyles = {
  pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  confirmed: { bg: '#dbeafe', color: '#1e40af', label: 'Confirmed' },
  completed: { bg: '#dcfce7', color: '#166534', label: 'Completed' },
  cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
}

const timeSlots = []
for (let h = 8; h < 17; h++) {
  timeSlots.push(`${String(h).padStart(2, '0')}:00`)
  timeSlots.push(`${String(h).padStart(2, '0')}:30`)
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

function dayOfWeekIndex(value) {
  if (value === null || value === undefined || value === '') return null
  const str = String(value).trim().toLowerCase()
  if (/^\d+$/.test(str)) return Number(str)
  const idx = DAY_NAMES.indexOf(str)
  return idx === -1 ? null : idx
}

// An availability row covers the selected date when its exact date matches or
// its day_of_week matches the weekday of that date.
function coversDate(row, date) {
  if (!date) return false
  if (row.date) {
    if (String(row.date).slice(0, 10) === date) return true
  }
  const rowDow = dayOfWeekIndex(row.day_of_week)
  if (rowDow === null) return false
  return rowDow === new Date(`${date}T00:00:00`).getDay()
}

// A half-hour slot is bookable when it falls inside a doctor's availability window.
function coversSlot(row, slot, date) {
  if (!coversDate(row, date)) return false
  const start = String(row.start_time || '').slice(0, 5)
  const end = String(row.end_time || '').slice(0, 5)
  if (!start || !end) return false
  return slot >= start && slot < end
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: `1px solid ${colors.gray300}`,
  fontSize: 15,
  fontFamily: 'Barlow, sans-serif',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  backgroundColor: colors.white,
  color: colors.gray900,
}

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 14,
  fontWeight: 600,
  color: colors.gray700,
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)

  const [formOpen, setFormOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [aptRes, deptRes] = await Promise.all([getAppointments(), getDepartments()])
      setAppointments(aptRes.data?.appointments || aptRes.data || [])
      setDepartments(deptRes.data?.departments || deptRes.data || [])
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedDept) return
    async function fetchSlots() {
      try {
        const dept = departments.find((d) => (d.id || d.name) === selectedDept)
        if (dept?.id) {
          const res = await getDeptAvailability(dept.id)
          setAvailableSlots(res.data?.slots || res.data || [])
        }
      } catch {
        setAvailableSlots([])
      }
    }
    fetchSlots()
  }, [selectedDept, departments])

  const handleBook = async (e) => {
    e.preventDefault()
    setError('')
    if (!selectedDept || !selectedDate || !selectedSlot) {
      setError('Please select a department, date, and time slot.')
      return
    }
    setSubmitting(true)
    try {
      const matchedSlot = availableSlots.find((s) => coversSlot(s, selectedSlot, selectedDate))
      await createAppointment({
        doctor_id: matchedSlot?.doctor_id,
        appointment_date: selectedDate,
        appointment_time: selectedSlot,
        reason,
      })
      setFormOpen(false)
      setSelectedDept('')
      setSelectedDate('')
      setSelectedSlot('')
      setReason('')
      loadData()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create appointment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return
    try {
      await deleteAppointment(id)
      loadData()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to cancel appointment.')
    }
  }

  const totalAppointments = appointments.length
  const upcomingCount = appointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed'
  ).length
  const completedCount = appointments.filter((a) => a.status === 'completed').length
  const cancelledCount = appointments.filter((a) => a.status === 'cancelled').length

  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'upcoming') return a.status === 'pending' || a.status === 'confirmed'
    if (filter === 'completed') return a.status === 'completed'
    if (filter === 'cancelled') return a.status === 'cancelled'
    return true
  })

  const filterTabs = [
    { key: 'all', label: `All (${totalAppointments})` },
    { key: 'upcoming', label: `Upcoming (${upcomingCount})` },
    { key: 'completed', label: `Completed (${completedCount})` },
    { key: 'cancelled', label: `Cancelled (${cancelledCount})` },
  ]

  return (
    <div style={{ padding: '48px 24px', maxWidth: 1100, margin: '0 auto' }}>
      <SEO
        title="Book Appointment"
        description="Book medical appointments online at Rodab Medical. Choose your doctor and preferred time slot."
        url="/appointments"
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: colors.gray900,
              margin: 0,
              fontFamily: 'Barlow, sans-serif',
            }}
          >
            My Appointments
          </h1>
          <p
            style={{
              fontSize: 15,
              color: colors.gray500,
              marginTop: 4,
              fontFamily: 'Barlow, sans-serif',
            }}
          >
            View and manage your medical appointments
          </p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          aria-expanded={formOpen}
          style={{
            padding: '12px 24px',
            backgroundColor: formOpen ? colors.gray200 : colors.primary,
            color: formOpen ? colors.gray700 : colors.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'Barlow, sans-serif',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!formOpen) e.target.style.backgroundColor = colors.primaryLight
          }}
          onMouseLeave={(e) => {
            if (!formOpen) e.target.style.backgroundColor = colors.primary
          }}
        >
          {formOpen ? 'Cancel' : '+ New Appointment'}
        </button>
      </div>

      {/* Stats Row */}
      {!formOpen && !loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              border: `1px solid ${colors.gray200}`,
              borderLeft: `4px solid ${colors.primary}`,
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: colors.gray500,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                margin: 0,
                fontFamily: 'Barlow, sans-serif',
              }}
            >
              Total Appointments
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: colors.gray900,
                margin: '4px 0 0',
                fontFamily: 'Barlow, sans-serif',
              }}
            >
              {totalAppointments}
            </p>
          </div>
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              border: `1px solid ${colors.gray200}`,
              borderLeft: `4px solid ${colors.warning}`,
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: colors.gray500,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                margin: 0,
                fontFamily: 'Barlow, sans-serif',
              }}
            >
              Upcoming
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: colors.gray900,
                margin: '4px 0 0',
                fontFamily: 'Barlow, sans-serif',
              }}
            >
              {upcomingCount}
            </p>
          </div>
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              border: `1px solid ${colors.gray200}`,
              borderLeft: `4px solid ${colors.success}`,
              padding: '20px 24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: colors.gray500,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                margin: 0,
                fontFamily: 'Barlow, sans-serif',
              }}
            >
              Completed
            </p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: colors.gray900,
                margin: '4px 0 0',
                fontFamily: 'Barlow, sans-serif',
              }}
            >
              {completedCount}
            </p>
          </div>
        </div>
      )}

      {/* Booking Form */}
      {formOpen && (
        <div
          style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            padding: 32,
            marginBottom: 32,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ borderLeft: `4px solid ${colors.primary}`, paddingLeft: 16, marginBottom: 24 }}>
            <h3
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: colors.gray900,
                margin: 0,
                fontFamily: 'Barlow, sans-serif',
              }}
            >
              Book New Appointment
            </h3>
            <p style={{ fontSize: 14, color: colors.gray500, margin: '4px 0 0', fontFamily: 'Barlow, sans-serif' }}>
              Fill in the details below to schedule your visit
            </p>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                backgroundColor: colors.dangerLight,
                border: `1px solid ${colors.dangerBorder}`,
                color: colors.danger,
                fontSize: 14,
                marginBottom: 20,
                fontFamily: 'Barlow, sans-serif',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleBook}>
            <div className="grid-form-fields" style={{ gap: 16, marginBottom: 24 }}>
              <div>
                <label htmlFor="department" style={labelStyle}>Department</label>
                <select
                  id="department"
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value)
                    setSelectedSlot('')
                  }}
                  required
                  style={{
                    ...inputStyle,
                    cursor: 'pointer',
                    appearance: 'auto',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}22`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.gray300
                    e.target.style.boxShadow = 'none'
                  }}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="appointmentDate" style={labelStyle}>Date</label>
                <input
                  id="appointmentDate"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedSlot('')
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={inputStyle}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary
                    e.target.style.boxShadow = `0 0 0 3px ${colors.primary}22`
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.gray300
                    e.target.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Time Slots */}
            <div style={{ marginBottom: 24 }}>
              <label id="time-slot-label" style={labelStyle}>Select Time</label>
              {selectedDate && (
                <p style={{ fontSize: 13, color: colors.gray500, margin: '0 0 8px', fontFamily: 'Barlow, sans-serif' }}>
                  {availableSlots.some((s) => coversDate(s, selectedDate))
                    ? 'Available times are based on the doctors\u2019 schedules for this department and date.'
                    : 'No availability set for this date yet. Please pick another date.'}
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }} role="group" aria-labelledby="time-slot-label">
                {timeSlots.map((slot) => {
                  const isAvailable = availableSlots.some((s) => coversSlot(s, slot, selectedDate))
                  const isSelected = selectedSlot === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: 8,
                        border: `1px solid ${isSelected ? colors.primary : colors.gray200}`,
                        backgroundColor: isAvailable
                          ? isSelected
                            ? colors.primary
                            : colors.white
                          : colors.gray50,
                        color: isAvailable
                          ? isSelected
                            ? colors.white
                            : colors.gray700
                          : colors.gray400,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        fontFamily: 'Barlow, sans-serif',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? `0 2px 8px ${colors.primary}33` : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (isAvailable && !isSelected) {
                          e.target.style.borderColor = colors.primary
                          e.target.style.backgroundColor = `${colors.primary}0a`
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (isAvailable && !isSelected) {
                          e.target.style.borderColor = colors.gray200
                          e.target.style.backgroundColor = colors.white
                        }
                      }}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Reason */}
            <div style={{ marginBottom: 24 }}>
              <label htmlFor="reason" style={labelStyle}>Reason (optional)</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe your symptoms or reason for visit..."
                rows={3}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary}22`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.gray300
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 32px',
                backgroundColor: submitting ? colors.gray300 : colors.primary,
                color: colors.white,
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: 'Barlow, sans-serif',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!submitting) e.target.style.backgroundColor = colors.primaryLight
              }}
              onMouseLeave={(e) => {
                if (!submitting) e.target.style.backgroundColor = colors.primary
              }}
            >
              {submitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      {!loading && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: filter === tab.key ? colors.primary : colors.white,
                color: filter === tab.key ? colors.white : colors.gray700,
                border: `1px solid ${filter === tab.key ? colors.primary : colors.gray300}`,
                fontFamily: 'Barlow, sans-serif',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Appointment List */}
      {loading ? (
        <div
          role="status"
          aria-live="polite"
          style={{
            textAlign: 'center',
            padding: 60,
            color: colors.gray500,
            fontFamily: 'Barlow, sans-serif',
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          Loading appointments...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div
          style={{
            backgroundColor: colors.white,
            borderRadius: 12,
            border: `1px solid ${colors.gray200}`,
            padding: '60px 32px',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.6 }}>&#128197;</div>
          <p
            style={{
              fontSize: 16,
              color: colors.gray500,
              margin: '0 0 20px',
              fontFamily: 'Barlow, sans-serif',
            }}
          >
            {appointments.length === 0
              ? 'No appointments yet. Click "New Appointment" to book one.'
              : `No ${filter === 'upcoming' ? 'upcoming' : filter} appointments.`}
          </p>
          <button
            onClick={() => setFormOpen(true)}
            style={{
              padding: '10px 24px',
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Barlow, sans-serif',
            }}
          >
            {appointments.length === 0 ? '+ Book Your First Appointment' : '+ New Appointment'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filteredAppointments.map((apt) => {
            const status = statusStyles[apt.status] || statusStyles.pending
            return (
              <div
                key={apt.id}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  border: `1px solid ${colors.gray200}`,
                  borderLeft: `4px solid ${colors.accent}`,
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: colors.gray900,
                      marginBottom: 4,
                      margin: '0 0 4px',
                      fontFamily: 'Barlow, sans-serif',
                    }}
                  >
                    {apt.department?.name || apt.department_name || 'General'}
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: colors.gray500,
                      margin: '0 0 2px',
                      fontFamily: 'Barlow, sans-serif',
                    }}
                  >
                    Dr. {apt.doctor?.full_name || apt.doctor_name || 'TBD'}
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: colors.gray500,
                      margin: 0,
                      fontFamily: 'Barlow, sans-serif',
                    }}
                  >
                    {apt.appointment_date
                      ? new Date(`${apt.appointment_date}T00:00:00`).toLocaleDateString()
                      : ''}
                    {apt.appointment_time ? ` at ${String(apt.appointment_time).slice(0, 5)}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span
                    style={{
                      padding: '6px 16px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 600,
                      backgroundColor: status.bg,
                      color: status.color,
                      fontFamily: 'Barlow, sans-serif',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {status.label}
                  </span>
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <button
                      type="button"
                      onClick={() => handleCancel(apt.id)}
                      style={{
                        padding: '6px 14px',
                        backgroundColor: colors.dangerLight,
                        color: colors.danger,
                        border: `1px solid ${colors.dangerBorder}`,
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'Barlow, sans-serif',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
