import { Buffer } from "node:buffer";
import { randomBytes } from "node:crypto";

import { recordSimpleOutput } from "../recorders/SimpleOutputRecorder";
import { RunnableProcess } from "../runners/GenericRunner";

export const generateCheckerFunction = (runner: RunnableProcess) => {
    const separator = randomBytes(32).toString("hex");

    const separatorBuffer = Buffer.from("[" + separator + "]\n", "utf8");
    const newLineBuffer = Buffer.from("\n");

    return async (testcaseInput: Buffer, testcaseOutput: Buffer, runnerOutput: Buffer) => {
        const input = Buffer.concat([
            separatorBuffer,
            testcaseInput,
            newLineBuffer,

            separatorBuffer,
            testcaseOutput,
            newLineBuffer,

            separatorBuffer,
            runnerOutput,
            newLineBuffer,

            separatorBuffer,
        ]);

        return await recordSimpleOutput(await runner(), input);
    };
};
