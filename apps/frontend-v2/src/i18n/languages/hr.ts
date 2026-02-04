import { LanguageSpec } from "../i18n";

const I18nHr: LanguageSpec = {
    backendErrors: {
        unavailable: {
            header: "Ispričavamo se",
            description: "Čini se da imamo problema.",
        },
        rateLimit: {
            header: "Usporite!",
            description: "Šaljete previše zahtjeva.",
        },
    },
    login: {
        label: "Prijavi se",
        logout: "Odjavi se",
        siteRestriction: "Prijava je trenutno ograničena na %1 i %2 račune",
    },
    register: {
        label: "Registriraj se",
        fullName: "Puno ime",
        email: "Email",
        password: "Lozinka",
        confirmPassword: "Potvrdite lozinku",
        haveAccount: "Već imate račun?",
    },
    navbar: {
        dashboard: "Početna",
        contests: "Natjecanja",
        problems: "Zadaci",
        submissions: "Predaje",
        account: "Račun",
        management: "Upravljanje",
        admin: "Admin",
        alerts: {
            noContentMessage: "Nemate novih obavijesti!",
            breadcrumbs: {
                official: "Službeno",
            },
            overflow: {
                expand: "Proširi",
                collapse: "Sažmi",
            },
        },
    },
    theme: {
        light: "Svijetla",
        dark: "Tamna",
        system: "Sustav",
    },
    aaieduButton: {
        purposeLink: "Poveži",
    },
    notifications: {
        "contest-start": "Natjecanje %1 je počelo!",
        "contest-end": "Natjecanje %1 je završilo!",
        "new-question": "Novo pitanje je postavljeno u %1",
        "new-announcement": "Nova objava u %1",
        "question-answer": "Vaše pitanje je odgovoreno u %1",
        alert: " %1",
    },
    contestJoin: {
        buttonText: "Pridruži se natjecanju putem koda",
        submitText: "Pridruži se",
        inputTitle: "Kod",
    },
    helper: {
        tableNoContents: "Nema zapisa",
        shortWeekDayNames: "Pon,Uto,Sri,Čet,Pet,Sub,Ned",
        shortMonthNames: "Sij,Velj,Ožu,Tra,Svi,Lip,Srp,Kol,Ruj,Lis,Stu,Pro",
    },
    dashboard: {
        basicInfo: {
            title: "Osnovne informacije",
            contests: "Ukupno natjecanja",
            problems: "Ukupno zadataka",
            submissions: "Ukupno rješenja",
        },
        activity: {
            title: "Vaša aktivnost",
        },
        alerts: {
            title: "Obavijesti",
            none: "Nema obavijesti!",
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
                    started: "Počelo",
                },
                registered: {
                    notRegistered: "Registriraj se",
                    registered: "Registriran",
                },
            },
        },
        page: {
            exams: "Ispiti",
            official: "Natjecanja",
            unofficial: "Neslužbena natjecanja",
            loading: "Učitavam",
            searchPlaceholder: "Pretraži natjecanja...",
            noOfficialContests: "Nema službenih natjecanja",
            noOfficialContestsFiltered: "Nema pronađenih službenih natjecanja",
            noUnofficialContests: "Nema neslužbenih natjecanja",
            noUnofficialContestsFiltered: "Nema pronađenih neslužbenih natjecanja",
        },
        individual: {
            problems_table: {
                problem: "Zadatak",
                examProblem: "Zadatak",
                score: "Bodovi",
            },
            leaderboard: {
                running: "Poredak uživo",
                finished: "Konačni poredak",
                table: {
                    contestant: "Natjecatelj",
                    total: "Ukupno",
                },
                disabled: "Poredak je trenutno onemogućen",
                emptyMessage: "Iznenađujuće prazno ovdje",
            },
            announcements: {
                label: "Objave",
                empty: "Još nema objava.",
            },
            questions: {
                label: "Pitanja",
                ask: "Postavi pitanje",
                sendButton: "Pošalji",
                list: {
                    waiting: "Čekam odgovor!",
                    all: "Prikaži starije",
                    collapse: "Sažmi",
                },
            },
        },
        management: {
            label: "Vaša natjecanja",
            createButton: "Kreiraj novo",
            modal: {
                label: "Informacije o natjecanju",
                createButton: "Kreiraj",
            },
        },
    },
    problems: {
        table: {
            head: {
                status: "Status",
                name: "Naziv",
                contestName: "Naziv natjecanja",
                added: "Dodano",
                score: "Bodovi",
                tags: "Oznake",
            },
            body: {
                noTags: "Nema",
            },
        },
        page: {
            title: "Zadaci",
            searchPlaceholder: "Pretraži zadatke...",
            filters: {
                allTags: "Sve oznake",
                allRatings: "Sve težine",
                clearFilters: "Očisti filtere",
            },
            noProblems: "Nema pronađenih zadataka",
            noProblemsFiltered: "Pokušajte prilagoditi filtere",
            noProblemsEmpty: "Provjerite kasnije za nove zadatke",
        },
        individual: {
            loading: "Učitavam...",
            description: "Tekst zadatka",
            submissions: "Rješenja",
            limits: {
                title: "Ograničenja",
                time: "Vrijeme",
                memory: "Memorija",
                sourceSize: "Veličina koda",
                points: "Bodovi",
            },
            submit: {
                title: "Predaj",
                code: "Kod",
                submitButton: "Predaj",
            },
        },
    },
    submissions: {
        empty: "Još nema rješenja :(",
        loading: "Učitavam rješenja...",
        processing: "Obrađujem%1",
        historyDescription: "Vaša povijest predaja za ovaj zadatak",
        table: {
            head: {
                user: "Korisnik",
                verdict: "Rezultat",
                time: "Vrijeme",
                memory: "Memorija",
                language: "Jezik",
                points: "Bodovi",
                final: "Konačno",
                submitted: "Predano",
                cluster: "Klaster",
                sample: "Primjer",
                testcase: "Testni slučaj",
                samples: "Primjeri",
            },
            body: {
                final: "Konačno",
                notFinal: "Postavi konačno",
                notExam: "Nije predano",
                pointsAchieved: " %1 bodova",
                clusterIndex: "Klaster %1",
                sampleIndex: "Primjer %1",
                testcaseIndex: "Testni slučaj %1",
            },
            overflow: {
                expand: "Proširi",
                collapse: "Sažmi",
            },
        },
        individual: {
            backToProblem: "Natrag na zadatak",
            title: "Predaja",
            sourceCode: "Izvorni kod",
            copied: "Kopirano!",
            copyCode: "Kopiraj kod",
            samples: "Primjeri",
            clusters: "Klasteri",
            compileError: "Greška kompilacije",
        },
    },
    account: {
        label: "Informacije o računu",
        profile: "Profil",
        fullName: "Ime i prezime",
        email: "E-pošta",
        statistics: "Statistika",
        elo: "ELO Rejting",
        permissions: "Dozvole",
        logout: "Odjava",
        breadcrumbs: {
            creator: "Kreator",
            admin: "Admin",
            organisationAdmin: "Org. Admin",
            owner: "Vlasnik",
        },
        aaiedu: {
            title: "Povezani AAI@Edu račun",
            userId: "Korisnički ID",
            fullName: "Ime i prezime",
            email: "E-pošta",
            associatedOrg: "Pripadajuća organizacija",
            dob: "Datum rođenja",
            studentCategory: "Kategorija studenta",
            professionalStatus: "Profesionalni status",
        },
        stats: {
            submissions: {
                title: "Rješenja",
                toggles: {
                    showAccepted: "prikaži prihvaćene",
                    showRandom: "nasumični podaci",
                },
                total: "Ukupno",
                hover: {
                    oneSubmission: "Rješenje na",
                    fewSubmissions: "Rješenja na",
                    moreSubmissions: "Rješenja na",
                },
            },
            elo: {
                title: "Elo",
            },
        },
    },
    organisations: {
        selectDescription: "Odaberite organizaciju za nastavak",
        yourOrganisations: "Vaše organizacije",
        allOrganisations: "Sve organizacije",
        page: {
            title: "Organizacije",
            createButton: "Kreiraj organizaciju",
            table: {
                name: "Naziv",
                details: "Detalji",
            },
            modal: {
                title: "Kreiraj novu organizaciju",
                name: "Naziv",
                createButton: "Kreiraj",
            },
        },
        management: {
            backButton: "Natrag",
            title: "Organizacija » %1",
            info: {
                title: "Info",
                name: "Naziv",
            },
            members: {
                add: {
                    label: "Dodaj člana",
                    addButton: "Dodaj",
                    placeholder: "primjer@skole.hr",
                    errorMessages: {
                        invalid: "Nevažeća email adresa",
                        double: "Korisnik ne postoji ili je već član",
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
        title: "Administratorsko područje",
        routes: {
            overview: "Pregled",
            users: "Korisnici",
            alerts: "Obavijesti",
            contests: "Natjecanja",
            organizations: "Organizacije",
            mail: "Pošta",
        },
        overview: {
            charts: {
                activityLabel: "Aktivnost",
                loginLabel: "Prijave",
                loginToggleNewUsers: "novi korisnici",
                loginToggleUnique: "jedinstveni",
            },
            alerts: {
                label: "Obavijest",
                pushButton: "Objavi",
            },
        },
        users: {
            title: "Korisnici",
            editPermission: "Uredi dozvole",
        },
    },
    permissions: {
        contest_member: {
            ADMIN: "Admin",
            VIEW_PRIVATE: "Pregledaj (admin)",
            ADD_USER: "Dodaj korisnika",
            EDIT_USER_PERMISSIONS: "Uredi korisničke dozvole",
            ANSWER_QUESTIONS: "Odgovori na pitanja",
            VIEW: "Pregledaj",
            EDIT: "Uredi",
            REMOVE_USER: "Ukloni korisnika",
            VIEW_QUESTIONS: "Pregledaj pitanja",
            CREATE_ANNOUNCEMENT: "Kreiraj objave",
        },
        admin: {
            ADMIN: "Admin",
            VIEW_USER: "Pregledaj korisnika",
            EDIT_USER: "Uredi korisnika",
            DELETE_USER: "Obriši korisnika",
            ADD_CONTEST: "Dodaj natjecanje",
            VIEW_CONTEST: "Pregledaj natjecanje",
            EDIT_CONTEST: "Uredi natjecanje",
            DELETE_CONTEST: "Obriši natjecanje",
            ADD_ALERTS: "Dodaj obavijesti",
            EDIT_ALERTS: "Uredi obavijesti",
            DELETE_ALERTS: "Obriši obavijesti",
            VIEW_ORGANISATIONS: "Pregledaj organizacije",
            EDIT_ORGANISATIONS: "Uredi organizacije",
            DELETE_ORGANISATIONS: "Obriši organizacije",
        },
        organisation_member: {
            ADMIN: "Admin",
            VIEW: "Pregledaj",
            VIEW_USER: "Pregledaj korisnika",
            EDIT_USER: "Uredi korisnika",
            DELETE_USER: "Obriši korisnika",
            ADD_CONTEST: "Dodaj natjecanje",
            VIEW_CONTEST: "Pregledaj natjecanje",
            EDIT_CONTEST: "Uredi natjecanje",
            DELETE_CONTEST: "Obriši natjecanje",
            ADD_ALERTS: "Dodaj obavijesti",
            EDIT_ALERTS: "Uredi obavijesti",
            DELETE_ALERTS: "Obriši obavijesti",
        },
    },
    errorMessages: {
        invalid: "Greška pri provjeri! Provjerite unos!",
        withInfo: "Greška! %1",
    },
};

export default I18nHr;
