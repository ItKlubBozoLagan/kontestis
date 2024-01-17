import { KnownUserData, MailPreference } from "@kontestis/models";
import { createTransport } from "nodemailer";

import { Globals } from "../globals";

const transporter = createTransport({
    host: Globals.emailHost,
    port: Globals.emailPort,
    secure: true,
    auth: {
        user: Globals.emailNotifierAccountMail,
        pass: Globals.emailNotifierAccountPassword,
    },
});

export const sendMail = async (
    user: KnownUserData,
    subject: string,
    text: string,
    mailPreferences: MailPreference,
    debugMode: boolean = true
) => {
    subject = subject.replaceAll("{user}", user.full_name);
    text = text.replaceAll("{user}", user.full_name);

    await transporter.sendMail({
        from: `${Globals.emailNotifierAccountDisplayName} <${Globals.emailNotifierAccountMail}>`,
        to: debugMode ? Globals.emailNotifierAccountMail : user.email,
        subject: subject,
        // TODO: Make this configurable
        text:
            `Ovu obavijest primate jer imate račun na platformi Kontestis:
            U slučaju da neželite više primati daljnje obavijesti: ${Globals.emailSettingsBaseURL}/api/notifications/mail/modify/${mailPreferences.code}/none
            Ako želite primati jedino obavijesti o nadolazečim natjecanjima: ${Globals.emailSettingsBaseURL}/api/notifications/mail/modify/${mailPreferences.code}/contest-only
            ` + text,

        html: `
            <p>
              Ovu obavijest primate jer imate račun na platformi Kontestis: <br/>
              U slučaju da neželite više primati daljnje obavijesti: <a href="${
                  Globals.emailSettingsBaseURL
              }/api/notifications/mail/modify/${mailPreferences.code}/none">Unsubscibe</a> </br>
              Ako želite primati jedino obavijesti o nadolazečim natjecanjima: <a href="${
                  Globals.emailSettingsBaseURL
              }/api/notifications/mail/modify/${
            mailPreferences.code
        }/contest-only">Unsubscibe Secondary</a> </br>
            </p>
            <br/>
            <div>
              <p>${text.replaceAll("\n", "<br/>")}</p>
            </div>
        `,
    });
};
