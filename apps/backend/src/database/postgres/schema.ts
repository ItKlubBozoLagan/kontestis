export const initialSchema = `
CREATE TABLE IF NOT EXISTS schema_migrations (
    version integer PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scylla_migration (
    migration_key smallint PRIMARY KEY DEFAULT 1 CHECK (migration_key = 1),
    source_schema_version integer NOT NULL,
    status text NOT NULL CHECK (status IN ('running', 'failed', 'complete')),
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    error text
);

CREATE TABLE IF NOT EXISTS scylla_migration_tables (
    table_name text PRIMARY KEY,
    status text NOT NULL CHECK (status IN ('pending', 'running', 'failed', 'complete')),
    page_state text,
    source_rows bigint NOT NULL DEFAULT 0,
    target_rows bigint NOT NULL DEFAULT 0,
    source_digest text,
    target_digest text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    error text
);

CREATE TABLE IF NOT EXISTS scylla_migration_integrity (
    check_name text PRIMARY KEY,
    violation_count bigint NOT NULL,
    checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
    id bigint PRIMARY KEY,
    email text,
    full_name text,
    permissions bigint,
    picture_url text
);
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);

CREATE TABLE IF NOT EXISTS organisations (
    id bigint PRIMARY KEY,
    owner bigint,
    name text,
    avatar_url text
);
CREATE INDEX IF NOT EXISTS organisations_name_idx ON organisations(name);

CREATE TABLE IF NOT EXISTS contests (
    id bigint PRIMARY KEY,
    admin_id bigint,
    duration_seconds integer,
    elo_applied boolean,
    exam boolean,
    join_code text,
    name text,
    official boolean,
    organisation_id bigint,
    public boolean,
    require_edu_verification boolean,
    show_leaderboard_during_contest boolean,
    start_time timestamptz
);
CREATE INDEX IF NOT EXISTS contests_admin_id_idx ON contests(admin_id);
CREATE INDEX IF NOT EXISTS contests_name_idx ON contests(name);
CREATE INDEX IF NOT EXISTS contests_elo_applied_idx ON contests(elo_applied);
CREATE INDEX IF NOT EXISTS contests_organisation_id_idx ON contests(organisation_id);
CREATE INDEX IF NOT EXISTS contests_join_code_idx ON contests(join_code);

CREATE TABLE IF NOT EXISTS problems (
    id bigint PRIMARY KEY,
    contest_id bigint,
    description text,
    evaluation_language text,
    evaluation_script text,
    evaluation_variant text,
    legacy_evaluation boolean,
    memory_limit_megabytes integer,
    solution_code text,
    solution_language text,
    time_limit_millis integer,
    title text
);
CREATE INDEX IF NOT EXISTS problems_contest_id_idx ON problems(contest_id);

CREATE TABLE IF NOT EXISTS problem_tags (
    problem_id bigint NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    tag text NOT NULL,
    PRIMARY KEY (problem_id, tag)
);

CREATE TABLE IF NOT EXISTS clusters (
    id bigint PRIMARY KEY,
    awarded_score integer,
    error text,
    is_sample boolean,
    order_number bigint,
    problem_id bigint,
    status text
);
CREATE INDEX IF NOT EXISTS clusters_problem_id_idx ON clusters(problem_id);

CREATE TABLE IF NOT EXISTS generators (
    id bigint PRIMARY KEY,
    code text,
    contest_id bigint,
    language text,
    name text,
    organisation_id bigint,
    problem_id bigint,
    user_id bigint
);
CREATE INDEX IF NOT EXISTS generators_contest_id_idx ON generators(contest_id);
CREATE INDEX IF NOT EXISTS generators_organisation_id_idx ON generators(organisation_id);
CREATE INDEX IF NOT EXISTS generators_problem_id_idx ON generators(problem_id);
CREATE INDEX IF NOT EXISTS generators_user_id_idx ON generators(user_id);

CREATE TABLE IF NOT EXISTS testcases (
    id bigint PRIMARY KEY,
    cluster_id bigint,
    error text,
    generator_id bigint,
    generator_input text,
    input_file text,
    input_type text,
    output_file text,
    output_type text,
    status text
);
CREATE INDEX IF NOT EXISTS testcases_cluster_id_idx ON testcases(cluster_id);
CREATE INDEX IF NOT EXISTS testcases_generator_id_idx ON testcases(generator_id);

CREATE TABLE IF NOT EXISTS submissions (
    id bigint PRIMARY KEY,
    awarded_score integer,
    code text,
    compiler_output text,
    created_at date,
    error text,
    language text,
    memory_used_megabytes integer,
    problem_id bigint,
    samples_passed boolean,
    time_used_millis integer,
    user_id bigint,
    verdict text
);
CREATE INDEX IF NOT EXISTS submissions_problem_id_idx ON submissions(problem_id);
CREATE INDEX IF NOT EXISTS submissions_user_id_idx ON submissions(user_id);

CREATE TABLE IF NOT EXISTS cluster_submissions (
    id bigint PRIMARY KEY,
    awarded_score integer,
    cluster_id bigint,
    memory_used_megabytes integer,
    submission_id bigint,
    time_used_millis integer,
    verdict text
);
CREATE INDEX IF NOT EXISTS cluster_submissions_cluster_id_idx ON cluster_submissions(cluster_id);
CREATE INDEX IF NOT EXISTS cluster_submissions_submission_id_idx ON cluster_submissions(submission_id);

CREATE TABLE IF NOT EXISTS testcase_submissions (
    id bigint PRIMARY KEY,
    awarded_score integer,
    cluster_submission_id bigint,
    input_file text,
    memory_used_megabytes integer,
    output_file text,
    submission_output_file text,
    testcase_id bigint,
    time_used_millis integer,
    verdict text
);
CREATE INDEX IF NOT EXISTS testcase_submissions_cluster_submission_id_idx ON testcase_submissions(cluster_submission_id);
CREATE INDEX IF NOT EXISTS testcase_submissions_testcase_id_idx ON testcase_submissions(testcase_id);

CREATE TABLE IF NOT EXISTS contest_members (
    id bigint NOT NULL,
    contest_id bigint NOT NULL,
    user_id bigint NOT NULL,
    contest_permissions bigint,
    PRIMARY KEY (id, contest_id, user_id)
);
CREATE INDEX IF NOT EXISTS contest_members_contest_id_idx ON contest_members(contest_id);
CREATE INDEX IF NOT EXISTS contest_members_user_id_idx ON contest_members(user_id);

CREATE TABLE IF NOT EXISTS contest_member_scores (
    contest_member_id bigint NOT NULL,
    contest_id bigint NOT NULL,
    user_id bigint NOT NULL,
    problem_id bigint NOT NULL,
    score integer NOT NULL,
    PRIMARY KEY (contest_member_id, contest_id, user_id, problem_id),
    FOREIGN KEY (contest_member_id, contest_id, user_id)
        REFERENCES contest_members(id, contest_id, user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS contest_member_scores_problem_id_idx ON contest_member_scores(problem_id);

CREATE TABLE IF NOT EXISTS contest_member_exam_scores (
    contest_member_id bigint NOT NULL,
    contest_id bigint NOT NULL,
    user_id bigint NOT NULL,
    problem_id bigint NOT NULL,
    score integer NOT NULL,
    PRIMARY KEY (contest_member_id, contest_id, user_id, problem_id),
    FOREIGN KEY (contest_member_id, contest_id, user_id)
        REFERENCES contest_members(id, contest_id, user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS contest_member_exam_scores_problem_id_idx ON contest_member_exam_scores(problem_id);

CREATE TABLE IF NOT EXISTS contest_questions (
    id bigint PRIMARY KEY,
    contest_id bigint,
    contest_member_id bigint,
    last_message_at timestamptz,
    last_message_member_id bigint,
    question text,
    response text,
    response_author_id bigint
);
CREATE INDEX IF NOT EXISTS contest_questions_contest_id_idx ON contest_questions(contest_id);
CREATE INDEX IF NOT EXISTS contest_questions_contest_member_id_idx ON contest_questions(contest_member_id);
CREATE INDEX IF NOT EXISTS contest_questions_response_author_id_idx ON contest_questions(response_author_id);

CREATE TABLE IF NOT EXISTS contest_chat_messages (
    id bigint PRIMARY KEY,
    author_member_id bigint,
    content text,
    contest_id bigint,
    created_at timestamptz,
    thread_id bigint
);
CREATE INDEX IF NOT EXISTS contest_chat_messages_contest_id_idx ON contest_chat_messages(contest_id);
CREATE INDEX IF NOT EXISTS contest_chat_messages_thread_id_idx ON contest_chat_messages(thread_id);

CREATE TABLE IF NOT EXISTS contest_announcements (
    id bigint PRIMARY KEY,
    contest_id bigint,
    message text
);
CREATE INDEX IF NOT EXISTS contest_announcements_contest_id_idx ON contest_announcements(contest_id);

CREATE TABLE IF NOT EXISTS organisation_members (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    organisation_id bigint NOT NULL,
    elo integer,
    permissions bigint,
    PRIMARY KEY (id, user_id, organisation_id)
);
CREATE INDEX IF NOT EXISTS organisation_members_user_id_idx ON organisation_members(user_id);
CREATE INDEX IF NOT EXISTS organisation_members_organisation_id_idx ON organisation_members(organisation_id);

CREATE TABLE IF NOT EXISTS exam_final_submissions (
    id bigint NOT NULL,
    contest_id bigint NOT NULL,
    user_id bigint NOT NULL,
    final_score integer,
    reviewed boolean,
    submission_id bigint,
    PRIMARY KEY (id, contest_id, user_id)
);
CREATE INDEX IF NOT EXISTS exam_final_submissions_contest_id_idx ON exam_final_submissions(contest_id);
CREATE INDEX IF NOT EXISTS exam_final_submissions_user_id_idx ON exam_final_submissions(user_id);
CREATE INDEX IF NOT EXISTS exam_final_submissions_submission_id_idx ON exam_final_submissions(submission_id);

CREATE TABLE IF NOT EXISTS exam_grading_scales (
    id bigint PRIMARY KEY,
    contest_id bigint,
    grade text,
    percentage double precision
);
CREATE INDEX IF NOT EXISTS exam_grading_scales_contest_id_idx ON exam_grading_scales(contest_id);

CREATE TABLE IF NOT EXISTS notifications (
    id bigint PRIMARY KEY,
    created_at timestamptz,
    data text,
    recipient bigint,
    seen boolean,
    type text
);
CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications(recipient);

CREATE TABLE IF NOT EXISTS mail_preferences (
    user_id bigint PRIMARY KEY,
    code text,
    status text
);
CREATE INDEX IF NOT EXISTS mail_preferences_code_idx ON mail_preferences(code);

CREATE TABLE IF NOT EXISTS edu_users (
    id bigint PRIMARY KEY,
    associated_org text,
    dob timestamptz,
    email text,
    full_name text,
    permissions bigint,
    picture_url text,
    professional_status text,
    student_category text,
    uid text
);
CREATE INDEX IF NOT EXISTS edu_users_uid_idx ON edu_users(uid);

CREATE TABLE IF NOT EXISTS managed_users (
    id bigint PRIMARY KEY,
    confirmed_at timestamptz,
    created_at timestamptz,
    email text,
    password text
);
CREATE INDEX IF NOT EXISTS managed_users_email_idx ON managed_users(email);

CREATE TABLE IF NOT EXISTS temporary_users (
    id bigint PRIMARY KEY,
    created_at timestamptz,
    organisation_id bigint,
    password text,
    username text
);
CREATE INDEX IF NOT EXISTS temporary_users_username_idx ON temporary_users(username);
`;
