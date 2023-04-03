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
                    createButton: "Stvori novi",
                    table: {
                        head: {
                            name: "Naziv",
                            score: "Bodovi",
                            users: "Korisnici",
                            solves: "Rješenja",
                        },
                    },
                    individual: {
                        info: {
                            label: "Informacije",
                            name: "Naziv",
                            description: "Opis",
                            timeLimit: "Vremensko ograničenje",
                            memoryLimit: "Ograničenje memorije",
                            evaluationScript: "Skripta za evaluaciju",
                            score: "Bodovi",
                        },
                    },
                    cluster: {
                        createButton: "Stvori grupu",
                        table: {
                            head: {
                                cluster: "Grupa",
                                awardedScore: "Dodijeljeni bodovi",
                            },
                        },
                    },
                    submissions: {
                        empty: "Još nema prijava :(",
                        table: {
                            head: {
                                user: "Korisnik",
                                verdict: "Verdict",
                                time: "Vrijeme",
                                memory: "Memorija",
                                language: "Jezik",
                                points: "Bodovi",
                            },
                        },
                    },
                },
                announcements: {
                    label: "Obavijest:",
                    sendButton: "Pošalji",
                },
                questions: {
                    empty: "Nema pitanja za sada",
                    unAnswered: {
                        label: "Nije odgovoreno",
                        answerButton: "Odgovori",
                    },
                    answered: {
                        label: "Odgovoreno",
                        answerButton: "Odgovori",
                    },
                },
                participants: {
                    addParticipant: {
                        label: "Dodaj sudionika",
                        addButton: "Dodaj",
                        placeholder: "primjer@skola.hr",
                        errorMessages: {
                            invalid: "Neispravna adresa e-pošte",
                            double: "Korisnik ne postoji ili je već sudionik",
                        },
                    },
                },
            },
        },
    },
    problems: {
        page: {
            title: "Problemi",
            table: {
                head: {
                    name: "Naziv",
                    contestName: "Naziv natjecanja",
                    added: "Vrijeme dodavanja",
                    score: "Bodovi",
                },
            },
        },
    },
    account: {
        label: "Informacije računa",
        fullName: "Puno ime",
        email: "E-pošta",
        breadcrumbs: {
            creator: "Tvorac",
            admin: "Administrator",
        },
    },
} as const satisfies DefaultLanguageSpec;
