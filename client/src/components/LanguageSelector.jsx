import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../i18n/I18nContext'
import { useAccessibility } from '../context/AccessibilityContext'
import { AppIcon } from './AppIcon'

const GlobeIcon = () => <AppIcon name="globe" size={14} />

const ChevronIcon = ({ open }) => (
  <AppIcon className={`lang-chevron ${open ? 'open' : ''}`} name="chevDown" size={10} strokeWidth={2.5} />
)

const CheckIcon = () => <AppIcon name="check" size={14} strokeWidth={2.5} />

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
      <div className="mobile-util" ref={ref}>
        <button
          type="button"
          className="mobile-util-trigger"
          aria-label={t('lang.label')}
          aria-haspopup="listbox"
          aria-expanded={open}
          title={t('lang.label')}
          onClick={() => setOpen((prev) => !prev)}
        >
          <GlobeIcon />
        </button>

        {open && (
          <div className="mobile-lang-dropdown" role="listbox" aria-label={t('lang.label')}>
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={l.code === lang}
                className={`mobile-lang-dropdown-item ${l.code === lang ? 'active' : ''}`}
                onClick={() => select(l.code)}
              >
                <span>{l.native}</span>
                {l.code === lang && (
                  <CheckIcon />
                )}
              </button>
            ))}
          </div>
        )}
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
                  <CheckIcon />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
