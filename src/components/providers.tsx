"use client";

import { useEffect, useState, useRef } from "react";
import { LanguageProvider } from "@/contexts/language-context";
import type { Language } from "@/lib/i18n";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const [initialLanguage, setInitialLanguage] = useState<Language | undefined>(undefined);
  const loadedSettings = useRef(false);

  useEffect(() => {
    if (loadedSettings.current) return;
    loadedSettings.current = true;
    
    // Load language from localStorage on mount
    const savedLang = localStorage.getItem("tamenny-language") as Language | null;
    if (savedLang && (savedLang === "ar" || savedLang === "en")) {
      setInitialLanguage(savedLang);
    }
  }, []);

  // Also load user's language preference from their account
  useEffect(() => {
    const loadUserSettings = async () => {
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings?.language) {
            setInitialLanguage(data.settings.language as Language);
            localStorage.setItem("tamenny-language", data.settings.language);
          }
        }
      } catch (error) {
        console.log("Could not load user settings:", error);
      }
    };
    
    loadUserSettings();
  }, []);

  // Always render the LanguageProvider - it handles default values internally
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      {children}
    </LanguageProvider>
  );
}

export default Providers;
