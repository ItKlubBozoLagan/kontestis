import { ChildProcessWithoutNullStreams } from "node:child_process";

import { EvaluationResult } from "@kontestis/models";

import { recordInteractiveOutput } from "../recorders/InteractiveOutputRecorder";
import { TestcaseV1 } from "../types/TestcaseV1";
import { getEvaluationResultFromCheckerFunction } from "./SimpleCheckerEvaluator";

export const evaluateInteractive = async (
    processRunner: () => Promise<ChildProcessWithoutNullStreams>,
    checkerRunner: () => Promise<ChildProcessWithoutNullStreams>,
    testcases: TestcaseV1[],
    timeLimit: number,
    memoryLimit: number
) => {
    const evaluated: EvaluationResult[] = [];

    let continueEvaluation = true;

    for (const testcase of testcases.sort((a, b) => Number(BigInt(a.id) - BigInt(b.id)))) {
        if (!continueEvaluation) {
            evaluated.push({
                testCaseId: testcase.id,
                type: "skipped",
                verdict: "skipped",
            });
            continue;
        }

        continueEvaluation = false;

        const result = await recordInteractiveOutput(
            await processRunner(),
            await checkerRunner(),
            Buffer.from(testcase.in, "utf8")
        );

        if (!result.success) {
            evaluated.push({
                type: "error",
                testCaseId: testcase.id,
                verdict: "evaluation_error",
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

        const checkerResult = result.output.toString("utf8").trim().toLowerCase();

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
