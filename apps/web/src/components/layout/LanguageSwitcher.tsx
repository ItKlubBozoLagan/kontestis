import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Language, LANGUAGES } from "@/i18n/i18n";

export const flagFor = (language: Language) =>
    `/country_flags/${language === "en" ? "gb" : language}.webp`;

export const LanguageMenuItems = () => {
    const { t, i18n } = useTranslation();

    return LANGUAGES.map((language) => (
        <DropdownMenuItem key={language} onSelect={() => i18n.changeLanguage(language)}>
            <img src={flagFor(language)} alt="" className="h-3 w-4 rounded-[2px] object-cover" />
            {t(`common.languages.${language}`)}
            {i18n.resolvedLanguage === language && <Check className="ml-auto" />}
        </DropdownMenuItem>
    ));
};

export const LanguageSwitcher = () => {
    const { t } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" aria-label={t("common.language")}>
                    <Languages />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <LanguageMenuItems />
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
