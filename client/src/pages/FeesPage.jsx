import React, { useState, useEffect } from 'react'
import { getFees } from '../api'
import { extractArray } from '../utils/api-helpers'
import colors from '../utils/colors'
import SEO from '../components/SEO'

export default function FeesPage() {
  const [fees, setFees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const res = await getFees()
        const data = extractArray(res.data, 'fees')
        setFees(data)
      } catch (err) {
        console.error('Failed to load fees:', err)
        setError('Failed to load fee information.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const groupedFees = fees.reduce((acc, fee) => {
    const cat = fee.category || 'General'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(fee)
    return acc
  }, {})

  const formatAmount = (fee) => {
    const val = fee.amount ?? fee.price
    if (typeof val === 'number') return `$${val.toFixed(2)}`
    if (val) return `$${val}`
    return 'N/A'
  }

  return (
    <div
      style={{
        fontFamily: "'Barlow', sans-serif",
        maxWidth: 1100,
        margin: '0 auto',
        padding: '48px 24px',
        backgroundColor: colors.gray50,
        minHeight: '100vh',
      }}
    >
      <SEO
        title="Fees & Pricing"
        description="Transparent pricing for consultations, treatments, and medical services at Rodab Medical."
        url="/fees"
      />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 800,
            color: colors.primary,
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}
        >
          Hospital Fees
        </h1>
        <p
          style={{
            fontSize: 17,
            fontWeight: 400,
            color: colors.gray500,
            margin: 0,
          }}
        >
          Transparent pricing for our medical services
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div
          role="status"
          aria-live="polite"
          style={{
            textAlign: 'center',
            padding: 80,
            color: colors.gray500,
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          Loading fee information...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          role="alert"
          style={{
            textAlign: 'center',
            padding: 80,
            color: '#dc2626',
            fontSize: 16,
            fontWeight: 500,
          }}
        >
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && fees.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 80,
            color: colors.gray500,
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
              opacity: 0.4,
            }}
          >
            &#128196;
          </div>
          <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 4, color: colors.gray700 }}>
            No fees available
          </p>
          <p style={{ fontSize: 15, fontWeight: 400, color: colors.gray500, margin: 0 }}>
            Fee information will appear here once published.
          </p>
        </div>
      )}

      {/* Fee Categories */}
      {!loading && !error && fees.length > 0 && (
        <div>
          {Object.entries(groupedFees).map(([category, items]) => (
            <div key={category} style={{ marginBottom: 40 }}>
              {/* Category Title */}
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: colors.gray900,
                  marginBottom: 16,
                  paddingLeft: 4,
                }}
              >
                {category}
              </h2>

              {/* Table Card */}
              <div
                style={{
                  backgroundColor: colors.white,
                  borderRadius: 12,
                  border: `1px solid ${colors.gray200}`,
                  overflow: 'auto',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: colors.primary, color: colors.white, fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      <th scope="col" style={{ padding: '14px 24px', textAlign: 'left' }}>Service</th>
                      <th scope="col" style={{ padding: '14px 24px', textAlign: 'right' }}>Fee</th>
                      <th scope="col" style={{ padding: '14px 24px', textAlign: 'right' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((fee, idx) => (
                      <tr
                        key={fee.id || idx}
                        style={{
                          backgroundColor: idx % 2 === 0 ? colors.white : colors.gray50,
                          borderBottom: idx < items.length - 1 ? `1px solid ${colors.gray100}` : 'none',
                          fontSize: 15,
                          color: colors.gray700,
                          cursor: 'default',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.primary + '0A'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = idx % 2 === 0 ? colors.white : colors.gray50
                        }}
                      >
                        <td style={{ padding: '14px 24px', fontWeight: 600, color: colors.gray900 }}>
                          {fee.name || fee.service}
                        </td>
                        <td
                          style={{
                            padding: '14px 24px',
                            textAlign: 'right',
                            fontWeight: 700,
                            fontSize: 15,
                            color: colors.accent,
                          }}
                        >
                          {formatAmount(fee)}
                        </td>
                        <td style={{ padding: '14px 24px', textAlign: 'right', color: colors.gray500, fontSize: 14 }}>
                          {fee.description || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Banner */}
      {!loading && !error && fees.length > 0 && (
        <div
          style={{
            marginTop: 40,
            padding: '20px 24px',
            backgroundColor: colors.accent,
            borderRadius: 10,
            border: 'none',
          }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: colors.primary,
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            <strong>Please note:</strong> Fees are subject to change without prior notice.
            Contact our billing department at any time for the most current pricing information.
            Insurance coverage and reimbursement may vary by provider.
          </p>
        </div>
      )}
    </div>
  )
}
