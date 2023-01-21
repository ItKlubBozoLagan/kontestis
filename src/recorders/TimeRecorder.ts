import { performance } from "node:perf_hooks";

export type TimedRecord<T> = {
    timeMillis: number;
    value: T;
};

export const timeFunction = async <T>(
    f: () => Promise<T>
): Promise<TimedRecord<T>> => {
    const startTime = performance.now();
    const c: T = await f();

    return {
        timeMillis: performance.now() - startTime,
        value: c,
    };
};
