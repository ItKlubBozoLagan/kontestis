import type { Translation } from "../../types";
import type { dashboard as en } from "../en/dashboard";

export const dashboard: Translation<typeof en> = {
    title: "Početna",
    welcome: "Dobro došao natrag, {{name}}",
    live: {
        title: "Upravo traje",
        continue: "Nastavi",
        notStarted: "Još nema zadataka",
    },
    next: {
        title: "Natjecanja u tijeku i nadolazeća",
        registered: "Registriran",
        all: "Sva natjecanja",
        emptyTitle: "Trenutno nema natjecanja u tijeku ni nadolazećih.",
        emptyHint: "Pregledaj prošla natjecanja ili se pridruži kodom.",
        startsAt: "Počinje {{time}}",
        endsAt: "Završava {{time}}",
    },
    alerts: {
        title: "Obavijesti",
        older: "Prikaži starije",
        collapse: "Sažmi",
    },
    practice: {
        title: "Nastavi vježbati",
        all: "Svi zadaci",
        unfinished: "U tijeku",
        new: "Neriješeno",
        from: "iz natjecanja {{contest}}",
        fallback: "Pregledaj zadatke iz prošlih natjecanja i nastavi vježbati.",
    },
    activity: {
        title: "Tvoja aktivnost",
        summary:
            "Riješeno {{solved}} od {{total}} zadataka · predaje {{submissions}} · {{rate}} prihvaćeno",
        summaryEmpty: "Još nema predaja. Prva će se pojaviti ovdje.",
    },
};
