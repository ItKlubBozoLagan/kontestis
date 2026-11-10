import type { Translation } from "../../types";
import type { oauth as enOauth } from "../en/oauth";

export const oauth: Translation<typeof enOauth> = {
    authorize: {
        title: "Prijava putem Kontestisa",
        description: "Nastaviti u <b>{{client}}</b> s ovim računom?",
        continue: "Nastavi",
        cancel: "Odustani",
        switchAccount: "Koristi drugi račun",
        invalidTitle: "Neispravna poveznica za prijavu",
        invalidDescription: "Ova aplikacija nije prepoznata. Vrati se i pokušaj ponovno.",
    },
};
