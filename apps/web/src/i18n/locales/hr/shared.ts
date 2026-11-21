import type { Translation } from "../../types";
import type * as en from "../en/shared";

export const ranks: Translation<typeof en.ranks> = {
    rookie: "Početnik",
    apprentice: "Šegrt",
    journeyman: "Kalfa",
    proficient: "Vješt",
    phenom: "Fenomen",
    maestro: "Maestro",
    prodigy: "Čudo",
};

export const verdicts: Translation<typeof en.verdicts> = {
    accepted: "Prihvaćeno",
    wrong_answer: "Krivi odgovor",
    time_limit_exceeded: "Prekoračeno vrijeme",
    memory_limit_exceeded: "Prekoračena memorija",
    runtime_error: "Greška pri izvršavanju",
    compilation_error: "Greška pri kompajliranju",
    evaluation_error: "Greška evaluacije",
    system_error: "Sistemska greška",
    skipped: "Preskočeno",
    custom: "Posebno",
    pending: "Evaluira se…",
};

export const phases: Translation<typeof en.phases> = {
    upcoming: "Nadolazeće",
    running: "U tijeku",
    finished: "Završeno",
    startsIn: "Počinje za {{time}}",
    endsIn: "Završava za {{time}}",
    endedAgo: "Završeno",
};

export const programmingLanguages: Translation<typeof en.programmingLanguages> = {
    "output-only": "Samo izlaz",
    gnu_asm_x86_linux: "x86 asembler (GNU)",
};

export const evaluationVariants: Translation<typeof en.evaluationVariants> = {
    plain: "Obično",
    checker: "Provjerivač",
    interactive: "Interaktivno",
    "output-only": "Samo izlaz",
};

export const permissions: Translation<typeof en.permissions> = {
    title: "Ovlasti",
    description: "Odaberi što {{name}} smije raditi.",
    admin: "Admin uključuje sve ostale ovlasti.",
    names: {
        ADMIN: "Admin",
        VIEW_USER: "Pregled korisnika",
        EDIT_USER: "Uređivanje korisnika",
        DELETE_USER: "Brisanje korisnika",
        ADD_CONTEST: "Dodavanje natjecanja",
        VIEW_CONTEST: "Pregled natjecanja",
        EDIT_CONTEST: "Uređivanje natjecanja",
        DELETE_CONTEST: "Brisanje natjecanja",
        ADD_ALERTS: "Dodavanje obavijesti",
        EDIT_ALERTS: "Uređivanje obavijesti",
        DELETE_ALERTS: "Brisanje obavijesti",
        VIEW_ORGANISATIONS: "Pregled organizacija",
        EDIT_ORGANISATIONS: "Uređivanje organizacija",
        DELETE_ORGANISATIONS: "Brisanje organizacija",
        VIEW: "Pregled",
        VIEW_PRIVATE: "Pregled privatnih podataka",
        EDIT: "Uređivanje",
        ADD_USER: "Dodavanje sudionika",
        REMOVE_USER: "Uklanjanje sudionika",
        EDIT_USER_PERMISSIONS: "Uređivanje ovlasti sudionika",
        VIEW_QUESTIONS: "Pregled pitanja",
        ANSWER_QUESTIONS: "Odgovaranje na pitanja",
        CREATE_ANNOUNCEMENT: "Stvaranje obavijesti",
    },
};

export const joinContest: Translation<typeof en.joinContest> = {
    button: "Pridruži se natjecanju",
    title: "Pridruživanje natjecanju",
    description: "Upiši kod koji si dobio od organizatora natjecanja.",
    code: "Kod za pridruživanje",
    submit: "Pridruži se",
    invalid: "Neispravan ili istekao kod",
    length: "Kod ima 16 znakova",
};

export const thread: Translation<typeof en.thread> = {
    you: "Ti",
    staff: "Organizatori",
    unknown: "Nepoznati član",
    placeholder: "Napiši poruku…",
    send: "Pošalji",
    reply: "Odgovori",
    empty: "Još nema poruka.",
    hint: "Ctrl + Enter za slanje",
};

export const activity: Translation<typeof en.activity> = {
    title: "Predaje",
    acceptedOnly: "Samo prihvaćene",
    total: "{{count}} predaja u zadnjih godinu dana",
    day: "{{count}} predaja na dan {{date}}",
    less: "Manje",
    more: "Više",
};
