import type { Translation } from "../../types";
import type { auth as enAuth } from "../en/auth";

export const auth: Translation<typeof enAuth> = {
    login: {
        title: "Prijava",
        subtitle: "Dobrodošli natrag na Kontestis",
        withEmail: "Prijava e-mailom",
        withSso: "Prijava putem SSO-a",
        or: "ili",
        submit: "Prijavi se",
        noAccount: "Nemaš račun?",
        register: "Registriraj se",
        temporary: "Prijava privremenim korisnikom",
        registered: "Registracija uspješna! Potvrdi e-mail prije prijave.",
        confirmed: "E-mail potvrđen, sada se možeš prijaviti!",
        verificationResent: "E-mail nije potvrđen! Poslali smo ti novu poveznicu za potvrdu.",
        errors: {
            invalid: "Neispravan e-mail ili lozinka",
            captcha: "Captcha nije uspjela!",
            unverified: "E-mail nije potvrđen, provjeri pretinac.",
            generic: "Nešto je pošlo po krivu",
            captchaUnavailable: "Captcha se nije uspjela učitati",
        },
    },
    register: {
        title: "Registracija",
        subtitle: "Stvori Kontestis račun",
        fullName: "Ime i prezime",
        submit: "Stvori račun",
        haveAccount: "Već imaš račun?",
        login: "Prijavi se",
        errors: {
            conflict: "E-mail je već u upotrebi",
        },
    },
    temporary: {
        title: "Prijava privremenog korisnika",
        subtitle: "Koristi podatke koje si dobio od organizatora natjecanja.",
        username: "Korisničko ime",
        back: "Natrag na glavnu prijavu",
        invalid: "Neispravno korisničko ime ili lozinka",
    },
    aai: {
        linking: "Povezivanje AAI@EduHr računa…",
        loggingIn: "Prijava putem AAI@EduHr…",
        failed: "AAI@EduHr autentikacija nije uspjela.",
        link: "Poveži",
    },
    fields: {
        email: "E-mail",
        password: "Lozinka",
    },
};
