import { Migration, ScylloClient } from "scyllo";

import { AllowedUser } from "../../../../packages/models/src/AllowedUser";
import { Cluster } from "../../../../packages/models/src/Cluster";
import { ClusterSubmission } from "../../../../packages/models/src/ClusterSubmission";
import { Contest } from "../../../../packages/models/src/Contest";
import { Problem } from "../../../../packages/models/src/Problem";
import { Submission } from "../../../../packages/models/src/Submission";
import { Testcase } from "../../../../packages/models/src/Testcase";
import { TestcaseSubmission } from "../../../../packages/models/src/TestcaseSubmission";
import { User } from "../../../../packages/models/src/User";
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
