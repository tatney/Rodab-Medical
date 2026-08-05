import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EventCarousel from '../components/EventCarousel'
import EventLightbox from '../components/EventLightbox'
import { getProgrammes } from '../api'
import { useI18n } from '../i18n/I18nContext'

export default function ProgrammesSection() {
  const { t, tr } = useI18n()
  const [programmes, setProgrammes] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('')
  const [lightbox, setLightbox] = useState(null)
  const programmesHome = tr('home.programmes')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await getProgrammes()
        if (active) setProgrammes(res.data?.programmes || [])
      } catch (err) {
        console.error('Failed to load programmes:', err)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  const categories = ['', ...Array.from(new Set(programmes.map((p) => (p.category || '').trim()).filter(Boolean)))]
  const filtered = category ? programmes.filter((p) => (p.category || '').trim() === category) : programmes
  const visible = filtered.slice(0, 3)

  return (
    <section id="programmes" style={{ padding: '80px 24px', backgroundColor: 'var(--surface-card)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
          {programmesHome.heading}
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 24 }}>
          {programmesHome.sub}
        </p>

        {!loading && programmes.length > 0 && (
          <div role="group" aria-label="Filter by category" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 40 }}>
            {categories.map((c) => (
              <button
                key={c || 'all'}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={category === c ? 'chip chip-active' : 'chip'}
              >
                {c || programmesHome.allCategories}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>{t('programmes.loading')}</p>
        ) : visible.length === 0 ? (
          <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>{programmesHome.noEvents}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 40 }}>
            {visible.map((programme) => {
              const images = Array.isArray(programme.images) ? programme.images : []
              const image = images[0] || null
              const caption = [programme.title, programme.description].filter(Boolean).join('\n')
              return (
                <Link
                  key={programme.id}
                  to="/programmes"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block', backgroundColor: 'var(--surface-soft)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', textAlign: 'start' }}
                >
                  <div style={{ padding: 16 }}>
                    {programme.category && (
                      <span className="chip chip-active" style={{ marginBottom: 8, display: 'inline-block' }}>{programme.category}</span>
                    )}
                    {programme.title && <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 4 }}>{programme.title}</h3>}
                    {programme.created_at && (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        {new Date(programme.created_at).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                      🤝
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        )}

        <Link
          to="/programmes"
          style={{ display: 'inline-block', padding: '12px 28px', backgroundColor: 'var(--navy-deep)', color: '#fff', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}
        >
          {programmesHome.viewAll}
        </Link>
      </div>
      <EventLightbox image={lightbox?.image} caption={lightbox?.caption} onClose={() => setLightbox(null)} />
    </section>
  )
}
