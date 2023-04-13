import { AdminPermissions, hasAdminPermission } from "@kontestis/models";
import { Type } from "@sinclair/typebox";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { eqIn } from "scyllo";

import { Database } from "../../database/Database";
import { SafeError } from "../../errors/SafeError";
import { extractUser } from "../../extractors/extractUser";
import { pushNotificationsToMany } from "../../lib/notifications";
import { useValidation } from "../../middlewares/useValidation";
import { respond } from "../../utils/response";

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
