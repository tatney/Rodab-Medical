import React, { useState, useEffect } from 'react'
import { getMyContacts } from '../api'
import { extractArray } from '../utils/api-helpers'
import colors from '../utils/colors'

const statusBadge = {
  pending: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  reviewed: { bg: '#dbeafe', color: '#1e40af', label: 'Reviewed' },
  resolved: { bg: '#dcfce7', color: '#166534', label: 'Resolved' },
  rejected: { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
}

const typeLabels = {
  referral: 'Referral Request',
  records: 'Medical Records Request',
  prescription: 'Prescription Refill',
  feedback: 'Patient Feedback',
}

export default function FormHistoryPage() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await getMyContacts()
        setForms(extractArray(res.data, 'messages'))
      } catch (err) {
        console.error('Failed to load form history:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <main style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 8 }}>Form History</h1>
      <p style={{ fontSize: 15, color: colors.gray500, marginBottom: 32 }}>Track the status of your submitted forms</p>

      {loading ? (
        <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: 60, color: colors.gray500 }}>Loading form history...</div>
      ) : forms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: colors.gray500 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden="true">&#128196;</div>
          <p>No forms submitted yet.</p>
          <a href="/forms" style={{ display: 'inline-block', marginTop: 16, padding: '10px 24px', backgroundColor: colors.primary, color: colors.white, borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Submit a Form
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {forms.map((form) => {
            const badge = statusBadge[form.status] || statusBadge.pending
            return (
              <div
                key={form.id}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  border: `1px solid ${colors.gray200}`,
                  padding: 24,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: colors.gray900, marginBottom: 4 }}>
                      {form.subject || typeLabels[form.type] || 'Form Submission'}
                    </h3>
                    <span style={{ fontSize: 13, color: colors.gray500 }}>
                      {typeLabels[form.type] || form.type || 'General'}
                    </span>
                  </div>
                  <span style={{
                    padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    backgroundColor: badge.bg, color: badge.color, flexShrink: 0,
                  }}>
                    {badge.label}
                  </span>
                </div>
                <p style={{ fontSize: 14, color: colors.gray600, lineHeight: 1.6, marginBottom: 12 }}>
                  {form.message || 'No message provided.'}
                </p>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: colors.gray500 }}>
                  <span>Submitted: {form.created_at ? new Date(form.created_at).toLocaleDateString() : 'N/A'}</span>
                  {form.updated_at && form.updated_at !== form.created_at && (
                    <span>Updated: {new Date(form.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
                {form.admin_response && (
                  <div style={{ marginTop: 12, padding: 14, backgroundColor: colors.gray50, borderRadius: 8, borderLeft: `3px solid ${colors.primary}` }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: colors.primary, marginBottom: 4 }}>Response</p>
                    <p style={{ fontSize: 14, color: colors.gray600, lineHeight: 1.6, margin: 0 }}>{form.admin_response}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
