import React, { useEffect, useState } from 'react'
import { getPartners } from '../api'
import { useI18n } from '../i18n/I18nContext'

export default function PartnersSection() {
  const { tr } = useI18n()
  const [partners, setPartners] = useState([])
  const partnersHome = tr('home.partners')

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await getPartners()
        if (active) setPartners(res.data?.partners || [])
      } catch (err) {
        console.error('Failed to load partners:', err)
      }
    })()
    return () => { active = false }
  }, [])

  if (!partners.length) return null

  const tiles = partners.map((partner) => (
    <div key={partner.id} className="partner-tile">
      {partner.logo_url ? (
        <img src={partner.logo_url} alt={partner.name} loading="lazy" className="partner-logo" />
      ) : (
        <span className="partner-fallback">{String(partner.name || 'P').charAt(0)}</span>
      )}
      {partner.name && <span className="partner-name">{partner.name}</span>}
    </div>
  ))

  return (
    <section id="partners" style={{ padding: '80px 24px', backgroundColor: 'var(--surface-soft)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8 }}>
          {partnersHome.heading}
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 40 }}>
          {partnersHome.sub}
        </p>
        <div className="marquee">
          <div className="marquee-track">
            <div className="marquee-group">{tiles}</div>
            <div className="marquee-group" aria-hidden="true">{tiles}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
