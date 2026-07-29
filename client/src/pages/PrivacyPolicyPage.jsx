import React from 'react'
import SEO from '../components/SEO'

const sections = [
  {
    title: '1. Information We Collect',
    content: 'We collect information you provide directly, such as your name, email, phone number, date of birth, medical history, and payment information when you register for services, book appointments, or submit forms. We also automatically collect certain data through our website, including IP address, browser type, device information, and usage patterns.',
  },
  {
    title: '2. How We Use Your Information',
    content: 'Your information is used to provide and improve our healthcare services, process appointments and medical records, communicate with you about your care, send appointment reminders, process billing and insurance claims, and comply with legal obligations. We may also use de-identified data for research and quality improvement.',
  },
  {
    title: '3. Information Sharing',
    content: 'We do not sell your personal information. We may share your data with healthcare providers involved in your care, insurance companies for billing purposes, laboratory and diagnostic services, and as required by law. All third-party partners are bound by strict confidentiality agreements and data protection standards.',
  },
  {
    title: '4. Data Security',
    content: 'We implement industry-standard security measures including encryption, secure servers, access controls, and regular security audits to protect your personal and medical information. All data transmission is secured using TLS encryption. We maintain HIPAA-compliant systems and conduct regular vulnerability assessments.',
  },
  {
    title: '5. Your Rights',
    content: 'You have the right to access, correct, or delete your personal data. You may request a copy of your medical records, opt out of non-essential communications, and request restriction of processing. You also have the right to data portability and to lodge a complaint with the relevant data protection authority.',
  },
  {
    title: '6. Cookies & Tracking',
    content: 'Our website uses essential cookies for functionality and optional analytics cookies to improve user experience. You can manage your cookie preferences through your browser settings. We do not use advertising cookies or share cookie data with third-party advertisers.',
  },
  {
    title: '7. Children\'s Privacy',
    content: 'We collect information about minors only with parental or guardian consent and as necessary for their medical care. Parent or guardian authorization is required for all data collection and processing related to patients under the age of 18.',
  },
  {
    title: '8. Changes to This Policy',
    content: 'We may update this privacy policy periodically to reflect changes in our practices or legal requirements. Material changes will be communicated through our website and, where appropriate, directly to affected patients. The latest revision date is always displayed at the top of this page.',
  },
  {
    title: '9. Contact Us',
    content: 'For questions about this privacy policy or to exercise your data rights, contact our Data Protection Officer at privacy@rodabmed.com or call +961 1 234 567 ext. 200. You may also write to: Data Protection Officer, Rodab Medical Hospital, Beirut, Lebanon.',
  },
]

const colors = {
  gray50: '#f9fafb',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray900: '#111827',
  white: '#ffffff',
}

export default function PrivacyPolicyPage() {
  return (
    <main style={{ padding: '48px 24px', maxWidth: 800, margin: '0 auto' }}>
      <SEO title="Privacy Policy" description="How Rodab Medical handles your personal data and privacy." url="/privacy-policy" />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 8 }}>
        Privacy Policy
      </h1>
      <p style={{ fontSize: 15, color: colors.gray500, marginBottom: 8 }}>
        Last updated: January 1, 2024
      </p>
      <p style={{ fontSize: 15, color: colors.gray600, lineHeight: 1.7, marginBottom: 40 }}>
        At Rodab Medical Hospital, we are committed to protecting your privacy and safeguarding your personal and medical information. This privacy policy outlines how we collect, use, store, and protect your data.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {sections.map((section) => (
          <div
            key={section.title}
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              border: `1px solid ${colors.gray200}`,
              padding: 28,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.gray900, marginBottom: 12 }}>
              {section.title}
            </h2>
            <p style={{ fontSize: 15, color: colors.gray600, lineHeight: 1.7, margin: 0 }}>
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </main>
  )
}
