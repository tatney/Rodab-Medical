import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const COOKIE_KEY = 'rodab_cookie_consent'

export default function CookieConsent() {
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
    <div className="cookie-consent" role="dialog" aria-label="Cookie consent">
      <p>
        We use cookies to improve your experience, analyze site traffic, and personalize content. 
        By clicking "Accept", you consent to our use of cookies.{' '}
        <Link to="/privacy-policy">Learn more</Link>
      </p>
      <div className="cookie-btn-group">
        <button onClick={handleDecline} className="cookie-btn-decline">Decline</button>
        <button onClick={handleAccept} className="cookie-btn-accept">Accept</button>
      </div>
    </div>
  )
}
