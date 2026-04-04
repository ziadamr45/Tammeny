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
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export default LanguageProvider;
