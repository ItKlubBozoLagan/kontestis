import { Buffer } from "node:buffer";

import { EvaluationResult } from "@kontestis/models";

import { MemoryRecord } from "../recorders/RecordOutputWithMemory";
import { OutputRecord } from "../recorders/SimpleOutputRecorder";
import { TestcaseV1 } from "../types/TestcaseV1";

export type RunnerFunction = (testcaseInput: Buffer) => Promise<OutputRecord & MemoryRecord>;

export type CheckerFunction = (
    testcaseInput: Buffer,
    testcaseOutput: Buffer,
    runnerOutput: Buffer
) => Promise<OutputRecord>;

export const getEvaluationResultFromCheckerFunction = (
    checkerResult: string,
    testcase: TestcaseV1,
    result: OutputRecord & { success: true } & MemoryRecord
): EvaluationResult => {
    const lowerCaseResult = checkerResult.toLowerCase();

    if (lowerCaseResult === "ac" || lowerCaseResult === "accepted") {
        return {
            type: "success",
            testCaseId: testcase.id,
            verdict: "accepted",
            time: result.timeMills,
            memory: result.memory_usage_megabytes,
        };
    }

    if (lowerCaseResult === "wa" || lowerCaseResult === "wrong_answer") {
        return {
            type: "success",
            testCaseId: testcase.id,
            verdict: "wrong_answer",
            time: result.timeMills,
            memory: result.memory_usage_megabytes,
        };
    }

    if (lowerCaseResult.startsWith("custom:")) {
        const checkerOutput = checkerResult.slice("custom:".length);

        return {
            type: "success",
            testCaseId: testcase.id,
            verdict: "custom",
            time: result.timeMills,
            memory: result.memory_usage_megabytes,
            extra: checkerOutput,
        };
    }

    return {
        type: "error",
        verdict: "evaluation_error",
        testCaseId: testcase.id,
    };
};

export const evaluateChecker = async (
    runnerFunction: RunnerFunction,
    testcases: TestcaseV1[],
    checkerFunction: CheckerFunction,
    timeLimit: number,
    memoryLimit: number
    // eslint-disable-next-line sonarjs/cognitive-complexity
) => {
    const evaluated: EvaluationResult[] = [];

    let continueEvaluation = true;

    for (const testcase of testcases.sort((a, b) => Number(a.id) - Number(b.id))) {
        if (!continueEvaluation) {
            evaluated.push({
                testCaseId: testcase.id,
                type: "skipped",
                verdict: "skipped",
            });
            continue;
        }

        continueEvaluation = false;

        const result = await runnerFunction(Buffer.from(testcase.in, "utf8"));

        if (!result.success) {
            evaluated.push({
                type: "error",
                testCaseId: testcase.id,
                verdict: "runtime_error",
                exitCode: result.exitCode,
                error: result.stdErr.toString("utf8"),
            });
            continue;
        }

        if (result.timeMills >= timeLimit) {
            evaluated.push({
                type: "success",
                testCaseId: testcase.id,
                verdict: "time_limit_exceeded",
                time: result.timeMills,
                memory: result.memory_usage_megabytes,
            });
            continue;
        }

        if (result.memory_usage_megabytes >= memoryLimit) {
            evaluated.push({
                type: "success",
                testCaseId: testcase.id,
                verdict: "memory_limit_exceeded",
                time: result.timeMills,
                memory: result.memory_usage_megabytes,
            });
            continue;
        }

        const checkerRecord = await checkerFunction(
            Buffer.from(testcase.in, "utf8"),
            Buffer.from(testcase.out, "utf8"),
            result.output
        );

        if (!checkerRecord.success) {
            evaluated.push({
                type: "error",
                testCaseId: testcase.id,
                verdict: "evaluation_error",
            });
            continue;
        }

        const checkerResult = checkerRecord.output.toString("utf8").trim();

        const checkerEvaluationResult = getEvaluationResultFromCheckerFunction(
            checkerResult,
            testcase,
            result
        ) as EvaluationResult;

        if (
            checkerEvaluationResult.verdict === "accepted" ||
            checkerEvaluationResult.verdict === "custom"
        )
            continueEvaluation = true;

        evaluated.push(checkerEvaluationResult);
    }

    return evaluated;
};
