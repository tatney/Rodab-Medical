import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { useAccessibility } from '../context/AccessibilityContext'

const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
  </svg>
)

const ChevronIcon = ({ open }) => (
  <svg
    className={`lang-chevron ${open ? 'open' : ''}`}
    width="10"
    height="10"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

export default function LanguageSelector({ variant = 'utility', onNavigate }) {
  const { lang, setLang, t, LANGUAGES } = useI18n()
  const { isDark } = useAccessibility()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close()
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, close])

  const select = (code) => {
    setLang(code)
    close()
    if (onNavigate) onNavigate()
  }

  if (variant === 'mobile') {
    return (
      <div className="mobile-lang-selector" ref={ref}>
        <div className="mobile-slideout-section-title">{t('lang.label')}</div>
        <div className="mobile-lang-options" role="group" aria-label={t('lang.label')}>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              className={`mobile-lang-option ${l.code === lang ? 'active' : ''}`}
              aria-pressed={l.code === lang}
              onClick={() => select(l.code)}
            >
              {l.native}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="lang-selector-wrap" ref={ref}>
      <button
        type="button"
        className="lang-selector"
        aria-label={t('lang.label')}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t('lang.label')}
        onClick={() => setOpen((prev) => !prev)}
      >
        <GlobeIcon />
        <span className="lang-selector-current">{current.native}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul className="lang-dropdown" role="listbox" aria-label={t('lang.label')} data-theme={isDark ? 'dark' : 'light'}>
          {LANGUAGES.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                className={`lang-dropdown-item ${l.code === lang ? 'active' : ''}`}
                onClick={() => select(l.code)}
              >
                <span className="lang-native">{l.native}</span>
                {l.code === lang && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
