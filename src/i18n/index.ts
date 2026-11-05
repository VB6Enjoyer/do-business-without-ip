import { en, type UIStrings } from './en';

export const languages = { en: 'English' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'en';

const dictionaries: Record<Lang, UIStrings> = { en };

/** Returns the UI string dictionary for a language (English for now). */
export function useStrings(lang: Lang = defaultLang): UIStrings {
  return dictionaries[lang];
}
