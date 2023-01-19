import { ScylloClient } from "scyllo";

import { Globals } from "../globals";
import { AllowedUser } from "../types/AllowedUser";
import { Cluster } from "../types/Cluster";
import { ClusterSubmission } from "../types/ClusterSubmission";
import { Contest } from "../types/Contest";
import { Problem } from "../types/Problem";
import { Submission } from "../types/Submission";
import { Testcase } from "../types/Testcase";
import { TestcaseSubmission } from "../types/TestcaseSubmission";
import { User } from "../types/User";

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
});

export const initDatabase = async () => {
    await Database.useKeyspace(Globals.dbKeyspace, true);

    await Database.createTable(
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

    await Database.createIndex("users", "users_by_email", "email");

    await Database.createTable(
        "allowed_users",
        true,
        {
            id: { type: "bigint" },
            user_id: { type: "bigint" },
            contest_id: { type: "bigint" },
        },
        "user_id"
    );

    await Database.createIndex(
        "allowed_users",
        "allowed_users_by_allowed_id",
        "contest_id"
    );

    await Database.createTable(
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

    await Database.createIndex("contests", "contests_by_admin_id", "admin_id");
    await Database.createIndex("contests", "contests_by_name", "name");

    await Database.createTable(
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

    await Database.createIndex(
        "problems",
        "problems_by_contest_id",
        "contest_id"
    );

    await Database.createTable(
        "clusters",
        true,
        {
            id: { type: "bigint" },
            problem_id: { type: "bigint" },
            awarded_score: { type: "int" },
        },
        "id"
    );

    await Database.createIndex(
        "clusters",
        "clusters_by_problem_id",
        "problem_id"
    );

    await Database.createTable(
        "testcases",
        true,
        {
            id: { type: "bigint" },
            cluster_id: { type: "bigint" },
            input: { type: "text" },
            correctOutput: { type: "text" },
        },
        "id"
    );

    await Database.createIndex(
        "testcases",
        "testcases_by_cluster_id",
        "cluster_id"
    );

    await Database.createTable(
        "submissions",
        true,
        {
            id: { type: "bigint" },
            user_id: { type: "bigint" },
            problem_id: { type: "bigint" },
            language: { type: "text" },
            code: { type: "text" },
            verdict: { type: "text" },
            awardedScore: { type: "int" },
            time_used_millis: { type: "int" },
            memory_used_megabytes: { type: "int" },
            completed: { type: "tinyint" },
        },
        "id"
    );

    await Database.createIndex(
        "submissions",
        "submissions_by_user_id",
        "user_id"
    );
    await Database.createIndex(
        "submissions",
        "submissions_by_problem_id",
        "problem_id"
    );

    await Database.createTable(
        "cluster_submissions",
        true,
        {
            id: { type: "bigint" },
            submission_id: { type: "bigint" },
            cluster_id: { type: "bigint" },
            verdict: { type: "text" },
            awardedScore: { type: "int" },
            time_used_millis: { type: "int" },
            memory_used_megabytes: { type: "int" },
        },
        "id"
    );

    await Database.createIndex(
        "cluster_submissions",
        "cluster_submissions_by_submission_id",
        "submission_id"
    );
    await Database.createIndex(
        "cluster_submissions",
        "cluster_submissions_by_cluster_id",
        "cluster_id"
    );

    await Database.createTable(
        "testcase_submissions",
        true,
        {
            id: { type: "bigint" },
            testcase_id: { type: "bigint" },
            submission_id: { type: "bigint" },
            verdict: { type: "text" },
            awardedScore: { type: "int" },
            time_used_millis: { type: "int" },
            memory_used_megabytes: { type: "int" },
        },
        "id"
    );

    await Database.createIndex(
        "testcase_submissions",
        "testcase_submissions_by_testcase_id",
        "testcase_id"
    );
    await Database.createIndex(
        "testcase_submissions",
        "testcase_submissions_by_submission_id",
        "submission_id"
    );
};
