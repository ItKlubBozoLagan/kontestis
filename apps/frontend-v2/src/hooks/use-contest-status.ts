import { useCallback, useEffect, useState } from "react";

/**
 * Calculate contest status based on start time and duration
 */
export type ContestStatusType = "pending" | "running" | "finished";

export interface ContestStatusInfo {
    status: ContestStatusType;
    timeRemaining: number;
    timeFormat: string;
    percentComplete: number;
}

export function useContestStatus(
    startTime: Date | undefined,
    durationSeconds: number | undefined
): ContestStatusInfo {
    const [info, setInfo] = useState<ContestStatusInfo>({
        status: "pending",
        timeRemaining: 0,
        timeFormat: "",
        percentComplete: 0,
    });

    const calculate = useCallback(() => {
        if (!startTime || !durationSeconds) {
            return {
                status: "pending" as const,
                timeRemaining: 0,
                timeFormat: "",
                percentComplete: 0,
            };
        }

        const now = Date.now();
        const start = new Date(startTime).getTime();
        const end = start + durationSeconds * 1000;
        const duration = durationSeconds * 1000;

        if (now < start) {
            const remaining = start - now;

            return {
                status: "pending" as const,
                timeRemaining: remaining,
                timeFormat: formatTimeRemaining(remaining),
                percentComplete: 0,
            };
        }

        if (now < end) {
            const remaining = end - now;
            const elapsed = now - start;

            return {
                status: "running" as const,
                timeRemaining: remaining,
                timeFormat: formatTimeRemaining(remaining),
                percentComplete: Math.min(100, (elapsed / duration) * 100),
            };
        }

        return {
            status: "finished" as const,
            timeRemaining: 0,
            timeFormat: "Finished",
            percentComplete: 100,
        };
    }, [startTime, durationSeconds]);

    useEffect(() => {
        setInfo(calculate());

        const interval = setInterval(() => {
            setInfo(calculate());
        }, 1000);

        return () => clearInterval(interval);
    }, [calculate]);

    return info;
}

function formatTimeRemaining(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }

    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }

    return `${seconds}s`;
}
