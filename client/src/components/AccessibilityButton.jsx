import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAccessibility, FONT_SCALES } from '../context/AccessibilityContext'
import { useI18n } from '../i18n/I18nContext'
import { AppIcon } from './AppIcon'

const AccessibilityIcon = () => <AppIcon name="accessibility" size={16} />

const SunIcon = () => <AppIcon name="sun" size={16} />

const MoonIcon = () => <AppIcon name="moon" size={16} />

export default function AccessibilityButton({ variant = 'utility', onNavigate }) {
  const { t } = useI18n()
  const { isDark, toggleTheme, fontScale, increaseFontSize, decreaseFontSize, resetFontSize } = useAccessibility()
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) close()
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

  const percent = Math.round(fontScale * 100)

  const controls = (
    <div className="a11y-controls">
      <div className="a11y-section-label">{t('a11y.themeHeading')}</div>
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? t('a11y.darkMode') : t('a11y.lightMode')}
        className={`a11y-theme-toggle ${isDark ? 'on' : ''}`}
        onClick={toggleTheme}
      >
        <span className="a11y-theme-icon">{isDark ? <MoonIcon /> : <SunIcon />}</span>
        <span className="a11y-theme-text">{isDark ? t('a11y.darkMode') : t('a11y.lightMode')}</span>
        <span className="a11y-theme-track" aria-hidden="true">
          <span className="a11y-theme-thumb" />
        </span>
      </button>

      <div className="a11y-section-label" style={{ marginTop: 16 }}>{t('a11y.fontHeading')}</div>
      <div className="a11y-font-row">
        <button
          type="button"
          className="a11y-font-btn"
          aria-label={t('a11y.fontSmall')}
          title={t('a11y.fontSmall')}
          onClick={decreaseFontSize}
          disabled={fontScale === FONT_SCALES[0]}
        >
          A−
        </button>
        <span className="a11y-font-value" aria-live="polite">
          {percent}%
        </span>
        <button
          type="button"
          className="a11y-font-btn"
          aria-label={t('a11y.fontLarge')}
          title={t('a11y.fontLarge')}
          onClick={increaseFontSize}
          disabled={fontScale === FONT_SCALES[FONT_SCALES.length - 1]}
        >
          A+
        </button>
        <button
          type="button"
          className="a11y-font-reset"
          aria-label={t('a11y.fontReset')}
          title={t('a11y.fontReset')}
          onClick={resetFontSize}
          disabled={fontScale === 1}
        >
          {t('a11y.fontReset')}
        </button>
      </div>
    </div>
  )

  if (variant === 'mobile') {
    return (
      <div className="mobile-util" ref={panelRef}>
        <button
          type="button"
          className="mobile-util-trigger"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={t('a11y.button')}
          title={t('a11y.button')}
          onClick={() => setOpen((prev) => !prev)}
        >
          <AccessibilityIcon />
        </button>

        {open && (
          <div className="mobile-a11y-panel" role="dialog" aria-label={t('a11y.panelTitle')}>
            <div className="mobile-a11y-panel-title">
              <AccessibilityIcon /> {t('a11y.panelTitle')}
            </div>
            {controls}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="a11y-wrap" ref={panelRef}>
      <button
        type="button"
        className="utility-item a11y-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t('a11y.button')}
        title={t('a11y.button')}
        onClick={() => setOpen((prev) => !prev)}
      >
        <AccessibilityIcon />
        <span className="a11y-trigger-label">{t('a11y.button')}</span>
      </button>

      {open && (
        <div className="a11y-panel" role="dialog" aria-label={t('a11y.panelTitle')}>
          <div className="a11y-panel-header">
            <span className="a11y-panel-title">
              <AccessibilityIcon /> {t('a11y.panelTitle')}
            </span>
            <button type="button" className="a11y-panel-close" aria-label={t('a11y.panelClose')} onClick={close}>
              &times;
            </button>
          </div>
          {controls}
        </div>
      )}
    </div>
  )
}
