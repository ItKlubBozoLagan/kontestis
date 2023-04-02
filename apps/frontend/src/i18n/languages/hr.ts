import { DefaultLanguageSpec } from "../i18n";

export default {
    login: {
        siteRestriction: "Prijava je trenutno ograničena na %1 račune",
    },
    navbar: {
        dashboard: "Nadzorna ploča",
        contests: "Natjecanja",
        problems: "Zadatci",
        account: "Korisnik",
    },
} as const satisfies DefaultLanguageSpec;
