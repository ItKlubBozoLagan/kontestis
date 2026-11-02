import type { Translation } from "../../types";
import type { account as en } from "../en/account";

export const account: Translation<typeof en> = {
    title: "Račun",
    label: "Informacije računa",
    fullName: "Ime i prezime",
    email: "E-pošta",
    badges: {
        admin: "Administrator",
        google: "Google",
        managed: "Račun e-poštom",
        temporary: "Privremeni",
    },
    rank: {
        title: "Rang",
        current: "{{elo}} Elo",
        next: "Još {{points}} Elo do ranga {{rank}}",
        max: "Dosegnut najviši rang",
        hint: "Elo se prati po organizaciji i mijenja se nakon službenih natjecanja.",
    },
    aaiedu: {
        title: "Povezan AAI@EduHr račun",
        linkTitle: "AAI@EduHr",
        linkDescription:
            "Poveži svoj AAI@EduHr identitet za natjecanja koja zahtijevaju verifikaciju.",
        userId: "ID korisnika",
        fullName: "Ime i prezime",
        email: "Adresa e-pošte",
        associatedOrg: "Povezana organizacija",
        dob: "Datum rođenja",
        studentCategory: "Kategorija studenta",
        professionalStatus: "Profesionalni status",
    },
    stats: {
        title: "Statistika",
        elo: "Povijest Elo bodova",
        ranges: {
            "24h": "24h",
            "7d": "7d",
            "30d": "30d",
            "1y": "1g",
        },
    },
};
