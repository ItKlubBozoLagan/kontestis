import { Buffer } from "node:buffer";

import { EvaluationResult } from "@kontestis/models";

import { MemoryRecord } from "../recorders/RecordOutputWithMemory";
import { OutputRecord } from "../recorders/SimpleOutputRecorder";
import { timeFunction } from "../recorders/TimeRecorder";
import { Testcase } from "../types/Testcase";

export type RunnerFunction = (testcaseInput: Buffer) => Promise<OutputRecord & MemoryRecord>;

export type CheckerFunction = (
    testcaseInput: Buffer,
    testcaseOutput: Buffer,
    runnerOutput: Buffer
) => Promise<OutputRecord>;

export const evaluateSimpleChecker = async (
    runnerFunction: RunnerFunction,
    testcases: Testcase[],
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

        const { timeMillis, value: result } = await timeFunction(
            async () => await runnerFunction(Buffer.from(testcase.in, "utf8"))
        );

        if (!result.success) {
            evaluated.push({
                type: "error",
                testCaseId: testcase.id,
                verdict: "runtime_error",
                exitCode: result.exitCode,
            });
            continue;
        }

        if (timeMillis >= timeLimit) {
            evaluated.push({
                type: "success",
                testCaseId: testcase.id,
                verdict: "time_limit_exceeded",
                time: timeMillis,
                memory: result.memory_usage_megabytes,
            });
            continue;
        }

        if (result.memory_usage_megabytes >= memoryLimit) {
            evaluated.push({
                type: "success",
                testCaseId: testcase.id,
                verdict: "memory_limit_exceeded",
                time: timeMillis,
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

        const checkerResult = checkerRecord.output.toString("utf8").trim().toLowerCase();

        if (checkerResult === "ac" || checkerResult == "accepted") {
            evaluated.push({
                type: "success",
                testCaseId: testcase.id,
                verdict: "accepted",
                time: timeMillis,
                memory: result.memory_usage_megabytes,
            });
            continueEvaluation = true;
            continue;
        }

        if (checkerResult === "wa" || checkerResult == "wrong_answer") {
            evaluated.push({
                type: "success",
                testCaseId: testcase.id,
                verdict: "wrong_answer",
                time: timeMillis,
                memory: result.memory_usage_megabytes,
            });
            continue;
        }

        if (checkerResult.startsWith("custom:")) {
            const checkerOutput = checkerResult.slice("custom".length);

            evaluated.push({
                type: "success",
                testCaseId: testcase.id,
                verdict: "custom",
                time: timeMillis,
                memory: result.memory_usage_megabytes,
                extra: checkerOutput,
            });

            return;
        }

        evaluated.push({
            type: "error",
            verdict: "system_error",
            testCaseId: testcase.id,
        });
    }

    return evaluated;
};
