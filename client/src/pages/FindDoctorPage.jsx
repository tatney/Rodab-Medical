import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getDoctors, getDoctorsDepartments, getAvailability, createAppointment } from '../api'
import SEO from '../components/SEO'
import { useToast } from '../components/ToastContext'
import { useI18n } from '../i18n/I18nContext'

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

function coversDate(row, date) {
  if (!date) return false
  if (row.date) {
    if (String(row.date).slice(0, 10) === date) return true
  }
  const rowDow = dayOfWeekIndex(row.day_of_week)
  if (rowDow === null) return false
  return rowDow === new Date(`${date}T00:00:00`).getDay()
}

function coversSlot(row, slot, date) {
  if (!coversDate(row, date)) return false
  const start = String(row.start_time || '').slice(0, 5)
  const end = String(row.end_time || '').slice(0, 5)
  if (!start || !end) return false
  return slot >= start && slot < end
}

export default function FindDoctorPage() {
  const { t } = useI18n()
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

  const fetchAvailability = useCallback(async (doctorId) => {
    if (!doctorId) return
    try {
      const res = await getAvailability({ doctor_id: doctorId })
      setAvailableSlots(res.data?.slots || res.data || [])
    } catch {
      setAvailableSlots([])
    }
  }, [])

  useEffect(() => {
    if (bookingDoctor?.id) {
      fetchAvailability(bookingDoctor.id)
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
        department_id: bookingDoctor.department_id || bookingDoctor.department?.id,
        appointment_date: bookingDate,
        appointment_time: selectedSlot,
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
      <SEO title={t('findDoctor.seoTitle')} description={t('findDoctor.seoDescription')} url="/find-doctor" />
      <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
        {t('findDoctor.heading')}
      </h1>
      <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 32 }}>
        {t('findDoctor.sub')}
      </p>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
        <input
          type="text"
          aria-label={t('findDoctor.searchAria')}
          placeholder={t('findDoctor.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 240,
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface-card)',
            color: 'var(--text-body)',
            fontSize: 15,
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
        />
        <select
          aria-label={t('findDoctor.filterAria')}
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{
            minWidth: 200,
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            fontSize: 15,
            backgroundColor: 'var(--surface-card)',
            color: 'var(--text-body)',
            cursor: 'pointer',
          }}
        >
          <option value="">{t('findDoctor.allSpecialties')}</option>
          {departments.map((dept) => (
            <option key={dept.id || dept} value={dept.name || dept}>
              {dept.name || dept}
            </option>
          ))}
        </select>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }} role="status" aria-live="polite">
          {t('common.loadingDoctors')}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          {t('findDoctor.noResults')}
        </div>
      ) : (
        <div className="grid-3-col" style={{ gap: 24 }}>
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              style={{
                backgroundColor: 'var(--surface-card)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                padding: 24,
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
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
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-strong)', margin: 0 }}>
                    Dr. {doc.full_name || doc.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                    {doc.specialty || doc.department?.name || doc.department_name || t('common.notAvailable')}
                  </p>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-body)' }}>{t('findDoctor.department')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>
                  {doc.department?.name || doc.department_name || doc.department || t('common.notAvailable')}
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
                    color: doc.is_available !== false ? 'var(--status-success)' : 'var(--error)',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: doc.is_available !== false ? 'var(--status-success)' : 'var(--error)',
                      display: 'inline-block',
                    }}
                  />
                  {doc.is_available !== false ? t('findDoctor.available') : t('findDoctor.unavailable')}
                </span>
              </div>
              <button
                onClick={() => openBooking(doc)}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  minHeight: 44,
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t('findDoctor.bookAppointment')}
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
              backgroundColor: 'var(--surface-card)',
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
                <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--status-success)', marginBottom: 8 }}>
                  {t('findDoctor.bookedTitle')}
                </h3>
                <p style={{ color: 'var(--text-muted)' }}>{t('findDoctor.bookedMsg')}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h2 id="booking-modal-title" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-strong)' }}>
                    {t('findDoctor.modalTitle').replace('{name}', bookingDoctor.full_name || bookingDoctor.name)}
                  </h2>
                  <button
                    aria-label={t('findDoctor.closeDialog')}
                    onClick={() => setBookingDoctor(null)}
                    style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    &times;
                  </button>
                </div>

                {/* Date Picker */}
                <label htmlFor="booking-date" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>
                  {t('findDoctor.selectDate')}
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
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-card)',
                    color: 'var(--text-body)',
                    fontSize: 15,
                    marginBottom: 20,
                  }}
                />

                {/* Time Slot Grid */}
                <label id="booking-time-slot-label" style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>
                  {t('findDoctor.selectTime')}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 20 }} role="group" aria-labelledby="booking-time-slot-label">
                  {timeSlots.map((slot) => {
                    const isAvailable = availableSlots.some(
                      (s) => coversSlot(s, slot, bookingDate)
                    )
                    return (
                      <button
                        key={slot}
                        disabled={!isAvailable}
                        onClick={() => setSelectedSlot(slot)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: 6,
                          border: `1px solid ${selectedSlot === slot ? 'var(--primary)' : 'var(--border)'}`,
                          backgroundColor: isAvailable
                            ? selectedSlot === slot
                              ? 'var(--primary)'
                              : 'var(--surface-card)'
                            : 'var(--surface-container-low)',
                          color: isAvailable
                            ? selectedSlot === slot
                              ? '#ffffff'
                              : 'var(--text-body)'
                            : 'var(--text-muted)',
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: isAvailable ? 'pointer' : 'not-allowed',
                          transition: 'all 0.15s',
                        }}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>

                {/* Reason */}
                <label htmlFor="booking-reason" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>
                  {t('findDoctor.reason')}
                </label>
                <textarea
                  id="booking-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('findDoctor.reasonPlaceholder')}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-card)',
                    color: 'var(--text-body)',
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
                    backgroundColor: !bookingDate || !selectedSlot ? 'var(--border)' : 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: !bookingDate || !selectedSlot ? 'not-allowed' : 'pointer',
                  }}
                >
                  {bookingLoading ? t('common.booking') : t('findDoctor.confirmBooking')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
