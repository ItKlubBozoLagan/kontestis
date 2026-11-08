import {
    Cluster,
    ClusterSubmission,
    Contest,
    ContestAnnouncement,
    ContestChatMessage,
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
    Submission,
    TemporaryUser,
    Testcase,
    TestcaseSubmission,
    User,
} from "@kontestis/models";

export type KontestisTables = {
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
    contest_chat_messages: ContestChatMessage;
    contest_announcements: ContestAnnouncement;
    organisations: Organisation;
    organisation_members: OrganisationMember;
    exam_final_submissions: ExamFinalSubmission;
    exam_grading_scales: ExamGradingScale;
    notifications: SiteNotification;
    mail_preferences: MailPreference;
    edu_users: EduUser;
    managed_users: ManagedUser;
    temporary_users: TemporaryUser;
    generators: Generator;
};

export type TableName = keyof KontestisTables;

type TableDefinition = {
    primaryKey: string[];
    columns: string[];
    virtualColumns?: string[];
};

export const tableDefinitions: Record<TableName, TableDefinition> = {
    users: {
        primaryKey: ["id"],
        columns: ["id", "email", "full_name", "permissions", "picture_url"],
    },
    contests: {
        primaryKey: ["id"],
        columns: [
            "id",
            "admin_id",
            "duration_seconds",
            "elo_applied",
            "exam",
            "join_code",
            "name",
            "official",
            "organisation_id",
            "public",
            "require_edu_verification",
            "show_leaderboard_during_contest",
            "start_time",
        ],
    },
    problems: {
        primaryKey: ["id"],
        columns: [
            "id",
            "contest_id",
            "description",
            "evaluation_language",
            "evaluation_script",
            "evaluation_variant",
            "legacy_evaluation",
            "memory_limit_megabytes",
            "solution_code",
            "solution_language",
            "time_limit_millis",
            "title",
        ],
        virtualColumns: ["tags"],
    },
    clusters: {
        primaryKey: ["id"],
        columns: [
            "id",
            "awarded_score",
            "error",
            "is_sample",
            "order_number",
            "problem_id",
            "status",
        ],
    },
    testcases: {
        primaryKey: ["id"],
        columns: [
            "id",
            "cluster_id",
            "error",
            "generator_id",
            "generator_input",
            "input_file",
            "input_type",
            "output_file",
            "output_type",
            "status",
        ],
    },
    submissions: {
        primaryKey: ["id"],
        columns: [
            "id",
            "awarded_score",
            "code",
            "compiler_output",
            "created_at",
            "error",
            "language",
            "memory_used_megabytes",
            "problem_id",
            "samples_passed",
            "time_used_millis",
            "user_id",
            "verdict",
        ],
    },
    cluster_submissions: {
        primaryKey: ["id"],
        columns: [
            "id",
            "awarded_score",
            "cluster_id",
            "memory_used_megabytes",
            "submission_id",
            "time_used_millis",
            "verdict",
        ],
    },
    testcase_submissions: {
        primaryKey: ["id"],
        columns: [
            "id",
            "awarded_score",
            "cluster_submission_id",
            "input_file",
            "memory_used_megabytes",
            "output_file",
            "submission_output_file",
            "testcase_id",
            "time_used_millis",
            "verdict",
        ],
    },
    contest_members: {
        primaryKey: ["id", "contest_id", "user_id"],
        columns: ["id", "contest_id", "user_id", "contest_permissions"],
        virtualColumns: ["score", "exam_score"],
    },
    contest_questions: {
        primaryKey: ["id"],
        columns: [
            "id",
            "contest_id",
            "contest_member_id",
            "last_message_at",
            "last_message_member_id",
            "question",
            "response",
            "response_author_id",
        ],
    },
    contest_chat_messages: {
        primaryKey: ["id"],
        columns: ["id", "author_member_id", "content", "contest_id", "created_at", "thread_id"],
    },
    contest_announcements: { primaryKey: ["id"], columns: ["id", "contest_id", "message"] },
    organisations: { primaryKey: ["id"], columns: ["id", "owner", "name", "avatar_url"] },
    organisation_members: {
        primaryKey: ["id", "user_id", "organisation_id"],
        columns: ["id", "user_id", "organisation_id", "elo", "permissions"],
    },
    exam_final_submissions: {
        primaryKey: ["id", "contest_id", "user_id"],
        columns: ["id", "contest_id", "user_id", "final_score", "reviewed", "submission_id"],
    },
    exam_grading_scales: {
        primaryKey: ["id"],
        columns: ["id", "contest_id", "grade", "percentage"],
    },
    notifications: {
        primaryKey: ["id"],
        columns: ["id", "created_at", "data", "recipient", "seen", "type"],
    },
    mail_preferences: { primaryKey: ["user_id"], columns: ["user_id", "code", "status"] },
    edu_users: {
        primaryKey: ["id"],
        columns: [
            "id",
            "associated_org",
            "dob",
            "email",
            "full_name",
            "permissions",
            "picture_url",
            "professional_status",
            "student_category",
            "uid",
        ],
    },
    managed_users: {
        primaryKey: ["id"],
        columns: ["id", "confirmed_at", "created_at", "email", "password"],
    },
    temporary_users: {
        primaryKey: ["id"],
        columns: ["id", "created_at", "organisation_id", "password", "username"],
    },
    generators: {
        primaryKey: ["id"],
        columns: [
            "id",
            "code",
            "contest_id",
            "language",
            "name",
            "organisation_id",
            "problem_id",
            "user_id",
        ],
    },
};

export const tableNames = Object.keys(tableDefinitions) as TableName[];
