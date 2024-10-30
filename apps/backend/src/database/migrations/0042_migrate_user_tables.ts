import { EduUserLinksV1, EduUserV1, KnownUserDataV1, UserV6 } from "@kontestis/models";
import { EMPTY_PERMISSIONS } from "permissio";
import { Migration } from "scyllo";

type MigrationType = {
    known_users: KnownUserDataV1;
    users: UserV6;
    edu_users: EduUserV1;
    edu_user_links: EduUserLinksV1;
};

export const migration_migrate_user_tables: Migration<MigrationType> = async (database, log) => {
    const users = await database.selectFrom("users", "*");

    await database.raw("DROP TABLE users");

    await database.createTable(
        "users",
        true,
        {
            id: { type: "bigint" },
            permissions: { type: "bigint" },
            email: { type: "text" },
            full_name: { type: "text" },
            picture_url: { type: "text" },
        },
        "id"
    );

    await database.createIndex("users", "users_by_email", "email");

    const knownUsers = await database.selectFrom("known_users", "*");

    for (const knownUser of knownUsers) {
        await database.insertInto("users", {
            id: knownUser.user_id,
            email: knownUser.email,
            full_name: knownUser.full_name,
            picture_url: knownUser.picture_url,
            permissions:
                users.find((it) => it.id === knownUser.user_id)?.permissions ?? EMPTY_PERMISSIONS,
        });
    }

    await database.raw("DROP TABLE known_users");

    await database.createTable(
        "edu_users",
        true,
        {
            id: { type: "bigint" },
            permissions: { type: "bigint" },
            email: { type: "text" },
            full_name: { type: "text" },
            picture_url: { type: "text" },
            uid: { type: "text" },
            dob: { type: "timestamp" },
            student_category: { type: "text" },
            associated_org: { type: "text" },
            professional_status: { type: "text" },
        },
        "id"
    );

    await database.createTable(
        "edu_user_links",
        true,
        {
            user_id: { type: "bigint" },
            edu_uid: { type: "text" },
        },
        "user_id"
    );

    await database.createIndex("edu_user_links", "edu_user_links_by_edu_uid", "edu_uid");

    log("Done");
};
