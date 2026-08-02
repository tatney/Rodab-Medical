import React, { useState, useEffect } from 'react'
import { getMyFormSubmissions } from '../api'
import { extractArray } from '../utils/api-helpers'
import { downloadFormPdf } from '../utils/pdf'
import colors from '../utils/colors'

function getTemplate(sub) {
  const t = sub?.form_templates
  if (!t) return null
  return Array.isArray(t) ? t[0] || null : t
}

export default function FormHistoryPage() {
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await getMyFormSubmissions()
        setSubs(extractArray(res.data, 'submissions'))
      } catch (err) {
        console.error('Failed to load form history:', err)
        setError(err.message || 'Failed to load form history.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDownload = async (sub) => {
    const template = getTemplate(sub)
    if (!template) {
      setError('The form template for this submission is no longer available.')
      return
    }
    setBusyId(sub.id)
    try {
      downloadFormPdf(template, sub.data || {}, {
        referenceNo: sub.reference_no,
        patientName: sub.data?.full_name || sub.data?.patient_name,
      })
    } catch (err) {
      console.error('PDF download failed:', err)
      setError('Failed to download the PDF. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 8 }}>Form History</h1>
      <p style={{ fontSize: 15, color: colors.gray500, marginBottom: 32 }}>Download the completed PDFs of your submitted forms</p>

      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: colors.red, fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: 60, color: colors.gray500 }}>Loading form history...</div>
      ) : subs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.gray500 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden="true">&#128196;</div>
          <p>No forms submitted yet.</p>
          <a href="/forms" style={{ display: 'inline-block', marginTop: 16, padding: '10px 24px', backgroundColor: colors.primary, color: colors.white, borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Submit a Form
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {subs.map((sub) => {
            const template = getTemplate(sub)
            const title = template?.title || 'Form Submission'
            const icon = template?.icon || '&#128196;'
            const formCode = template?.form_code || '—'
            return (
              <div
                key={sub.id}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  border: `1px solid ${colors.gray200}`,
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 28 }} aria-hidden="true">{icon}</span>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.gray900, marginBottom: 4 }}>{title}</h3>
                      <span style={{ fontSize: 13, color: colors.gray500 }}>
                        Form Code: {formCode} · Reference: <strong>{sub.reference_no || '—'}</strong>
                      </span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: colors.gray600, lineHeight: 1.6, marginBottom: 12 }}>
                  {template?.description || 'Completed form submission.'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <span style={{ fontSize: 13, color: colors.gray500 }}>
                    Submitted: {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                  <button
                    onClick={() => handleDownload(sub)}
                    disabled={busyId === sub.id}
                    style={{
                      padding: '10px 22px',
                      backgroundColor: busyId === sub.id ? colors.gray300 : colors.primary,
                      color: colors.white,
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: busyId === sub.id ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {busyId === sub.id ? 'Downloading...' : '⬇ Download PDF'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
