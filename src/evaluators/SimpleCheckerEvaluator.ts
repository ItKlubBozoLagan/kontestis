import {Testcase} from "../types/Testcase";
import {Buffer} from "buffer";
import {OutputRecord} from "../recorders/SimpleOutputRecorder";
import {timeFunction} from "../recorders/TimeRecorder";
import {MemoryRecord} from "../recorders/RecordOutputWithMemory";

export type EvaluationResult = {
    testCaseId: string
} & ({
    type: "success";
    verdict: "accepted" | "wrong_answer" | "time_limit_exceeded" | "memory_limit_exceeded";
    time: number
    memory: number
} | {
    type: "error";
    verdict: "runtime_error",
    exitCode: number
} | {
    type: "error";
    verdict: "compilation_error" | "evaluation_error"
} | {
    type: "custom";
    verdict: "custom",
    extraInfo: string,
    time: number
});

export type RunnerFunction = (testcaseInput: Buffer) => Promise<OutputRecord & MemoryRecord>;
export type CheckerFunction = (testcaseInput: Buffer, testcaseOutput: Buffer, runnerOutput: Buffer) => Promise<OutputRecord>;

export const evaluateSimpleChecker = async (runnerFunction: RunnerFunction, testcases: Testcase[], checkerFunction: CheckerFunction, timeLimit: number) => {

    const evaluated: EvaluationResult[] = [];

    for(const testcase of testcases) {
        const { timeMillis, value: result } = await timeFunction(async () => await runnerFunction(Buffer.from(testcase.in, 'utf-8')));

        if(!result.success) {
            evaluated.push({ type: "error", testCaseId: testcase.id, verdict: "runtime_error", exitCode: result.exitCode });
            continue;
        }

        if(timeMillis >= timeLimit) {
            evaluated.push({ type: "success", testCaseId: testcase.id, verdict: "time_limit_exceeded", time: timeMillis, memory: result.memory_usage_bytes });
            continue;
        }

        const checkerRecord = await checkerFunction(
            Buffer.from(testcase.in, 'utf-8'),
            Buffer.from(testcase.out, 'utf-8'),
            result.output
        );

        if(!checkerRecord.success) {
            evaluated.push({ type: "error", testCaseId: testcase.id, verdict: "evaluation_error" });
            continue;
        }

        const checkerResult = checkerRecord.output.toString('utf-8').trim().toLowerCase();

        if(checkerResult === "ac" || checkerResult == "accepted") {
            evaluated.push({ type: "success", testCaseId: testcase.id, verdict: "accepted", time: timeMillis, memory: result.memory_usage_bytes });
            continue;
        }


        if(checkerResult === "wa" || checkerResult == "wrong_answer") {
            evaluated.push({ type: "success", testCaseId: testcase.id, verdict: "wrong_answer", time: timeMillis, memory: result.memory_usage_bytes });
            continue;
        }

        evaluated.push({ type: "custom", testCaseId: testcase.id, verdict: "custom", extraInfo: checkerResult, time: timeMillis });
    }

    return evaluated;
}
