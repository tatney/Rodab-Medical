import React, { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SUPABASE_URL } from '../config'
import SEO from '../components/SEO'
import EventLightbox from '../components/EventLightbox'
import EventCarousel from '../components/EventCarousel'
import { useI18n } from '../i18n/I18nContext'
import { getFormTemplates, getEvents } from '../api'
import { extractArray } from '../utils/api-helpers'
import { downloadFormPdf } from '../utils/pdf'

const B = `${SUPABASE_URL}/storage/v1/object/public/images`

const SLIDE_IMAGES = [
  `${B}/Hero%20Image%205.avif`,
  `${B}/CT%20Scan.webp`,
  `${B}/Hero%20Image%201.jpg`,
  `${B}/Hero%20Image%202.jpeg`,
]

const SLIDE_LINKS = ['/services', '/about-us', '/sos', '/find-doctor']

const STAT_VALUES = ['15+', '50+', '10K+', '24/7']

const ONLINE_ICONS = ['📋', '🚑', '💬', '💊', '📄', '📋']
const ONLINE_LINKS = [
  '/appointments',
  '/ambulance',
  '/consultations',
  '/repeat-prescription',
  '/illness-certificate',
  '/forms',
]

const MEDICAL_ICONS = ['🚑', '❤️', '🧠', '🦴', '👶', '🔬']

const FEATURE_ICONS = ['⏰', '🏗️', '👨‍⚕️', '💰']

export default function HomePage() {
  const { t, tr } = useI18n()
  const location = useLocation()

  const slides = tr('home.slides')
  const statsData = tr('home.stats')
  const onlineServices = tr('home.onlineServices')
  const medicalServices = tr('home.medicalServices')
  const features = tr('home.features')
  const cta = tr('home.cta')
  const story = tr('home.story')
  const testimonials = tr('home.testimonials')
  const forms = tr('home.forms')
  const more = tr('home.more')
  const eventsHome = tr('home.events')

  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [formsOpen, setFormsOpen] = useState(false)
  const [formTemplates, setFormTemplates] = useState([])
  const [downloadingTitle, setDownloadingTitle] = useState('')
  const [formError, setFormError] = useState('')
  const [events, setEvents] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const moreRef = React.useRef(null)

  const handleDownloadForm = async (form) => {
    if (downloadingTitle) return
    setDownloadingTitle(form.title)
    setFormError('')
    try {
      let tpls = formTemplates
      if (!tpls.length) {
        const res = await getFormTemplates()
        tpls = extractArray(res.data, 'forms')
        setFormTemplates(tpls)
      }
      const template = tpls.find((t) => t.form_code === form.code)
      if (!template) {
        setFormError(`${form.title} is not available yet.`)
        return
      }
      downloadFormPdf(template, {}, { blank: true })
    } catch (err) {
      console.error('Form PDF download failed:', err)
      setFormError('Failed to generate the PDF. Please try again.')
    } finally {
      setDownloadingTitle('')
    }
  }

  useEffect(() => {
    if (location.state?.scrollTo) {
      const id = location.state.scrollTo
      const timer = setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 80)
      window.history.replaceState({}, '')
      return () => clearTimeout(timer)
    }
  }, [location.state])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await getEvents()
        if (active) setEvents(res.data?.events || [])
      } catch (err) {
        console.error('Failed to load events:', err)
      }
    })()
    return () => { active = false }
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }, [slides])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }, [slides])

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
        title={t('home.seoTitle')}
        description={t('home.seoDescription')}
        url="/"
      />
      {/* ── Hero Carousel ── */}
      <section
        id="home"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ position: 'relative', width: '100%', height: 'clamp(400px, 60vw, 600px)', overflow: 'hidden', background: '#111827' }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            style={{
              position: 'absolute', inset: 0,
              opacity: index === currentSlide ? 1 : 0,
              transition: 'opacity 0.7s ease-in-out',
              zIndex: index === currentSlide ? 1 : 0,
            }}
          >
            <img src={SLIDE_IMAGES[index]} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', zIndex: 2 }}>
              <div style={{ maxWidth: 640, marginLeft: '8%', marginRight: '8%', color: '#fff', padding: '0 16px', textAlign: 'start' }}>
                <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.1 }}>
                  {slide.title}
                </h1>
                <p style={{ fontSize: 'clamp(0.9rem, 2vw, 1.25rem)', marginBottom: 32, lineHeight: 1.6, opacity: 0.9 }}>
                  {slide.subtitle}
                </p>
                <Link
                  to={SLIDE_LINKS[index]}
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

        <button onClick={prevSlide} aria-label={t('home.prevSlide')} className="carousel-arrow prev">&#8249;</button>
        <button onClick={nextSlide} aria-label={t('home.nextSlide')} className="carousel-arrow next">&#8250;</button>

        <div className="carousel-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`${t('home.goToSlide')} ${index + 1}`}
              className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
            />
          ))}
        </div>
      </section>

      {/* ── Stats Row ── */}
      <section style={{ backgroundColor: 'var(--navy-deep)', padding: '48px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 32, textAlign: 'center' }}>
          {statsData.map((stat, index) => (
            <div key={index}>
              <div style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: '#fff' }}>{STAT_VALUES[index]}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Online Services ── */}
      <section id="online-services" style={{ padding: '80px 24px', backgroundColor: 'var(--surface-soft)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
            {onlineServices.heading}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 48 }}>
            {onlineServices.sub}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {onlineServices.items.map((svc, index) => (
              <Link
                key={index}
                to={ONLINE_LINKS[index]}
                style={{
                  padding: 28, borderRadius: 12, border: '1px solid var(--border)',
                  textAlign: 'start', textDecoration: 'none', color: 'var(--text-strong)',
                  backgroundColor: 'var(--surface-card)', transition: 'box-shadow 0.2s, transform 0.2s',
                  display: 'block',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>{ONLINE_ICONS[index]}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 6 }}>{svc.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>{svc.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Medical Services Overview ── */}
      <section id="services" style={{ padding: '80px 24px', backgroundColor: 'var(--surface-card)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
            {medicalServices.heading}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 48 }}>
            {medicalServices.sub}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {medicalServices.items.map((svc, index) => (
              <div
                key={index}
                style={{
                  padding: 32, borderRadius: 12, border: '1px solid var(--border)',
                  textAlign: 'start', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ fontSize: 40, marginBottom: 12 }}>{MEDICAL_ICONS[index]}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>{svc.title}</h3>
                <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6 }}>{svc.desc}</p>
              </div>
            ))}
          </div>
          <Link
            to="/services"
            style={{
              display: 'inline-block', marginTop: 40, padding: '12px 32px',
              backgroundColor: 'var(--navy-deep)', color: '#fff', borderRadius: 8,
              fontSize: 16, fontWeight: 600, textDecoration: 'none',
            }}
          >
            {medicalServices.viewAll}
          </Link>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: '80px 24px', backgroundColor: 'var(--surface-soft)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: 48 }}>
            {features.heading}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
            {features.items.map((feat, index) => (
              <div key={index} style={{ padding: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{FEATURE_ICONS[index]}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>{feat.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', color: '#fff' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, marginBottom: 16 }}>
            {cta.heading}
          </h2>
          <p style={{ fontSize: 16, marginBottom: 32, opacity: 0.9, lineHeight: 1.6 }}>
            {cta.text}
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/sos"
              style={{ padding: '14px 32px', backgroundColor: '#fff', color: '#dc2626', borderRadius: 8, fontSize: 16, fontWeight: 700, textDecoration: 'none' }}
            >
              {cta.emergencySos}
            </Link>
            <Link
              to="/appointments"
              style={{ padding: '14px 32px', backgroundColor: 'transparent', color: '#fff', borderRadius: 8, fontSize: 16, fontWeight: 700, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.5)' }}
            >
              {cta.bookAppointment}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Brand Story ── */}
      <section id="about" style={{ padding: '80px 24px', backgroundColor: 'var(--surface-card)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: 16 }}>
              {story.heading}
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.8, marginBottom: 16 }}>
              {story.p1}
            </p>
            <p style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.8, marginBottom: 24 }}>
              {story.p2}
            </p>
            <Link
              to="/about-us"
              style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: 'var(--navy-deep)', color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
            >
              {story.learnMore}
            </Link>
          </div>
          <div style={{ borderRadius: 16, overflow: 'hidden', minHeight: 300, background: 'var(--border)' }}>
            <img src={`${SUPABASE_URL}/storage/v1/object/public/images/Hero%20Image%204.jpeg`} alt="Rodab Medical Hospital" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      {/* ── Our Events (latest) ── */}
      <section id="events" style={{ padding: '80px 24px', backgroundColor: 'var(--surface-soft)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
            {eventsHome.heading}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 40 }}>
            {eventsHome.sub}
          </p>

          {events.length === 0 ? (
            <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>{eventsHome.noEvents}</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
              {events.slice(0, 3).map((event) => {
                const images = Array.isArray(event.images) ? event.images : []
                const image = images[0] || null
                const caption = [event.title, event.description].filter(Boolean).join('\n')
                return (
                  <Link
                    key={event.id}
                    to="/events"
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block', backgroundColor: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', textAlign: 'start' }}
                  >
                    <div style={{ padding: 16 }}>
                      {event.title && <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 4 }}>{event.title}</h3>}
                      {event.created_at && (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {new Date(event.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    {image ? (
                      <EventCarousel
                        images={images}
                        caption={caption}
                        onOpenLightbox={(url) => setLightbox({ image: url, caption })}
                      />
                    ) : (
                      <div style={{ margin: '0 16px 16px', borderRadius: 16, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', backgroundColor: 'var(--surface-container-low)', color: 'var(--text-muted)', fontSize: 40 }}>
                        🎉
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          <Link
            to="/events"
            style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: 'var(--navy-deep)', color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
          >
            {eventsHome.viewAll}
          </Link>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: '80px 24px', backgroundColor: 'var(--surface-soft)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: 48 }}>
            {testimonials.heading}
          </h2>
          <div className="testimonial-marquee">
            <div className="testimonial-marquee-track">
              {[0, 1].map((copy) => (
                <div key={copy} className="testimonial-marquee-group" aria-hidden={copy === 1 ? 'true' : undefined}>
                  {testimonials.items.map((item, index) => (
                    <div
                      key={index}
                      className="testimonial-card"
                    >
                      <div style={{ fontSize: 20, color: '#f59e0b', marginBottom: 12 }}>
                        <span aria-label={`${item.rating || 5} ${t('home.testimonials.rating')}`}>{'★'.repeat(item.rating || 5)}</span>
                      </div>
                      <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 16 }}>
                        "{item.text}"
                      </p>
                      <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 15 }}>{item.name}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Downloadable Forms ── */}
      <section id="forms" style={{ padding: '80px 24px', backgroundColor: 'var(--surface-card)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
            {forms.heading}
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 40 }}>
            {forms.sub}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, maxWidth: 800, margin: '0 auto' }}>
            {forms.items.map((form, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDownloadForm(form)}
                disabled={!!downloadingTitle}
                aria-label={`Download ${form.title}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 20px', borderRadius: 10, border: '1px solid var(--border)',
                  textDecoration: 'none', color: 'var(--text-strong)', backgroundColor: 'var(--surface-card)',
                  cursor: downloadingTitle ? 'wait' : 'pointer', textAlign: 'left', width: '100%',
                  fontFamily: 'inherit', fontSize: 'inherit', transition: 'box-shadow 0.2s, transform 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{form.title}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', backgroundColor: '#fef2f2', padding: '4px 10px', borderRadius: 6, flexShrink: 0 }}>
                  {downloadingTitle === form.title ? 'Downloading...' : 'PDF'}
                </span>
              </button>
            ))}
          </div>
          {formError && (
            <p role="alert" style={{ marginTop: 16, fontSize: 14, color: '#dc2626' }}>{formError}</p>
          )}
        </div>
      </section>

      {/* More Dropdown (hover-triggered) */}
      <div ref={moreRef} style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0 }}>
        {moreOpen && (
          <div
            style={{
              position: 'fixed', top: 'var(--sticky-nav-height)', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: 'var(--surface-card)', borderRadius: 12, boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border)', padding: 8, zIndex: 1100, minWidth: 220,
            }}
          >
            <Link
              to="/policies"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, textDecoration: 'none', color: 'var(--text-body)', fontSize: 14, fontWeight: 500, transition: 'background 0.15s' }}
              onClick={() => setMoreOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-container-low)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              {more.policies}
            </Link>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setFormsOpen(!formsOpen)}
                aria-expanded={formsOpen}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, border: 'none', background: 'none', color: 'var(--text-body)', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%', textAlign: 'start', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-container-low)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
                {more.formsDownloads}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', transform: formsOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {formsOpen && (
                <div style={{ position: 'absolute', left: '100%', top: 0, marginLeft: 4, backgroundColor: 'var(--surface-card)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', padding: 6, minWidth: 240, maxHeight: 320, overflowY: 'auto' }}>
                  {forms.items.map((f, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleDownloadForm(f)}
                      disabled={!!downloadingTitle}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 12px', borderRadius: 6, border: 'none', background: 'none', color: 'var(--text-body)', fontSize: 13, cursor: downloadingTitle ? 'wait' : 'pointer', textAlign: 'start', fontFamily: 'inherit', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-container-low)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <span>{f.title}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#dc2626' }}>{downloadingTitle === f.title ? '...' : 'PDF'}</span>
                    </button>
                  ))}
                  <div style={{ height: 1, backgroundColor: 'var(--border)', margin: '4px 0' }} />
                  <Link
                    to="/forms"
                    style={{ display: 'block', padding: '8px 12px', borderRadius: 6, textDecoration: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 600, transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-container-low)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {more.allOnlineForms}
                  </Link>
                </div>
              )}
            </div>
            <Link
              to="/faqs"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, textDecoration: 'none', color: 'var(--text-body)', fontSize: 14, fontWeight: 500, transition: 'background 0.15s' }}
              onClick={() => setMoreOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-container-low)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              {more.faqs}
            </Link>
            <Link
              to="/privacy-policy"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, textDecoration: 'none', color: 'var(--text-body)', fontSize: 14, fontWeight: 500, transition: 'background 0.15s' }}
              onClick={() => setMoreOpen(false)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-container-low)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              {more.privacyPolicy}
            </Link>
          </div>
        )}
      </div>
      <EventLightbox image={lightbox?.image} caption={lightbox?.caption} onClose={() => setLightbox(null)} />
    </div>
  )
}
