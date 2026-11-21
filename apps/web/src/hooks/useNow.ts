import { useSyncExternalStore } from "react";

// one shared ticking clock for every countdown on the page
let now = Date.now();
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | undefined;

const subscribe = (listener: () => void) => {
    listeners.add(listener);

    if (!interval)
        interval = setInterval(() => {
            now = Date.now();
            listeners.forEach((it) => it());
        }, 1000);

    return () => {
        listeners.delete(listener);

        if (listeners.size === 0) {
            clearInterval(interval);
            interval = undefined;
        }
    };
};

/** Current time in milliseconds, re-rendering every second while mounted. */
export const useNow = () => useSyncExternalStore(subscribe, () => now);
