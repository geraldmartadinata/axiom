import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LanguageContext = createContext(null)

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

  const toggleLanguage = useCallback(() => {
    setLang(prev => prev === 'id' ? 'en' : 'id')
  }, [])

  const value = { lang, setLang, toggleLanguage }

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