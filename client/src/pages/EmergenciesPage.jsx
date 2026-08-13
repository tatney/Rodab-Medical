import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAmbulanceHistory } from '../api'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../i18n/I18nContext'

const POLL_MS = 15000

const LIVE_STATUSES = ['requested', 'dispatched', 'in_transit', 'arrived', 'en_route', 'active']

const statusStepsIndex = {
  requested: 0,
  dispatched: 1,
  in_transit: 2,
  arrived: 3,
  completed: 4,
  cancelled: 5,
}

const levelLabelKey = {
  critical: 'levelCritical',
  urgent: 'levelUrgent',
  normal: 'levelNormal',
}

const tabStyle = (active) => ({
  padding: '10px 18px',
  borderRadius: 8,
  border: active ? '1px solid var(--error)' : '1px solid var(--border)',
  backgroundColor: active ? 'var(--error-soft)' : 'var(--surface-card)',
  color: active ? 'var(--error)' : 'var(--text-body)',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
})

const cardStyle = {
  backgroundColor: 'var(--surface-card)',
  borderRadius: 12,
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
  padding: 20,
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function EmergenciesPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('live')

  const fetchHistory = useCallback(async () => {
    if (!user) return
    try {
      const res = await getAmbulanceHistory()
      const list = res?.data?.rides || res?.data?.history || res?.data || []
      setRequests(Array.isArray(list) ? list : [])
      setError('')
    } catch (err) {
      setError(err.message || t('emergencies.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [user, t])

  useEffect(() => {
    fetchHistory()
    const iv = setInterval(fetchHistory, POLL_MS)
    return () => clearInterval(iv)
  }, [fetchHistory])

  const grouped = useCallback(
    (statuses) => requests.filter((r) => statuses.includes(r.status)),
    [requests]
  )

  const live = grouped(LIVE_STATUSES)
  const completed = grouped(['completed'])
  const cancelled = grouped(['cancelled'])

  const visible =
    filter === 'live' ? live : filter === 'completed' ? completed : filter === 'cancelled' ? cancelled : requests

  const isEmpty =
    (filter === 'live' && live.length === 0) ||
    (filter === 'completed' && completed.length === 0) ||
    (filter === 'cancelled' && cancelled.length === 0) ||
    (filter === 'all' && requests.length === 0)

  const emptyLabel =
    filter === 'live'
      ? t('emergencies.emptyLive')
      : filter === 'completed'
        ? t('emergencies.emptyCompleted')
        : filter === 'cancelled'
          ? t('emergencies.emptyCancelled')
          : t('emergencies.emptyAll')

  const statusLabel = (status) => {
    const idx = statusStepsIndex[status]
    if (idx != null) return t('track.statusSteps')[idx]
    const pretty = String(status || '').replace(/_/g, ' ')
    return pretty.charAt(0).toUpperCase() + pretty.slice(1)
  }

  const levelLabel = (level) => {
    const key = levelLabelKey[level]
    return key ? t(`sos.${key}`) : String(level || '—')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div role="status" aria-live="polite" style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>{t('emergencies.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 20px 64px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-strong)', margin: 0 }}>
            {t('emergencies.title')}
          </h1>
          <Link
            to="/sos"
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              borderRadius: 8,
              backgroundColor: 'var(--emergency-red)',
              backgroundImage: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            {t('emergencies.requestNew')}
          </Link>
        </div>
        <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 24 }}>
          {t('emergencies.subtitle')}
        </p>

        {error && (
          <div
            role="alert"
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              backgroundColor: 'var(--error-soft)',
              border: '1px solid var(--error-border)',
              color: 'var(--error)',
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <button type="button" onClick={() => setFilter('live')} style={tabStyle(filter === 'live')}>
            {t('emergencies.tabLive')} ({live.length})
          </button>
          <button type="button" onClick={() => setFilter('completed')} style={tabStyle(filter === 'completed')}>
            {t('emergencies.tabCompleted')} ({completed.length})
          </button>
          <button type="button" onClick={() => setFilter('cancelled')} style={tabStyle(filter === 'cancelled')}>
            {t('emergencies.tabCancelled')} ({cancelled.length})
          </button>
          <button type="button" onClick={() => setFilter('all')} style={tabStyle(filter === 'all')}>
            {t('emergencies.tabAll')} ({requests.length})
          </button>
        </div>

        {isEmpty ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">🚑</div>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0 }}>{emptyLabel}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {visible.map((r) => {
              const isLive = LIVE_STATUSES.includes(r.status)
              return (
                <div key={r.id || r.tracking_id} style={cardStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                    <span className={`badge badge-${r.status || 'requested'}`}>{statusLabel(r.status)}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(r.created_at)}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 14 }}>
                    <p style={{ margin: '3px 0', color: 'var(--text-body)' }}>
                      <strong>{t('emergencies.pickup')}:</strong>{' '}
                      {r.pickup_address || r.location || t('emergencies.noLocation')}
                    </p>
                    <p style={{ margin: '3px 0', color: 'var(--text-body)' }}>
                      <strong>{t('emergencies.destination')}:</strong> {r.destination_address || r.destination || '—'}
                    </p>
                    <p style={{ margin: '3px 0', color: 'var(--text-body)' }}>
                      <strong>{t('emergencies.level')}:</strong> {levelLabel(r.emergency_level)}
                    </p>
                    <p style={{ margin: '3px 0', color: 'var(--text-body)' }}>
                      <strong>{t('emergencies.trackingId')}:</strong>{' '}
                      <span style={{ fontFamily: 'monospace' }}>{r.tracking_id || r.id || '—'}</span>
                    </p>
                  </div>

                  {isLive && (r.tracking_id || r.id) && (
                    <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Link
                        to={`/track/${r.tracking_id || r.id}`}
                        style={{
                          display: 'inline-block',
                          padding: '9px 18px',
                          borderRadius: 8,
                          backgroundColor: 'var(--error)',
                          color: '#ffffff',
                          fontSize: 14,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        {t('sos.trackAmbulance')}
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
