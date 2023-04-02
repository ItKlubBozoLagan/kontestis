import { LanguageSpec } from "../i18n";

const I18nEn = {
    login: {
        siteRestriction: "Login is currently only limited to %1 accounts",
    },
    navbar: {
        dashboard: "Dashboard",
        contests: "Contests",
        problems: "Problems",
        account: "Account",
    },
} as const satisfies LanguageSpec;

export default I18nEn;

export type I18nEn_Type = typeof I18nEn;
