import type { Translation } from "../../types";
import type { dashboard as en } from "../en/dashboard";

export const dashboard: Translation<typeof en> = {
    title: "Početna",
    welcome: "Dobro došao natrag, {{name}}",
    stats: {
        title: "Osnovne informacije",
        contests: "Natjecanja",
        contestsHint: "{{running}} u tijeku · {{upcoming}} nadolazećih",
        problems: "Zadaci",
        submissions: "Predaje",
        accepted: "Prihvaćeno",
        acceptedHint: "{{rate}} prihvaćenih",
        solved: "Riješeni zadaci",
        solvedHint: "od {{total}} zadataka",
    },
    upcoming: {
        title: "Natjecanja u tijeku i nadolazeća",
        empty: "Trenutno nema natjecanja u tijeku ni nadolazećih.",
        all: "Sva natjecanja",
        registered: "Registriran",
    },
    alerts: {
        title: "Obavijesti",
        none: "Nema za sada!",
        older: "Prikaži starije",
        collapse: "Sažmi",
    },
    activity: {
        title: "Tvoja aktivnost",
    },
};
