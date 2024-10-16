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
import { ProblemDetails } from "./evaluation";
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
    problemDetails: ProblemDetails,
    testcases: TestcaseWithOutput[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
): BatchEvaluationPayload => ({
    id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
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
});

const generateOutputOnlyPayload = (
    problemDetails: ProblemDetails,
    testcases: TestcaseWithOutput[],
    _problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
): OutputOnlyEvaluationPayload => ({
    id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
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
});

const generateInteractivePayload = (
    problemDetails: ProblemDetails,
    testcases: TestcaseWithOutput[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
): InteractiveEvaluationPayload => {
    assert(problemDetails.evaluator !== undefined);
    assert(problemDetails.evaluator_language !== undefined);

    return {
        ...generateBatchPayload(problemDetails, testcases, problem),
        checker: {
            script: problemDetails.evaluator,
            language: problemDetails.evaluator_language,
        },
    };
};

const SuccessfulEvaluationSchema = Type.Object({
    evaluation_id: Type.Number(),
    verdict: Type.String(),
    max_time: Type.Number(),
    max_memory: Type.Number(),
    testcases: Type.Array(
        Type.Object({
            id: Type.String(),
            verdict: Type.String(),
            time: Type.Number(),
            memory: Type.Number(),
            error: Type.Optional(Type.String()),
        })
    ),
});

const CompiledSuccessfulEvaluationSchema = TypeCompiler.Compile(SuccessfulEvaluationSchema);

type SuccessfulEvaluationRS = Static<typeof SuccessfulEvaluationSchema>;

const convertSuccessfulEvaluationToEvaluationResult = (
    evaluation: SuccessfulEvaluationRS
): EvaluationResult[] => {
    // TODO:
    return [];
};

const evaluateTestcasesNew = async (
    problemDetails: ProblemDetails,
    testcases: TestcaseWithOutput[],
    problem: Pick<Problem, "time_limit_millis" | "memory_limit_megabytes">
) => {
    const payload = {
        BeginEvaluation:
            problemDetails.evaluation_variant === "output-only"
                ? generateOutputOnlyPayload(problemDetails, testcases, problem)
                : problemDetails.evaluation_variant === "interactive"
                ? generateInteractivePayload(problemDetails, testcases, problem)
                : generateBatchPayload(problemDetails, testcases, problem),
    };

    await Redis.rPush(Globals.evaluatorRedisQueueKey, JSON.stringify(payload));

    const cloned = Redis.duplicate();

    await cloned.connect();

    // FIXME: edge case, evaluator can maybe be too fast
    // TODO: make global queue, so connections are not repeated
    //  also maybe memory leak here, ^ will fix
    return await new Promise<EvaluationResult[]>((resolve) => {
        cloned
            .subscribe(Globals.evaluatorRedisPubSubChannel, (message) => {
                try {
                    const parsed = JSON.parse(message);

                    const valid = CompiledSuccessfulEvaluationSchema.Check(parsed);

                    if (valid)
                        resolve(
                            convertSuccessfulEvaluationToEvaluationResult(
                                parsed as SuccessfulEvaluationRS
                            )
                        );
                } catch (error) {
                    Logger.error("failed parsing evaluator response", error + "");
                }
            })
            .then(() => cloned.disconnect());
    });
};
