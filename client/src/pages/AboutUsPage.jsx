import React from 'react'
import { SUPABASE_URL } from '../config'
import SEO from '../components/SEO'
import { useI18n } from '../i18n/I18nContext'

const VALUE_ICONS = ['🎯', '❤️', '🤝', '🔬', '👥', '🛡️']

const MILESTONE_YEARS = ['Foundation', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5']

export default function AboutUsPage() {
  const { t, tr } = useI18n()
  const values = tr('about.values')
  const milestones = tr('about.milestones')

  return (
    <main>
      <SEO title={t('about.seoTitle')} description={t('about.seoDescription')} url="/about-us" />
      {/* Hero Banner */}
      <section style={{ padding: '80px 24px', background: 'linear-gradient(135deg, var(--primary-container) 0%, var(--primary-light) 100%)', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem, 5vw, 2.75rem)', fontWeight: 800, color: '#fff', marginBottom: 16 }}>
            {t('about.heading')}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}>
            {t('about.heroText')}
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section style={{ padding: '80px 24px', backgroundColor: 'var(--surface-card)' }}>
        <div className="grid-2-col" style={{ maxWidth: 1000, margin: '0 auto', gap: 48 }}>
          <div style={{ backgroundColor: 'var(--surface-soft)', borderRadius: 16, padding: 36 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', marginBottom: 16 }}>{t('about.missionHeading')}</h2>
            <p style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.8 }}>
              {t('about.missionText')}
            </p>
          </div>
          <div style={{ backgroundColor: 'var(--surface-container-low)', borderRadius: 16, padding: 36 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)', marginBottom: 16 }}>{t('about.visionHeading')}</h2>
            <p style={{ fontSize: 16, color: 'var(--text-body)', lineHeight: 1.8 }}>
              {t('about.visionText')}
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '80px 24px', backgroundColor: 'var(--surface-soft)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', textAlign: 'center', marginBottom: 48 }}>
            {t('about.valuesHeading')}
          </h2>
          <div className="grid-3-col" style={{ gap: 24 }}>
            {values.map((v, index) => (
              <div key={index} style={{ backgroundColor: 'var(--surface-card)', borderRadius: 12, padding: 28, border: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }} aria-hidden="true">{VALUE_ICONS[index]}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8 }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline / Milestones */}
      <section style={{ padding: '80px 24px', backgroundColor: 'var(--surface-card)' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', textAlign: 'center', marginBottom: 48 }}>
            {t('about.journeyHeading')}
          </h2>
          <div style={{ position: 'relative', paddingLeft: 32, borderLeft: '3px solid var(--primary)' }}>
            {milestones.map((m, idx) => (
              <div key={idx} style={{ marginBottom: idx < milestones.length - 1 ? 32 : 0, position: 'relative' }}>
                <div style={{ position: 'absolute', left: -42, width: 22, height: 22, borderRadius: '50%', backgroundColor: 'var(--primary)', border: '3px solid var(--surface-card)', boxShadow: '0 0 0 2px var(--primary)' }} aria-hidden="true" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{MILESTONE_YEARS[idx]}</span>
                <p style={{ fontSize: 15, color: 'var(--text-body)', marginTop: 4, lineHeight: 1.6 }}>{m.event}</p>
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
