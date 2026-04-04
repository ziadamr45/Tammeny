// i18n configuration
import { ar, type TranslationKeys } from './ar';
import { en } from './en';

export type { TranslationKeys };
export type Language = 'ar' | 'en';

export const translations: Record<Language, TranslationKeys> = {
  ar,
  en,
};

export const defaultLanguage: Language = 'ar';

export const rtlLanguages: Language[] = ['ar'];

export function isRTL(language: Language): boolean {
  return rtlLanguages.includes(language);
}

export function getDirection(language: Language): 'rtl' | 'ltr' {
  return isRTL(language) ? 'rtl' : 'ltr';
}

export function getTranslation(language: Language): TranslationKeys {
  return translations[language] || translations[defaultLanguage];
}

// Helper function to get nested translation by key path
export function t(language: Language, path: string, params?: Record<string, string>): string {
  const translation = getTranslation(language);
  const keys = path.split('.');
  let result: unknown = translation;
  
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path; // Return key path if translation not found
    }
  }
  
  if (typeof result !== 'string') {
    return path;
  }
  
  // Replace parameters if provided
  if (params) {
    return Object.entries(params).reduce(
      (str, [key, value]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), value),
      result
    );
  }
  
  return result;
}

export { ar, en };
