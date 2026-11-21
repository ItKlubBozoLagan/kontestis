import type { Translation } from "../../types";
import type { problems as en } from "../en/problems";

export const problems: Translation<typeof en> = {
    page: {
        title: "Zadaci",
        description: "Svi zadaci s natjecanja koja vidiš u ovoj organizaciji.",
    },
    table: {
        name: "Naziv",
        contest: "Natjecanje",
        added: "Vrijeme dodavanja",
        score: "Bodovi",
        attempts: "Pokušaji",
        tags: "Tagovi",
        noTags: "Nema",
    },
    filters: {
        all: "Svi",
        solved: "Riješeni",
        unsolved: "Neriješeni",
        unattempted: "Nepokušani",
        tag: "Tag",
        anyTag: "Bilo koji tag",
    },
    stats: {
        total: "Zadaci",
        solved: "Riješeni",
        attempted: "Pokušani",
        points: "Bodovi",
    },
    individual: {
        backToContest: "Natrag na natjecanje",
        statement: "Tekst zadatka",
        limits: {
            title: "Ograničenja",
            time: "Vremensko",
            memory: "Memorijsko",
            sourceSize: "Veličina programa",
            points: "Bodovi",
            variant: "Evaluacija",
        },
        bestScore: "Tvoj najbolji",
        submit: {
            title: "Slanje rješenja",
            language: "Jezik",
            code: "Kod",
            output: "Izlaz",
            uploadFile: "Učitaj datoteku",
            submit: "Pošalji",
            submitted: "Poslano! Evaluiram tvoje rješenje…",
            empty: "Prvo napiši ili učitaj kod.",
            tooLarge: "Kod je veći od ograničenja od 64 KiB.",
            draftRestored: "Skica vraćena",
            clear: "Očisti",
            outputOnlyHint: "Ovo je zadatak samo s izlazom: pošalji sam izlaz, ne program.",
            finishedHint:
                "Natjecanje je završilo — rješenja se i dalje evaluiraju, ali se ne broje.",
            upcomingHint: "Natjecanje još nije počelo.",
            latest: "Zadnja rješenja",
            shortcut: "Ctrl + Enter za slanje",
        },
        submissions: {
            mine: "Tvoja rješenja",
            all: "Sva rješenja",
        },
    },
};
