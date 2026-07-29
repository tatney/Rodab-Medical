import React from 'react'
import { SUPABASE_URL } from '../config'
import SEO from '../components/SEO'

const colors = {
  primary: '#1e40af',
  red: '#dc2626',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
}

const values = [
  { icon: '🎯', title: 'Excellence', desc: 'We strive for the highest standards in medical care, continuous improvement, and professional development.' },
  { icon: '❤️', title: 'Compassion', desc: 'We treat every patient with empathy, kindness, and respect, recognizing their individual needs and dignity.' },
  { icon: '🤝', title: 'Integrity', desc: 'We uphold the highest ethical standards in all our interactions with patients, families, and colleagues.' },
  { icon: '🔬', title: 'Innovation', desc: 'We embrace new technologies and evidence-based practices to advance healthcare delivery.' },
  { icon: '👥', title: 'Teamwork', desc: 'We foster collaboration among our multidisciplinary teams to provide comprehensive patient care.' },
  { icon: '🛡️', title: 'Safety', desc: 'We prioritize patient and staff safety through rigorous protocols and continuous monitoring.' },
]

const milestones = [
  { year: '2009', event: 'Hospital founded with a vision for accessible quality healthcare' },
  { year: '2013', event: 'Expanded to include a dedicated cardiac care center' },
  { year: '2016', event: 'Opened the Level III NICU and maternity wing' },
  { year: '2019', event: 'Achieved international healthcare accreditation' },
  { year: '2022', event: 'Launched telehealth and digital health services' },
  { year: '2024', event: 'Opened new surgical wing with advanced operating theatres' },
]

export default function AboutUsPage() {
  return (
    <main>
      <SEO title="About Us" description="Learn about Rodab Medical's mission, team, and commitment to providing compassionate healthcare in Dublin." url="/about" />
      {/* Hero Banner */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 800, color: colors.white, marginBottom: 16 }}>
            About Rodab Medical
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
            A leading healthcare institution dedicated to providing compassionate, world-class medical services to our community.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section style={{ padding: '80px 24px', backgroundColor: colors.white }}>
        <div className="grid-2-col" style={{ maxWidth: 1000, margin: '0 auto', gap: 48 }}>
          <div style={{ backgroundColor: colors.gray50, borderRadius: 16, padding: 36 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.primary, marginBottom: 16 }}>Our Mission</h2>
            <p style={{ fontSize: 16, color: colors.gray600, lineHeight: 1.8 }}>
              To provide exceptional, patient-centered healthcare that combines medical excellence with genuine compassion. We are committed to improving the health and wellbeing of every individual we serve, regardless of their background or circumstances.
            </p>
          </div>
          <div style={{ backgroundColor: '#dbeafe', borderRadius: 16, padding: 36 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: colors.primary, marginBottom: 16 }}>Our Vision</h2>
            <p style={{ fontSize: 16, color: colors.gray600, lineHeight: 1.8 }}>
              To be the region's most trusted healthcare provider, recognized for clinical excellence, innovative practices, and outstanding patient experience. We envision a future where quality healthcare is accessible to all members of our community.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '80px 24px', backgroundColor: colors.gray50 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, textAlign: 'center', marginBottom: 48 }}>
            Our Core Values
          </h2>
          <div className="grid-3-col" style={{ gap: 24 }}>
            {values.map((v) => (
              <div key={v.title} style={{ backgroundColor: colors.white, borderRadius: 12, padding: 28, border: `1px solid ${colors.gray200}`, textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden="true">{v.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.gray900, marginBottom: 8 }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: colors.gray500, lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline / Milestones */}
      <section style={{ padding: '80px 24px', backgroundColor: colors.white }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, textAlign: 'center', marginBottom: 48 }}>
            Our Journey
          </h2>
          <div style={{ position: 'relative', paddingLeft: 32, borderLeft: `3px solid ${colors.primary}` }}>
            {milestones.map((m, idx) => (
              <div key={m.year} style={{ marginBottom: idx < milestones.length - 1 ? 32 : 0, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -42, width: 22, height: 22, borderRadius: '50%', backgroundColor: colors.primary, border: `3px solid ${colors.white}`, boxShadow: `0 0 0 2px ${colors.primary}` }} aria-hidden="true" />
                <span style={{ fontSize: 14, fontWeight: 700, color: colors.primary }}>{m.year}</span>
                <p style={{ fontSize: 15, color: colors.gray600, marginTop: 4, lineHeight: 1.6 }}>{m.event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Banner */}
      <section style={{ padding: '0' }}>
        <img
            src={`${SUPABASE_URL}/storage/v1/object/public/images/Hero%20Image%204.jpeg`}
          alt="Rodab Medical Hospital"
          style={{ width: '100%', height: 400, objectFit: 'cover' }}
        />
      </section>
    </main>
  )
}
