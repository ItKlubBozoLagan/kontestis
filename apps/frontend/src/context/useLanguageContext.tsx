import React, { FC, ReactNode, useContext, useEffect, useState } from "react";

import {
    DefaultLanguageSpec,
    getLanguageResources,
    I18N_POSSIBLE_LANGUAGES,
    loadLanguage,
} from "../i18n/i18n";
import { useLanguageStore } from "../state/language";
import { useProcessingLoader } from "../state/processing";

type LanguageContextType = {
    currentLanguage: I18N_POSSIBLE_LANGUAGES;
    translationResources: DefaultLanguageSpec;
};

export const LanguageContext = React.createContext<LanguageContextType | null>(null);

export const useLanguageContext = () => {
    const context = useContext(LanguageContext);

    const setLanguage = useLanguageStore((state) => state.setCurrentLanguage);

    if (context === null) {
        console.warn("useLanguageContext used outside of provider, using global default");

        return { currentLanguage: "en" as const, translationResources: {}, setLanguage };
    }

    return { ...context, setLanguage };
};

const DummyLanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <LanguageContext.Provider value={{ currentLanguage: "en", translationResources: {} }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const LocalStorageLanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [languageState, setLanguageState] = useState<LanguageContextType>();
    const [defaultLoaded, setDefaultLoaded] = useState(false);

    const { setIsProcessing } = useProcessingLoader();
    const { currentLanguage } = useLanguageStore();

    useEffect(() => {
        setIsProcessing(true);
        (async (language: I18N_POSSIBLE_LANGUAGES) => {
            await loadLanguage(language);

            setLanguageState({
                currentLanguage: language,
                translationResources: getLanguageResources(language),
            });
            setIsProcessing(false);
        })(currentLanguage);
    }, [currentLanguage]);

    useEffect(() => {
        loadLanguage("en").then(() => setDefaultLoaded(true));
    }, []);

    if (!languageState || !defaultLoaded)
        return <DummyLanguageProvider>{children}</DummyLanguageProvider>;

    return <LanguageContext.Provider value={languageState}>{children}</LanguageContext.Provider>;
};
