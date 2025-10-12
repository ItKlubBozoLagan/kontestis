import {
    Cluster,
    ContestAnnouncement,
    ContestMember,
    ContestQuestion,
    EduUser,
    ExamFinalSubmission,
    ExamGradingScale,
    Generator,
    MailPreference,
    ManagedUser,
    Organisation,
    OrganisationMember,
    Problem,
    SiteNotification,
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
import { migration_fix_organisation_member_definition } from "./migrations/0024_fix_organisation_member_definition";
import { migration_add_contests_exam_properties } from "./migrations/0025_add_contests_exam_properties";
import { migration_add_exam_final_submissions } from "./migrations/0026_add_exam_final_submissions";
import { migration_add_exam_final_submissions_index } from "./migrations/0027_add_exam_final_submissions_index";
import { migration_add_exam_grading_scale } from "./migrations/0028_add_exam_grading_scale";
import { migration_add_testcase_generators } from "./migrations/0029_add_testcase_generators";
import { migration_move_elo_to_organisation_member } from "./migrations/0030_move_elo_to_organisation_member";
import { migration_remove_correct_output_from_testcase } from "./migrations/0031_remove_correct_output_from_testcase";
import { migration_add_tags_to_problems } from "./migrations/0032_add_tags_to_problems";
import { migration_add_final_score_to_exam_final_submissions } from "./migrations/0033_add_final_score_to_exam_final_submissions";
import { migration_add_exam_scores_to_contest_member } from "./migrations/0034_add_exam_scores_to_contest_member";
import { migration_add_reviewed_to_exam_final_submissions } from "./migrations/0035_add_reviewed_to_exam_final_submissions";
import { migration_add_evaluation_language_to_problem } from "./migrations/0036_add_evaluation_language_to_problem";
import { migration_add_notifications } from "./migrations/0037_add_notifications";
import { migration_add_join_codes } from "./migrations/0038_add_join_codes";
import { migration_add_mail_preferences } from "./migrations/0039_add_mail_preferences";
import { migration_add_organisations_permissions } from "./migrations/0040_add_organisations_permissions";
import { migration_legacy_evaluation } from "./migrations/0041_legacy_evaluation";
import { migration_migrate_user_tables } from "./migrations/0042_migrate_user_tables";
import { migration_remove_edu_links } from "./migrations/0043_remove_edu_links";
import { migration_edu_user_uid_index } from "./migrations/0044_edu_user_uid_index";
import { migration_add_require_edu_verification } from "./migrations/0045_add_require_edu_verification";
import { migration_fix_contest_members_table } from "./migrations/0046_fix_contest_members_table";
import { migration_add_managed_users } from "./migrations/0047_add_managed_users";
import { migration_submission_compiler_output } from "./migrations/0048_submission_compiler_output";
import { migration_contest_show_leaderboard } from "./migrations/0049_contest_show_leaderboard";
import { migration_improve_generators } from "./migrations/0050_improve_generators";

export const Database = new ScylloClient<{
    users: User;
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
    exam_final_submissions: ExamFinalSubmission;
    exam_grading_scales: ExamGradingScale;
    notifications: SiteNotification;
    mail_preferences: MailPreference;
    edu_users: EduUser;
    managed_users: ManagedUser;
    generators: Generator;
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
    migration_fix_organisation_member_definition,
    migration_add_contests_exam_properties,
    migration_add_exam_final_submissions,
    migration_add_exam_final_submissions_index,
    migration_add_exam_grading_scale,
    migration_add_testcase_generators,
    migration_move_elo_to_organisation_member,
    migration_remove_correct_output_from_testcase,
    migration_add_tags_to_problems,
    migration_add_final_score_to_exam_final_submissions,
    migration_add_exam_scores_to_contest_member,
    migration_add_reviewed_to_exam_final_submissions,
    migration_add_evaluation_language_to_problem,
    migration_add_notifications,
    migration_add_join_codes,
    migration_add_mail_preferences,
    migration_add_organisations_permissions,
    migration_legacy_evaluation,
    migration_migrate_user_tables,
    migration_remove_edu_links,
    migration_edu_user_uid_index,
    migration_add_require_edu_verification,
    migration_fix_contest_members_table,
    migration_add_managed_users,
    migration_submission_compiler_output,
    migration_contest_show_leaderboard,
    migration_improve_generators,
];

export const initDatabase = async () => {
    await Database.useKeyspace(Globals.dbKeyspace, true);
    await Database.migrate(migrations, true);
};
