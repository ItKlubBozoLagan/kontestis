export type TimedRecord = {
    timeMillis: number
};

export const timeFunction = async <T>(f: () => Promise<T>): Promise<T & TimedRecord> => {
    const startTime = Date.now();
    const c: T = await f();
    const time = {
        timeMillis: Date.now() - startTime
    };
    return {...c, ...time};
}

