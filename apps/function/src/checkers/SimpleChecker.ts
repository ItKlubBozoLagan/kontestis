import { Buffer } from "node:buffer";
import { randomInt } from "node:crypto";

import { CheckerFunction } from "../evaluators/SimpleCheckerEvaluator";
import { recordSimpleOutput } from "../recorders/SimpleOutputRecorder";
import { runBinary } from "../runners/BinaryRunner";
import { runPython } from "../runners/PythonRunner";

type CheckerFunctionGenerator = (checker: Buffer) => CheckerFunction;

export const getSimplePythonCheckerFunction: CheckerFunctionGenerator = (pythonChecker: Buffer) => {
    const separator = randomInt(1, 3000);
    const separatorBuffer = Buffer.from("\n[" + separator + "]\n", "utf8");

    return (testcaseInput: Buffer, testcaseOutput: Buffer, runnerOutput: Buffer) => {
        const input = Buffer.concat([
            separatorBuffer,
            testcaseInput,
            separatorBuffer,
            testcaseOutput,
            separatorBuffer,
            runnerOutput,
            separatorBuffer,
        ]);

        return recordSimpleOutput(runPython(pythonChecker), input);
    };
};

export const getSimpleCPPCheckerFunction: CheckerFunctionGenerator = (binaryChecker: Buffer) => {
    return async (testcaseInput: Buffer, testcaseOutput: Buffer, runnerOutput: Buffer) => {
        const input = Buffer.concat([
            testcaseInput,
            Buffer.from("\n"),
            testcaseOutput,
            Buffer.from("\n"),
            runnerOutput,
        ]);

        return recordSimpleOutput(await runBinary(binaryChecker), input);
    };
};
