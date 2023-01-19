import axios, { AxiosError } from "axios";

import { Database } from "../database/Database";
import { Globals } from "../globals";
import { generateSnowflake } from "../lib/snowflake";
import { EvaluationLanguage, Submission } from "../types/Submission";
import { User } from "../types/User";

type ProblemDetails = {
    problemId: bigint;
    language: EvaluationLanguage;
    code: string;
};

type EvaluationResult = {
    testCaseId: string;
} & (
    | {
          type: "success";
          verdict:
              | "accepted"
              | "wrong_answer"
              | "time_limit_exceeded"
              | "memory_limit_exceeded";
          time: number;
          memory: number;
      }
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

    if (!problem) throw new Error("unexpected state");

    const _ = (async () => {
        console.log({
            language: problemDetails.language,
            code: problemDetails.code,
            time_limit: problem.time_limit_millis,
            testcases: testcases.map((testcase) => ({
                id: testcase.id.toString(),
                in: testcase.input.replace("\n", " "),
                out: testcase.correctoutput?.replace("\n", " "),
            })),
        });

        const [response, error] = (await axios
            .post<EvaluationResult>(
                Globals.evaluatorEndpoint,
                {
                    language: problemDetails.language,
                    code: problemDetails.code,
                    time_limit: problem.time_limit_millis,
                    testcases: testcases.map((testcase) => ({
                        id: testcase.id.toString(),
                        in: testcase.input.replace("\n", " "),
                        out: testcase.correctoutput?.replace("\n", " "),
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

        if (error || !response) {
            console.log("evaluator failed", submission.id, error);

            return;
        }

        await Promise.all(
            response.map((result) =>
                Database.insertInto("testcase_submissions", {
                    id: generateSnowflake(),
                    testcase_id: BigInt(result.testCaseId),
                    submission_id: submission.id,
                    verdict: result.verdict,
                    awardedscore: 0,
                    memory_used_megabytes:
                        result.type === "success" ? result.memory : 0,
                    time_used_millis:
                        result.type === "success" ? result.time : 0,
                })
            )
        );

        await Promise.all(
            clusters.map((cluster) => {
                const clusterTestcases = testcases
                    .filter((testcase) => testcase.cluster_id === cluster.id)
                    .map((it) => ({
                        ...it,
                        evaluationResult: response.find(
                            (response) =>
                                response.testCaseId === it.id.toString()
                        )!,
                    }));

                Database.insertInto("cluster_submissions", {
                    id: generateSnowflake(),
                    cluster_id: cluster.id,
                    submission_id: submission.id,
                    verdict:
                        clusterTestcases.find(
                            (it) => it.evaluationResult.verdict !== "accepted"
                        )?.evaluationResult.verdict ?? "accepted",
                    awardedscore: clusterTestcases.some(
                        (it) => it.evaluationResult.verdict !== "accepted"
                    )
                        ? cluster.awarded_score
                        : 0,
                    memory_used_megabytes: clusterTestcases.reduce(
                        (accumulator, current) =>
                            accumulator +
                            (current.evaluationResult.type === "success"
                                ? current.evaluationResult.memory
                                : 0),
                        0
                    ),
                    time_used_millis: clusterTestcases.reduce(
                        (accumulator, current) =>
                            accumulator +
                            (current.evaluationResult.type === "success"
                                ? current.evaluationResult.time
                                : 0),
                        0
                    ),
                });
            })
        );

        await Database.update(
            "submissions",
            {
                completed: true,
            },
            { id: submission.id }
        );
    })();

    return submission.id;
};
