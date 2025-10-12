import assert from "node:assert";

import { EvaluationLanguage, EvaluationResult, Problem } from "@kontestis/models";
import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { Globals } from "../globals";
import { Redis } from "../redis/Redis";
import { RedisKeys } from "../redis/RedisKeys";
import { AxiosEvaluationResponse, EvaluationInputTestcase, ProblemDetails } from "./evaluation";
import { Logger } from "./logger";

type EvaluationTestcase = {
    id: string;
    input: string;
    output: string;
};

type BatchEvaluationPayload = {
    id: number;
    code: string;
    language: EvaluationLanguage;
    testcases: EvaluationTestcase[];
    time_limit: number;
    memory_limit: number;
    checker?: {
        script: string;
        language: EvaluationLanguage;
    };
};

type InteractiveEvaluationPayload = Omit<BatchEvaluationPayload, "checker"> & {
    checker: {
        script: string;
        language: EvaluationLanguage;
    };
};

type OutputOnlyEvaluationPayload = Pick<BatchEvaluationPayload, "id" | "checker"> & {
    output: string;
    testcase: EvaluationTestcase;
};

const generateBatchPayload = (
    evaluationId: number,
    problemDetails: ProblemDetails,
    testcases: EvaluationInputTestcase[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
): { Batch: BatchEvaluationPayload } => ({
    Batch: {
        id: evaluationId,
        code: problemDetails.code,
        language: problemDetails.language,
        testcases: testcases.map((it) => ({
            id: it.id.toString(),
            input: it.input,
            output: it.correct_output,
        })),
        time_limit: problem.time_limit_millis,
        memory_limit: problem.memory_limit_megabytes * 1024,
        checker:
            problemDetails.evaluator && problemDetails.evaluator_language
                ? {
                      script: problemDetails.evaluator,
                      language: problemDetails.evaluator_language,
                  }
                : undefined,
    },
});

const generateOutputOnlyPayload = (
    evaluationId: number,
    problemDetails: ProblemDetails,
    testcase: EvaluationInputTestcase,
    _problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
): { OutputOnly: OutputOnlyEvaluationPayload } => ({
    OutputOnly: {
        id: evaluationId,
        output: problemDetails.code,
        testcase: {
            id: testcase.id.toString(),
            input: testcase.input,
            output: testcase.correct_output ?? "",
        },
        checker:
            problemDetails.evaluator && problemDetails.evaluator_language
                ? {
                      script: problemDetails.evaluator,
                      language: problemDetails.evaluator_language,
                  }
                : undefined,
    },
});

const generateInteractivePayload = (
    evaluationId: number,
    problemDetails: ProblemDetails,
    testcases: EvaluationInputTestcase[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
): { Interactive: InteractiveEvaluationPayload } => {
    assert(problemDetails.evaluator !== undefined);
    assert(problemDetails.evaluator_language !== undefined);

    return {
        Interactive: {
            ...generateBatchPayload(evaluationId, problemDetails, testcases, problem).Batch,
            checker: {
                script: problemDetails.evaluator,
                language: problemDetails.evaluator_language,
            },
        },
    };
};

const VerdictSchema = Type.Object({
    type: Type.String(),
    data: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const SuccessfulEvaluationSchema = Type.Object({
    evaluation_id: Type.Number(),
    verdict: VerdictSchema,
    max_time: Type.Number(),
    max_memory: Type.Number(),
    compiler_output: Type.Optional(Type.Union([Type.String(), Type.Null()])),
    testcases: Type.Array(
        Type.Object({
            id: Type.String(),
            verdict: VerdictSchema,
            time: Type.Number(),
            memory: Type.Number(),
            error: Type.Optional(Type.Union([Type.String(), Type.Null()])),
            output: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        })
    ),
});

export const CompiledSuccessfulEvaluationSchema = TypeCompiler.Compile(SuccessfulEvaluationSchema);

export type SuccessfulEvaluationRS = Static<typeof SuccessfulEvaluationSchema>;

const convertSuccessfulEvaluationToEvaluationResult = (
    evaluation: SuccessfulEvaluationRS,
    testcases: EvaluationInputTestcase[]
): EvaluationResult[] => {
    if (evaluation.verdict.type === "compilation_error")
        return testcases.map((testcase) => ({
            testCaseId: testcase.id.toString(),
            type: "error",
            verdict: "compilation_error",
            error: evaluation.verdict.data ?? "",
            compiler_output: evaluation.compiler_output ?? undefined,
        }));

    return evaluation.testcases.map((testcase) => {
        switch (testcase.verdict.type) {
            case "accepted":
            case "wrong_answer":
            case "time_limit_exceeded":
            case "memory_limit_exceeded": {
                return {
                    testCaseId: testcase.id,
                    type: "success",
                    verdict: testcase.verdict.type,
                    time: testcase.time,
                    memory: testcase.memory / 1024,
                    output: testcase.output ?? undefined,
                    compiler_output: evaluation.compiler_output ?? undefined,
                } satisfies EvaluationResult;
            }
            case "custom": {
                return {
                    testCaseId: testcase.id,
                    type: "success",
                    verdict: "custom",
                    time: testcase.time,
                    memory: testcase.memory / 1024,
                    extra: testcase.verdict.data ?? "",
                    compiler_output: evaluation.compiler_output ?? undefined,
                };
            }
            case "compilation_error": {
                return {
                    testCaseId: testcase.id,
                    type: "error",
                    verdict: "compilation_error",
                    error: testcase.error ?? "",
                    compiler_output: evaluation.compiler_output ?? undefined,
                };
            }
            case "runtime_error": {
                return {
                    testCaseId: testcase.id,
                    type: "error",
                    verdict: "runtime_error",
                    exitCode: 1,
                    compiler_output: evaluation.compiler_output ?? undefined,
                };
            }
            case "skipped": {
                return {
                    testCaseId: testcase.id,
                    type: "skipped",
                    verdict: "skipped",
                };
            }
            case "evaluation_error":
            default:
                return {
                    testCaseId: testcase.id,
                    type: "error",
                    verdict: "evaluation_error",
                };
        }
    }) satisfies EvaluationResult[];
};

const PendingListeners: Record<number, (response: SuccessfulEvaluationRS) => void> = {};

export const subscribeToEvaluatorResponseQueue = async () => {
    const redisCloned = Redis.duplicate();

    await redisCloned.connect();

    try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const result = await redisCloned.blPop(RedisKeys.EVALUATION_RESULT_QUEUE, 0); // Waits indefinitely for data

            if (!result) continue;

            const message = result.element;

            // Logger.debug("Got message: " + message);

            try {
                const parsed = JSON.parse(message);

                const valid = CompiledSuccessfulEvaluationSchema.Check(parsed);

                if (!valid) {
                    Logger.error(
                        "failed validating evaluator response: " +
                            JSON.stringify(CompiledSuccessfulEvaluationSchema.Errors)
                    );

                    continue;
                }

                Logger.info("Find pending listener for evaluation id: " + parsed.evaluation_id);

                if (!PendingListeners[parsed.evaluation_id]) continue;

                Logger.info("Pending listener found!");

                PendingListeners[parsed.evaluation_id](parsed as SuccessfulEvaluationRS);
                delete PendingListeners[parsed.evaluation_id];
            } catch (error) {
                Logger.error("failed parsing evaluator response", error + "");
            }
        }
    } catch (error) {
        console.error("Error pulling from queue:", error, "retrying in 10s");
        redisCloned.disconnect();
        setTimeout(subscribeToEvaluatorResponseQueue, 10_000);
    }
};

export const evaluateTestcasesNew = async (
    problemDetails: ProblemDetails,
    testcases: EvaluationInputTestcase[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
): Promise<AxiosEvaluationResponse> => {
    const evaluationId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    const payload = {
        BeginEvaluation: {
            output_queue: RedisKeys.EVALUATION_RESULT_QUEUE,
            evaluation:
                problemDetails.evaluation_variant === "output-only"
                    ? generateOutputOnlyPayload(evaluationId, problemDetails, testcases[0], problem)
                    : problemDetails.evaluation_variant === "interactive"
                    ? generateInteractivePayload(evaluationId, problemDetails, testcases, problem)
                    : generateBatchPayload(evaluationId, problemDetails, testcases, problem),
        },
    };

    const evaluationResponse = new Promise<SuccessfulEvaluationRS>((resolve) => {
        PendingListeners[evaluationId] = resolve;
        Logger.info(`Setup pending listener for evaluation if ${evaluationId}`);
    });

    Logger.info(`Sending evaluation id ${evaluationId} to evaluator!`);
    await Redis.rPush(Globals.evaluatorRedisQueueKey, JSON.stringify(payload));
    const response = await evaluationResponse;

    return [convertSuccessfulEvaluationToEvaluationResult(response, testcases), undefined];
};
