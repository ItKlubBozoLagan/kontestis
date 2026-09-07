import { MailPreference, User } from "@kontestis/models";
import { createTransport } from "nodemailer";

import { Globals } from "../globals";
import { Logger } from "./logger";

const transporter = createTransport({
    host: Globals.emailHost,
    port: Globals.emailPort,
    secure: true,
    auth: {
        user: Globals.emailNotifierAccountMail,
        pass: Globals.emailNotifierAccountPassword,
    },
});

const escapeHtml = (value: string): string =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        // eslint-disable-next-line quotes
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");

export const sendRegistrationMail = async (user: User, code: string) => {
    Logger.debug("Sending verification email to: " + user.email);

    const subject = "Kontestis - E-mail verification";
    const confirmationUrl = `${Globals.backendUrl}/api/auth/managed/confirm/${user.id}/${code}`;
    const text = `Hello ${user.full_name},

    Please verify your email by clicking on the following link: ${confirmationUrl}`;

    const escapedConfirmationUrl = escapeHtml(confirmationUrl);

    const html = `Hello ${escapeHtml(user.full_name)},

    Please verify your email by clicking on the following link: <a href="${escapedConfirmationUrl}">${escapedConfirmationUrl}</a>`;

    await transporter
        .sendMail({
            from: `${Globals.emailNotifierAccountDisplayName} <${Globals.emailNotifierAccountMail}>`,
            to: user.email,
            subject,
            text,
            html,
        })
        .then((response) => {
            Logger.debug("Verification main response", response);
        });
};

export const sendMail = async (
    user: User,
    subject: string,
    text: string,
    mailPreferences: MailPreference,
    debugMode: boolean = true
) => {
    subject = subject.replaceAll("{user}", user.full_name);
    text = text.replaceAll("{user}", user.full_name);

    const response = await transporter.sendMail({
        from: `${Globals.emailNotifierAccountDisplayName} <${Globals.emailNotifierAccountMail}>`,
        to: debugMode ? Globals.emailNotifierAccountMail : user.email,
        subject: subject,
        // TODO: Make this configurable
        text:
            `Ovu obavijest primate jer imate račun na platformi Kontestis:
            U slučaju da ne želite više primati daljnje obavijesti: ${Globals.backendUrl}/api/notifications/mail/modify/${mailPreferences.code}/none
            Ako želite primati jedino obavijesti o nadolazećim natjecanjima: ${Globals.backendUrl}/api/notifications/mail/modify/${mailPreferences.code}/contest-only
            ` + text,

        html: `
            <p>
              Ovu obavijest primate jer imate račun na platformi Kontestis: <br/>
              U slučaju da ne želite više primati daljnje obavijesti: <a href="${
                  Globals.backendUrl
              }/api/notifications/mail/modify/${mailPreferences.code}/none">Unsubscribe</a> <br/>
              Ako želite primati jedino obavijesti o nadolazećim natjecanjima: <a href="${
                  Globals.backendUrl
              }/api/notifications/mail/modify/${
            mailPreferences.code
        }/contest-only">Unsubscribe Secondary</a>
            </p>
            <br/>
            <div>
              <p>${escapeHtml(text).replaceAll("\n", "<br/>")}</p>
            </div>
        `,
    });

    Logger.info(response);
};
