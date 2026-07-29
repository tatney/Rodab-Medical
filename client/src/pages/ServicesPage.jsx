import React from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

const services = [
  {
    icon: '🚑',
    title: 'Emergency Medicine',
    desc: 'Immediate life-saving care with a fully equipped emergency department and rapid response teams available 24/7.',
    features: ['24/7 Emergency Care', 'Rapid Response Teams', 'Trauma Center'],
    color: '#dc2626',
  },
  {
    icon: '❤️',
    title: 'Cardiology',
    desc: 'Comprehensive heart care including diagnostics, interventional procedures, and cardiac rehabilitation.',
    features: ['ECG & Echocardiography', 'Angioplasty', 'Cardiac Rehab'],
    color: '#e11d48',
  },
  {
    icon: '🧠',
    title: 'Neurology',
    desc: 'Expert diagnosis and treatment of disorders affecting the brain, spinal cord, and nervous system.',
    features: ['EEG Monitoring', 'Stroke Care', 'Neurosurgery'],
    color: '#7c3aed',
  },
  {
    icon: '🦴',
    title: 'Orthopedics',
    desc: 'Specialized care for bones, joints, ligaments, tendons, and muscles with advanced surgical techniques.',
    features: ['Joint Replacement', 'Sports Medicine', 'Spine Surgery'],
    color: '#2563eb',
  },
  {
    icon: '👶',
    title: 'Pediatrics',
    desc: 'Compassionate healthcare for infants, children, and adolescents in a child-friendly environment.',
    features: ['Well-Child Visits', 'Immunizations', 'Pediatric Surgery'],
    color: '#16a34a',
  },
  {
    icon: '🎗️',
    title: 'Oncology',
    desc: 'Comprehensive cancer care from screening and diagnosis to treatment and survivorship support.',
    features: ['Chemotherapy', 'Radiation Therapy', 'Tumor Board'],
    color: '#9333ea',
  },
  {
    icon: '🤰',
    title: 'Maternity & NICU',
    desc: 'Complete maternity services from prenatal care to delivery, with a Level III NICU for premature infants.',
    features: ['Prenatal Care', 'Labor & Delivery', 'Level III NICU'],
    color: '#ec4899',
  },
  {
    icon: '🔬',
    title: 'Diagnostic Imaging',
    desc: 'Advanced imaging services including MRI, CT scan, ultrasound, and digital X-ray with rapid results.',
    features: ['MRI & CT Scan', 'Ultrasound', 'Digital X-Ray'],
    color: '#0891b2',
  },
  {
    icon: '🏥',
    title: 'Surgery',
    desc: 'Modern surgical suites performing general, minimally invasive, and specialized surgeries with expert surgeons.',
    features: ['General Surgery', 'Minimally Invasive', 'Laparoscopic'],
    color: '#ea580c',
  },
]

const containerStyle = {
  padding: '64px 24px',
  maxWidth: 1200,
  margin: '0 auto',
}

const headerStyle = {
  textAlign: 'center',
  marginBottom: 56,
}

export default function ServicesPage() {
  return (
    <div style={containerStyle}>
      <SEO title="Our Services" description="Comprehensive healthcare services including emergency care, cardiology, neurology, orthopedics, diagnostics, and more at Rodab Medical." url="/services" />
      <div style={headerStyle}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#111827', marginBottom: 12 }}>
          Our Medical Services
        </h1>
        <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          Rodab Medical Hospital offers a comprehensive range of medical services staffed by experienced professionals using the latest technology.
        </p>
      </div>

      <div className="grid-3-col">
        {services.map((svc) => (
          <div
            key={svc.title}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 16,
              border: '1px solid #e5e7eb',
              padding: 32,
              transition: 'box-shadow 0.25s, transform 0.25s',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.1)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                backgroundColor: svc.color,
              }}
            />
            <div style={{ fontSize: 44, marginBottom: 16 }} aria-hidden="true">{svc.icon}</div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 10 }}>
              {svc.title}
            </h3>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, marginBottom: 16 }}>
              {svc.desc}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {svc.features.map((f) => (
                <span
                  key={f}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#374151',
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
            <Link
              to="/find-doctor"
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                backgroundColor: svc.color,
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Find a Doctor
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
