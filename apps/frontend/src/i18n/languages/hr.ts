import { DefaultLanguageSpec } from "../i18n";

export default {
    login: {
        siteRestriction: "Prijava je trenutno dostupna samo za %1 računa",
    },
    navbar: {
        dashboard: "Kontrolna ploča",
        contests: "Natjecanja",
        problems: "Zadaci",
        account: "Račun",
        management: "Upravljanje",
    },
    dashboard: {
        total: {
            contests: "Ukupno natjecanja",
            problems: "Ukupno zadataka",
            submissions: "Ukupno rješenja",
        },
    },
    contests: {
        page: {
            exams: "Ispiti",
            official: "Službena natjecanja",
            unofficial: "Neslužbena natjecanja",
            table: {
                head: {
                    name: "Naziv",
                    startTime: "Početak",
                    starts: {
                        label: "Počinje",
                    },
                    duration: "Trajanje",
                    partaking: "Sudjelovanje",
                },
                body: {
                    starts: {
                        finished: "Završeno",
                        started: "Započeto",
                    },
                },
            },
        },
        individual: {
            problems_table: {
                problem: "Zadatak",
                examProblem: "Zadatak ispita",
                score: "Bodovi",
            },
            leaderboard: {
                running: "Trenutni poredak",
                finished: "Konačni poredak",
                table: {
                    contestant: "Natjecatelj",
                },
            },
            announcements: {
                label: "Obavijesti",
            },
            questions: {
                label: "Pitanja",
                ask: "Postavi pitanje:",
                sendButton: "Pošalji",
            },
        },
        management: {
            label: "Vaša natjecanja",
            individual: {
                overview: {
                    label: "Pregled",
                    status: {
                        label: "Status",
                        pending: "Počinje za %1",
                        running: "Trenutno traje: %1",
                        finished: "Završeno",
                    },
                    info: {
                        label: "Informacije o natjecanju",
                        name: "Naziv",
                        startTime: "Početak",
                        duration: "Trajanje",
                        visibility: {
                            label: "Vidljivost",
                            private: "Privatno",
                            public: "Javno",
                        },
                        scoring: {
                            label: "Bodovanje",
                            official: "Službeno",
                            unofficial: "Neslužbeno",
                        },
                        style: {
                            label: "Stil",
                            contest: "Natjecanje",
                            exam: "Ispit",
                        },
                        errorMessage: {
                            invalid: "Greška pri validaciji! Provjerite unos.",
                        },
                        createButton: "Kreiraj",
                    },
                    statistics: {
                        label: "Statistika",
                        registeredParticipants: "Registrirani sudionici",
                        announcements: "Obavijesti",
                        unansweredQuestions: "Neodgovorena pitanja",
                    },
                },
                problems: {
                    createButton: "Kreiraj novi",
                    table: {
                        head: {
                            name: "Naziv",
                            score: "Bodovi",
                            users: "Korisnici",
                            solves: "Rješenja",
                        },
                    },
                },
            },
        },
    },
} as const satisfies DefaultLanguageSpec;
