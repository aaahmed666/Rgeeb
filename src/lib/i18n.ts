import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "@/i18n/locales/en.json";
import ar from "@/i18n/locales/ar.json";

export const SUPPORTED_LANGUAGES = ["en", "ar"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
      },
      fallbackLng: "en",
      supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
      interpolation: { escapeValue: false },
      // Make init synchronous — resources are bundled inline so no async loading needed.
      // Without this, components render before init resolves and t() returns the key.
      // (initImmediate was renamed to initAsync in i18next v26)
      initAsync: false,
      react: {
        // Disable Suspense — we don't use it and it causes issues with SSR/App Router.
        useSuspense: false,
      },
      detection: {
        order: ["localStorage", "navigator"],
        caches: ["localStorage"],
        lookupLocalStorage: "app.language",
      },
    });
}

export const isRtl = (lang: string) => lang === "ar";

export default i18n;
