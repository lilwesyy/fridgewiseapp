'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { detectCountry, getLanguageFromCountry } from '@/lib/geolocation';
import { Language, useTranslations, Translations } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations(language);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Check if language is already stored
        const storedLanguage = localStorage.getItem('fridgewiseai_language') as Language;
        if (storedLanguage && (storedLanguage === 'it' || storedLanguage === 'en')) {
          setLanguage(storedLanguage);
          setIsLoading(false);
          return;
        }

        // Detect country and set language
        const countryCode = await detectCountry();
        const detectedLanguage = getLanguageFromCountry(countryCode);
        
        setLanguage(detectedLanguage);
        localStorage.setItem('fridgewiseai_language', detectedLanguage);
      } catch (error) {
        console.error('Error initializing language:', error);
        // Fallback to English
        setLanguage('en');
        localStorage.setItem('fridgewiseai_language', 'en');
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('fridgewiseai_language', lang);
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage: handleSetLanguage,
      t,
      isLoading
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}