import axios, { AxiosError } from "axios";

import { Database } from "../database/Database";
import { Globals } from "../globals";
import { generateSnowflake } from "../lib/snowflake";
import { ClusterSubmission } from "../types/ClusterSubmission";
import { EvaluationLanguage, Submission } from "../types/Submission";
import { Testcase } from "../types/Testcase";
import { User } from "../types/User";

type ProblemDetails = {
    problemId: bigint;
    language: EvaluationLanguage;
    code: string;
};

type SuccessfulEvaluationResult = {
    type: "success";
    verdict:
        | "accepted"
        | "wrong_answer"
        | "time_limit_exceeded"
        | "memory_limit_exceeded";
    time: number;
    memory: number;
};

type EvaluationResult = {
    testCaseId: string;
} & (
    | SuccessfulEvaluationResult
    | {
          type: "error";
          verdict: "runtime_error";
          exitCode: number;
      }
    | {
          type: "error";
          verdict: "compilation_error" | "evaluation_error";
      }
);

type AxiosEvaluationResponse =
    | [EvaluationResult[], undefined]
    | [undefined, AxiosError];

export const beginEvaluation = async (
    user: User,
    problemDetails: ProblemDetails
    // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
    const submission: Submission = {
        id: generateSnowflake(),
        user_id: user.id,
        problem_id: problemDetails.problemId,
        language: problemDetails.language,
        code: problemDetails.code,
        completed: false,
    };

    await Database.insertInto("submissions", submission);

    const problem = await Database.selectOneFrom(
        "problems",
        ["time_limit_millis"],
        { id: problemDetails.problemId }
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

    for (const t of testcases) testCasesById[t.id + ""] = t;

    if (!problem) throw new Error("unexpected state");

    const _ = (async () => {
        const [results, error] = (await axios
            .post<EvaluationResult>(
                Globals.evaluatorEndpoint,
                {
                    language: problemDetails.language,
                    code: problemDetails.code,
                    time_limit: problem.time_limit_millis,
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
            .catch((error) => [
                undefined,
                error as AxiosError,
            ])) as AxiosEvaluationResponse;

        if (error || !results) {
            console.log("evaluator failed", submission.id, error);

            return;
        }

        const verdict =
            results.find((it) => it.verdict !== "accepted")?.verdict ??
            "accepted";

        const successfulResults = results
            .filter((result) => result.type === "success")
            .map((result) => result as SuccessfulEvaluationResult);

        const time = Math.max(0, ...successfulResults.map((it) => it.time));
        const memory = Math.max(0, ...successfulResults.map((it) => it.memory));

        const clusterSubmissions = await Promise.all(
            clusters.map(async (cluster) => {
                const clusterTestcases = testcases
                    .filter((testcase) => testcase.cluster_id === cluster.id)
                    .map((it) => ({
                        ...it,
                        evaluationResult: results.find(
                            (response) =>
                                response.testCaseId === it.id.toString()
                        )!,
                    }));

                const clusterSubmission: ClusterSubmission = {
                    id: generateSnowflake(),
                    cluster_id: cluster.id,
                    submission_id: submission.id,
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

                await Database.insertInto(
                    "cluster_submissions",
                    clusterSubmission
                );

                return clusterSubmission;
            })
        );

        const clusterSubmissionsByClusterId: Record<string, ClusterSubmission> =
            {};

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
                    memory_used_megabytes:
                        result.type === "success" ? result.memory : 0,
                    time_used_millis:
                        result.type === "success" ? result.time : 0,
                })
            )
        );

        await Database.update(
            "submissions",
            {
                completed: true,
                awarded_score: clusterSubmissions.reduce(
                    (accumulator, current) =>
                        accumulator + current.awarded_score,
                    0
                ),
                verdict: verdict,
                time_used_millis: time,
                memory_used_megabytes: memory,
            },
            { id: submission.id }
        );
    })();

    return submission.id;
};
