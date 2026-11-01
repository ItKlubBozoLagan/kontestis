import type { Contest } from "@kontestis/models";

export type ContestPhase = "upcoming" | "running" | "finished";

type Timed = Pick<Contest, "start_time" | "duration_seconds">;

export const contestEnd = (contest: Timed) =>
    contest.start_time.getTime() + contest.duration_seconds * 1000;

export const contestPhase = (contest: Timed, now = Date.now()): ContestPhase => {
    if (now < contest.start_time.getTime()) return "upcoming";

    if (now > contestEnd(contest)) return "finished";

    return "running";
};

/** Running first, then upcoming (soonest first), then finished (newest first). */
export const compareContests = (a: Timed, b: Timed, now = Date.now()) => {
    const order: Record<ContestPhase, number> = { running: 0, upcoming: 1, finished: 2 };
    const phaseA = contestPhase(a, now);
    const phaseB = contestPhase(b, now);

    if (phaseA !== phaseB) return order[phaseA] - order[phaseB];

    if (phaseA === "upcoming") return a.start_time.getTime() - b.start_time.getTime();

    return b.start_time.getTime() - a.start_time.getTime();
};
