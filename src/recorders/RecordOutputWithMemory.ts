import {OutputRecord, OutputRecorderFunction} from "./SimpleOutputRecorder";
import {recordMemory} from "./MemoryRecorder";
import {ChildProcessWithoutNullStreams} from "child_process";


export type MemoryRecord = {
    memory_usage_bytes: number
};

export const recordOutputWithMemory: (process: ChildProcessWithoutNullStreams, input: Buffer, next: OutputRecorderFunction) => Promise<OutputRecord & MemoryRecord> = async (process, input, next) => {
    const record = recordMemory(process.pid!);
    const output = await next(process, input);
    const memory: MemoryRecord = {
        memory_usage_bytes: record()
    }
    return {
        ...output,
        ...memory
    };
}