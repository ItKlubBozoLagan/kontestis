import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import { en } from "./locales/en";
import { hr } from "./locales/hr";

export const LANGUAGES = ["en", "hr"] as const;
export type Language = (typeof LANGUAGES)[number];

export const i18n = i18next.createInstance();

void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            hr: { translation: hr },
        },
        fallbackLng: "en",
        supportedLngs: LANGUAGES,
        interpolation: { escapeValue: false },
        detection: {
            order: ["localStorage", "navigator"],
            lookupLocalStorage: "@kontestis/web/language",
            caches: ["localStorage"],
        },
        returnNull: false,
    });

declare module "i18next" {
    interface CustomTypeOptions {
        defaultNS: "translation";
        resources: { translation: typeof en };
    }
}
