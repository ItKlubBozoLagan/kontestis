import pidusage from "pidusage";

const recordMemoryPeriodically = (processId: number, saveFunction: (value: number) => void) => {
    const intervalId = setInterval(async () => {
        try {
            const { memory } = await pidusage(processId);

            saveFunction(memory / 1000 ** 2);
        } catch {
            /* empty */
        }
    }, 1);

    return () => clearInterval(intervalId);
};

export const recordMemory = (processId: number) => {
    let maxMemory = 0;

    const stop = recordMemoryPeriodically(processId, (v) => {
        maxMemory = Math.max(maxMemory, v);
    });

    return () => {
        stop();

        return maxMemory;
    };
};
