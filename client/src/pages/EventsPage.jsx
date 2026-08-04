import React, { useEffect, useState } from 'react'
import SEO from '../components/SEO'
import EventLightbox from '../components/EventLightbox'
import { getEvents } from '../api'
import { useI18n } from '../i18n/I18nContext'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function EventsPage() {
  const { t } = useI18n()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(null)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await getEvents()
        if (active) setEvents(res.data?.events || [])
      } catch (err) {
        if (active) setError(err?.message || 'Failed to load events.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  return (
    <main>
      <SEO title={t('events.seoTitle')} description={t('events.seoDescription')} url="/events" />

      {/* Hero Banner */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, var(--primary-container) 0%, var(--primary-light) 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
            {t('events.heading')}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
            {t('events.subtitle')}
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 24px', backgroundColor: 'var(--surface-card)', minHeight: 320 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <span className="spinner spinner-sm" />
              <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>{t('events.loading')}</p>
            </div>
          )}

          {!loading && error && (
            <div className="alert alert-error" style={{ textAlign: 'center', padding: 24 }}>{error}</div>
          )}

          {!loading && !error && events.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>{t('events.empty')}</p>
          )}

          {!loading && !error && events.map((event) => {
            const images = Array.isArray(event.images) ? event.images : []
            const caption = [event.title, event.description].filter(Boolean).join('\n')
            return (
              <article
                key={event.id}
                style={{
                  backgroundColor: 'var(--surface-soft)',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  padding: 24,
                  marginBottom: 32,
                }}
              >
                {event.title && (
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
                    {event.title}
                  </h2>
                )}
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  {formatDate(event.created_at)}
                </p>

                {event.description && (
                  <p style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                    {event.description}
                  </p>
                )}

                {images.length > 0 && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {images.map((src, idx) => (
                      <div
                        key={idx}
                        onDoubleClick={() => setLightbox({ image: src, caption })}
                        style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: 'var(--surface-card)', cursor: 'zoom-in' }}
                      >
                        <img
                          src={src}
                          alt={`${event.title || 'Event'} image ${idx + 1}`}
                          loading="lazy"
                          title="Double-click to enlarge"
                          style={{
                            width: '100%',
                            height: 220,
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>
      <EventLightbox image={lightbox?.image} caption={lightbox?.caption} onClose={() => setLightbox(null)} />
    </main>
  )
}
