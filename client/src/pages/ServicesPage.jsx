import React from 'react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import { useI18n } from '../i18n/I18nContext'
import { AppIcon } from '../components/AppIcon'

const SERVICE_ICONS = ['ambulance', 'heart', 'brain', 'bone', 'baby', 'ribbon', 'baby', 'microscope', 'hospital']

const SERVICE_COLORS = [
  '#dc2626', '#e11d48', '#7c3aed', '#2563eb', '#16a34a', '#9333ea', '#ec4899', '#0891b2', '#ea580c',
]

const unsplashUrl = (id, w = 600, q = 80) => `https://images.unsplash.com/photo-${id}?q=${q}&w=${w}&auto=format&fit=crop`

const SERVICE_IMAGES = [
  unsplashUrl('1599700403969-f77b3aa74837'),
  unsplashUrl('1504813184591-01572f98c85f'),
  unsplashUrl('1551601651-2a8555f1a136'),
  unsplashUrl('1576091160550-2173dba999ef'),
  unsplashUrl('1519689680058-324335c77eba'),
  unsplashUrl('1579684385127-1ef15d508118'),
  unsplashUrl('1743571833965-98e5d89749d5'),
  unsplashUrl('1631651363531-fd29aec4cb5c'),
  unsplashUrl('1504439468489-c8920d796a29'),
]

const containerStyle = {
  padding: '64px 24px',
  maxWidth: 1200,
  margin: '0 auto',
}

const headerStyle = {
  textAlign: 'center',
  marginBottom: 56,
}

export default function ServicesPage() {
  const { t, tr } = useI18n()
  const services = tr('servicesPage.items')

  return (
    <div style={containerStyle}>
      <SEO title={t('servicesPage.seoTitle')} description={t('servicesPage.seoDescription')} url="/services" />
      <div style={headerStyle}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: 12 }}>
          {t('servicesPage.heading')}
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
          {t('servicesPage.sub')}
        </p>
      </div>

      <div className="grid-3-col">
        {services.map((svc, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'var(--surface-card)',
              borderRadius: 16,
              border: '1px solid var(--border)',
              padding: 32,
              transition: 'box-shadow 0.25s, transform 0.25s',
              cursor: 'default',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
              e.currentTarget.style.transform = 'translateY(-4px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: SERVICE_COLORS[index] }} />
            <div style={{ position: 'relative', width: '100%', height: 160, marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: 'var(--surface-container-low)' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name={SERVICE_ICONS[index]} size={44} />
              </div>
              {SERVICE_IMAGES[index] && (
                <img
                  src={SERVICE_IMAGES[index]}
                  alt={svc.title}
                  loading="lazy"
                  decoding="async"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 10 }}>
              {svc.title}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
              {svc.desc}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {svc.features.map((f) => (
                <span
                  key={f}
                  style={{
                    padding: '4px 12px',
                    backgroundColor: 'var(--surface-container-low)',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--text-body)',
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
            <Link
              to="/find-doctor"
              style={{
                display: 'inline-block',
                padding: '10px 24px',
                backgroundColor: SERVICE_COLORS[index],
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {t('servicesPage.findDoctor')}
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
