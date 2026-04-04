"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import {
  type Language,
  type TranslationKeys,
  translations,
  defaultLanguage,
  getDirection,
  isRTL,
} from "@/lib/i18n";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: TranslationKeys;
  direction: "rtl" | "ltr";
  isRTL: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Default values for SSR (server-side rendering)
const defaultContextValue: LanguageContextType = {
  language: defaultLanguage,
  setLanguage: async () => {},
  t: translations[defaultLanguage],
  direction: getDirection(defaultLanguage),
  isRTL: isRTL(defaultLanguage),
  isLoading: false,
};

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: Language;
}

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage || defaultLanguage);
  const [isLoading, setIsLoading] = useState(false);

  // Load language from localStorage on mount (for non-authenticated users)
  useEffect(() => {
    const savedLang = localStorage.getItem("tamenny-language") as Language | null;
    if (savedLang && (savedLang === "ar" || savedLang === "en")) {
      setLanguageState(savedLang);
      document.documentElement.lang = savedLang;
      document.documentElement.dir = getDirection(savedLang);
    }
  }, []);

  // Update document direction and lang attribute when language changes
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = getDirection(language);
    
    // Save to localStorage for non-authenticated users
    localStorage.setItem("tamenny-language", language);
  }, [language]);

  const setLanguage = useCallback(async (lang: Language) => {
    setIsLoading(true);
    setLanguageState(lang);
    
    // Try to save to user's account if authenticated
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang }),
      });
      
      if (!response.ok) {
        // User not authenticated, language is saved in localStorage only
        console.log("Language saved locally (not authenticated)");
      }
    } catch (error) {
      console.log("Language saved locally:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
    direction: getDirection(language),
    isRTL: isRTL(language),
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  // Return default values during SSR instead of throwing error
  if (context === undefined) {
    return defaultContextValue;
  }
  return context;
}

export default LanguageProvider;
