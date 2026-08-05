import React, { useEffect, useState } from 'react'
import SEO from '../components/SEO'
import EventLightbox from '../components/EventLightbox'
import { getProgrammes } from '../api'
import { useI18n } from '../i18n/I18nContext'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ProgrammesPage() {
  const { t } = useI18n()
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const [category, setCategory] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await getProgrammes()
        if (active) setProgrammes(res.data?.programmes || [])
      } catch (err) {
        if (active) setError(err?.message || 'Failed to load programmes.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const categories = ['', ...Array.from(new Set(programmes.map((p) => (p.category || '').trim()).filter(Boolean)))]
  const filtered = category ? programmes.filter((p) => (p.category || '').trim() === category) : programmes

  return (
    <main>
      <SEO title={t('programmes.seoTitle')} description={t('programmes.seoDescription')} url="/programmes" />

      {/* Hero Banner */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, var(--primary-container) 0%, var(--primary-light) 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
            {t('programmes.heading')}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
            {t('programmes.subtitle')}
          </p>
        </div>
      </section>

      <section style={{ padding: '80px 24px', backgroundColor: 'var(--surface-card)', minHeight: 320 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <span className="spinner spinner-sm" />
              <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>{t('programmes.loading')}</p>
            </div>
          )}

          {!loading && error && (
            <div className="alert alert-error" style={{ textAlign: 'center', padding: 24 }}>{error}</div>
          )}

          {!loading && !error && programmes.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>{t('programmes.empty')}</p>
          )}

          {!loading && !error && programmes.length > 0 && (
            <div role="group" aria-label="Filter by category" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
              {categories.map((c) => (
                <button
                  key={c || 'all'}
                  type="button"
                  onClick={() => setCategory(c)}
                  aria-pressed={category === c}
                  className={category === c ? 'chip chip-active' : 'chip'}
                >
                  {c || t('programmes.allCategories')}
                </button>
              ))}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && category && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>{t('programmes.empty')}</p>
          )}

          {!loading && !error && filtered.map((programme) => {
            const images = Array.isArray(programme.images) ? programme.images : []
            const caption = [programme.title, programme.description].filter(Boolean).join('\n')
            return (
              <article
                key={programme.id}
                style={{
                  backgroundColor: 'var(--surface-soft)',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  padding: 24,
                  marginBottom: 32,
                }}
              >
                {programme.title && (
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
                    {programme.title}
                  </h2>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  {programme.category && <span className="chip chip-active">{programme.category}</span>}
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {formatDate(programme.created_at)}
                  </span>
                </div>

                {programme.description && (
                  <p style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                    {programme.description}
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
                          alt={`${programme.title || 'Programme'} image ${idx + 1}`}
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
