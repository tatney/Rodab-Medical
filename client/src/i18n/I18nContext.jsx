import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from './translations/en'
import ar from './translations/ar'
import fr from './translations/fr'

const STORAGE_KEY = 'rodab_lang'

const DICTIONARIES = { en, ar, fr }

export const LANGUAGES = [
  { code: 'en', native: 'English', dir: 'ltr' },
  { code: 'ar', native: 'العربية', dir: 'rtl' },
  { code: 'fr', native: 'Français', dir: 'ltr' },
]

function getInitialLang() {
  if (typeof window === 'undefined') return 'en'
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored && DICTIONARIES[stored]) return stored
    const nav = window.navigator?.languages || [window.navigator?.language]
    const detected = nav.map((l) => String(l).slice(0, 2)).find((l) => DICTIONARIES[l])
    return detected || 'en'
  } catch {
    return 'en'
  }
}

function lookup(dict, key, fallback) {
  const parts = key.split('.')
  let node = dict
  for (const part of parts) {
    if (node && typeof node === 'object' && part in node) {
      node = node[part]
    } else {
      return fallback
    }
  }
  return typeof node === 'string' ? node : fallback
}

function lookupRaw(dict, key) {
  const parts = key.split('.')
  let node = dict
  for (const part of parts) {
    if (node && typeof node === 'object' && part in node) {
      node = node[part]
    } else {
      return undefined
    }
  }
  return node
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang)

  useEffect(() => {
    const dir = LANGUAGES.find((l) => l.code === lang)?.dir || 'ltr'
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang])

  const setLang = useCallback((code) => {
    if (!DICTIONARIES[code]) return
    setLangState(code)
    try {
      window.localStorage.setItem(STORAGE_KEY, code)
    } catch {
      /* ignore storage errors */
    }
  }, [])

  const t = useCallback(
    (key, fallback) => {
      const dict = DICTIONARIES[lang] || DICTIONARIES.en
      const translated = lookup(dict, key, undefined)
      if (translated !== undefined) return translated
      const english = lookup(DICTIONARIES.en, key, undefined)
      return english !== undefined ? english : fallback ?? key
    },
    [lang]
  )

  const tr = useCallback(
    (key) => {
      const dict = DICTIONARIES[lang] || DICTIONARIES.en
      const raw = lookupRaw(dict, key)
      if (raw !== undefined) return raw
      const english = lookupRaw(DICTIONARIES.en, key)
      return english !== undefined ? english : key
    },
    [lang]
  )

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      tr,
      dir: LANGUAGES.find((l) => l.code === lang)?.dir || 'ltr',
      LANGUAGES,
    }),
    [lang, setLang, t, tr]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return ctx
}

export default I18nContext
