import React from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

export default function NotFoundPage() {
  const { t } = useI18n()

  return (
    <main
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 40,
      }}
    >
      <div>
        <h1
          aria-hidden="true"
          style={{
            fontSize: 'clamp(3rem, 15vw, 7.5rem)',
            fontWeight: 900,
            color: 'var(--surface-container-high)',
            margin: 0,
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--text-strong)',
            marginTop: 16,
            marginBottom: 12,
          }}
        >
          {t('notFound.title')}
        </h2>
        <p
          style={{
            fontSize: 16,
            color: 'var(--text-muted)',
            maxWidth: 400,
            margin: '0 auto 32px',
          }}
        >
          {t('notFound.text')}
        </p>
        <Link
          to="/"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            backgroundColor: 'var(--primary)',
            color: '#fff',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {t('notFound.backToHome')}
        </Link>
      </div>
    </main>
  )
}
