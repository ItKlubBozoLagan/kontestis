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
        logout: "Odjava",
        siteRestriction: "Prijava je trenutno dostupna samo za %1 i %2 račune",
    },
    navbar: {
        dashboard: "Kontrolna ploča",
        contests: "Natjecanja",
        problems: "Zadatci",
        account: "Račun",
        management: "Upravljanje",
        admin: "Admin",
        alerts: {
            noContentMessage: "U tijeku ste sa svime!",
            breadcrumbs: {
                official: "Službeno",
            },
            overflow: {
                expand: "Proširi",
                collapse: "Sažmi",
            },
        },
    },
    notifications: {
        "contest-start": "Natjecanje %1 je počelo!",
        "contest-end": "Natjecanje %1 je završilo!",
        "new-question": "Novo pitanje je postavljeno u %1",
        "new-announcement": "Stigla je nova obavijest u %1",
        "question-answer": "Vaše pitanje je odgovoreno u %1",
        // must begin with a space, Translated component currently
        //  has a bug where it doesn't handle messages beginning with a placeholder
        alert: " %1",
    },
    helper: {
        tableNoContents: "Nema ničega za sada",
        shortWeekDayNames: "Pon,Uto,Sri,Čet,Pet,Sub,Ned",
        shortMonthNames: "Sij,Velj,Ožu,Tra,Svi,Lip,Srp,Kol,Ruj,Lis,Stu,Pro",
    },
    dashboard: {
        basicInfo: {
            title: "Osnovne informacije",
            contests: "Ukupno natjecanja",
            problems: "Ukupno problema",
            submissions: "Ukupno rješenja",
        },
        activity: {
            title: "Vaša aktivnost",
        },
        alerts: {
            title: "Obavijesti",
            none: "Nema za sada!",
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
                problem: "Problem",
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
                    waiting: "Čekanje odgovora!",
                    all: "prikaži starije",
                    collapse: "Sažmi",
                },
            },
        },
        management: {
            label: "Vaša natjecanja",
            createButton: "Stvori novo",
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
                        title: "Statistika",
                        registeredParticipants: "Registrirani sudionici",
                        announcements: "Obavijesti",
                        unansweredQuestions: "Neodgovorena pitanja",
                    },
                    clone: {
                        title: "Kloniranje",
                        cloneButton: "Kloniraj",
                        inOrganisation: "u organizaciju",
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
                        evaluationVariant: {
                            label: "Varijanta evaluacije",
                            plain: "Obično",
                            checker: "Skripta za provjeru",
                            checkers: {
                                standard: "Standardan",
                                interactive: "Interaktivni",
                            },
                        },
                        evaluationLanguage: "Jezik evaluacijske skripte",
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
                            evaluationVariant: {
                                label: "Varijanta evaluacije",
                                plain: "Obično",
                                checker: "Skripta za provjeru",
                                checkers: {
                                    standard: "Standardan",
                                    interactive: "Interaktivni",
                                },
                            },
                            evaluationScript: "Skripta za evaluaciju (u Pythonu)",
                            solutionLanguage: "Jezik rješenja",
                            solutionCode: "Kod rješenja",
                            tags: "Oznake",
                            score: "Bodovi",
                            empty: "Nema",
                        },
                    },
                    cluster: {
                        createButton: "Stvori klaster",
                        info: {
                            title: "Info",
                            score: "Bodovi",
                            generator: {
                                label: "Generator",
                                plain: "Obican",
                                generator: "Generator",
                                status: {
                                    title: "Status",
                                    cached: "Spremno (u predmemoriji)",
                                    uncached: "Spremno (nije u predmemoriji)",
                                    errors: {
                                        generator: "Greška generatora",
                                        solution: "Greška rješenja",
                                    },
                                    pending: "U tijeku",
                                },
                                dropCache: "Izbriši predmemoriju",
                                generate: "Generiraj",
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
                    permissions: {
                        editButton: "Uredi dozvole",
                        modal: {
                            title: "Dozvole",
                            saveButton: "Spremi",
                        },
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
                            reviewed: "Pregledano",
                            exports: "Izvoz",
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
            body: {
                noTags: "Nema",
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
                final: "Finalno",
                cluster: "Klaster",
                testcase: "Test podatak",
            },
            body: {
                final: "Konačno",
                notFinal: "Postavi kao konačno",
                notExam: "Nije predano",
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
        stats: {
            submissions: {
                title: "Poslana rješenja",
                toggles: {
                    showAccepted: "prikaži točna",
                    showRandom: "nasumično",
                },
                total: "Ukupno",
                hover: {
                    oneSubmission: "Poslano rješenje, ",
                    fewSubmissions: "Poslana rješenja, ",
                    moreSubmissions: "Poslanih rješenja, ",
                },
            },
            elo: {
                title: "Elo",
            },
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
    admin: {
        title: "Administracija",
        routes: {
            overview: "Pregled",
            users: "Korisnici",
            alerts: "Obavijesti",
            contests: "Natjecanja",
            organizations: "Organizacije",
        },
        overview: {
            charts: {
                activityLabel: "Aktivnost",
                loginLabel: "Prijave",
                loginToggleNewUsers: "nove",
                loginToggleUnique: "unikatne",
            },
            metrics: {
                rawSystem: {
                    title: "Server",
                    memory: "Memorija",
                    hostname: "Ime hosta",
                    operatingSystem: "Operativni sustav",
                },
                kubernetes: {
                    memory: "Memorija",
                    datasets: {
                        kontestis: "Kontestis",
                        cluster: "Klaster",
                    },
                    nodes: {
                        title: "Čvorovi",
                        stats: {
                            memory: "Memorija",
                        },
                    },
                    pods: {
                        title: "Razmjer aplikacije",
                        label: "Čahure",
                    },
                },
            },
            alerts: {
                label: "Obavijest",
                pushButton: "Objavi",
            },
            contests: {
                message:
                    "Administratori mogu upravljati natjecanjima putem stranice za upravljanje",
                goToMangement: "Odvedi me na stranicu za upravljanje",
            },
        },
        users: {
            title: "Korisnici",
            editPermission: "Uredi dozvole",
        },
    },
    permissions: {
        contest_member: {
            ADMIN: "Administrator",
            VIEW_PRIVATE: "Pregled (admin)",
            ADD_USER: "Dodavanje korisnika",
            EDIT_USER_PERMISSIONS: "Uređivanje dozvola",
            ANSWER_QUESTIONS: "Odgovaranje pitanja",
            VIEW: "Pregled",
            EDIT: "Uređivanje",
            REMOVE_USER: "Brisanje korisnika",
            VIEW_QUESTIONS: "Pregled pitanja",
            CREATE_ANNOUNCEMENT: "Kreiranje obavjesti",
        },
        admin: {
            ADMIN: "Admin",
            VIEW_USER: "Pregled korisnika",
            EDIT_USER: "Uređivanje korisnika",
            DELETE_USER: "Brisanje korisnika",
            ADD_CONTEST: "Dodavanje natjecanja",
            VIEW_CONTEST: "Pregled natjecanja",
            EDIT_CONTEST: "Uređivanje natjecanja",
            DELETE_CONTEST: "Brisanje natjecanja",
            ADD_ALERTS: "Dodavanje obavjesti",
            EDIT_ALERTS: "Uređivanje obavjesti",
            DELETE_ALERTS: "Brisanje obavjesti",
            VIEW_ORGANISATIONS: "Pregled organizacija",
            EDIT_ORGANISATIONS: "Uređivanje organizacija",
            DELETE_ORGANISATIONS: "Brisanje organizacija",
        },
    },
    errorMessages: {
        invalid: "Greška pri validaciji! Provjerite unos!",
        withInfo: "Greška! %1",
    },
} as const satisfies DefaultLanguageSpec;
