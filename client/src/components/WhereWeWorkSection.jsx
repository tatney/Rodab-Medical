import React from 'react'
import UgandaMap from './UgandaMap'
import { useI18n } from '../i18n/I18nContext'

export default function WhereWeWorkSection() {
  const { tr } = useI18n()
  const where = tr('home.whereWeWork')

  return (
    <section id="where-we-work" className="where-we-work">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            {where.heading}
          </h2>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#4ade80', marginBottom: 12 }}>
            {where.sub}
          </p>
          <p style={{ fontSize: 16, color: 'rgba(226,232,240,0.75)', lineHeight: 1.8, maxWidth: 780, margin: '0 auto' }}>
            {where.description}
          </p>
        </div>
        <UgandaMap />
      </div>
    </section>
  )
}
