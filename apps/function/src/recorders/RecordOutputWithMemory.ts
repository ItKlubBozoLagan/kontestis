import { ChildProcessWithoutNullStreams } from "node:child_process";

import { recordMemory } from "./MemoryRecorder";
import { OutputRecord, OutputRecorderFunction } from "./SimpleOutputRecorder";

export type MemoryRecord = {
    memory_usage_megabytes: number;
};

export const recordOutputWithMemory: (
    process: ChildProcessWithoutNullStreams,
    input: Buffer,
    next: OutputRecorderFunction
) => Promise<OutputRecord & MemoryRecord> = async (process, input, next) => {
    const record = recordMemory(process.pid!);
    const output = await next(process, input);

    const memory: MemoryRecord = {
        memory_usage_megabytes: record(),
    };

    return {
        ...output,
        ...memory,
    };
};
