import { Migration, ScylloClient } from "scyllo";

import { Globals } from "../globals";
import { Logger } from "../lib/logger";
import { AllowedUser } from "../types/AllowedUser";
import { Cluster } from "../types/Cluster";
import { ClusterSubmission } from "../types/ClusterSubmission";
import { Contest } from "../types/Contest";
import { Problem } from "../types/Problem";
import { Submission } from "../types/Submission";
import { Testcase } from "../types/Testcase";
import { TestcaseSubmission } from "../types/TestcaseSubmission";
import { User } from "../types/User";
import { migration_initial } from "./migrations/0001_initial";
import { migration_update_testcase_submission } from "./migrations/0002_update_testcase_submission";

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
];

export const initDatabase = async () => {
    await Database.useKeyspace(Globals.dbKeyspace, true);
    await Database.migrate(migrations, true);
};
