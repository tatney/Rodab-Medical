import React from 'react'
import SEO from '../components/SEO'
import { useI18n } from '../i18n/I18nContext'

export default function PrivacyPolicyPage() {
  const { t, tr } = useI18n()
  const sections = tr('privacy.sections')

  return (
    <main style={{ padding: '48px 24px', maxWidth: 800, margin: '0 auto' }}>
      <SEO title={t('privacy.seoTitle')} description={t('privacy.seoDescription')} url="/privacy-policy" />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
        {t('privacy.heading')}
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 8 }}>
        {t('privacy.lastUpdated')}
      </p>
      <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 40 }}>
        {t('privacy.intro')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sections.map((section, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              padding: 28,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 12 }}>
              {section.title}
            </h2>
            <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7, margin: 0 }}>
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}
