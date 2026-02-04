import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import {
    DefaultLanguageSpec,
    getLanguageResources,
    I18N_AVAILABLE_LANGUAGES,
    I18N_DEFAULT_LANGUAGE,
    I18N_POSSIBLE_LANGUAGES,
    loadLanguage,
} from "./i18n";
import I18nEn from "./languages/en";

type PathsToStringProperties<T> = T extends string
    ? []
    : {
          [K in keyof T]: [K, ...PathsToStringProperties<T[K]>];
      }[keyof T];

type Join<T extends string[], D extends string = "."> = T extends []
    ? never
    : T extends [infer F]
    ? F extends string
        ? F
        : never
    : T extends [infer F, ...infer R]
    ? F extends string
        ? R extends string[]
            ? `${F}${D}${Join<R, D>}`
            : never
        : never
    : string;

export type TranslationKey = Join<PathsToStringProperties<typeof I18nEn>>;

function getNestedValue(object: Record<string, unknown>, path: string): string {
    const keys = path.split(".");
    let current: unknown = object;

    for (const key of keys) {
        if (current === null || current === undefined || typeof current !== "object") {
            return path;
        }

        current = (current as Record<string, unknown>)[key];
    }

    return typeof current === "string" ? current : path;
}

interface LanguageContextType {
    currentLanguage: I18N_POSSIBLE_LANGUAGES;
    setLanguage: (language: I18N_POSSIBLE_LANGUAGES) => void;
    isLoading: boolean;
    availableLanguages: readonly I18N_POSSIBLE_LANGUAGES[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "kontestis-language";

function getStoredLanguage(): I18N_POSSIBLE_LANGUAGES {
    if (typeof window === "undefined") return I18N_DEFAULT_LANGUAGE;

    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (stored && I18N_AVAILABLE_LANGUAGES.includes(stored as I18N_POSSIBLE_LANGUAGES)) {
        return stored as I18N_POSSIBLE_LANGUAGES;
    }

    // Try to detect from browser
    const browserLang = navigator.language.split("-")[0];

    if (I18N_AVAILABLE_LANGUAGES.includes(browserLang as I18N_POSSIBLE_LANGUAGES)) {
        return browserLang as I18N_POSSIBLE_LANGUAGES;
    }

    return I18N_DEFAULT_LANGUAGE;
}

interface LanguageProviderProperties {
    children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProperties) {
    const [currentLanguage, setCurrentLanguage] =
        useState<I18N_POSSIBLE_LANGUAGES>(getStoredLanguage);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load default and current language
        const loadLanguages = async () => {
            setIsLoading(true);

            try {
                await loadLanguage(I18N_DEFAULT_LANGUAGE);

                if (currentLanguage !== I18N_DEFAULT_LANGUAGE) {
                    await loadLanguage(currentLanguage);
                }
            } catch (error) {
                console.error("Failed to load language:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadLanguages();
    }, [currentLanguage]);

    const setLanguage = useCallback((language: I18N_POSSIBLE_LANGUAGES) => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        setCurrentLanguage(language);
    }, []);

    return (
        <LanguageContext.Provider
            value={{
                currentLanguage,
                setLanguage,
                isLoading,
                availableLanguages: I18N_AVAILABLE_LANGUAGES,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);

    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }

    return context;
}

export function useTranslation() {
    const { currentLanguage, isLoading } = useLanguage();

    const t = useCallback(
        (key: TranslationKey, ...arguments_: (string | number)[]): string => {
            if (isLoading) return key;

            let translation: DefaultLanguageSpec;

            try {
                translation = getLanguageResources(currentLanguage);
            } catch {
                // Fallback to default if current language not loaded
                try {
                    translation = getLanguageResources(I18N_DEFAULT_LANGUAGE);
                } catch {
                    return key;
                }
            }

            let text = getNestedValue(translation as Record<string, unknown>, key);

            // If not found in current language, try default
            if (text === key && currentLanguage !== I18N_DEFAULT_LANGUAGE) {
                try {
                    const defaultTranslation = getLanguageResources(I18N_DEFAULT_LANGUAGE);

                    text = getNestedValue(defaultTranslation as Record<string, unknown>, key);
                } catch {
                    // Ignore, use key as fallback
                }
            }

            // Replace %1, %2, etc. with the provided arguments
            for (const [index, argument] of arguments_.entries()) {
                text = text.replace(`%${index + 1}`, String(argument));
            }

            return text;
        },
        [currentLanguage, isLoading]
    );

    return { t, language: currentLanguage, isLoading };
}
