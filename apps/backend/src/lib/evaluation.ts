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
    SuccessfulEvaluationResult,
    Testcase,
} from "@kontestis/models";
import { AxiosError } from "axios";

import { evaluatorAxios } from "../api/evaluatorAxios";
import { Database } from "../database/Database";
import { Globals } from "../globals";
import { Redis } from "../redis/Redis";
import { RedisKeys } from "../redis/RedisKeys";
import { S3Client } from "../s3/S3";
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

const updateContestMemberScore = async (
    problemId: Snowflake,
    userId: Snowflake,
    createdAt: Date,
    score: number
) => {
    const problem = await Database.selectOneFrom("problems", ["contest_id"], { id: problemId });

    if (!problem) throw ERR_UNEXPECTED_STATE;

    const contest = await Database.selectOneFrom(
        "contests",
        ["id", "start_time", "duration_seconds"],
        { id: problem.contest_id }
    );

    if (!contest) throw ERR_UNEXPECTED_STATE;

    if (!isContestRunning(contest, createdAt.getTime())) return;

    const contestMember = await Database.selectOneFrom("contest_members", ["id", "score"], {
        contest_id: contest.id,
        user_id: userId,
    });

    if (!contestMember) return;

    if (contestMember.score[problemId.toString()] >= score) return;

    await Database.raw(
        `UPDATE contest_members SET score['${problemId}']=${score} WHERE id=${contestMember.id} AND contest_id=${contest.id} AND user_id=${userId}`
    );
};

const evaluateTestcases = async (
    problemDetails: ProblemDetails,
    testcases: EvaluationInputTestcase[],
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

export type EvaluationInputTestcase = {
    id: Snowflake;
    input: string;
    correct_output: string;
};

export const splitAndEvaluateTestcases = async (
    problemDetails: ProblemDetails,
    testcases: EvaluationInputTestcase[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">,
    evaluate_all: boolean = false
    // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
    const groups: EvaluationInputTestcase[][] = [];

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

        while (groups.length <= groupId) groups.push([]);

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
                  problem,
                  evaluate_all
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
    const testcases = await getAllTestcases(cluster).then((testcases) =>
        problemDetails.evaluation_variant === "output-only" ? testcases.slice(0, 1) : testcases
    );

    const testCasesById: Record<string, Testcase> = {};

    for (const testcase of testcases) testCasesById[testcase.id.toString()] = testcase;

    const [results, error] = await splitAndEvaluateTestcases(problemDetails, testcases, problem);

    if (error || !results) return;

    await Promise.all(
        results
            .filter((result) => result.type === "success" && result.output)
            .map((result) =>
                S3Client.putObject(
                    Globals.s3.buckets.submission_meta,
                    `${pendingSubmission.id}/${cluster.id}/${result.testCaseId}.sout`,
                    (result as SuccessfulEvaluationResult).output ?? ""
                )
            )
    );

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
        results.map((result) => {
            const testcase = testCasesById[result.testCaseId];
            const submissionOutputFile =
                result.type === "success" && result.output
                    ? `${pendingSubmission.id}/${cluster.id}/${result.testCaseId}.sout`
                    : undefined;

            return Database.insertInto("testcase_submissions", {
                id: generateSnowflake(),
                testcase_id: BigInt(result.testCaseId),
                cluster_submission_id: clusterSubmission.id,
                verdict: result.verdict,
                awarded_score:
                    testCaseScores.find((it) => it.testCaseId.toString() === result.testCaseId)
                        ?.score ?? 0,
                memory_used_megabytes: result.type === "success" ? result.memory : 0,
                time_used_millis: result.type === "success" ? result.time : 0,
                input_file: testcase?.input_file,
                output_file: testcase?.output_file,
                submission_output_file: submissionOutputFile,
            });
        })
    );

    return {
        ...clusterSubmission,
        // only if verdict is "compilation_error", legacy?
        compilationError: clusterTestcases.some(
            (it) => it.evaluationResult.verdict === "compilation_error"
        )
            ? (results.find((it) => it.verdict === "compilation_error") as CompilationErrorResult)
                  .error
            : undefined,
        compilerOutput: results.find((it) => it.compiler_output)?.compiler_output,
    };
};

// NOTE: špaget
export const beginEvaluation = async (
    userId: Snowflake,
    problemDetails: ProblemDetails,
    afterEnd?: (submission: Submission) => Promise<void> | void,
    existingSubmission?: Submission
    // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
    const pendingSubmission: PendingSubmission = {
        id: existingSubmission?.id ?? generateSnowflake(),
        created_at: existingSubmission?.created_at ?? new Date(),
        user_id: userId,
        language: problemDetails.language,
        code: problemDetails.code,
    };

    existingSubmission
        ? await Redis.sAdd(
              RedisKeys.REEVALUATION_IDS(problemDetails.problemId),
              existingSubmission.id.toString()
          )
        : await storePendingSubmission(
              {
                  userId: userId,
                  problemId: problemDetails.problemId,
              },
              pendingSubmission
          );

    const removeReevaluationIdTimeout = existingSubmission
        ? setTimeout(async () => {
              await Redis.sRem(
                  RedisKeys.REEVALUATION_IDS(problemDetails.problemId),
                  existingSubmission.id.toString()
              );
          }, 1000 * 300)
        : undefined;

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

    const exitingClusters = await Database.selectFrom("cluster_submissions", ["id"], {
        submission_id: pendingSubmission.id,
    });

    await Promise.all(
        exitingClusters.map((ec) =>
            Database.update(
                "cluster_submissions",
                { submission_id: -pendingSubmission.id },
                { id: ec.id }
            )
        )
    );

    const _ = (async () => {
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
            compiler_output: clusterSubmissions.find((it) => it?.compilerOutput)?.compilerOutput,
        } as Submission;

        await Promise.all([
            existingSubmission
                ? Database.update(
                      "submissions",
                      {
                          awarded_score: newSubmission.awarded_score,
                          verdict: newSubmission.verdict,
                          compiler_output: newSubmission.compiler_output,
                          memory_used_megabytes: newSubmission.memory_used_megabytes,
                          time_used_millis: newSubmission.time_used_millis,
                          error:
                              verdict === "compilation_error"
                                  ? clusterSubmissions.find(
                                        (submission) => submission?.verdict === "compilation_error"
                                    )?.compilationError
                                  : undefined,
                      },
                      { id: newSubmission.id }
                  )
                : Database.insertInto("submissions", newSubmission),
            updateContestMemberScore(
                problemDetails.problemId,
                userId,
                new Date(newSubmission.created_at.toString()),
                score
            ),
        ]).catch((error) => Logger.error("submission store failed: ", error + ""));

        // I know I can put this in Promise.all, but it needs to be removed
        // from redis after we have successfully stored it in the database
        existingSubmission
            ? await Redis.sRem(
                  RedisKeys.REEVALUATION_IDS(problemDetails.problemId),
                  existingSubmission.id.toString()
              )
            : await completePendingSubmission(
                  {
                      userId: userId,
                      problemId: problemDetails.problemId,
                  },
                  pendingSubmission.id
              );
        clearTimeout(removeReevaluationIdTimeout);

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
