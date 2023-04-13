import { SiteNotificationV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    notifications: SiteNotificationV1;
};

export const migration_add_notifications: Migration<MigrationType> = async (database, log) => {
    await database.createTable(
        "notifications",
        true,
        {
            id: { type: "bigint" },
            recipient: { type: "bigint" },
            type: { type: "text" },
            data: { type: "text" },
            seen: { type: "boolean" },
            created_at: { type: "timestamp" },
        },
        "id"
    );

    await database.createIndex("notifications", "notifications_by_recipient", "recipient");

    log("Done");
};
