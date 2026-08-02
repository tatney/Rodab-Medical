import React, { useState } from 'react'
import SEO from '../components/SEO'
import { useI18n } from '../i18n/I18nContext'

export default function FAQsPage() {
  const { t, tr } = useI18n()
  const faqs = tr('faqs.items')
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const contactLine = t('faqs.contactLine')
    .replace('{phone}', '+961 1 234 567')
    .replace('{email}', 'info@rodabmed.com')

  return (
    <div style={{ padding: '48px 24px', maxWidth: 800, margin: '0 auto' }}>
      <SEO title={t('faqs.seoTitle')} description={t('faqs.seoDescription')} url="/faqs" />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-strong)', marginBottom: 8, textAlign: 'center' }}>
        {t('faqs.heading')}
      </h1>
      <p style={{ fontSize: 16, color: 'var(--text-muted)', marginBottom: 40, textAlign: 'center' }}>
        {t('faqs.sub')}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div
              key={index}
              style={{
                backgroundColor: 'var(--surface-card)',
                borderRadius: 12,
                border: `1px solid ${isOpen ? 'var(--primary)' : 'var(--border)'}`,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              <button
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${index}`}
                id={`faq-question-${index}`}
                style={{
                  width: '100%',
                  padding: '20px 24px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  textAlign: 'start',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 600, color: isOpen ? 'var(--primary)' : 'var(--text-strong)', paddingRight: 16 }}>
                  {faq.question}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: 20,
                    color: isOpen ? 'var(--primary)' : 'var(--text-muted)',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.3s',
                    flexShrink: 0,
                  }}
                >
                  &#9662;
                </span>
              </button>
              {isOpen && (
                <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} style={{ padding: '0 24px 20px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 15, color: 'var(--text-body)', lineHeight: 1.7, paddingTop: 16, margin: 0 }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 48, textAlign: 'center', padding: 32, backgroundColor: 'var(--surface-soft)', borderRadius: 12 }}>
        <p style={{ fontSize: 16, color: 'var(--text-body)', marginBottom: 8 }}>{t('faqs.stillHaveQuestions')}</p>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          {contactLine}
        </p>
      </div>
    </div>
  )
}
