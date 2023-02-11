import { AllowedUser, ContestMember, KnownUserData } from "@kontestis/models";
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
import { migration_remove_submission_completed } from "./migrations/0005_remove_submission_completed";
import { migration_refractor_user } from "./migrations/0006_refractor_user";
import { migration_known_user_data } from "./migrations/0007_known_user_data";
import { migration_add_error_to_submission } from "./migrations/0008_add_error_to_submission";
import { migration_add_elo_to_user } from "./migrations/0009_add_elo_to_user";
import { migration_fix_contest_member_definition } from "./migrations/0010_fix_contest_member_definition";

export const Database = new ScylloClient<{
    users: User;
    known_users: KnownUserData;
    contests: Contest;
    allowed_users: AllowedUser;
    problems: Problem;
    clusters: Cluster;
    testcases: Testcase;
    submissions: Submission;
    cluster_submissions: ClusterSubmission;
    testcase_submissions: TestcaseSubmission;
    contest_members: ContestMember;
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
    migration_remove_submission_completed,
    migration_refractor_user,
    migration_known_user_data,
    migration_add_error_to_submission,
    migration_add_elo_to_user,
    migration_fix_contest_member_definition,
];

export const initDatabase = async () => {
    await Database.useKeyspace(Globals.dbKeyspace, true);
    await Database.migrate(migrations, true);
};
