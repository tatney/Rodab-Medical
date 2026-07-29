import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { getActiveEmergencies } from '../api'
import { useAuth } from './AuthContext'

const EmergencyContext = createContext(null)

function playSiren() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc1 = audioCtx.createOscillator()
    const osc2 = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()

    osc1.type = 'sine'
    osc2.type = 'sine'
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)

    osc1.connect(gainNode)
    osc2.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    const now = audioCtx.currentTime
    for (let i = 0; i < 6; i++) {
      osc1.frequency.setValueAtTime(800, now + i * 0.5)
      osc1.frequency.linearRampToValueAtTime(1200, now + i * 0.5 + 0.25)
      osc1.frequency.linearRampToValueAtTime(800, now + i * 0.5 + 0.5)
      osc2.frequency.setValueAtTime(600, now + i * 0.5)
      osc2.frequency.linearRampToValueAtTime(1000, now + i * 0.5 + 0.25)
      osc2.frequency.linearRampToValueAtTime(600, now + i * 0.5 + 0.5)
    }

    gainNode.gain.setValueAtTime(0.3, now + 2.5)
    gainNode.gain.linearRampToValueAtTime(0, now + 3.5)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 3.5)
    osc2.stop(now + 3.5)
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
