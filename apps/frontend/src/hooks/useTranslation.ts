import { useCallback } from "react";

import { useLanguageContext } from "../context/useLanguageContext";
import { I18NDefaultKeys, I18NPlaceholderKeys, translationValueFromKey } from "../i18n/i18n";

export const useTranslation = () => {
    const { currentLanguage } = useLanguageContext();

    const translate = useCallback(
        (key: Exclude<I18NDefaultKeys, I18NPlaceholderKeys>) =>
            translationValueFromKey(currentLanguage, key),
        [currentLanguage]
    );

    return { t: translate };
};
