import { AllowedUser } from "@kontestis/models";
import { Cluster } from "@kontestis/models";
import { ClusterSubmission } from "@kontestis/models";
import { Contest } from "@kontestis/models";
import { Problem } from "@kontestis/models";
import { Submission } from "@kontestis/models";
import { Testcase } from "@kontestis/models";
import { TestcaseSubmission } from "@kontestis/models";
import { User } from "@kontestis/models";
import { Migration, ScylloClient } from "scyllo";

import { Globals } from "../globals";
import { Logger } from "../lib/logger";
import { migration_initial } from "./migrations/0001_initial";
import { migration_update_testcase_submission } from "./migrations/0002_update_testcase_submission";
import { migration_fix_column_names } from "./migrations/0003_fix_column_names";
import { migration_running_contest_preparation } from "./migrations/0004_running_contest_preparation";

export const Database = new ScylloClient<{
    users: User;
    contests: Contest;
    allowed_users: AllowedUser;
    problems: Problem;
    clusters: Cluster;
    testcases: Testcase;
    submissions: Submission;
    cluster_submissions: ClusterSubmission;
    testcase_submissions: TestcaseSubmission;
}>({
    client: {
        contactPoints: [Globals.dbHost + ":" + Globals.dbPort],
        keyspace: "system",
        localDataCenter: Globals.dbDatacenter,
        encoding: {
            useBigIntAsLong: true,
        },
    },
    log: Logger.database,
});

const migrations: Migration<any>[] = [
    migration_initial,
    migration_update_testcase_submission,
    migration_fix_column_names,
    migration_running_contest_preparation,
];

export const initDatabase = async () => {
    await Database.useKeyspace(Globals.dbKeyspace, true);
    await Database.migrate(migrations, true);
};
