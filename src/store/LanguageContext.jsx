import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import en from '../locales/en.json'
import id from '../locales/id.json'

const dictionaries = { en, id }

const LanguageContext = createContext(null)

/** Resolve a dot-notation path against a nested object. */
function resolve(dict, path) {
  return path.split('.').reduce((node, key) => (node == null ? undefined : node[key]), dict)
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('axiom-lang') || 'id'
    }
    return 'id'
  })

  useEffect(() => {
    localStorage.setItem('axiom-lang', lang)
  }, [lang])

  /**
   * Translate a key like 'profile.title'.
   * Falls back: current lang → English → the raw key.
   * Supports interpolation: t('hello', { name: 'Ari' }) with "{{name}}" in strings.
   */
  const t = useCallback((key, params) => {
    let str = resolve(dictionaries[lang], key)
    if (str == null) str = resolve(dictionaries.en, key)
    if (str == null) return key
    if (typeof str !== 'string') return str
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replaceAll(`{{${k}}}`, String(v))
      })
    }
    return str
  }, [lang])

  const toggleLanguage = useCallback(() => {
    setLang(prev => (prev === 'id' ? 'en' : 'id'))
  }, [])

  const value = useMemo(
    () => ({ lang, setLang, toggleLanguage, toggleLang: toggleLanguage, t }),
    [lang, toggleLanguage, t]
  )

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