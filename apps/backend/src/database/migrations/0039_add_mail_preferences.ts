import { KnownUserDataV1, MailPreferenceV1 } from "@kontestis/models";
import { Migration } from "scyllo";

import { randomSequence } from "../../utils/random";

type MigrationType = {
    mail_preferences: MailPreferenceV1;
    known_users: KnownUserDataV1;
};

export const migration_add_mail_preferences: Migration<MigrationType> = async (database, log) => {
    await database.createTable(
        "mail_preferences",
        true,
        {
            user_id: {
                type: "bigint",
            },
            status: {
                type: "text",
            },
            code: {
                type: "text",
            },
        },
        "user_id"
    );

    await database.createIndex("mail_preferences", "mail_preferences_by_code", "code");

    const users = await database.selectFrom("known_users", ["user_id"], {});

    await Promise.all(
        users.map((user) => {
            const mailPreference: MailPreferenceV1 = {
                user_id: user.user_id,
                status: "all",
                code: randomSequence(16),
            };

            return database.insertInto("mail_preferences", mailPreference);
        })
    );

    log("Done");
};
