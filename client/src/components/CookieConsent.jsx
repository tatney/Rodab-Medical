import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/I18nContext'

const COOKIE_KEY = 'rodab_cookie_consent'

export default function CookieConsent() {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ analytics: true, marketing: true, timestamp: Date.now() }))
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ analytics: false, marketing: false, timestamp: Date.now() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-consent" role="dialog" aria-label={t('cookie.message')}>
      <p>
        {t('cookie.message')}{' '}
        <Link to="/privacy-policy">{t('cookie.learnMore')}</Link>
      </p>
      <div className="cookie-btn-group">
        <button onClick={handleDecline} className="cookie-btn-decline">{t('cookie.decline')}</button>
        <button onClick={handleAccept} className="cookie-btn-accept">{t('cookie.accept')}</button>
      </div>
    </div>
  )
}
