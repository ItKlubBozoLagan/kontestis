import pidusage from "pidusage";

const recordMemoryPeriodically = (saveFunction: (value: number) => void, closeCheckFunction: () => boolean, processId: number) => {
    setTimeout(async () => {
        if(closeCheckFunction()) return;
        try {
            const usage = await pidusage(processId);
            saveFunction(usage.memory / 10000000);
        } catch (e) {
        }
        recordMemoryPeriodically(saveFunction, closeCheckFunction, processId);
    }, 1);
}

export const recordMemory: (pid: number) => () => number = (processId: number) => {

    let maxMemory = 0;
    let completed = false;

    recordMemoryPeriodically((v) => {
        maxMemory = Math.max(maxMemory, v)
    }, () => completed, processId);

    return () => {
        completed = true;
        return maxMemory;
    }
}