import { AllowedUserV1 } from "@kontestis/models";
import { ClusterV1 } from "@kontestis/models";
import { ClusterSubmissionV1 } from "@kontestis/models";
import { ContestV1 } from "@kontestis/models";
import { ProblemV1 } from "@kontestis/models";
import { SubmissionV1 } from "@kontestis/models";
import { TestcaseV1 } from "@kontestis/models";
import { TestcaseSubmissionV1 } from "@kontestis/models";
import { UserV1 } from "@kontestis/models";
import { Migration } from "scyllo";

type InitialDB = {
    users: UserV1;
    contests: ContestV1;
    allowed_users: AllowedUserV1;
    problems: ProblemV1;
    clusters: ClusterV1;
    testcases: TestcaseV1;
    submissions: SubmissionV1;
    cluster_submissions: ClusterSubmissionV1;
    testcase_submissions: TestcaseSubmissionV1;
};

export const migration_initial: Migration<InitialDB> = async (database, log) => {
    await database.createTable(
        "users",
        true,
        {
            id: { type: "bigint" },
            username: { type: "text" },
            password: { type: "text " },
            email: { type: "text" },
            permissions: { type: "bigint" },
        },
        "id"
    );

    await database.createIndex("users", "users_by_email", "email");

    await database.createTable(
        "allowed_users",
        true,
        {
            id: { type: "bigint" },
            user_id: { type: "bigint" },
            contest_id: { type: "bigint" },
        },
        "user_id"
    );

    await database.createIndex("allowed_users", "allowed_users_by_allowed_id", "contest_id");

    await database.createTable(
        "contests",
        true,
        {
            id: { type: "bigint" },
            admin_id: { type: "bigint" },
            name: { type: "text" },
            start_time: { type: "timestamp" },
            duration_seconds: { type: "int" },
            public: { type: "boolean" },
        },
        "id"
    );

    await database.createIndex("contests", "contests_by_admin_id", "admin_id");
    await database.createIndex("contests", "contests_by_name", "name");

    await database.createTable(
        "problems",
        true,
        {
            id: { type: "bigint" },
            contest_id: { type: "bigint" },
            title: { type: "text" },
            description: { type: "text" },
            evaluation_variant: { type: "text" },
            evaluation_script: { type: "text" },
            time_limit_millis: { type: "int" },
            memory_limit_megabytes: { type: "int" },
        },
        "id"
    );

    await database.createIndex("problems", "problems_by_contest_id", "contest_id");

    await database.createTable(
        "clusters",
        true,
        {
            id: { type: "bigint" },
            problem_id: { type: "bigint" },
            awarded_score: { type: "int" },
        },
        "id"
    );

    await database.createIndex("clusters", "clusters_by_problem_id", "problem_id");

    await database.createTable(
        "testcases",
        true,
        {
            id: { type: "bigint" },
            cluster_id: { type: "bigint" },
            input: { type: "text" },
            correctoutput: { type: "text" },
        },
        "id"
    );

    await database.createIndex("testcases", "testcases_by_cluster_id", "cluster_id");

    await database.createTable(
        "submissions",
        true,
        {
            id: { type: "bigint" },
            user_id: { type: "bigint" },
            problem_id: { type: "bigint" },
            language: { type: "text" },
            code: { type: "text" },
            verdict: { type: "text" },
            awardedscore: { type: "int" },
            time_used_millis: { type: "int" },
            memory_used_megabytes: { type: "int" },
            completed: { type: "boolean" },
        },
        "id"
    );

    await database.createIndex("submissions", "submissions_by_user_id", "user_id");
    await database.createIndex("submissions", "submissions_by_problem_id", "problem_id");

    await database.createTable(
        "cluster_submissions",
        true,
        {
            id: { type: "bigint" },
            submission_id: { type: "bigint" },
            cluster_id: { type: "bigint" },
            verdict: { type: "text" },
            awardedscore: { type: "int" },
            time_used_millis: { type: "int" },
            memory_used_megabytes: { type: "int" },
        },
        "id"
    );

    await database.createIndex(
        "cluster_submissions",
        "cluster_submissions_by_submission_id",
        "submission_id"
    );
    await database.createIndex(
        "cluster_submissions",
        "cluster_submissions_by_cluster_id",
        "cluster_id"
    );

    await database.createTable(
        "testcase_submissions",
        true,
        {
            id: { type: "bigint" },
            testcase_id: { type: "bigint" },
            submission_id: { type: "bigint" },
            verdict: { type: "text" },
            awardedscore: { type: "int" },
            time_used_millis: { type: "int" },
            memory_used_megabytes: { type: "int" },
        },
        "id"
    );

    await database.createIndex(
        "testcase_submissions",
        "testcase_submissions_by_testcase_id",
        "testcase_id"
    );

    await database.createIndex(
        "testcase_submissions",
        "testcase_submissions_by_submission_id",
        "submission_id"
    );

    log("Done");
};
