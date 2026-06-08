import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { translations, type Lang, type TranslationKey } from './translations'

const LANG_KEY = 'cooklist_lang'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem(LANG_KEY)
    if (stored === 'en' || stored === 'sv') return stored
    // Auto-detect browser language
    const browser = navigator.language?.toLowerCase()
    return browser?.startsWith('sv') ? 'sv' : 'en'
  })

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem(LANG_KEY, l)
  }

  const t = (key: TranslationKey): string => {
    return translations[lang][key] ?? translations.en[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}
