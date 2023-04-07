import { DefaultLanguageSpec } from "../i18n";

export default {
    backendErrors: {
        unavailable: {
            header: "Isprike",
            description: "Naši sustavi trenutno ne funkcioniraju kako bi trebali.",
        },
        rateLimit: {
            header: "Uspori!",
            description: "Pre brzo mijenjaš stvari.",
        },
    },
    login: {
        label: "Prijava",
        siteRestriction: "Prijava je trenutno dostupna samo za %1 i %2 račune",
    },
    navbar: {
        dashboard: "Kontrolna ploča",
        contests: "Natjecanja",
        problems: "Zadatci",
        account: "Račun",
        management: "Upravljanje",
        admin: "Admin",
    },
    dashboard: {
        total: {
            contests: "Ukupno natjecanja",
            problems: "Ukupno zadataka",
            submissions: "Ukupno rješenja",
        },
    },
    contests: {
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
                registered: {
                    notRegistered: "Registriraj se",
                    registered: "Registriran",
                },
            },
        },
        page: {
            exams: "Ispiti",
            official: "Službena natjecanja",
            unofficial: "Neslužbena natjecanja",
            loading: "Učitavam",
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
                    total: "Ukupno bodova",
                },
                emptyMessage: "Iznenađujuće, bodovna lista je prazna",
            },
            announcements: {
                label: "Obavijesti",
                empty: "Nema obavjesti za sada.",
            },
            questions: {
                label: "Pitanja",
                ask: "Postavi pitanje",
                sendButton: "Pošalji",
                list: {
                    preMessage: "Čekanje odgovora!",
                    all: "prikaži starije",
                    collapse: "Sažmi",
                },
            },
        },
        management: {
            label: "Vaša natjecanja",
            createButton: "Stvori novo",
            noContests: "Nema ničega za sada",
            modal: {
                label: "Stvori natjecanje",
                createButton: "Stvori",
            },
            individual: {
                title: "Natjecanje » %1",
                routes: {
                    overview: "Pregled",
                    problems: "Problemi",
                    announcements: "Obavijesti",
                    questions: "Pitanja",
                    participants: "Sudionici",
                    results: "Rezultati",
                },
                overview: {
                    status: {
                        label: "Status",
                        pending: "Počinje za",
                        running: "U tijeku",
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
                            solves: "Rješenost",
                        },
                    },
                    createModal: {
                        title: "Postavi problem za %1",
                        name: "Ime",
                        statement: "Opis problema",
                        timeLimit: "Vremensko ograničenje",
                        memoryLimit: "Memorijsko ograničenje",
                        evaluationScript: "Evaluacijska skripta (opcionalna)",
                        solutionLanguage: "Jezik rješenja",
                        solutionCode: "Kod rješenja",
                        createButton: "Postavi",
                    },
                    individual: {
                        info: {
                            label: "Informacije",
                            name: "Naziv",
                            description: "Opis",
                            timeLimit: "Vremensko ograničenje",
                            memoryLimit: "Ograničenje memorije",
                            evaluationScript: "Skripta za evaluaciju (u Pythonu)",
                            solutionLanguage: "Jezik rješenja",
                            solutionCode: "Kod rješenja",
                            score: "Bodovi",
                            empty: "Nema",
                        },
                    },
                    cluster: {
                        createButton: "Stvori klaster",
                        info: {
                            title: "info",
                            score: "Bodovi",
                            generator: {
                                label: "Generator",
                                plain: "Obican",
                                generator: "Generator",
                            },
                            generator_language: "Jezik generatora",
                            generator_code: "Kod generatora",
                        },
                        table: {
                            head: {
                                cluster: "Klaster",
                                awardedScore: "Dodijeljeni bodovi",
                            },
                            body: {
                                clusterIndex: "Grupa %1",
                            },
                        },
                        modal: {
                            title: "Dodaj klaster za %1",
                            awardedScore: "Dodjeljeni bodovi",
                            createButton: "Dodaj",
                        },
                        testCase: {
                            input: "Ulaz",
                            output: "Točan izlaz",
                            info: "info",
                            createButton: "Create testcase",
                            table: {
                                head: {
                                    testCase: "Test podatak",
                                },
                                body: {
                                    testCase: "Test podatak %1",
                                },
                            },
                            modal: {
                                CreateButton: "Dodaj",
                            },
                        },
                    },
                },
                announcements: {
                    label: "Obavijest",
                    sendButton: "Pošalji",
                },
                questions: {
                    empty: "Nema pitanja za sada",
                    answerButton: "Odgovori",
                    unAnswered: {
                        label: "Nije odgovoreno",
                    },
                    answered: {
                        label: "Odgovoreno",
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
                    remove: {
                        proposeRemoval: "Ukloni",
                        confirm: "Potvrdi",
                    },
                },
                results: {
                    gradingScale: {
                        title: "Ljestvica za ocijenjivanje",
                        createButton: "Kreiraj ljestvicu za ocjenjivanje",
                        listItem: {
                            grade: "Ocjena",
                            percentage: "Postotak",
                        },
                    },
                    createModal: {
                        title: "Kreiraj ljestvicu za ocijenjivanje za %1",
                        percentage: "Postotak",
                        grade: "Ocjena",
                        createButton: "Kreiraj",
                    },
                    table: {
                        head: {
                            user: "Korsinik",
                            points: "Bodovi",
                            exports: "izvoz",
                        },
                    },
                },
            },
        },
    },
    problems: {
        table: {
            head: {
                name: "Naziv",
                contestName: "Naziv natjecanja",
                added: "Vrijeme dodavanja",
                score: "Bodovi",
                tags: "Tagovi",
            },
        },
        page: {
            title: "Problemi",
        },
        individual: {
            loading: "Učitavanje...",
            limits: {
                title: "Ograničenja",
                time: "Vremensko",
                memory: "Memorijsko",
                sourceSize: "Veličina programa",
                points: "Bodovi",
            },
            submit: {
                title: "Slanje rješenja",
                code: "Kod",
                submitButton: "Pošalji",
            },
        },
    },
    submissions: {
        empty: "Još nema poslanih rješenja :(",
        loading: "Učitavam poslana rješenja...",
        processing: "Obrađujem...",
        table: {
            head: {
                user: "Korsinik",
                verdict: "Ishod",
                time: "Vrijeme",
                memory: "Memorija",
                language: "Jezik",
                points: "Bodovi",
                final: "Ukupno",
                cluster: "Klaster",
                testcase: "Test podatak",
            },
            body: {
                final: "Konačno",
                notFinal: "Postavi kao konačno",
                notExam: "Ingorirano",
                pointsAchieved: " %1 bodova",
                clusterIndex: "Klaster %1",
                testcaseIndex: "Test podatak %1",
            },
            overflow: {
                expand: "Proširi",
                collapse: "Vrati",
            },
        },
    },
    account: {
        label: "Informacije računa",
        fullName: "Ime i prezime",
        email: "E-pošta",
        breadcrumbs: {
            creator: "Tvorac",
            admin: "Administrator",
            owner: "Vlasnik",
        },
    },
    organisations: {
        page: {
            title: "Organizacije",
            createButton: "Napravi organizaciju",
            table: {
                name: "Ime",
                details: "Detalji",
            },
            modal: {
                title: "Stvori novu organizaciju",
                name: "Ime",
                createButton: "Stvori",
            },
        },
        management: {
            backButton: "Nazad",
            title: "Organizacija » %1",
            info: {
                title: "Info",
                name: "Ime",
            },
            members: {
                add: {
                    label: "Dodaj člana",
                    addButton: "Dodaj",
                    placeholder: "primjer@skole.hr",
                    errorMessages: {
                        invalid: "Neispravna adresa e-pošte",
                        double: "Korisnik ne postoji ili je već učlanjen",
                    },
                },
                remove: {
                    proposeRemoval: "Ukloni",
                    confirm: "Potvrdi",
                },
            },
        },
    },
    errorMessages: {
        invalid: "Greška pri validaciji! Provjerite unos!",
        withInfo: "Greška! %1",
    },
} as const satisfies DefaultLanguageSpec;
