import {
    Cluster,
    ClusterSubmission,
    CompilationErrorResult,
    EvaluationLanguage,
    EvaluationResult,
    EvaluationVariant,
    PendingSubmission,
    Problem,
    Snowflake,
    Submission,
    Testcase,
    TestcaseWithOutput,
    User,
} from "@kontestis/models";
import { AxiosError } from "axios";

import { evaluatorAxios } from "../api/evaluatorAxios";
import { Database } from "../database/Database";
import { isContestRunning } from "./contest";
import { evaluateTestcasesNew } from "./evaluation_rs";
import { Logger } from "./logger";
import { completePendingSubmission, storePendingSubmission } from "./pendingSubmission";
import { generateSnowflake } from "./snowflake";
import { getAllTestcases } from "./testcase";

const ERR_UNEXPECTED_STATE = new Error("unexpected state");

export type ProblemDetails = {
    problemId: bigint;
    language: EvaluationLanguage;
    code: string;
    evaluation_variant: EvaluationVariant;
    evaluator?: string;
    evaluator_language?: EvaluationLanguage;
    legacy_evaluation: boolean;
};

export type AxiosEvaluationResponse = [EvaluationResult[], undefined] | [undefined, AxiosError];

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

    const contestMember = await Database.selectOneFrom("contest_members", ["id"], {
        contest_id: contest.id,
        user_id: userId,
    });

    if (!contestMember) return;

    await Database.raw(
        `UPDATE contest_members SET score['${problemId}']=${score} WHERE id=${contestMember.id} AND contest_id=${contest.id} AND user_id=${userId}`
    );
};

const evaluateTestcases = async (
    problemDetails: ProblemDetails,
    testcases: TestcaseWithOutput[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
) => {
    return (await evaluatorAxios
        .post<EvaluationResult[]>(
            "",
            {
                problem_type: problemDetails.evaluation_variant,
                language: problemDetails.language,
                code: problemDetails.code,
                time_limit: problem.time_limit_millis,
                memory_limit: problem.memory_limit_megabytes,
                testcases: testcases.map((testcase) => ({
                    id: testcase.id.toString(),
                    in: testcase.input,
                    out: testcase.correct_output,
                })),
                evaluator_language: problemDetails.evaluator_language,
                evaluator: Buffer.from(problemDetails.evaluator ?? "", "utf8").toString("base64"),
            },
            {
                timeout: 60_000,
            }
        )
        .then((data) => [data.data, undefined])
        .catch((error) => [undefined, error as AxiosError])) as AxiosEvaluationResponse;
};

const GROUP_SIZE_LIMIT = (1 << 25) - (1 << 22);

export const splitAndEvaluateTestcases = async (
    problemDetails: ProblemDetails,
    testcases: TestcaseWithOutput[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
    // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
    const groups: TestcaseWithOutput[][] = [];

    let currentSize = 0;
    let groupId = 0;

    for (const testcase of testcases) {
        if (
            currentSize + testcase.input.length + (testcase.correct_output?.length ?? 0) >
            GROUP_SIZE_LIMIT
        ) {
            groupId++;
            currentSize = 0;
        }

        currentSize += testcase.input.length + (testcase.correct_output?.length ?? 0);

        if (groups.length <= groupId) groups.push([]);

        groups[groupId].push(testcase);
    }

    const data: EvaluationResult[] = [];

    for (const groupTestcases of groups) {
        const [results, error] = await (problemDetails.legacy_evaluation
            ? evaluateTestcases(problemDetails, groupTestcases, problem)
            : evaluateTestcasesNew(
                  {
                      ...problemDetails,
                      code: Buffer.from(problemDetails.code, "base64").toString("utf8"),
                      evaluator:
                          problemDetails.evaluation_variant === "plain"
                              ? undefined
                              : problemDetails.evaluator,
                      evaluator_language:
                          problemDetails.evaluation_variant === "plain"
                              ? undefined
                              : problemDetails.evaluator_language,
                  },
                  groupTestcases,
                  problem
              ));

        if (error) return [undefined, error] as AxiosEvaluationResponse;

        data.push(...results);
    }

    return [data, undefined] as AxiosEvaluationResponse;
};

const evaluateCluster = async (
    problemDetails: ProblemDetails,
    cluster: Cluster,
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">,
    pendingSubmission: PendingSubmission
    // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
    const testcases = await getAllTestcases(cluster);
    const testCasesById: Record<string, Testcase> = {};

    for (const testcase of testcases) testCasesById[testcase.id.toString()] = testcase;

    const [results, error] = await splitAndEvaluateTestcases(problemDetails, testcases, problem);

    if (error || !results) return;

    const clusterTestcases = testcases.map((it) => ({
        ...it,
        evaluationResult: results.find((response) => response.testCaseId === it.id.toString())!,
    }));

    const testCaseScores: {
        testCaseId: bigint;
        score: number;
    }[] = clusterTestcases.map((it) => {
        return {
            testCaseId: it.id,
            score: (() => {
                if (it.evaluationResult.verdict === "accepted") return cluster.awarded_score;

                if (it.evaluationResult.verdict === "custom") {
                    const { extra } = it.evaluationResult;

                    if (!extra.startsWith("partial:")) return 0;

                    const scoreString = extra.slice("partial:".length);

                    if (Number.isNaN(Number(scoreString))) return 0;

                    return Math.round(Number(scoreString) * cluster.awarded_score);
                }

                return 0;
            })(),
        };
    });

    const clusterSubmission: ClusterSubmission = {
        id: generateSnowflake(),
        cluster_id: cluster.id,
        submission_id: pendingSubmission.id,
        verdict:
            clusterTestcases.find((it) => it.evaluationResult.verdict !== "accepted")
                ?.evaluationResult.verdict ?? "accepted",
        awarded_score: testCaseScores.reduce(
            (a, b) => {
                return Math.min(a, b.score);
            },
            testCaseScores.length > 0 ? testCaseScores[0].score : cluster.awarded_score
        ),
        memory_used_megabytes: Math.max(
            0,
            ...clusterTestcases.map((it) =>
                it.evaluationResult.type === "success" ? it.evaluationResult.memory : 0
            )
        ),
        time_used_millis: Math.max(
            0,
            ...clusterTestcases.map((it) =>
                it.evaluationResult.type === "success" ? it.evaluationResult.time : 0
            )
        ),
    };

    await Database.insertInto("cluster_submissions", clusterSubmission);

    await Promise.all(
        results.map((result) =>
            Database.insertInto("testcase_submissions", {
                id: generateSnowflake(),
                testcase_id: BigInt(result.testCaseId),
                cluster_submission_id: clusterSubmission.id,
                verdict: result.verdict,
                awarded_score:
                    testCaseScores.find((it) => it.testCaseId.toString() === result.testCaseId)
                        ?.score ?? 0,
                memory_used_megabytes: result.type === "success" ? result.memory : 0,
                time_used_millis: result.type === "success" ? result.time : 0,
            })
        )
    );

    return {
        ...clusterSubmission,
        compilationError: clusterTestcases.some(
            (it) => it.evaluationResult.verdict === "compilation_error"
        )
            ? (results.find((it) => it.verdict === "compilation_error") as CompilationErrorResult)
                  .error
            : undefined,
    };
};

// NOTE: špaget
export const beginEvaluation = async (
    user: User,
    problemDetails: ProblemDetails,
    afterEnd?: (submission: Submission) => Promise<void> | void
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

    for (const testcase of testcases) testCasesById[testcase.id.toString()] = testcase;

    if (!problem) throw ERR_UNEXPECTED_STATE;

    const _ = await (async () => {
        const clusterSubmissions = await Promise.all(
            clusters.map((c) => evaluateCluster(problemDetails, c, problem, pendingSubmission))
        );

        // eslint-disable-next-line unicorn/prefer-includes
        const error = clusterSubmissions.some((c) => c === undefined);

        const verdict = error
            ? "evaluation_error"
            : clusterSubmissions.find((it) => it!.verdict !== "accepted")?.verdict ?? "accepted";

        const time = Math.max(0, ...clusterSubmissions.map((it) => it?.time_used_millis ?? 0));
        const memory = Math.max(
            0,
            ...clusterSubmissions.map((it) => it?.memory_used_megabytes ?? 0)
        );

        const score = error
            ? 0
            : clusterSubmissions.reduce(
                  (accumulator, current) => accumulator + (current?.awarded_score ?? 0),
                  0
              );

        const newSubmission: Submission = {
            ...pendingSubmission,
            problem_id: problemDetails.problemId,
            awarded_score: score,
            verdict: verdict,
            error:
                verdict === "compilation_error"
                    ? clusterSubmissions.find(
                          (submission) => submission?.verdict === "compilation_error"
                      )?.compilationError
                    : undefined,
            time_used_millis: time,
            memory_used_megabytes: memory,
        } as Submission;

        await Promise.all([
            Database.insertInto("submissions", newSubmission),
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

        if (afterEnd) {
            try {
                await afterEnd(newSubmission);
            } catch (error) {
                Logger.error("submission evaluation listener failed", error as any);
            }
        }
    })();

    return pendingSubmission.id;
};
