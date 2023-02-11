import {
    ClusterSubmission,
    CompilationErrorResult,
    EvaluationLanguage,
    EvaluationResult,
    PendingSubmission,
    Snowflake,
    SuccessfulEvaluationResult,
    Testcase,
    User,
} from "@kontestis/models";
import axios, { AxiosError } from "axios";

import { Database } from "../database/Database";
import { Globals } from "../globals";
import { isContestRunning } from "./contest";
import { completePendingSubmission, storePendingSubmission } from "./pendingSubmission";
import { generateSnowflake } from "./snowflake";

const ERR_UNEXPECTED_STATE = new Error("unexpected state");

type ProblemDetails = {
    problemId: bigint;
    language: EvaluationLanguage;
    code: string;
};

type AxiosEvaluationResponse = [EvaluationResult[], undefined] | [undefined, AxiosError];

const updateContestMember = async (problemId: Snowflake, userId: Snowflake, score: number) => {
    const problem = await Database.selectOneFrom("problems", ["contest_id"], { id: problemId });

    if (!problem) throw ERR_UNEXPECTED_STATE;

    const contest = await Database.selectOneFrom(
        "contests",
        ["id", "start_time", "duration_seconds"],
        { id: problem.contest_id }
    );

    if (!contest) throw ERR_UNEXPECTED_STATE;

    if (!isContestRunning(contest)) return;

    // TODO: figure out how to do contest_id, user_id queries in scylla
    const contestMember = await Database.selectOneFrom("contest_members", ["id"], {
        contest_id: contest.id,
        user_id: userId,
    });

    if (!contestMember) return;

    await Database.raw(
        `UPDATE contest_members SET score[${problemId}]=${score} WHERE id=${contestMember.id} AND contest_id=${contest.id} AND user_id=${userId}`
    );
};

export const beginEvaluation = async (
    user: User,
    problemDetails: ProblemDetails
    // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
    const pendingSubmission: PendingSubmission = {
        id: generateSnowflake(),
        created_at: new Date(),
        user_id: user.id,
        language: problemDetails.language,
        code: problemDetails.code,
    };

    await storePendingSubmission(
        {
            userId: user.id,
            problemId: problemDetails.problemId,
        },
        pendingSubmission
    );

    const problem = await Database.selectOneFrom(
        "problems",
        ["time_limit_millis", "memory_limit_megabytes"],
        {
            id: problemDetails.problemId,
        }
    );

    const clusters = await Database.selectFrom("clusters", "*", {
        problem_id: problemDetails.problemId,
    });

    const testcases = (
        await Promise.all(
            clusters.map((cluster) =>
                Database.selectFrom("testcases", "*", {
                    cluster_id: cluster.id,
                })
            )
        )
    ).flat();

    const testCasesById: Record<string, Testcase> = {};

    for (const testcase of testcases) testCasesById[testcase.id + ""] = testcase;

    if (!problem) throw ERR_UNEXPECTED_STATE;

    const _ = (async () => {
        const [results, error] = (await axios
            .post<EvaluationResult>(
                Globals.evaluatorEndpoint,
                {
                    language: problemDetails.language,
                    code: problemDetails.code,
                    time_limit: problem.time_limit_millis,
                    memory_limit: problem.memory_limit_megabytes,
                    testcases: testcases.map((testcase) => ({
                        id: testcase.id.toString(),
                        in: testcase.input,
                        out: testcase.correct_output,
                    })),
                },
                {
                    timeout: 60_000,
                }
            )
            .then((data) => [data.data, undefined])
            .catch((error) => [undefined, error as AxiosError])) as AxiosEvaluationResponse;

        const verdict = error
            ? "evaluation_error"
            : results.find((it) => it.verdict !== "accepted")?.verdict ?? "accepted";

        const successfulResults = (results ?? [])
            .filter((result) => result.type === "success")
            .map((result) => result as SuccessfulEvaluationResult);

        const time = Math.max(0, ...successfulResults.map((it) => it.time));
        const memory = Math.max(0, ...successfulResults.map((it) => it.memory));

        let clusterSubmissions: ClusterSubmission[] = [];

        if (!error && results) {
            clusterSubmissions = await Promise.all(
                clusters.map(async (cluster) => {
                    const clusterTestcases = testcases
                        .filter((testcase) => testcase.cluster_id === cluster.id)
                        .map((it) => ({
                            ...it,
                            evaluationResult: results.find(
                                (response) => response.testCaseId === it.id.toString()
                            )!,
                        }));

                    const clusterSubmission: ClusterSubmission = {
                        id: generateSnowflake(),
                        cluster_id: cluster.id,
                        submission_id: pendingSubmission.id,
                        verdict:
                            clusterTestcases.find(
                                (it) => it.evaluationResult.verdict !== "accepted"
                            )?.evaluationResult.verdict ?? "accepted",
                        awarded_score: clusterTestcases.every(
                            (it) => it.evaluationResult.verdict === "accepted"
                        )
                            ? cluster.awarded_score
                            : 0,
                        memory_used_megabytes: Math.max(
                            0,
                            ...clusterTestcases.map((it) =>
                                it.evaluationResult.type === "success"
                                    ? it.evaluationResult.memory
                                    : 0
                            )
                        ),
                        time_used_millis: Math.max(
                            0,
                            ...clusterTestcases.map((it) =>
                                it.evaluationResult.type === "success"
                                    ? it.evaluationResult.time
                                    : 0
                            )
                        ),
                    };

                    await Database.insertInto("cluster_submissions", clusterSubmission);

                    return clusterSubmission;
                })
            );

            const clusterSubmissionsByClusterId: Record<string, ClusterSubmission> = {};

            for (const c of clusterSubmissions)
                clusterSubmissionsByClusterId[c.cluster_id + ""] = c;

            await Promise.all(
                results.map((result) =>
                    Database.insertInto("testcase_submissions", {
                        id: generateSnowflake(),
                        testcase_id: BigInt(result.testCaseId),
                        // TODO: Maybe do this better
                        cluster_submission_id:
                            clusterSubmissionsByClusterId[
                                testCasesById[result.testCaseId].cluster_id + ""
                            ].id,
                        verdict: result.verdict,
                        awarded_score: 0,
                        memory_used_megabytes: result.type === "success" ? result.memory : 0,
                        time_used_millis: result.type === "success" ? result.time : 0,
                    })
                )
            );
        }

        const score = error
            ? 0
            : clusterSubmissions.reduce(
                  (accumulator, current) => accumulator + current.awarded_score,
                  0
              );

        await Promise.all([
            Database.insertInto("submissions", {
                ...pendingSubmission,
                problem_id: problemDetails.problemId,
                awarded_score: score,
                verdict: verdict,
                error:
                    verdict === "compilation_error"
                        ? (
                              results?.find(
                                  (result) => result.verdict === "compilation_error"
                              ) as CompilationErrorResult
                          ).error
                        : undefined,
                time_used_millis: time,
                memory_used_megabytes: memory,
            }),
            updateContestMember(problemDetails.problemId, user.id, score),
        ]);

        // I know I can put this in Promise.all, but it needs to be removed
        // from redis after we have successfully stored it in the database
        await completePendingSubmission(
            {
                userId: user.id,
                problemId: problemDetails.problemId,
            },
            pendingSubmission.id
        );
    })();

    return pendingSubmission.id;
};
