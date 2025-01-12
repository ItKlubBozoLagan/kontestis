import { AdminPermissions, hasAdminPermission, MailPreference } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { eqIn } from "scyllo";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractUser } from "../../extractors/extractUser";
import { Globals } from "../../globals";
import { Logger } from "../../lib/logger";
import { sendMail } from "../../lib/mail";
import { pushNotificationsToMany } from "../../lib/notifications";
import { useValidation } from "../../middlewares/useValidation";
import { randomSequence } from "../../utils/random";
import { reject, respond } from "../../utils/response";

const NotificationsHandler = Router();

NotificationsHandler.get("/", async (req, res) => {
    const user = await extractUser(req);

    const notifications = await Database.selectFrom("notifications", "*", { recipient: user.id });

    respond(
        res,
        StatusCodes.OK,
        notifications
            .filter(
                (notification) =>
                    Date.now() - notification.created_at.getTime() <= 2 * 24 * 60 * 60 * 1000
            )
            .filter((notification) => notification.created_at.getTime() <= Date.now())
            .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
    );
});

const ReadNotificationSchema = Type.Object({
    notificationIds: Type.Array(Type.String()),
});

const MailSchema = Type.Object({
    subject: Type.String(),
    text: Type.String(),
    contestAnnouncement: Type.Boolean(),
    debugMode: Type.Boolean(),
});

NotificationsHandler.post(
    "/sendMail",
    useValidation(MailSchema, {
        body: true,
    }),
    async (req, res) => {
        const user = await extractUser(req);

        if (!hasAdminPermission(user.permissions, AdminPermissions.ADMIN))
            return reject(res, StatusCodes.FORBIDDEN);

        const users = await Database.selectFrom("users", "*", {});

        const mailPreferences = await Database.selectFrom("mail_preferences", "*", {});

        const preferencesByUserId: Record<string, MailPreference> = {};

        for (const preference of mailPreferences) {
            preferencesByUserId[preference.user_id.toString()] = preference;
        }

        // eslint-disable-next-line no-async-promise-executor
        new Promise<void>(async (resolve) => {
            for (const user of users) {
                Logger.info("Current user: " + user.full_name);
                Logger.info(users.length);

                let preference = preferencesByUserId[user.id.toString()];

                if (!preference) {
                    preference = {
                        user_id: user.id,
                        code: randomSequence(16),
                        status: "all",
                    };

                    await Database.insertInto("mail_preferences", preference);
                }

                if (preference.status === "none") continue;

                if (preference.status === "contest-only" && !req.body.contestAnnouncement) continue;

                Logger.info("Attempting to send mail: ");

                await sendMail(
                    user,
                    req.body.subject,
                    req.body.text,
                    preference,
                    req.body.debugMode
                );
            }
            resolve();
        });

        return respond(res, StatusCodes.OK);
    }
);

NotificationsHandler.get("/mail/modify/:code/:status/", async (req, res) => {
    const preferences = await Database.selectOneFrom("mail_preferences", "*", {
        code: req.params.code,
    });

    if (!preferences) return reject(res, StatusCodes.NOT_FOUND);

    if (
        req.params.status !== "all" &&
        req.params.status !== "none" &&
        req.params.status !== "contest-only"
    )
        return reject(res, StatusCodes.BAD_REQUEST);

    const status: "all" | "none" | "contest-only" = req.params.status as any;

    await Database.update(
        "mail_preferences",
        {
            status: status,
        },
        {
            user_id: preferences.user_id,
        }
    );

    // TODO: Make this configurable
    return res.status(200).send(
        `Mail postavke za user id  ${preferences.user_id} su postavljene na: ${req.params.status}
                <br/>
                <a href="${Globals.backendUrl}/api/notifications/mail/modify/${preferences.code}/all">all</a>
                <br/>
                <a href="${Globals.backendUrl}/api/notifications/mail/modify/${preferences.code}/contest-only">contest-only</a>
                <br/>
                <a href="${Globals.backendUrl}/api/notifications/mail/modify/${preferences.code}/none">none</a>
            `
    );
});

NotificationsHandler.post("/read", useValidation(ReadNotificationSchema), async (req, res) => {
    const user = await extractUser(req);
    const notifications = await Database.selectFrom(
        "notifications",
        ["id"],
        {
            id: eqIn(...req.body.notificationIds),
            recipient: user.id,
            seen: false,
        },
        "ALLOW FILTERING"
    );

    await Promise.all(
        notifications.map((notification) =>
            Database.update("notifications", { seen: true }, { id: notification.id })
        )
    );

    respond(res, StatusCodes.OK);
});

const AddAlertSchema = Type.Object({
    message: Type.String(),
});

NotificationsHandler.post("/alert", useValidation(AddAlertSchema), async (req, res) => {
    const user = await extractUser(req);

    if (!hasAdminPermission(user.permissions, AdminPermissions.ADD_ALERTS))
        throw new SafeError(StatusCodes.FORBIDDEN);

    const allUsers = await Database.selectFrom("users", ["id"]);

    const _ = pushNotificationsToMany(
        {
            type: "alert",
            data: req.body.message,
        },
        allUsers.map((user) => user.id)
    );

    respond(res, StatusCodes.OK);
});

export { NotificationsHandler };
