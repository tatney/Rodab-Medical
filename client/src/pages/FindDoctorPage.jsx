import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getDoctors, getDoctorsDepartments, getDeptAvailability, createAppointment } from '../api'
import SEO from '../components/SEO'
import { useToast } from '../components/ToastContext'

const timeSlots = []
for (let h = 8; h < 17; h++) {
  timeSlots.push(`${String(h).padStart(2, '0')}:00`)
  timeSlots.push(`${String(h).padStart(2, '0')}:30`)
}

const colors = {
  primary: '#1e40af',
  red: '#dc2626',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
  green: '#16a34a',
}

export default function FindDoctorPage() {
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [loading, setLoading] = useState(true)

  const [bookingDoctor, setBookingDoctor] = useState(null)
  const [bookingDate, setBookingDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('')
  const [availableSlots, setAvailableSlots] = useState([])
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const bookingModalRef = useRef(null)

  const toast = useToast()

  useEffect(() => {
    if (!bookingDoctor || !bookingModalRef.current) return;

    const modal = bookingModalRef.current;
    const focusable = modal.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      setTimeout(() => focusable[0].focus(), 50);
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setBookingDoctor(null);
        return;
      }
      if (e.key === 'Tab') {
        const els = modal.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [bookingDoctor]);

  useEffect(() => {
    async function load() {
      try {
        const [docsRes, deptRes] = await Promise.all([getDoctors(), getDoctorsDepartments()])
        setDoctors(docsRes.data?.doctors || docsRes.data || [])
        setDepartments(deptRes.data?.departments || deptRes.data || [])
      } catch (err) {
        console.error('Failed to load doctors:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const fetchAvailability = useCallback(async (deptId) => {
    if (!deptId) return
    try {
      const res = await getDeptAvailability(deptId)
      setAvailableSlots(res.data?.slots || res.data || [])
    } catch {
      setAvailableSlots([])
    }
  }, [])

  useEffect(() => {
    if (bookingDoctor?.department_id || bookingDoctor?.department?.id) {
      fetchAvailability(bookingDoctor.department_id || bookingDoctor.department?.id)
    }
  }, [bookingDoctor, fetchAvailability])

  const filteredDoctors = doctors.filter((doc) => {
    const name = doc.full_name || doc.name || ''
    const dept = doc.department?.name || doc.department_name || doc.department || ''
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase())
    const matchesDept = !selectedDept || dept.toLowerCase().includes(selectedDept.toLowerCase())
    return matchesSearch && matchesDept
  })

  const handleBook = async () => {
    if (!bookingDoctor || !bookingDate || !selectedSlot) return
    setBookingLoading(true)
    try {
      await createAppointment({
        doctor_id: bookingDoctor.id,
        date: bookingDate,
        time: selectedSlot,
        reason,
      })
      setBookingSuccess(true)
      setTimeout(() => {
        setBookingDoctor(null)
        setBookingSuccess(false)
        setBookingDate('')
        setSelectedSlot('')
        setReason('')
      }, 2500)
    } catch (err) {
      console.error('Booking failed:', err)
      toast.error(err.response?.data?.error || err.message || 'Booking failed. Please try again.')
    } finally {
      setBookingLoading(false)
    }
  }

  const openBooking = (doc) => {
    setBookingDoctor(doc)
    setBookingDate('')
    setSelectedSlot('')
    setReason('')
    setBookingSuccess(false)
  }

  return (
    <div style={{ padding: '64px 24px', maxWidth: 1200, margin: '0 auto' }}>
      <SEO title="Find a Doctor" description="Search and find experienced doctors and specialists at Rodab Medical. Book consultations online." url="/find-doctor" />
      <h1 style={{ fontSize: 36, fontWeight: 800, color: colors.gray900, marginBottom: 8 }}>
        Find a Doctor
      </h1>
      <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 32 }}>
        Search our team of specialists and book an appointment
      </p>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
        <input
          type="text"
          aria-label="Search by doctor name"
          placeholder="Search by doctor name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 240,
            padding: '12px 16px',
            borderRadius: 8,
            border: `1px solid ${colors.gray300}`,
            fontSize: 15,
          }}
          onFocus={(e) => (e.target.style.borderColor = colors.primary)}
          onBlur={(e) => (e.target.style.borderColor = colors.gray300)}
        />
        <select
          aria-label="Filter by department"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{
            minWidth: 200,
            padding: '12px 16px',
            borderRadius: 8,
            border: `1px solid ${colors.gray300}`,
            fontSize: 15,
            backgroundColor: colors.white,
            cursor: 'pointer',
          }}
        >
          <option value="">All Specialties</option>
          {departments.map((dept) => (
            <option key={dept.id || dept} value={dept.name || dept}>
              {dept.name || dept}
            </option>
          ))}
        </select>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.gray500 }} role="status" aria-live="polite">Loading doctors...</div>
      ) : filteredDoctors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.gray500 }}>
          No doctors found matching your criteria.
        </div>
      ) : (
        <div className="grid-3-col" style={{ gap: 24 }}>
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                border: `1px solid ${colors.gray200}`,
                padding: 24,
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: colors.primary,
                    color: colors.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {(doc.full_name || doc.name || '?')[0]}
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.gray900, margin: 0 }}>
                    Dr. {doc.full_name || doc.name}
                  </h3>
                  <p style={{ fontSize: 13, color: colors.gray500, margin: 0 }}>
                    {doc.specialty || doc.department?.name || doc.department_name || 'General'}
                  </p>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: colors.gray600 }}>Department: </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.gray700 }}>
                  {doc.department?.name || doc.department_name || doc.department || 'N/A'}
                </span>
              </div>
              <div style={{ marginBottom: 20 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 500,
                    color: doc.is_available !== false ? colors.green : colors.red,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: doc.is_available !== false ? colors.green : colors.red,
                      display: 'inline-block',
                    }}
                  />
                  {doc.is_available !== false ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <button
                onClick={() => openBooking(doc)}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  minHeight: 44,
                  backgroundColor: colors.primary,
                  color: colors.white,
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {bookingDoctor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={(e) => e.target === e.currentTarget && setBookingDoctor(null)}
        >
          <div
            ref={bookingModalRef}
            style={{
              backgroundColor: colors.white,
              borderRadius: 16,
              padding: 36,
              width: 480,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>&#10003;</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: colors.green, marginBottom: 8 }}>
                  Appointment Booked!
                </h3>
                <p style={{ color: colors.gray500 }}>You will receive a confirmation shortly.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 id="booking-modal-title" style={{ fontSize: 22, fontWeight: 700, color: colors.gray900 }}>
                    Book Dr. {bookingDoctor.full_name || bookingDoctor.name}
                  </h2>
                  <button
                    aria-label="Close dialog"
                    onClick={() => setBookingDoctor(null)}
                    style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: colors.gray500 }}
                  >
                    &times;
                  </button>
                </div>

                {/* Date Picker */}
                <label htmlFor="booking-date" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
                  Select Date
                </label>
                <input
                  id="booking-date"
                  type="date"
                  value={bookingDate}
                  onChange={(e) => { setBookingDate(e.target.value); setSelectedSlot('') }}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${colors.gray300}`,
                    fontSize: 15,
                    marginBottom: 20,
                  }}
                />

                {/* Time Slot Grid */}
                <label id="booking-time-slot-label" style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
                  Select Time
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 20 }} role="group" aria-labelledby="booking-time-slot-label">
                  {timeSlots.map((slot) => {
                    const isTaken = availableSlots.some(
                      (s) => s.time === slot && s.date === bookingDate && s.taken
                    )
                    return (
                      <button
                        key={slot}
                        disabled={isTaken}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: 6,
                          border: `1px solid ${selectedSlot === slot ? colors.primary : colors.gray200}`,
                          backgroundColor: isTaken
                            ? colors.gray100
                            : selectedSlot === slot
                              ? colors.primary
                              : colors.white,
                          color: isTaken
                            ? colors.gray300
                            : selectedSlot === slot
                              ? colors.white
                              : colors.gray700,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: isTaken ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>

                {/* Reason */}
                <label htmlFor="booking-reason" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: colors.gray700 }}>
                  Reason for Visit
                </label>
                <textarea
                  id="booking-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe your symptoms or reason for appointment..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${colors.gray300}`,
                    fontSize: 14,
                    resize: 'vertical',
                    marginBottom: 24,
                    fontFamily: 'inherit',
                  }}
                />

                <button
                  onClick={handleBook}
                  disabled={!bookingDate || !selectedSlot || bookingLoading}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    backgroundColor: !bookingDate || !selectedSlot ? colors.gray300 : colors.primary,
                    color: colors.white,
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: !bookingDate || !selectedSlot ? 'not-allowed' : 'pointer',
                  }}
                >
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
