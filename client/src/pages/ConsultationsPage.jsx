import React, { useState, useEffect } from 'react'
import { getConsultations, createConsultation, getDepartments } from '../api'
import SEO from '../components/SEO'
import colors from '../utils/colors'

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [specialty, setSpecialty] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [consRes, deptRes] = await Promise.all([getConsultations(), getDepartments()])
        setConsultations(consRes.data?.consultations || consRes.data || [])
        setDepartments(deptRes.data?.departments || deptRes.data || [])
      } catch (err) {
        console.error('Failed to load consultations:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!specialty || !message.trim()) {
      setError('Please select a specialty and enter your message.')
      return
    }
    setSubmitting(true)
    try {
      await createConsultation({ specialty, message: message.trim() })
      setFormOpen(false)
      setSpecialty('')
      setMessage('')
      const res = await getConsultations()
      setConsultations(res.data?.consultations || res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit consultation.')
    } finally {
      setSubmitting(false)
    }
  }

  const totalConsultations = consultations.length
  const pendingConsultations = consultations.filter(c => !c.response).length
  const completedConsultations = consultations.filter(c => c.response).length

  const focusStyle = {
    outline: 'none',
    borderColor: colors.primary,
    boxShadow: `0 0 0 3px rgba(18, 23, 92, 0.1)`,
  }

  return (
    <div style={{ fontFamily: "'Barlow', sans-serif", backgroundColor: colors.gray50, minHeight: '100vh' }}>
      <SEO title="Online Consultations" description="Virtual consultations with experienced doctors at Rodab Medical. Healthcare from the comfort of your home." url="/consultations" />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 4, fontFamily: "'Barlow', sans-serif" }}>Consultations</h1>
            <p style={{ fontSize: 15, color: colors.gray500, fontWeight: 400 }}>Request medical advice from our specialists</p>
          </div>
          <button
            onClick={() => setFormOpen(!formOpen)}
            aria-expanded={formOpen}
            style={{
              padding: '12px 24px',
              backgroundColor: formOpen ? colors.gray200 : colors.primary,
              color: formOpen ? colors.gray700 : colors.white,
              border: 'none',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Barlow', sans-serif",
              transition: 'all 0.2s ease',
            }}
          >
            {formOpen ? 'Cancel' : '+ New Consultation'}
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total', value: totalConsultations, borderColor: colors.primary },
            { label: 'Pending Response', value: pendingConsultations, borderColor: colors.warning },
            { label: 'Completed', value: completedConsultations, borderColor: colors.success },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: colors.white,
                borderRadius: 12,
                padding: '20px 24px',
                borderLeft: `4px solid ${stat.borderColor}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <p style={{ fontSize: 13, color: colors.gray500, fontWeight: 500, marginBottom: 4, fontFamily: "'Barlow', sans-serif" }}>{stat.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: colors.gray900, margin: 0, fontFamily: "'Barlow', sans-serif" }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Consultation Form */}
        {formOpen && (
          <div style={{ backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}`, padding: 32, marginBottom: 32, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: colors.gray900, marginBottom: 20, fontFamily: "'Barlow', sans-serif" }}>New Consultation Request</h3>
            {error && (
              <div role="alert" style={{ padding: '10px 14px', borderRadius: 8, backgroundColor: colors.dangerLight, border: `1px solid ${colors.dangerBorder}`, color: colors.danger, fontSize: 14, marginBottom: 16, fontFamily: "'Barlow', sans-serif" }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <label htmlFor="specialty" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: colors.gray700, fontFamily: "'Barlow', sans-serif" }}>Specialty</label>
              <select
                id="specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: `1px solid ${colors.gray300}`,
                  fontSize: 15,
                  cursor: 'pointer',
                  marginBottom: 20,
                  fontFamily: "'Barlow', sans-serif",
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = colors.primary; e.target.style.boxShadow = '0 0 0 3px rgba(18, 23, 92, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none'; }}
              >
                <option value="">Select a specialty</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name || d.id}>{d.name}</option>
                ))}
              </select>

              <label htmlFor="message" style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: colors.gray700, fontFamily: "'Barlow', sans-serif" }}>Your Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your symptoms, concerns, or questions..."
                rows={5}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: `1px solid ${colors.gray300}`,
                  fontSize: 14,
                  resize: 'vertical',
                  fontFamily: "'Barlow', sans-serif",
                  marginBottom: 20,
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onFocus={(e) => { e.target.style.borderColor = colors.primary; e.target.style.boxShadow = '0 0 0 3px rgba(18, 23, 92, 0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = colors.gray300; e.target.style.boxShadow = 'none'; }}
              />

              <button type="submit" disabled={submitting} style={{
                padding: '12px 32px',
                backgroundColor: submitting ? colors.gray300 : colors.primary,
                color: colors.white,
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontFamily: "'Barlow', sans-serif",
                transition: 'background-color 0.2s ease',
              }}>
                {submitting ? 'Submitting...' : 'Submit Consultation'}
              </button>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: 60, color: colors.gray500, fontFamily: "'Barlow', sans-serif" }}>
            <div style={{
              width: 40,
              height: 40,
              border: `3px solid ${colors.gray200}`,
              borderTopColor: colors.primary,
              borderRadius: '50%',
              margin: '0 auto 16px',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>Loading consultations...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && consultations.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}` }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              backgroundColor: colors.gray100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 28,
              color: colors.gray400,
            }}>
              &#128172;
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: colors.gray700, marginBottom: 4, fontFamily: "'Barlow', sans-serif" }}>No consultations yet</p>
            <p style={{ fontSize: 14, color: colors.gray500, fontFamily: "'Barlow', sans-serif" }}>Submit a new request to get started</p>
          </div>
        )}

        {/* Consultation List */}
        {!loading && consultations.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {consultations.map((cons) => (
              <div
                key={cons.id}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  borderLeft: `4px solid ${colors.accent}`,
                  border: `1px solid ${colors.gray200}`,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.accent,
                  padding: 24,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: colors.primary,
                    color: colors.white,
                    fontFamily: "'Barlow', sans-serif",
                  }}>
                    {cons.specialty || 'General'}
                  </span>
                  <span style={{ fontSize: 13, color: colors.gray400, fontFamily: "'Barlow', sans-serif" }}>
                    {new Date(cons.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p style={{ fontSize: 15, color: colors.gray700, lineHeight: 1.7, marginBottom: 16, fontFamily: "'Barlow', sans-serif" }}>
                  {cons.message || cons.text}
                </p>

                {cons.response && (
                  <div style={{
                    backgroundColor: colors.successLight,
                    borderRadius: 8,
                    padding: 16,
                    border: `1px solid ${colors.successBorder}`,
                  }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: colors.success, marginBottom: 6, fontFamily: "'Barlow', sans-serif" }}>Doctor Response</p>
                    <p style={{ fontSize: 14, color: colors.gray700, lineHeight: 1.6, margin: 0, fontFamily: "'Barlow', sans-serif" }}>
                      {cons.response}
                    </p>
                  </div>
                )}

                {!cons.response && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: colors.warning,
                      display: 'inline-block',
                    }} />
                    <span style={{ fontSize: 13, color: colors.warning, fontWeight: 500, fontFamily: "'Barlow', sans-serif" }}>
                      Awaiting response
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
