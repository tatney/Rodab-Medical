import React, { useState } from 'react'
import SEO from '../components/SEO'

const faqs = [
  {
    question: 'How do I book an appointment?',
    answer: 'You can book an appointment by navigating to the "Find a Doctor" page, selecting your preferred doctor or specialty, choosing an available date and time slot, and confirming your booking. You can also call our appointment desk at +961 1 234 567.',
  },
  {
    question: 'What insurance plans do you accept?',
    answer: 'We accept most major insurance providers including national health insurance, private insurance companies, and international coverage. Please contact our billing department or check at reception for specific plan verification before your visit.',
  },
  {
    question: 'How does the ambulance service work?',
    answer: 'Our 24/7 ambulance dispatch service can be accessed through the SOS button on our website or app. For guests, simply provide your name, phone number, and location. For registered users, you have access to the full dispatch form with additional features. You can track your ambulance in real-time using the tracking link provided after dispatch.',
  },
  {
    question: 'How can I access my medical records?',
    answer: 'You can request your medical records through our "Medical Forms" page by selecting "Medical Records Request." Alternatively, you can visit the medical records department in person with a valid photo ID. Digital copies will be sent to your registered email address within 3-5 business days.',
  },
  {
    question: 'What are the hospital visiting hours?',
    answer: 'General visiting hours are from 10:00 AM to 8:00 PM daily. ICU and critical care units have restricted visiting schedules from 11:00 AM to 1:00 PM and 5:00 PM to 7:00 PM. Exceptions may be made for end-of-life care situations. Children under 12 must be accompanied by an adult.',
  },
  {
    question: 'How do I request a repeat prescription?',
    answer: 'You can request a repeat prescription through our "Repeat Prescription" page. Fill in your details, current medications, GP name, and preferred pharmacy. Please allow 2-3 business days for processing. The prescription fee is $15.00, payable upon collection at the pharmacy.',
  },
  {
    question: 'Do you offer telehealth consultations?',
    answer: 'Yes, we offer telehealth consultations for non-emergency medical concerns. You can request a virtual consultation through the "Consultations" page. Our doctors will connect with you via secure video call at your scheduled time. Telehealth is available for follow-ups, minor illnesses, and medical advice.',
  },
  {
    question: 'What should I do in a medical emergency?',
    answer: 'For life-threatening emergencies, call 111 immediately. You can also use our SOS button for ambulance dispatch. If you are at the hospital, proceed directly to the Emergency Department. Our triage system ensures that the most critical patients receive immediate attention.',
  },
]

const colors = {
  primary: '#1e40af',
  gray50: '#f9fafb',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
}

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div style={{ padding: '48px 24px', maxWidth: 800, margin: '0 auto' }}>
      <SEO title="FAQs" description="Frequently asked questions about Rodab Medical's services, appointments, and healthcare." url="/faqs" />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 8, textAlign: 'center' }}>
        Frequently Asked Questions
      </h1>
      <p style={{ fontSize: 16, color: colors.gray500, marginBottom: 40, textAlign: 'center' }}>
        Find answers to common questions about our services
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          return (
            <div
              key={index}
              style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                border: `1px solid ${isOpen ? colors.primary : colors.gray200}`,
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
                  textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 600, color: isOpen ? colors.primary : colors.gray900, paddingRight: 16 }}>
                  {faq.question}
                </span>
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: 20,
                    color: isOpen ? colors.primary : colors.gray500,
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.3s',
                    flexShrink: 0,
                  }}
                >
                  &#9662;
                </span>
              </button>
              {isOpen && (
                <div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} style={{ padding: '0 24px 20px', borderTop: `1px solid ${colors.gray100}` }}>
                  <p style={{ fontSize: 15, color: colors.gray600, lineHeight: 1.7, paddingTop: 16, margin: 0 }}>
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 48, textAlign: 'center', padding: 32, backgroundColor: colors.gray50, borderRadius: 12 }}>
        <p style={{ fontSize: 16, color: colors.gray700, marginBottom: 8 }}>Still have questions?</p>
        <p style={{ fontSize: 14, color: colors.gray500 }}>
          Contact us at <strong>+961 1 234 567</strong> or email <strong>info@rodabmed.com</strong>
        </p>
      </div>
    </div>
  )
}
