import { create } from "zustand";
import { persist } from "zustand/middleware";

import { I18N_DEFAULT_LANGUAGE, I18N_POSSIBLE_LANGUAGES } from "../i18n/i18n";

type LanguageStore = {
    currentLanguage: I18N_POSSIBLE_LANGUAGES;
    setCurrentLanguage: (_: I18N_POSSIBLE_LANGUAGES) => void;
};

export const useLanguageStore = create<LanguageStore>()(
    persist(
        (set) => ({
            currentLanguage: I18N_DEFAULT_LANGUAGE,
            setCurrentLanguage: (language) =>
                set({
                    currentLanguage: language,
                }),
        }),
        {
            name: "@kontestis/i18n",
        }
    )
);
