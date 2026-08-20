// ===================================================
// LanguageContext — Internationalization Context (FR / EN)
// ===================================================

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getTranslation } from '../i18n/translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('bzz_language')
      if (saved && (saved === 'fr' || saved === 'en')) {
        return saved
      }
      if (typeof navigator !== 'undefined' && navigator.language) {
        return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en'
      }
    } catch (e) {
      console.error('Error reading language preference:', e)
    }
    return 'fr'
  })

  const setLanguage = useCallback((newLang) => {
    if (newLang !== 'fr' && newLang !== 'en') return
    setLanguageState(newLang)
    try {
      localStorage.setItem('bzz_language', newLang)
    } catch (e) {
      console.error('Error saving language preference:', e)
    }
  }, [])

  const t = useCallback((key, params) => {
    return getTranslation(language, key, params)
  }, [language])

  /**
   * Helper to get localized string from an object with _en / _fr keys or fallback to default
   */
  const getLocalized = useCallback((obj, field = 'name') => {
    if (!obj) return ''
    if (language === 'en') {
      return obj[`${field}_en`] || obj[`${field}En`] || obj[field] || ''
    }
    return obj[`${field}_fr`] || obj[`${field}Fr`] || obj[field] || ''
  }, [language])

  const value = {
    language,
    setLanguage,
    t,
    getLocalized,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
