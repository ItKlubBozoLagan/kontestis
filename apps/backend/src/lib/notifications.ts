import { SiteNotification, Snowflake } from "@kontestis/models";

import { Database } from "../database/Database";
import { generateSnowflake } from "./snowflake";

export const pushNotificationsToMany = async (
    notification: Pick<SiteNotification, "type" | "data"> & { created_at?: Date },
    userIds: Snowflake[]
) => {
    await Promise.all(
        userIds.map((id) =>
            Database.insertInto("notifications", {
                ...notification,
                id: generateSnowflake(),
                recipient: id,
                created_at: notification.created_at ?? new Date(),
                seen: false,
            })
        )
    );
};
