import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'rodab_accessibility'

export const FONT_SCALES = [1, 1.12, 1.25]

function getInitialState() {
  let stored = null
  if (typeof window !== 'undefined') {
    try {
      stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null')
    } catch {
      stored = null
    }
  }
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches

  return {
    theme: stored?.theme === 'dark' || stored?.theme === 'light' ? stored.theme : prefersDark ? 'dark' : 'light',
    fontScale: FONT_SCALES.includes(stored?.fontScale) ? stored.fontScale : 1,
  }
}

const AccessibilityContext = createContext(null)

export function AccessibilityProvider({ children }) {
  const [initial] = useState(getInitialState)
  const [theme, setTheme] = useState(initial.theme)
  const [fontScale, setFontScale] = useState(initial.fontScale)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme, fontScale })
      )
    } catch {
      /* ignore storage errors */
    }
  }, [theme, fontScale])

  useEffect(() => {
    const el = document.documentElement
    el.style.setProperty('--font-scale', String(fontScale))
  }, [fontScale])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const setFontSize = useCallback((scale) => {
    if (FONT_SCALES.includes(scale)) setFontScale(scale)
  }, [])

  const increaseFontSize = useCallback(() => {
    setFontScale((prev) => {
      const idx = FONT_SCALES.indexOf(prev)
      return FONT_SCALES[Math.min(idx + 1, FONT_SCALES.length - 1)]
    })
  }, [])

  const decreaseFontSize = useCallback(() => {
    setFontScale((prev) => {
      const idx = FONT_SCALES.indexOf(prev)
      return FONT_SCALES[Math.max(idx - 1, 0)]
    })
  }, [])

  const resetFontSize = useCallback(() => setFontScale(1), [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      isDark: theme === 'dark',
      fontScale,
      increaseFontSize,
      decreaseFontSize,
      resetFontSize,
      setFontSize,
    }),
    [theme, toggleTheme, fontScale, increaseFontSize, decreaseFontSize, resetFontSize, setFontSize]
  )

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider')
  }
  return ctx
}

export default AccessibilityContext
