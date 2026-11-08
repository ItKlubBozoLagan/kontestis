import type { EvaluationLanguage } from "@kontestis/models";
import { useTranslation } from "react-i18next";

import { TOOLING_LANGUAGES } from "@/components/code/languages";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export const LanguageSelect = ({
    value,
    onChange,
    languages = TOOLING_LANGUAGES,
    id,
}: {
    value: EvaluationLanguage | undefined;
    onChange: (language: EvaluationLanguage) => void;
    languages?: EvaluationLanguage[];
    id?: string;
}) => {
    const { t } = useTranslation();

    return (
        <Select value={value} onValueChange={(next) => onChange(next as EvaluationLanguage)}>
            <SelectTrigger id={id} className="w-full sm:w-56">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {languages.map((language) => (
                    <SelectItem key={language} value={language}>
                        {t(`programmingLanguages.${language}`)}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};
