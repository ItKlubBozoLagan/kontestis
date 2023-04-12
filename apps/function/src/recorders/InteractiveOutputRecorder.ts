import { Buffer } from "node:buffer";
import { ChildProcessWithoutNullStreams } from "node:child_process";
import { randomBytes } from "node:crypto";
import { performance } from "node:perf_hooks";

import { recordMemory } from "./MemoryRecorder";
import { MemoryRecord } from "./RecordOutputWithMemory";
import { OutputRecord } from "./SimpleOutputRecorder";

export const recordInteractiveOutput = (
    process: ChildProcessWithoutNullStreams,
    checkerProcess: ChildProcessWithoutNullStreams,
    input: Buffer
) => {
    const separator = randomBytes(32).toString("hex");
    const separatorString = "\n[" + separator + "]\n";
    const separatorBuffer = Buffer.from(separatorString, "utf8");

    checkerProcess.stdin.on("error", () => {});
    checkerProcess.stdin.write(Buffer.concat([separatorBuffer, input, separatorBuffer]));

    const startTime = performance.now();

    const memoryRecordFunction = recordMemory(process.pid ?? 0);

    // eslint-disable-next-line sonarjs/cognitive-complexity
    return new Promise<OutputRecord & MemoryRecord>((resolve) => {
        const stdError: Buffer[] = [];
        const stdOut: Buffer[] = [];
        let closed = false;
        let processClosed = false;
        let redirectChecker = false;

        setTimeout(() => {
            if (closed) return;

            closed = true;
            process.kill();
            checkerProcess.kill();
            resolve({
                success: true,
                output: Buffer.concat(stdOut),
                timeMills: 6000,
                memory_usage_megabytes: memoryRecordFunction(),
            });
        }, 6000);

        process.stdout.on("data", (data) => {
            checkerProcess.stdin.write(data);
        });

        checkerProcess.stdout.on("data", (data) => {
            if (redirectChecker) {
                if (Buffer.isBuffer(data)) stdOut.push(data);

                if (typeof data === "string") stdOut.push(Buffer.from(data, "utf8"));

                return;
            }

            const stringData = data.toString().split("\n");

            if (stringData.some((s: string) => s.includes(separatorString.trim()))) {
                redirectChecker = true;

                for (let index = 0; index < stringData.length; ++index) {
                    if (!stringData[index].includes(separatorString.trim())) continue;

                    if (index !== 0) {
                        process.stdin.write(
                            Buffer.from(stringData.slice(0, index).join("\n"), "utf8")
                        );
                    }

                    if (index !== stringData.length + 1) {
                        stdOut.push(
                            Buffer.from(
                                stringData.slice(index + 1, stringData.length).join("\n"),
                                "utf8"
                            )
                        );
                    }

                    break;
                }

                return;
            }

            process.stdin.write(data);
        });

        checkerProcess.stderr.on("data", (data) => {
            if (Buffer.isBuffer(data)) stdError.push(data);

            if (typeof data === "string") stdError.push(Buffer.from(data, "utf8"));
        });

        checkerProcess.on("close", (code) => {
            if (closed) return;

            closed = true;

            if (!processClosed) process.kill();

            if (code && code !== 0)
                return resolve({
                    success: false,
                    exitCode: code,
                    stdErr: Buffer.concat(stdError),
                    memory_usage_megabytes: memoryRecordFunction(),
                });

            resolve({
                success: true,
                output: Buffer.concat(stdOut),
                timeMills: performance.now() - startTime,
                memory_usage_megabytes: memoryRecordFunction(),
            });
        });

        process.on("close", () => {
            processClosed = true;

            if (closed) return;

            checkerProcess.stdin.write(Buffer.concat([separatorBuffer, Buffer.from("END")]));
            checkerProcess.stdin.end();
        });
    });
};
