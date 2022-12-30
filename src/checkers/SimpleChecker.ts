import {CheckerFunction} from "../evaluators/SimpleCheckerEvaluator";
import { Buffer } from "buffer";
import {randomBytes, randomInt} from "crypto";
import {recordSimpleOutput} from "../recorders/SimpleOutputRecorder";
import {runPython} from "../runners/PythonRunner";
import {runBinary} from "../runners/BinaryRunner";

type CheckerFunctionGenerator = (checker: Buffer) => CheckerFunction;


export const getSimplePythonCheckerFunction: CheckerFunctionGenerator = (pythonChecker: Buffer) => {
    const separator = randomInt(1, 3000);
    const separatorBuffer = Buffer.from("==" + separator + "==", 'utf-8');
    return (testcaseInput: Buffer, testcaseOutput: Buffer, runnerOutput: Buffer) => {
        const input = Buffer.concat([Buffer.from(separator + "\n", 'utf-8'), testcaseInput, separatorBuffer, testcaseOutput, separatorBuffer, runnerOutput]);
        return recordSimpleOutput(runPython(pythonChecker), input);
    };
}

export const getSimpleCPPCheckerFunction: CheckerFunctionGenerator = (binaryChecker: Buffer) => {
    return async (testcaseInput: Buffer, testcaseOutput: Buffer, runnerOutput: Buffer) => {
        const input = Buffer.concat([testcaseInput, Buffer.from("\n"), testcaseOutput, Buffer.from("\n"), runnerOutput]);
        return recordSimpleOutput(await runBinary(binaryChecker), input);
    };
}