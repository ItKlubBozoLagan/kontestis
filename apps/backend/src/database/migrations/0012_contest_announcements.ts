import { ContestAnnouncementV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type MigrationType = {
    contest_announcements: ContestAnnouncementV1;
};

export const migration_contest_announcements: Migration<MigrationType> = async (database, log) => {
    await database.createTable(
        "contest_announcements",
        true,
        {
            id: { type: "bigint" },
            contest_id: { type: "bigint" },
            message: { type: "text" },
        },
        "id"
    );

    await database.createIndex(
        "contest_announcements",
        "contest_announcements_by_contest_id",
        "contest_id"
    );

    log("Done");
};
