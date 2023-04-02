import { LanguageSpec } from "../i18n";

export const I18nEn = {
    login: {
        siteRestriction: "Login is currently only limited to %1 accounts",
    },
} as const satisfies LanguageSpec;

export type I18nEn_Type = typeof I18nEn;
