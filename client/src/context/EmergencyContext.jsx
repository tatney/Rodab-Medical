import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { getActiveEmergencies } from '../api'
import { useAuth } from './AuthContext'
import { startPremiumAlert } from '../utils/alertSound'

const EmergencyContext = createContext(null)

function playSiren() {
  try {
    const handle = startPremiumAlert({ loop: false })
    handle.start()
  } catch (err) {
    console.warn('Siren audio failed:', err)
  }
}

export function EmergencyProvider({ children }) {
  const { user } = useAuth()
  const [emergencies, setEmergencies] = useState([])
  const [hasNewEmergency, setHasNewEmergency] = useState(false)
  const lastCountRef = useRef(0)
  const intervalRef = useRef(null)

  const fetchEmergencies = useCallback(async () => {
    try {
      const res = await getActiveEmergencies()
      const list = res.data?.active || res.data?.rides || res.data?.emergencies || []
      setEmergencies(list)

      if (list.length > lastCountRef.current) {
        const critical = list.find(
          (e) => e.emergency_level === 'critical' || e.emergency_level === 'urgent' || e.priority === 'critical' || e.priority === 'urgent'
        )
        if (critical) {
          playSiren()
        }
        setHasNewEmergency(true)
      }
      lastCountRef.current = list.length
    } catch (err) {
      console.warn('Emergency poll failed:', err)
    }
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'super_admin') return;
    fetchEmergencies()
    intervalRef.current = setInterval(fetchEmergencies, 15000)
    return () => clearInterval(intervalRef.current)
  }, [fetchEmergencies, user?.role])

  const dismissNewEmergency = () => setHasNewEmergency(false)

  return (
    <EmergencyContext.Provider
      value={{ emergencies, hasNewEmergency, dismissNewEmergency }}
    >
      {children}
    </EmergencyContext.Provider>
  )
}

export function useEmergency() {
  const context = useContext(EmergencyContext)
  if (!context) {
    throw new Error('useEmergency must be used within an EmergencyProvider')
  }
  return context
}
