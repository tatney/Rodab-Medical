import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SOSButton() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const target = user ? '/ambulance' : '/sos'

  return (
    <button
      className="sos-fab"
      onClick={() => navigate(target)}
      title="Emergency SOS"
    >
      SOS
    </button>
  )
}
