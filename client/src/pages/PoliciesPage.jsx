import React from 'react'
import colors from '../utils/colors'
import SEO from '../components/SEO'

const policies = [
  {
    title: 'Patient Rights',
    icon: '⚖️',
    content: 'Every patient has the right to receive respectful, dignified care regardless of race, religion, gender, sexual orientation, national origin, or ability to pay. Patients have the right to privacy, informed consent, and access to their medical records.',
  },
  {
    title: 'Privacy & Confidentiality',
    icon: '🔒',
    content: 'All patient information is treated with the strictest confidentiality in accordance with HIPAA regulations. Medical records, test results, and personal information are only shared with authorized personnel and with patient consent.',
  },
  {
    title: 'Infection Control',
    icon: '🦠',
    content: 'Rodab Medical Hospital follows rigorous infection prevention and control protocols including hand hygiene, sterilization procedures, and isolation protocols to protect patients, staff, and visitors from healthcare-associated infections.',
  },
  {
    title: 'Medication Safety',
    icon: '💊',
    content: 'We maintain strict medication management protocols including double-checking of prescriptions, proper labeling, patient education on medications, and adverse reaction monitoring to ensure pharmaceutical safety.',
  },
  {
    title: 'Emergency Care',
    icon: '🚑',
    content: 'Our emergency department provides 24/7 care to all patients regardless of their ability to pay. Emergency triage follows international standards to ensure the most critical patients receive immediate attention.',
  },
  {
    title: 'Non-Discrimination',
    icon: '🤝',
    content: 'We are committed to providing equal care to all patients without discrimination. Our staff receives regular training on cultural sensitivity and inclusive healthcare practices.',
  },
  {
    title: 'Visiting Hours',
    icon: '🕐',
    content: 'General visiting hours are from 10:00 AM to 8:00 PM daily. ICU and critical care units have restricted visiting schedules. Exceptions may be made for end-of-life care situations.',
  },
  {
    title: 'Complaints & Feedback',
    icon: '📝',
    content: 'We welcome patient feedback and take all complaints seriously. Concerns can be reported to the Patient Relations department. All complaints are investigated and responded to within 48 hours.',
  },
  {
    title: 'Discharge Planning',
    icon: '📋',
    content: 'Discharge planning begins upon admission. Our multidisciplinary team ensures patients understand their post-discharge care plan, medications, follow-up appointments, and emergency contacts.',
  },
  {
    title: 'Financial Policy',
    icon: '💰',
    content: 'Payment is expected at the time of service unless prior arrangements have been made. We accept most major insurance plans and offer payment plans for eligible patients. Financial assistance is available for qualifying individuals.',
  },
]

export default function PoliciesPage() {
  return (
    <main style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
      <SEO title="Policies" description="Hospital policies and guidelines at Rodab Medical." url="/policies" />
      <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 8 }}>
        Hospital Policies
      </h1>
      <p style={{ fontSize: 15, color: colors.gray500, marginBottom: 40 }}>
        Our commitment to quality care through established standards and protocols
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {policies.map((policy) => (
          <div
            key={policy.title}
            style={{
              backgroundColor: colors.white,
              borderRadius: 12,
              border: `1px solid ${colors.gray200}`,
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <span style={{ fontSize: 28 }} aria-hidden="true">{policy.icon}</span>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.gray900, margin: 0 }}>
                {policy.title}
              </h2>
            </div>
            <p style={{ fontSize: 15, color: colors.gray600, lineHeight: 1.7, margin: 0 }}>
              {policy.content}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', padding: 24, backgroundColor: colors.gray50, borderRadius: 12 }}>
        <p style={{ fontSize: 14, color: colors.gray500, margin: 0 }}>
          For detailed information about any policy, please contact our administration office.
        </p>
        <p style={{ fontSize: 14, color: colors.gray500, margin: '4px 0 0' }}>
          Phone: <strong><a href="tel:+9611234567" style={{ color: 'inherit' }}>+961 1 234 567</a></strong> &nbsp;|&nbsp; Email: <strong><a href="mailto:info@rodabmed.com" style={{ color: 'inherit' }}>info@rodabmed.com</a></strong>
        </p>
      </div>
    </main>
  )
}
