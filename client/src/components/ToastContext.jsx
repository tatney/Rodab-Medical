import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const remove = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message, type = 'info', durationMs = 4000) => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    timers.current[id] = setTimeout(() => remove(id), durationMs)
    return id
  }, [remove])

  const toast = {
    success: (msg, ms) => show(msg, 'success', ms),
    error: (msg, ms) => show(msg, 'error', ms),
    info: (msg, ms) => show(msg, 'info', ms),
    warning: (msg, ms) => show(msg, 'warning', ms),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 99999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, pointerEvents: 'none' }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const STYLES = {
  success: { bg: '#dcfce7', border: '#16a34a', color: '#166534', icon: '✓' },
  error: { bg: '#fee2e2', border: '#dc2626', color: '#991b1b', icon: '✕' },
  warning: { bg: '#fef3c7', border: '#d97706', color: '#92400e', icon: '⚠' },
  info: { bg: '#dbeafe', border: '#2563eb', color: '#1e40af', icon: 'ℹ' },
}

function ToastItem({ toast, onDismiss }) {
  const s = STYLES[toast.type] || STYLES.info
  return (
    <div
      role="alert"
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 8,
        backgroundColor: s.bg,
        borderLeft: `4px solid ${s.border}`,
        color: s.color,
        fontSize: 14,
        fontFamily: 'Barlow, sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        animation: 'toast-in 0.25s ease',
      }}
    >
      <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', color: s.color, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0, opacity: 0.6 }}
        onMouseEnter={(e) => { e.target.style.opacity = 1 }}
        onMouseLeave={(e) => { e.target.style.opacity = 0.6 }}
      >
        ×
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
