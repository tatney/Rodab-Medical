import React, { useState, useEffect } from 'react'
import { getPrescriptions } from '../api'
import { extractArray } from '../utils/api-helpers'
import colors from '../utils/colors'

const TABS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'pending', label: 'Pending', match: (p) => p.status === 'pending' },
  { key: 'approved', label: 'Approved', match: (p) => p.status === 'approved' },
  { key: 'rejected', label: 'Rejected', match: (p) => p.status === 'rejected' || p.status === 'denied' },
  { key: 'dispensed', label: 'Dispensed', match: (p) => p.status === 'dispensed' },
]

const tabStyle = (active) => ({
  padding: '8px 16px',
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  backgroundColor: active ? colors.primary : colors.white,
  color: active ? colors.white : colors.gray700,
  border: `1px solid ${active ? colors.primary : colors.gray300}`,
  fontFamily: "'Barlow', sans-serif",
})

const statusStyle = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  approved: { bg: '#dcfce7', color: '#166534' },
  denied: { bg: '#fee2e2', color: '#991b1b' },
  rejected: { bg: '#fee2e2', color: '#991b1b' },
  dispensed: { bg: '#dbeafe', color: '#1e40af' },
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await getPrescriptions()
        if (cancelled) return
        setPrescriptions(extractArray(res.data, 'prescriptions'))
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Failed to load prescriptions.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const active = TABS.find((t) => t.key === tab) || TABS[0]
  const filtered = prescriptions.filter(active.match)

  return (
    <div style={{ padding: '48px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: colors.gray900, marginBottom: 4, fontFamily: "'Barlow', sans-serif" }}>
        Prescriptions
      </h1>
      <p style={{ fontSize: 15, color: colors.gray500, marginBottom: 24, fontFamily: "'Barlow', sans-serif" }}>
        Track your repeat prescription requests
      </p>

      {error && (
        <div role="alert" style={{ padding: '12px 16px', borderRadius: 8, backgroundColor: colors.dangerLight, border: `1px solid ${colors.dangerBorder}`, color: colors.danger, fontSize: 14, marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} style={tabStyle(tab === t.key)}>
            {t.label} ({prescriptions.filter(t.match).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: 60, color: colors.gray500, fontFamily: "'Barlow', sans-serif" }}>
          Loading prescriptions...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, backgroundColor: colors.white, borderRadius: 12, border: `1px solid ${colors.gray200}` }}>
          <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden="true">&#128138;</div>
          <p style={{ fontSize: 16, fontWeight: 600, color: colors.gray700, margin: 0, fontFamily: "'Barlow', sans-serif" }}>
            {prescriptions.length === 0 ? 'No prescriptions yet' : `No ${active.label.toLowerCase()} prescriptions`}
          </p>
          <p style={{ fontSize: 14, color: colors.gray500, marginTop: 4, fontFamily: "'Barlow', sans-serif" }}>
            {prescriptions.length === 0 ? 'Request a repeat prescription to get started' : 'Try a different filter'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((p) => {
            const st = statusStyle[p.status] || { bg: colors.gray100, color: colors.gray700 }
            return (
              <div
                key={p.id}
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  border: `1px solid ${colors.gray200}`,
                  borderLeft: `4px solid ${colors.accent}`,
                  padding: '20px 24px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: colors.gray900, margin: 0, fontFamily: "'Barlow', sans-serif" }}>
                    {p.medication_name || p.medication || 'Medication'}
                  </h3>
                  <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, backgroundColor: st.bg, color: st.color, fontFamily: "'Barlow', sans-serif" }}>
                    {p.status || 'pending'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4px 16px', fontSize: 14, marginBottom: 8 }}>
                  {p.doctor_name && (
                    <p style={{ margin: '3px 0', color: colors.gray600, fontFamily: "'Barlow', sans-serif" }}>
                      <strong>Doctor:</strong> {p.doctor_name}
                    </p>
                  )}
                  {p.pharmacy && (
                    <p style={{ margin: '3px 0', color: colors.gray600, fontFamily: "'Barlow', sans-serif" }}>
                      <strong>Pharmacy:</strong> {p.pharmacy}
                    </p>
                  )}
                  <p style={{ margin: '3px 0', color: colors.gray600, fontFamily: "'Barlow', sans-serif" }}>
                    <strong>Requested:</strong> {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>

                {p.additional_info && (
                  <p style={{ fontSize: 14, color: colors.gray600, margin: 0, fontFamily: "'Barlow', sans-serif" }}>
                    <strong>Notes:</strong> {p.additional_info}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
