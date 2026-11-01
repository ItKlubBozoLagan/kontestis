import { enGB, hr } from "date-fns/locale";
import { useTranslation } from "react-i18next";

export const useDateLocale = () => {
    const { i18n } = useTranslation();

    return i18n.resolvedLanguage === "hr" ? hr : enGB;
};
