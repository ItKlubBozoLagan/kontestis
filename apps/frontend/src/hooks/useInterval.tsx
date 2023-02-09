import { useEffect } from "react";

export const useInterval = (intervalFunction: () => void, millis: number, doInitial?: boolean) => {
    useEffect(() => {
        if (doInitial) intervalFunction();

        const interval = setInterval(intervalFunction, millis);

        return () => clearInterval(interval);
    }, []);
};
