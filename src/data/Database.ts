import { ScylloClient } from "scyllo";

import { Globals } from "../globals";
import { User } from "../types/User";
import {Contest} from "../types/Contest";
import {Problem} from "../types/Problem";
import {Cluster} from "../types/Cluster";
import {Testcase} from "../types/Testcase";
import {EvaluationSchema} from "../types/EvaluationSchema";
import {AllowedUser} from "../types/AllowedUser";
import {Submission} from "../types/Submission";
import {ClusterSubmission} from "../types/ClusterSubmission";
import {TestcaseSubmission} from "../types/TestcaseSubmission";

export const DataBase = new ScylloClient<{
    users: User;
    contests: Contest;
    allowed_users: AllowedUser,
    problems: Problem;
    clusters: Cluster;
    testcases: Testcase,
    evaluation_schemas: EvaluationSchema,
    submissions: Submission,
    cluster_submissions: ClusterSubmission,
    testcase_submissions: TestcaseSubmission
}>({
    client: {
        contactPoints: [Globals.dbHost + ":" + Globals.dbPort],
        keyspace: Globals.dbKeySpace,
        localDataCenter: Globals.dbDatacenter, 
    },
});

export const initDatabase = async () => {

    await DataBase.createTable("users", true, {
        id: { type: "bigint" },
        username: { type: "text" },
        password: { type: "text "},
        email: { type: "text" },
        permissions: { type: "bigint" },
    }, "id");

    await DataBase.createIndex("users", "users_by_email", "email");

    await DataBase.createTable("allowed_users", true, {
        user_id: { type: "bigint" },
        allowed_id: { type: "bigint" }
    }, "user_id");

    await DataBase.createIndex("allowed_users", "allowed_users_by_allowed_id", "allowed_id");

    await DataBase.createTable("contests", true, {
        id: { type: "bigint" },
        admin_id: { type: "bigint" },
        name: { type: "text" },
        start_time: { type: "timestamp" },
        duration_seconds: { type: "int" },
        public: { type: "boolean" },
        allowed_id: { type: "bigint" }
    }, "id")

    await DataBase.createIndex("contests", "contests_by_admin_id", "admin_id");
    await DataBase.createIndex("contests", "contests_by_name", "name");

    await DataBase.createTable("problems", true, {
        id: { type: "bigint" },
        contest_id: { type: "bigint" },
        title: { type: "text" },
        description: { type: "text" },
        time_limit_millis: { type: "int" },
        memory_limit_megabytes: { type: "int" }
    }, "id");

    await DataBase.createTable("clusters", true, {
        id: { type: "bigint" },
        problem_id: { type: "bigint" },
        awarded_score: { type: "int" }
    }, "id");

    await DataBase.createIndex("clusters", "clusters_by_problem_id", "problem_id");

    await DataBase.createTable("testcases", true,{
        id: { type: "bigint" },
        cluster_id: { type: "bigint" },
        input: { type: "text" },
        correctOutput: { type: "text" }
    }, "id");

    await DataBase.createIndex("testcases", "testcases_by_cluster_id", "cluster_id");

    await DataBase.createTable("evaluation_schemas", true, {
        id: { type: "bigint" },
        problem_id: { type: "bigint" },
        variant: { type: "text" },
        script: { type: "text" }
    }, "id");

    await DataBase.createIndex("evaluation_schemas", "evaluation_schemas_by_problem_id", "problem_id");


    await DataBase.createTable("submissions", true, {
        id: { type: "bigint" },
        user_id: { type: "bigint" },
        problem_id: { type: "bigint" },
        lang: { type: "text" },
        code: { type: "text" },
        verdict: { type: "text" },
        awardedScore: { type: "int" },
        time_used_millis: { type: "int" },
        memory_used_megabytes: { type: "int" },
        completed: { type: "tinyint" }
    }, "id");

    await DataBase.createIndex("submissions", "submissions_by_user_id", "user_id");
    await DataBase.createIndex("submissions", "submissions_by_problem_id", "problem_id");


    await DataBase.createTable("cluster_submissions", true, {
        id: { type: "bigint" },
        submission_id: { type: "bigint" },
        cluster_id: { type: "bigint" },
        verdict: { type: "text" },
        awardedScore: { type: "int" },
        time_used_millis: { type: "int" },
        memory_used_megabytes: { type: "int" },
    }, "id");

    await DataBase.createIndex("cluster_submissions", "cluster_submissions_by_submission_id", "submission_id");
    await DataBase.createIndex("cluster_submissions", "cluster_submissions_by_cluster_id", "cluster_id");

    await DataBase.createTable("testcase_submissions", true, {
        id: { type: "bigint" },
        testcase_id: { type: "bigint" },
        submission_id: { type: "bigint" },
        verdict: { type: "text" },
        awardedScore: { type: "int" },
        time_used_millis: { type: "int" },
        memory_used_megabytes: { type: "int" }
    }, "id");

    await DataBase.createIndex("testcase_submissions", "testcase_submissions_by_testcase_id", "testcase_id");
    await DataBase.createIndex("testcase_submissions", "testcase_submissions_by_submission_id", "submission_id");

};

