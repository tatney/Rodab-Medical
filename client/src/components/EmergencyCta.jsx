import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const BOOK_APPOINTMENT_LINKS = {
  user: '/appointments',
  admin: '/admin/appointments',
  doctor: '/doctor/appointments',
  super_admin: '/super-admin',
  driver: '/driver',
}

const EmergencyCta = ({ heading, text }) => {
  const { user } = useAuth()
  const role = user?.role || 'user'
  const bookLink = BOOK_APPOINTMENT_LINKS[role] || '/appointments'

  return (
    <section
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
        borderRadius: 16,
        padding: '40px 24px',
        textAlign: 'center',
        marginBottom: 32,
      }}
    >
      <div style={{ maxWidth: 700, margin: '0 auto', color: '#fff' }}>
        <h2 style={{ fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)', fontWeight: 800, marginBottom: 12, marginTop: 0 }}>
          {heading || 'Need Emergency Care?'}
        </h2>
        <p style={{ fontSize: 15, marginBottom: 24, opacity: 0.92, lineHeight: 1.6 }}>
          {text || 'For life-threatening emergencies, request an ambulance now. Or book an appointment with one of our doctors.'}
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/sos"
            style={{ padding: '12px 28px', backgroundColor: '#fff', color: '#dc2626', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none' }}
          >
            Emergency SOS
          </Link>
          <Link
            to={bookLink}
            style={{ padding: '12px 28px', backgroundColor: 'transparent', color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 700, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)' }}
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </section>
  )
}

export default EmergencyCta
