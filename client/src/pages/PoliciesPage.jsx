import React from 'react'
import SEO from '../components/SEO'
import { useI18n } from '../i18n/I18nContext'

const POLICY_ICONS = ['⚖️', '🔒', '🦠', '💊', '🚑', '🤝', '🕐', '📝', '📋', '💰']

export default function PoliciesPage() {
  const { t, tr } = useI18n()
  const policies = tr('policies.items')

  return (
    <main style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
      <SEO title={t('policies.seoTitle')} description={t('policies.seoDescription')} url="/policies" />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
        {t('policies.heading')}
      </h1>
      <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 40 }}>
        {t('policies.sub')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {policies.map((policy, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 12,
              border: '1px solid var(--border)',
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <span style={{ fontSize: 28 }} aria-hidden="true">{POLICY_ICONS[index]}</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-strong)', margin: 0 }}>
                {policy.title}
              </h2>
            </div>
            <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7, margin: 0 }}>
              {policy.content}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', padding: 24, backgroundColor: 'var(--surface-soft)', borderRadius: 12 }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          {t('policies.footerNote')}
        </p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
          Phone: <strong><a href="tel:+9611234567" style={{ color: 'inherit' }}>+961 1 234 567</a></strong> &nbsp;|&nbsp; Email: <strong><a href="mailto:info@rodabmed.com" style={{ color: 'inherit' }}>info@rodabmed.com</a></strong>
        </p>
      </div>
    </main>
  )
}
