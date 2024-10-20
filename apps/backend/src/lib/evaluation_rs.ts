import assert from "node:assert";

import {
    EvaluationLanguage,
    EvaluationResult,
    Problem,
    TestcaseWithOutput,
} from "@kontestis/models";
import { Static, Type } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";

import { Globals } from "../globals";
import { Redis } from "../redis/Redis";
import { AxiosEvaluationResponse, ProblemDetails } from "./evaluation";
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
    testcases: TestcaseWithOutput[],
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
    testcases: TestcaseWithOutput[],
    _problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
): { OutputOnly: OutputOnlyEvaluationPayload } => ({
    OutputOnly: {
        id: evaluationId,
        output: problemDetails.code,
        // FIXME:
        testcase: {
            id: testcases[0].id.toString(),
            input: testcases[0].input,
            output: testcases[0].correct_output,
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
    testcases: TestcaseWithOutput[],
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
    testcases: Type.Array(
        Type.Object({
            id: Type.String(),
            verdict: VerdictSchema,
            time: Type.Number(),
            memory: Type.Number(),
            error: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        })
    ),
});

const CompiledSuccessfulEvaluationSchema = TypeCompiler.Compile(SuccessfulEvaluationSchema);

type SuccessfulEvaluationRS = Static<typeof SuccessfulEvaluationSchema>;

const convertSuccessfulEvaluationToEvaluationResult = (
    evaluation: SuccessfulEvaluationRS
): EvaluationResult[] => {
    // TODO:
    return evaluation.testcases.map(
        (it) =>
            ({
                testCaseId: it.id,
                type:
                    it.verdict.type === "accepted"
                        ? "success"
                        : it.verdict.type === "skipped"
                        ? "skipped"
                        : "error",
                verdict: it.verdict.type,
                time: it.time,
                memory: it.memory / 1024,
                error: it.error + "",
                exitCode: 0,
                extra: it.verdict.type === "custom" ? it.verdict.data ?? "" : "",
            } as EvaluationResult)
    );
};

export const evaluateTestcasesNew = async (
    problemDetails: ProblemDetails,
    testcases: TestcaseWithOutput[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
): Promise<AxiosEvaluationResponse> => {
    const evaluationId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    const payload = {
        BeginEvaluation:
            problemDetails.evaluation_variant === "output-only"
                ? generateOutputOnlyPayload(evaluationId, problemDetails, testcases, problem)
                : problemDetails.evaluation_variant === "interactive"
                ? generateInteractivePayload(evaluationId, problemDetails, testcases, problem)
                : generateBatchPayload(evaluationId, problemDetails, testcases, problem),
    };

    const cloned = Redis.duplicate();

    await cloned.connect();

    // TODO: make global queue, so connections are not repeated
    //  also maybe memory leak here, ^ will fix
    const evaluationResponse = new Promise<SuccessfulEvaluationRS>((resolve) => {
        cloned.subscribe(Globals.evaluatorRedisPubSubChannel, (message) => {
            try {
                const parsed = JSON.parse(message);

                const valid = CompiledSuccessfulEvaluationSchema.Check(parsed);

                if (valid && parsed.evaluation_id === evaluationId)
                    resolve(parsed as SuccessfulEvaluationRS);
            } catch (error) {
                Logger.error("failed parsing evaluator response", error + "");
            }
        });
    });

    await Redis.rPush(Globals.evaluatorRedisQueueKey, JSON.stringify(payload));
    const response = await evaluationResponse.finally(() => cloned.disconnect());

    return [convertSuccessfulEvaluationToEvaluationResult(response), undefined];
};
