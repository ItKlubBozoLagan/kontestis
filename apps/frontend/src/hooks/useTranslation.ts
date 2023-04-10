import { useCallback } from "react";

import { useLanguageContext } from "../context/useLanguageContext";
import { I18NTextKeys, TranslationFunction, translationValueFromKey } from "../i18n/i18n";

type UseTranslationType = {
    t: TranslationFunction<I18NTextKeys>;
};

export const useTranslation = (): UseTranslationType => {
    const { currentLanguage } = useLanguageContext();

    const translate = useCallback<UseTranslationType["t"]>(
        (key) => translationValueFromKey(currentLanguage, key),
        [currentLanguage]
    );

    return { t: translate };
};
