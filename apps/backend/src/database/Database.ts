import {
    Cluster,
    ContestAnnouncement,
    ContestMember,
    ContestQuestion,
    KnownUserData,
    Organisation,
    OrganisationMember,
    Problem,
} from "@kontestis/models";
import { ClusterSubmission } from "@kontestis/models";
import { Contest } from "@kontestis/models";
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
import { migration_contest_questions } from "./migrations/0011_contest_questions";
import { migration_contest_announcements } from "./migrations/0012_contest_announcements";
import { migration_apply_elo_state } from "./migrations/0013_apply_elo_state";
import { migration_index_by_elo_state } from "./migrations/0014_index_by_elo_state";
import { migration_add_official_to_contest } from "./migrations/0015_add_official_to_contest";
import { migration_fix_contest_entries } from "./migrations/0016_fix_contest_entries";
import { migration_contest_questions_index } from "./migrations/0017_contest_questions_index";
import { migration_remove_contest_member_indices } from "./migrations/0018_remove_contest_member_indices";
import { migration_remove_allowed_users } from "./migrations/0019_remove_allowed_users";
import { migration_add_organisations } from "./migrations/0020_add_organisations";
import { migration_change_user_google_id_type } from "./migrations/0021_change_user_google_id_type";
import { migration_add_organisation_id_to_contest } from "./migrations/0022_add_organisation_id_to_contest";
import { migration_organisation_indexes } from "./migrations/0023_organisation_indexes";

export const Database = new ScylloClient<{
    users: User;
    known_users: KnownUserData;
    contests: Contest;
    problems: Problem;
    clusters: Cluster;
    testcases: Testcase;
    submissions: Submission;
    cluster_submissions: ClusterSubmission;
    testcase_submissions: TestcaseSubmission;
    contest_members: ContestMember;
    contest_questions: ContestQuestion;
    contest_announcements: ContestAnnouncement;
    organisations: Organisation;
    organisation_members: OrganisationMember;
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
    migration_contest_questions,
    migration_contest_announcements,
    migration_apply_elo_state,
    migration_index_by_elo_state,
    migration_add_official_to_contest,
    migration_fix_contest_entries,
    migration_contest_questions_index,
    migration_remove_contest_member_indices,
    migration_remove_allowed_users,
    migration_add_organisations,
    migration_change_user_google_id_type,
    migration_add_organisation_id_to_contest,
    migration_organisation_indexes,
];

export const initDatabase = async () => {
    await Database.useKeyspace(Globals.dbKeyspace, true);
    await Database.migrate(migrations, true);
};
