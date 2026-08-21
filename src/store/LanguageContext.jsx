import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import en from '../locales/en.json'
import id from '../locales/id.json'

const translations = { en, id }

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('axiom-lang') || 'en'
    }
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem('axiom-lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key, params = {}) => {
    const keys = key.split('.')
    let result = translations[lang]
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k]
      } else {
        result = translations.en
        for (const k2 of keys) {
          if (result && typeof result === 'object' && k2 in result) {
            result = result[k2]
          } else {
            return key
          }
        }
        break
      }
    }
    if (typeof result === 'string') {
      return Object.entries(params).reduce((str, [k, v]) => str.replace(`{${k}}`, v), result)
    }
    return key
  }, [lang])

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'en' ? 'id' : 'en')
  }, [])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}