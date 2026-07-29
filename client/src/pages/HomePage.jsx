import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { SUPABASE_URL } from '../config'
import SEO from '../components/SEO'

const B = `${SUPABASE_URL}/storage/v1/object/public/images`

const slides = [
  {
    id: 1,
    title: 'Compassionate Healthcare',
    subtitle: 'Advanced medical care delivered with compassion and excellence by our world-class specialists.',
    cta: 'Our Services',
    ctaLink: '/services',
    image: `${B}/Hero%20Image%205.avif`,
  },
  {
    id: 2,
    title: 'State-of-the-Art Facility',
    subtitle: 'Modern medical equipment and comfortable patient environments for optimal recovery.',
    cta: 'About Us',
    ctaLink: '/about-us',
    image: `${B}/CT%20Scan.webp`,
  },
  {
    id: 3,
    title: 'Emergency Response 24/7',
    subtitle: 'Rapid emergency medical services with fully equipped ambulances and trained paramedics.',
    cta: 'Emergency SOS',
    ctaLink: '/sos',
    image: `${B}/Hero%20Image%201.jpg`,
  },
  {
    id: 4,
    title: 'Expert Specialists',
    subtitle: 'Board-certified physicians and surgeons providing personalized treatment plans.',
    cta: 'Find a Doctor',
    ctaLink: '/find-doctor',
    image: `${B}/Hero%20Image%202.jpeg`,
  },
]

const stats = [
  { value: '15+', label: 'Years of Service' },
  { value: '50+', label: 'Expert Doctors' },
  { value: '10K+', label: 'Patients Treated' },
  { value: '24/7', label: 'Emergency Care' },
]

const services = [
  { icon: '🚑', title: 'Emergency Medicine', desc: 'Immediate life-saving care around the clock.' },
  { icon: '❤️', title: 'Cardiology', desc: 'Comprehensive heart care and diagnostics.' },
  { icon: '🧠', title: 'Neurology', desc: 'Expert brain and nervous system treatment.' },
  { icon: '🦴', title: 'Orthopedics', desc: 'Bone, joint, and musculoskeletal care.' },
  { icon: '👶', title: 'Pediatrics', desc: 'Specialized healthcare for children.' },
  { icon: '🔬', title: 'Diagnostic Imaging', desc: 'Advanced MRI, CT, and X-ray services.' },
]

const onlineServices = [
  { icon: '📋', title: 'Book Appointment', desc: 'Schedule a visit with our specialists.', link: '/appointments' },
  { icon: '🚑', title: 'Request Ambulance', desc: 'Emergency ambulance dispatch service.', link: '/ambulance' },
  { icon: '💬', title: 'Online Consultation', desc: 'Virtual consultation with doctors.', link: '/consultations' },
  { icon: '💊', title: 'Repeat Prescription', desc: 'Request prescription refills online.', link: '/repeat-prescription' },
  { icon: '📄', title: 'Illness Certificate', desc: 'Request medical certificates.', link: '/illness-certificate' },
  { icon: '📋', title: 'Medical Forms', desc: 'Submit referrals and records requests.', link: '/forms' },
]

const downloadableForms = [
  { title: 'Patient Registration Form', format: 'PDF', link: '#' },
  { title: 'Medical History Questionnaire', format: 'PDF', link: '#' },
  { title: 'Insurance Information Form', format: 'PDF', link: '#' },
  { title: 'Consent to Treatment', format: 'PDF', link: '#' },
  { title: 'Referral Request Form', format: 'PDF', link: '#' },
  { title: 'Feedback Form', format: 'PDF', link: '#' },
]

const features = [
  { icon: '⏰', title: '24/7 Availability', desc: 'Round-the-clock medical services for all emergencies and consultations.' },
  { icon: '🏗️', title: 'Modern Equipment', desc: 'Latest medical technology and state-of-the-art diagnostic tools.' },
  { icon: '👨‍⚕️', title: 'Expert Staff', desc: 'Highly qualified doctors, nurses, and medical professionals.' },
  { icon: '💰', title: 'Affordable Care', desc: 'Quality healthcare at competitive prices with insurance support.' },
]

const testimonials = [
  { name: 'Ahmad H.', text: 'The emergency team saved my father\'s life. Their response time was incredible and the care was exceptional.', rating: 5 },
  { name: 'Sara M.', text: 'Dr. Khoury and the cardiology team provided outstanding care during my heart surgery. Forever grateful.', rating: 5 },
  { name: 'Layla K.', text: 'The maternity ward was amazing. The nurses were so caring and the facilities were top-notch.', rating: 5 },
]

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [formsOpen, setFormsOpen] = useState(false)
  const moreRef = React.useRef(null)

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [])

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [isPaused, nextSlide])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false)
        setFormsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div>
      <SEO
        title="Home"
        description="Compassionate healthcare services in Dublin, Ireland. Emergency care, cardiology, neurology, orthopedics, and more. Open 24/7."
        url="/"
      />
      {/* ── Hero Carousel ── */}
      <section
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ position: 'relative', width: '100%', height: 'clamp(400px, 60vw, 600px)', overflow: 'hidden', background: '#111827' }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            style={{
              position: 'absolute', inset: 0,
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 0.7s ease-in-out',
              zIndex: index === currentSlide ? 1 : 0,
            }}
          >
            <img src={slide.image} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', zIndex: 2 }}>
              <div style={{ maxWidth: 640, marginLeft: '8%', color: '#fff', padding: '0 16px' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>
                  {slide.title}
                </h1>
                <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.25rem)', marginBottom: 32, lineHeight: 1.6, opacity: 0.9 }}>
                  {slide.subtitle}
                </p>
                <Link
                  to={slide.ctaLink}
                  style={{
                    display: 'inline-block', padding: '14px 32px',
                    backgroundColor: '#dc2626', color: '#fff', borderRadius: 8,
                    fontSize: 16, fontWeight: 600, textDecoration: 'none',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#991b1b')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}

        <button onClick={prevSlide} aria-label="Previous slide" className="carousel-arrow prev">&#8249;</button>
        <button onClick={nextSlide} aria-label="Next slide" className="carousel-arrow next">&#8250;</button>

        <div className="carousel-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
            />
          ))}
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section style={{ backgroundColor: '#0b2a57', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 32, textAlign: 'center' }}>
          {stats.map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fff' }}>{stat.value}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Online Services ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            Online Services
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 48 }}>
            Access healthcare services from anywhere, anytime
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {onlineServices.map((svc) => (
              <Link
                key={svc.title}
                to={svc.link}
                style={{
                  padding: 28, borderRadius: 12, border: '1px solid #e5e7eb',
                  textAlign: 'left', textDecoration: 'none', color: '#111827',
                  backgroundColor: '#fff', transition: 'box-shadow 0.2s, transform 0.2s',
                  display: 'block',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>{svc.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{svc.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>{svc.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Medical Services Overview ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            Our Medical Services
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 48 }}>
            Comprehensive healthcare tailored to your needs
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {services.map((svc) => (
              <div
                key={svc.title}
                style={{
                  padding: 32, borderRadius: 12, border: '1px solid #e5e7eb',
                  textAlign: 'left', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>{svc.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{svc.title}</h3>
                <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.6 }}>{svc.desc}</p>
              </div>
            ))}
          </div>
          <Link
            to="/services"
            style={{
              display: 'inline-block', marginTop: 40, padding: '12px 32px',
              backgroundColor: '#0b2a57', color: '#fff', borderRadius: 8,
              fontSize: 16, fontWeight: 600, textDecoration: 'none',
            }}
          >
            View All Services
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111827', marginBottom: 48 }}>
            Why Choose Rodab Medical?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {features.map((feat) => (
              <div key={feat.title} style={{ padding: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{feat.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{feat.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', color: '#fff' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, marginBottom: 16 }}>
            Your Health Can't Wait
          </h2>
          <p style={{ fontSize: 16, marginBottom: 32, opacity: 0.9, lineHeight: 1.6 }}>
            Whether it's a routine check-up or a medical emergency, our team is ready to provide the care you deserve.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/sos"
              style={{ padding: '14px 32px', backgroundColor: '#fff', color: '#dc2626', borderRadius: 8, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}
            >
              Emergency SOS
            </Link>
            <Link
              to="/appointments"
              style={{ padding: '14px 32px', backgroundColor: 'transparent', color: '#fff', borderRadius: 8, fontSize: 16, fontWeight: 700, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)' }}
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>

      {/* ── Brand Story ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111827', marginBottom: 16 }}>
              Our Story
            </h2>
            <p style={{ fontSize: 16, color: '#4b5563', lineHeight: 1.8, marginBottom: 16 }}>
              Founded with a mission to provide accessible, world-class healthcare, Rodab Medical Hospital has grown into a trusted name in medical excellence. Our journey began with a simple belief: every patient deserves compassionate, quality care.
            </p>
            <p style={{ fontSize: 16, color: '#4b5563', lineHeight: 1.8, marginBottom: 24 }}>
              Over the years, we have invested in cutting-edge technology, recruited top medical talent, and expanded our services to meet the evolving needs of our community.
            </p>
            <Link
              to="/about-us"
              style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: '#0b2a57', color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              Learn More About Us
            </Link>
          </div>
          <div style={{ borderRadius: 16, overflow: 'hidden', minHeight: 300, background: '#e5e7eb' }}>
            <img src={`${SUPABASE_URL}/storage/v1/object/public/images/Hero%20Image%204.jpeg`} alt="Rodab Medical Hospital" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#f9fafb' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111827', marginBottom: 48 }}>
            What Our Patients Say
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {testimonials.map((t) => (
              <div
                key={t.name}
                style={{ backgroundColor: '#fff', padding: 32, borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'left' }}
              >
                <div style={{ fontSize: 20, color: '#f59e0b', marginBottom: 12 }}>
                  <span aria-label={`${t.rating} out of 5 stars`}>{'★'.repeat(t.rating)}</span>
                </div>
                <p style={{ fontSize: 15, color: '#4b5563', lineHeight: 1.7, marginBottom: 16 }}>
                  "{t.text}"
                </p>
                <div style={{ fontWeight: 700, color: '#111827', fontSize: 15 }}>{t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Downloadable Forms ── */}
      <section style={{ padding: '80px 24px', backgroundColor: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#111827', marginBottom: 8 }}>
            Downloadable Forms
          </h2>
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 40 }}>
            Download and complete these forms before your visit
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 800, margin: '0 auto' }}>
            {downloadableForms.map((form) => (
              <a
                key={form.title}
                href={form.link}
                download
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', borderRadius: 10, border: '1px solid #e5e7eb',
                  textDecoration: 'none', color: '#111827', backgroundColor: '#fff',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{form.title}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: 6 }}>
                  {form.format}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* More Dropdown (hover-triggered) */}
      <div ref={moreRef} style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0 }}>
        {moreOpen && (
          <div
            style={{
              position: 'fixed', top: 'var(--sticky-nav-height)', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#fff', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              border: '1px solid #e5e7eb', padding: 8, zIndex: 1100, minWidth: 220,
            }}
          >
            <Link
              to="/policies"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, textDecoration: 'none', color: '#374151', fontSize: 14, fontWeight: 500, transition: 'background 0.15s' }}
              onClick={() => setMoreOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Policies
            </Link>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setFormsOpen(!formsOpen)}
                aria-expanded={formsOpen}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: 'none', background: 'none', color: '#374151', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                Forms & Downloads
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', transform: formsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {formsOpen && (
                <div style={{ position: 'absolute', left: '100%', top: 0, marginLeft: 4, backgroundColor: '#fff', borderRadius: 10, boxShadow: '0 10px 40px rgba(0,0,0,0.12)', border: '1px solid #e5e7eb', padding: 6, minWidth: 240, maxHeight: 320, overflowY: 'auto' }}>
                  {downloadableForms.map((f) => (
                    <a
                      key={f.title}
                      href={f.link}
                      download
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 6, textDecoration: 'none', color: '#374151', fontSize: 13, transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>{f.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#dc2626' }}>{f.format}</span>
                    </a>
                  ))}
                  <div style={{ height: 1, backgroundColor: '#e5e7eb', margin: '4px 0' }} />
                  <Link
                    to="/forms"
                    style={{ display: 'block', padding: '8px 12px', borderRadius: 6, textDecoration: 'none', color: '#0b2a57', fontSize: 13, fontWeight: 600, transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    All Online Forms &rarr;
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/faqs"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, textDecoration: 'none', color: '#374151', fontSize: 14, fontWeight: 500, transition: 'background 0.15s' }}
              onClick={() => setMoreOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              FAQs
            </Link>
            <Link
              to="/privacy-policy"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, textDecoration: 'none', color: '#374151', fontSize: 14, fontWeight: 500, transition: 'background 0.15s' }}
              onClick={() => setMoreOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              Privacy Policy
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
